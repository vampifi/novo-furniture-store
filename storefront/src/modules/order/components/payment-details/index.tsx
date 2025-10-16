import { Container, Heading, Text } from "@medusajs/ui"

import { isStripe, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <section className="space-y-4">
      <Heading
        level="h3"
        className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]"
      >
        Payment
      </Heading>
      {payment ? (
        <div className="grid gap-4 text-sm text-[#443B33] sm:grid-cols-2">
          <div className="space-y-1">
            <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
              Method
            </Text>
            <Text data-testid="payment-method">
              {paymentInfoMap[payment.provider_id].title}
            </Text>
          </div>
          <div className="space-y-2">
            <Text className="font-semibold uppercase tracking-[0.12em] text-[#8C7B6F]">
              Details
            </Text>
            <div className="flex items-center gap-2">
              <Container className="flex h-7 w-fit items-center rounded-full bg-[#F3ECE4] p-2">
                {paymentInfoMap[payment.provider_id].icon}
              </Container>
              <Text data-testid="payment-amount">
                {isStripe(payment.provider_id) && payment.data?.card_last4
                  ? `**** **** **** ${payment.data.card_last4}`
                  : `${convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} on ${new Date(payment.created_at ?? "").toLocaleString()}`}
              </Text>
            </div>
          </div>
        </div>
      ) : (
        <Text className="text-sm text-[#8C7B6F]">Payment information will appear here once the transaction is processed.</Text>
      )}
    </section>
  )
}

export default PaymentDetails
