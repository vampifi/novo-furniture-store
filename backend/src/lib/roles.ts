export const ADMIN_ROLE_KEY = "admin_role"

export const AdminRoles = {
  ADMIN: "admin",
  BLOG_EDITOR: "blog_editor",
} as const

export type AdminRole = (typeof AdminRoles)[keyof typeof AdminRoles]

export const getRoleFromMetadata = (
  metadata: Record<string, unknown> | null | undefined
): AdminRole => {
  const stored = metadata?.[ADMIN_ROLE_KEY]
  if (stored === AdminRoles.BLOG_EDITOR) {
    return AdminRoles.BLOG_EDITOR
  }
  return AdminRoles.ADMIN
}

export const getActorRole = async (
  req: import("@medusajs/framework/http").MedusaRequest
) => {
  const actorId = req.auth_context?.actor_id
  if (actorId) {
    try {
      const remoteQuery = req.scope.resolve("remoteQuery")
      const { remoteQueryObjectFromString } = await import("@medusajs/framework/utils")
      const query = remoteQueryObjectFromString({
        entryPoint: "user",
        variables: { id: actorId },
        fields: ["id", "metadata"],
      })
      const [user] = await remoteQuery(query)
      return getRoleFromMetadata(user?.metadata)
    } catch {
      // fallback: try user module directly
      try {
        const { Modules } = await import("@medusajs/framework/utils")
        const userModule = req.scope.resolve(Modules.USER) as any
        const user = await userModule.retrieveUser(actorId, {
          select: ["id", "metadata"],
        })
        return getRoleFromMetadata(user?.metadata)
      } catch {
        // ignore and fall back to session role
      }
    }
  }

  const sessionRole =
    (req.auth_context as any)?.app_metadata?.[ADMIN_ROLE_KEY] ||
    (req.session_context as any)?.app_metadata?.[ADMIN_ROLE_KEY]
  if (sessionRole === AdminRoles.BLOG_EDITOR) {
    return AdminRoles.BLOG_EDITOR
  }

  return AdminRoles.ADMIN
}
