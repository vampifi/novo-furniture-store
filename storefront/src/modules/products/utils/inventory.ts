import { HttpTypes } from "@medusajs/types"

type VariantLike =
  | HttpTypes.StoreProductVariant
  | (HttpTypes.StoreOrderLineItem["variant"] & {
      manage_inventory?: boolean
      allow_backorder?: boolean
      inventory_items?: any[]
      inventory_quantity?: number | null
    })

export const variantHasAvailableStock = (variant?: VariantLike | null) => {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  const inventoryQuantity =
    typeof variant.inventory_quantity === "number"
      ? variant.inventory_quantity
      : 0

  return inventoryQuantity > 0
}
