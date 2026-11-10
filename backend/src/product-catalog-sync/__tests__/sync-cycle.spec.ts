import { runSupplierTabSyncCycle } from "../sync-cycle"
import type { SupplierTabDefinition, SupplierTabIO } from "../sync-cycle"
import { checkProductLevelFieldConsistency } from "../product-level-consistency"
import type { ExistingSheetRow } from "../row-reconciliation"
import { hashCanonicalProduct } from "../row-reconciliation"
import type { AdapterContext, AdapterRowResult, CanonicalProduct, RawRow, SupplierAdapter } from "../types"

// Wraps the real implementation in a jest.fn() so one test below can assert call count, without
// changing behavior for every other test in this file (jest.config.js's `clearMocks: true` resets
// the call count between tests). See "computes product-level field consistency exactly once..."
jest.mock("../product-level-consistency", () => {
  const actual = jest.requireActual("../product-level-consistency")
  return { ...actual, checkProductLevelFieldConsistency: jest.fn(actual.checkProductLevelFieldConsistency) }
})

/**
 * Minimal CanonicalProduct factory - mirrors the sibling modules' makeProduct so every test only
 * overrides what it cares about.
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

const noopContext: AdapterContext = { uploadImage: jest.fn() }

/** A fake Supplier Adapter: every raw row carries the full AdapterRowResult it should produce. */
function fakeAdapterFor(results: AdapterRowResult[]): SupplierAdapter {
  return async () => results
}

function fakeIO(existingRows: ExistingSheetRow[] = [], rawRows: RawRow[] = []): SupplierTabIO & { writeBack: jest.Mock } {
  return {
    readCurrentRows: jest.fn().mockResolvedValue({ existingRows, rawRows }),
    writeBack: jest.fn().mockResolvedValue(undefined),
  }
}

function makeTab(overrides: Partial<SupplierTabDefinition> = {}): SupplierTabDefinition {
  return {
    name: "SupplierA",
    adapter: fakeAdapterFor([]),
    context: noopContext,
    io: fakeIO(),
    ...overrides,
  }
}

