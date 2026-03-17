import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import { spawnSync } from "node:child_process"

type CommandResult = {
  stdout: string
  stderr: string
}

type RepositoryRef = {
  host: string
  owner: string
  repo: string
}

type PullRequestResponse = {
  number?: number
  title?: string
  html_url?: string
}

type PullRequestReviewCommentResponse = {
  id?: number
  body?: string
  path?: string
  line?: number | null
  start_line?: number | null
  side?: string | null
  pull_request_review_id?: number | null
  in_reply_to_id?: number | null
  pull_request_url?: string
  html_url?: string
}

function runCommand(command: string, args: string[]): CommandResult {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
  })

  if (result.error) {
    throw result.error
  }

  const stdout = result.stdout?.trim() ?? ""
  const stderr = result.stderr?.trim() ?? ""

  if (result.status !== 0) {
    const details = stderr || stdout || `${command} exited with status ${result.status}`
    throw new Error(details)
  }

  return { stdout, stderr }
}

function runGit(args: string[]): CommandResult {
  return runCommand("git", args)
}

function runGh(args: string[]): CommandResult {
  return runCommand("gh", args)
}

function getGhAuthError(host: string): Error | null {
  try {
    runGh(["--version"])
  } catch {
    return new Error(
      "GitHub CLI is required for gh-pr-reply. Install `gh` and ensure it is available on PATH.",
    )
  }

  try {
    runGh(["auth", "status", "--hostname", host])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Error(
      `GitHub CLI authentication is required for gh-pr-reply on ${host}. Run \`gh auth status --hostname ${host}\` and authenticate before retrying. ${message}`,
    )
  }

  return null
}

function readRemoteUrl(remote: string): string {
  try {
    return runGit(["remote", "get-url", "--push", remote]).stdout
  } catch {
    return runGit(["remote", "get-url", remote]).stdout
  }
}

function readGitConfig(key: string): string {
  const result = spawnSync("git", ["config", "--get", key], {
    cwd: process.cwd(),
    encoding: "utf8",
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    return ""
  }

  return result.stdout?.trim() ?? ""
}

function listRemotes(): string[] {
  return runGit(["remote"]).stdout
    .split(/\r?\n/)
    .map((remote) => remote.trim())
    .filter(Boolean)
}

function determineRemote(): string {
  const currentBranch = runGit(["branch", "--show-current"]).stdout.trim()

  if (currentBranch) {
    const pushRemote = readGitConfig(`branch.${currentBranch}.pushRemote`)
    if (pushRemote) {
      return pushRemote
    }

    const branchRemote = readGitConfig(`branch.${currentBranch}.remote`)
    if (branchRemote) {
      return branchRemote
    }
  }

  const defaultPushRemote = readGitConfig("remote.pushDefault")
  if (defaultPushRemote) {
    return defaultPushRemote
  }

  const remotes = listRemotes()
  if (remotes.includes("origin")) {
    return "origin"
  }

  if (remotes.length === 1) {
    return remotes[0]
  }

  return ""
}

function parseRepositoryRef(remoteUrl: string): RepositoryRef {
  const normalizedUrl = remoteUrl.trim().replace(/\/+$/, "")
  const patterns = [
    /^(?:git@|ssh:\/\/git@)([^:/]+)[:/]([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^(?:https?|git):\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/,
  ]

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern)
    if (match) {
      const [, host, owner, repo] = match
      return { host, owner, repo }
    }
  }

  throw new Error("Could not resolve GitHub repository from the current git remote")
}

function resolveRepositoryFromCurrentRepo(): RepositoryRef {
  runGit(["rev-parse", "--show-toplevel"])

  const remote = determineRemote()
  if (!remote) {
    throw new Error(
      "Could not determine the Git remote for this repository. Provide a full PR URL or configure a normal git remote first.",
    )
  }
  return parseRepositoryRef(readRemoteUrl(remote))
}

function parsePullRequestInput(input: string): { repository: RepositoryRef; number: number } {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error("pullRequest is required")
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      repository: resolveRepositoryFromCurrentRepo(),
      number: Number.parseInt(trimmed, 10),
    }
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error(
      "pullRequest must be a GitHub pull request URL or a pull request number for the current repository.",
    )
  }

  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length < 4 || parts[2] !== "pull" || !/^\d+$/.test(parts[3] ?? "")) {
    throw new Error(
      "pullRequest URL must look like https://github.com/<owner>/<repo>/pull/<number>.",
    )
  }

  return {
    repository: {
      host: url.host,
      owner: parts[0],
      repo: parts[1],
    },
    number: Number.parseInt(parts[3], 10),
  }
}

function parseCommentId(input: string): number {
  const trimmed = input.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("commentId must be a numeric GitHub PR review comment id.")
  }

  return Number.parseInt(trimmed, 10)
}

