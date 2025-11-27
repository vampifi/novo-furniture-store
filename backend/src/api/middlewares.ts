import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { AdminRoles, getActorRole } from "lib/roles"

const ADMIN_BASE_PATH = "/app"
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const adminBasePattern = new RegExp(
  `^(?:${escapeRegex(ADMIN_BASE_PATH)}){2,}`,
  "g"
)

const collapseBase = (pathname: string) => {
  const double = `${ADMIN_BASE_PATH}${ADMIN_BASE_PATH}`
  let next = pathname
  while (next.startsWith(double)) {
    next = `${ADMIN_BASE_PATH}${next.slice(double.length)}`
  }
  return next
}

const normalizeAdminPath = (pathname: string) => {
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return pathname
  }
  const collapsed = collapseBase(pathname)
  const normalized = collapsed.replace(adminBasePattern, ADMIN_BASE_PATH)
  return normalized || ADMIN_BASE_PATH
}

const blogTargetPath = `${ADMIN_BASE_PATH}/blog`
const blogAltPath = `${ADMIN_BASE_PATH}/a/blog`

const BLOG_EDITOR_ALLOWED_PREFIXES = [
  "/admin/blog-posts",
  "/admin/users/me",
  "/admin/auth",
  "/admin/auth/session",
  "/admin/uploads",
  "/admin/notifications",
  "/admin/debug-role",
  "/admin/debug-user",
]

const emptyList = (
  key: string,
  overrides: Partial<{ count: number; offset: number; limit: number }> = {}
) => ({
  [key]: [],
  count: overrides.count ?? 0,
  offset: overrides.offset ?? 0,
  limit: overrides.limit ?? 0,
})

const stubStore = {
  id: "blog-editor-store",
  name: "Blog Editor Store",
  default_currency_code: "usd",
  supported_currencies: [
    {
      id: "usd",
      code: "usd",
      name: "US Dollar",
      symbol: "$",
      symbol_native: "$",
    },
  ],
  default_sales_channel_id: "blog-editor-channel",
  default_sales_channel: {
    id: "blog-editor-channel",
    name: "Blog Editor Channel",
  },
}

const stubForPath = (pathname: string) => {
  if (pathname.startsWith("/admin/products")) {
    return emptyList("products")
  }
  if (pathname.startsWith("/admin/product-variants")) {
    return emptyList("variants")
  }
  if (pathname.startsWith("/admin/product-categories")) {
    return emptyList("product_categories")
  }
  if (pathname.startsWith("/admin/product-tags")) {
    return emptyList("product_tags")
  }
  if (pathname.startsWith("/admin/product-types")) {
    return emptyList("product_types")
  }
  if (pathname === "/admin/store" || pathname === "/admin/store/") {
    return { store: { id: "blog-editor-store", name: "Blog Editor Store" } }
  }
  if (pathname.startsWith("/admin/stores")) {
    return {
      stores: [stubStore],
      count: 1,
      offset: 0,
      limit: 1,
    }
  }
  if (pathname.startsWith("/admin/collections")) {
    return emptyList("collections")
  }
  if (pathname.startsWith("/admin/regions")) {
    return emptyList("regions")
  }
  if (pathname.startsWith("/admin/shipping-profiles")) {
    return emptyList("shipping_profiles")
  }
  if (pathname.startsWith("/admin/store")) {
    return { store: stubStore }
  }
  if (pathname.startsWith("/admin/sales-channels")) {
    return {
      sales_channels: [
        { id: "blog-editor-channel", name: "Blog Editor Channel" },
      ],
      count: 1,
      offset: 0,
      limit: 1,
    }
  }
  if (pathname.startsWith("/admin/currencies")) {
    return {
      currencies: stubStore.supported_currencies,
      count: stubStore.supported_currencies.length,
      offset: 0,
      limit: stubStore.supported_currencies.length,
    }
  }
  return { message: "Limited access for blog editor." }
}

const blogEditorOnly = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (req.method === "OPTIONS") {
    return next()
  }

  const role = await getActorRole(req)
  if (role !== AdminRoles.BLOG_EDITOR) {
    return next()
  }

  const rawUrl = req.originalUrl || req.url || req.path || ""
  const url = new URL(rawUrl, "http://localhost")
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/"

  const allowed =
    BLOG_EDITOR_ALLOWED_PREFIXES.some(
      (prefix) =>
        normalizedPath === prefix ||
        normalizedPath.startsWith(`${prefix}/`)
    ) ||
    normalizedPath === "/admin" ||
    normalizedPath === "/admin/"

  if (!allowed) {
    if (req.method === "GET") {
      return res
        .status(200)
        .json(stubForPath(normalizedPath))
    }
    return res.status(403).json({ message: "Not allowed for blog editors." })
  }

  return next()
}

const normalizeAppPath = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const rawUrl = req.originalUrl || req.url || req.path || ""
  const url = new URL(rawUrl, "http://localhost")
  const pathname = normalizeAdminPath(url.pathname || "/")

  if (pathname !== (url.pathname || "/")) {
    const search = url.search || ""
    // Always land on blog after normalization to avoid loops
    if (pathname === ADMIN_BASE_PATH || pathname === `${ADMIN_BASE_PATH}/`) {
      return res.redirect(blogTargetPath)
    }
    return res.redirect(`${pathname}${search}`)
  }

  return next()
}

const BLOG_EDITOR_ALLOWED_APP_PATHS = [
  "/blog",
  "/a/blog",
  "/login",
  "/invite",
  "/logout",
]

const blogEditorAppRedirect = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (req.method !== "GET") {
    return next()
  }

  const role = await getActorRole(req)
  if (role !== AdminRoles.BLOG_EDITOR) {
    return next()
  }

  const rawUrl = req.originalUrl || req.url || req.path || ""
  const url = new URL(rawUrl, "http://localhost")
  const pathname = normalizeAdminPath(url.pathname || "/")
  // Normalize duplicate /app prefixes (e.g. /app/app/blog)
  const withoutBase =
    pathname.replace(new RegExp(`^${escapeRegex(ADMIN_BASE_PATH)}`), "") || "/"

  // Allow static assets (entry.jsx, index.css, etc.)
  const isAsset = /\.[^/]+$/.test(pathname)
  if (isAsset) {
    return next()
  }

  const allowed = BLOG_EDITOR_ALLOWED_APP_PATHS.some(
    (prefix) =>
      withoutBase === prefix ||
      withoutBase.startsWith(`${prefix}/`)
  )

  if (allowed && withoutBase === "/a/blog") {
    return res.redirect(blogTargetPath)
  }

  if (!allowed) {
    return res.redirect(blogTargetPath)
  }

  return next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: `${ADMIN_BASE_PATH}${ADMIN_BASE_PATH}*`,
      middlewares: [
        (req, res, _next) => {
          const rawUrl = req.originalUrl || req.url || req.path || ""
          const url = new URL(rawUrl, "http://localhost")
          const normalized =
            normalizeAdminPath(url.pathname) + (url.search || "")
          return res.redirect(normalized)
        },
      ],
    },
    {
      matcher: "/admin*",
      middlewares: [blogEditorOnly],
    },
    {
      matcher: "/app*",
      middlewares: [normalizeAppPath, blogEditorAppRedirect],
    },
  ],
})
