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
  description: "List Gantry tasks with optional filters",
  args: {
    role: tool.schema.string().optional().describe("Filter by role"),
    status: tool.schema.string().optional().describe("Filter by status"),
    tag: tool.schema.string().optional().describe("Filter by tag"),
    json: tool.schema
      .boolean()
      .optional()
      .describe("When true, include --json output flag"),
  },
  async execute({ role, status, tag, json }, context) {
    const args = ["task", "list"]

    if (role?.trim()) {
      args.push("--role", role.trim())
    }
    if (status?.trim()) {
      args.push("--status", status.trim())
    }
    if (tag?.trim()) {
      args.push("--tag", tag.trim())
    }
    if (json) {
      args.push("--json")
    }

    const out = runGantry(args)

    context.metadata({
      title: "gantry task list",
      metadata: {
        role: role?.trim() || "",
        status: status?.trim() || "",
        tag: tag?.trim() || "",
      },
    })

    return out.stdout || out.stderr || "no tasks"
  },
})
