/**
 * Product-level field consistency checking (spec §8, "Product-level field consistency").
 *
 * Several canonical-schema columns are product-level in Medusa (one slot per product) despite
 * being repeated per variant row in the Sheet (spec §5's "Important caveat"): Title, Subtitle,
 * Description, Status, Tags, Categories, Collection Id, Type Id, Shipping Profile Id, Sales
 * Channel, Discountable. This module groups a supplier tab's rows by `productHandle` and checks
 * every sibling row agrees on each of those fields.
 *
 * Pure bookkeeping only, like the sibling row-reconciliation.ts - no Medusa calls, no Google
 * Sheets I/O, no default ever picked to resolve a disagreement (spec §8, "Cross-cutting
 * policy"). Callers are expected to feed this whatever CanonicalProduct rows currently make up
 * a product's full sibling set (not just the rows that changed this cycle) - this module stays
 * agnostic about where that set comes from.
 */
import type { CanonicalProduct } from "./types"

/**
 * Single source of truth for the product-level Business-Owned fields this check covers (spec
 * §5's "Important caveat" / §8), mapped to the human-readable label used in the Sync Status
 * message (spec §9) - the same short names the spec itself uses ("Title", "Tags", ...), not the
 * Sheet's paired/repeatable column names.
 */
const PRODUCT_LEVEL_FIELD_LABELS = {
  productTitle: "Title",
  subtitle: "Subtitle",
  description: "Description",
  status: "Status",
  productTags: "Tags",
  productCategories: "Categories",
  collectionId: "Collection Id",
  typeId: "Type Id",
  shippingProfileId: "Shipping Profile Id",
  salesChannel: "Sales Channel",
  discountable: "Discountable",
} as const satisfies Partial<Record<keyof CanonicalProduct, string>>

type ProductLevelField = keyof typeof PRODUCT_LEVEL_FIELD_LABELS

const PRODUCT_LEVEL_FIELDS = Object.keys(PRODUCT_LEVEL_FIELD_LABELS) as ProductLevelField[]

/** One field this specific row needs flagged in its Sync Status cell (spec §9). */
export interface ProductLevelFieldDisagreement {
  field: ProductLevelField
  /** Exact Sync Status text per spec §9's table - ready to write back as-is. */
  message: string
}

export interface ProductLevelConsistencyCheckResult {
  product: CanonicalProduct
  /**
   * False whenever *any* Business-Owned product-level field disagrees anywhere among this
   * row's siblings (same `productHandle`) - per spec §8, the whole product doesn't sync until
   * resolved, even for sibling rows that aren't individually flagged (majority rule only flags
   * the dissenting row(s) by name; non-dissenting siblings are still excluded, just silently).
   */
  readyToSync: boolean
  /**
   * Empty when `readyToSync` is true, or when this row is excluded without an individual
   * complaint (a majority-rule non-dissenting sibling of a flagged product). Otherwise one entry
   * per field this specific row needs flagged - every entry gets written to Sync Status.
   */
  disagreements: ProductLevelFieldDisagreement[]
}

/**
 * Checks every Business-Owned product-level field for agreement across sibling rows (rows
 * sharing a `productHandle`), per spec §8's majority rule: a clear majority flags only the
 * dissenting row(s); a genuine tie (no unique largest group) flags every row of that product.
 * No default is ever picked - a disagreeing product simply doesn't sync (spec §8).
 *
 * Returns one result per input row, in input order, so callers can zip the result back against
 * the rows they passed in (e.g. to filter for Medusa sync, or write Sync Status back to the
 * Sheet).
 */
