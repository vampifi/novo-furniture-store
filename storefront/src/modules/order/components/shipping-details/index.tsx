import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const shippingMethod = order.shipping_methods?.[0]

  return (
    <section className="space-y-4">
      <Heading
        level="h3"
        className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]"
      >
        Delivery
      </Heading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 text-sm text-[#443B33]" data-testid="shipping-address-summary">
          <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
            Shipping address
          </Text>
          <Text>
            {order.shipping_address?.first_name} {order.shipping_address?.last_name}
          </Text>
          <Text>
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text>
            {order.shipping_address?.postal_code}, {order.shipping_address?.city}
          </Text>
          <Text>{order.shipping_address?.country_code?.toUpperCase()}</Text>
        </div>

        <div className="space-y-1 text-sm text-[#443B33]" data-testid="shipping-contact-summary">
          <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
            Contact
          </Text>
          {order.shipping_address?.phone && <Text>{order.shipping_address?.phone}</Text>}
          <Text>{order.email}</Text>
        </div>

        <div className="space-y-1 text-sm text-[#443B33]" data-testid="shipping-method-summary">
          <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
            Method
          </Text>
          {shippingMethod ? (
            <Text>
              {shippingMethod.name} ({" "}
              {convertToLocale({
                amount: shippingMethod.total ?? 0,
                currency_code: order.currency_code,
              })}
              {" "})
            </Text>
          ) : (
            <Text>—</Text>
          )}
        </div>
      </div>
    </section>
  )
}

export default ShippingDetails
