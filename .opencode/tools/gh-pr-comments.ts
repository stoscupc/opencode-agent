import { tool } from "@opencode-ai/plugin"
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

type GithubUser = {
  login?: string
}

type IssueCommentResponse = {
  id?: number
  body?: string
  html_url?: string
  created_at?: string
  updated_at?: string
  user?: GithubUser | null
}

type PullRequestReviewResponse = {
  id?: number
  body?: string
  state?: string
  html_url?: string
  submitted_at?: string
  user?: GithubUser | null
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
  html_url?: string
  created_at?: string
  updated_at?: string
  user?: GithubUser | null
}

type CommentItem = {
  id: number | null
  type: "review_comment" | "review" | "conversation_comment"
  author: string
  body: string
  createdAt: string
  updatedAt?: string
  url: string
  state?: string
  path?: string
  line?: number | null
  startLine?: number | null
  side?: string | null
  reviewId?: number | null
  replyToCommentId?: number | null
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

function ensureGhAuth(): void {
  try {
    runGh(["--version"])
  } catch {
    throw new Error(
      "GitHub CLI is required for gh-pr-comments. Install `gh` and ensure it is available on PATH.",
    )
  }

  try {
    runGh(["auth", "status"])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `GitHub CLI authentication is required for gh-pr-comments. Run \`gh auth status\` and authenticate before retrying. ${message}`,
    )
  }
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

function ghHostArgs(host: string): string[] {
  return host && host !== "github.com" ? ["--hostname", host] : []
}

function fetchPaginatedArray<T>(repository: RepositoryRef, endpoint: string): T[] {
  const response = runGh([
    ...ghHostArgs(repository.host),
    "api",
    "--paginate",
    "--slurp",
    endpoint,
  ]).stdout

  if (!response.trim()) {
    return []
  }

  const pages = JSON.parse(response) as unknown[]
  if (!Array.isArray(pages)) {
    return []
  }

  return pages.flatMap((page) => (Array.isArray(page) ? (page as T[]) : []))
}

function fetchJson<T>(repository: RepositoryRef, endpoint: string): T {
  const response = runGh([...ghHostArgs(repository.host), "api", endpoint]).stdout
  return JSON.parse(response) as T
}

function sortByCreatedAt(items: CommentItem[]): CommentItem[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || "")
    const rightTime = Date.parse(right.createdAt || "")

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0
    }

    if (Number.isNaN(leftTime)) {
      return 1
    }

    if (Number.isNaN(rightTime)) {
      return -1
    }

    return leftTime - rightTime
  })
}

export default tool({
  description: "Fetch all review, code, and conversation comments for a GitHub pull request",
  args: {
    pullRequest: tool.schema
      .string()
      .describe("GitHub pull request URL, or a pull request number for the current repository"),
  },
  async execute({ pullRequest }, context) {
    ensureGhAuth()

    const { repository, number } = parsePullRequestInput(pullRequest)
    const pr = fetchJson<PullRequestResponse>(repository, `repos/${repository.owner}/${repository.repo}/pulls/${number}`)

    const reviewComments = fetchPaginatedArray<PullRequestReviewCommentResponse>(
      repository,
      `repos/${repository.owner}/${repository.repo}/pulls/${number}/comments`,
    )
    const reviews = fetchPaginatedArray<PullRequestReviewResponse>(
      repository,
      `repos/${repository.owner}/${repository.repo}/pulls/${number}/reviews`,
    )
    const conversationComments = fetchPaginatedArray<IssueCommentResponse>(
      repository,
      `repos/${repository.owner}/${repository.repo}/issues/${number}/comments`,
    )

    const items = sortByCreatedAt([
      ...reviewComments.map<CommentItem>((comment) => ({
        id: comment.id ?? null,
        type: "review_comment",
        author: comment.user?.login?.trim() || "unknown",
        body: comment.body ?? "",
        createdAt: comment.created_at?.trim() ?? "",
        updatedAt: comment.updated_at?.trim() || undefined,
        url: comment.html_url?.trim() ?? "",
        path: comment.path?.trim() || undefined,
        line: comment.line ?? null,
        startLine: comment.start_line ?? null,
        side: comment.side?.trim() || undefined,
        reviewId: comment.pull_request_review_id ?? null,
        replyToCommentId: comment.in_reply_to_id ?? null,
      })),
      ...reviews.map<CommentItem>((review) => ({
        id: review.id ?? null,
        type: "review",
        author: review.user?.login?.trim() || "unknown",
        body: review.body ?? "",
        createdAt: review.submitted_at?.trim() ?? "",
        url: review.html_url?.trim() ?? "",
        state: review.state?.trim() || undefined,
      })),
      ...conversationComments.map<CommentItem>((comment) => ({
        id: comment.id ?? null,
        type: "conversation_comment",
        author: comment.user?.login?.trim() || "unknown",
        body: comment.body ?? "",
        createdAt: comment.created_at?.trim() ?? "",
        updatedAt: comment.updated_at?.trim() || undefined,
        url: comment.html_url?.trim() ?? "",
      })),
    ])

    const payload = {
      pullRequest: {
        host: repository.host,
        owner: repository.owner,
        repo: repository.repo,
        number: pr.number ?? number,
        title: pr.title?.trim() ?? "",
        url: pr.html_url?.trim() || `https://${repository.host}/${repository.owner}/${repository.repo}/pull/${number}`,
      },
      counts: {
        total: items.length,
        reviewComments: reviewComments.length,
        reviews: reviews.length,
        conversationComments: conversationComments.length,
      },
      items,
    }

    context.metadata({
      title: `PR #${payload.pullRequest.number} comments`,
      metadata: {
        host: repository.host,
        owner: repository.owner,
        repo: repository.repo,
        number: payload.pullRequest.number,
        title: payload.pullRequest.title,
        url: payload.pullRequest.url,
        totalComments: payload.counts.total,
      },
    })

    return JSON.stringify(payload, null, 2)
  },
})
