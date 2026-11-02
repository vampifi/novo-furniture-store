/**
 * The full Sync Engine cycle for one Supplier Tab (spec §8, "End-to-end flow per cycle (one
 * Supplier Tab)"; issue #19). Wires together every already-built stage:
 *
 *   read (injected) -> Adapter -> reconcile (#15) -> product-level consistency (#17, computed
 *   once) -> status resolution (#18) -> apply (#16) -> write back (injected)
 *
 * Framework-free, like every sibling module in this directory - the two concerns this module
 * genuinely doesn't own are injected as `SupplierTabIO` (how a tab's rows are actually read from
 * and written back to its backing Sheet - the per-tab column layout isn't designed yet, see spec
 * §11 "future work") and `applyCanonicalProduct` (the real composed Medusa workflow, #14/#16's
 * existing seam). That keeps this module unit-testable with fakes, and leaves the real Google
 * Sheets wiring and the real Medusa wiring as separate, swappable concerns - see
 * `trigger/` for the real implementations used by the scheduled job and the manual-trigger route.
 *
 * Issue #19's fix for a known duplication: `checkProductLevelFieldConsistency` (#17) used to be
 * called independently by apply-ready-rows.ts (#16) and by whatever computed sync-status.ts's
 * (#18) `consistencyResults` input - twice over two different (and not necessarily identical) row
 * sets. This module computes it exactly once, over `rowsToWriteBack`'s products - matching
 * sync-status.ts's own documented contract - and passes that one result to both downstream
 * consumers.
 */
import { applyReadyRows } from "./apply-ready-rows"
import type { ApplyCanonicalProductForGroup, ApplyReadyRowsOutcome } from "./apply-ready-rows"
import { checkProductLevelFieldConsistency } from "./product-level-consistency"
import { reconcileSupplierTabRows } from "./row-reconciliation"
import type { ExistingSheetRow } from "./row-reconciliation"
import { buildSyncedWriteBack, resolveSyncStatusForCycle } from "./sync-status"
import type { BlockedSyncStatusRow, SyncedWriteBack } from "./sync-status"
import type { AdapterContext, AdapterRowResult, CanonicalProduct, RawRow, SupplierAdapter } from "./types"

/** One row whose Medusa apply succeeded this cycle - ready for its Sheet write-back. */
export interface SupplierTabSyncedRow {
  product: CanonicalProduct
  writeBack: SyncedWriteBack
}

/** Everything one Supplier Tab's cycle resolved this run, ready for `SupplierTabIO.writeBack`. */
export interface SupplierTabSyncOutcome {
  tabName: string
  /** Rows to write `status` back for verbatim - never touch Last Synced At (spec §9). */
  blockedRows: BlockedSyncStatusRow[]
  /** Rows whose Medusa apply succeeded this cycle - write `✓ Synced` + Last Synced At. */
  syncedRows: SupplierTabSyncedRow[]
  /** The raw per-product apply results, for logging/observability - not all "applied" entries
   * necessarily end up in `syncedRows` by handle; this is kept for operational visibility of
   * "skipped"/"failed" outcomes the Sheet write-back intentionally says nothing about (spec §9
   * defines no Sync Status text for a post-resolution apply failure - see sync-cycle.ts's own
   * handling below). */
  applyOutcomes: ApplyReadyRowsOutcome[]
}

/**
 * The per-tab I/O seam this module depends on but doesn't implement: reading a tab's current
 * state (both the previously-synced rows needed for reconciliation, and this cycle's fresh raw
 * rows for the Adapter) and writing this cycle's resolved outcome back. The real Google-Sheets-
 * backed implementation lives in `trigger/` - deliberately not built here, since the per-tab
 * Sheet column layout isn't designed yet for any real supplier (spec §11).
 */
export interface SupplierTabIO {
  readCurrentRows(): Promise<{ existingRows: ExistingSheetRow[]; rawRows: RawRow[] }>
  writeBack(outcome: SupplierTabSyncOutcome): Promise<void>
}

