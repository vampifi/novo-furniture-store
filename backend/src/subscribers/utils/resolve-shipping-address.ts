import type { IOrderModuleService, OrderAddressDTO, OrderDTO } from '@medusajs/framework/types'

export const resolveShippingAddress = async (
  orderModuleService: IOrderModuleService,
  order: OrderDTO
): Promise<OrderAddressDTO | undefined> => {
  const shippingAddress = order?.shipping_address as OrderAddressDTO | undefined

  if (shippingAddress?.id && (orderModuleService as any)?.orderAddressService_?.retrieve) {
    try {
      return await (orderModuleService as any).orderAddressService_.retrieve(shippingAddress.id)
    } catch (error) {
      console.warn(`Unable to retrieve shipping address ${shippingAddress.id} for order ${order.id}`, error)
    }
  }

  return shippingAddress
}
