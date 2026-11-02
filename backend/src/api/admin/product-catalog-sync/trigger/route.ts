/**
 * The Sync Engine's manual-trigger entry point (issue #19; spec §8: "a manual 'sync now' request
 * (scopable to one Supplier Tab or all of them)"). Protected by Medusa's standard admin
 * authentication, same as every other route under `/admin/*` - no extra middleware needed (see
 * src/api/middlewares.ts for this repo's only admin-side exceptions, none of which apply here).
 *
 * Contains no cycle logic of its own - exactly like the scheduled job
 * (`src/jobs/product-catalog-sync.ts`), it resolves the registered Supplier Tabs, wires up the
 * real lock and apply runner, and calls `triggerSyncCycle`, the same shared entry point.
 *
 * Request body: `{ "supplierTab"?: string }` - omit (or send `{}`) to run every registered tab;
 * pass a tab name to scope the run to just that one.
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createApplyCanonicalProductRunner } from "../../../../product-catalog-sync/workflows/run-apply-canonical-product-workflow"
import { triggerSyncCycle } from "../../../../product-catalog-sync/sync-cycle-trigger"
import type { SyncCycleScope } from "../../../../product-catalog-sync/sync-cycle-trigger"
import { createMedusaSyncCycleLock } from "../../../../product-catalog-sync/trigger-infra/medusa-locking-sync-cycle-lock"
import { getSupplierTabSyncConfigs } from "../../../../product-catalog-sync/trigger-infra/supplier-tab-registry"

function resolveScope(body: unknown): SyncCycleScope {
  const supplierTab = (body as { supplierTab?: unknown } | null)?.supplierTab
  if (typeof supplierTab === "string" && supplierTab.trim().length > 0) {
    return { tabs: "one", tabName: supplierTab }
  }
  return { tabs: "all" }
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const scope = resolveScope(req.body)

  const results = await triggerSyncCycle(scope, {
    supplierTabs: getSupplierTabSyncConfigs(req.scope),
    lock: createMedusaSyncCycleLock(req.scope),
    applyCanonicalProduct: createApplyCanonicalProductRunner(req.scope),
  })

  if (scope.tabs === "one" && results[0]?.outcome === "unknown-tab") {
    res.status(404).json({ message: `No registered Supplier Tab named "${scope.tabName}".` })
    return
  }

  res.status(200).json({ results })
}
