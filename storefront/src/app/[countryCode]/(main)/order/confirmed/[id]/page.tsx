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

async function getOrder(id: string, email?: string) {
  try {
    const order = await retrieveOrder(id, email)

    if (!order) {
      return null
    }

    const enrichedItems = await enrichLineItems(order.items, order.region_id!)

    return {
      ...order,
      items: enrichedItems,
    } as unknown as HttpTypes.StoreOrder
  } catch {
    return null
  }
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
          {sanitizedEmail ? ` to ${sanitizedEmail}` : ""}. For security reasons
          we couldn&apos;t show the full summary here, but the email includes
          every detail alongside your receipt.
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
          Need to check the status later? Use our tracker to check updates with
          your email and order number.
        </Text>
        <Link
          href={`/${countryCode}/track-order`}
          className="w-full sm:w-auto rounded-full bg-[#221C18] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#EFE4DC] transition hover:bg-[#2E261F]"
        >
          Track my order
        </Link>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your purchase was successful",
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: Props) {
  const emailParam = searchParams?.email
  const orderIdParam =
    searchParams?.orderId || searchParams?.orderNo || params.id

  const order = await getOrder(params.id, emailParam)

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
