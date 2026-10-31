/**
 * Unit tests for the pure CanonicalProduct -> Medusa-DTO mapping (no Medusa app needed - this is
 * exactly the kind of deterministic logic that doesn't belong in the slower, real-app integration
 * tests in workflows/__tests__/apply-canonical-product.integration.spec.ts).
 */
import { buildCanonicalProduct, buildVariantOption } from "../../../test-support/canonical-product-fixture"
import { buildCreateProductInput, buildUpdateProductInput } from "../build-product-input"

describe("buildCreateProductInput", () => {
  it("synthesizes Medusa's single-variant default option when no row has variant options", () => {
    const product = buildCanonicalProduct({ variantOptions: [] })

    const input = buildCreateProductInput([product])

    expect(input.options).toEqual([{ title: "Default option", values: ["Default option"] }])
    expect(input.variants[0].options).toEqual({ "Default option": "Default option" })
  })

  it("builds one product-level option slot per distinct option name across every variant row", () => {
    const small = buildCanonicalProduct({
      variantOptions: [buildVariantOption({ optionName: "Size", optionValue: "S" })],
    })
    const large = buildCanonicalProduct({
      variantOptions: [buildVariantOption({ optionName: "Size", optionValue: "L" })],
    })

    const input = buildCreateProductInput([small, large])

    expect(input.options).toEqual([{ title: "Size", values: ["S", "L"] }])
    expect(input.variants[0].options).toEqual({ Size: "S" })
    expect(input.variants[1].options).toEqual({ Size: "L" })
  })

  it("converts CanonicalProduct's null (spec §5 'no value') to undefined for Medusa's optional DTO fields", () => {
    const product = buildCanonicalProduct({ subtitle: null, description: null })

    const input = buildCreateProductInput([product])

    expect(input.subtitle).toBeUndefined()
    expect(input.description).toBeUndefined()
  })

  it("stashes the Supplier SKU in variant metadata for traceability (spec §5)", () => {
    const product = buildCanonicalProduct({ supplierSku: "ACME-123" })

    const input = buildCreateProductInput([product])

    expect(input.variants[0].metadata).toEqual({ supplier_sku: "ACME-123" })
  })

  it("takes representative product-level fields from the first row only (out of scope: §8 consistency check)", () => {
    const first = buildCanonicalProduct({ productTitle: "First Title" })
    const second = buildCanonicalProduct({ productTitle: "Second Title" })

    const input = buildCreateProductInput([first, second])

    expect(input.title).toBe("First Title")
  })
})

describe("buildUpdateProductInput", () => {
  it("maps each row to its already-resolved existing variant id", () => {
    const product = buildCanonicalProduct({ sku: "sku-1" })

    const input = buildUpdateProductInput("prod_123", [product], [{ variantId: "variant_1", sku: "sku-1" }])

    expect(input.id).toBe("prod_123")
    expect(input.variants).toEqual([
      {
        id: "variant_1",
        title: product.productTitle,
        sku: "sku-1",
        prices: [{ amount: product.retailPrice, currency_code: "usd" }],
        metadata: { supplier_sku: product.supplierSku },
      },
    ])
  })

  it("throws when a row's SKU has no resolved existing variant id - the caller's contract violation, not a user-facing error", () => {
    const product = buildCanonicalProduct({ sku: "sku-missing" })

    expect(() => buildUpdateProductInput("prod_123", [product], [])).toThrow(/sku-missing/)
  })
})
