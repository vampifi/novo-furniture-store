'use client'

import BlogPage from "./routes/blog/page"
import LoginTitleOverride, { config as loginTitleConfig } from "./widgets/login-title-override"
import { BookOpen } from "@medusajs/icons"
import BlogEditorGuard from "./guards/blog-editor-guard"
import { mountBlogGuard } from "./guard-bootstrap"

const plugin = {
  widgetModule: {
    // Only the login title override is registered as a widget; guard mounts manually below.
    widgets: [
      {
        Component: LoginTitleOverride,
        config: loginTitleConfig,
        zone: Array.isArray(loginTitleConfig.zone)
          ? loginTitleConfig.zone
          : loginTitleConfig.zone
          ? [loginTitleConfig.zone]
          : [],
      },
    ],
  },
  routeModule: {
    routes: [
      { path: "/blog", Component: BlogPage },
      // Allow /a/blog in case the admin router expects the /a prefix internally
      { path: "/a/blog", Component: BlogPage },
    ],
  },
// The blog module itself already registers a sidebar entry; we avoid adding a duplicate.
  menuItemModule: {
    menuItems: [],
  },
  formModule: {
    customFields: {},
  },
  displayModule: {
    displays: {},
  },
}

// Mount the guard globally once the client bundle loads
if (typeof window !== "undefined") {
  setTimeout(() => mountBlogGuard(BlogEditorGuard), 0)
}

export default plugin
