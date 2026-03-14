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
  description:
    "Create a Gantry task for a workflow/workstream and role assignment",
  args: {
    title: tool.schema.string().describe("Task title"),
    workflowId: tool.schema.string().describe("Workflow ID"),
    workstream: tool.schema.string().describe("Workstream slug"),
    role: tool.schema
      .string()
      .optional()
      .describe("Target role, for example impl/test/review/ops"),
    priority: tool.schema.number().optional().describe("Task priority"),
    desc: tool.schema.string().optional().describe("Task description"),
    tags: tool.schema
      .string()
      .optional()
      .describe("Comma-separated tags, for example docs,workflow"),
  },
  async execute({ title, workflowId, workstream, role, priority, desc, tags }, context) {
    const taskTitle = title.trim()
    const wf = workflowId.trim()
    const ws = workstream.trim()

    if (!taskTitle) {
      throw new Error("title is required")
    }
    if (!wf) {
      throw new Error("workflowId is required")
    }
    if (!ws) {
      throw new Error("workstream is required")
    }

    const args = [
      "task",
      "create",
      taskTitle,
      "--workflow",
      wf,
      "--workstream",
      ws,
    ]

    if (role?.trim()) {
      args.push("--role", role.trim())
    }
    if (typeof priority === "number") {
      args.push("--priority", String(priority))
    }
    if (desc?.trim()) {
      args.push("--desc", desc.trim())
    }
    if (tags?.trim()) {
      args.push("--tags", tags.trim())
    }

    const out = runGantry(args)

    context.metadata({
      title: taskTitle,
      metadata: {
        workflow: wf,
        workstream: ws,
        role: role?.trim() || "unspecified",
        output: out.stdout || out.stderr || "created",
      },
    })

    return [
      `title: ${taskTitle}`,
      `workflow: ${wf}`,
      `workstream: ${ws}`,
      `role: ${role?.trim() || "unspecified"}`,
      `output: ${out.stdout || out.stderr || "created"}`,
    ].join("\n")
  },
})
