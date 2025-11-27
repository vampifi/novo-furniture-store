import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { BLOG_MODULE } from "modules/blog"

const publishSchema = z.object({
  action: z.enum(["publish", "unpublish"]).default("publish"),
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { action } = publishSchema.parse(req.body ?? {})
  const blogModule = req.scope.resolve(BLOG_MODULE)

  const post =
    action === "publish"
      ? await blogModule.publishPost(req.params.id)
      : await blogModule.unpublishPost(req.params.id)

  if (!post) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog post with id "${req.params.id}" was not found.`
    )
  }

  res.status(200).json({ post })
}
