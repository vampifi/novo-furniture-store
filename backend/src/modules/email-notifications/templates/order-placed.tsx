import { Text, Section, Hr, Img } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import type { OrderDTO, OrderAddressDTO, OrderLineItemDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Your order has been placed!' }) => {
  const currencyCode = (order.currency_code || 'GBP').toUpperCase()

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '—'
    }

    const numericValue = Number(value)
    const normalised = numericValue > 1000 ? numericValue / 100 : numericValue

    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currencyCode
      }).format(normalised)
    } catch {
      return `£${normalised.toFixed(2)}`
    }
  }

  const orderTotal =
    (order as any)?.summary?.raw_current_order_total?.value ??
    (order.total ? Number(order.total) : undefined)

  const formatLineItemAmount = (item: OrderLineItemDTO) => {
    const raw = (item.subtotal ?? item.total ?? item.unit_price) ?? 0
    const numeric = Number(raw)
    if (Number.isNaN(numeric)) {
      return formatCurrency(0)
    }

    const adjusted = numeric > 1000 ? numeric / 100 : numeric
    return formatCurrency(adjusted)
  }

  const heroImage =
    'https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp'

  const recipientName = [
    shippingAddress?.first_name ?? order?.customer?.first_name ?? '',
    shippingAddress?.last_name ?? order?.customer?.last_name ?? ''
  ]
    .join(' ')
    .trim() || 'there'

  const shippingLines = [
    [shippingAddress?.address_1, shippingAddress?.address_2]
      .filter(Boolean)
      .join(' '),
    [shippingAddress?.city, shippingAddress?.province, shippingAddress?.postal_code]
      .filter(Boolean)
      .join(', '),
    (shippingAddress?.country_code || order?.shipping_address?.country_code)?.toUpperCase()
  ].filter((line) => Boolean(line && line.trim().length))

  return (
    <Base preview={preview}>
      <Section className="overflow-hidden rounded-2xl">
        <div className="relative">
          <Img src={heroImage} alt="Novo Furniture" className="w-full h-[200px] object-cover" />
          <div className="absolute inset-0 bg-[#221C18]/75" />
          <div className="relative px-6 py-8 text-[#EFE4DC]">
            <Text className="m-0 text-xs uppercase tracking-[0.4em] text-[#C6B9B0]">
              Order #{order.display_id}
            </Text>
            <Text className="mt-2 text-[28px] font-semibold uppercase tracking-[0.14em]">
              Thank you for shopping with Novo
            </Text>
            <Text className="mt-3 text-sm text-[#D6C9BF]">
              Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </div>
        </div>

        <div className="bg-[#F9F4EE] px-6 py-8 text-[#3F352D]">
          <Text className="m-0 text-sm">
            Hi {recipientName},
          </Text>
          <Text className="mt-3 text-sm">
            We&apos;re preparing your order and will send another email once it ships. Here&apos;s a quick snapshot of what you purchased.
          </Text>

          <div className="mt-6 rounded-2xl border border-[#E8DCD2] bg-white p-5">
            <Text className="m-0 text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
              Order summary
            </Text>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <Text className="m-0 text-[#6A5C52]">Order number</Text>
                <Text className="m-0 font-semibold text-[#221C18]">#{order.display_id}</Text>
              </div>
              <div className="flex items-center justify-between">
                <Text className="m-0 text-[#6A5C52]">Total paid</Text>
                <Text className="m-0 font-semibold text-[#221C18]">
                  {formatCurrency(orderTotal ?? order.summary.raw_current_order_total?.value ?? 0)}
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#E8DCD2] bg-white p-5">
            <Text className="m-0 text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
              Items in your order
            </Text>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#F3EAE2] text-left text-xs uppercase tracking-[0.3em] text-[#8C7B6F]">
                  <th className="p-3 font-semibold">Item</th>
                  <th className="p-3 font-semibold">Qty</th>
                  <th className="p-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#F0E6DD]">
                    <td className="p-3 align-top text-[#221C18]">
                      <Text className="m-0 font-semibold">{item.title}</Text>
                      {item.product_title && (
                        <Text className="m-0 text-xs text-[#8C7B6F]">{item.product_title}</Text>
                      )}
                    </td>
                    <td className="p-3 align-top text-[#221C18]">{item.quantity}</td>
                    <td className="p-3 align-top text-right text-[#221C18]">
                      {formatLineItemAmount(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E8DCD2] bg-white p-5 text-sm">
              <Text className="m-0 text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
                Delivery to
              </Text>
              <div className="mt-3 space-y-1">
                {shippingLines.length ? (
                  <>
                    <Text className="m-0 text-[#221C18]">{recipientName}</Text>
                    {shippingLines.map((line, index) => (
                      <Text key={index} className="m-0 text-[#6A5C52]">
                        {line}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text className="m-0 text-[#6A5C52]">
                    You&apos;ll receive a notification as soon as your order ships.
                  </Text>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8DCD2] bg-white p-5 text-sm">
              <Text className="m-0 text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
                Need a hand?
              </Text>
              <Text className="mt-3 text-[#6A5C52]">
                If you have any questions or need to make a change, simply reply to this email or call our support team.
              </Text>
            </div>
          </div>

          <Hr className="my-8 border-[#E8DCD2]" />

          <Text className="m-0 text-xs uppercase tracking-[0.35em] text-[#B4A79D]">
            Novo Furniture · Crafted for life
          </Text>
        </div>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    currency_code: 'GBP',
    items: [
      { id: 'item-1', title: 'Highland Armchair', product_title: 'Chestnut Leather', quantity: 2, unit_price: 12500 } as any,
      { id: 'item-2', title: 'Wool Throw', product_title: 'Heather Grey', quantity: 1, unit_price: 8500 } as any
    ],
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Main St',
      city: 'Anytown',
      province: 'CA',
      postal_code: '12345',
      country_code: 'US'
    },
    summary: { raw_current_order_total: { value: 33500 } }
  },
  shippingAddress: {
    first_name: 'Test',
    last_name: 'User',
    address_1: '14 Kingly Street',
    city: 'London',
    province: 'London',
    postal_code: 'W1B 5PW',
    country_code: 'GB'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
