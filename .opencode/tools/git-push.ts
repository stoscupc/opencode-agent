import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import { spawnSync } from "node:child_process"

type GitCommandResult = {
  stdout: string
  stderr: string
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

function runGit(args: string[]): GitCommandResult {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  })

  if (result.error) {
    throw result.error
  }

  const stdout = result.stdout?.trim() ?? ""
  const stderr = result.stderr?.trim() ?? ""

  if (result.status !== 0) {
    const details = stderr || stdout || `git exited with status ${result.status}`
    throw new Error(details)
  }

  return { stdout, stderr }
}

export default tool({
  description: "Push the current Git branch to its remote",
  args: {},
  async execute(_: Record<string, never>, context: ToolContext) {
    runGit(["rev-parse", "--show-toplevel"])
    const branch = runGit(["branch", "--show-current"])

    if (!branch.stdout) {
      throw new Error("Could not determine the current branch")
    }

    const remote =
      readGitConfig(`branch.${branch.stdout}.pushRemote`) ||
      readGitConfig("remote.pushDefault") ||
      readGitConfig(`branch.${branch.stdout}.remote`)

    if (!remote) {
      throw new Error("Could not determine which remote to push to")
    }

    const push = runGit(["push", remote])

    context.metadata({
      title: `git push ${remote}`,
      metadata: {
        repository: process.cwd(),
        branch: branch.stdout,
        remote,
      },
    })

    return [
      `branch: ${branch.stdout}`,
      `remote: ${remote}`,
      `repository: ${process.cwd()}`,
      `output: ${push.stdout || push.stderr || "pushed successfully"}`,
    ].join("\n")
  },
})
