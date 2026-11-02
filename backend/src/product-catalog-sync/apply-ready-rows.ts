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
 * 2. Check product-level field consistency; exclude every row of a disagreeing product.
 * 3. Group the remainder by productHandle.
 * 4. Invoke `applyCanonicalProduct` once per group, sequentially - one product's failure is
 *    caught and reported without aborting the rest of the cycle (spec §7, "Failure granularity").
 *    Sequential rather than parallel: simpler, and avoids opening one workflow-engine transaction
 *    per product all at once against a single Postgres connection pool for no proven benefit.
 */
import { checkProductLevelFieldConsistency } from "./product-level-consistency"
import { isIncompletePlaceholderSku } from "./row-reconciliation"
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
  applyCanonicalProduct: ApplyCanonicalProductForGroup
): Promise<ApplyReadyRowsOutcome[]> {
  // Defense-in-depth on top of row-reconciliation.ts's own exclusion (ADR 0004 treats "never push
  // a placeholder-SKU row to Medusa" as a hard invariant, worth guarding twice): drop any such row
  // before it can influence grouping or the consistency check at all.
  const rows = rowsNeedingMedusaSync.filter((row) => !isIncompletePlaceholderSku(row.sku))

  const consistencyResults = checkProductLevelFieldConsistency(rows)

  const readyRows = consistencyResults.filter((result) => result.readyToSync).map((result) => result.product)
  const readyRowsByHandle = groupByHandle(readyRows)

  const notReadyHandles = new Set(
    consistencyResults.filter((result) => !result.readyToSync).map((result) => result.product.productHandle)
  )

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
