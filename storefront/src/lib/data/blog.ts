import { sdk } from "@lib/config"

export type StorefrontBlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  cover_image?: string | null
  author_name?: string | null
  published_at?: string | null
  reading_time_minutes?: number | null
  tags?: string[] | null
  content?: string
  is_featured?: boolean
  meta_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  og_image?: string | null
  updated_at?: string | null
}

export const getPublishedPosts = async ({
  limit = 12,
  offset = 0,
  tag,
}: {
  limit?: number
  offset?: number
  tag?: string
} = {}) => {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  if (tag) {
    search.set("tag", tag)
  }

  const response = await sdk.client
    .fetch<{
      posts: StorefrontBlogPost[]
      count: number
      offset: number
      limit: number
    }>(`/store/blog-posts?${search.toString()}`, undefined, {
      // Always fetch fresh so new/updated posts show immediately
      next: { revalidate: 0, tags: ["blog_posts"] },
    })
    .catch((error) => {
      console.error("Failed to load blog posts", error)
      return { posts: [], count: 0, offset: 0, limit }
    })

  return response
}

export const getPostBySlug = async (slug: string) => {
  if (!slug) {
    return null
  }

  try {
    const { post } = await sdk.client.fetch<{ post: StorefrontBlogPost }>(
      `/store/blog-posts/${encodeURIComponent(slug)}`,
      undefined,
      {
        next: { revalidate: 0, tags: ["blog_posts", slug] },
      }
    )

    return post
  } catch (error) {
    console.error(`Failed to load blog post "${slug}"`, error)
    return null
  }
}
