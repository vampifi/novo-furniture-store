import { JWT } from "google-auth-library"
import { google } from "googleapis"
import { GoogleSheetsClient } from "./client"
import type { GoogleSheetsServiceAccountConfig } from "./config"

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"

/**
 * Builds a `GoogleSheetsClient` authenticated as the given service account.
 *
 * Read+write scope (not `.readonly`) because the Sync Engine writes `Sync Status`/`Last Synced At`
 * back into the sheet (see `docs/specs/product-catalog-sync-architecture.md` §9).
 *
 * Builds an explicit `JWT` auth client rather than passing raw `credentials` to `GoogleAuth` —
 * the latter is deprecated in `google-auth-library@11` precisely because it accepts an
 * unvalidated credential blob; `JWT` is the typed, supported equivalent for service-account auth
 * with an email + private key already resolved by `loadServiceAccountConfigFromEnv`.
 */
export function createGoogleSheetsClient(config: GoogleSheetsServiceAccountConfig): GoogleSheetsClient {
  const auth = new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: [SHEETS_SCOPE],
  })

  const sheets = google.sheets({ version: "v4", auth })

  return new GoogleSheetsClient(sheets.spreadsheets.values, config.spreadsheetId)
}
