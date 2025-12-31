const isAbsolute = (value: string) =>
  /^(https?:|data:|blob:|\/\/)/i.test(value)

export const resolveMediaUrl = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  if (isAbsolute(trimmed)) {
    return trimmed
  }

  const base =
    (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:9000").replace(/\/$/, "")

  try {
    return new URL(trimmed, `${base}/`).toString()
  } catch {
    return trimmed
  }
}
