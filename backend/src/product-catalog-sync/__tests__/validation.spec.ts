import {
  anchorForRow,
  buildDefaultSku,
  isNonEmptyString,
  isPlaceholderSku,
  isPositiveNumber,
  slugify,
} from "../validation"

describe("isPositiveNumber", () => {
  it("accepts a positive finite number", () => {
    expect(isPositiveNumber(1)).toBe(true)
  })

  it("rejects zero", () => {
    expect(isPositiveNumber(0)).toBe(false)
  })

  it("rejects a negative number", () => {
    expect(isPositiveNumber(-5)).toBe(false)
  })

  it("rejects NaN", () => {
    expect(isPositiveNumber(Number.NaN)).toBe(false)
  })

  it("rejects Infinity", () => {
    expect(isPositiveNumber(Number.POSITIVE_INFINITY)).toBe(false)
  })

  it("rejects non-number values", () => {
    expect(isPositiveNumber("1")).toBe(false)
    expect(isPositiveNumber(null)).toBe(false)
    expect(isPositiveNumber(undefined)).toBe(false)
  })
})

describe("isNonEmptyString", () => {
  it("accepts a non-empty string", () => {
    expect(isNonEmptyString("Oak Dining Table")).toBe(true)
  })

  it("rejects an empty string", () => {
    expect(isNonEmptyString("")).toBe(false)
  })

  it("rejects a whitespace-only string", () => {
    expect(isNonEmptyString("   ")).toBe(false)
  })

  it("rejects null and undefined", () => {
    expect(isNonEmptyString(null)).toBe(false)
    expect(isNonEmptyString(undefined)).toBe(false)
  })
})

describe("buildDefaultSku", () => {
  it("builds <first 3 letters of supplier name>_<sanitized supplier sku> when a Supplier SKU exists", () => {
    expect(buildDefaultSku("Acme Furniture", "ABC-123")).toBe("acm_abc-123")
  })

  it("sanitizes punctuation/whitespace in the Supplier SKU into hyphens", () => {
    expect(buildDefaultSku("Acme Furniture", "AB 123/X")).toBe("acm_ab-123-x")
  })

  it("builds the ADR-0004 incomplete placeholder (prefix + trailing underscore, nothing after) when there is no Supplier SKU", () => {
    expect(buildDefaultSku("Acme Furniture", null)).toBe("acm_")
  })

  it("treats a blank Supplier SKU the same as no Supplier SKU", () => {
    expect(buildDefaultSku("Acme Furniture", "   ")).toBe("acm_")
  })
})

describe("isPlaceholderSku", () => {
  it("recognizes the ADR-0004 incomplete placeholder for a given supplier", () => {
    expect(isPlaceholderSku("acm_", "Acme Furniture")).toBe(true)
  })

  it("does not flag a complete SKU as a placeholder", () => {
    expect(isPlaceholderSku("acm_abc-123", "Acme Furniture")).toBe(false)
  })
})

describe("anchorForRow", () => {
  it("anchors to the Supplier SKU when one is present, per spec §6 error anchoring", () => {
    expect(anchorForRow({ supplierSku: "ABC-123", batchPosition: 4 })).toBe("ABC-123")
  })

  it("falls back to a batch-position anchor when there is no Supplier SKU (ADR 0004)", () => {
    expect(anchorForRow({ supplierSku: null, batchPosition: 4 })).toBe("batch position #4")
  })

  it("treats a blank Supplier SKU the same as no Supplier SKU", () => {
    expect(anchorForRow({ supplierSku: "   ", batchPosition: 0 })).toBe("batch position #0")
  })
})

describe("slugify", () => {
  it("lowercases and hyphenates punctuation/whitespace", () => {
    expect(slugify("Oak Dining Table")).toBe("oak-dining-table")
  })

  it("trims leading and trailing hyphens produced by leading/trailing punctuation", () => {
    expect(slugify("  --Oak Table!!  ")).toBe("oak-table")
  })
})
