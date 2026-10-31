import { GoogleSheetsClient } from "../client"
import { createGoogleSheetsClient } from "../factory"

describe("createGoogleSheetsClient", () => {
  it("wires a service-account config into a usable GoogleSheetsClient without making network calls", () => {
    const client = createGoogleSheetsClient({
      clientEmail: "sync-bot@sandbox-project.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nFAKEKEYDATA\n-----END PRIVATE KEY-----\n",
      spreadsheetId: "sheet_123",
    })

    expect(client).toBeInstanceOf(GoogleSheetsClient)
  })
})
