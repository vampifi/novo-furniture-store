import { getCollectionsList } from "@lib/data/collections"
import { buildCollectionHref } from "@lib/util/collection-urls"
import { HttpTypes } from "@medusajs/types"

import RoomsCarousel from "./rooms-carousel"

interface RoomDefinition {
  label: string
  handles: string[]
}

export const ROOM_COLLECTIONS: RoomDefinition[] = [
  {
    label: "Living room",
    handles: ["living-room", "livingroom", "living", "living-room-furniture"],
  },
  { label: "Dining", handles: ["dining", "dining-room", "dining-room-furniture"] },
  { label: "Bedroom", handles: ["bedroom", "bedroom-furniture"] },
  {
    label: "Kids & Baby",
    handles: ["kids-baby", "kids", "kids-and-baby", "baby", "children"],
  },
  {
    label: "Home office",
    handles: ["home-office", "homeoffice", "office", "study"],
  },
]

export interface ShopByRoomCard {
  label: string
  href: string
  backgroundImage?: string | null
}

const FALLBACK_IMAGES: Record<string, string> = {
  "Living room":
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452712/soho-3-seater-sofa-grey-902879_1024x1024_crop_center_pvkllw.webp",
  Bedroom:
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452014/bronte-ottoman-storage-bed-ecru-9433963_1024x1024_crop_center_ea32ee.webp",
  Dining:
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp",
  "Kids & Baby":
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp",
  "Home office":
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758446647/evie-small-sideboard-wood-effect-759151_veqvi7.webp",
}

export const normalize = (value: string | undefined | null) =>
  (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")

export const SHOP_BY_ROOM_IDENTIFIERS = new Set(
  ROOM_COLLECTIONS.flatMap(({ label, handles }) => {
    const normalizedLabel = normalize(label)
    const normalizedHandles = handles.map((handle) => normalize(handle))

    return [normalizedLabel, ...normalizedHandles].filter(Boolean)
  })
)

export const buildShopByRoomCards = (
  collections: HttpTypes.StoreCollection[] | null | undefined
): ShopByRoomCard[] => {
  const seen = new Set<string>()

  const cards = ROOM_COLLECTIONS.map(({ label, handles }) => {
    const normalizedCandidates = handles.map(normalize)

    const match = (collections || []).find((collection) => {
      if (!collection) {
        return false
      }

      const normalizedHandle = normalize(collection.handle)
      const normalizedTitle = normalize(collection.title)

      return (
        !seen.has(collection.id) &&
        normalizedCandidates.some((candidate) =>
          candidate && (normalizedHandle === candidate || normalizedTitle === candidate)
        )
      )
    })

    if (!match) {
      return null
    }

    seen.add(match.id)

    return {
      label,
      href: buildCollectionHref(match.handle, match.id),
      backgroundImage:
        (match?.metadata?.hero_image as string | undefined) || FALLBACK_IMAGES[label],
    } satisfies ShopByRoomCard
  }).filter(Boolean) as ShopByRoomCard[]

  return cards
}

const ShopByRoom = async () => {
  const { collections } = await getCollectionsList(0, 100)

  if (!collections?.length) {
    return null
  }

  const cards = buildShopByRoomCards(collections)

  if (!cards.length) {
    return null
  }

  return <RoomsCarousel rooms={cards} />
}

export default ShopByRoom
