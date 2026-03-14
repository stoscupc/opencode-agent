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
  description: "Claim a Gantry task by task ID",
  args: {
    taskId: tool.schema.string().describe("Task ID to claim"),
  },
  async execute({ taskId }, context) {
    const id = taskId.trim()
    if (!id) {
      throw new Error("taskId is required")
    }

    const out = runGantry(["task", "claim", id])

    context.metadata({
      title: id,
      metadata: {
        action: "claim",
        output: out.stdout || out.stderr || "claimed",
      },
    })

    return [
      `task_id: ${id}`,
      `action: claim`,
      `output: ${out.stdout || out.stderr || "claimed"}`,
    ].join("\n")
  },
})
