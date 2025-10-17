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

  const managesInventory =
    typeof variant.manage_inventory === "boolean"
      ? variant.manage_inventory
      : true

  if (!managesInventory) {
    return true
  }

  const allowsBackorder =
    typeof variant.allow_backorder === "boolean"
      ? variant.allow_backorder
      : false

  if (allowsBackorder) {
    return true
  }

  const hasAssignedLocation = (variant?.inventory_items ?? []).some(
    (inventoryItem: any) =>
      (inventoryItem?.inventory_levels ?? []).some(
        (level: any) => Boolean(level?.location_id)
      )
  )

  return hasAssignedLocation && (variant.inventory_quantity ?? 0) > 0
}
