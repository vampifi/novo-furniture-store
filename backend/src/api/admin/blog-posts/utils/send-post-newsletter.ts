import { Modules } from "@medusajs/framework/utils"
import type {
  ICustomerModuleService,
  INotificationModuleService,
} from "@medusajs/framework/types"
import type { MedusaRequest } from "@medusajs/framework/http"
import { EmailTemplates } from "modules/email-notifications/templates"
import { STORE_CORS } from "lib/constants"

type BlogPostLike = {
  id: string
  title: string
  slug?: string | null
  excerpt?: string | null
  cover_image?: string | null
  author_name?: string | null
  status?: string | null
}

const resolveStoreUrl = () => {
  const fromEnv = STORE_CORS?.split(",")?.[0]?.trim()
  const base = fromEnv && fromEnv.startsWith("http") ? fromEnv : "https://localhost:8000"
  return base.replace(/\/$/, "")
}

const resolveUnsubscribeUrl = (email: string) => {
  return `${resolveStoreUrl()}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
}

const shouldNotify = (post: BlogPostLike) =>
  post.status === "published" && typeof post.slug === "string" && post.slug.length > 0

export const sendPostNewsletter = async (
  req: MedusaRequest,
  post: BlogPostLike
) => {
  if (!shouldNotify(post)) {
    return
  }

  const logger = req.scope.resolve("logger") as {
    warn: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
  }

  let notificationService: INotificationModuleService | undefined
  let customerService: ICustomerModuleService | undefined

  try {
    notificationService = req.scope.resolve(
      Modules.NOTIFICATION
    ) as INotificationModuleService
  } catch {
    logger?.warn(
      "newsletter:publish:notification-disabled",
      "Notification module missing; skipping newsletter send."
    )
  }

  try {
    customerService = req.scope.resolve(
      Modules.CUSTOMER
    ) as ICustomerModuleService
  } catch {
    logger?.warn(
      "newsletter:publish:customer-missing",
      "Customer module missing; skipping newsletter send."
    )
  }

  if (!notificationService || !customerService) {
    return
  }

  const readUrl = `${resolveStoreUrl()}/blog/${post.slug}`
  const batchSize = 200
  let skip = 0
  let total = 0

  try {
    do {
      const [customers, count] = await customerService.listAndCountCustomers(
        {},
        {
          select: ["id", "email", "metadata"],
          take: batchSize,
          skip,
        }
      )

      total = count

      const eligible = customers.filter((customer) => {
        if (typeof customer.email !== "string") {
          return false
        }
        const metadata = customer.metadata || {}
        if (metadata.newsletter_unsubscribed_at) {
          return false
        }
        return Boolean(metadata.newsletter_opt_in)
      })

      for (const customer of eligible) {
        const metadata = { ...(customer.metadata ?? {}) }
        if (metadata.newsletter_last_post_id === post.id) {
          continue
        }

        const unsubscribeUrl = resolveUnsubscribeUrl(customer.email!)

        try {
          await notificationService.createNotifications({
            to: customer.email!,
            channel: "email",
            template: EmailTemplates.NEWSLETTER_NEW_CONTENT,
            data: {
              emailOptions: {
                subject: `New from Novo: ${post.title}`,
              },
              title: post.title,
              excerpt: post.excerpt ?? null,
              coverImage: post.cover_image ?? null,
              readUrl,
              authorName: post.author_name ?? null,
              unsubscribeUrl,
            },
          })

          await customerService.updateCustomers(customer.id, {
            metadata: {
              ...metadata,
              newsletter_last_post_id: post.id,
            },
          })
        } catch (error) {
          logger?.error("newsletter:publish:send-failed", error)
        }
      }

      skip += batchSize
    } while (skip < total)
  } catch (error) {
    logger?.error("newsletter:publish:bulk-send-error", error)
  }
}
