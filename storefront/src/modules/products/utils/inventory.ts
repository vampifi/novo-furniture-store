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

  const inventoryItems = Array.isArray(variant.inventory_items)
    ? variant.inventory_items
    : []

  const inventoryLevels = inventoryItems.flatMap((inventoryItem: any) => [
    ...(Array.isArray(inventoryItem?.inventory_levels)
      ? inventoryItem.inventory_levels
      : []),
    ...(Array.isArray(inventoryItem?.location_levels)
      ? inventoryItem.location_levels
      : []),
    ...(Array.isArray(inventoryItem?.inventory?.location_levels)
      ? inventoryItem.inventory.location_levels
      : []),
  ])

  const hasAssignedLocation = inventoryLevels.some((level: any) =>
    Boolean(level?.location_id)
  )

  const inventoryQuantity =
    typeof variant.inventory_quantity === "number"
      ? variant.inventory_quantity
      : inventoryLevels.reduce((total: number, level: any) => {
          if (typeof level?.available_quantity === "number") {
            return total + level.available_quantity
          }

          const stocked =
            typeof level?.stocked_quantity === "number"
              ? level.stocked_quantity
              : 0
          const reserved =
            typeof level?.reserved_quantity === "number"
              ? level.reserved_quantity
              : 0

          return total + Math.max(stocked - reserved, 0)
        }, 0)

  return hasAssignedLocation && inventoryQuantity > 0
}
