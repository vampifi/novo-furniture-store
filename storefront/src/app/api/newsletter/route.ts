import { NextRequest, NextResponse } from "next/server"

import { sdk } from "@lib/config"

type NewsletterPayload = {
  email?: string
  first_name?: string
  last_name?: string
}

const isValidEmail = (value?: unknown): value is string =>
  typeof value === "string" && /\S+@\S+\.\S+/.test(value.trim())

export async function POST(req: NextRequest) {
  const body = ((await req.json().catch(() => ({}))) ??
    {}) as NewsletterPayload

  if (!isValidEmail(body.email)) {
    return NextResponse.json(
      { message: "Please enter a valid email address." },
      { status: 400 }
    )
  }

  try {
    const response = await sdk.client.fetch<{ message?: string }>(
      "/store/newsletter",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: {
          email: body.email.trim().toLowerCase(),
          first_name: body.first_name,
          last_name: body.last_name,
        },
      }
    )

    const message =
      response?.message ||
      "You're on the list! We'll keep you updated with the latest from Novo."

    return NextResponse.json({ message }, { status: 200 })
  } catch (error: any) {
    const status =
      typeof error?.status === "number" && error.status >= 400 && error.status < 600
        ? error.status
        : 500

    const message =
      typeof error?.message === "string" && status < 500
        ? error.message
        : "We couldn't subscribe you right now. Please try again soon."

    return NextResponse.json({ message }, { status })
  }
}
