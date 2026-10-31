/**
 * Sync Engine row matching, idempotency, and merge (spec §8, "Sync Engine Design").
 *
 * Pure bookkeeping only - no Medusa calls, no Google Sheets I/O. Given a Supplier Tab's current
 * rows and a fresh run of that supplier's Adapter, decides per row whether it's new, an edit of
 * an existing row, or unchanged, and produces the rows to write back to the Sheet plus the
 * subset that still needs to reach Medusa. Framework-free, like the sibling types.ts/validation.ts.
 */
import { createHash } from "crypto"

import type { CanonicalCustomAttribute, CanonicalProduct, CanonicalVariantOption } from "./types"

/**
 * One row of the Supplier Tab's current state, as of the last cycle it was written.
 *
 * `adapterFieldsHash` stands in for "whatever was computed and persisted last cycle". Per spec
 * §8 ("Idempotency"), this hash ultimately lives in `variant.metadata` once a row has reached
 * Medusa - but that storage location is a downstream ticket's concern (the Sync Engine orchestrator
 * sources it from wherever it's kept). This module only needs the value itself, as input data
 * attached to the existing row, and stays agnostic about where it came from.
 */
export interface ExistingSheetRow {
  product: CanonicalProduct
  adapterFieldsHash: string
}

/**
 * Single source of truth for the Business-Owned / Adapter-Owned split of CanonicalProduct's
 * top-level scalar fields (GLOSSARY.md, spec §5) - `hashAdapterOwnedFields` and `mergeProduct`
 * both draw from this one list rather than maintaining their own, so the two can't silently
 * drift apart as the schema grows. `variantOptions` and `customAttributes` are deliberately
 * excluded here - their ownership split is per-slot, not per-field (see `mergeVariantOptionSlot`
 * / `mergeCustomAttributeSlot` below), so they're handled separately in both functions.
 */
const BUSINESS_OWNED_SCALAR_FIELDS = [
  "productHandle",
  "sku",
  "productTitle",
  "subtitle",
  "description",
  "retailPrice",
  "status",
  "productTags",
  "productCategories",
  "collectionId",
  "typeId",
  "shippingProfileId",
  "salesChannel",
  "discountable",
] as const satisfies readonly (keyof CanonicalProduct)[]

const PAIRED_ARRAY_FIELDS = ["variantOptions", "customAttributes"] as const satisfies readonly (keyof CanonicalProduct)[]

function omit<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K> {
  const result: T = { ...source }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    result[key] = source[key]
  }
  return result
}

/** Deterministic hash over exactly a CanonicalProduct's Adapter-Owned field values (spec §8). */
export function hashAdapterOwnedFields(product: CanonicalProduct): string {
  const adapterOwnedScalars = omit(product, [...BUSINESS_OWNED_SCALAR_FIELDS, ...PAIRED_ARRAY_FIELDS])

  const adapterOwnedSnapshot = {
    ...adapterOwnedScalars,
    variantOptions: product.variantOptions.map((option) => ({
      supplierOptionName: option.supplierOptionName,
      supplierOptionValue: option.supplierOptionValue,
    })),
    customAttributes: product.customAttributes.map((attribute) => ({
      attributeKey: attribute.attributeKey,
      attributeCategoryId: attribute.attributeCategoryId,
      supplierAttributeValue: attribute.supplierAttributeValue,
    })),
  }

  return createHash("sha256").update(stableStringify(adapterOwnedSnapshot)).digest("hex")
}

/**
 * `JSON.stringify` with object keys sorted at every nesting level, so the result - and therefore
 * any hash over it - is stable regardless of incidental object key insertion order (which
 * `{...spread}`/`omit`/`pick` don't otherwise guarantee). Array element order is left untouched;
 * arrays here are always ordered data (e.g. `imageUrls`, variant-option/attribute slots) where
 * order is meaningful, unlike object key order, which is incidental.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value))
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep)
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

/** One row to write back to the Supplier Tab, paired with the hash to persist alongside it. */
export interface RowToWriteBack {
  product: CanonicalProduct
  adapterFieldsHash: string
}

export interface ReconciliationResult {
  /** Rows that changed since the last cycle (new or merged) - need a Sheet write-back. */
  rowsToWriteBack: RowToWriteBack[]
  /** The subset of rowsToWriteBack that also needs to reach Medusa this cycle. */
  rowsNeedingMedusaSync: CanonicalProduct[]
}

/**
 * Decides, for every fresh Adapter product against a Supplier Tab's current rows, whether it's
 * new, an edit of an existing row, or unchanged since last cycle (spec §8, steps 2-4).
 *
 * Matching is keyed on Supplier SKU (stable, never business-edited) - never on SKU itself, which
 * the business owner can rename at will (spec §8, "Two distinct matching problems").
 */
