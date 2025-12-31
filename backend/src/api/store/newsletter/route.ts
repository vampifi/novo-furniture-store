import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type {
  ICustomerModuleService,
  INotificationModuleService,
} from "@medusajs/framework/types"
import { EmailTemplates } from "modules/email-notifications/templates"
import { STORE_CORS } from "lib/constants"

type NewsletterBody = {
  email?: string
  first_name?: string
  last_name?: string
}

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

const cleanText = (value?: unknown) =>
  typeof value === "string" && value.trim().length ? value.trim() : undefined

const resolveStoreUrl = () => {
  const fromEnv = STORE_CORS?.split(",")?.[0]?.trim()
  const base = fromEnv && fromEnv.startsWith("http") ? fromEnv : "https://localhost:8000"
  return base.replace(/\/$/, "")
}

const resolveUnsubscribeUrl = (email: string) => {
  return `${resolveStoreUrl()}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
}

const sendWelcomeEmail = async ({
  notificationService,
  email,
}: {
  notificationService?: INotificationModuleService
  email: string
}) => {
  if (!notificationService) {
    return
  }

  try {
    await notificationService.createNotifications({
      to: email,
      channel: "email",
      template: EmailTemplates.NEWSLETTER_WELCOME,
      data: {
        emailOptions: {
          subject: "Welcome to NOVO — Thanks for subscribing",
        },
        storeUrl: resolveStoreUrl(),
        unsubscribeUrl: resolveUnsubscribeUrl(email),
      },
    })
  } catch (error) {
    // Do not block subscription on email issues
    // eslint-disable-next-line no-console
    console.warn("newsletter:welcome-email-failed", error)
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, first_name, last_name } = (req.body ?? {}) as NewsletterBody

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "A valid email address is required." })
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." })
  }

  const logger = req.scope.resolve("logger") as {
    error: (...args: unknown[]) => void
  }

  let customerService: ICustomerModuleService
  let notificationService: INotificationModuleService | undefined

  try {
    customerService = req.scope.resolve(Modules.CUSTOMER)
  } catch (error) {
    logger?.error("newsletter:customer-service-unavailable", error)
    return res.status(500).json({
      message:
        "We couldn't process your request right now. Please try again later.",
    })
  }

  try {
    notificationService = req.scope.resolve(
      Modules.NOTIFICATION
    ) as INotificationModuleService
  } catch {
    notificationService = undefined
  }

  const now = new Date().toISOString()
  const successMessage =
    "You're on the list! We'll keep you updated with the latest from Novo."

  try {
    const existing = await customerService
      .listCustomers(
        { email: normalizedEmail },
        { take: 1, select: ["id", "metadata", "email"] }
      )
      .then((customers) => customers[0])

    const wasOptedIn = Boolean(existing?.metadata?.newsletter_opt_in)
    const wasUnsubscribed = Boolean(existing?.metadata?.newsletter_unsubscribed_at)
    const shouldSendWelcome = !wasOptedIn || wasUnsubscribed

    if (existing?.id) {
      const metadata = {
        ...(existing.metadata ?? {}),
        newsletter_opt_in: true,
        newsletter_subscribed_at: now,
        newsletter_source: "storefront",
        newsletter_unsubscribed_at: null,
      }

      await customerService.updateCustomers(existing.id, { metadata })

      if (shouldSendWelcome) {
        await sendWelcomeEmail({
          notificationService,
          email: normalizedEmail,
        })
      }

      return res.status(200).json({ subscribed: true, message: successMessage })
    }

    await customerService.createCustomers({
      email: normalizedEmail,
      first_name: cleanText(first_name),
      last_name: cleanText(last_name),
      metadata: {
        newsletter_opt_in: true,
        newsletter_subscribed_at: now,
        newsletter_source: "storefront",
        newsletter_unsubscribed_at: null,
      },
    })

    await sendWelcomeEmail({
      notificationService,
      email: normalizedEmail,
    })

    return res.status(201).json({ subscribed: true, message: successMessage })
  } catch (error) {
    logger?.error("newsletter:subscribe-failed", error)
    return res.status(500).json({
      message:
        "We couldn't process your request right now. Please try again later.",
    })
  }
}
