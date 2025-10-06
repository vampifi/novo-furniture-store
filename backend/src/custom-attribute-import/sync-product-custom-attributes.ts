import { Modules } from "@medusajs/framework/utils"
import type { SubscriberArgs } from "@medusajs/medusa"
import type { IProductModuleService } from "@medusajs/framework/types"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

let createCategoryCustomAttributeWorkflow: any
let createProductCustomAttributeWorkflow: any
let updateProductCustomAttributeWorkflow: any

try {
  const workflows = require("@linearcommerce/product-custom-attributes/workflows")
  createCategoryCustomAttributeWorkflow = workflows.createCategoryCustomAttributeWorkflow
  createProductCustomAttributeWorkflow = workflows.createProductCustomAttributeWorkflow
  updateProductCustomAttributeWorkflow = workflows.updateProductCustomAttributeWorkflow
} catch (error) {
  const path = require("path")
  const pkgPath = require.resolve("@linearcommerce/product-custom-attributes/package.json")
  const workflowsDir = path.join(path.dirname(pkgPath), ".medusa", "server", "src", "workflows")

  createCategoryCustomAttributeWorkflow = require(path.join(workflowsDir, "create-category-custom-attribute.js")).createCategoryCustomAttributeWorkflow
  createProductCustomAttributeWorkflow = require(path.join(workflowsDir, "create-product-custom-attribute.js")).createProductCustomAttributeWorkflow
  updateProductCustomAttributeWorkflow = require(path.join(workflowsDir, "update-product-custom-attribute.js")).updateProductCustomAttributeWorkflow
}

const ATTRIBUTE_METADATA_KEY = "__import_attributes"

type ImportedAttribute = {
  key: string
  value: string
  category_id: string
  label?: string
  type?: string
  is_visible?: boolean
}

type ProductEventPayload = { id: string }

type SyncArgs = SubscriberArgs<ProductEventPayload | ProductEventPayload[]>

const normalizeAttributes = (attributes: unknown): ImportedAttribute[] => {
  if (typeof attributes === "string") {
    try {
      const parsed = JSON.parse(attributes)
      return normalizeAttributes(parsed)
    } catch (error) {
      return []
    }
  }

  if (!Array.isArray(attributes)) {
    return []
  }

  const map = new Map<string, ImportedAttribute>()

  for (const raw of attributes) {
    if (!raw || typeof raw !== "object") {
      continue
    }

    const key = String((raw as any).key ?? "").trim()
    const value = String((raw as any).value ?? "").trim()
    const categoryId = String((raw as any).category_id ?? "").trim()

    if (!key || !value || !categoryId) {
      continue
    }

    const dedupeKey = `${categoryId}::${key}`

    map.set(dedupeKey, {
      key,
      value,
      category_id: categoryId,
      label: String((raw as any).label ?? key).trim() || key,
      type: String((raw as any).type ?? "text").trim() || "text",
      is_visible:
        (typeof (raw as any).is_visible === "boolean"
          ? (raw as any).is_visible
          : String((raw as any).is_visible ?? "true").toLowerCase() !== "false") ?? true,
    })
  }

  return Array.from(map.values())
}

const normalizeKey = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")

