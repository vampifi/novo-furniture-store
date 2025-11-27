import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { BLOG_MODULE } from "modules/blog"
import BlogModuleService from "modules/blog/service"

const updateSchema = z
  .object({
    title: z.string().min(3).optional(),
    slug: z.string().min(3).optional(),
    excerpt: z.string().max(600).optional().nullable(),
    cover_image: z.string().url().optional().nullable(),
    author_name: z.string().min(2).max(120).optional().nullable(),
    content: z.string().min(1).optional(),
    status: z.enum(["draft", "published"]).optional(),
    published_at: z.coerce.date().optional().nullable(),
    is_featured: z.boolean().optional(),
    tags: z.array(z.string().max(40)).optional(),
    meta_title: z.string().max(180).optional().nullable(),
    meta_description: z.string().max(300).optional().nullable(),
    canonical_url: z.string().url().optional().nullable(),
    og_image: z.string().url().optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "You must provide at least one field to update.",
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

const getBlogModule = (req: MedusaRequest) =>
  req.scope.resolve(BLOG_MODULE) as BlogModuleService

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogModule = getBlogModule(req)
  const post = await blogModule.retrieveBlogPost(req.params.id, {
    relations: [],
  })

  if (!post) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Blog post with id "${req.params.id}" was not found.`
    )
  }

  res.status(200).json({ post })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = updateSchema.safeParse(req.body ?? {})

  if (!payload.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodError(payload.error, "Invalid blog post update payload.")
    )
  }

  const blogModule = getBlogModule(req)
  const post = await blogModule.updatePost(req.params.id, payload.data)

  res.status(200).json({ post })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogModule = getBlogModule(req)
  await blogModule.deleteBlogPosts(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "blog_post",
    deleted: true,
  })
}
