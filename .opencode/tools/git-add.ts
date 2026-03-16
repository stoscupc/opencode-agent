import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import { spawnSync } from "node:child_process"

type GitCommandResult = {
  stdout: string
  stderr: string
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
  description: "Stage Git changes from the current directory downward",
  args: {},
  async execute(_: Record<string, never>, context: ToolContext) {
    runGit(["rev-parse", "--show-toplevel"])
    runGit(["add", "."])
    const status = runGit(["status", "--short"])

    context.metadata({
      title: "git add .",
      metadata: {
        repository: process.cwd(),
        staged: true,
        status: status.stdout || "clean",
      },
    })

    return [
      "command: git add .",
      `repository: ${process.cwd()}`,
      `status: ${status.stdout || "clean"}`,
    ].join("\n")
  },
})
