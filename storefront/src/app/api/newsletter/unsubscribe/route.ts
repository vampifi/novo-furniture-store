import { NextRequest, NextResponse } from "next/server"

import { sdk } from "@lib/config"

const isValidEmail = (value?: unknown): value is string =>
  typeof value === "string" && /\S+@\S+\.\S+/.test(value.trim())

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const respond = (message: string, status = 200, acceptHeader?: string | null) => {
  const wantsHtml = (acceptHeader || "").toLowerCase().includes("text/html")
  const safeMessage = escapeHtml(message)

  if (wantsHtml) {
    const title = status >= 400 ? "We couldn't process that" : "Unsubscribed"
    return new NextResponse(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f2ec; margin: 0; padding: 24px; }
      main { background: #fff; max-width: 600px; margin: 0 auto; padding: 24px 28px; border-radius: 14px; border: 1px solid #e4d9cf; box-shadow: 0 10px 30px rgba(34, 28, 24, 0.08); color: #2e2623; }
      h1 { margin: 0 0 12px; font-size: 22px; }
      p { margin: 0; line-height: 1.5; font-size: 15px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${safeMessage}</p>
    </main>
  </body>
</html>`,
      {
        status,
        headers: { "content-type": "text/html; charset=utf-8" },
      }
    )
  }

  return NextResponse.json({ message }, { status })
}

const handleUnsubscribe = async (email: string, req: NextRequest) => {
  try {
    const response = await sdk.client.fetch<{ message?: string }>(
      "/store/newsletter/unsubscribe",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: {
          email,
        },
      }
    )

    const message =
      response?.message ||
      "You are unsubscribed and will not receive emails."

    return respond(message, 200, req.headers.get("accept"))
  } catch (error: any) {
    const status =
      typeof error?.status === "number" && error.status >= 400 && error.status < 600
        ? error.status
        : 500

    const message =
      typeof error?.message === "string" && status < 500
        ? error.message
        : "We couldn't process your request right now. Please try again later."

    return respond(message, status, req.headers.get("accept"))
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? undefined

  if (!isValidEmail(email)) {
    return respond("A valid email address is required.", 400, req.headers.get("accept"))
  }

  return handleUnsubscribe(email.trim().toLowerCase(), req)
}

export async function POST(req: NextRequest) {
  const { email } = ((await req.json().catch(() => ({}))) ?? {}) as {
    email?: string
  }

  if (!isValidEmail(email)) {
    return respond("A valid email address is required.", 400, req.headers.get("accept"))
  }

  return handleUnsubscribe(email.trim().toLowerCase(), req)
}
