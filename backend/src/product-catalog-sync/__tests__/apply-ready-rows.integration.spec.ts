/**
 * The true end-to-end seam for issue #16: row-reconciliation.ts -> product-level-consistency.ts
 * -> apply-ready-rows.ts, wired to the *real* apply-canonical-product workflow (issue #14) via
 * run-apply-canonical-product-workflow.ts, against a real Medusa app and local Postgres
 * (@medusajs/test-utils' medusaIntegrationTestRunner - same mechanism #14's own integration
 * suite already proves works in this environment).
 *
 * "Sandbox sheet" here is literal CanonicalProduct/ExistingSheetRow fixtures, not a real Google
 * Sheet - wiring the Sheets client (issue #12) into a live cycle is a different ticket's scope
 * (this ticket's job, per its brief, starts from row-reconciliation.ts's already-computed
 * `rowsNeedingMedusaSync` and ends at the apply workflow). MeiliSearch *indexing* itself is
 * already proven by #14's own suite - not re-asserted here, to keep this file's assertions
 * focused on what's new (SKU-based resolution, disagreement/placeholder exclusion, idempotency).
 * The container is still started per beforeAll/afterAll below because medusa-config.js
 * unconditionally wires up the real plugin once jest.integration.setup.js's MEILISEARCH_* env
 * vars are set - every integration test in this repo boots the whole app, not just this ticket's
 * module, so the app's boot-time dependency on a reachable MeiliSearch has to be satisfied
 * regardless of whether a given test file asserts on indexing.
 */
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import { reconcileSupplierTabRows } from "../row-reconciliation"
import type { ExistingSheetRow } from "../row-reconciliation"
import { applyReadyRows } from "../apply-ready-rows"
import { createApplyCanonicalProductRunner } from "../workflows/run-apply-canonical-product-workflow"
import { buildCanonicalProduct, nextTestSku } from "../test-support/canonical-product-fixture"
import { startMeilisearchTestContainer } from "../test-support/meilisearch-test-container"
import type { CanonicalProduct } from "../types"

jest.setTimeout(120000)

/**
 * The full cycle this ticket wires together (spec §8 steps 7-8, scoped to this ticket's brief):
 * reconcile against last cycle's sheet state, drop rows whose product disagrees on a
 * product-level field, group the remainder by Handle, apply each group to Medusa.
 */
async function runSyncCycle(
  existingRows: ExistingSheetRow[],
  freshProducts: CanonicalProduct[],
  applyCanonicalProduct: Parameters<typeof applyReadyRows>[1]
) {
  const { rowsNeedingMedusaSync, rowsToWriteBack } = reconcileSupplierTabRows(existingRows, freshProducts)
  const outcomes = await applyReadyRows(rowsNeedingMedusaSync, applyCanonicalProduct)
  return { outcomes, rowsToWriteBack }
}

