import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text } from "@medusajs/ui"
import { cookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const isOnboarding = cookies().get("_medusa_onboarding")?.value === "true"

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8F3EE] py-10 sm:py-16 lg:py-20">
      <div className="content-container mx-auto flex w-full max-w-5xl flex-col gap-10">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="overflow-hidden rounded-[32px] border border-[#E8DCD2] bg-white shadow-[0_32px_80px_rgba(34,28,24,0.12)]"
          data-testid="order-complete-container"
        >
          <div className="bg-black px-6 py-8 text-[#EFE4DC] sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E261F]">
                  <CheckCircleSolid className="h-6 w-6 text-[#EFE4DC]" />
                </span>
                <div>
                  <Heading level="h1" className="text-[26px] font-semibold uppercase tracking-[0.12em] text-[#EFE4DC] sm:text-3xl">
                    Order confirmed
                  </Heading>
                  <Text className="mt-1 text-sm text-[#D6C9BF]">
                    We&apos;ll send updates and your receipt to {" "}
                    <span className="font-semibold text-[#EFE4DC]">{order.email}</span>.
                  </Text>
                </div>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C6B9B0]">
                Order #{order.display_id}
              </div>
            </div>
          </div>

          <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-8">
              <section className="rounded-3xl border border-[#F0E6DD] bg-[#FDF8F4] p-6">
                <Heading level="h2" className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]">
                  Order overview
                </Heading>
                <div className="mt-4 space-y-4 text-sm text-[#443B33]">
                  <OrderDetails order={order} />
                </div>
              </section>

              <section className="rounded-3xl border border-[#F0E6DD] bg-white p-4 sm:p-6">
                <Heading level="h2" className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]">
                  Items in your order
                </Heading>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#F0E6DD] bg-[#FFFCFA]">
                  <Items items={order.items} />
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-6">
              <section className="rounded-3xl border border-[#F0E6DD] bg-[#FBF6F0] p-6">
                <Heading level="h2" className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]">
                  Summary
                </Heading>
                <div className="mt-4">
                  <CartTotals totals={order} />
                </div>
              </section>

              <section className="flex flex-col gap-6 rounded-3xl border border-[#F0E6DD] bg-white p-6">
                <ShippingDetails order={order} />
                <PaymentDetails order={order} />
              </section>

              <section className="rounded-3xl border border-dashed border-[#E8DCD2] bg-white p-6">
                <Help />
              </section>

              <LocalizedClientLink
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#EFE4DC] transition hover:bg-[#2E261F]"
              >
                Continue shopping
              </LocalizedClientLink>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
