import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

import { ADMIN_ROLE_KEY, AdminRoles } from "lib/roles"

// Debug log to verify route registration during dev startup
// eslint-disable-next-line no-console
console.log("[custom-invites] route loaded")

const parseNumber = (value: unknown, fallback: number) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const userModule = req.scope.resolve(Modules.USER) as any

  const limit = parseNumber(req.query.limit, 50)
  const offset = parseNumber(req.query.offset, 0)

  const [invites, count] = await userModule.listAndCountInvites(
    {},
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    }
  )

  res.json({ invites, count, limit, offset })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { email, role } = (req.body ?? {}) as {
    email?: string
    role?: string
  }

  if (!email || typeof email !== "string") {
    return res
      .status(400)
      .json({ message: "Email is required to send an invite." })
  }

  const normalizedRole =
    role === AdminRoles.BLOG_EDITOR ? AdminRoles.BLOG_EDITOR : AdminRoles.ADMIN

  const userModule = req.scope.resolve(Modules.USER) as any

  const invite = await userModule.createInvites({
    email: email.trim().toLowerCase(),
    metadata: { [ADMIN_ROLE_KEY]: normalizedRole },
  })

  res.status(200).json({ invite })
}