export const syncProductCustomAttributes = async ({
  event: { data },
  container,
}: SyncArgs) => {
  const logger = container.resolve("logger")
  const payloads = (Array.isArray(data) ? data : data ? [data] : [])
    .flatMap((item) => (Array.isArray(item) ? item : [item]))

  if (!payloads.length) {
    return
  }

  const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
  const query = container.resolve("query") as any

  for (const entry of payloads) {
    if (!entry?.id) {
      continue
    }

   try {
      logger.info?.(`raw event entry: ${JSON.stringify(entry)}`)
      const product = await productModuleService.retrieveProduct(entry.id, {
        relations: ["categories"],
        select: ["id", "handle", "title", "metadata"],
      })

      const metadataAttributes =
        product.metadata?.[ATTRIBUTE_METADATA_KEY] ??
        (entry as any)?.metadata?.[ATTRIBUTE_METADATA_KEY]
      logger.info?.(
        `product ${product.id} import metadata: ${JSON.stringify(metadataAttributes)}`
      )

      let attributes = normalizeAttributes(metadataAttributes)

      const cache =
        globalThis.__customAttributeImportCache as
          | Map<string, ImportedAttribute[]>
          | undefined

      const metadataCacheKey =
        product.metadata?.__import_attributes_cache_key ||
        (entry as any)?.metadata?.__import_attributes_cache_key

      const candidateKeys = [metadataCacheKey]
        .filter(Boolean)
        .map((key) => String(key))

      if (product.handle) {
        candidateKeys.push(`handle:${product.handle}`)
      }

      if (product.title) {
        candidateKeys.push(`handle:${product.title}`)
      }

      logger.info?.(
        `candidate attribute cache keys for product ${product.id}: ${candidateKeys.join(", ")}`
      )

      for (const key of candidateKeys) {
        if (cache?.has(key)) {
          const cachedAttributes = cache.get(key) || []
          cache.delete(key)
          if (!attributes.length) {
            attributes = cachedAttributes
          } else {
            const merged = [...attributes]
            const signature = new Set(
              merged.map((attr) => `${attr.category_id}::${attr.key}`)
            )
            for (const attr of cachedAttributes) {
              const sig = `${attr.category_id}::${attr.key}`
              if (!signature.has(sig)) {
                merged.push(attr)
                signature.add(sig)
              }
            }
            attributes = merged
          }
          logger.info?.(
            `product ${product.id} recovered ${cachedAttributes.length} attribute(s) from cache key ${key}`
          )
          break
        }
      }

      if (!attributes.length) {
        logger.info?.(`product ${product.id} has no import attributes`)
        continue
      }

      const productCategoryIds = new Set(
        product.categories?.map((category: { id: string }) => category.id) || []
      )

      for (const attribute of attributes) {
        const { key, label, type, value, category_id: categoryId, is_visible: isVisible } = attribute
        logger.info?.(
          `processing attribute ${key} for product ${product.id} in category ${categoryId}`
        )

        const { data: categoryExists = [] } = await query.graph({
          entity: "product_category",
          fields: ["id"],
          filters: {
            id: categoryId,
          },
        })

        if (!categoryExists.length) {
          logger.warn(
            `Skipping attribute "${key}" for product ${product.id}: category ${categoryId} not found`
          )
          continue
        }

        productCategoryIds.add(categoryId)

        const { data: existingCategoryAttributes = [] } = await query.graph({
          entity: "category_custom_attribute",
          fields: ["id", "key", "label", "type"],
          filters: {
            category_id: categoryId,
          },
        })

        const normalizedKey = normalizeKey(key)

        const targetLabel = String(label || "").toLowerCase().trim()

        const matchedCategoryAttribute = existingCategoryAttributes.find(
          (attr: any) => {
            const attrKey = String(attr.key || "")
            const attrLabel = String(attr.label || "").toLowerCase().trim()
            return (
              attrKey === normalizedKey ||
              attrKey === key ||
              (targetLabel && attrLabel === targetLabel)
            )
          }
        )

        if (matchedCategoryAttribute) {
          logger.info?.(
            `category attribute match found for key ${key} (existing id ${matchedCategoryAttribute.id})`
          )
        }

        let categoryCustomAttributeId = matchedCategoryAttribute?.id as string | undefined

        if (!categoryCustomAttributeId) {
          const { result } = await createCategoryCustomAttributeWorkflow(container).run({
            input: {
              category_id: categoryId,
              key,
              label,
              type,
            },
          })

          categoryCustomAttributeId = result.id
        }

        const { data: existingProductAttributes = [] } = await query.graph({
          entity: "product_custom_attributes",
          fields: ["id"],
          filters: {
            product_id: product.id,
            category_custom_attribute_id: categoryCustomAttributeId,
          },
        })

       const existingProductAttributeId = existingProductAttributes[0]?.id as string | undefined

       if (existingProductAttributeId) {
         await updateProductCustomAttributeWorkflow(container).run({
           input: {
              product_custom_attributes: [
                {
                  id: existingProductAttributeId,
                  value,
                  is_visible: isVisible,
                },
              ],
            },
          })
        } else {
          const { result } = await createProductCustomAttributeWorkflow(container).run({
            input: {
              product_id: product.id,
              category_custom_attribute_id: categoryCustomAttributeId,
              value,
            },
          })

          if (isVisible === false) {
            await updateProductCustomAttributeWorkflow(container).run({
              input: {
                product_custom_attributes: [
                  {
                    id: result.id,
                    is_visible: false,
                  },
                ],
              },
            })
          }
       }

       logger.info?.(
         `product ${product.id} linked attribute ${key} (${categoryCustomAttributeId})`
       )
     }

      const sanitizedMetadata = { ...(product.metadata || {}) }
      delete sanitizedMetadata[ATTRIBUTE_METADATA_KEY]
      delete sanitizedMetadata.__import_attributes_cache_key

      await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              id: product.id,
              metadata: sanitizedMetadata,
              category_ids: Array.from(productCategoryIds),
            },
          ],
        },
      })

      const updatedProduct = await productModuleService.retrieveProduct(
        product.id,
        {
          relations: ["categories"],
          select: ["id"],
        }
      )

      logger.info(
        `product ${product.id} categories after sync: ${updatedProduct.categories
          ?.map((c: any) => c.id)
          .join(", ")}`
      )

     logger.info(
        `Applied ${attributes.length} custom attribute(s) to product ${product.id}`
      )
    } catch (error) {
      logger.warn(
        `Failed to sync custom attributes for product ${entry.id}: ${(error as Error).message}`
      )
    }
  }
}

export default syncProductCustomAttributes
