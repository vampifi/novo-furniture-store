/**
 * Sync Status write-back (spec §9, "Validation & Write-back") - the final glue stage that turns
 * this cycle's row-reconciliation (#15) and product-level-consistency (#17) results into the
 * one `Sync Status` string per row the Sheet shows, plus the `Last Synced At` timestamp decision.
 *
 * Pure bookkeeping only, like both sibling modules - no Medusa calls, no Google Sheets I/O.
 */
import type { AdapterRowResult, CanonicalProduct } from "./types"
import type { ProductLevelConsistencyCheckResult } from "./product-level-consistency"
import type { RowToWriteBack } from "./row-reconciliation"

/** An Adapter-level validation failure (spec §6) - the `ok: false` half of `AdapterRowResult`. */
export type FailedAdapterRowResult = Extract<AdapterRowResult, { ok: false }>

/**
 * One row whose Sync Status is fully decided this cycle - never synced, so `Last Synced At` is
 * left untouched (spec §9: that timestamp only ever updates on a successful sync).
 */
export interface BlockedSyncStatusRow {
  /** `AdapterRowResult.anchor` for an Adapter-level failure, or `product.sku` otherwise. */
  anchor: string
  /** `null` only for an Adapter-level failure, which never produced a `CanonicalProduct`. */
  product: CanonicalProduct | null
  /** Exact Sync Status text per spec §9's table - ready to write back as-is. */
  status: string
}

export interface SyncStatusCycleResult {
  /** Rows to write `status` back for verbatim this cycle - never touch `Last Synced At`. */
  blockedRows: BlockedSyncStatusRow[]
  /**
   * Validation-clean rows ready for a Medusa push this cycle (spec §8 step 8). This module
   * doesn't call Medusa - once the caller's push succeeds for one of these, call
   * `buildSyncedWriteBack` to get that row's write.
   *
   * A `rowsToWriteBack` product can appear in neither this array nor `blockedRows`: a
   * non-dissenting sibling of a product another row's disagreement blocks (majority rule names
   * only the dissenting row(s), spec §8) is excluded from Medusa sync same as its flagged
   * siblings, but spec §9 prescribes no status text for it, so no write happens for it either.
   */
  readyForMedusaSync: CanonicalProduct[]
}

export interface ResolveSyncStatusForCycleInput {
  /** This cycle's Adapter output that failed outright (spec §6). */
  failedRows: readonly FailedAdapterRowResult[]
  /** From row-reconciliation (#15): rows actually changing this cycle, due a Sheet write. */
  rowsToWriteBack: readonly RowToWriteBack[]
  /**
   * From row-reconciliation (#15): the subset of `rowsToWriteBack` whose SKU isn't still the
   * ADR-0004 incomplete placeholder. A `rowsToWriteBack` product missing from here is exactly
   * the `⚠ Needs SKU` case.
   */
  rowsNeedingMedusaSync: readonly CanonicalProduct[]
  /**
   * From product-level-consistency (#17), over `rowsToWriteBack`'s products within their full
   * current sibling set. Matched back to each `rowsToWriteBack` entry by object identity
   * (`result.product`), the same convention product-level-consistency.ts itself uses - so the
   * caller must pass the identical product references through both modules.
   */
  consistencyResults: readonly ProductLevelConsistencyCheckResult[]
}

export function resolveSyncStatusForCycle(input: ResolveSyncStatusForCycleInput): SyncStatusCycleResult {
  const blockedRows: BlockedSyncStatusRow[] = input.failedRows.map((failed) => ({
    anchor: failed.anchor,
    product: null,
    status: `✗ ${failed.error}`,
  }))
  const readyForMedusaSync: CanonicalProduct[] = []

  const consistencyByProduct = new Map(input.consistencyResults.map((result) => [result.product, result]))
  const medusaEligible = new Set(input.rowsNeedingMedusaSync)

  for (const { product } of input.rowsToWriteBack) {
    const consistency = consistencyByProduct.get(product)
    if (!consistency) {
      throw new Error(
        `resolveSyncStatusForCycle: no product-level-consistency result for row with SKU "${product.sku}". ` +
          "consistencyResults must be computed over the same product references passed in rowsToWriteBack."
      )
    }

    if (consistency.disagreements.length > 0) {
      blockedRows.push({
        anchor: product.sku,
        product,
        status: consistency.disagreements.map((disagreement) => disagreement.message).join("; "),
      })
      continue
    }

    if (!consistency.readyToSync) {
      // A non-dissenting sibling of a product with an unresolved disagreement elsewhere.
      // product-level-consistency sets readyToSync: false for every row of a disagreeing
      // product, but leaves disagreements empty on rows the majority rule doesn't name
      // individually (spec §8: "only the dissenting row(s) are flagged by name"). This row must
      // still be excluded from Medusa sync - the whole product doesn't sync until resolved - but
      // spec §9 prescribes no status text for it, so it's excluded here with no invented message.
      continue
    }

    if (!medusaEligible.has(product)) {
      blockedRows.push({ anchor: product.sku, product, status: "⚠ Needs SKU" })
      continue
    }

    readyForMedusaSync.push(product)
  }

  return { blockedRows, readyForMedusaSync }
}

/**
 * Builds the write for a row whose Medusa push just succeeded this cycle (spec §8 step 9) -
 * the only situation that updates `Last Synced At` (spec §9). This module never calls Medusa
 * itself, so the caller invokes this only once it has confirmed success for a row drawn from
 * `SyncStatusCycleResult.readyForMedusaSync`.
 */
export interface SyncedWriteBack {
  status: "✓ Synced"
  lastSyncedAt: Date
}

export function buildSyncedWriteBack(syncedAt: Date): SyncedWriteBack {
  return { status: "✓ Synced", lastSyncedAt: syncedAt }
}
