/**
 * Turns the Sheet's tag values and category handles into the ids Medusa's product workflows take.
 * Missing tags are created, since tags are only labels. Missing categories are never created:
 * the Sync Engine flags them before applying (trigger-infra/medusa-reference-checker.ts), so one
 * reaching this step means it disappeared mid-cycle, and the product must not sync.
 */
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { IProductModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type ResolveProductLinksStepInput = {
  tags: string[]
  categoryHandles: string[]
}

export type ProductLinkIds = {
  tag_ids: string[]
  category_ids: string[]
}

export const resolveProductLinksStep = createStep(
  "resolve-product-links",
  async ({ tags, categoryHandles }: ResolveProductLinksStepInput, { container }) => {
    const productModule: IProductModuleService = container.resolve(Modules.PRODUCT)

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: categories } = categoryHandles.length
      ? await query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: categoryHandles } })
      : { data: [] as { id: string; handle: string }[] }
    const missingCategories = categoryHandles.filter((handle) => !categories.some((category) => category.handle === handle))
    if (missingCategories.length > 0) {
      throw new Error(`Categories not found in Medusa: ${missingCategories.join(", ")}`)
    }

    const uniqueTags = Array.from(new Set(tags))
    const existingTags = uniqueTags.length ? await productModule.listProductTags({ value: uniqueTags }) : []
    const missingTags = uniqueTags.filter((value) => !existingTags.some((tag) => tag.value === value))
    const createdTags = missingTags.length
      ? await productModule.createProductTags(missingTags.map((value) => ({ value })))
      : []

    const linkIds: ProductLinkIds = {
      tag_ids: [...existingTags, ...createdTags].map((tag) => tag.id),
      category_ids: categories.map((category) => category.id),
    }
    return new StepResponse(linkIds, createdTags.map((tag) => tag.id))
  },
  async (createdTagIds, { container }) => {
    if (createdTagIds?.length) {
      const productModule: IProductModuleService = container.resolve(Modules.PRODUCT)
      await productModule.deleteProductTags(createdTagIds)
    }
  }
)
