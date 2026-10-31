/**
 * Builds a minimal, valid CanonicalProduct for tests, with every field defaulted so a test only
 * has to specify the handful of fields it actually cares about. Not a real Supplier Adapter
 * output - purely test scaffolding (contrast with __fixtures__/fixture-supplier-adapter.ts, which
 * is itself under test for issue #11).
 */
import type { CanonicalCustomAttribute, CanonicalProduct, CanonicalVariantOption } from "../types"

let skuCounter = 0

/** Guarantees uniqueness across tests in the same run without every call site managing counters. */
export function nextTestSku(): string {
  skuCounter += 1
  return `tst_sku_${skuCounter}`
}

export function buildCanonicalProduct(overrides: Partial<CanonicalProduct> = {}): CanonicalProduct {
  const sku = overrides.sku ?? nextTestSku()
  // Medusa product handles must be URL-safe - `sku` legitimately contains underscores (spec §5's
  // `<prefix>_<slug>` format), so the default handle below swaps them for hyphens rather than
  // reusing `sku` verbatim.
  return {
    productHandle: overrides.productHandle ?? `test-product-${sku.replace(/_/g, "-")}`,
    sku,
    supplierSku: sku,
    supplierTitle: "Test Product",
    productTitle: "Test Product",
    supplierSubtitle: null,
    subtitle: null,
    supplierDescription: null,
    description: null,
    supplierCost: null,
    retailPrice: 100,
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
    status: "published",
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

export function buildVariantOption(overrides: Partial<CanonicalVariantOption> = {}): CanonicalVariantOption {
  return {
    supplierOptionName: "Size",
    supplierOptionValue: "M",
    optionName: "Size",
    optionValue: "M",
    ...overrides,
  }
}

export function buildCustomAttribute(overrides: Partial<CanonicalCustomAttribute> = {}): CanonicalCustomAttribute {
  return {
    attributeKey: "material",
    attributeCategoryId: "cat_test",
    supplierAttributeValue: "Oak",
    attributeValue: "Oak",
    attributeVisible: true,
    ...overrides,
  }
}
