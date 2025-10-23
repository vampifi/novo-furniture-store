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
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div
          className="space-y-2 text-sm text-[#443B33]"
          data-testid="shipping-address-summary"
        >
          <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
            Shipping address
          </Text>
          <div className="space-y-1 text-sm leading-6 text-[#3B2F2F]">
            <Text className="block break-words">
              {order.shipping_address?.first_name} {order.shipping_address?.last_name}
            </Text>
            <Text className="block break-words">
              {order.shipping_address?.address_1}
              {order.shipping_address?.address_2
                ? `, ${order.shipping_address?.address_2}`
                : ""}
            </Text>
            <Text className="block break-words">
              {order.shipping_address?.city || ""}{" "}
              {order.shipping_address?.postal_code
                ? `(${order.shipping_address?.postal_code})`
                : ""}
            </Text>
            {order.shipping_address?.province && (
              <Text className="block break-words">{order.shipping_address?.province}</Text>
            )}
            <Text className="block break-words">
              {order.shipping_address?.country_code?.toUpperCase() || "—"}
            </Text>
          </div>
        </div>

        <div
          className="space-y-2 text-sm text-[#443B33]"
          data-testid="shipping-contact-summary"
        >
          <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
            Contact
          </Text>
          <div className="space-y-1 text-sm leading-6 text-[#3B2F2F]">
            {order.shipping_address?.phone && (
              <Text className="block break-words">{order.shipping_address?.phone}</Text>
            )}
            <Text className="block break-words">{order.email}</Text>
          </div>
        </div>

        <div
          className="space-y-2 text-sm text-[#443B33]"
          data-testid="shipping-method-summary"
        >
          <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
            Method
          </Text>
          <div className="text-sm leading-6 text-[#3B2F2F]">
            {shippingMethod ? (
              <Text className="block break-words">
                {shippingMethod.name}{" "}
                <span className="text-[#8C7B6F]">
                  (
                  {convertToLocale({
                    amount: shippingMethod.total ?? 0,
                    currency_code: order.currency_code,
                  })}
                  )
                </span>
              </Text>
            ) : (
              <Text className="block">—</Text>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShippingDetails
