import { Metadata } from "next"
import { notFound } from "next/navigation"

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { Heading } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Checkout",
}

const fetchCart = async () => {
  const cart = await retrieveCart()
  if (!cart) {
    return notFound()
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Checkout() {
  const cart = await fetchCart()
  const customer = await getCustomer()

  return (
    <div className="bg-[#F8F3EE] py-12 sm:py-20">
      <div className="content-container flex flex-col gap-10 text-[#443B33] sm:gap-12">
        <div className="flex flex-col gap-2 sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
            Checkout
          </span>
          <Heading
            level="h1"
            className="text-[28px] leading-[38px] font-semibold uppercase tracking-[0.1em] text-[#221C18] sm:text-[40px] sm:leading-[52px]"
          >
            Complete your purchase
          </Heading>
        </div>

        <div className="grid grid-cols-1 gap-8 small:grid-cols-[minmax(0,1fr)_384px] lg:gap-12">
          <Wrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </Wrapper>

          <aside className="small:sticky small:top-24">
            <CheckoutSummary cart={cart} />
          </aside>
        </div>
      </div>
    </div>
  )
}
