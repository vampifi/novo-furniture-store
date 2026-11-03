/**
 * Manual verification tooling for the product-catalog-sync spec (docs/specs/
 * product-catalog-sync-architecture.md) - NOT production code, no ticket owns this. Runs one
 * real Sync Engine cycle (sync-cycle-trigger.ts) against a sandbox Google Sheet and a real local
 * Medusa instance, using the test-only fixture adapter as a "sheet is already canonical"
 * passthrough (the manual-entry scenario) rather than a real Supplier Adapter. Used to validate
 * the full canonical schema (#6), the ADR-0006 fix (existingRows sourced from the Sheet, merged-
 * row idempotency hash), custom attributes, and variant options end-to-end against a real
 * database - see #21's resolution comment for what this proved.
 *
 * Run via `npx medusa exec ./src/scripts/verify-full-schema-cycle.ts` after
 * setup-full-schema-sheet.ts has populated the sandbox sheet. Never point GOOGLE_SHEETS_* env
 * vars at a production sheet when running this.
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { loadServiceAccountConfigFromEnv, createGoogleSheetsClient } from "../lib/google-sheets"
import { triggerSyncCycle } from "../product-catalog-sync/sync-cycle-trigger"
import { createApplyCanonicalProductRunner } from "../product-catalog-sync/workflows/run-apply-canonical-product-workflow"
import { isIncompletePlaceholderSku } from "../product-catalog-sync/row-reconciliation"
import { isNonEmptyString, isPositiveNumber } from "../product-catalog-sync/validation"
import type { SupplierTabDefinition } from "../product-catalog-sync/sync-cycle"
import type { ExistingSheetRow } from "../product-catalog-sync/row-reconciliation"
import type { AdapterRowResult, CanonicalProduct, RawRow, SupplierAdapter } from "../product-catalog-sync/types"

const TAB_NAME = "Sheet1"
const RANGE = `${TAB_NAME}!A2:AO200` // header is row 1

// Full canonical schema, one physical column per field - one slot each for the repeatable
// variantOptions/customAttributes/images groups, to keep this test sheet a manageable width
// while still exercising every field *kind* (paired, single-column adapter-owned,
// business-owned, array-as-list).
const COLUMNS = [
  "productHandle", "sku", "supplierSku",
  "supplierTitle", "productTitle", "supplierSubtitle", "subtitle", "supplierDescription", "description",
  "supplierCost", "retailPrice",
  "supplierOption1Name", "supplierOption1Value", "option1Name", "option1Value",
  "imageUrl", "variantImageUrl",
  "weight", "length", "width", "height", "hsCode", "originCountry", "midCode", "upc", "ean",
  "attribute1Key", "attribute1CategoryId", "supplierAttribute1Value", "attribute1Value", "attribute1Visible",
  "status", "productTags", "productCategories", "collectionId", "typeId", "shippingProfileId", "salesChannel", "discountable",
] as const

export const HEADER_ROW = [
  "Product Handle", "SKU", "Supplier SKU",
  "Supplier Title", "Product Title", "Supplier Subtitle", "Subtitle", "Supplier Description", "Description",
  "Supplier Cost", "Retail Price",
  "Supplier Option 1 Name", "Supplier Option 1 Value", "Option 1 Name", "Option 1 Value",
  "Image URL", "Variant Image URL",
  "Weight", "Length", "Width", "Height", "HS Code", "Origin Country", "MID Code", "UPC", "EAN",
  "Attribute 1 Key", "Attribute 1 Category Id", "Supplier Attribute 1 Value", "Attribute 1 Value", "Attribute 1 Visible",
  "Status", "Product Tags", "Product Categories", "Collection Id", "Type Id", "Shipping Profile Id", "Sales Channel", "Discountable",
  "Sync Status", "Last Synced At",
]

function rowToRawRow(row: (string | number | boolean | null)[]): RawRow {
  const raw: RawRow = {}
  COLUMNS.forEach((key, i) => {
    const value = row[i]
    raw[key] = value === undefined || value === "" ? null : (value as string | number)
  })
  return raw
}

function str(v: RawRow[string]): string | null {
  return isNonEmptyString(v) ? v : null
}
function num(v: RawRow[string]): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : null
  return n !== null && isPositiveNumber(n) ? n : null
}
function list(v: RawRow[string]): string[] {
  return isNonEmptyString(v) ? v.split(",").map((s) => s.trim()).filter(Boolean) : []
}
function bool(v: RawRow[string]): boolean {
  return String(v).trim().toUpperCase() === "TRUE"
}

/**
 * Shared row -> CanonicalProduct mapping, used both as the adapter's own logic AND to
 * reconstruct `existingRows.product` from the Sheet's current state (ADR 0006: existingRows must
 * reflect the Sheet, not Medusa) - both need the identical mapping, since in this "sheet is
 * already canonical" test there's only one real source of truth (the Sheet itself).
 */
