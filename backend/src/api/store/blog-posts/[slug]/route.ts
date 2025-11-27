import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { BLOG_MODULE } from "modules/blog"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogModule = req.scope.resolve(BLOG_MODULE)

  const [post] = await blogModule.listBlogPosts(
    {
      slug: req.params.slug,
      status: "published",
    },
    {
      take: 1,
      select: [
        "id",
        "title",
        "slug",
        "excerpt",
        "content",
        "cover_image",
        "author_name",
        "published_at",
        "reading_time_minutes",
        "tags",
        "metadata",
        "meta_title",
        "meta_description",
        "canonical_url",
        "og_image",
        "updated_at",
      ],
    }
  )

  if (!post) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No published blog post found with slug "${req.params.slug}".`
    )
  }

  res.status(200).json({ post })
}
