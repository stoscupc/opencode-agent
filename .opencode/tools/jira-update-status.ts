import { tool, type ToolContext } from "@opencode-ai/plugin/tool"
import {
  loadGlobalJiraEnv,
  normalizeBaseUrl,
  requiredEnv,
  toToolText,
} from "./jira-helpers"

type JiraTransition = {
  id?: string
  name?: string
  to?: {
    name?: string
  }
}

type JiraTransitionsResponse = {
  transitions?: JiraTransition[]
}

function trimOrDefault(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return trimmed || fallback
}

function lowerCase(value: string): string {
  return value.trim().toLowerCase()
}

export default tool({
  description: "Update a Jira issue status via transitions",
  args: {
    issueKey: tool.schema.string().describe("Jira issue key, for example PROJ-123"),
    statusName: tool.schema
      .string()
      .optional()
      .describe("Desired Jira status name, defaults to In Progress"),
  },
  async execute(
    { issueKey, statusName }: { issueKey: string; statusName?: string },
    context: ToolContext,
  ) {
    const fallbackEnv = loadGlobalJiraEnv()
    const baseUrl = normalizeBaseUrl(requiredEnv("JIRA_BASE_URL", fallbackEnv))
    const email = requiredEnv("JIRA_EMAIL", fallbackEnv)
    const apiToken = requiredEnv("JIRA_API_TOKEN", fallbackEnv)
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    const trimmedIssueKey = issueKey.trim()
    const requestedStatus = trimOrDefault(statusName, "In Progress")

    if (!trimmedIssueKey) {
      throw new Error("issueKey is required")
    }

    const transitionsResponse = await fetch(
      `${baseUrl}/rest/api/3/issue/${encodeURIComponent(trimmedIssueKey)}/transitions`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
      },
    )

    if (!transitionsResponse.ok) {
      const body = (await transitionsResponse.text()).trim()
      const details = body ? `: ${body.slice(0, 500)}` : ""
      throw new Error(
        `Jira request failed (${transitionsResponse.status} ${transitionsResponse.statusText})${details}`,
      )
    }

    const transitionsPayload =
      (await transitionsResponse.json()) as JiraTransitionsResponse
    const transitions = transitionsPayload.transitions ?? []
    const matchedTransition = transitions.find(
      (transition) =>
        lowerCase(toToolText(transition.to?.name)) === lowerCase(requestedStatus),
    )

    if (!matchedTransition?.id) {
      const availableStatuses = transitions
        .map((transition) => toToolText(transition.to?.name))
        .filter(Boolean)
      const availableList = availableStatuses.length
        ? availableStatuses.join(", ")
        : "No transitions available"
      throw new Error(
        `No Jira transition found for issue ${trimmedIssueKey} matching status \"${requestedStatus}\". Available target statuses: ${availableList}`,
      )
    }

    const appliedTransition = toToolText(matchedTransition.name) || matchedTransition.id
    const resultingStatus = toToolText(matchedTransition.to?.name) || requestedStatus

    const updateResponse = await fetch(
      `${baseUrl}/rest/api/3/issue/${encodeURIComponent(trimmedIssueKey)}/transitions`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transition: {
            id: matchedTransition.id,
          },
        }),
      },
    )

    if (!updateResponse.ok) {
      const body = (await updateResponse.text()).trim()
      const details = body ? `: ${body.slice(0, 500)}` : ""
      throw new Error(
        `Jira request failed (${updateResponse.status} ${updateResponse.statusText})${details}`,
      )
    }

    const key = trimmedIssueKey
    const url = `${baseUrl}/browse/${encodeURIComponent(key)}`

    context.metadata({
      title: key,
      metadata: {
        key,
        requestedStatus,
        appliedTransition,
        resultingStatus,
        url,
      },
    })

    return [
      `key: ${key}`,
      `requestedStatus: ${requestedStatus}`,
      `appliedTransition: ${appliedTransition}`,
      `resultingStatus: ${resultingStatus}`,
      `url: ${url}`,
    ].join("\n")
  },
})
