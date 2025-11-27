import {
  MedusaError,
  MedusaService,
  ModulesSdkUtils,
} from "@medusajs/framework/utils"
import { BlogPost } from "./models/blog-post"

type CreateBlogPostDTO = {
  title: string
  slug?: string
  excerpt?: string | null
  cover_image?: string | null
  author_name?: string | null
  content: string
  status?: "draft" | "published"
  published_at?: Date | string | null
  is_featured?: boolean
  tags?: string[] | null
  meta_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  og_image?: string | null
  metadata?: Record<string, unknown> | null
}

type UpdateBlogPostDTO = Partial<CreateBlogPostDTO>

const DEFAULT_WORDS_PER_MINUTE = 225

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const normalizeTags = (tags?: string[] | null) => {
  if (!Array.isArray(tags)) {
    return null
  }

  const sanitized = tags
    .map((tag) => tag?.trim())
    .filter((tag): tag is string => Boolean(tag && tag.length))

  return sanitized.length ? sanitized : null
}

const calculateReadingTime = (content?: string | null) => {
  if (!content) {
    return null
  }

  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / DEFAULT_WORDS_PER_MINUTE))
}

const sanitizeString = (value?: string | null) => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

class BlogModuleService extends MedusaService({
  BlogPost,
}) {
  private async ensureSlugAvailable(slug: string, excludeId?: string) {
    const [post] = await this.listBlogPosts(
      {
        slug,
      },
      {
        select: ["id", "slug"],
        take: 1,
      }
    )

    if (post && post.id !== excludeId) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `A blog post with slug "${slug}" already exists.`
      )
    }
  }

  private resolveStatus({
    status,
    published_at,
  }: {
    status?: "draft" | "published"
    published_at?: Date | string | null
  }) {
    const normalizedStatus = status ?? "draft"

    const publishDate =
      normalizedStatus === "published"
        ? published_at
          ? new Date(published_at)
          : new Date()
        : null

    return {
      status: normalizedStatus,
      published_at: publishDate,
    }
  }

  async createPost(
    data: CreateBlogPostDTO,
    sharedContext?: ModulesSdkUtils.SharedContext
  ) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title)
    await this.ensureSlugAvailable(slug)

    const readingTime = calculateReadingTime(data.content)
    const { status, published_at } = this.resolveStatus(data)

    const created = await this.createBlogPosts(
      {
        ...data,
        slug,
        status,
        published_at,
        tags: normalizeTags(data.tags),
        reading_time_minutes: readingTime,
        meta_title: sanitizeString(data.meta_title),
        meta_description: sanitizeString(data.meta_description),
        canonical_url: sanitizeString(data.canonical_url),
        og_image: sanitizeString(data.og_image),
      },
      sharedContext
    )

    if (Array.isArray(created)) {
      return created[0] ?? null
    }

    return created ?? null
  }

  async updatePost(
    id: string,
    data: UpdateBlogPostDTO,
    sharedContext?: ModulesSdkUtils.SharedContext
  ) {
    const payload: Record<string, unknown> = { ...data }

    if (data.slug) {
      const slug = slugify(data.slug)
      await this.ensureSlugAvailable(slug, id)
      payload.slug = slug
    }

    if (typeof data.content === "string") {
      payload.reading_time_minutes = calculateReadingTime(data.content)
    }

    if (data.tags !== undefined) {
      payload.tags = normalizeTags(data.tags)
    }

    if (data.meta_title !== undefined) {
      payload.meta_title = sanitizeString(data.meta_title)
    }

    if (data.meta_description !== undefined) {
      payload.meta_description = sanitizeString(data.meta_description)
    }

    if (data.canonical_url !== undefined) {
      payload.canonical_url = sanitizeString(data.canonical_url)
    }

    if (data.og_image !== undefined) {
      payload.og_image = sanitizeString(data.og_image)
    }

    if (data.status) {
      const { status, published_at } = this.resolveStatus({
        status: data.status,
        published_at: data.published_at,
      })

      payload.status = status
      payload.published_at = published_at
    } else if (data.published_at !== undefined) {
      payload.published_at = data.published_at
        ? new Date(data.published_at)
        : null
    }

    const updated = await this.updateBlogPosts(
      {
        id,
        ...payload,
      },
      sharedContext
    )

    const post = Array.isArray(updated) ? updated[0] : updated

    if (!post) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Blog post with id "${id}" was not found.`
      )
    }

    return post
  }

  async publishPost(id: string, sharedContext?: ModulesSdkUtils.SharedContext) {
    return await this.updatePost(
      id,
      { status: "published", published_at: new Date() },
      sharedContext
    )
  }

  async unpublishPost(id: string, sharedContext?: ModulesSdkUtils.SharedContext) {
    return await this.updatePost(
      id,
      { status: "draft", published_at: null },
      sharedContext
    )
  }
}

export default BlogModuleService
