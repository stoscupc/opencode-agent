import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, parse } from "node:path"

type JiraCreateIssueResponse = {
  key?: string
  fields?: {
    summary?: string
    issuetype?: {
      name?: string
    }
  }
}

type EnvValues = Record<string, string>

function parseDotEnv(contents: string): EnvValues {
  const values: EnvValues = {}

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue
    }

    const match = trimmedLine.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
    )
    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    let value = rawValue.trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }

  return values
}

function loadNearestDotEnv(startDir: string): EnvValues {
  let currentDir = startDir
  const { root } = parse(startDir)

  while (true) {
    const envPath = join(currentDir, ".env")
    if (existsSync(envPath)) {
      return parseDotEnv(readFileSync(envPath, "utf8"))
    }

    if (currentDir === root) {
      return {}
    }

    currentDir = dirname(currentDir)
  }
}

function requiredEnv(name: string, fallbackEnv: EnvValues): string {
  if (Object.hasOwn(process.env, name)) {
    const value = process.env[name]?.trim()
    if (!value) {
      throw new Error(
        `Invalid Jira environment variable: ${name}. It is set in process.env but empty. Provide a non-empty value.`,
      )
    }

    return value
  }

  const value = fallbackEnv[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing required Jira environment variable: ${name}. Set it in process.env or in a .env file in the current working directory or one of its ancestors.`,
    )
  }

  return value
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "")
}

function toToolText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toAdfDescription(description: string) {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: description,
          },
        ],
      },
    ],
  }
}

export default tool({
  description: "Create a Jira issue",
  args: {
    projectKey: tool.schema.string().describe("Jira project key, for example PROJ"),
    summary: tool.schema.string().describe("Jira issue summary"),
    description: tool.schema.string().describe("Jira issue description"),
    issueType: tool.schema.string().optional().describe("Jira issue type name, defaults to Task"),
    epicIssueKey: tool.schema
      .string()
      .optional()
      .describe("Optional Jira epic issue key, for example PROJ-123"),
    labels: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Optional Jira issue labels"),
  },
  async execute(
    {
      projectKey,
      summary,
      description,
      issueType,
      epicIssueKey,
      labels,
    }: {
      projectKey: string
      summary: string
      description: string
      issueType?: string
      epicIssueKey?: string
      labels?: string[]
    },
    context: ToolContext,
  ) {
    const fallbackEnv = loadNearestDotEnv(process.cwd())
    const baseUrl = normalizeBaseUrl(requiredEnv("JIRA_BASE_URL", fallbackEnv))
    const email = requiredEnv("JIRA_EMAIL", fallbackEnv)
    const apiToken = requiredEnv("JIRA_API_TOKEN", fallbackEnv)
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    const trimmedProjectKey = projectKey.trim()
    const trimmedSummary = summary.trim()
    const trimmedDescription = description.trim()
    const trimmedIssueType = issueType?.trim() || "Task"
    const trimmedEpicIssueKey = epicIssueKey?.trim() || ""
    const trimmedLabels = (labels ?? []).map((label) => label.trim()).filter(Boolean)

    if (!trimmedProjectKey) {
      throw new Error("projectKey is required")
    }

    if (!trimmedSummary) {
      throw new Error("summary is required")
    }

    if (!trimmedDescription) {
      throw new Error("description is required")
    }

    const payload: {
      fields: {
        project: { key: string }
        summary: string
        description: ReturnType<typeof toAdfDescription>
        issuetype: { name: string }
        parent?: { key: string }
        labels?: string[]
      }
    } = {
      fields: {
        project: { key: trimmedProjectKey },
        summary: trimmedSummary,
        description: toAdfDescription(trimmedDescription),
        issuetype: { name: trimmedIssueType },
      },
    }

    if (trimmedLabels.length > 0) {
      payload.fields.labels = trimmedLabels
    }

    if (trimmedEpicIssueKey) {
      payload.fields.parent = { key: trimmedEpicIssueKey }
    }

    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = (await response.text()).trim()
      const details = body ? `: ${body.slice(0, 500)}` : ""
      const epicDetails = trimmedEpicIssueKey
        ? ` Parent epic supplied: ${trimmedEpicIssueKey}.`
        : ""
      throw new Error(
        `Jira request failed (${response.status} ${response.statusText}).${epicDetails}${details}`,
      )
    }

    const issue = (await response.json()) as JiraCreateIssueResponse
    const key = toToolText(issue.key)

    if (!key) {
      throw new Error("Jira create response did not include an issue key")
    }

    const resolvedSummary = toToolText(issue.fields?.summary) || trimmedSummary
    const resolvedIssueType = toToolText(issue.fields?.issuetype?.name) || trimmedIssueType
    const url = `${baseUrl}/browse/${encodeURIComponent(key)}`

    context.metadata({
      title: key,
      metadata: {
        key,
        summary: resolvedSummary,
        url,
        issueType: resolvedIssueType,
      },
    })

    return [`key: ${key}`, `summary: ${resolvedSummary}`, `url: ${url}`].join("\n")
  },
})