function rowToCanonicalProductOrError(row: RawRow, anchor: string): AdapterRowResult {
  const supplierSku = str(row.supplierSku)

  const productTitle = str(row.productTitle) ?? str(row.supplierTitle)
  if (!productTitle) {
    return { ok: false, anchor, error: "Product Title is required" }
  }
  const retailPrice = num(row.retailPrice) ?? num(row.supplierCost)
  if (retailPrice === null) {
    return { ok: false, anchor, error: "Retail Price must be a positive number" }
  }

  const sku = str(row.sku) ?? (supplierSku ? `man_${supplierSku}` : "man_")
  const productHandle = str(row.productHandle) ?? productTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const product: CanonicalProduct = {
      productHandle,
      sku,
      supplierSku,
      supplierTitle: str(row.supplierTitle) ?? productTitle,
      productTitle,
      supplierSubtitle: str(row.supplierSubtitle),
      subtitle: str(row.subtitle) ?? str(row.supplierSubtitle),
      supplierDescription: str(row.supplierDescription),
      description: str(row.description) ?? str(row.supplierDescription),
      supplierCost: num(row.supplierCost),
      retailPrice,
      variantOptions:
        str(row.option1Name) || str(row.supplierOption1Name)
          ? [
              {
                supplierOptionName: str(row.supplierOption1Name) ?? "",
                supplierOptionValue: str(row.supplierOption1Value) ?? "",
                optionName: str(row.option1Name) ?? str(row.supplierOption1Name) ?? "",
                optionValue: str(row.option1Value) ?? str(row.supplierOption1Value) ?? "",
              },
            ]
          : [],
      imageUrls: str(row.imageUrl) ? [str(row.imageUrl) as string] : [],
      variantImageUrls: str(row.variantImageUrl) ? [str(row.variantImageUrl) as string] : [],
      weight: num(row.weight),
      length: num(row.length),
      width: num(row.width),
      height: num(row.height),
      hsCode: str(row.hsCode),
      originCountry: str(row.originCountry),
      midCode: str(row.midCode),
      upc: str(row.upc),
      ean: str(row.ean),
      customAttributes:
        str(row.attribute1Key)
          ? [
              {
                attributeKey: str(row.attribute1Key) ?? "",
                attributeCategoryId: str(row.attribute1CategoryId) ?? "",
                supplierAttributeValue: str(row.supplierAttribute1Value) ?? "",
                attributeValue: str(row.attribute1Value) ?? str(row.supplierAttribute1Value) ?? "",
                attributeVisible: row.attribute1Visible === null ? true : bool(row.attribute1Visible),
              },
            ]
          : [],
      status: (str(row.status)?.toLowerCase() as CanonicalProduct["status"]) ?? "draft",
      productTags: list(row.productTags),
      productCategories: list(row.productCategories),
      collectionId: str(row.collectionId),
      typeId: str(row.typeId),
      shippingProfileId: str(row.shippingProfileId),
      salesChannel: str(row.salesChannel),
      discountable: row.discountable === null ? true : bool(row.discountable),
    }

  return { ok: true, product }
}

/**
 * "Sheet is already canonical" passthrough adapter - the manual-entry scenario discussed with
 * the client. No transformation happens beyond type-casting and the two plausibility checks
 * every adapter must do (spec §6): Product Title and Retail Price are required.
 */
const passthroughAdapter: SupplierAdapter = async (rows) => {
  return rows.map((row, batchPosition) =>
    rowToCanonicalProductOrError(row, str(row.supplierSku) ?? `batch position #${batchPosition}`)
  )
}

