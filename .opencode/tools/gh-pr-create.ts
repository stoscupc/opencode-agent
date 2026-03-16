import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import { spawnSync } from "node:child_process"

type CommandResult = {
  stdout: string
  stderr: string
}

type PullRequestSummary = {
  number?: number
  title?: string
  url?: string
  isDraft?: boolean
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

function hasLocalBranch(branch: string): boolean {
  const result = spawnSync("git", ["rev-parse", "--verify", `refs/heads/${branch}`], {
    cwd: process.cwd(),
    encoding: "utf8",
  })

  if (result.error) {
    throw result.error
  }

  return result.status === 0
}

function listRemotes(): string[] {
  return runGit(["remote"]).stdout
    .split(/\r?\n/)
    .map((remote) => remote.trim())
    .filter(Boolean)
}

function ensureGhAuth(): void {
  try {
    runGh(["--version"])
  } catch {
    throw new Error(
      "GitHub CLI is required for gh-pr-create. Install `gh` and ensure it is available on PATH.",
    )
  }

  try {
    runGh(["auth", "status"])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `GitHub CLI authentication is required for gh-pr-create. Run \`gh auth status\` and authenticate before retrying. ${message}`,
    )
  }
}

function determineRemote(branches: string[]): string {
  for (const branch of branches) {
    const pushRemote = readGitConfig(`branch.${branch}.pushRemote`)
    if (pushRemote) {
      return pushRemote
    }

    const branchRemote = readGitConfig(`branch.${branch}.remote`)
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

function resolveGithubRepo(remote: string): string {
  const remoteUrl = readRemoteUrl(remote).trim().replace(/\/+$/, "")
  const patterns = [
    /^(?:git@|ssh:\/\/git@)([^:/]+)[:/]([^/]+)\/([^/]+?)(?:\.git)?$/,
    /^(?:https?|git):\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/,
  ]

  for (const pattern of patterns) {
    const match = remoteUrl.match(pattern)
    if (match) {
      const [, host, owner, repo] = match
      return `${host}/${owner}/${repo}`
    }
  }

  throw new Error(`Could not resolve GitHub repository from remote URL for '${remote}'`)
}

function detectBaseBranch(remote: string): string {
  const result = spawnSync("git", ["symbolic-ref", `refs/remotes/${remote}/HEAD`], {
    cwd: process.cwd(),
    encoding: "utf8",
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    return "main"
  }

  const ref = result.stdout?.trim() ?? ""
  return ref.split("/").pop()?.trim() || "main"
}

function resolveBranchName(currentBranch: string): string {
  if (currentBranch !== "main") {
    return currentBranch
  }

  const shortHead = runGit(["rev-parse", "--short", "HEAD"]).stdout
  if (!shortHead) {
    throw new Error("Could not determine HEAD commit for branch creation")
  }

  return `opencode/pr-${shortHead}`
}

function ensureBranchCheckedOut(branch: string): void {
  if (hasLocalBranch(branch)) {
    runGit(["checkout", branch])
    return
  }

  runGit(["checkout", "-b", branch])
}

function listCommitSubjects(baseRef: string): string[] {
  try {
    const range = runGit(["log", "--format=%s", `${baseRef}..HEAD`]).stdout
    return range
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function currentHeadSubject(): string {
  return runGit(["log", "-1", "--format=%s"]).stdout.trim()
}

function buildTitle(branch: string, commits: string[]): string {
  const preferredTitle = commits[0] || currentHeadSubject()
  if (preferredTitle) {
    return preferredTitle
  }

  return `Open draft PR for ${branch}`
}

function buildBody(baseBranch: string, branch: string, commits: string[]): string {
  const summaryLines = commits.slice(0, 3)
  const summary =
    summaryLines.length > 0
      ? summaryLines.map((line) => `- ${line}`).join("\n")
      : "- Autogenerated from the current branch state"

  return [
    "## Summary",
    summary,
    "",
    "## Testing",
    "- Not run (autogenerated by gh-pr-create)",
    "",
    "## Branches",
    `- Base: ${baseBranch}`,
    `- Head: ${branch}`,
  ].join("\n")
}

function parsePullRequests(json: string): PullRequestSummary[] {
  if (!json.trim()) {
    return []
  }

  const parsed = JSON.parse(json) as PullRequestSummary[]
  return Array.isArray(parsed) ? parsed : []
}

function findOpenPullRequest(repository: string, branch: string): PullRequestSummary | null {
  const result = runGh([
    "pr",
    "list",
    "--repo",
    repository,
    "--head",
    branch,
    "--state",
    "open",
    "--json",
    "number,title,url,isDraft",
  ])
  const pulls = parsePullRequests(result.stdout)
  return pulls[0] ?? null
}

function extractUrl(output: string): string {
  const match = output.match(/https?:\/\/\S+/)
  return match?.[0] ?? ""
}

export default tool({
  description: "Create or return a draft GitHub pull request for the current branch",
  args: {},
  async execute(_: Record<string, never>, context: ToolContext) {
    runGit(["rev-parse", "--show-toplevel"])
    ensureGhAuth()

    const startingBranch = runGit(["branch", "--show-current"]).stdout
    if (!startingBranch) {
      throw new Error("Could not determine the current branch")
    }

    const branch = resolveBranchName(startingBranch)
    if (branch !== startingBranch) {
      ensureBranchCheckedOut(branch)
    }

    const remote = determineRemote([branch, startingBranch])
    if (!remote) {
      throw new Error(
        "Could not determine which remote to push to. Ensure normal git push auth is configured for this repository.",
      )
    }

    const githubRepository = resolveGithubRepo(remote)

    runGit(["push", "-u", remote, branch])

    const existingPullRequest = findOpenPullRequest(githubRepository, branch)
    if (existingPullRequest) {
      context.metadata({
        title: existingPullRequest.title || `Draft PR for ${branch}`,
        metadata: {
          repository: process.cwd(),
          githubRepository,
          branch,
          remote,
          number: existingPullRequest.number,
          url: existingPullRequest.url,
          existing: true,
          draft: existingPullRequest.isDraft ?? true,
        },
      })

      return [
        `branch: ${branch}`,
        `remote: ${remote}`,
        `repo: ${githubRepository}`,
        `number: ${existingPullRequest.number ?? ""}`,
        `title: ${existingPullRequest.title ?? ""}`,
        `url: ${existingPullRequest.url ?? ""}`,
        `draft: ${existingPullRequest.isDraft ?? true}`,
        "existing: true",
      ].join("\n")
    }

    const baseBranch = detectBaseBranch(remote)
    const commits = listCommitSubjects(`refs/remotes/${remote}/${baseBranch}`)
    const title = buildTitle(branch, commits)
    const body = buildBody(baseBranch, branch, commits)
    const create = runGh([
      "pr",
      "create",
      "--repo",
      githubRepository,
      "--draft",
      "--head",
      branch,
      "--title",
      title,
      "--body",
      body,
    ])
    const url = extractUrl(create.stdout || create.stderr)

    context.metadata({
      title,
      metadata: {
        repository: process.cwd(),
        githubRepository,
        branch,
        remote,
        baseBranch,
        url,
        existing: false,
        draft: true,
      },
    })

    return [
      `branch: ${branch}`,
      `remote: ${remote}`,
      `repo: ${githubRepository}`,
      `base: ${baseBranch}`,
      `title: ${title}`,
      `url: ${url}`,
      "draft: true",
      "existing: false",
    ].join("\n")
  },
})
