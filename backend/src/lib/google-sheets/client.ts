import type { sheets_v4 } from "googleapis"
import type { SheetRangeResult, SheetRangeValues, SheetsValuesApi } from "./types"

/**
 * Typed batched read/write access to a single Google Sheet's `values` resource.
 *
 * Deliberately narrow: this client knows nothing about Supplier Tabs, canonical schema columns,
 * or sync status — that's the Sync Engine's job (see `docs/specs/product-catalog-sync-architecture.md`
 * §7-9). This class's only responsibility is "every read is one `batchGet`, every write is one
 * `batchUpdate`", regardless of how many ranges/cells are involved.
 */
export class GoogleSheetsClient {
  constructor(
    private readonly valuesApi: SheetsValuesApi,
    private readonly spreadsheetId: string
  ) {}

  /**
   * Reads every given range in a single `batchGet` call.
   *
   * Ranges are typically whole Supplier Tabs (e.g. `"SupplierA!A2:Z"`), one per tab, but this
   * method has no opinion on that — it batches whatever ranges it's given.
   */
  async batchRead(ranges: string[]): Promise<SheetRangeResult[]> {
    if (ranges.length === 0) {
      return []
    }

    const { data } = await this.valuesApi.batchGet({
      spreadsheetId: this.spreadsheetId,
      ranges,
      majorDimension: "ROWS",
      valueRenderOption: "UNFORMATTED_VALUE",
    })

    return (data.valueRanges ?? []).map((valueRange) => ({
      range: valueRange.range ?? "",
      values: (valueRange.values ?? []) as SheetRangeResult["values"],
    }))
  }

  /**
   * Writes every given range's values in a single `batchUpdate` call.
   *
   * Typically status/error write-backs for one or more Supplier Tabs, but again this method has
   * no opinion on that — it batches whatever range/value pairs it's given.
   */
  async batchWrite(updates: SheetRangeValues[]): Promise<sheets_v4.Schema$BatchUpdateValuesResponse> {
    if (updates.length === 0) {
      return { spreadsheetId: this.spreadsheetId, totalUpdatedCells: 0, responses: [] }
    }

    const { data } = await this.valuesApi.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: updates.map(({ range, values }) => ({ range, values, majorDimension: "ROWS" })),
      },
    })

    return data
  }
}
