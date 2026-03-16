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
  body?: string
  url?: string
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
      "GitHub CLI is required for gh-pr-edit. Install `gh` and ensure it is available on PATH.",
    )
  }

  try {
    runGh(["auth", "status"])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `GitHub CLI authentication is required for gh-pr-edit. Run \`gh auth status\` and authenticate before retrying. ${message}`,
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

function formatRepository(repository: RepositoryRef): string {
  return repository.host === "github.com"
    ? `${repository.owner}/${repository.repo}`
    : `${repository.host}/${repository.owner}/${repository.repo}`
}

function fetchPullRequest(repository: RepositoryRef, number: number): PullRequestResponse {
  const response = runGh([
    "pr",
    "view",
    String(number),
    "--repo",
    formatRepository(repository),
    "--json",
    "number,title,body,url",
  ]).stdout

  return JSON.parse(response) as PullRequestResponse
}

export default tool({
  description: "Edit an existing GitHub pull request title and/or body",
  args: {
    pullRequest: tool.schema
      .string()
      .describe("GitHub pull request URL, or a pull request number for the current repository"),
    title: tool.schema.string().optional().describe("Updated pull request title"),
    body: tool.schema.string().optional().describe("Updated pull request body"),
  },
  async execute(
    { pullRequest, title, body }: { pullRequest: string; title?: string; body?: string },
    context: ToolContext,
  ) {
    ensureGhAuth()

    const nextTitle = title?.trim() ?? ""
    const nextBody = body?.trim() ?? ""

    if (!nextTitle && !nextBody) {
      throw new Error("At least one of title or body is required.")
    }

    const { repository, number } = parsePullRequestInput(pullRequest)
    const repo = formatRepository(repository)
    const args = ["pr", "edit", String(number), "--repo", repo]

    if (nextTitle) {
      args.push("--title", nextTitle)
    }

    if (nextBody) {
      args.push("--body", nextBody)
    }

    runGh(args)

    const pr = fetchPullRequest(repository, number)
    const resolvedNumber = pr.number ?? number
    const resolvedTitle = pr.title?.trim() ?? ""
    const resolvedBody = pr.body?.trim() ?? ""
    const resolvedUrl =
      pr.url?.trim() ||
      `https://${repository.host}/${repository.owner}/${repository.repo}/pull/${resolvedNumber}`

    context.metadata({
      title: resolvedTitle || `PR #${resolvedNumber}`,
      metadata: {
        host: repository.host,
        owner: repository.owner,
        repo: repository.repo,
        number: resolvedNumber,
        title: resolvedTitle,
        url: resolvedUrl,
      },
    })

    return [
      `number: ${resolvedNumber}`,
      `title: ${resolvedTitle}`,
      `url: ${resolvedUrl}`,
      `body: ${resolvedBody}`,
    ].join("\n")
  },
})
