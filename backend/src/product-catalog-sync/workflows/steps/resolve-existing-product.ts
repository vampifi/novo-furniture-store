/**
 * Resolves whether a set of SKUs belongs to an already-existing Medusa product, per spec §7
 * ("Create vs. update: resolved via SKU lookup against Medusa's current data") and §8
 * ("Sheet row <-> Medusa variant: matched via SKU itself... the real Medusa upsert key").
 *
 * There is no SKU-based upsert path anywhere in core Medusa (confirmed against installed
 * @medusajs/product - CSVNormalizer routes by Product Id, variant upserts match by primary key
 * only), so the apply workflow must do this resolution itself before calling
 * createProductsWorkflow/updateProductsWorkflow.
 */
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type ResolveExistingProductStepInput = {
  skus: string[]
}

export type ExistingVariantBySku = {
  variantId: string
  sku: string
}

export type ResolveExistingProductStepOutput = {
  /** `null` when none of `skus` match an existing variant - this call is a create. */
  productId: string | null
  /** Only the subset of `skus` that already exist, mapped to their current variant id. */
  existingVariantsBySku: ExistingVariantBySku[]
}

export const resolveExistingProductStep = createStep(
  "resolve-existing-product",
  async ({ skus }: ResolveExistingProductStepInput, { container }): Promise<StepResponse<ResolveExistingProductStepOutput>> => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "product_id"],
      filters: { sku: skus },
    })

    const productIds = new Set(variants.map((variant: { product_id: string }) => variant.product_id))
    if (productIds.size > 1) {
      throw new Error(
        `Canonical product SKUs [${skus.join(", ")}] resolve to more than one existing Medusa product ` +
          `(${Array.from(productIds).join(", ")}) - refusing to guess which one is authoritative.`
      )
    }

    return new StepResponse({
      productId: variants[0]?.product_id ?? null,
      existingVariantsBySku: variants.map((variant: { id: string; sku: string }) => ({
        variantId: variant.id,
        sku: variant.sku,
      })),
    })
  }
)