describe("runSupplierTabSyncCycle", () => {
  it("applies a clean new row to Medusa and writes back its Synced status with the given timestamp", async () => {
    const product = makeProduct({ sku: "acm_new" })
    const io = fakeIO([], [{}])
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_1" })
    const syncedAt = new Date("2026-01-15T10:00:00Z")
    const tab = makeTab({ adapter: fakeAdapterFor([{ ok: true, product }]), io })

    const outcome = await runSupplierTabSyncCycle(tab, { applyCanonicalProduct, now: () => syncedAt })

    expect(applyCanonicalProduct).toHaveBeenCalledWith([product])
    expect(outcome).toEqual({
      tabName: "SupplierA",
      blockedRows: [],
      syncedRows: [{ product, writeBack: { status: "✓ Synced", lastSyncedAt: syncedAt } }],
      applyOutcomes: [{ productHandle: "oak-dining-table", result: { outcome: "applied", productId: "prod_1" } }],
    })
    expect(io.writeBack).toHaveBeenCalledTimes(1)
    expect(io.writeBack).toHaveBeenCalledWith(outcome)
  })

  it("writes back an Adapter-level failure's status verbatim without calling applyCanonicalProduct", async () => {
    const io = fakeIO([], [{}])
    const applyCanonicalProduct = jest.fn()
    const tab = makeTab({
      adapter: fakeAdapterFor([{ ok: false, anchor: "batch position #0", error: "Title is required" }]),
      io,
    })

    const outcome = await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })

    expect(applyCanonicalProduct).not.toHaveBeenCalled()
    expect(outcome.blockedRows).toEqual([
      { anchor: "batch position #0", product: null, status: "✗ Title is required" },
    ])
    expect(outcome.syncedRows).toEqual([])
  })

  it("excludes a product-level disagreement from the Medusa apply step and writes back its flagged status", async () => {
    const majorityA = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_1", status: "draft" })
    const majorityB = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_2", status: "draft" })
    const dissenter = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_3", status: "published" })
    const applyCanonicalProduct = jest.fn()
    const tab = makeTab({
      adapter: fakeAdapterFor([
        { ok: true, product: majorityA },
        { ok: true, product: majorityB },
        { ok: true, product: dissenter },
      ]),
      io: fakeIO([], [{}, {}, {}]),
    })

    const outcome = await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })

    expect(applyCanonicalProduct).not.toHaveBeenCalled()
    expect(outcome.blockedRows).toEqual([
      {
        anchor: "acm_3",
        product: dissenter,
        status: "⚠ Status doesn't match this product's other 2 variants",
      },
    ])
    expect(outcome.syncedRows).toEqual([])
  })

  it("excludes an incomplete-placeholder-SKU row (ADR 0004) from apply, writing back Needs SKU", async () => {
    const product = makeProduct({ sku: "acm_" })
    const applyCanonicalProduct = jest.fn()
    const tab = makeTab({ adapter: fakeAdapterFor([{ ok: true, product }]), io: fakeIO([], [{}]) })

    const outcome = await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })

    expect(applyCanonicalProduct).not.toHaveBeenCalled()
    expect(outcome.blockedRows).toEqual([{ anchor: "acm_", product, status: "⚠ Needs SKU" }])
  })

  it("does not mark a product as synced when its Medusa apply call fails, and writes back no status for it", async () => {
    const product = makeProduct({ sku: "acm_fails" })
    const failure = new Error("DB write failed")
    const applyCanonicalProduct = jest.fn().mockRejectedValue(failure)
    const tab = makeTab({ adapter: fakeAdapterFor([{ ok: true, product }]), io: fakeIO([], [{}]) })

    const outcome = await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })

    expect(outcome.syncedRows).toEqual([])
    expect(outcome.blockedRows).toEqual([])
    expect(outcome.applyOutcomes).toEqual([
      { productHandle: "oak-dining-table", result: { outcome: "failed", error: failure } },
    ])
  })

  it("preserves Business-Owned fields from the existing row when merging an edited Adapter row", async () => {
    const existingProduct = makeProduct({ sku: "acm_business-named", supplierSku: "SUP-1", productTitle: "Business Title" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashCanonicalProduct(existingProduct),
    }
    const freshProduct = makeProduct({ supplierSku: "SUP-1", supplierCost: 999, sku: "ignored-fresh-sku" })
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_1" })
    const tab = makeTab({ adapter: fakeAdapterFor([{ ok: true, product: freshProduct }]), io: fakeIO([existing], [{}]) })

    await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })

    expect(applyCanonicalProduct).toHaveBeenCalledWith([
      expect.objectContaining({ sku: "acm_business-named", productTitle: "Business Title", supplierCost: 999 }),
    ])
  })

  it("computes product-level field consistency exactly once per cycle, not once per downstream consumer (issue #19)", async () => {
    const product = makeProduct({ sku: "acm_once" })
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_1" })
    const tab = makeTab({ adapter: fakeAdapterFor([{ ok: true, product }]), io: fakeIO([], [{}]) })

    await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })

    expect(checkProductLevelFieldConsistency).toHaveBeenCalledTimes(1)
  })

  it("defaults the synced timestamp to the current time when none is injected", async () => {
    const product = makeProduct({ sku: "acm_default-time" })
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_1" })
    const tab = makeTab({ adapter: fakeAdapterFor([{ ok: true, product }]), io: fakeIO([], [{}]) })

    const before = Date.now()
    const outcome = await runSupplierTabSyncCycle(tab, { applyCanonicalProduct })
    const after = Date.now()

    const [syncedRow] = outcome.syncedRows
    expect(syncedRow.writeBack.lastSyncedAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(syncedRow.writeBack.lastSyncedAt.getTime()).toBeLessThanOrEqual(after)
  })
})
