import { createRoot } from "react-dom/client"
import type { ComponentType } from "react"

const GUARD_MOUNT_ID = "__blog_editor_guard_mount__"

export const mountBlogGuard = (GuardComponent: ComponentType) => {
  if (typeof document === "undefined") return
  if (document.getElementById(GUARD_MOUNT_ID)) {
    return
  }
  const node = document.createElement("div")
  node.id = GUARD_MOUNT_ID
  document.body.appendChild(node)
  const root = createRoot(node)
  root.render(<GuardComponent />)
}