export function reconcileSupplierTabRows(
  existingRows: ExistingSheetRow[],
  freshProducts: CanonicalProduct[]
): ReconciliationResult {
  const existingBySupplierSku = new Map<string, ExistingSheetRow>()
  for (const existing of existingRows) {
    // A null Supplier SKU can never be matched to a later cycle's output (ADR 0004) - every such
    // existing row is simply never looked up, same effect as omitting it from the map.
    if (existing.product.supplierSku !== null) {
      existingBySupplierSku.set(existing.product.supplierSku, existing)
    }
  }

  const rowsToWriteBack: RowToWriteBack[] = []
  const rowsNeedingMedusaSync: CanonicalProduct[] = []

  for (const fresh of freshProducts) {
    const existingMatch = fresh.supplierSku !== null ? existingBySupplierSku.get(fresh.supplierSku) : undefined

    if (!existingMatch) {
      // New row - no identity to compare against, so there's nothing to merge or skip.
      pushRow(fresh, hashAdapterOwnedFields(fresh))
      continue
    }

    const freshHash = hashAdapterOwnedFields(fresh)
    if (freshHash === existingMatch.adapterFieldsHash) {
      // Idempotency (spec §8): the adapter is a pure function, so an unchanged hash means this
      // cycle would reproduce identical Adapter-Owned output - skip entirely, no Sheet write, no
      // Medusa call.
      continue
    }

    pushRow(mergeProduct(existingMatch.product, fresh), freshHash)
  }

  function pushRow(product: CanonicalProduct, adapterFieldsHash: string): void {
    rowsToWriteBack.push({ product, adapterFieldsHash })
    // ADR 0004: never push a row to Medusa while its SKU is still the incomplete placeholder -
    // the business owner hasn't completed it yet. The row still gets written back to the Sheet
    // so the business owner can see and complete it.
    if (!isIncompletePlaceholderSku(product.sku)) {
      rowsNeedingMedusaSync.push(product)
    }
  }

  return { rowsToWriteBack, rowsNeedingMedusaSync }
}

/**
 * True when `sku` matches the ADR-0004 incomplete-placeholder shape: `<prefix>_` with nothing
 * after the trailing underscore. Unlike `isPlaceholderSku` in validation.ts, this doesn't need a
 * supplier name - CanonicalProduct doesn't carry one, and the trailing-underscore shape alone is
 * exactly what distinguishes "no Supplier SKU to derive from" (buildDefaultSku) regardless of
 * which supplier's prefix was used.
 */
function isIncompletePlaceholderSku(sku: string): boolean {
  return sku.endsWith("_")
}

/**
 * Merges a changed fresh Adapter row into its matched existing row: Adapter-Owned fields come
 * from `fresh` (refreshed), Business-Owned fields come from `existing` (preserved, including a
 * business-renamed `sku` - this is why matching must happen on Supplier SKU, never SKU itself).
 */
function mergeProduct(existing: CanonicalProduct, fresh: CanonicalProduct): CanonicalProduct {
  return {
    ...fresh,
    // --- Business-Owned scalar fields: preserved from the existing row ---
    ...pick(existing, BUSINESS_OWNED_SCALAR_FIELDS),
    // --- Paired-array fields: merged slot-by-slot (matched by index/slot N, spec §5) ---
    variantOptions: mergeSlots(existing.variantOptions, fresh.variantOptions, mergeVariantOptionSlot),
    customAttributes: mergeSlots(existing.customAttributes, fresh.customAttributes, mergeCustomAttributeSlot),
  }
}

/**
 * Merges one paired-array field (variantOptions or customAttributes) slot-by-slot, matched by
 * array index - the sheet schema's "Option N Name" / "Attribute N Key" style columns are
 * inherently positional (spec §5).
 *
 * - A slot present in both arrays is merged via `mergeSlot` (Adapter-Owned sub-fields refreshed
 *   from fresh, Business-Owned sub-fields preserved from existing).
 * - A slot only in `fresh` (the adapter now produces more slots than before) is adopted as-is -
 *   there's nothing existing to preserve.
 * - A slot only in `existing` (the adapter now produces fewer slots than before) is preserved
 *   as-is, appended after the merged slots, rather than silently dropping business data the
 *   adapter simply stopped mentioning.
 */
function mergeSlots<TSlot>(
  existingSlots: TSlot[],
  freshSlots: TSlot[],
  mergeSlot: (existingSlot: TSlot, freshSlot: TSlot) => TSlot
): TSlot[] {
  const mergedCount = Math.min(existingSlots.length, freshSlots.length)
  const merged: TSlot[] = []

  for (let index = 0; index < mergedCount; index++) {
    merged.push(mergeSlot(existingSlots[index], freshSlots[index]))
  }

  // Whichever array is longer has the un-pairable tail - fresh extras are new, existing extras
  // are preserved (see doc comment above).
  merged.push(...freshSlots.slice(mergedCount))
  merged.push(...existingSlots.slice(mergedCount))

  return merged
}

function mergeVariantOptionSlot(
  existing: CanonicalVariantOption,
  fresh: CanonicalVariantOption
): CanonicalVariantOption {
  return {
    supplierOptionName: fresh.supplierOptionName,
    supplierOptionValue: fresh.supplierOptionValue,
    optionName: existing.optionName,
    optionValue: existing.optionValue,
  }
}

function mergeCustomAttributeSlot(
  existing: CanonicalCustomAttribute,
  fresh: CanonicalCustomAttribute
): CanonicalCustomAttribute {
  return {
    attributeKey: fresh.attributeKey,
    attributeCategoryId: fresh.attributeCategoryId,
    supplierAttributeValue: fresh.supplierAttributeValue,
    attributeValue: existing.attributeValue,
    attributeVisible: existing.attributeVisible,
  }
}
