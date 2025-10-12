import type {
  IFulfillmentModuleService,
  INotificationModuleService,
  IOrderModuleService,
  OrderDTO,
} from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { resolveShippingAddress } from './utils/resolve-shipping-address'

export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }

  let notificationModuleService: INotificationModuleService | undefined

  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION)
  } catch {
    console.warn(`Notification module not configured, skipping dispatch email for order ${data.order_id}.`)
    return
  }

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

  const [order, fulfillment] = await Promise.all([
    orderModuleService.retrieveOrder(data.order_id, {
      relations: ['items', 'summary', 'shipping_address'],
    }),
    fulfillmentModuleService.retrieveFulfillment(data.fulfillment_id, {
      relations: ['items', 'labels'],
    }),
  ])

  if (!fulfillment) {
    console.warn(`Fulfillment ${data.fulfillment_id} not found for order ${data.order_id}.`)
    return
  }

  const shippingAddress = await resolveShippingAddress(orderModuleService, order)

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_DISPATCHED,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: 'Your order is on the way!',
        },
        order,
        shippingAddress,
        fulfillment,
        preview: 'Your order is on the way!',
      },
    })
  } catch (error) {
    console.error('Error sending order dispatched notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.fulfillment_created',
}
