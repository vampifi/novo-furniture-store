import RoomsCarousel from "./rooms-carousel"
import { getCollectionsList } from "@lib/data/collections"

interface RoomDefinition {
  label: string
  handles: string[]
}

const ROOM_COLLECTIONS: RoomDefinition[] = [
  { label: "Livings", handles: ["livings", "living-room", "living-room-furniture"] },
  { label: "Bedroom", handles: ["bedroom", "bedroom-furniture"] },
  { label: "Dining", handles: ["dining", "dining-room", "dining-room-furniture"] },
  { label: "Hallway", handles: ["hallway", "hallway-storage"] },
  { label: "Home Office", handles: ["home-office", "office", "study"] },
  { label: "Bathroom", handles: ["bathroom", "bathroom-storage"] },
  { label: "Kitchen", handles: ["kitchen", "kitchen-dining"] },
  { label: "Garden", handles: ["garden", "outdoor", "outdoor-living"] },
  { label: "Kids", handles: ["kids", "kids-room", "children"] },
]

interface ShopByRoomCard {
  label: string
  href: string
  backgroundImage?: string | null
}

const FALLBACK_IMAGES: Record<string, string> = {
  Bedroom:
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452014/bronte-ottoman-storage-bed-ecru-9433963_1024x1024_crop_center_ea32ee.webp",
  Dining:
    "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp",
  Livings:
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452712/soho-3-seater-sofa-grey-902879_1024x1024_crop_center_pvkllw.webp"
}

const normalize = (value: string | undefined | null) =>
  (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")

const ShopByRoom = async () => {
  const { collections } = await getCollectionsList(0, 100)

  if (!collections?.length) {
    return null
  }

  const seen = new Set<string>()

  const cards = ROOM_COLLECTIONS.map(({ label, handles }) => {
    const normalizedCandidates = handles.map(normalize)

    const match = collections.find((collection) => {
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
      href: match.handle ? `/collections/${match.handle}` : `/collections/${match.id}`,
      backgroundImage:
        (match?.metadata?.hero_image as string | undefined) || FALLBACK_IMAGES[label],
    } satisfies ShopByRoomCard
  }).filter(Boolean) as ShopByRoomCard[]

  if (!cards.length) {
    return null
  }

  return <RoomsCarousel rooms={cards} />
}

export default ShopByRoom
