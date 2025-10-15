"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export async function retrieveOrder(id: string, email?: string) {
  try {
    const query: Record<string, any> = { fields: "*payment_collections.payments" }
    if (email) {
      query.email = email
    }

    const response = await sdk.store.order.retrieve(
      id,
      query as any,
      { next: { tags: ["order"] }, ...getAuthHeaders() }
    )

    return response.order
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("retrieveOrder failed", err)
    }
    return null
  }
}

export const listOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  return sdk.store.order
    .list({ limit, offset }, { next: { tags: ["order"] }, ...getAuthHeaders() })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
})
