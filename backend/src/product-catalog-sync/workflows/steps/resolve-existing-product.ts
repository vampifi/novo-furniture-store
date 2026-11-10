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
  /** Finds the product when none of `skus` exist yet but the row belongs to an existing product. */
  handle: string
}

export type ExistingVariantBySku = {
  variantId: string
  sku: string
}

export type ExistingProductOption = {
  id: string
  title: string
  values: string[]
}

export type ResolveExistingProductStepOutput = {
  /** `null` when neither `skus` nor `handle` match anything in Medusa - this call is a create. */
  productId: string | null
  /** Only the subset of `skus` that already exist, mapped to their current variant id. */
  existingVariantsBySku: ExistingVariantBySku[]
  /**
   * The product's other variants, not named by `skus`. An update must keep listing these: Medusa
   * treats a product update's `variants` as the complete set and deletes any it doesn't see.
   */
  otherVariantIds: string[]
  existingOptions: ExistingProductOption[]
}

export const resolveExistingProductStep = createStep(
  "resolve-existing-product",
  async ({ skus, handle }: ResolveExistingProductStepInput, { container }): Promise<StepResponse<ResolveExistingProductStepOutput>> => {
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

    const { data: productsWithHandle } = variants.length
      ? { data: [] as { id: string }[] }
      : await query.graph({ entity: "product", fields: ["id"], filters: { handle } })

    const productId: string | null = variants[0]?.product_id ?? productsWithHandle[0]?.id ?? null
    const namedVariantIds = new Set(variants.map((variant: { id: string }) => variant.id))
    const { data: allProductVariants } = productId
      ? await query.graph({ entity: "product_variant", fields: ["id"], filters: { product_id: productId } })
      : { data: [] as { id: string }[] }
    const { data: productsWithOptions } = productId
      ? await query.graph({
          entity: "product",
          fields: ["options.id", "options.title", "options.values.value"],
          filters: { id: productId },
        })
      : { data: [] }

    return new StepResponse({
      productId,
      existingVariantsBySku: variants.map((variant: { id: string; sku: string }) => ({
        variantId: variant.id,
        sku: variant.sku,
      })),
      otherVariantIds: allProductVariants
        .map((variant: { id: string }) => variant.id)
        .filter((id: string) => !namedVariantIds.has(id)),
      existingOptions: (productsWithOptions[0]?.options ?? []).map((option) => ({
        id: option.id,
        title: option.title,
        values: (option.values ?? []).map((value) => value.value),
      })),
    })
  }
)
