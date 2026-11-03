import { buildSyncedWriteBack, resolveSyncStatusForCycle } from "../sync-status"
import type { AdapterRowResult, CanonicalProduct } from "../types"
import { checkProductLevelFieldConsistency } from "../product-level-consistency"
import type { ProductLevelConsistencyCheckResult } from "../product-level-consistency"
import { hashAdapterOwnedFields, reconcileSupplierTabRows } from "../row-reconciliation"
import type { ExistingSheetRow } from "../row-reconciliation"

/**
 * Minimal CanonicalProduct factory - mirrors row-reconciliation.spec.ts's and
 * product-level-consistency.spec.ts's makeProduct so every test only overrides what it cares about.
 */
function makeProduct(overrides: Partial<CanonicalProduct> = {}): CanonicalProduct {
  return {
    productHandle: "oak-dining-table",
    sku: "acm_abc-123",
    supplierSku: "ABC-123",
    supplierTitle: "Oak Dining Table",
    productTitle: "Oak Dining Table",
    supplierSubtitle: null,
    subtitle: null,
    supplierDescription: null,
    description: null,
    supplierCost: 100,
    retailPrice: 250,
    variantOptions: [],
    imageUrls: [],
    variantImageUrls: [],
    weight: null,
    length: null,
    width: null,
    height: null,
    hsCode: null,
    originCountry: null,
    midCode: null,
    upc: null,
    ean: null,
    customAttributes: [],
    status: "draft",
    productTags: [],
    productCategories: [],
    collectionId: null,
    typeId: null,
    shippingProfileId: null,
    salesChannel: null,
    discountable: true,
    ...overrides,
  }
}

/** A consistency result with no disagreements - the common "this row is fine" case. */
function consistent(product: CanonicalProduct): ProductLevelConsistencyCheckResult {
  return { product, readyToSync: true, disagreements: [] }
}

