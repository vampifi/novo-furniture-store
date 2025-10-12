import { Hr, Section, Text } from '@react-email/components'
import * as React from 'react'
import type {
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentLabelDTO,
  OrderAddressDTO,
  OrderDTO,
} from '@medusajs/framework/types'
import { Base } from './base'

export const ORDER_DISPATCHED = 'order-dispatched'

type FulfillmentLabelSummary = Pick<FulfillmentLabelDTO, 'id' | 'tracking_number' | 'tracking_url'>
type FulfillmentItemSummary = Pick<FulfillmentItemDTO, 'id' | 'title' | 'quantity'>

type FulfillmentForEmail = {
  id: string
  shipped_at?: FulfillmentDTO['shipped_at']
  created_at?: FulfillmentDTO['created_at']
  items: FulfillmentItemSummary[]
  labels?: FulfillmentLabelSummary[] | null
}

interface OrderDispatchedPreviewProps {
  order: OrderDTO
  fulfillment: FulfillmentForEmail
  shippingAddress?: OrderAddressDTO | null
}

export interface OrderDispatchedTemplateProps extends OrderDispatchedPreviewProps {
  preview?: string
}

export const isOrderDispatchedTemplateData = (data: unknown): data is OrderDispatchedTemplateProps =>
  typeof data === 'object' &&
  data !== null &&
  'order' in data &&
  'fulfillment' in data

const TrackingDetails = ({ labels = [] }: { labels?: FulfillmentLabelSummary[] | null }) => {
  if (!labels.length) {
    return null
  }

  return (
    <div style={{ margin: '15px 0' }}>
      <Text style={{ fontWeight: 'bold', margin: '0 0 10px' }}>Tracking information</Text>
      {labels.map((label) => (
        <div key={label.id} style={{ marginBottom: '8px' }}>
          <Text style={{ margin: '0 0 4px' }}>Tracking number: {label.tracking_number}</Text>
          {label.tracking_url && (
            <Text style={{ margin: 0 }}>Track your package: {label.tracking_url}</Text>
          )}
        </div>
      ))}
    </div>
  )
}

export const OrderDispatchedTemplate: React.FC<OrderDispatchedTemplateProps> & {
  PreviewProps: OrderDispatchedPreviewProps
} = ({ order, fulfillment, shippingAddress, preview = 'Your order is on the way!' }) => {
  const shippingRecipient = [shippingAddress?.first_name, shippingAddress?.last_name]
    .filter(Boolean)
    .join(' ')

  const items = fulfillment.items ?? []
  const labels = fulfillment.labels ?? []

  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Order on the Way
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          Hi{shippingRecipient ? ` ${shippingRecipient}` : ''},
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          Great news! Items from order #{order.display_id ?? order.id} have been dispatched and are on their way to you.
        </Text>

        <Text style={{ margin: '0 0 20px' }}>
          Shipped on: {new Date(fulfillment.shipped_at ?? fulfillment.created_at ?? new Date()).toLocaleDateString()}
        </Text>

        <TrackingDetails labels={labels} />

        <Hr style={{ margin: '20px 0' }} />

        {shippingAddress && (
          <>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
              Shipping to
            </Text>
            <Text style={{ margin: '0 0 5px' }}>
              {shippingRecipient}
            </Text>
            <Text style={{ margin: '0 0 5px' }}>
              {shippingAddress.address_1}
            </Text>
            {shippingAddress.address_2 && (
              <Text style={{ margin: '0 0 5px' }}>
                {shippingAddress.address_2}
              </Text>
            )}
            <Text style={{ margin: '0 0 5px' }}>
              {[shippingAddress.city, shippingAddress.province, shippingAddress.postal_code].filter(Boolean).join(', ')}
            </Text>
            <Text style={{ margin: '0 0 15px' }}>
              {shippingAddress.country_code}
            </Text>

            <Hr style={{ margin: '20px 0' }} />
          </>
        )}

        {items.length ? (
          <>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
              Items in this shipment
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
              </div>
              {items.map((item) => (
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
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Text style={{ margin: '20px 0 0' }}>
          We&apos;ll let you know once everything has been delivered. Thanks for shopping with us!
        </Text>
      </Section>
    </Base>
  )
}

OrderDispatchedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 456
  } as OrderDTO,
  fulfillment: {
    id: 'test-fulfillment-id',
    shipped_at: new Date(),
    created_at: new Date(),
    labels: [
      {
        id: 'label-1',
        tracking_number: 'TRACK123456',
        tracking_url: 'https://carrier.example/track/TRACK123456'
      },
    ] as FulfillmentLabelSummary[],
    items: [
      {
        id: 'item-1',
        title: 'Sneakers',
        quantity: 1
      },
    ] as FulfillmentItemSummary[],
  } as FulfillmentForEmail,
  shippingAddress: {
    first_name: 'Test',
    last_name: 'User',
    address_1: '123 Main St',
    city: 'Anytown',
    province: 'CA',
    postal_code: '12345',
    country_code: 'US'
  } as OrderAddressDTO
} as OrderDispatchedPreviewProps

export default OrderDispatchedTemplate
