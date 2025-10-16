import { Metadata } from "next"
import Link from "next/link"

import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { enrichLineItems } from "@lib/data/cart"
import { retrieveOrder } from "@lib/data/orders"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

type Props = {
  params: { countryCode: string; id: string }
  searchParams?: { email?: string; orderNo?: string; orderId?: string }
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your purchase was successful",
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function resolveOrder(
  id: string,
  email?: string,
  attempts: number = 3,
  delayMs: number = 700
) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const order = await retrieveOrder(id, email)

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

  return null
}

function OrderFallback({
  email,
  orderId,
  countryCode,
}: {
  email?: string
  orderId: string
  countryCode: string
}) {
  const sanitizedEmail = email ? email.trim() : undefined

  return (
    <div className="py-10 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col gap-6 max-w-3xl">
        <Heading level="h1" className="text-3xl">
          Thanks for your order!
        </Heading>
        <Text className="text-base">
          We received your order and sent a confirmation email
          {sanitizedEmail ? ` to ${sanitizedEmail}` : ""}. Your receipt has all
          of the purchase details, and you can use the tracker below to follow
          the status.
        </Text>
        <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-6">
          <Heading level="h2" className="text-lg">
            Order reference
          </Heading>
          <Text className="mt-2 font-mono text-base uppercase tracking-wide text-ui-fg-subtle">
            {orderId}
          </Text>
        </div>
        <Text className="text-base">
          Need to check the status later? Keep this reference handy and reach
          out to support if you have any questions.
        </Text>
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
        countryCode={params.countryCode}
      />
    )
  }

  return <OrderCompletedTemplate order={order} />
}
