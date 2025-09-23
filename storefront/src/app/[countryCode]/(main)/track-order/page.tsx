import { Metadata } from "next"

import TrackOrderTemplate from "@modules/order/templates/track-order-template"

export const metadata: Metadata = {
  title: "Track My Order",
  description:
    "Check the latest delivery updates for your Novo Furniture order by entering your order number and contact details.",
}

export default function TrackOrderPage() {
  return <TrackOrderTemplate />
}
