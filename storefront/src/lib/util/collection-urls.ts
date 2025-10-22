export const sanitizeHandle = (
  handle?: string | null
): string | undefined => {
  if (typeof handle !== "string") {
    return undefined
  }

  const trimmed = handle.trim()
  if (!trimmed) {
    return undefined
  }

  const withoutLeading = trimmed.replace(/^\/+/, "")
  const sanitized = withoutLeading.replace(/\/+$/, "")

  return sanitized || undefined
}

export const buildCollectionHref = (
  handle?: string | null,
  fallbackId?: string | null
): string => {
  const sanitizedHandle = sanitizeHandle(handle)

  if (sanitizedHandle) {
    return `/collections/${sanitizedHandle}`
  }

  if (fallbackId) {
    return `/collections/${fallbackId}`
  }

  return "/collections"
}
