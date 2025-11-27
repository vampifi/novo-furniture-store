'use client'

import { FormEvent, useEffect, useMemo, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import {
  Badge,
  Button,
  Heading,
  Input,
  Text,
  toast,
} from "@medusajs/ui"

type RoleOption = "admin" | "blog_editor"

type Invite = {
  id: string
  email: string
  accepted: boolean
  token?: string | null
  expires_at?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

type InviteListResponse = {
  invites: Invite[]
  count?: number
  offset?: number
  limit?: number
}

const roleOptions: Array<{
  id: RoleOption
  label: string
  description: string
  badge: string
}> = [
  {
    id: "admin",
    label: "Full admin",
    description:
      "Complete dashboard access (orders, catalog, customers, settings).",
    badge: "All access",
  },
  {
    id: "blog_editor",
    label: "Blog editor",
    description:
      "Limited to the Blog section and their own profile. Everything else stays locked.",
    badge: "Blog only",
  },
]

const InviteUser = () => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<RoleOption>("blog_editor")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [checkingRole, setCheckingRole] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const inviteCount = useMemo(() => invites.length, [invites])

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/admin/users/me", { credentials: "include" })
        const data = await res.json().catch(() => ({}))
        const actorRole = data?.user?.metadata?.admin_role
        if (actorRole === "blog_editor") {
          setForbidden(true)
        }
      } finally {
        setCheckingRole(false)
      }
    }
    checkRole()
  }, [])

  const loadInvites = async () => {
    setLoadingInvites(true)
    setInviteError(null)
    try {
      const res = await fetch("/admin/custom-invites?limit=50&offset=0", {
        credentials: "include",
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const message =
          payload?.message ||
          `Failed to load invites (${res.status})`
        throw new Error(message)
      }

      const data = (await res.json()) as InviteListResponse
      setInvites(data.invites ?? [])
    } catch (err) {
      setInviteError(
        err instanceof Error
          ? err.message
          : "Failed to load invites."
      )
    } finally {
      setLoadingInvites(false)
    }
  }

  const handleCopyLink = (invite: Invite) => {
    if (!invite.token) {
      toast.error("Invite link not available.")
      return
    }
    const link = `${window.location.origin}/app/invite?token=${invite.token}`
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Invite link copied"))
      .catch(() => toast.error("Failed to copy link"))
  }

  const handleResend = async (inviteId: string) => {
    setResendingId(inviteId)
    try {
      const res = await fetch(`/admin/invites/${inviteId}/resend`, {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const message =
          payload?.message || `Failed to resend invite (${res.status})`
        throw new Error(message)
      }
      toast.success("Invite resent")
      await loadInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resend failed.")
    } finally {
      setResendingId(null)
    }
  }

  const handleDelete = async (inviteId: string) => {
    setDeletingId(inviteId)
    try {
      const res = await fetch(`/admin/invites/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const message =
          payload?.message || `Failed to delete invite (${res.status})`
        throw new Error(message)
      }
      toast.success("Invite deleted")
      await loadInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/admin/custom-invites", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const message =
          payload?.message || `Failed to send invite (${res.status})`
        throw new Error(message)
      }

      toast.success("Invite sent", {
        description: `Sent a ${
          role === "blog_editor" ? "Blog editor" : "Full admin"
        } invite to ${email.trim()}.`,
      })
      setEmail("")
      await loadInvites()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invite."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingRole) {
    return (
      <div className="px-6 py-6">
        <Text>Loading…</Text>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="px-6 py-6">
        <Heading level="h1">Invites unavailable</Heading>
        <Text className="mt-2">
          Your account is limited to blog editing. User invites are only available to admins.
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="rounded-xl border border-ui-border-base bg-ui-bg-component p-6 shadow-card space-y-4">
        <div className="flex flex-col gap-y-1">
          <Heading level="h1" className="text-xl font-semibold">
            Invite user
          </Heading>
          <Text className="text-sm text-ui-fg-subtle">
            Send an invite as a full admin or a blog editor. Blog editors only
            see Blog and Profile after accepting.
          </Text>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-y-1">
            <span className="text-sm font-medium text-ui-fg-base">
              Email address
            </span>
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="editor@example.com"
            />
          </label>

          <div className="space-y-2">
            <Text className="text-sm font-medium text-ui-fg-base">
              Access level
            </Text>
            <div className="grid gap-3 md:grid-cols-2">
              {roleOptions.map((option) => {
                const selected = role === option.id
                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setRole(option.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-ui-border-strong bg-ui-bg-base shadow-elevation-card-rest"
                        : "border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-center gap-x-2">
                      <Text className="text-sm font-semibold">
                        {option.label}
                      </Text>
                      <Badge
                        size="small"
                        color={selected ? "green" : "neutral"}
                      >
                        {option.badge}
                      </Badge>
                    </div>
                    <Text className="text-xs text-ui-fg-subtle mt-1">
                      {option.description}
                    </Text>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
        {error && <Text className="text-xs text-ui-fg-error">{error}</Text>}
      </div>
      <div className="rounded-xl border border-ui-border-base bg-ui-bg-component p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Heading level="h2" className="text-lg font-semibold">
              Pending invites
            </Heading>
            <Text className="text-sm text-ui-fg-subtle">
              Track existing invites and their access level.
            </Text>
          </div>
          <Badge size="small" color="blue">
            {inviteCount} total
          </Badge>
        </div>

        {inviteError && (
          <Text className="text-xs text-ui-fg-error">{inviteError}</Text>
        )}

        {loadingInvites ? (
          <Text className="text-sm text-ui-fg-subtle">
            Loading invites…
          </Text>
        ) : invites.length === 0 ? (
          <Text className="text-sm text-ui-fg-subtle">
            No invites have been sent yet.
          </Text>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ui-fg-subtle uppercase">
                  <th className="py-2">Email</th>
                  <th className="py-2">Access</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Invited</th>
                  <th className="py-2">Expires</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border-base">
                {invites.map((invite) => {
                  const isBlogEditor =
                    invite.metadata?.["admin_role"] === "blog_editor"
                  const status = invite.accepted
                    ? { label: "Accepted", color: "green" as const }
                    : {
                        label: "Pending",
                        color: "orange" as const,
                      }

                  return (
                    <tr key={invite.id} className="text-ui-fg-base">
                      <td className="py-2 font-medium">{invite.email}</td>
                      <td className="py-2">
                        <Badge
                          size="small"
                          color={isBlogEditor ? "orange" : "blue"}
                        >
                          {isBlogEditor ? "Blog editor" : "Full admin"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge size="small" color={status.color}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {invite.created_at
                          ? new Date(
                              invite.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2">
                        {invite.expires_at && !invite.accepted
                          ? new Date(invite.expires_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleCopyLink(invite)}
                            disabled={!invite.token}
                          >
                            Copy link
                          </Button>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleResend(invite.id)}
                            disabled={resendingId === invite.id}
                          >
                            {resendingId === invite.id ? "Resending…" : "Resend"}
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            onClick={() => handleDelete(invite.id)}
                            disabled={deletingId === invite.id}
                          >
                            {deletingId === invite.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Invite user",
  parentNavLink: "settings",
  icon: Users,
})

export default InviteUser
