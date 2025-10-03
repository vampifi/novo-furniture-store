import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export type StorefrontProductCustomAttribute = {
  id: string
  value?: string | null
  options?: string | null
  is_visible?: boolean | null
  deleted_at?: string | null
  category_custom_attribute?: {
    id: string
    label?: string | null
    key?: string | null
    type?: string | null
  } | null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query")
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: "Product id is required" })
    }

    const { data = [] } = await query.graph({
      entity: "product_custom_attributes",
      fields: [
        "id",
        "value",
        "options",
        "is_visible",
        "deleted_at",
        "category_custom_attribute.id",
        "category_custom_attribute.label",
        "category_custom_attribute.key",
        "category_custom_attribute.type",
      ],
      filters: {
        product_id: id,
      },
    })

    const product_custom_attributes = (data as StorefrontProductCustomAttribute[])
      .filter((attr) => attr && !attr.deleted_at && attr.is_visible !== false)
      .map((attr) => ({
        id: attr.id,
        value: attr.value ?? null,
        options: attr.options ?? null,
        category_custom_attribute: attr.category_custom_attribute ?? null,
      }))

    return res.json({
      product_id: id,
      product_custom_attributes,
    })
  } catch (error) {
    req.scope.resolve("logger").error(
      "storefront:failed-to-fetch-product-custom-attributes",
      error
    )

    return res.status(500).json({
      message: "Failed to load custom attributes for product",
    })
  }
}
