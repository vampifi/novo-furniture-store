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

describe("checkProductLevelFieldConsistency", () => {
  it("marks every row ready to sync, with no disagreements, when all sibling rows fully agree", () => {
    const rowA = makeProduct({ sku: "acm_1", productTitle: "Oak Dining Table" })
    const rowB = makeProduct({ sku: "acm_2", productTitle: "Oak Dining Table" })

    const results = checkProductLevelFieldConsistency([rowA, rowB])

    expect(results).toEqual([
      { product: rowA, readyToSync: true, disagreements: [] },
      { product: rowB, readyToSync: true, disagreements: [] },
    ])
  })

  it("flags only the dissenting row by name when a clear majority of siblings agree on a field", () => {
    const rowA = makeProduct({ sku: "acm_1", productTitle: "Oak Dining Table" })
    const rowB = makeProduct({ sku: "acm_2", productTitle: "Oak Dining Table" })
    const rowC = makeProduct({ sku: "acm_3", productTitle: "Typo'd Title" })

    const results = checkProductLevelFieldConsistency([rowA, rowB, rowC])

    expect(results).toEqual([
      { product: rowA, readyToSync: false, disagreements: [] },
      { product: rowB, readyToSync: false, disagreements: [] },
      {
        product: rowC,
        readyToSync: false,
        disagreements: [{ field: "productTitle", message: "⚠ Title doesn't match this product's other 2 variants" }],
      },
    ])
  })

  it("flags every row of the product, with the tie wording, on a genuine tie with no clear majority", () => {
    const rowA = makeProduct({ sku: "acm_1", status: "draft" })
    const rowB = makeProduct({ sku: "acm_2", status: "published" })

    const results = checkProductLevelFieldConsistency([rowA, rowB])

    const tieMessage = {
      field: "status",
      message: "⚠ This product's variants disagree on Status — check all rows, may not apply to every variant",
    }
    expect(results).toEqual([
      { product: rowA, readyToSync: false, disagreements: [tieMessage] },
      { product: rowB, readyToSync: false, disagreements: [tieMessage] },
    ])
  })

  it("treats a single row with no siblings as trivially consistent, even with unresolved placeholder-looking fields", () => {
    const lonelyRow = makeProduct({ sku: "acm_1" })

    const results = checkProductLevelFieldConsistency([lonelyRow])

    expect(results).toEqual([{ product: lonelyRow, readyToSync: true, disagreements: [] }])
  })

  it("treats array fields (Tags/Categories) as sets, ignoring order, when checking agreement", () => {
    const rowA = makeProduct({ sku: "acm_1", productTags: ["sale", "oak"] })
    const rowB = makeProduct({ sku: "acm_2", productTags: ["oak", "sale"] })

    const results = checkProductLevelFieldConsistency([rowA, rowB])

    expect(results).toEqual([
      { product: rowA, readyToSync: true, disagreements: [] },
      { product: rowB, readyToSync: true, disagreements: [] },
    ])
  })

  it("flags a genuine array-field (Tags) disagreement using the majority rule, same as any scalar field", () => {
    const rowA = makeProduct({ sku: "acm_1", productTags: ["sale"] })
    const rowB = makeProduct({ sku: "acm_2", productTags: ["sale"] })
    const rowC = makeProduct({ sku: "acm_3", productTags: ["clearance"] })

    const results = checkProductLevelFieldConsistency([rowA, rowB, rowC])

    expect(results[2]).toEqual({
      product: rowC,
      readyToSync: false,
      disagreements: [{ field: "productTags", message: "⚠ Tags doesn't match this product's other 2 variants" }],
    })
  })

  it("keeps a product's readiness and flags isolated from a different product's disagreement (grouping by handle)", () => {
    const consistentA = makeProduct({ productHandle: "oak-dining-table", sku: "acm_1" })
    const consistentB = makeProduct({ productHandle: "oak-dining-table", sku: "acm_2" })
    const disagreeingA = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_3", status: "draft" })
    const disagreeingB = makeProduct({ productHandle: "pine-bookshelf", sku: "acm_4", status: "published" })

    const results = checkProductLevelFieldConsistency([consistentA, disagreeingA, consistentB, disagreeingB])

    expect(results[0]).toEqual({ product: consistentA, readyToSync: true, disagreements: [] })
    expect(results[2]).toEqual({ product: consistentB, readyToSync: true, disagreements: [] })
    expect(results[1].readyToSync).toBe(false)
    expect(results[3].readyToSync).toBe(false)
  })

  it("reports a separate disagreement entry per field when the same row dissents on more than one field", () => {
    const rowA = makeProduct({ sku: "acm_1", productTitle: "Oak Dining Table", subtitle: "Classic" })
    const rowB = makeProduct({ sku: "acm_2", productTitle: "Oak Dining Table", subtitle: "Classic" })
    const rowC = makeProduct({ sku: "acm_3", productTitle: "Different Title", subtitle: "Different Subtitle" })

    const results = checkProductLevelFieldConsistency([rowA, rowB, rowC])

    expect(results[2].disagreements).toEqual([
      { field: "productTitle", message: "⚠ Title doesn't match this product's other 2 variants" },
      { field: "subtitle", message: "⚠ Subtitle doesn't match this product's other 2 variants" },
    ])
  })
})
