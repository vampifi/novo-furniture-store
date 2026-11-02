import { applyReadyRows } from "../apply-ready-rows"
import { checkProductLevelFieldConsistency } from "../product-level-consistency"
import type { CanonicalProduct } from "../types"

/**
 * Minimal CanonicalProduct factory for these tests - mirrors row-reconciliation.spec.ts's
 * makeProduct so every test only needs to override the handful of fields it cares about.
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

describe("applyReadyRows", () => {
  it("invokes applyCanonicalProduct once for a single ready product, with that product's row", async () => {
    const row = makeProduct({ productHandle: "oak-dining-table", sku: "acm_1" })
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_1" })

    const outcomes = await applyReadyRows([row], checkProductLevelFieldConsistency([row]), applyCanonicalProduct)

    expect(applyCanonicalProduct).toHaveBeenCalledTimes(1)
    expect(applyCanonicalProduct).toHaveBeenCalledWith([row])
    expect(outcomes).toEqual([{ productHandle: "oak-dining-table", result: { outcome: "applied", productId: "prod_1" } }])
  })

  it("groups rows by productHandle, invoking applyCanonicalProduct once per distinct product with only that product's rows", async () => {
    const tableRowA = makeProduct({ productHandle: "oak-dining-table", sku: "acm_1" })
    const tableRowB = makeProduct({ productHandle: "oak-dining-table", sku: "acm_2" })
    const chairRow = makeProduct({ productHandle: "pine-chair", sku: "acm_3" })
    const rows = [tableRowA, chairRow, tableRowB]
    const applyCanonicalProduct = jest
      .fn()
      .mockResolvedValueOnce({ productId: "prod_table" })
      .mockResolvedValueOnce({ productId: "prod_chair" })

    const outcomes = await applyReadyRows(rows, checkProductLevelFieldConsistency(rows), applyCanonicalProduct)

    expect(applyCanonicalProduct).toHaveBeenCalledTimes(2)
    expect(applyCanonicalProduct).toHaveBeenNthCalledWith(1, [tableRowA, tableRowB])
    expect(applyCanonicalProduct).toHaveBeenNthCalledWith(2, [chairRow])
    expect(outcomes).toEqual([
      { productHandle: "oak-dining-table", result: { outcome: "applied", productId: "prod_table" } },
      { productHandle: "pine-chair", result: { outcome: "applied", productId: "prod_chair" } },
    ])
  })

  it("never invokes applyCanonicalProduct for a product whose sibling rows disagree on a product-level field", async () => {
    const disagreeingA = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_1", status: "draft" })
    const disagreeingB = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_2", status: "published" })
    const consistent = makeProduct({ productHandle: "oak-dining-table", sku: "acm_3" })
    const rows = [disagreeingA, disagreeingB, consistent]
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_table" })

    const outcomes = await applyReadyRows(rows, checkProductLevelFieldConsistency(rows), applyCanonicalProduct)

    expect(applyCanonicalProduct).toHaveBeenCalledTimes(1)
    expect(applyCanonicalProduct).toHaveBeenCalledWith([consistent])
    expect(outcomes).toEqual([
      { productHandle: "pine-bookshelf", result: { outcome: "skipped", reason: "product-level-disagreement" } },
      { productHandle: "oak-dining-table", result: { outcome: "applied", productId: "prod_table" } },
    ])
  })

  it("invokes applyCanonicalProduct zero times and returns no outcomes for an empty input (idempotent cycle)", async () => {
    const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_unused" })

    const outcomes = await applyReadyRows([], [], applyCanonicalProduct)

    expect(applyCanonicalProduct).not.toHaveBeenCalled()
    expect(outcomes).toEqual([])
  })

  it("isolates a product-level failure: one product's applyCanonicalProduct rejection doesn't stop other products from being applied", async () => {
    const failingRow = makeProduct({ productHandle: "broken-product", sku: "acm_1" })
    const okRow = makeProduct({ productHandle: "oak-dining-table", sku: "acm_2" })
    const rows = [failingRow, okRow]
    const failure = new Error("DB write failed")
    const applyCanonicalProduct = jest
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ productId: "prod_table" })

    const outcomes = await applyReadyRows(rows, checkProductLevelFieldConsistency(rows), applyCanonicalProduct)

    expect(applyCanonicalProduct).toHaveBeenCalledTimes(2)
    expect(outcomes).toEqual([
      { productHandle: "broken-product", result: { outcome: "failed", error: failure } },
      { productHandle: "oak-dining-table", result: { outcome: "applied", productId: "prod_table" } },
    ])
  })

  describe("ADR-0004 incomplete-placeholder-SKU guard", () => {
    it(
      "never invokes applyCanonicalProduct for a row whose SKU is still the ADR-0004 incomplete placeholder, " +
        "even if it reaches this function directly (defense-in-depth on top of row-reconciliation's own exclusion)",
      async () => {
        const placeholderRow = makeProduct({ productHandle: "needs-a-sku", sku: "acm_" })
        const rows = [placeholderRow]
        const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_unused" })

        const outcomes = await applyReadyRows(rows, checkProductLevelFieldConsistency(rows), applyCanonicalProduct)

        expect(applyCanonicalProduct).not.toHaveBeenCalled()
        expect(outcomes).toEqual([])
      }
    )

    it("still applies the rest of a product's variants when only one sibling row has a placeholder SKU", async () => {
      const placeholderSibling = makeProduct({ productHandle: "oak-dining-table", sku: "acm_" })
      const validSibling = makeProduct({ productHandle: "oak-dining-table", sku: "acm_1" })
      const rows = [placeholderSibling, validSibling]
      const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_table" })

      const outcomes = await applyReadyRows(rows, checkProductLevelFieldConsistency(rows), applyCanonicalProduct)

      expect(applyCanonicalProduct).toHaveBeenCalledTimes(1)
      expect(applyCanonicalProduct).toHaveBeenCalledWith([validSibling])
      expect(outcomes).toEqual([{ productHandle: "oak-dining-table", result: { outcome: "applied", productId: "prod_table" } }])
    })
  })

  describe("precomputed consistencyResults contract (issue #19: computed once by the caller, shared with resolveSyncStatusForCycle)", () => {
    it("throws a descriptive error when a row has no matching consistency result (contract violation)", async () => {
      const row = makeProduct({ sku: "acm_orphan" })
      const applyCanonicalProduct = jest.fn()

      await expect(applyReadyRows([row], [], applyCanonicalProduct)).rejects.toThrow(/acm_orphan/)
      expect(applyCanonicalProduct).not.toHaveBeenCalled()
    })

    it("treats a row as not ready when its precomputed result says readyToSync: false, without recomputing consistency itself", async () => {
      // Deliberately a lie relative to what checkProductLevelFieldConsistency would compute for a
      // single, sibling-less row (always ready) - proves this function trusts the precomputed
      // result rather than recomputing it, which is the whole point of accepting it as a parameter.
      const row = makeProduct({ sku: "acm_lied_to" })
      const falseConsistencyResult = [{ product: row, readyToSync: false, disagreements: [] }]
      const applyCanonicalProduct = jest.fn().mockResolvedValue({ productId: "prod_unused" })

      const outcomes = await applyReadyRows([row], falseConsistencyResult, applyCanonicalProduct)

      expect(applyCanonicalProduct).not.toHaveBeenCalled()
      expect(outcomes).toEqual([
        { productHandle: "oak-dining-table", result: { outcome: "skipped", reason: "product-level-disagreement" } },
      ])
    })
  })
})
