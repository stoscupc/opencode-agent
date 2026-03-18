import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import {
  loadGlobalJiraEnv,
  normalizeBaseUrl,
  requiredEnv,
  toToolText,
} from "./jira-helpers"

type JiraIssueResponse = {
  key?: string
  fields?: {
    summary?: string
    status?: {
      name?: string
    }
    assignee?: {
      displayName?: string
    } | null
    description?: unknown
  }
}

type TextNode = {
  type?: unknown
  text?: unknown
  content?: unknown
}

function extractDescription(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ").slice(0, 280)
  }

  if (!value || typeof value !== "object") {
    return ""
  }

  const texts: string[] = []

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (!node || typeof node !== "object") {
      return
    }

    const record = node as TextNode
    if (typeof record.text === "string" && record.text.trim()) {
      texts.push(record.text.trim())
    }

    if (record.type === "hardBreak") {
      texts.push("\n")
    }

    walk(record.content)
  }

  walk(value)

  return texts
    .join(" ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, 280)
}

export default tool({
  description: "Fetch a Jira issue by key",
  args: {
    issueKey: tool.schema.string().describe("Jira issue key, for example PROJ-123"),
  },
  async execute({ issueKey }: { issueKey: string }, context: ToolContext) {
    const fallbackEnv = loadGlobalJiraEnv()
    const baseUrl = normalizeBaseUrl(requiredEnv("JIRA_BASE_URL", fallbackEnv))
    const email = requiredEnv("JIRA_EMAIL", fallbackEnv)
    const apiToken = requiredEnv("JIRA_API_TOKEN", fallbackEnv)
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")
    const trimmedIssueKey = issueKey.trim()

    if (!trimmedIssueKey) {
      throw new Error("issueKey is required")
    }

    const response = await fetch(
      `${baseUrl}/rest/api/3/issue/${encodeURIComponent(trimmedIssueKey)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
      },
    )

    if (!response.ok) {
      const body = (await response.text()).trim()
      const details = body ? `: ${body.slice(0, 500)}` : ""
      throw new Error(
        `Jira request failed (${response.status} ${response.statusText})${details}`,
      )
    }

    const issue = (await response.json()) as JiraIssueResponse
    const summary = toToolText(issue.fields?.summary)
    const status = toToolText(issue.fields?.status?.name)
    const assignee = toToolText(issue.fields?.assignee?.displayName) || "Unassigned"
    const description = extractDescription(issue.fields?.description)
    const key = toToolText(issue.key) || trimmedIssueKey
    const url = `${baseUrl}/browse/${encodeURIComponent(key)}`

    context.metadata({
      title: key,
      metadata: {
        key,
        summary,
        status,
        assignee,
        url,
      },
    })

    return [
      `key: ${key}`,
      `summary: ${summary}`,
      `status: ${status}`,
      `assignee: ${assignee}`,
      `url: ${url}`,
      `description: ${description}`,
    ].join("\n")
  },
})
