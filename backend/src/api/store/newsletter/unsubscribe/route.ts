import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { ICustomerModuleService } from "@medusajs/framework/types"

const isValidEmail = (value?: unknown): value is string =>
  typeof value === "string" && /\S+@\S+\.\S+/.test(value)

const unsubscribe = async (
  email: string,
  req: MedusaRequest,
  res: MedusaResponse
) => {
  let customerService: ICustomerModuleService
  const normalizedEmail = email.trim().toLowerCase()

  try {
    customerService = req.scope.resolve(Modules.CUSTOMER)
  } catch (error) {
    req.scope.resolve("logger").error("newsletter:unsubscribe:service-missing", error)
    return res.status(500).json({
      message:
        "We couldn't process your request right now. Please try again later.",
    })
  }

  try {
    const existing = await customerService
      .listCustomers(
        { email: normalizedEmail },
        { take: 1, select: ["id", "metadata", "email"] }
      )
      .then((items) => items[0])

    if (!existing?.id) {
      return res.status(200).json({
        unsubscribed: true,
        message: "You are unsubscribed and will not receive emails.",
      })
    }

    await customerService.updateCustomers(existing.id, {
      metadata: {
        ...(existing.metadata ?? {}),
        newsletter_opt_in: false,
        newsletter_unsubscribed_at: new Date().toISOString(),
      },
    })

    return res.status(200).json({
      unsubscribed: true,
      message: "You are unsubscribed and will not receive emails.",
    })
  } catch (error) {
    req.scope.resolve("logger").error("newsletter:unsubscribe:failed", error)
    return res.status(500).json({
      message:
        "We couldn't process your request right now. Please try again later.",
    })
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const email = typeof req.query?.email === "string" ? req.query.email : undefined

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "A valid email address is required." })
  }

  return unsubscribe(email, req, res)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email } = (req.body ?? {}) as { email?: string }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "A valid email address is required." })
  }

  return unsubscribe(email, req, res)
}
