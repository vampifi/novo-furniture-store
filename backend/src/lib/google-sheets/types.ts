import type { sheets_v4 } from "googleapis"

/**
 * The subset of the Sheets API's `spreadsheets.values` surface this client depends on.
 *
 * Narrowed (rather than depending on the full `sheets_v4.Sheets["spreadsheets"]["values"]`
 * resource) so tests can supply a plain object mock instead of constructing a real googleapis
 * client — see `__tests__/client.test.ts`.
 */
export type SheetsValuesApi = Pick<sheets_v4.Sheets["spreadsheets"]["values"], "batchGet" | "batchUpdate">

/** A single cell value, as accepted/returned by the Sheets API. */
export type CellValue = string | number | boolean | null

/** One tab range's worth of rows, as read back from a batched read. */
export interface SheetRangeResult {
  range: string
  values: CellValue[][]
}

/** One tab range's worth of rows to write back in a batched write. */
export interface SheetRangeValues {
  range: string
  values: CellValue[][]
}
