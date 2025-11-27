import {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { ADMIN_ROLE_KEY, AdminRoles, getRoleFromMetadata } from "lib/roles"

export default async function onInviteAccepted({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const userModule = container.resolve(Modules.USER) as any

  const inviteId =
    (data?.invite_id as string | undefined) ??
    (data?.id as string | undefined) ??
    (data?.invite?.id as string | undefined)

  let invite
  try {
    if (inviteId) {
      invite = await userModule.retrieveInvite(inviteId, {
        // invite might be soft-deleted once accepted
        withDeleted: true,
      } as any)
    }
  } catch {
    // ignore and fall through to email-based lookup
  }

  // fallback: try by email if provided on the event payload
  if (!invite && (data?.email || data?.invite?.email)) {
    const [fallbackInvite] = await userModule.listInvites(
      {
        email: (data?.email as string | undefined) ?? data?.invite?.email,
      },
      {
        withDeleted: true,
        take: 1,
        order: { created_at: "DESC" },
      } as any
    )
    invite = fallbackInvite
  }

  // if no invite metadata, default to admin
  const role =
    (data?.metadata?.[ADMIN_ROLE_KEY] as string | undefined) ===
    AdminRoles.BLOG_EDITOR
      ? AdminRoles.BLOG_EDITOR
      : getRoleFromMetadata(invite?.metadata)

  // find the user: prefer payload user_id, else lookup by email
  let userId =
    (data?.user_id as string | undefined) ??
    (data?.user?.id as string | undefined)

  const lookupEmail =
    (data?.email as string | undefined) ??
    (data?.invite?.email as string | undefined) ??
    invite?.email ??
    (data?.user?.email as string | undefined)

  if (!userId && lookupEmail) {
    const [user] = await userModule.listUsers(
      { email: lookupEmail },
      { take: 1 } as any
    )
    userId = user?.id
  }
  // eslint-disable-next-line no-console
  console.log("[invite-accepted-role]", {
    data,
    inviteId,
    inviteEmail: invite?.email ?? lookupEmail,
    inviteRole: invite?.metadata?.[ADMIN_ROLE_KEY],
    role,
    userId,
  })
  if (!userId) {
    // nothing to update; bail quietly
    return
  }

  // merge existing user metadata with invite metadata
  let existingMeta: Record<string, unknown> | null | undefined
  try {
    const user = await userModule.retrieveUser(userId, {
      select: ["id", "metadata"],
    })
    existingMeta = user?.metadata
  } catch {
    // ignore if user retrieval fails; still attempt update
  }

  await userModule.updateUsers({
    id: userId,
    metadata: {
      ...(existingMeta || {}),
      ...(invite?.metadata || {}),
      [ADMIN_ROLE_KEY]: role,
    },
  })
}

export const config: SubscriberConfig = {
  event: "invite.accepted",
}
