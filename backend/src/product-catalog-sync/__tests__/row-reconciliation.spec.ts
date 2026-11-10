import { hashCanonicalProduct, isIncompletePlaceholderSku, reconcileSupplierTabRows } from "../row-reconciliation"
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

describe("hashCanonicalProduct", () => {
  // ADR 0006: this is a whole-row fingerprint, not an Adapter-Owned-only one (that was the bug
  // behind issue #21) - so it must be sensitive to a change in *either* ownership class, not just
  // Adapter-Owned fields.
  it("differs when a Business-Owned field changes", () => {
    const a = makeProduct({ productTitle: "Oak Dining Table", retailPrice: 250, sku: "acm_abc-123" })
    const b = makeProduct({ productTitle: "Renamed By Business", retailPrice: 999, sku: "acm_renamed" })

    expect(hashCanonicalProduct(a)).not.toBe(hashCanonicalProduct(b))
  })

  it("differs when an Adapter-Owned field changes", () => {
    const a = makeProduct({ supplierCost: 100 })
    const b = makeProduct({ supplierCost: 150 })

    expect(hashCanonicalProduct(a)).not.toBe(hashCanonicalProduct(b))
  })

  it("differs when a nested variantOptions Adapter-Owned sub-field changes", () => {
    const a = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "Color", optionValue: "Red" }],
    })
    const b = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Blue", optionName: "Color", optionValue: "Red" }],
    })

    expect(hashCanonicalProduct(a)).not.toBe(hashCanonicalProduct(b))
  })

  it("differs when a nested variantOptions Business-Owned sub-field changes", () => {
    const a = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "Color", optionValue: "Red" }],
    })
    const b = makeProduct({
      variantOptions: [{ supplierOptionName: "Color", supplierOptionValue: "Red", optionName: "Colour", optionValue: "Rouge" }],
    })

    expect(hashCanonicalProduct(a)).not.toBe(hashCanonicalProduct(b))
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

    expect(hashCanonicalProduct(a)).not.toBe(hashCanonicalProduct(b))
  })

  it("differs when a nested customAttributes Business-Owned sub-field changes", () => {
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

    expect(hashCanonicalProduct(a)).not.toBe(hashCanonicalProduct(b))
  })

  it("is stable regardless of incidental object key order", () => {
    const a: CanonicalProduct = makeProduct()
    const bEntries = Object.entries(a).reverse()
    const b = Object.fromEntries(bEntries) as CanonicalProduct

    expect(hashCanonicalProduct(a)).toBe(hashCanonicalProduct(b))
  })
})

describe("isIncompletePlaceholderSku", () => {
  it("flags the ADR-0004 placeholder shape: a short (<=3 char) prefix plus a trailing underscore, nothing else", () => {
    expect(isIncompletePlaceholderSku("acm_")).toBe(true)
  })

  it("does not flag a legitimate, longer business-chosen SKU that merely happens to end in an underscore", () => {
    expect(isIncompletePlaceholderSku("my-sku_")).toBe(false)
  })
})

