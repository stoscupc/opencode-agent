import { tool } from "@opencode-ai/plugin"
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { dirname, join, parse } from "node:path"

type CmdResult = {
  stdout: string
  stderr: string
}

function findGantryBin(startDir: string): string {
  const fromEnv = process.env.GANTRY_BIN?.trim()
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv
  }

  let current = startDir
  const root = parse(startDir).root
  while (true) {
    const candidate = join(current, "gantry", "bin", "gantry")
    if (existsSync(candidate)) {
      return candidate
    }
    if (current === root) {
      break
    }
    current = dirname(current)
  }

  return "gantry"
}

function runGantry(args: string[]): CmdResult {
  const bin = findGantryBin(process.cwd())
  const result = spawnSync(bin, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  const stdout = result.stdout?.trim() ?? ""
  const stderr = result.stderr?.trim() ?? ""

  if (result.status !== 0) {
    const details = stderr || stdout || `gantry exited with status ${result.status}`
    throw new Error(details)
  }

  return { stdout, stderr }
}

export default tool({
  description: "Complete a Gantry task by task ID with optional summary/commit/files",
  args: {
    taskId: tool.schema.string().describe("Task ID to complete"),
    summary: tool.schema.string().optional().describe("Optional completion summary"),
    commit: tool.schema.string().optional().describe("Optional commit SHA"),
    files: tool.schema
      .string()
      .optional()
      .describe("Optional comma-separated files list"),
  },
  async execute({ taskId, summary, commit, files }, context) {
    const id = taskId.trim()
    if (!id) {
      throw new Error("taskId is required")
    }

    const args = ["task", "complete", id]
    if (summary?.trim()) {
      args.push(summary.trim())
    }
    if (commit?.trim()) {
      args.push("--commit", commit.trim())
    }
    if (files?.trim()) {
      args.push("--files", files.trim())
    }

    const out = runGantry(args)

    context.metadata({
      title: id,
      metadata: {
        action: "complete",
        output: out.stdout || out.stderr || "completed",
      },
    })

    return [
      `task_id: ${id}`,
      `action: complete`,
      `summary: ${summary?.trim() || ""}`,
      `output: ${out.stdout || out.stderr || "completed"}`,
    ].join("\n")
  },
})