describe("resolveSyncStatusForCycle", () => {
  it("flags an Adapter-level failure verbatim, anchored per ADR 0004, with no product to sync", () => {
    const failed: Extract<AdapterRowResult, { ok: false }> = {
      ok: false,
      anchor: "batch position #3",
      error: "Retail Price must be a positive number",
    }

    const result = resolveSyncStatusForCycle({
      failedRows: [failed],
      rowsToWriteBack: [],
      rowsNeedingMedusaSync: [],
      consistencyResults: [],
    })

    expect(result.blockedRows).toEqual([
      { anchor: "batch position #3", product: null, status: "✗ Retail Price must be a positive number" },
    ])
    expect(result.readyForMedusaSync).toEqual([])
  })

  it("marks a validation-clean row ready for Medusa sync, with no blocked status", () => {
    const product = makeProduct({ sku: "acm_clean" })

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
      rowsNeedingMedusaSync: [product],
      consistencyResults: [consistent(product)],
    })

    expect(result.readyForMedusaSync).toEqual([product])
    expect(result.blockedRows).toEqual([])
  })

  it("flags an incomplete-placeholder SKU as Needs SKU when otherwise validation-clean (ADR 0004)", () => {
    const product = makeProduct({ sku: "acm_" })

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
      rowsNeedingMedusaSync: [], // excluded by row-reconciliation because the SKU is still a placeholder
      consistencyResults: [consistent(product)],
    })

    expect(result.blockedRows).toEqual([{ anchor: "acm_", product, status: "⚠ Needs SKU" }])
    expect(result.readyForMedusaSync).toEqual([])
  })

  it("writes a product-level dissenting-row message verbatim, excluding that row from Medusa sync", () => {
    const product = makeProduct({ sku: "acm_dissenting" })
    const dissenting: ProductLevelConsistencyCheckResult = {
      product,
      readyToSync: false,
      disagreements: [{ field: "productTitle", message: "⚠ Title doesn't match this product's other 2 variants" }],
    }

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
      rowsNeedingMedusaSync: [product],
      consistencyResults: [dissenting],
    })

    expect(result.blockedRows).toEqual([
      { anchor: "acm_dissenting", product, status: "⚠ Title doesn't match this product's other 2 variants" },
    ])
    expect(result.readyForMedusaSync).toEqual([])
  })

  it("writes the product-level tie message verbatim when there's no clear majority", () => {
    const product = makeProduct({ sku: "acm_tie" })
    const tied: ProductLevelConsistencyCheckResult = {
      product,
      readyToSync: false,
      disagreements: [
        {
          field: "status",
          message: "⚠ This product's variants disagree on Status — check all rows, may not apply to every variant",
        },
      ],
    }

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
      rowsNeedingMedusaSync: [product],
      consistencyResults: [tied],
    })

    expect(result.blockedRows).toEqual([
      {
        anchor: "acm_tie",
        product,
        status: "⚠ This product's variants disagree on Status — check all rows, may not apply to every variant",
      },
    ])
  })

  it("joins multiple disagreements for the same row into a single Sync Status, never stacking statuses from different categories", () => {
    const product = makeProduct({ sku: "acm_multi" })
    const multi: ProductLevelConsistencyCheckResult = {
      product,
      readyToSync: false,
      disagreements: [
        { field: "productTitle", message: "⚠ Title doesn't match this product's other 2 variants" },
        { field: "subtitle", message: "⚠ Subtitle doesn't match this product's other 2 variants" },
      ],
    }

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
      rowsNeedingMedusaSync: [product],
      consistencyResults: [multi],
    })

    expect(result.blockedRows[0].status).toBe(
      "⚠ Title doesn't match this product's other 2 variants; ⚠ Subtitle doesn't match this product's other 2 variants"
    )
  })

  it("prefers the product-level disagreement over Needs SKU when a row has both problems at once", () => {
    const product = makeProduct({ sku: "acm_" }) // still a placeholder AND...
    const dissenting: ProductLevelConsistencyCheckResult = {
      product,
      readyToSync: false,
      disagreements: [{ field: "productTitle", message: "⚠ Title doesn't match this product's other 2 variants" }],
    }

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
      rowsNeedingMedusaSync: [], // ...excluded for the placeholder SKU too
      consistencyResults: [dissenting],
    })

    expect(result.blockedRows).toEqual([
      { anchor: "acm_", product, status: "⚠ Title doesn't match this product's other 2 variants" },
    ])
  })

  it("excludes a non-dissenting sibling of a disagreeing product from Medusa sync, inventing no status message for it", () => {
    // product-level-consistency's own majority-rule contract (see product-level-consistency.spec.ts,
    // "flags only the dissenting row by name..."): non-dissenting siblings of a flagged product get
    // readyToSync: false with an *empty* disagreements array - only the dissenter is individually
    // flagged. This module must honor readyToSync, not just disagreements.length, or it would
    // wrongly let the whole product's siblings race ahead to Medusa except the one named row.
    const majorityA = makeProduct({ sku: "acm_1", productHandle: "oak-table", productTitle: "Oak Dining Table" })
    const majorityB = makeProduct({ sku: "acm_2", productHandle: "oak-table", productTitle: "Oak Dining Table" })
    const dissenter = makeProduct({ sku: "acm_3", productHandle: "oak-table", productTitle: "Typo'd Title" })
    const siblings = [majorityA, majorityB, dissenter]

    const result = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: siblings.map((product) => ({ product, adapterFieldsHash: "hash" })),
      rowsNeedingMedusaSync: siblings, // none are placeholder SKUs
      consistencyResults: checkProductLevelFieldConsistency(siblings),
    })

    expect(result.readyForMedusaSync).toEqual([])
    expect(result.blockedRows).toEqual([
      { anchor: "acm_3", product: dissenter, status: "⚠ Title doesn't match this product's other 2 variants" },
    ])
  })

  it("throws a descriptive error when a rowsToWriteBack product has no matching consistency result (contract violation)", () => {
    const product = makeProduct({ sku: "acm_orphan" })

    expect(() =>
      resolveSyncStatusForCycle({
        failedRows: [],
        rowsToWriteBack: [{ product, adapterFieldsHash: "hash-1" }],
        rowsNeedingMedusaSync: [product],
        consistencyResults: [],
      })
    ).toThrow(/acm_orphan/)
  })

  it("mixes Adapter-level failures and reconciled rows independently in the same cycle", () => {
    const failed: Extract<AdapterRowResult, { ok: false }> = { ok: false, anchor: "SUP-9", error: "Missing SKU field" }
    const cleanProduct = makeProduct({ sku: "acm_clean-2" })

    const result = resolveSyncStatusForCycle({
      failedRows: [failed],
      rowsToWriteBack: [{ product: cleanProduct, adapterFieldsHash: "hash-2" }],
      rowsNeedingMedusaSync: [cleanProduct],
      consistencyResults: [consistent(cleanProduct)],
    })

    expect(result.blockedRows).toEqual([{ anchor: "SUP-9", product: null, status: "✗ Missing SKU field" }])
    expect(result.readyForMedusaSync).toEqual([cleanProduct])
  })
})