describe("reconcileSupplierTabRows", () => {
  it("treats a fresh product with no matching existing row as new, including it as-is in both outputs", () => {
    const fresh = makeProduct({ supplierSku: "NEW-1" })

    const result = reconcileSupplierTabRows([], [fresh])

    expect(result.rowsToWriteBack).toEqual([{ product: fresh, adapterFieldsHash: hashCanonicalProduct(fresh) }])
    expect(result.rowsNeedingMedusaSync).toEqual([fresh])
  })

  it("excludes a row from both outputs when its merged-row hash is unchanged since last cycle (idempotency)", () => {
    const existingProduct = makeProduct({ supplierSku: "SUP-1" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashCanonicalProduct(existingProduct),
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
      // The hash stored by whatever cycle last wrote this row - i.e. the merged-row hash of the
      // Sheet's current state, exactly as it stands before this cycle runs.
      adapterFieldsHash: hashCanonicalProduct(existingProduct),
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

    expect(result.rowsToWriteBack).toEqual([{ product: fresh, adapterFieldsHash: hashCanonicalProduct(fresh) }])
    expect(result.rowsNeedingMedusaSync).toEqual([])
  })

  it("writes back a merged row whose preserved SKU is still the ADR-0004 placeholder, but excludes it from Medusa sync", () => {
    const existingProduct = makeProduct({ supplierSku: "SUP-3", sku: "acm_", productTitle: "Needs A SKU" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashCanonicalProduct(existingProduct),
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
        adapterFieldsHash: hashCanonicalProduct(existingProduct),
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
        adapterFieldsHash: hashCanonicalProduct(existingProduct),
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
        adapterFieldsHash: hashCanonicalProduct(existingProduct),
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
      adapterFieldsHash: hashCanonicalProduct(fresh),
    }

    const result = reconcileSupplierTabRows([existing], [fresh])

    expect(result.rowsToWriteBack).toEqual([{ product: fresh, adapterFieldsHash: hashCanonicalProduct(fresh) }])
    expect(result.rowsNeedingMedusaSync).toEqual([fresh])
  })

  it("does not wrongly exclude a legitimate business-chosen SKU ending in an underscore from Medusa sync", () => {
    const fresh = makeProduct({ supplierSku: "SUP-7", sku: "my-sku_" })

    const result = reconcileSupplierTabRows([], [fresh])

    expect(result.rowsNeedingMedusaSync).toEqual([fresh])
  })

  it("leaves an existing row alone (no output entries) when no fresh product matches it this cycle", () => {
    const existingProduct = makeProduct({ supplierSku: "GONE-1" })
    const existing: ExistingSheetRow = {
      product: existingProduct,
      adapterFieldsHash: hashCanonicalProduct(existingProduct),
    }

    const result = reconcileSupplierTabRows([existing], [])

    expect(result.rowsToWriteBack).toEqual([])
    expect(result.rowsNeedingMedusaSync).toEqual([])
  })
})

/**
 * ADR 0006 / issue #21: editing a Business-Owned field (e.g. Retail Price) directly in a
 * Supplier Tab never reached Medusa, because the old idempotency check hashed only `fresh` (the
 * Adapter's output) in isolation - a Business-Owned-only edit never changes that hash, so the row
 * was wrongly skipped. These four tests drive the real reconcileSupplierTabRows across two
 * simulated cycles - cycle 1 produces the row that "last cycle" would have written back, cycle 2
 * re-runs reconciliation against that state - covering every combination the fix must resolve.
 */
describe("reconcileSupplierTabRows across two cycles (issue #21, ADR 0006)", () => {
  it("only a Business-Owned field changes (a Sheet edit) between cycles -> the row is now included, with the edit preserved", () => {
    const cycle1Fresh = makeProduct({
      supplierSku: "SUP-21",
      retailPrice: 100,
      productTitle: "Original Title",
      supplierCost: 50,
    })
    const cycle1 = reconcileSupplierTabRows([], [cycle1Fresh])
    const [{ product: writtenBack, adapterFieldsHash: cycle1Hash }] = cycle1.rowsToWriteBack

    // Between cycles, the business owner edits Retail Price and Product Title directly in the
    // Sheet. The stored hash is untouched - only a sync cycle writes that - so it still carries
    // cycle 1's value.
    const sheetAfterBusinessEdit: ExistingSheetRow = {
      product: { ...writtenBack, retailPrice: 999, productTitle: "Business Edited Title" },
      adapterFieldsHash: cycle1Hash,
    }
    // The supplier's own data hasn't changed, so the Adapter reproduces the identical row.
    const cycle2Fresh = makeProduct({
      supplierSku: "SUP-21",
      retailPrice: 100,
      productTitle: "Original Title",
      supplierCost: 50,
    })

    const cycle2 = reconcileSupplierTabRows([sheetAfterBusinessEdit], [cycle2Fresh])

    expect(cycle2.rowsToWriteBack).toHaveLength(1)
    const merged = cycle2.rowsToWriteBack[0].product
    expect(merged.retailPrice).toBe(999)
    expect(merged.productTitle).toBe("Business Edited Title")
    expect(cycle2.rowsNeedingMedusaSync).toEqual([merged])
  })

  it("nothing changes between cycles -> the row is correctly skipped (no write, no Medusa sync)", () => {
    const cycle1Fresh = makeProduct({ supplierSku: "SUP-22", retailPrice: 100, supplierCost: 50 })
    const cycle1 = reconcileSupplierTabRows([], [cycle1Fresh])
    const [{ product: writtenBack, adapterFieldsHash: cycle1Hash }] = cycle1.rowsToWriteBack

    // The Sheet's current state matches exactly what cycle 1 wrote back, and the Adapter
    // reproduces the identical row - nothing changed on either side of the merge.
    const unchangedExisting: ExistingSheetRow = { product: writtenBack, adapterFieldsHash: cycle1Hash }
    const cycle2Fresh = makeProduct({ supplierSku: "SUP-22", retailPrice: 100, supplierCost: 50 })

    const cycle2 = reconcileSupplierTabRows([unchangedExisting], [cycle2Fresh])

    expect(cycle2.rowsToWriteBack).toEqual([])
    expect(cycle2.rowsNeedingMedusaSync).toEqual([])
  })

  it("only an Adapter-Owned field changes (fresh supplier data) -> the row is included, refreshed, with Business-Owned fields still preserved from existing", () => {
    const cycle1Fresh = makeProduct({
      supplierSku: "SUP-23",
      retailPrice: 100,
      productTitle: "Original Title",
      supplierCost: 50,
    })
    const cycle1 = reconcileSupplierTabRows([], [cycle1Fresh])
    const [{ product: writtenBack, adapterFieldsHash: cycle1Hash }] = cycle1.rowsToWriteBack

    // Between cycles, the business owner customizes a Business-Owned field in the Sheet, and that
    // customization was already captured by a prior sync (the stored hash reflects it).
    const businessCustomized = { ...writtenBack, retailPrice: 150, productTitle: "Business's Chosen Title" }
    const existing: ExistingSheetRow = {
      product: businessCustomized,
      adapterFieldsHash: hashCanonicalProduct(businessCustomized),
    }
    // The supplier's own data changes this cycle - only Adapter-Owned fields differ from cycle 1.
    const cycle2Fresh = makeProduct({
      supplierSku: "SUP-23",
      retailPrice: 100,
      productTitle: "Original Title",
      supplierCost: 75,
      supplierTitle: "Updated Supplier Title",
    })

    const cycle2 = reconcileSupplierTabRows([existing], [cycle2Fresh])

    expect(cycle2.rowsToWriteBack).toHaveLength(1)
    const merged = cycle2.rowsToWriteBack[0].product
    // Adapter-Owned fields refreshed from the fresh adapter output.
    expect(merged.supplierCost).toBe(75)
    expect(merged.supplierTitle).toBe("Updated Supplier Title")
    // Business-Owned fields preserved from the existing (Sheet) row, not reset to the adapter's
    // seed defaults.
    expect(merged.retailPrice).toBe(150)
    expect(merged.productTitle).toBe("Business's Chosen Title")
    expect(cycle2.rowsNeedingMedusaSync).toEqual([merged])
  })

  it("both an Adapter-Owned and a Business-Owned field change in the same cycle gap -> both are reflected in the merged output", () => {
    const cycle1Fresh = makeProduct({
      supplierSku: "SUP-24",
      retailPrice: 100,
      productTitle: "Original Title",
      supplierCost: 50,
    })
    const cycle1 = reconcileSupplierTabRows([], [cycle1Fresh])
    const [{ product: writtenBack, adapterFieldsHash: cycle1Hash }] = cycle1.rowsToWriteBack

    // A prior cycle already captured one business customization (so the stored hash matches it)...
    const previouslySynced = { ...writtenBack, retailPrice: 150 }
    const previouslySyncedHash = hashCanonicalProduct(previouslySynced)
    // ...and since then, the business owner has made a *further* edit directly in the Sheet that
    // hasn't gone through a sync cycle yet.
    const sheetAfterFurtherBusinessEdit: ExistingSheetRow = {
      product: { ...previouslySynced, productTitle: "Further Business Edit" },
      adapterFieldsHash: previouslySyncedHash,
    }
    // At the same time, the supplier's own data has also changed this cycle.
    const cycle2Fresh = makeProduct({
      supplierSku: "SUP-24",
      retailPrice: 100,
      productTitle: "Original Title",
      supplierCost: 90,
      supplierTitle: "Brand New Supplier Title",
    })

    const cycle2 = reconcileSupplierTabRows([sheetAfterFurtherBusinessEdit], [cycle2Fresh])

    expect(cycle2.rowsToWriteBack).toHaveLength(1)
    const merged = cycle2.rowsToWriteBack[0].product
    // Both changes land in the merged output.
    expect(merged.retailPrice).toBe(150)
    expect(merged.productTitle).toBe("Further Business Edit")
    expect(merged.supplierCost).toBe(90)
    expect(merged.supplierTitle).toBe("Brand New Supplier Title")
    expect(cycle2.rowsNeedingMedusaSync).toEqual([merged])
  })
})
