/**
 * The Sync Engine's apply mechanism (spec §7, ADR 0005): given one or more CanonicalProduct rows
 * for the same product (grouped by Handle upstream - every row here is assumed to share
 * `productHandle`), creates or updates the Medusa product/variants by composing the official
 * createProductsWorkflow/updateProductsWorkflow via `.runAsStep()`, then applies custom attribute
 * values via direct steps. A custom-attribute failure rolls back the whole saga, including the
 * product workflow, via the orchestrator's normal compensation - see
 * steps/apply-custom-attributes.ts for exactly how that step's own compensation is scoped to
 * avoid the upstream package's product-id-wide blast radius (documented there and in this
 * ticket's PR description).
 *
 * MeiliSearch propagation needs no extra step: createProductsWorkflow/updateProductsWorkflow
 * unconditionally emit `product.created`/`product.updated`, which is exactly what
 * @rokmohar/medusa-plugin-meilisearch's own subscribers listen for.
 */
import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow, createProductVariantsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import type { CanonicalProduct } from "../types"
import { resolveExistingProductStep } from "./steps/resolve-existing-product"
import { applyCustomAttributesStep } from "./steps/apply-custom-attributes"
import { buildCreateProductInput, buildNewVariantsInput, buildUpdateProductInput } from "./transforms/build-product-input"

export type ApplyCanonicalProductWorkflowInput = {
  /** One or more variant rows for the same product (spec §7: "rows grouped by Handle"). */
  products: CanonicalProduct[]
}

export type ApplyCanonicalProductWorkflowOutput = {
  productId: string
}

export const APPLY_CANONICAL_PRODUCT_WORKFLOW = "apply-canonical-product"

export const applyCanonicalProductWorkflow = createWorkflow<
  ApplyCanonicalProductWorkflowInput,
  ApplyCanonicalProductWorkflowOutput,
  []
>(APPLY_CANONICAL_PRODUCT_WORKFLOW, (input) => {
  const skus = transform({ input }, (data) => data.input.products.map((product) => product.sku))

  const handle = transform({ input }, (data) => data.input.products[0].productHandle)

  const {
    productId: existingProductId,
    existingVariantsBySku,
    otherVariantIds,
    existingOptions,
  } = resolveExistingProductStep({ skus, handle })

  const createInput = transform({ input }, (data) => buildCreateProductInput(data.input.products))
  const updateInput = transform(
    { input, existingProductId, existingVariantsBySku, otherVariantIds, existingOptions },
    (data) =>
      data.existingProductId
        ? buildUpdateProductInput(
            data.existingProductId,
            data.input.products,
            data.existingVariantsBySku,
            data.otherVariantIds,
            data.existingOptions
          )
        : null
  )
  const newVariants = transform({ input, existingProductId, existingVariantsBySku }, (data) =>
    data.existingProductId
      ? buildNewVariantsInput(data.existingProductId, data.input.products, data.existingVariantsBySku)
      : []
  )

  const created = when({ existingProductId }, ({ existingProductId }) => !existingProductId).then(() =>
    createProductsWorkflow.runAsStep({ input: { products: [createInput] } })
  )

  const updated = when({ existingProductId }, ({ existingProductId }) => !!existingProductId).then(() =>
    updateProductsWorkflow.runAsStep({ input: { products: [updateInput] } })
  )

  // After the update, which adds any new option values these variants select.
  when("add-new-variants", { newVariants }, ({ newVariants }) => newVariants.length > 0).then(() =>
    createProductVariantsWorkflow.runAsStep({ input: { product_variants: newVariants } })
  )

  const productId = transform({ created, updated }, (data) => {
    const product = data.created?.[0] ?? data.updated?.[0]
    if (!product) {
      throw new Error("applyCanonicalProductWorkflow: neither the create nor update branch produced a product")
    }
    return product.id
  })

  const customAttributes = transform({ input }, (data) => data.input.products[0]?.customAttributes ?? [])

  applyCustomAttributesStep({ productId, attributes: customAttributes })

  return new WorkflowResponse({ productId })
})
