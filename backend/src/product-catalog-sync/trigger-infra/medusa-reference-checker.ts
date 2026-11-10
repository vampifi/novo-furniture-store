/**
 * Real implementation of sync-cycle.ts's `findUnresolvedReferences`: which of a Supplier Tab's
 * references don't exist in Medusa. Run before applying anything, so a bad reference becomes a
 * `⚠` in Sync Status for the business owner instead of a guess or a failed apply.
 *
 * Columns labelled "Id" hold Medusa ids. Product Category holds a category handle and Sales
 * Channel holds a channel name, since those are what a person types.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { CanonicalProduct } from "../types"
import type { FindUnresolvedReferences } from "../sync-cycle"

const REFERENCE_KINDS: {
  label: string
  entity: string
  field: string
  valuesOf: (product: CanonicalProduct) => (string | null)[]
}[] = [
  { label: "Category", entity: "product_category", field: "handle", valuesOf: (product) => product.productCategories },
  { label: "Collection", entity: "product_collection", field: "id", valuesOf: (product) => [product.collectionId] },
  { label: "Type", entity: "product_type", field: "id", valuesOf: (product) => [product.typeId] },
  { label: "Shipping Profile", entity: "shipping_profile", field: "id", valuesOf: (product) => [product.shippingProfileId] },
  { label: "Sales Channel", entity: "sales_channel", field: "name", valuesOf: (product) => [product.salesChannel] },
]

export function createMedusaReferenceChecker(container: MedusaContainer): FindUnresolvedReferences {
  return async (products) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const knownValuesByKind = await Promise.all(
      REFERENCE_KINDS.map(async ({ entity, field, valuesOf }) => {
        const values = Array.from(new Set(products.flatMap(valuesOf))).filter((value): value is string => value !== null)
        if (values.length === 0) {
          return new Set<string>()
        }
        const { data } = await query.graph({ entity, fields: [field], filters: { [field]: values } })
        return new Set<string>(data.map((record: Record<string, string>) => record[field]))
      })
    )

    const unresolvedByHandle = new Map<string, string[]>()
    for (const product of products) {
      const messages = REFERENCE_KINDS.flatMap(({ label, valuesOf }, kindIndex) =>
        valuesOf(product)
          .filter((value): value is string => value !== null && !knownValuesByKind[kindIndex].has(value))
          .map((value) => `${label} "${value}" doesn't exist in Medusa`)
      )
      if (messages.length > 0) {
        unresolvedByHandle.set(product.productHandle, messages)
      }
    }
    return unresolvedByHandle
  }
}
