"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-6 rounded-[32px] border border-[#E8DCD2] bg-white/95 px-5 py-6 shadow-[0px_24px_48px_rgba(68,59,51,0.12)] sm:px-8 sm:py-8">
      <div className="flex flex-col gap-2">
        <span className="uppercase text-[11px] font-semibold tracking-[0.28em] text-[#B7A598]">
          Summary
        </span>
        <Heading level="h2" className="text-[24px] leading-[32px] font-semibold text-[#221C18]">
          Order overview
        </Heading>
      </div>

      <div className="rounded-2xl border border-[#EDE1D8] bg-white px-4 py-4 shadow-[inset_0_1px_8px_rgba(234,221,210,0.45)] sm:px-5 sm:py-5">
        <DiscountCode cart={cart} />
      </div>

      <Divider className="border-[#EDE1D8]" />

      <CartTotals totals={cart} />

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="h-12 w-full rounded-full bg-[#221C18] text-[#EFE4DC] uppercase tracking-[0.2em] transition hover:bg-[#2E261F]">
          Go to checkout
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
