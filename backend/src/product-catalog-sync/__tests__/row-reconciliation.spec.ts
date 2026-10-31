import { hashAdapterOwnedFields, reconcileSupplierTabRows } from "../row-reconciliation"
import type { ExistingSheetRow } from "../row-reconciliation"
import type { CanonicalProduct } from "../types"

/**
 * Minimal CanonicalProduct factory for these tests - every field has a sensible default so a
 * test only needs to override the handful of fields it actually cares about.
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

describe("hashAdapterOwnedFields", () => {
  it("is equal for two products differing only in Business-Owned fields", () => {
    const a = makeProduct({ productTitle: "Oak Dining Table", retailPrice: 250, sku: "acm_abc-123" })
    const b = makeProduct({ productTitle: "Renamed By Business", retailPrice: 999, sku: "acm_renamed" })

    expect(hashAdapterOwnedFields(a)).toBe(hashAdapterOwnedFields(b))
  })

  it("differs when an Adapter-Owned field changes", () => {
    const a = makeProduct({ supplierCost: 100 })
    const b = makeProduct({ supplierCost: 150 })

    expect(hashAdapterOwnedFields(a)).not.toBe(hashAdapterOwnedFields(b))
  })

  it("differs when a nested variantOptions Adapter-Owned sub-field changes", () => {
    const a = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "Color", optionValue: "Red" }],
    })
    const b = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Blue", optionName: "Color", optionValue: "Red" }],
    })

    expect(hashAdapterOwnedFields(a)).not.toBe(hashAdapterOwnedFields(b))
  })

  it("is unaffected by a nested variantOptions Business-Owned sub-field change", () => {
    const a = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "Color", optionValue: "Red" }],
    })
    const b = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "Colour", optionValue: "Rouge" }],
    })

    expect(hashAdapterOwnedFields(a)).toBe(hashAdapterOwnedFields(b))
  })

  it("differs when a nested customAttributes Adapter-Owned sub-field changes", () => {
    const a = makeProduct({
      customAttributes: [
        {
          attributeKey: "material",
          attributeCategoryId: "cat_1",
          supplierAttributeValue: "Oak",
          attributeValue: "Oak",
          attributeVisible: true,
        },
      ],
    })
    const b = makeProduct({
      customAttributes: [
        {
          attributeKey: "material",
          attributeCategoryId: "cat_1",
          supplierAttributeValue: "Pine",
          attributeValue: "Oak",
          attributeVisible: true,
        },
      ],
    })

    expect(hashAdapterOwnedFields(a)).not.toBe(hashAdapterOwnedFields(b))
  })

  it("is unaffected by a nested customAttributes Business-Owned sub-field change", () => {
    const a = makeProduct({
      customAttributes: [
        {
          attributeKey: "material",
          attributeCategoryId: "cat_1",
          supplierAttributeValue: "Oak",
          attributeValue: "Oak",
          attributeVisible: true,
        },
      ],
    })
    const b = makeProduct({
      customAttributes: [
        {
          attributeKey: "material",
          attributeCategoryId: "cat_1",
          supplierAttributeValue: "Oak",
          attributeValue: "Overridden by business",
          attributeVisible: false,
        },
      ],
    })

    expect(hashAdapterOwnedFields(a)).toBe(hashAdapterOwnedFields(b))
  })

  it("is stable regardless of incidental object key order", () => {
    const a: CanonicalProduct = makeProduct()
    const bEntries = Object.entries(a).reverse()
    const b = Object.fromEntries(bEntries) as CanonicalProduct

    expect(hashAdapterOwnedFields(a)).toBe(hashAdapterOwnedFields(b))
  })
})

describe("reconcileSupplierTabRows", () => {
  it("treats a fresh product with no matching existing row as new, including it as-is in both outputs", () => {
    const fresh = makeProduct({ supplierSku: "NEW-1" })

    const result = reconcileSupplierTabRows([], [fresh])

    expect(result.rowsToWriteBack).toEqual([{ product: fresh, adapterFieldsHash: hashAdapterOwnedFields(fresh) }])
    expect(result.rowsNeedingMedusaSync).toEqual([fresh])
  })

  it("excludes a row from both outputs when its Adapter-Owned hash is unchanged since last cycle (idempotency)", () => {
    const existingProduct = makeProduct({ supplierSku: "SUP-1" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashAdapterOwnedFields(existingProduct),
    }
    // Same supplierSku, identical Adapter-Owned values - a pure function re-run of the adapter
    // against unchanged supplier data reproduces the exact same row.
    const fresh = makeProduct({ supplierSku: "SUP-1" })

    const result = reconcileSupplierTabRows([existing], [fresh])

    expect(result.rowsToWriteBack).toEqual([])
    expect(result.rowsNeedingMedusaSync).toEqual([])
  })

  it("matches via Supplier SKU and preserves a business-renamed SKU, refreshing Adapter-Owned fields", () => {
    const existingProduct = makeProduct({
      supplierSku: "SUP-1",
      sku: "acm_custom-name", // business renamed this away from the adapter's deterministic default
      supplierCost: 100,
      productTitle: "Business's Own Title", // Business-Owned, must survive the merge untouched
    })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashAdapterOwnedFields(makeProduct({ supplierSku: "SUP-1", supplierCost: 100 })),
    }
    // Same supplierSku, but the supplier's cost changed - the adapter's deterministic default
    // SKU for this row would be "acm_abc-123", unrelated to the business's rename.
    const fresh = makeProduct({
      supplierSku: "SUP-1",
      sku: "acm_abc-123",
      supplierCost: 150,
      supplierTitle: "Updated Supplier Title",
      productTitle: "Seed Title The Adapter Would Use For A New Row",
    })

    const result = reconcileSupplierTabRows([existing], [fresh])

    expect(result.rowsToWriteBack).toHaveLength(1)
    const merged = result.rowsToWriteBack[0].product
    // Business-Owned fields preserved from the existing row, not overwritten by fresh output.
    expect(merged.sku).toBe("acm_custom-name")
    expect(merged.productTitle).toBe("Business's Own Title")
    // Adapter-Owned fields refreshed from the fresh adapter output.
    expect(merged.supplierCost).toBe(150)
    expect(merged.supplierTitle).toBe("Updated Supplier Title")
    expect(result.rowsNeedingMedusaSync).toEqual([merged])
  })

  it("writes back a new row whose SKU is still the ADR-0004 placeholder, but excludes it from Medusa sync", () => {
    const fresh = makeProduct({ supplierSku: "SUP-2", sku: "acm_" })

    const result = reconcileSupplierTabRows([], [fresh])

    expect(result.rowsToWriteBack).toEqual([{ product: fresh, adapterFieldsHash: hashAdapterOwnedFields(fresh) }])
    expect(result.rowsNeedingMedusaSync).toEqual([])
  })

  it("writes back a merged row whose preserved SKU is still the ADR-0004 placeholder, but excludes it from Medusa sync", () => {
    const existingProduct = makeProduct({ supplierSku: "SUP-3", sku: "acm_", productTitle: "Needs A SKU" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashAdapterOwnedFields(makeProduct({ supplierSku: "SUP-3" })),
    }
    const fresh = makeProduct({ supplierSku: "SUP-3", sku: "acm_", supplierCost: 200 })

    const result = reconcileSupplierTabRows([existing], [fresh])

    expect(result.rowsToWriteBack).toHaveLength(1)
    expect(result.rowsToWriteBack[0].product.sku).toBe("acm_")
    expect(result.rowsNeedingMedusaSync).toEqual([])
  })

  describe("variantOptions / customAttributes per-slot merge", () => {
    it("refreshes Adapter-Owned sub-fields and preserves Business-Owned sub-fields for a slot present in both", () => {
      const existingProduct = makeProduct({
        supplierSku: "SUP-4",
        variantOptions: [{ supplierOptionName: "Colour", supplierOptionValue: "Rouge", optionName: "Colour", optionValue: "Rouge" }],
        customAttributes: [
          {
            attributeKey: "material",
            attributeCategoryId: "cat_1",
            supplierAttributeValue: "Oak",
            attributeValue: "Oak (business override)",
            attributeVisible: false,
          },
        ],
      })
      const existing: ExistingSheetRow = {
        product: existingProduct,
        adapterFieldsHash: hashAdapterOwnedFields(
          makeProduct({
            supplierSku: "SUP-4",
            variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "x", optionValue: "x" }],
            customAttributes: [
              {
                attributeKey: "material",
                attributeCategoryId: "cat_1",
                supplierAttributeValue: "Oak",
                attributeValue: "x",
                attributeVisible: true,
              },
            ],
          })
        ),
      }
      const fresh = makeProduct({
        supplierSku: "SUP-4",
        variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Blue", optionName: "Color", optionValue: "Blue" }],
        customAttributes: [
          {
            attributeKey: "material",
            attributeCategoryId: "cat_1",
            supplierAttributeValue: "Pine",
            attributeValue: "Pine",
            attributeVisible: true,
          },
        ],
      })

      const result = reconcileSupplierTabRows([existing], [fresh])
      const merged = result.rowsToWriteBack[0].product

      expect(merged.variantOptions).toEqual([
        { supplierOptionName: "Color", supplierOptionValue: "Blue", optionName: "Colour", optionValue: "Rouge" },
      ])
      expect(merged.customAttributes).toEqual([
        {
          attributeKey: "material",
          attributeCategoryId: "cat_1",
          supplierAttributeValue: "Pine",
          attributeValue: "Oak (business override)",
          attributeVisible: false,
        },
      ])
    })

    it("adopts a genuinely new fresh slot as-is when the existing array is shorter", () => {
      const existingProduct = makeProduct({ supplierSku: "SUP-5", variantOptions: [] })
      const existing: ExistingSheetRow = {
        product: existingProduct,
        adapterFieldsHash: hashAdapterOwnedFields(makeProduct({ supplierSku: "SUP-5", variantOptions: [] })),
      }
      const newSlot = { supplierOptionName: "Size", supplierOptionValue: "L", optionName: "Size", optionValue: "L" }
      const fresh = makeProduct({ supplierSku: "SUP-5", variantOptions: [newSlot] })

      const result = reconcileSupplierTabRows([existing], [fresh])

      expect(result.rowsToWriteBack[0].product.variantOptions).toEqual([newSlot])
    })

    it("preserves an existing slot the adapter no longer produces, appended after the merged slots", () => {
      const keptSlot = { supplierOptionName: "Size", supplierOptionValue: "L", optionName: "Size", optionValue: "L" }
      const existingProduct = makeProduct({
        supplierSku: "SUP-6",
        supplierCost: 100,
        variantOptions: [keptSlot],
      })
      const existing: ExistingSheetRow = {
        product: existingProduct,
        adapterFieldsHash: hashAdapterOwnedFields(makeProduct({ supplierSku: "SUP-6", supplierCost: 100, variantOptions: [keptSlot] })),
      }
      // Fresh output changed elsewhere (triggers a merge) but no longer produces any option slots.
      const fresh = makeProduct({ supplierSku: "SUP-6", supplierCost: 150, variantOptions: [] })

      const result = reconcileSupplierTabRows([existing], [fresh])

      expect(result.rowsToWriteBack[0].product.variantOptions).toEqual([keptSlot])
    })
  })

  it("treats a fresh product with a null Supplier SKU as always new/unmatched, regardless of any existing row's hash (ADR 0004)", () => {
    const fresh = makeProduct({ supplierSku: null })
    // Even an existing row with the identical hash must not cause a skip - a null Supplier SKU
    // can never be matched to anything (no automatic identity matching without a supplier code).
    const existing: ExistingSheetRow = {
      product: makeProduct({ supplierSku: null }),
      adapterFieldsHash: hashAdapterOwnedFields(fresh),
    }

    const result = reconcileSupplierTabRows([existing], [fresh])

    expect(result.rowsToWriteBack).toEqual([{ product: fresh, adapterFieldsHash: hashAdapterOwnedFields(fresh) }])
    expect(result.rowsNeedingMedusaSync).toEqual([fresh])
  })

  it("leaves an existing row alone (no output entries) when no fresh product matches it this cycle", () => {
    const existingProduct = makeProduct({ supplierSku: "GONE-1" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashAdapterOwnedFields(existingProduct),
    }

    const result = reconcileSupplierTabRows([existing], [])

    expect(result.rowsToWriteBack).toEqual([])
    expect(result.rowsNeedingMedusaSync).toEqual([])
  })
})
