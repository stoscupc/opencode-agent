import { existsSync, readFileSync } from "node:fs"
import { dirname, join, parse } from "node:path"

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

export function loadNearestDotEnv(startDir: string): EnvValues {
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
      `Missing required Jira environment variable: ${name}. Set it in process.env or in a .env file in the current working directory or one of its ancestors.`,
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