function ghHostArgs(host: string): string[] {
  return host && host !== "github.com" ? ["--hostname", host] : []
}

function fetchJson<T>(repository: RepositoryRef, endpoint: string): T {
  const response = runGh([...ghHostArgs(repository.host), "api", endpoint]).stdout
  return JSON.parse(response) as T
}

function postJson<T>(repository: RepositoryRef, endpoint: string, fields: Record<string, string>): T {
  const args = [...ghHostArgs(repository.host), "api", "--method", "POST", endpoint]

  for (const [key, value] of Object.entries(fields)) {
    args.push("-f", `${key}=${value}`)
  }

  const response = runGh(args).stdout
  return JSON.parse(response) as T
}

function parsePullRequestApiUrl(input: string): { owner: string; repo: string; number: number } {
  if (!input.trim()) {
    throw new Error("GitHub did not return a pull_request_url for the target review comment.")
  }

  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error("GitHub returned an invalid pull_request_url for the target review comment.")
  }

  const parts = url.pathname.split("/").filter(Boolean)
  if (parts.length < 5 || parts[0] !== "repos" || parts[3] !== "pulls" || !/^\d+$/.test(parts[4] ?? "")) {
    throw new Error("GitHub returned an unexpected pull_request_url for the target review comment.")
  }

  return {
    owner: parts[1],
    repo: parts[2],
    number: Number.parseInt(parts[4], 10),
  }
}

export default tool({
  description: "Reply to a GitHub PR review comment thread",
  args: {
    pullRequest: tool.schema
      .string()
      .describe("GitHub pull request URL, or a pull request number for the current repository"),
    commentId: tool.schema.string().describe("Numeric GitHub pull request review comment id to reply to"),
    body: tool.schema.string().describe("Reply body to post to the review comment thread"),
  },
  async execute(
    { pullRequest, commentId, body }: { pullRequest: string; commentId: string; body: string },
    context: ToolContext,
  ) {
    const replyBody = body.trim()
    if (!replyBody) {
      throw new Error("body is required")
    }

    const { repository, number } = parsePullRequestInput(pullRequest)
    const authError = getGhAuthError(repository.host)
    if (authError) {
      throw authError
    }

    const parsedCommentId = parseCommentId(commentId)

    const pr = fetchJson<PullRequestResponse>(repository, `repos/${repository.owner}/${repository.repo}/pulls/${number}`)
    const targetComment = fetchJson<PullRequestReviewCommentResponse>(
      repository,
      `repos/${repository.owner}/${repository.repo}/pulls/comments/${parsedCommentId}`,
    )

    if ((targetComment.id ?? null) !== parsedCommentId) {
      throw new Error(`Could not verify PR review comment ${parsedCommentId}.`)
    }

    const commentPullRequest = parsePullRequestApiUrl(targetComment.pull_request_url ?? "")
    if (
      commentPullRequest.owner !== repository.owner ||
      commentPullRequest.repo !== repository.repo ||
      commentPullRequest.number !== number
    ) {
      throw new Error(
        `PR review comment ${parsedCommentId} does not belong to ${repository.owner}/${repository.repo}#${number}.`,
      )
    }

    const reply = postJson<PullRequestReviewCommentResponse>(
      repository,
      `repos/${repository.owner}/${repository.repo}/pulls/${number}/comments/${parsedCommentId}/replies`,
      { body: replyBody },
    )

    const resolvedNumber = pr.number ?? number
    const resolvedTitle = pr.title?.trim() ?? ""
    const prUrl =
      pr.html_url?.trim() ||
      `https://${repository.host}/${repository.owner}/${repository.repo}/pull/${resolvedNumber}`
    const replyUrl = reply.html_url?.trim() ?? ""

    context.metadata({
      title: `Reply to PR #${resolvedNumber} comment ${parsedCommentId}`,
      metadata: {
        host: repository.host,
        owner: repository.owner,
        repo: repository.repo,
        number: resolvedNumber,
        title: resolvedTitle,
        url: prUrl,
        commentId: parsedCommentId,
        replyId: reply.id ?? null,
        replyUrl,
        path: reply.path?.trim() || targetComment.path?.trim() || "",
        line: reply.line ?? targetComment.line ?? null,
        reviewId: reply.pull_request_review_id ?? targetComment.pull_request_review_id ?? null,
        replyToCommentId: reply.in_reply_to_id ?? parsedCommentId,
      },
    })

    return [
      `number: ${resolvedNumber}`,
      `title: ${resolvedTitle}`,
      `url: ${prUrl}`,
      `commentId: ${parsedCommentId}`,
      `replyId: ${reply.id ?? ""}`,
      `replyUrl: ${replyUrl}`,
      `path: ${reply.path?.trim() || targetComment.path?.trim() || ""}`,
      `line: ${reply.line ?? targetComment.line ?? ""}`,
    ].join("\n")
  },
})