function productToRow(product: CanonicalProduct, syncStatus: string, lastSyncedAt: string): (string | number | boolean)[] {
  const opt = product.variantOptions[0]
  const attr = product.customAttributes[0]
  return [
    product.productHandle,
    product.sku,
    product.supplierSku ?? "",
    product.supplierTitle,
    product.productTitle,
    product.supplierSubtitle ?? "",
    product.subtitle ?? "",
    product.supplierDescription ?? "",
    product.description ?? "",
    product.supplierCost ?? "",
    product.retailPrice,
    opt?.supplierOptionName ?? "",
    opt?.supplierOptionValue ?? "",
    opt?.optionName ?? "",
    opt?.optionValue ?? "",
    product.imageUrls[0] ?? "",
    product.variantImageUrls[0] ?? "",
    product.weight ?? "",
    product.length ?? "",
    product.width ?? "",
    product.height ?? "",
    product.hsCode ?? "",
    product.originCountry ?? "",
    product.midCode ?? "",
    product.upc ?? "",
    product.ean ?? "",
    attr?.attributeKey ?? "",
    attr?.attributeCategoryId ?? "",
    attr?.supplierAttributeValue ?? "",
    attr?.attributeValue ?? "",
    attr ? String(attr.attributeVisible).toUpperCase() : "",
    product.status,
    product.productTags.join(", "),
    product.productCategories.join(", "),
    product.collectionId ?? "",
    product.typeId ?? "",
    product.shippingProfileId ?? "",
    product.salesChannel ?? "",
    String(product.discountable).toUpperCase(),
    syncStatus,
    lastSyncedAt,
  ]
}

export default async function verifyFullSchemaCycle({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const sheets = createGoogleSheetsClient(loadServiceAccountConfigFromEnv())

  const testTab: SupplierTabDefinition = {
    name: TAB_NAME,
    adapter: passthroughAdapter,
    context: { uploadImage: async (ref) => ref },
    io: {
      async readCurrentRows() {
        const [range] = await sheets.batchRead([RANGE])
        const dataRows = (range?.values ?? []).filter((row) => row.length > 0 && row.some((cell) => cell !== ""))
        const rawRows = dataRows.map(rowToRawRow)

        // ADR 0006: existingRows.product must reflect the Sheet's CURRENT state (so a business
        // edit is visible to reconciliation), not Medusa's last-known state - only the hash
        // itself comes from Medusa's metadata (keyed by SKU), since that's where it's persisted.
        // Reusing rowToCanonicalProductOrError here is what makes this correct: it's the exact
        // same mapping the Adapter will apply moments later to these same rawRows.
        const skus = rawRows.map((r) => str(r.sku)).filter((s): s is string => s !== null && !isIncompletePlaceholderSku(s))
        const hashBySku = new Map<string, string>()
        if (skus.length > 0) {
          const { data: variants } = await query.graph({
            entity: "product_variant",
            fields: ["sku", "metadata"],
            filters: { sku: skus },
          })
          for (const variant of variants) {
            const meta = (variant.metadata ?? {}) as Record<string, unknown>
            if (typeof meta.sync_hash === "string") {
              hashBySku.set(variant.sku as string, meta.sync_hash)
            }
          }
        }

        const existingRows: ExistingSheetRow[] = []
        for (const raw of rawRows) {
          const sku = str(raw.sku)
          const storedHash = sku ? hashBySku.get(sku) : undefined
          if (!storedHash) continue // no prior sync recorded for this SKU - treat as new
          const result = rowToCanonicalProductOrError(raw, sku ?? "")
          if (result.ok) {
            existingRows.push({ product: result.product, adapterFieldsHash: storedHash })
          }
        }

        return { existingRows, rawRows }
      },
      async writeBack(outcome) {
        const rows: (string | number | boolean)[][] = []
        for (const blocked of outcome.blockedRows) {
          if (blocked.product) {
            rows.push(productToRow(blocked.product, blocked.status, ""))
          }
        }
        for (const synced of outcome.syncedRows) {
          rows.push(productToRow(synced.product, synced.writeBack.status, synced.writeBack.lastSyncedAt.toISOString()))
        }
        if (rows.length > 0) {
          // Keyed by SKU so each row lands back on roughly the same line it came from - good
          // enough for this smoke test, not a real diffing write-back.
          await sheets.batchWrite(rows.map((row, i) => ({ range: `${TAB_NAME}!A${i + 2}:AO${i + 2}`, values: [row] })))
        }
        logger.info(`Wrote back ${rows.length} row(s). blockedRows=${outcome.blockedRows.length} syncedRows=${outcome.syncedRows.length}`)
      },
    },
  }

  const lock = { async acquire() { return true }, async release() {} }
  const results = await triggerSyncCycle(
    { tabs: "all" },
    { supplierTabs: [testTab], lock, applyCanonicalProduct: createApplyCanonicalProductRunner(container) }
  )
  logger.info(`Cycle results: ${JSON.stringify(results, null, 2)}`)
}
