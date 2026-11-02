import { loadServiceAccountConfigFromEnv } from "../config"

const VALID_ENV = {
  GOOGLE_SHEETS_CLIENT_EMAIL: "sync-bot@sandbox-project.iam.gserviceaccount.com",
  GOOGLE_SHEETS_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nFAKEKEYDATA\\n-----END PRIVATE KEY-----\\n",
  GOOGLE_SHEETS_SPREADSHEET_ID: "sheet_123",
}

describe("loadServiceAccountConfigFromEnv", () => {
  it("builds a config from the service-account env vars, unescaping the private key's newlines", () => {
    const config = loadServiceAccountConfigFromEnv(VALID_ENV)

    expect(config).toEqual({
      clientEmail: "sync-bot@sandbox-project.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nFAKEKEYDATA\n-----END PRIVATE KEY-----\n",
      spreadsheetId: "sheet_123",
    })
  })

  it("fails fast, naming every missing variable, when one or more required env vars are absent", () => {
    expect(() =>
      loadServiceAccountConfigFromEnv({
        GOOGLE_SHEETS_CLIENT_EMAIL: VALID_ENV.GOOGLE_SHEETS_CLIENT_EMAIL,
      })
    ).toThrow(
      "Missing required Google Sheets service-account env vars: GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID"
    )
  })
})
