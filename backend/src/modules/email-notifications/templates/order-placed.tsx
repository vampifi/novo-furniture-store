import { Hr, Section, Text } from '@react-email/components'
import * as React from 'react'
import type { OrderAddressDTO, OrderDTO, OrderLineItemDTO } from '@medusajs/framework/types'
import { Base } from './base'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: unknown): data is OrderPlacedTemplateProps =>
  typeof data === 'object' && data !== null && 'order' in data && 'shippingAddress' in data

const formatCurrency = (value: unknown, currency?: string | null) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return '—'
  }

  const normalised = numeric > 1000 ? numeric / 100 : numeric
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: (currency || 'GBP').toUpperCase(),
    }).format(normalised)
  } catch {
    return `£${normalised.toFixed(2)}`
  }
}

const lineTotal = (item: OrderLineItemDTO) => {
  const base = item.subtotal ?? item.total ?? (item.unit_price ?? 0) * (item.quantity ?? 1)
  return base ?? 0
}

const formatAddress = (address?: OrderAddressDTO | null) => {
  if (!address) {
    return []
  }

  const lines: string[] = []
  const name = [address.first_name, address.last_name].filter(Boolean).join(' ').trim()
  if (name) {
    lines.push(name)
  }

  const street = [address.address_1, address.address_2].filter(Boolean).join(' ').trim()
  if (street) {
    lines.push(street)
  }

  const city = [address.city, address.province, address.postal_code].filter(Boolean).join(', ').trim()
  if (city) {
    lines.push(city)
  }

  if (address.country_code) {
    lines.push(address.country_code.toUpperCase())
  }

  return lines
}

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Your order has been placed!' }) => {
  const orderTotal = (order as any)?.summary?.raw_current_order_total?.value ?? order.total ?? 0
  const addressLines = formatAddress(shippingAddress ?? (order as any).shipping_address ?? null)

  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 16px', color: '#221C18', textAlign: 'center' }}>
          Thank you for your order
        </Text>
        <Text style={{ margin: '0 0 12px', color: '#443B33', fontSize: '14px' }}>
          Order <strong>#{order.display_id ?? order.id}</strong> was received on{' '}
          {new Date(order.created_at ?? Date.now()).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </Text>
        <Text style={{ margin: '0 0 20px', color: '#6A5C52', fontSize: '13px' }}>
          We&apos;ll send another email once your items are on their way.
        </Text>

        <Hr style={{ borderColor: '#E8DCD2', margin: '20px 0' }} />

        <Text style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#221C18' }}>Order summary</Text>
        <Text style={{ margin: '0 0 6px', color: '#443B33', fontSize: '14px' }}>
          Items: {order.items?.length ?? 0}
        </Text>
        <Text style={{ margin: '0 0 16px', color: '#443B33', fontSize: '14px' }}>
          Total paid: <strong>{formatCurrency(orderTotal, order.currency_code)}</strong>
        </Text>

        {order.items?.length ? (
          <>
            <Hr style={{ borderColor: '#E8DCD2', margin: '16px 0' }} />
            <Text style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#221C18' }}>Items</Text>
            <div style={{ border: '1px solid #E8DCD2', borderRadius: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#F5EDE5',
                  color: '#6A5C52',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                <span>Item</span>
                <span>Qty</span>
                <span>Total</span>
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderTop: '1px solid #EFE4DC',
                    color: '#221C18',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ maxWidth: '55%' }}>{item.title}</span>
                  <span>{item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(lineTotal(item), order.currency_code)}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Hr style={{ borderColor: '#E8DCD2', margin: '20px 0' }} />

        <Text style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#221C18' }}>Delivery address</Text>
        {addressLines.length ? (
          <div style={{ color: '#443B33', fontSize: '13px', lineHeight: '20px', marginBottom: '20px' }}>
            {addressLines.map((line, idx) => (
              <Text key={idx} style={{ margin: 0 }}>
                {line}
              </Text>
            ))}
          </div>
        ) : (
          <Text style={{ margin: '0 0 20px', color: '#6A5C52', fontSize: '13px' }}>
            Delivery details will appear here once confirmed.
          </Text>
        )}

        <Hr style={{ borderColor: '#E8DCD2', margin: '20px 0' }} />

        <Text style={{ margin: '0 0 8px', color: '#443B33', fontSize: '13px' }}>
          Questions about your order? Simply reply to this email and we&apos;ll be happy to help.
        </Text>
        <Text style={{ margin: 0, color: '#8C7B6F', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
          Novo Furniture · Crafted for life
        </Text>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'ord_test',
    display_id: '2105',
    created_at: new Date().toISOString(),
    currency_code: 'GBP',
    items: [
      {
        id: 'item-1',
        title: 'Highland Armchair',
        quantity: 1,
        subtotal: 65000,
      } as OrderLineItemDTO,
      {
        id: 'item-2',
        title: 'Wool Throw',
        quantity: 2,
        subtotal: 18000,
      } as OrderLineItemDTO,
    ],
    summary: {
      raw_current_order_total: {
        value: 83000,
      },
    },
  } as unknown as OrderDTO,
  shippingAddress: {
    first_name: 'Amelia',
    last_name: 'Rowe',
    address_1: '14 Kingly Street',
    city: 'London',
    province: 'London',
    postal_code: 'W1B 5PW',
    country_code: 'GB',
  } as OrderAddressDTO,
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