export function checkProductLevelFieldConsistency(products: CanonicalProduct[]): ProductLevelConsistencyCheckResult[] {
  const siblingsByHandle = groupByHandle(products)

  // Keyed by object identity - every row in `products` is a distinct object the caller passed
  // in, so a reference is a safe, allocation-free key (no risk of two different rows colliding).
  const disagreementsByRow = new Map<CanonicalProduct, ProductLevelFieldDisagreement[]>()
  const handlesWithAnyDisagreement = new Set<string>()

  for (const [handle, siblings] of siblingsByHandle) {
    for (const row of siblings) {
      disagreementsByRow.set(row, [])
    }

    for (const field of PRODUCT_LEVEL_FIELDS) {
      const outcome = evaluateFieldAgreement(siblings, field)
      if (outcome === null) {
        continue
      }

      handlesWithAnyDisagreement.add(handle)

      if (outcome.kind === "tie") {
        for (const row of siblings) {
          disagreementsByRow.get(row)!.push({ field, message: buildTieMessage(field) })
        }
        continue
      }

      for (const row of outcome.dissentingRows) {
        disagreementsByRow.get(row)!.push({ field, message: buildDissentingRowMessage(field, outcome.majorityCount) })
      }
    }
  }

  return products.map((product) => ({
    product,
    readyToSync: !handlesWithAnyDisagreement.has(product.productHandle),
    disagreements: disagreementsByRow.get(product) ?? [],
  }))
}

function groupByHandle(products: CanonicalProduct[]): Map<string, CanonicalProduct[]> {
  const siblingsByHandle = new Map<string, CanonicalProduct[]>()
  for (const product of products) {
    const siblings = siblingsByHandle.get(product.productHandle) ?? []
    siblings.push(product)
    siblingsByHandle.set(product.productHandle, siblings)
  }
  return siblingsByHandle
}

type FieldAgreementOutcome =
  | { kind: "tie" }
  | { kind: "majority"; majorityCount: number; dissentingRows: CanonicalProduct[] }

/**
 * Groups `siblings` by their value for `field` and applies the majority rule. Returns `null`
 * when there's nothing to resolve: a single row has no siblings to disagree with, and every
 * group already agreeing collapses to one group.
 */
function evaluateFieldAgreement(siblings: CanonicalProduct[], field: ProductLevelField): FieldAgreementOutcome | null {
  if (siblings.length < 2) {
    return null
  }

  const rowsByValueKey = new Map<string, CanonicalProduct[]>()
  for (const row of siblings) {
    const key = canonicalFieldValueKey(row[field])
    const group = rowsByValueKey.get(key) ?? []
    group.push(row)
    rowsByValueKey.set(key, group)
  }

  if (rowsByValueKey.size === 1) {
    return null
  }

  const groups = [...rowsByValueKey.values()]
  const maxCount = Math.max(...groups.map((group) => group.length))
  const topGroups = groups.filter((group) => group.length === maxCount)

  if (topGroups.length > 1) {
    return { kind: "tie" }
  }

  const majorityGroup = topGroups[0]
  const dissentingRows = siblings.filter((row) => !majorityGroup.includes(row))
  return { kind: "majority", majorityCount: majorityGroup.length, dissentingRows }
}

/**
 * A comparison key for one field's value - arrays (`productTags`, `productCategories`) compare
 * as sets (sorted before stringifying), since column order in the Sheet isn't meaningful for
 * these; every other field is a plain scalar, compared by value.
 */
function canonicalFieldValueKey(value: CanonicalProduct[ProductLevelField]): string {
  if (Array.isArray(value)) {
    return JSON.stringify([...value].sort())
  }
  return JSON.stringify(value)
}

/** Exact Sync Status text for a dissenting row under the majority rule (spec §9). */
function buildDissentingRowMessage(field: ProductLevelField, majorityCount: number): string {
  return `⚠ ${PRODUCT_LEVEL_FIELD_LABELS[field]} doesn't match this product's other ${majorityCount} variants`
}

/** Exact Sync Status text for every row of a product on a genuine tie (spec §9). */
function buildTieMessage(field: ProductLevelField): string {
  return `⚠ This product's variants disagree on ${PRODUCT_LEVEL_FIELD_LABELS[field]} — check all rows, may not apply to every variant`
}
