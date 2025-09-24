import { getCollectionsList } from "@lib/data/collections"
import { HttpTypes } from "@medusajs/types"

import CollectionsCarousel, { CollectionCard } from "./collections-carousel"

const TRENDING_FLAG_KEYS = [
  "is_trending",
  "isTrending",
  "home_featured",
  "homeFeatured",
  "featured",
  "is_featured",
  "top_trending",
  "topTrending",
  "show_on_home",
]

const PRIORITY_KEYS = [
  "home_priority",
  "home_order",
  "home_rank",
  "priority",
  "rank",
  "order",
  "position",
  "sort_order",
  "sortOrder",
]

const IMAGE_KEYS = [
  "hero_image",
  "heroImage",
  "banner",
  "banner_image",
  "bannerImage",
  "image",
  "thumbnail",
]

const FALLBACK_IMAGES = [
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp",
]

const DEFAULT_COLLECTION_IMAGE = FALLBACK_IMAGES[0]

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value === 1
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim()
    return ["true", "1", "yes", "y", "on"].includes(normalized)
  }

  return false
}

const parsePriority = (collection: HttpTypes.StoreCollection) => {
  const metadata = (collection.metadata ?? {}) as Record<string, unknown>

  for (const key of PRIORITY_KEYS) {
    const value = metadata[key]
    if (typeof value === "number") {
      return value
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }

  return Number.POSITIVE_INFINITY
}

const getIsTrending = (collection: HttpTypes.StoreCollection) => {
  const metadata = (collection.metadata ?? {}) as Record<string, unknown>

  return TRENDING_FLAG_KEYS.some((key) => normalizeBoolean(metadata[key]))
}

const getImage = (collection: HttpTypes.StoreCollection) => {
  const metadata = (collection.metadata ?? {}) as Record<string, unknown>

  for (const key of IMAGE_KEYS) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim().length) {
      return value
    }
  }

  if (typeof collection.thumbnail === "string" && collection.thumbnail.trim().length) {
    return collection.thumbnail
  }

  return DEFAULT_COLLECTION_IMAGE
}

const mapCollectionToCard = (collection: HttpTypes.StoreCollection): CollectionCard => {
  const label = collection.title || collection.handle || "Collection"
  const href = collection.handle ? `/collections/${collection.handle}` : `/collections/${collection.id}`

  return {
    id: collection.id,
    label,
    href,
    backgroundImage: getImage(collection),
  }
}

const TopCollections = async () => {
  const { collections } = await getCollectionsList(0, 50)

  if (!collections.length) {
    return null
  }

  const trendingCollections = collections.filter(getIsTrending)

  const prioritized = trendingCollections.length ? trendingCollections : collections

  const uniqueById = new Map<string, HttpTypes.StoreCollection>()
  for (const collection of prioritized) {
    if (!uniqueById.has(collection.id)) {
      uniqueById.set(collection.id, collection)
    }
  }

  if (uniqueById.size < 8) {
    for (const collection of collections) {
      if (!uniqueById.has(collection.id)) {
        uniqueById.set(collection.id, collection)
      }
      if (uniqueById.size >= 12) {
        break
      }
    }
  }

  const decorated = Array.from(uniqueById.values()).map((collection, index) => ({
    collection,
    priority: parsePriority(collection),
    index,
  }))

  const ordered = decorated
    .sort((a, b) => {
      const priorityDelta = a.priority - b.priority
      if (Number.isFinite(priorityDelta) && priorityDelta !== 0) {
        return priorityDelta
      }

      if (a.priority === b.priority) {
        return a.index - b.index
      }

      if (!Number.isFinite(a.priority) && Number.isFinite(b.priority)) {
        return 1
      }

      if (Number.isFinite(a.priority) && !Number.isFinite(b.priority)) {
        return -1
      }

      return a.index - b.index
    })
    .map((item) => item.collection)

  const cards = ordered.map(mapCollectionToCard)

  if (!cards.length) {
    return null
  }

  return <CollectionsCarousel collections={cards} />
}

export default TopCollections
