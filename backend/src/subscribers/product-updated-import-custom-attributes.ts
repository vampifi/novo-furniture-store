import { SubscriberConfig } from "@medusajs/medusa"
import { syncProductCustomAttributes } from "../custom-attribute-import/sync-product-custom-attributes"

export default syncProductCustomAttributes

export const config: SubscriberConfig = {
  event: "product.updated",
}
