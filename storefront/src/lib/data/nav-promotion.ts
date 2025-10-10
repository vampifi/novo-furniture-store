import { cache } from "react"

import { sdk } from "@lib/config"

export type NavPromotion = {
  id: string
  headline: string | null
  description: string | null
  code: string | null
  is_automatic: boolean
  starts_at: string | null
  ends_at: string | null
  application_method: {
    type: string | null
    target_type: string | null
    value: number | null
  } | null
}

type NavPromotionResponse = {
  promotion: NavPromotion | null
}

export const getNavPromotion = cache(async function (): Promise<NavPromotion | null> {
  try {
    const { promotion } = await sdk.client.fetch<NavPromotionResponse>(
      "/store/nav-promotion",
      {
        headers: {
          accept: "application/json",
        },
      }
    )

    return promotion ?? null
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load nav promotion", error)
    }

    return null
  }
})
