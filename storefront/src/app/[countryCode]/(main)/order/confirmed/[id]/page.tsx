import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { OrderItemsSkeleton } from "@modules/order/components/items"
import { enrichLineItems } from "@lib/data/cart"
import { retrieveOrder } from "@lib/data/orders"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"

type Props = {
  params: { countryCode: string; id: string }
  searchParams?: { email?: string; orderNo?: string; orderId?: string }
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your purchase was successful",
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function resolveOrder(id: string, email?: string, attempts = 3, delayMs = 700) {
  const normalizedEmail = email ? decodeURIComponent(email).trim().toLowerCase() : undefined
  const emailsToTry = normalizedEmail ? [normalizedEmail, undefined] : [undefined]

  for (const candidateEmail of emailsToTry) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const order = await retrieveOrder(id, candidateEmail)

      if (order) {
        const enrichedItems = await enrichLineItems(order.items, order.region_id!)

        return {
          ...order,
          items: enrichedItems,
        } as unknown as HttpTypes.StoreOrder
      }

      if (attempt < attempts) {
        await wait(delayMs)
      }
    }
  }

  return null
}

function OrderFallback({
  email,
  orderId,
}: {
  email?: string
  orderId: string
}) {
  const sanitizedEmail = email ? decodeURIComponent(email).trim().toLowerCase() : undefined
  const trackOrderHref =
    `/track-order?orderId=${encodeURIComponent(orderId)}` +
    (sanitizedEmail ? `&email=${encodeURIComponent(sanitizedEmail)}` : "")

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8F3EE] py-10 sm:py-16 lg:py-20">
      <div className="content-container mx-auto flex justify-center">
        <div className="flex w-full max-w-5xl flex-col gap-8">
          <div className="overflow-hidden rounded-[32px] border border-[#E8DCD2] bg-white shadow-[0_32px_80px_rgba(34,28,24,0.12)]">
            <div className="bg-[#221C18] px-6 py-8 text-[#EFE4DC] sm:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E261F]">
                    <CheckCircleSolid className="h-6 w-6 text-[#EFE4DC]" />
                  </span>
                  <div>
                    <Heading
                      level="h1"
                      className="text-[26px] font-semibold uppercase tracking-[0.12em] text-[#EFE4DC] sm:text-3xl"
                    >
                      Thanks for your order
                    </Heading>
                    <Text className="mt-1 text-sm text-[#D6C9BF]">
                      We&apos;re wrapping things up and will send every detail
                      {sanitizedEmail ? ` to ` : ""}
                      {sanitizedEmail && (
                        <span className="font-semibold text-[#EFE4DC]">{sanitizedEmail}</span>
                      )}
                      .
                    </Text>
                  </div>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C6B9B0]">
                  Reference #{orderId}
                </div>
              </div>
            </div>

            <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-8">
                <section className="rounded-3xl border border-[#F0E6DD] bg-[#FDF8F4] p-6">
                  <Heading
                    level="h2"
                    className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]"
                  >
                    We&apos;re preparing your delivery
                  </Heading>
                  <Text className="mt-4 text-sm leading-6 text-[#443B33]">
                    Your payment cleared and the order is confirmed. We&apos;re lining up the
                    products you picked and will share a shipping update soon. Use the tracker to
                    follow progress or contact support if anything feels off.
                  </Text>
                </section>

                <section className="rounded-3xl border border-[#F0E6DD] bg-white p-6">
                  <Heading
                    level="h2"
                    className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]"
                  >
                    What you ordered
                  </Heading>
                  <Text className="mt-2 text-sm text-[#6B5B5B]">
                    Here&apos;s a quick look at the pieces in this order. Once everything&apos;s
                    packed, you&apos;ll see the full breakdown with live tracking.
                  </Text>
                  <div className="mt-5">
                    <OrderItemsSkeleton />
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-6">
                <section className="rounded-3xl border border-[#F0E6DD] bg-[#FBF6F0] p-6">
                  <Heading
                    level="h2"
                    className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8C7B6F]"
                  >
                    Order reference
                  </Heading>
                  <Text className="mt-4 font-mono text-base uppercase tracking-[0.28em] text-[#3B2F2F]">
                    {orderId}
                  </Text>
                  <Text className="mt-3 text-sm text-[#6B5B5B]">
                    Keep this handy. Customer care can locate your order instantly with this code.
                  </Text>
                </section>

                <section className="flex flex-col gap-3 rounded-3xl border border-[#F0E6DD] bg-white p-6">
                  <LocalizedClientLink
                    href={trackOrderHref}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#221C18] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#EFE4DC] transition hover:bg-[#2E261F]"
                  >
                    Track order status
                  </LocalizedClientLink>
                  <LocalizedClientLink
                    href="/"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[#E0D4C9] bg-white px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#3B2F2F] transition hover:bg-[#FDF8F4]"
                  >
                    Continue shopping
                  </LocalizedClientLink>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: Props) {
  const emailParam = searchParams?.email
  const orderIdParam =
    searchParams?.orderId || searchParams?.orderNo || params.id

  const order = await resolveOrder(params.id, emailParam)

  if (!order) {
    return (
      <OrderFallback
        email={emailParam}
        orderId={orderIdParam}
      />
    )
  }

  return <OrderCompletedTemplate order={order} />
}
