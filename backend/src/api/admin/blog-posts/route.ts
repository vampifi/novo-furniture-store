import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { BLOG_MODULE } from "modules/blog"
import BlogModuleService from "modules/blog/service"

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  status: z.enum(["draft", "published"]).optional(),
  is_featured: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
})

const postSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).optional(),
  excerpt: z.string().max(600).optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  author_name: z.string().min(2).max(120).optional().nullable(),
  content: z.string().min(1),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.coerce.date().optional(),
  is_featured: z.boolean().optional(),
  tags: z.array(z.string().max(40)).optional(),
  meta_title: z.string().max(180).optional().nullable(),
  meta_description: z.string().max(300).optional().nullable(),
  canonical_url: z.string().url().optional().nullable(),
  og_image: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

const formatZodError = (error: z.ZodError, fallback: string) => {
  const { formErrors, fieldErrors } = error.flatten()
  const fieldMessages = Object.entries(fieldErrors).flatMap(
    ([field, errors]) =>
      (errors ?? []).map((message) => `${field}: ${message}`)
  )
  const combinedErrors = [...formErrors, ...fieldMessages].filter(Boolean)
  return combinedErrors.join(" ") || fallback
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { limit, offset, status, is_featured } = querySchema.parse(req.query ?? {})

  const blogModule = req.scope.resolve(BLOG_MODULE) as BlogModuleService
  const filters: Record<string, unknown> = {}

  if (status) {
    filters.status = status
  }

  if (typeof is_featured === "boolean") {
    filters.is_featured = is_featured
  }

  const [posts, count] = await blogModule.listAndCountBlogPosts(filters, {
    select: [
      "id",
      "title",
      "slug",
      "excerpt",
      "cover_image",
      "author_name",
      "status",
      "published_at",
      "is_featured",
      "tags",
      "reading_time_minutes",
      "created_at",
      "updated_at",
    ],
    relations: [],
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })

  res.status(200).json({
    posts,
    count,
    offset,
    limit,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = postSchema.safeParse(req.body ?? {})

  if (!payload.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodError(payload.error, "Invalid blog post payload.")
    )
  }

  const blogModule = req.scope.resolve(BLOG_MODULE) as BlogModuleService
  const post = await blogModule.createPost(payload.data as any)

  res.status(201).json({ post })
}
