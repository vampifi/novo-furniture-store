import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionsList } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  ShopByRoomCard,
  buildShopByRoomCards,
} from "@modules/home/components/shop-by-room"

export const metadata: Metadata = {
  title: "All rooms | NOVO Store",
  description: "Explore every room-specific collection available in the NOVO Store.",
}

const RoomsGridCard = ({ room }: { room: ShopByRoomCard }) => {
  const backgroundImage = room.backgroundImage
    ? `url(${room.backgroundImage})`
    : undefined

  return (
    <LocalizedClientLink
      href={room.href}
      className="group relative flex h-60 w-full flex-col overflow-hidden rounded-2xl bg-[#f3e7e1] shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl sm:h-64 md:h-72"
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center transition duration-300 group-hover:scale-110 group-hover:opacity-60"
        style={{ backgroundImage }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/25 to-transparent transition duration-300 group-hover:from-black/70 group-hover:via-black/45" />
      <div className="relative mt-auto p-6">
        <span className="text-base font-semibold uppercase tracking-[0.35em] text-white drop-shadow-sm sm:text-lg">
          {room.label}
        </span>
      </div>
    </LocalizedClientLink>
  )
}

const RoomsCollectionsPage = async () => {
  const { collections } = await getCollectionsList(0, 100)
  const rooms = buildShopByRoomCards(collections)

  if (!rooms.length) {
    notFound()
  }

  return (
    <section className="py-10 sm:py-12 lg:py-16">
      <div className="content-container space-y-8">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold text-[#3b2f2f] sm:text-4xl">
            All rooms
          </h1>
          <p className="text-sm leading-6 text-[#5b4a4a] sm:text-base">
            Browse each curated room to find furniture and décor tailored to your space.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomsGridCard key={room.label} room={room} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default RoomsCollectionsPage
