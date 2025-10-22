import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionsList } from "@lib/data/collections"
import { buildCollectionHref } from "@lib/util/collection-urls"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import {
  SHOP_BY_ROOM_IDENTIFIERS,
  normalize as normalizeCollectionId,
} from "@modules/home/components/shop-by-room"

const IMAGE_KEYS = [
  "hero_image",
  "heroImage",
  "banner",
  "banner_image",
  "bannerImage",
  "image",
  "thumbnail",
]

const DEFAULT_COLLECTION_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp"

const getCollectionImage = (collection: HttpTypes.StoreCollection) => {
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

const isRoomCollection = (collection: HttpTypes.StoreCollection) => {
  const normalizedHandle = normalizeCollectionId(collection.handle)
  const normalizedTitle = normalizeCollectionId(collection.title)

  return (
    (normalizedHandle && SHOP_BY_ROOM_IDENTIFIERS.has(normalizedHandle)) ||
    (normalizedTitle && SHOP_BY_ROOM_IDENTIFIERS.has(normalizedTitle))
  )
}

const CollectionGridCard = ({ collection }: { collection: HttpTypes.StoreCollection }) => {
  const backgroundImage = `url(${getCollectionImage(collection)})`
  const href = buildCollectionHref(collection.handle, collection.id)

  return (
    <LocalizedClientLink
      href={href}
      className="group relative flex h-60 w-full flex-col overflow-hidden rounded-2xl bg-[#f6efe9] shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl sm:h-64 md:h-72"
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center transition duration-300 group-hover:scale-110 group-hover:opacity-60"
        style={{ backgroundImage }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/25 to-transparent transition duration-300 group-hover:from-black/70 group-hover:via-black/45" />
      <div className="relative mt-auto p-6">
        <span className="text-base font-semibold uppercase tracking-[0.35em] text-white drop-shadow-sm sm:text-lg">
          {collection.title || collection.handle || "Collection"}
        </span>
      </div>
    </LocalizedClientLink>
  )
}

export const metadata: Metadata = {
  title: "All collections | NOVO Store",
  description: "Discover every collection available in the NOVO Store catalog.",
}

const AllCollectionsPage = async () => {
  const { collections } = await getCollectionsList(0, 100)
  const visibleCollections = (collections || []).filter(
    (collection) => collection && !isRoomCollection(collection)
  )

  if (!visibleCollections.length) {
    notFound()
  }

  return (
    <section className="py-10 sm:py-12 lg:py-16">
      <div className="content-container space-y-8">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold text-[#3b2f2f] sm:text-4xl">
            All collections
          </h1>
          <p className="text-sm leading-6 text-[#5b4a4a] sm:text-base">
            Explore every collection the team has curated outside the featured rooms.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleCollections.map((collection) => (
            <CollectionGridCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default AllCollectionsPage
