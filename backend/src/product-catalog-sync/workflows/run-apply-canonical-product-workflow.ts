/**
 * Real wiring between apply-ready-rows.ts's injected `applyCanonicalProduct` seam and the actual
 * Medusa workflow (issue #14). Deliberately the only place that seam is closed over a real
 * container - apply-ready-rows.ts itself stays framework-free and unit-testable with a mock (see
 * its own file), so this one-line adapter is what a real caller (a scheduled job, a manual-sync
 * route - both future tickets, spec §8) wires up instead.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import type { ApplyCanonicalProductForGroup } from "../apply-ready-rows"
import { applyCanonicalProductWorkflow } from "./apply-canonical-product"

export function createApplyCanonicalProductRunner(container: MedusaContainer): ApplyCanonicalProductForGroup {
  return async (products) => {
    const { result } = await applyCanonicalProductWorkflow(container).run({ input: { products } })
    return result
  }
}
