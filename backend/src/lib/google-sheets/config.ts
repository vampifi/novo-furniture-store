/** Service-account credentials needed to authenticate against a Google Sheet. */
export interface GoogleSheetsServiceAccountConfig {
  clientEmail: string
  privateKey: string
  spreadsheetId: string
}

const REQUIRED_ENV_VARS = ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_SHEETS_SPREADSHEET_ID"] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

/**
 * Loads the service-account config from environment variables, failing fast with a single
 * descriptive error naming every missing variable.
 *
 * Deployed containers (this repo's on Railway) store the private key as a single-line env var
 * with literal `\n` escape sequences rather than real newlines — those are unescaped here so
 * callers always get a real multi-line PEM string.
 */
export function loadServiceAccountConfigFromEnv(
  env: Record<string, string | undefined> = process.env
): GoogleSheetsServiceAccountConfig {
  const missing = REQUIRED_ENV_VARS.filter((name) => !env[name])

  if (missing.length > 0) {
    throw new Error(`Missing required Google Sheets service-account env vars: ${missing.join(", ")}`)
  }

  return {
    clientEmail: env.GOOGLE_SHEETS_CLIENT_EMAIL as string,
    privateKey: (env.GOOGLE_SHEETS_PRIVATE_KEY as string).replace(/\\n/g, "\n"),
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID as string,
  }
}
