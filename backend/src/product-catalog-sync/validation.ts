/**
 * Shared plausibility-check helpers for Supplier Adapters (spec §6: "shared plausibility-check
 * helpers ... every adapter calls into, rather than per-adapter reimplementation").
 *
 * These are intentionally small, atomic predicates rather than one monolithic "validate a
 * CanonicalProduct" function - different adapters validate different subsets of fields
 * depending on what their supplier actually provides (ADR 0004), so composability matters
 * more than a one-size-fits-all validator.
 */

/** True only for an actual positive, finite number - rejects NaN, Infinity, and non-numbers. */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

/** True only for a string with at least one non-whitespace character. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/** First 3 letters of the supplier name, lowercased - the SKU prefix per spec §5. */
function supplierSkuPrefix(supplierName: string): string {
  return supplierName.slice(0, 3).toLowerCase()
}

/**
 * Lowercases and collapses any run of non-alphanumeric characters into a single hyphen, with
 * leading/trailing hyphens trimmed. Shared by SKU sanitization below and by adapters deriving
 * `productHandle` from supplier text - both need the same normalization.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Deterministic SKU per spec §5 / ADR 0004: `<first 3 letters of supplier name>_<sanitized
 * supplier sku>`, or the incomplete placeholder `<prefix>_` (nothing after the underscore) when
 * there is no Supplier SKU to derive from.
 */
export function buildDefaultSku(supplierName: string, supplierSku: string | null): string {
  const prefix = supplierSkuPrefix(supplierName)
  if (!isNonEmptyString(supplierSku)) {
    return `${prefix}_`
  }
  return `${prefix}_${slugify(supplierSku)}`
}

/** True when `sku` is exactly the ADR-0004 incomplete placeholder for this supplier. */
export function isPlaceholderSku(sku: string, supplierName: string): boolean {
  return sku === `${supplierSkuPrefix(supplierName)}_`
}

/**
 * Error anchor per spec §6 ("Error anchoring") / ADR 0004: anchor to the Supplier SKU when one
 * exists, otherwise fall back to the row's position within the current parse batch - never a
 * cross-cycle row index, which isn't guaranteed stable.
 */
export function anchorForRow(row: { supplierSku: string | null; batchPosition: number }): string {
  if (isNonEmptyString(row.supplierSku)) {
    return row.supplierSku
  }
  return `batch position #${row.batchPosition}`
}
