import { Modules } from "@medusajs/framework/utils"
import type { MedusaRequest } from "@medusajs/framework/http"
import type { IFileModuleService, Logger } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

const MAX_IMAGE_BYTES = 6 * 1024 * 1024 // 6MB ceiling for newsletter/blog assets

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "blog-image"

const extFromContentType = (contentType?: string | null) => {
  if (!contentType) return null
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  }
  return map[contentType.toLowerCase()] ?? null
}

const isLikelyUrl = (value?: string | null) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim())

const readBufferWithLimit = async (res: any) => {
  const contentLength = Number(res.headers?.get?.("content-length") ?? 0)

  if (contentLength && contentLength > MAX_IMAGE_BYTES) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Image is too large. Max allowed size is ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`
    )
  }

  const arrayBuffer = await res.arrayBuffer()
  const buf = Buffer.from(arrayBuffer)

  if (buf.length > MAX_IMAGE_BYTES) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Image is too large. Max allowed size is ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB.`
    )
  }

  return buf
}

const uploadImageFromUrl = async ({
  url,
  filenameBase,
  req,
  logger,
}: {
  url: string
  filenameBase: string
  req: MedusaRequest
  logger?: Logger
}) => {
  let fileService: IFileModuleService

  try {
    fileService = req.scope.resolve(Modules.FILE)
  } catch (error) {
    logger?.warn?.("blog:upload:file-service-missing", error)
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "File service is not configured; cannot upload blog images."
    )
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { accept: "image/*" },
  }).catch((error) => {
    logger?.error?.("blog:upload:fetch-failed", error)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Could not download the image. Please check the URL."
    )
  })

  if (!response?.ok) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Image download failed (${response?.status || "unknown"}).`
    )
  }

  const contentType = response.headers.get("content-type")?.split(";")?.[0]?.trim()
  if (!contentType || !contentType.toLowerCase().startsWith("image/")) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Only image URLs are allowed for blog covers."
    )
  }

  const buffer = await readBufferWithLimit(response)

  const ext =
    extFromContentType(contentType) ||
    url.split("?")[0].split(".").pop()?.toLowerCase()?.replace(/[^a-z0-9]/g, "") ||
    "jpg"

  const filename = `${slugify(filenameBase)}-${Date.now()}.${ext}`

  const [file] = await fileService.createFiles([
    {
      filename,
      mimeType: contentType,
      content: buffer.toString("binary"),
    },
  ])

  return file?.url ?? url
}

export const uploadBlogImages = async (
  data: Partial<{ cover_image: string | null; og_image: string | null; title?: string; slug?: string }>,
  req: MedusaRequest
) => {
  const logger = req.scope.resolve("logger") as Logger | undefined
  const base = slugify(data.slug || data.title || "blog")
  const next = { ...data }

  if (isLikelyUrl(next.cover_image)) {
    next.cover_image = await uploadImageFromUrl({
      url: next.cover_image!,
      filenameBase: `${base}-cover`,
      req,
      logger,
    })
  }

  if (isLikelyUrl(next.og_image)) {
    next.og_image = await uploadImageFromUrl({
      url: next.og_image!,
      filenameBase: `${base}-og`,
      req,
      logger,
    })
  }

  return next
}
