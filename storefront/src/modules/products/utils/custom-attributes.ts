import { StoreProductCustomAttribute } from "@lib/data/products"
import { Text } from "@medusajs/ui"
import React from "react"

export const formatCustomAttributeValue = (
  attribute: StoreProductCustomAttribute
): string | null => {
  if (!attribute.value && !attribute.options) {
    return null
  }

  const raw = attribute.value ?? attribute.options ?? null

  if (typeof raw !== "string") {
    return raw ?? null
  }

  const trimmed = raw.trim()

  if (!trimmed.length) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)

    if (Array.isArray(parsed)) {
      return parsed.map(String).join(", ") || null
    }

    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    }
  } catch (error) {
    // Value is not JSON formatted; fall back to raw string
  }

  return trimmed
}

export const isLikelyUrl = (value: string) => {
  try {
    const url = new URL(value)
    return Boolean(url.protocol && url.host)
  } catch (error) {
    return false
  }
}

export const isLikelyImageUrl = (value: string) => {
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
  const lowerValue = value.toLowerCase()
  return imageExtensions.some((extension) => lowerValue.endsWith(extension))
}

export const renderAttributeValue = (
  value: string | null,
  type?: string
) => {
  if (!value) {
    return <Text className="text-base text-[#4A4038]">-</Text>
  }

  if (type === "file" && isLikelyUrl(value)) {
    if (isLikelyImageUrl(value)) {
      return (
        <img
          src={value}
          alt="Product attribute"
          className="max-h-32 w-auto rounded-md border border-[#E3DAD3] object-cover"
        />
      )
    }

    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-base text-[#2F6ADE] underline hover:text-[#1A4FAA]"
      >
        Download
      </a>
    )
  }

  return (
    <Text className="whitespace-pre-line text-base text-[#4A4038]">{value}</Text>
  )
}
