import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

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

const GLOBAL_JIRA_ENV_PATH = join(homedir(), ".config", "opencode", "jira.env")

export function loadGlobalJiraEnv(): EnvValues {
  if (!existsSync(GLOBAL_JIRA_ENV_PATH)) {
    return {}
  }

  return parseDotEnv(readFileSync(GLOBAL_JIRA_ENV_PATH, "utf8"))
}

export function requiredEnv(name: string, fallbackEnv: EnvValues): string {
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
      `Missing required Jira environment variable: ${name}. Set it in process.env or run 'make setup' to persist Jira credentials to ${GLOBAL_JIRA_ENV_PATH}.`,
    )
  }

  return value
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "")
}

export function toToolText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
