import { Hr, Section, Text } from '@react-email/components'
import * as React from 'react'
import type { OrderAddressDTO, OrderDTO } from '@medusajs/framework/types'
import { Base } from './base'

export const ORDER_CANCELED = 'order-canceled'

interface OrderCanceledPreviewProps {
  order: OrderDTO
  shippingAddress?: OrderAddressDTO | null
}

export interface OrderCanceledTemplateProps extends OrderCanceledPreviewProps {
  reason?: string | null
  preview?: string
}

export const isOrderCanceledTemplateData = (data: unknown): data is OrderCanceledTemplateProps =>
  typeof data === 'object' &&
  data !== null &&
  'order' in data

const formatCurrency = (value: any, currency: string | undefined) => {
  if (typeof value !== 'number') {
    return value
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(value / 100)
  } catch {
    return `${value} ${currency || ''}`.trim()
  }
}

export const OrderCanceledTemplate: React.FC<OrderCanceledTemplateProps> & {
  PreviewProps: OrderCanceledPreviewProps
} = ({ order, shippingAddress, reason, preview = 'Your order has been canceled.' }) => {
  const orderTotal =
    (order as any)?.summary?.raw_current_order_total?.value ??
    (order.total ? Number(order.total) : undefined)

  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Order Canceled
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          Hello{shippingAddress?.first_name ? ` ${shippingAddress.first_name}` : ''},
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          We wanted to let you know that order #{order.display_id ?? order.id} has been canceled.
        </Text>

        {reason && (
          <Text style={{ margin: '0 0 20px', fontStyle: 'italic' }}>
            Reason provided: {reason}
          </Text>
        )}

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Order Summary
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order ID: {order.display_id ?? order.id}
        </Text>
        {orderTotal !== undefined && (
          <Text style={{ margin: '0 0 5px' }}>
            Order Total: {formatCurrency(orderTotal, order.currency_code)}
          </Text>
        )}
        <Text style={{ margin: '0 0 20px' }}>
          Cancellation Date: {order.canceled_at ? new Date(order.canceled_at).toLocaleDateString() : new Date().toLocaleDateString()}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        {order.items?.length ? (
          <>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
              Items in this order
            </Text>
            <div
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #ddd',
                margin: '10px 0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  backgroundColor: '#f2f2f2',
                  padding: '8px',
                  borderBottom: '1px solid #ddd'
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>Item</Text>
                <Text style={{ fontWeight: 'bold' }}>Quantity</Text>
                <Text style={{ fontWeight: 'bold' }}>Price</Text>
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderBottom: '1px solid #ddd'
                  }}
                >
                  <Text>{item.title}</Text>
                  <Text>{item.quantity}</Text>
                  <Text>
                    {formatCurrency(Number(item.unit_price ?? 0) * item.quantity, order.currency_code)}
                  </Text>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ margin: '0 0 15px' }}>
          If this cancellation was unexpected or you have questions, just reply to this email and our team will be happy to help.
        </Text>
      </Section>
    </Base>
  )
}

OrderCanceledTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 123,
    currency_code: 'USD',
    canceled_at: new Date().toISOString(),
    items: [
      { id: 'item-1', title: 'Item 1', quantity: 1, unit_price: 5000 } as any,
      { id: 'item-2', title: 'Item 2', quantity: 2, unit_price: 3000 } as any
    ]
  } as OrderDTO,
  shippingAddress: {
    first_name: 'Test',
    last_name: 'User'
  } as OrderAddressDTO
} as OrderCanceledPreviewProps

export default OrderCanceledTemplate
