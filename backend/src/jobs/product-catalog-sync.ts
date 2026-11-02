/**
 * The Sync Engine's scheduled trigger (issue #19; spec §8: "Scheduled polling ... every 30-60s").
 *
 * Contains no cycle logic of its own - it resolves the currently-registered Supplier Tabs
 * (trigger/supplier-tab-registry.ts), wires up the real overlap lock and the real
 * apply-canonical-product runner, and calls `triggerSyncCycle`, the exact same shared entry
 * point the manual-trigger admin route calls
 * (`src/api/admin/product-catalog-sync/trigger/route.ts`).
 *
 * Per this repo's own research into Medusa's scheduled-job machinery (consulted while building
 * this ticket): a scheduled job gets no automatic retry on failure and no built-in overlap guard
 * - which is exactly why `triggerSyncCycle`'s own lock (not Medusa's job scheduler) is what
 * prevents two ticks from running the same tab's cycle concurrently if one tick runs long.
 */
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createApplyCanonicalProductRunner } from "../product-catalog-sync/workflows/run-apply-canonical-product-workflow"
import { triggerSyncCycle } from "../product-catalog-sync/sync-cycle-trigger"
import { createMedusaSyncCycleLock } from "../product-catalog-sync/trigger/medusa-locking-sync-cycle-lock"
import { getSupplierTabSyncConfigs } from "../product-catalog-sync/trigger/supplier-tab-registry"

export default async function productCatalogSyncJob(container: MedusaContainer): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const results = await triggerSyncCycle(
    { tabs: "all" },
    {
      supplierTabs: getSupplierTabSyncConfigs(container),
      lock: createMedusaSyncCycleLock(container),
      applyCanonicalProduct: createApplyCanonicalProductRunner(container),
    }
  )

  for (const result of results) {
    if (result.outcome === "skipped-overlap") {
      logger.info(`[product-catalog-sync] "${result.tabName}" cycle already running - skipped this tick.`)
    } else if (result.outcome === "failed") {
      logger.error(`[product-catalog-sync] "${result.tabName}" cycle failed.`, result.error as Error)
    } else if (result.outcome === "completed") {
      logger.info(
        `[product-catalog-sync] "${result.tabName}" cycle completed: ` +
          `${result.result.syncedRows.length} synced, ${result.result.blockedRows.length} blocked.`
      )
    }
  }
}

export const config = {
  name: "product-catalog-sync",
  // spec §8: "every 30-60s". 60s keeps the Google Sheets API batch calls comfortably under quota
  // (research notes: 1 batchGet + 1 batchUpdate per cycle regardless of tab count).
  schedule: { interval: 60_000 },
}