/** One Supplier Tab's full configuration: what to read, how to translate it, where to write it. */
export interface SupplierTabDefinition {
  name: string
  adapter: SupplierAdapter
  context: AdapterContext
  io: SupplierTabIO
}

export interface RunSupplierTabSyncCycleDeps {
  /** The real composed apply-canonical-product workflow (#14/#16) - see
   * `workflows/run-apply-canonical-product-workflow.ts`'s `createApplyCanonicalProductRunner`,
   * which both the scheduled job and the manual-trigger route use to build this. */
  applyCanonicalProduct: ApplyCanonicalProductForGroup
  /** Injectable clock, for deterministic tests - defaults to `() => new Date()`. */
  now?: () => Date
}

function isFailedAdapterResult(result: AdapterRowResult): result is Extract<AdapterRowResult, { ok: false }> {
  return !result.ok
}

function isOkAdapterResult(result: AdapterRowResult): result is Extract<AdapterRowResult, { ok: true }> {
  return result.ok
}

/**
 * Runs one full sync cycle for a single Supplier Tab, per spec §8's end-to-end flow (steps 2-9;
 * step 1 "acquire lock" and step 10 "release lock" are the caller's concern - see
 * `sync-cycle-trigger.ts`, which wraps this function with the overlap lock for every tab it runs).
 */
export async function runSupplierTabSyncCycle(
  tab: SupplierTabDefinition,
  deps: RunSupplierTabSyncCycleDeps
): Promise<SupplierTabSyncOutcome> {
  const now = deps.now ?? (() => new Date())

  const { existingRows, rawRows } = await tab.io.readCurrentRows()
  const adapterResults = await tab.adapter(rawRows, tab.context)

  const failedRows = adapterResults.filter(isFailedAdapterResult)
  const freshProducts = adapterResults.filter(isOkAdapterResult).map((result) => result.product)

  const { rowsToWriteBack, rowsNeedingMedusaSync } = reconcileSupplierTabRows(existingRows, freshProducts)

  // Computed once (issue #19) - shared by resolveSyncStatusForCycle and applyReadyRows below,
  // rather than each independently calling checkProductLevelFieldConsistency. See this module's
  // doc comment for the correctness gap that duplication used to risk.
  const consistencyResults = checkProductLevelFieldConsistency(rowsToWriteBack.map((row) => row.product))

  const statusResult = resolveSyncStatusForCycle({
    failedRows,
    rowsToWriteBack,
    rowsNeedingMedusaSync,
    consistencyResults,
  })

  const applyOutcomes = await applyReadyRows(
    statusResult.readyForMedusaSync,
    consistencyResults,
    deps.applyCanonicalProduct
  )

  // Only a "applied" outcome gets written back as Synced. A "failed" apply (e.g. a DB error) or a
  // "skipped" one (shouldn't occur here - applyReadyRows only re-derives readiness from the same
  // consistencyResults already filtered into readyForMedusaSync - but handled defensively all the
  // same) intentionally gets no Sync Status text: spec §9 defines status text for every
  // pre-apply-known state, but not for a post-resolution apply failure. "Never silently cleared"
  // (spec §8) is satisfied by leaving whatever text is already in that cell from a prior cycle
  // untouched, rather than this module inventing new vocabulary the spec never specified.
  const appliedHandles = new Set(
    applyOutcomes.filter((outcome) => outcome.result.outcome === "applied").map((outcome) => outcome.productHandle)
  )

  const syncedAt = now()
  const syncedRows: SupplierTabSyncedRow[] = statusResult.readyForMedusaSync
    .filter((product) => appliedHandles.has(product.productHandle))
    .map((product) => ({ product, writeBack: buildSyncedWriteBack(syncedAt) }))

  const outcome: SupplierTabSyncOutcome = {
    tabName: tab.name,
    blockedRows: statusResult.blockedRows,
    syncedRows,
    applyOutcomes,
  }

  await tab.io.writeBack(outcome)

  return outcome
}
