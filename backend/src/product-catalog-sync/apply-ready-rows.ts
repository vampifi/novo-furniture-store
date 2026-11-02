/**
 * Sync Engine: driving the apply mechanism from matched rows (spec §8 steps 7-8; issue #16).
 *
 * The integration glue between three already-built pieces: row-reconciliation.ts's
 * `rowsNeedingMedusaSync` (issue #15, already excludes ADR-0004 placeholder-SKU rows),
 * product-level-consistency.ts's per-row readiness check (issue #17), and the composed
 * apply-canonical-product workflow (issue #14, injected here as `applyCanonicalProduct` rather
 * than imported directly - see workflows/run-apply-canonical-product-workflow.ts for the real
 * wiring - so this module stays framework-free and unit-testable with a mock, like its sibling
 * pure-bookkeeping modules).
 *
 * Steps, per spec §8:
 * 1. Defensively drop any row whose SKU is still the ADR-0004 incomplete placeholder (belt-and-
 *    suspenders on top of row-reconciliation.ts's own exclusion - ADR 0004 treats "never reaches
 *    Medusa" as a hard invariant, worth guarding at both ends of this pipeline).
 * 2. Look up each row's already-computed product-level field consistency; exclude every row of a
 *    disagreeing product.
 * 3. Group the remainder by productHandle.
 * 4. Invoke `applyCanonicalProduct` once per group, sequentially - one product's failure is
 *    caught and reported without aborting the rest of the cycle (spec §7, "Failure granularity").
 *    Sequential rather than parallel: simpler, and avoids opening one workflow-engine transaction
 *    per product all at once against a single Postgres connection pool for no proven benefit.
 *
 * `consistencyResults` is a parameter, not computed internally (issue #19): sync-status.ts's
 * `resolveSyncStatusForCycle` (#18) needs the exact same `checkProductLevelFieldConsistency` call
 * over the exact same rows for its own Sync Status write-back. Computing it twice - once here,
 * once in the caller - was wasteful and, worse, a correctness trap: this function used to compute
 * it internally over only its own (narrower, placeholder-SKU-filtered) input, which could silently
 * disagree with a consistency check run elsewhere over the full `rowsToWriteBack` set. The real
 * sync-cycle orchestrator (sync-cycle.ts) now computes it once, over `rowsToWriteBack`'s products,
 * and passes the identical result to both this function and `resolveSyncStatusForCycle` - the same
 * object-identity-keyed contract `resolveSyncStatusForCycle` already established.
 */
import { isIncompletePlaceholderSku } from "./row-reconciliation"
import type { ProductLevelConsistencyCheckResult } from "./product-level-consistency"
import type { CanonicalProduct } from "./types"

export type ApplyCanonicalProductForGroup = (products: CanonicalProduct[]) => Promise<{ productId: string }>

export interface ApplyReadyRowsOutcome {
  productHandle: string
  result:
    | { outcome: "applied"; productId: string }
    | { outcome: "skipped"; reason: "product-level-disagreement" }
    | { outcome: "failed"; error: unknown }
}

function groupByHandle(rows: CanonicalProduct[]): Map<string, CanonicalProduct[]> {
  const rowsByHandle = new Map<string, CanonicalProduct[]>()
  for (const row of rows) {
    const group = rowsByHandle.get(row.productHandle) ?? []
    group.push(row)
    rowsByHandle.set(row.productHandle, group)
  }
  return rowsByHandle
}

export async function applyReadyRows(
  rowsNeedingMedusaSync: CanonicalProduct[],
  consistencyResults: readonly ProductLevelConsistencyCheckResult[],
  applyCanonicalProduct: ApplyCanonicalProductForGroup
): Promise<ApplyReadyRowsOutcome[]> {
  // Defense-in-depth on top of row-reconciliation.ts's own exclusion (ADR 0004 treats "never push
  // a placeholder-SKU row to Medusa" as a hard invariant, worth guarding twice): drop any such row
  // before it can influence grouping at all.
  const rows = rowsNeedingMedusaSync.filter((row) => !isIncompletePlaceholderSku(row.sku))

  // Keyed by object identity, same convention resolveSyncStatusForCycle (#18) already uses: every
  // row here is a distinct object the caller passed through from the same consistency check, so a
  // reference is a safe, allocation-free key.
  const readyToSyncByRow = new Map(consistencyResults.map((result) => [result.product, result.readyToSync]))

  function isReadyToSync(row: CanonicalProduct): boolean {
    const readyToSync = readyToSyncByRow.get(row)
    if (readyToSync === undefined) {
      throw new Error(
        `applyReadyRows: no product-level-consistency result for row with SKU "${row.sku}". ` +
          "consistencyResults must be computed over the same product references passed as rowsNeedingMedusaSync."
      )
    }
    return readyToSync
  }

  const readyRows = rows.filter(isReadyToSync)
  const readyRowsByHandle = groupByHandle(readyRows)

  const notReadyHandles = new Set(rows.filter((row) => !isReadyToSync(row)).map((row) => row.productHandle))

  const outcomes: ApplyReadyRowsOutcome[] = []
  const emittedHandles = new Set<string>()

  for (const row of rows) {
    const { productHandle } = row
    if (emittedHandles.has(productHandle)) {
      continue
    }
    emittedHandles.add(productHandle)

    if (notReadyHandles.has(productHandle)) {
      outcomes.push({ productHandle, result: { outcome: "skipped", reason: "product-level-disagreement" } })
      continue
    }

    // Per-group failure isolation (spec §7, "Failure granularity"): a product-level failure here
    // (e.g. a DB error) must not abort the rest of this cycle - every other product proceeds
    // independently, caught and reported rather than left to propagate.
    try {
      const { productId } = await applyCanonicalProduct(readyRowsByHandle.get(productHandle)!)
      outcomes.push({ productHandle, result: { outcome: "applied", productId } })
    } catch (error) {
      outcomes.push({ productHandle, result: { outcome: "failed", error } })
    }
  }

  return outcomes
}
