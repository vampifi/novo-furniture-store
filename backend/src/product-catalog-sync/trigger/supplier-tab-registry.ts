/**
 * Every Supplier Tab this Sync Engine currently knows how to run a cycle for (issue #19).
 *
 * Empty today, deliberately: no real Supplier Adapter has been onboarded yet - spec §11 lists
 * "Building each individual Supplier Adapter, one at a time" and "a concrete example Supplier
 * Tab (headers + sample rows)" as future work, and neither exists yet. The fixture adapter at
 * `../__fixtures__/fixture-supplier-adapter.ts` exists only to prove the Adapter contract (#11)
 * in tests - it's explicitly documented there as "NOT a real supplier integration" and has no
 * real Google Sheet column layout behind it, so it isn't registered here either.
 *
 * The scheduled job (`src/jobs/product-catalog-sync.ts`) and the manual-trigger admin route
 * (`src/api/admin/product-catalog-sync/trigger/route.ts`) both resolve this list via
 * `triggerSyncCycle` - so onboarding a real Supplier Tab later is purely additive: build its
 * `SupplierTabIO` (reading/writing its real Sheet range once that column layout is decided) and
 * its real `SupplierAdapter`, add one entry here, and both triggers pick it up automatically with
 * zero changes to either.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import type { SupplierTabDefinition } from "../sync-cycle"

export function getSupplierTabSyncConfigs(_container: MedusaContainer): SupplierTabDefinition[] {
  return []
}
