import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "modules/blog"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogModule = req.scope.resolve(BLOG_MODULE)
  const limit = Math.min(Number(req.query?.limit) || 10, 50)
  const offset = Math.max(Number(req.query?.offset) || 0, 0)
  const tag = typeof req.query?.tag === "string" ? req.query.tag : undefined

  const filters: Record<string, unknown> = {
    status: "published",
  }

  if (tag) {
    filters.tags = tag
  }

  const [posts, count] = await blogModule.listAndCountBlogPosts(filters, {
    select: [
      "id",
      "title",
      "slug",
      "excerpt",
      "cover_image",
      "author_name",
      "published_at",
      "reading_time_minutes",
      "tags",
      "is_featured",
      "meta_title",
      "meta_description",
      "canonical_url",
      "og_image",
      "updated_at",
    ],
    skip: offset,
    take: limit,
    order: { published_at: "DESC" },
  })

  const filteredPosts = tag
    ? posts.filter((post) => Array.isArray(post.tags) && post.tags.includes(tag))
    : posts

  res.status(200).json({
    posts: filteredPosts,
    count: tag ? filteredPosts.length : count,
    offset,
    limit,
  })
}
