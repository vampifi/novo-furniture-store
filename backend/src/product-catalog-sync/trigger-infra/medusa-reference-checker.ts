/**
 * Real implementation of sync-cycle.ts's `findUnresolvedReferences`: which of a Supplier Tab's
 * references don't exist in Medusa. Run before applying anything, so a bad reference becomes a
 * `⚠` in Sync Status for the business owner instead of a guess or a failed apply.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { FindUnresolvedReferences } from "../sync-cycle"

export function createMedusaReferenceChecker(container: MedusaContainer): FindUnresolvedReferences {
  return async (products) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const handles = Array.from(new Set(products.flatMap((product) => product.productCategories)))
    const { data: categories } = handles.length
      ? await query.graph({ entity: "product_category", fields: ["handle"], filters: { handle: handles } })
      : { data: [] as { handle: string }[] }
    const knownHandles = new Set(categories.map((category) => category.handle))

    const unresolvedByHandle = new Map<string, string[]>()
    for (const product of products) {
      const messages = product.productCategories
        .filter((handle) => !knownHandles.has(handle))
        .map((handle) => `Category "${handle}" doesn't exist in Medusa`)
      if (messages.length > 0) {
        unresolvedByHandle.set(product.productHandle, messages)
      }
    }
    return unresolvedByHandle
  }
}
