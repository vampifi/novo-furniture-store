import { getCollectionsList } from "@lib/data/collections"
import { buildCollectionHref } from "@lib/util/collection-urls"
import { HttpTypes } from "@medusajs/types"

import CollectionsCarousel, { CollectionCard } from "./collections-carousel"
import { SHOP_BY_ROOM_IDENTIFIERS, normalize as normalizeCollectionId } from "../shop-by-room"

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
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1761150615/madison-ottoman-storage-bed-taupe-9_1024x1024_crop_center_et9nj2.webp",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1761150701/973136_1024x1024_crop_center_gewj21.webp",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1761150670/verity-accent-chair-smoke-grey-2685475_1024x1024_crop_center_moa2sv.webp",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1761150647/lyon-pouffe-speckled-sand-boucle-89146_1024x1024_crop_center_myllju.jpg",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1761150635/lola-set-of-2-dining-chairs-boucle-taupe-7_1024x1024_crop_center_ymqkf8.webp",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1761150615/madison-ottoman-storage-bed-taupe-9_1024x1024_crop_center_et9nj2.webp",
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

const isShopByRoomCollection = (collection: HttpTypes.StoreCollection) => {
  const normalizedHandle = normalizeCollectionId(collection.handle)
  const normalizedTitle = normalizeCollectionId(collection.title)

  return (
    (normalizedHandle && SHOP_BY_ROOM_IDENTIFIERS.has(normalizedHandle)) ||
    (normalizedTitle && SHOP_BY_ROOM_IDENTIFIERS.has(normalizedTitle))
  )
}

const mapCollectionToCard = (collection: HttpTypes.StoreCollection): CollectionCard => {
  const label = collection.title || collection.handle || "Collection"
  const href = buildCollectionHref(collection.handle, collection.id)

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

  const nonRoomCollections = collections.filter((collection) => !isShopByRoomCollection(collection))

  if (!nonRoomCollections.length) {
    return null
  }

  const trendingCollections = nonRoomCollections.filter(getIsTrending)

  const prioritized = trendingCollections.length ? trendingCollections : nonRoomCollections

  const uniqueById = new Map<string, HttpTypes.StoreCollection>()
  for (const collection of prioritized) {
    if (!uniqueById.has(collection.id)) {
      uniqueById.set(collection.id, collection)
    }
  }

  if (uniqueById.size < 8) {
    for (const collection of nonRoomCollections) {
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