describe("Sync Engine apply mechanism (issue #16): reconciliation -> consistency -> apply, end-to-end", () => {
  let stopMeilisearch: () => Promise<void>

  beforeAll(async () => {
    stopMeilisearch = await startMeilisearchTestContainer()
  })

  afterAll(async () => {
    await stopMeilisearch()
  })

  medusaIntegrationTestRunner({
    moduleName: "apply-ready-rows",
    testSuite: ({ getContainer }) => {
      it("creates a real Medusa product for a ready product group, resolved via SKU (not Supplier SKU)", async () => {
        const container = getContainer()
        const applyCanonicalProduct = createApplyCanonicalProductRunner(container)
        const sku = nextTestSku()
        const freshProduct = buildCanonicalProduct({ sku, supplierSku: "SUP-1", productTitle: "Oak Dining Table" })

        const { outcomes } = await runSyncCycle([], [freshProduct], applyCanonicalProduct)

        expect(outcomes).toEqual([
          { productHandle: freshProduct.productHandle, result: { outcome: "applied", productId: expect.any(String) } },
        ])

        const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
        const [product] = await productModuleService.listProducts({ handle: freshProduct.productHandle }, { relations: ["variants"] })
        expect(product.title).toBe("Oak Dining Table")
        expect(product.variants?.[0]?.sku).toBe(sku)
      })

      it(
        "updates the same Medusa product on a later cycle purely by SKU match, even when the Supplier SKU " +
          "has since changed - proving the apply-layer join is on SKU, distinct from reconciliation's own Supplier-SKU join",
        async () => {
          const container = getContainer()
          const applyCanonicalProduct = createApplyCanonicalProductRunner(container)
          const sku = nextTestSku()

          const cycle1Product = buildCanonicalProduct({ sku, supplierSku: "SUP-OLD", productTitle: "Oak Dining Table" })
          const { outcomes: firstOutcomes } = await runSyncCycle([], [cycle1Product], applyCanonicalProduct)
          const firstProductId = (firstOutcomes[0].result as { outcome: "applied"; productId: string }).productId

          // Same SKU (the real Medusa upsert key, spec §8), but the Supplier SKU this supplier
          // reports has since changed - reconciliation would treat this as a fresh/unmatched row
          // (no existing-row match on the new Supplier SKU), yet the apply layer must still
          // resolve it to the *same* Medusa product because the SKU itself is unchanged.
          const cycle2Product = buildCanonicalProduct({
            sku,
            supplierSku: "SUP-NEW",
            productTitle: "Oak Dining Table (Refurbished)",
          })
          const { outcomes: secondOutcomes } = await runSyncCycle([], [cycle2Product], applyCanonicalProduct)
          const secondProductId = (secondOutcomes[0].result as { outcome: "applied"; productId: string }).productId

          expect(secondProductId).toBe(firstProductId)

          const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
          const allProducts = await productModuleService.listProducts({}, { relations: ["variants"] })
          const matching = allProducts.filter((product) => product.variants?.some((variant) => variant.sku === sku))
          expect(matching).toHaveLength(1)
          expect(matching[0].title).toBe("Oak Dining Table (Refurbished)")
        }
      )

      it("never creates a Medusa product for a product whose sibling rows disagree on a product-level field", async () => {
        const container = getContainer()
        const applyCanonicalProduct = createApplyCanonicalProductRunner(container)
        const handle = `disagreeing-product-${nextTestSku()}`
        const rowA = buildCanonicalProduct({ productHandle: handle, status: "draft" })
        const rowB = buildCanonicalProduct({ productHandle: handle, status: "published" })

        const { outcomes } = await runSyncCycle([], [rowA, rowB], applyCanonicalProduct)

        outcomes.forEach((outcome) => expect(outcome.result.outcome).toBe("skipped"))

        const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
        const products = await productModuleService.listProducts({ handle })
        expect(products).toHaveLength(0)
      })

      it("never creates a Medusa product for a row whose SKU is still the ADR-0004 incomplete placeholder", async () => {
        const container = getContainer()
        const applyCanonicalProduct = createApplyCanonicalProductRunner(container)
        const handle = `needs-a-sku-${nextTestSku()}`
        // No Supplier SKU and an incomplete-placeholder SKU - exactly ADR 0004's shape.
        const placeholderRow = buildCanonicalProduct({ productHandle: handle, sku: "acm_", supplierSku: null })

        const { outcomes } = await runSyncCycle([], [placeholderRow], applyCanonicalProduct)

        expect(outcomes).toEqual([])

        const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
        const products = await productModuleService.listProducts({ handle })
        expect(products).toHaveLength(0)
      })

      it("makes zero calls into the apply workflow on a second cycle with unchanged data (idempotency, spec §8)", async () => {
        const container = getContainer()
        const realRunner = createApplyCanonicalProductRunner(container)
        const applyCanonicalProduct = jest.fn(realRunner)
        const sku = nextTestSku()
        const freshProduct = buildCanonicalProduct({ sku, supplierSku: "SUP-STABLE", productTitle: "Oak Dining Table" })

        const { rowsToWriteBack: firstWriteBack } = await runSyncCycle([], [freshProduct], applyCanonicalProduct)
        expect(applyCanonicalProduct).toHaveBeenCalledTimes(1)

        // Second cycle: the Supplier Tab's current state (per last cycle's write-back) against an
        // identical fresh Adapter re-run - a pure function reproducing the exact same output.
        const existingRows: ExistingSheetRow[] = firstWriteBack.map(({ product, adapterFieldsHash }) => ({
          product,
          adapterFieldsHash,
        }))
        const unchangedFreshProduct = buildCanonicalProduct({ sku, supplierSku: "SUP-STABLE", productTitle: "Oak Dining Table" })

        const { outcomes: secondOutcomes } = await runSyncCycle(existingRows, [unchangedFreshProduct], applyCanonicalProduct)

        expect(secondOutcomes).toEqual([])
        expect(applyCanonicalProduct).toHaveBeenCalledTimes(1) // still just the one call from cycle 1
      })
    },
  })
})
