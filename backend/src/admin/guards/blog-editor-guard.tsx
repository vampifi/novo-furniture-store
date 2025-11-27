'use client'

import { useEffect } from "react"

// Provided by the admin bundler (defined in medusa-config vite override)
declare const __BASE__: string | undefined

const rawBase =
  typeof __BASE__ === "string" && __BASE__.length > 0 ? __BASE__ : "/app"
const ADMIN_BASE = `/${rawBase}`.replace(/\/+$/, "").replace(/\/{2,}/g, "/")

const ROLE_KEY = "admin_role"
const ROLE_RETRY_MS = 2000
const CHECK_INTERVAL_MS = 500
const LOCK_CLASS = "blog-editor-mode"
const LOCK_STYLE_ID = "__blog_editor_lock_style__"

const withBase = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${ADMIN_BASE}${normalized}`.replace(/\/{2,}/g, "/")
}

const BLOG_PATH = withBase("/blog")
const BLOG_ALT_PATH = withBase("/a/blog")
const AUTH_PATHS = ["/login", "/invite", "/logout"].map(withBase)

const collapseDuplicateBase = (pathname: string) => {
  const duplicate = `${ADMIN_BASE}${ADMIN_BASE}`
  let next = pathname
  while (next.startsWith(duplicate)) {
    next = `${ADMIN_BASE}${next.slice(duplicate.length)}`
  }
  return next
}

const normalizePath = (pathname: string) => {
  if (!pathname) return BLOG_PATH
  const cleaned = pathname.replace(/\/{2,}/g, "/")
  const withPrefix = cleaned.startsWith(ADMIN_BASE)
    ? cleaned
    : `${ADMIN_BASE}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`
  const squashed = collapseDuplicateBase(withPrefix)
  return squashed.endsWith("/") && squashed !== "/"
    ? squashed.slice(0, -1)
    : squashed
}

const isAllowedPath = (pathname: string) => {
  const normalized = normalizePath(pathname)
  if (
    normalized === BLOG_PATH ||
    normalized.startsWith(`${BLOG_PATH}/`) ||
    normalized === BLOG_ALT_PATH ||
    normalized.startsWith(`${BLOG_ALT_PATH}/`)
  ) {
    return true
  }

  return AUTH_PATHS.some(
    (allowed) => normalized === allowed || normalized.startsWith(`${allowed}/`)
  )
}

const installStyles = () => {
  if (typeof document === "undefined") return
  if (document.getElementById(LOCK_STYLE_ID)) return
  const style = document.createElement("style")
  style.id = LOCK_STYLE_ID
  style.textContent = `
    body.${LOCK_CLASS} header,
    body.${LOCK_CLASS} aside,
    body.${LOCK_CLASS} nav,
    body.${LOCK_CLASS} footer,
    body.${LOCK_CLASS} [role="banner"],
    body.${LOCK_CLASS} [role="menubar"],
    body.${LOCK_CLASS} [data-testid*="sidebar"],
    body.${LOCK_CLASS} [data-testid*="shell-header"],
    body.${LOCK_CLASS} [data-testid*="breadcrumbs"],
    body.${LOCK_CLASS} [role="navigation"],
    body.${LOCK_CLASS} [data-testid*="home"],
    body.${LOCK_CLASS} [data-testid*="orders"],
    body.${LOCK_CLASS} [data-testid*="products"],
    body.${LOCK_CLASS} [data-testid*="customers"],
    body.${LOCK_CLASS} [data-testid*="settings"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    body.${LOCK_CLASS} a:not([href*="/blog"]):not([href*="/invite"]):not([href*="/login"]):not([href*="/logout"]) {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    body.${LOCK_CLASS} main {
      margin-left: 0 !important;
      padding-left: 0 !important;
      width: 100% !important;
    }
  `
  document.head.appendChild(style)
}

const BlogEditorGuardComponent = () => {
  useEffect(() => {
    let active = true
    let roleChecked = false
    let isBlogEditor = false
    let nextRoleAttempt = 0

    const fetchRole = async () => {
      const now = Date.now()
      if (now < nextRoleAttempt) return null
      try {
        const res = await fetch("/admin/users/me?fields=id,metadata", {
          credentials: "include",
          cache: "no-store",
        })
        if (res.status === 401) {
          nextRoleAttempt = now + ROLE_RETRY_MS
          return null
        }
        if (!res.ok) {
          nextRoleAttempt = now + ROLE_RETRY_MS
          return null
        }
        const data = await res.json().catch(() => null)
        const meta = data?.user?.metadata || {}
        const rawRole =
          meta?.[ROLE_KEY] ||
          meta?.role ||
          meta?.adminRole ||
          meta?.admin_role
        const normalized =
          typeof rawRole === "string" ? rawRole.toLowerCase().trim() : ""
        return normalized.includes("blog") ? "blog_editor" : "admin"
      } catch {
        nextRoleAttempt = now + ROLE_RETRY_MS
        return null
      }
    }

    const applyLock = () => {
      installStyles()
      document.body.classList.add(LOCK_CLASS)
    }

    const clearLock = () => {
      document.body.classList.remove(LOCK_CLASS)
    }

    const enforce = async () => {
      if (!active) return

      const path = normalizePath(window.location.pathname || "/")
      if (AUTH_PATHS.some((allowed) => path === allowed || path.startsWith(`${allowed}/`))) {
        clearLock()
        return
      }

      if (!roleChecked) {
        const role = await fetchRole()
        if (!active || !role) return
        roleChecked = true
        isBlogEditor = role === "blog_editor"
      }

      if (!isBlogEditor) {
        clearLock()
        return
      }

      applyLock()

      const isAsset = /\.[^/]+$/.test(path)
      if (!isAsset && !isAllowedPath(path)) {
        window.location.replace(BLOG_PATH)
        return
      }

      if (!isAsset && path === BLOG_ALT_PATH) {
        window.location.replace(BLOG_PATH)
      }
    }

    const interval = window.setInterval(enforce, CHECK_INTERVAL_MS)
    window.addEventListener("popstate", enforce)
    enforce()

    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener("popstate", enforce)
      clearLock()
    }
  }, [])

  return null
}

export default BlogEditorGuardComponent
