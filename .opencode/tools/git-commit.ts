import { tool } from "@opencode-ai/plugin"
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
  description: "Create a Git commit with a required message",
  args: {
    message: tool.schema.string().describe("Commit message passed to git commit -m"),
  },
  async execute({ message }, context) {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      throw new Error("message is required")
    }

    runGit(["rev-parse", "--show-toplevel"])
    const commit = runGit(["commit", "-m", trimmedMessage])
    const head = runGit(["rev-parse", "HEAD"])

    context.metadata({
      title: trimmedMessage,
      metadata: {
        repository: process.cwd(),
        commit: head.stdout,
        message: trimmedMessage,
      },
    })

    return [
      `message: ${trimmedMessage}`,
      `commit: ${head.stdout}`,
      `repository: ${process.cwd()}`,
      `output: ${commit.stdout || commit.stderr || "created commit"}`,
    ].join("\n")
  },
})
