import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div className="flex flex-col gap-6 text-[#443B33]">
      <div className="rounded-[32px] border border-[#E8DCD2] bg-white/95 px-5 py-6 shadow-[0px_24px_48px_rgba(68,59,51,0.12)] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-2 border-b border-[#EDE1D8] pb-4">
          <span className="uppercase text-[11px] font-semibold tracking-[0.28em] text-[#B7A598]">
            Order summary
          </span>
          <Heading level="h2" className="text-[24px] leading-[32px] font-semibold text-[#221C18]">
            Review and confirm
          </Heading>
        </div>

        <div className="flex flex-col gap-6 pt-4">
          <CartTotals totals={cart} />

          <div className="rounded-2xl border border-[#EDE1D8] bg-white px-4 py-4 shadow-[inset_0_1px_8px_rgba(234,221,210,0.45)] sm:px-5">
            <div className="max-h-72 overflow-y-auto pr-1 no-scrollbar sm:pr-0">
              <ItemsPreviewTemplate items={cart?.items} />
            </div>
          </div>

          <Divider className="border-[#EDE1D8]" />

          <div className="rounded-2xl border border-[#EDE1D8] bg-white px-4 py-4 shadow-[inset_0_1px_8px_rgba(234,221,210,0.45)] sm:px-5">
            <DiscountCode cart={cart} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
