/**
 * The single shared entry point both triggers in issue #19 call - the Medusa scheduled job
 * (`src/jobs/product-catalog-sync.ts`) and the manual-trigger admin route
 * (`src/api/admin/product-catalog-sync/trigger/route.ts`). Neither trigger contains any cycle
 * logic itself; both just resolve a `SyncCycleScope` and call `triggerSyncCycle`.
 *
 * Owns exactly one responsibility beyond dispatch: the overlap lock (spec §8, "Trigger &
 * concurrency" - "a trigger firing mid-cycle is simply skipped, not queued"). The lock is scoped
 * per Supplier Tab, not globally - so a manual trigger for one tab is never blocked by an
 * in-progress cycle for a *different* tab in the same "all" sweep, but a tab already running
 * (whether kicked off by the schedule or a manual call) does block a second trigger for that same
 * tab, immediately and without waiting.
 *
 * Framework-free, like sync-cycle.ts: `SyncCycleLock` is injected, with `trigger-infra/` holding the
 * real Medusa-Locking-module-backed implementation.
 */
import type { FindUnresolvedReferences } from "./sync-cycle"
import { runSupplierTabSyncCycle } from "./sync-cycle"
import type { ApplyCanonicalProductForGroup } from "./apply-ready-rows"
import type { SupplierTabDefinition, SupplierTabSyncOutcome } from "./sync-cycle"

/** Which Supplier Tab(s) a trigger should run a cycle for (spec §8: "scopable to one Supplier
 * Tab or all of them"). */
export type SyncCycleScope = { tabs: "all" } | { tabs: "one"; tabName: string }

/**
 * A per-tab-name overlap lock. `acquire` must resolve `false` - never queue/wait - when the key
 * is already held: that's what makes an overlapping trigger "skipped, not queued" (spec §8)
 * rather than silently delayed until the in-progress cycle finishes.
 */
export interface SyncCycleLock {
  acquire(tabName: string): Promise<boolean>
  release(tabName: string): Promise<void>
}

export interface TriggerSyncCycleDeps {
  /** Every currently-known Supplier Tab's sync configuration, in registration order. */
  supplierTabs: readonly SupplierTabDefinition[]
  lock: SyncCycleLock
  applyCanonicalProduct: ApplyCanonicalProductForGroup
  findUnresolvedReferences?: FindUnresolvedReferences
  /** Injectable clock, forwarded to runSupplierTabSyncCycle - defaults to `() => new Date()`. */
  now?: () => Date
}

export type SyncCycleTriggerResult =
  | { tabName: string; outcome: "completed"; result: SupplierTabSyncOutcome }
  | { tabName: string; outcome: "skipped-overlap" }
  | { tabName: string; outcome: "unknown-tab" }
  | { tabName: string; outcome: "failed"; error: unknown }

function resolveTargetTabs(
  scope: SyncCycleScope,
  supplierTabs: readonly SupplierTabDefinition[]
): SupplierTabDefinition[] {
  if (scope.tabs === "all") {
    return [...supplierTabs]
  }
  return supplierTabs.filter((tab) => tab.name === scope.tabName)
}

/**
 * Runs a sync cycle for every Supplier Tab in `scope`, sequentially (same "simpler, no proven
 * benefit to parallelizing" rationale as apply-ready-rows.ts's per-product sequencing) - one
 * tab's overlap-skip or failure never affects any other tab's own run in the same sweep.
 */
export async function triggerSyncCycle(
  scope: SyncCycleScope,
  deps: TriggerSyncCycleDeps
): Promise<SyncCycleTriggerResult[]> {
  const targetTabs = resolveTargetTabs(scope, deps.supplierTabs)

  if (scope.tabs === "one" && targetTabs.length === 0) {
    return [{ tabName: scope.tabName, outcome: "unknown-tab" }]
  }

  const results: SyncCycleTriggerResult[] = []

  for (const tab of targetTabs) {
    // Step 1 of spec §8's per-cycle flow: "Acquire lock (skip if already held)."
    const acquired = await deps.lock.acquire(tab.name)
    if (!acquired) {
      results.push({ tabName: tab.name, outcome: "skipped-overlap" })
      continue
    }

    try {
      const result = await runSupplierTabSyncCycle(tab, {
        applyCanonicalProduct: deps.applyCanonicalProduct,
        findUnresolvedReferences: deps.findUnresolvedReferences,
        now: deps.now,
      })
      results.push({ tabName: tab.name, outcome: "completed", result })
    } catch (error) {
      results.push({ tabName: tab.name, outcome: "failed", error })
    } finally {
      // Step 10: "Release lock." Always runs, even on failure, so one broken cycle never
      // permanently blocks every future trigger for that tab.
      await deps.lock.release(tab.name)
    }
  }

  return results
}