describe("buildSyncedWriteBack", () => {
  it("stamps the Synced status with the given Last Synced At timestamp, the only way that timestamp is ever set", () => {
    const syncedAt = new Date("2026-01-15T10:00:00Z")

    expect(buildSyncedWriteBack(syncedAt)).toEqual({ status: "✓ Synced", lastSyncedAt: syncedAt })
  })
})

describe("reconciliation: re-flagged every cycle without a wasted rewrite (spec §9)", () => {
  it("keeps an unresolved row's status correct across cycles even though idempotency skips rewriting its unchanged hash", () => {
    const cycle1Product = makeProduct({ supplierSku: "SUP-ERR", sku: "acm_", productHandle: "needs-sku-product" })
    const cycle1Hash = hashAdapterOwnedFields(cycle1Product)

    // Cycle 1: the row is new, so it's written back with its correctly-derived status.
    const cycle1 = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product: cycle1Product, adapterFieldsHash: cycle1Hash }],
      rowsNeedingMedusaSync: [], // placeholder SKU - never eligible for Medusa
      consistencyResults: [consistent(cycle1Product)],
    })
    expect(cycle1.blockedRows).toEqual([{ anchor: "acm_", product: cycle1Product, status: "⚠ Needs SKU" }])

    // Cycle 2: the adapter is a pure function and the supplier data hasn't changed, so it
    // reproduces an identical row. row-reconciliation's own hash check (already covered by its
    // own test suite) would skip this row out of rowsToWriteBack entirely - simulated here by
    // feeding its real reconcileSupplierTabRows an existing row carrying cycle 1's hash.
    const existing: ExistingSheetRow = { product: cycle1Product, adapterFieldsHash: cycle1Hash }
    const cycle2Fresh = makeProduct({ supplierSku: "SUP-ERR", sku: "acm_", productHandle: "needs-sku-product" })
    const cycle2Reconciliation = reconcileSupplierTabRows([existing], [cycle2Fresh])
    expect(cycle2Reconciliation.rowsToWriteBack).toEqual([])

    // So this module is never even called for that row in cycle 2 - nothing to write, nothing to
    // clear. The row's Sync Status cell still holds cycle 1's "⚠ Needs SKU" text, written by a
    // human never touching it. That's the intended design, not a bug: re-running this module on
    // an identical row (proving determinism) reproduces the exact same status, so skipping the
    // rewrite was always safe.
    const rerun = resolveSyncStatusForCycle({
      failedRows: [],
      rowsToWriteBack: [{ product: cycle2Fresh, adapterFieldsHash: cycle1Hash }],
      rowsNeedingMedusaSync: [],
      consistencyResults: [consistent(cycle2Fresh)],
    })
    expect(rerun.blockedRows).toEqual([{ anchor: "acm_", product: cycle2Fresh, status: "⚠ Needs SKU" }])
  })
})
