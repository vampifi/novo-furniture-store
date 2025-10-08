"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="rounded-[28px] border border-[#E8DCD2] bg-white px-5 py-6 text-[#443B33] shadow-[0px_20px_40px_rgba(68,59,51,0.08)] sm:px-8 sm:py-8">
      <div className="flex items-center justify-between border-b border-[#EDE1D8] pb-4">
        <Heading
          level="h2"
          className={clx(
            "text-[20px] font-semibold uppercase tracking-[0.12em] text-[#221C18]",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <div className="pt-4">
          <Text className="mb-4 text-sm text-[#6A5C52]">
            Double-check your details, then place the order to finish.
          </Text>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
    </div>
  )
}

export default Review
