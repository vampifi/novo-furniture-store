import type { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { resolveShippingAddress } from './utils/resolve-shipping-address'

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; reason?: string | null }>) {
  let notificationModuleService: INotificationModuleService | undefined

  try {
    notificationModuleService = container.resolve(Modules.NOTIFICATION)
  } catch {
    console.warn(`Notification module not configured, skipping cancel email for order ${data.id}.`)
    return
  }

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ['items', 'summary', 'shipping_address'],
  })

  const shippingAddress = await resolveShippingAddress(orderModuleService, order)

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_CANCELED,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: 'Your order has been canceled',
        },
        order,
        shippingAddress,
        reason: (data as any)?.reason ?? order.metadata?.cancellation_reason ?? null,
        preview: 'Your order has been canceled.',
      },
    })
  } catch (error) {
    console.error('Error sending order canceled notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.canceled',
}
