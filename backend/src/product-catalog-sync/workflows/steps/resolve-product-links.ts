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
  salesChannelName: string | null
}

export type ProductLinkIds = {
  tag_ids: string[]
  category_ids: string[]
  /** Left off when the Sheet names no channel, so existing assignments stay as they are. */
  sales_channels?: { id: string }[]
}

export const resolveProductLinksStep = createStep(
  "resolve-product-links",
  async ({ tags, categoryHandles, salesChannelName }: ResolveProductLinksStepInput, { container }) => {
    const productModule: IProductModuleService = container.resolve(Modules.PRODUCT)

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: categories } = categoryHandles.length
      ? await query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: categoryHandles } })
      : { data: [] as { id: string; handle: string }[] }
    const missingCategories = categoryHandles.filter((handle) => !categories.some((category) => category.handle === handle))
    if (missingCategories.length > 0) {
      throw new Error(`Categories not found in Medusa: ${missingCategories.join(", ")}`)
    }

    const { data: salesChannels } = salesChannelName
      ? await query.graph({ entity: "sales_channel", fields: ["id"], filters: { name: salesChannelName } })
      : { data: [] as { id: string }[] }
    if (salesChannelName && salesChannels.length === 0) {
      throw new Error(`Sales channel not found in Medusa: ${salesChannelName}`)
    }

    const uniqueTags = Array.from(new Set(tags))
    const existingTags = uniqueTags.length ? await productModule.listProductTags({ value: uniqueTags }) : []
    const missingTags = uniqueTags.filter((value) => !existingTags.some((tag) => tag.value === value))
    const createdTags = missingTags.length
      ? await productModule.createProductTags(missingTags.map((value) => ({ value })))
      : []

    // Known gap: Medusa doesn't require sales channel names to be unique, so if two channels ever
    // share a name this takes whichever the query returns first, rather than flagging the product
    // as ambiguous (spec §8 cross-cutting policy). Accepted for now because the store has a single
    // sales channel; once a second one is added, make createMedusaReferenceChecker block a name
    // that matches more than one channel.
    const linkIds: ProductLinkIds = {
      tag_ids: [...existingTags, ...createdTags].map((tag) => tag.id),
      category_ids: categories.map((category) => category.id),
      ...(salesChannelName ? { sales_channels: [{ id: salesChannels[0].id }] } : {}),
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
