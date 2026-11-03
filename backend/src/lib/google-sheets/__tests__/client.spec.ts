import { GoogleSheetsClient } from "../client"
import type { SheetsValuesApi } from "../types"

const SPREADSHEET_ID = "sheet_123"

const buildValuesApi = (overrides: Partial<SheetsValuesApi> = {}): SheetsValuesApi => ({
  batchGet: jest.fn(),
  batchUpdate: jest.fn(),
  ...overrides,
})

describe("GoogleSheetsClient.batchRead", () => {
  it("reads multiple Supplier Tab ranges using exactly one batchGet call", async () => {
    const batchGet = jest.fn().mockResolvedValue({
      data: {
        spreadsheetId: SPREADSHEET_ID,
        valueRanges: [
          { range: "SupplierA!A2:Z", values: [["sku-1", "Widget"]] },
          { range: "SupplierB!A2:Z", values: [["sku-2", "Gadget"]] },
        ],
      },
    })
    const valuesApi = buildValuesApi({ batchGet })
    const client = new GoogleSheetsClient(valuesApi, SPREADSHEET_ID)

    const result = await client.batchRead(["SupplierA!A2:Z", "SupplierB!A2:Z"])

    expect(batchGet).toHaveBeenCalledTimes(1)
    expect(batchGet).toHaveBeenCalledWith({
      spreadsheetId: SPREADSHEET_ID,
      ranges: ["SupplierA!A2:Z", "SupplierB!A2:Z"],
      majorDimension: "ROWS",
      valueRenderOption: "UNFORMATTED_VALUE",
    })
    expect(result).toEqual([
      { range: "SupplierA!A2:Z", values: [["sku-1", "Widget"]] },
      { range: "SupplierB!A2:Z", values: [["sku-2", "Gadget"]] },
    ])
  })

  it("returns an empty result without calling the Sheets API when given no ranges", async () => {
    const batchGet = jest.fn()
    const valuesApi = buildValuesApi({ batchGet })
    const client = new GoogleSheetsClient(valuesApi, SPREADSHEET_ID)

    const result = await client.batchRead([])

    expect(batchGet).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it("normalizes a tab with no data into an empty-values range rather than omitting it", async () => {
    const batchGet = jest.fn().mockResolvedValue({
      data: {
        spreadsheetId: SPREADSHEET_ID,
        valueRanges: [{ range: "SupplierC!A2:Z" }],
      },
    })
    const valuesApi = buildValuesApi({ batchGet })
    const client = new GoogleSheetsClient(valuesApi, SPREADSHEET_ID)

    const result = await client.batchRead(["SupplierC!A2:Z"])

    expect(result).toEqual([{ range: "SupplierC!A2:Z", values: [] }])
  })
})

describe("GoogleSheetsClient.batchWrite", () => {
  it("writes multiple Supplier Tab status ranges using exactly one batchUpdate call", async () => {
    const batchUpdate = jest.fn().mockResolvedValue({
      data: {
        spreadsheetId: SPREADSHEET_ID,
        totalUpdatedCells: 3,
        totalUpdatedRows: 3,
        totalUpdatedColumns: 1,
        totalUpdatedSheets: 2,
        responses: [
          { spreadsheetId: SPREADSHEET_ID, updatedRange: "SupplierA!H2:H3" },
          { spreadsheetId: SPREADSHEET_ID, updatedRange: "SupplierB!H2:H2" },
        ],
      },
    })
    const valuesApi = buildValuesApi({ batchUpdate })
    const client = new GoogleSheetsClient(valuesApi, SPREADSHEET_ID)

    const result = await client.batchWrite([
      { range: "SupplierA!H2:H3", values: [["Synced"], ["Needs SKU"]] },
      { range: "SupplierB!H2:H2", values: [["Synced"]] },
    ])

    expect(batchUpdate).toHaveBeenCalledTimes(1)
    expect(batchUpdate).toHaveBeenCalledWith({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: [
          { range: "SupplierA!H2:H3", values: [["Synced"], ["Needs SKU"]], majorDimension: "ROWS" },
          { range: "SupplierB!H2:H2", values: [["Synced"]], majorDimension: "ROWS" },
        ],
      },
    })
    expect(result).toEqual({
      spreadsheetId: SPREADSHEET_ID,
      totalUpdatedCells: 3,
      totalUpdatedRows: 3,
      totalUpdatedColumns: 1,
      totalUpdatedSheets: 2,
      responses: [
        { spreadsheetId: SPREADSHEET_ID, updatedRange: "SupplierA!H2:H3" },
        { spreadsheetId: SPREADSHEET_ID, updatedRange: "SupplierB!H2:H2" },
      ],
    })
  })

  it("returns a zero-cell result without calling the Sheets API when given no updates", async () => {
    const batchUpdate = jest.fn()
    const valuesApi = buildValuesApi({ batchUpdate })
    const client = new GoogleSheetsClient(valuesApi, SPREADSHEET_ID)

    const result = await client.batchWrite([])

    expect(batchUpdate).not.toHaveBeenCalled()
    expect(result).toEqual({ spreadsheetId: SPREADSHEET_ID, totalUpdatedCells: 0, responses: [] })
  })
})
