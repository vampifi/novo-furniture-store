"use client"

import { useCallback, useRef } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface RoomCard {
  label: string
  href: string
  backgroundImage?: string | null
}

const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758446647/evie-small-sideboard-wood-effect-759151_veqvi7.webp"

interface RoomsCarouselProps {
  rooms: RoomCard[]
}

const RoomsCarousel = ({ rooms }: RoomsCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = useCallback((direction: "prev" | "next") => {
    const node = scrollContainerRef.current
    if (!node) {
      return
    }

    const scrollAmount = node.clientWidth * 0.85 || 400
    const delta = direction === "next" ? scrollAmount : -scrollAmount

    node.scrollBy({ left: delta, behavior: "smooth" })
  }, [])

  if (!rooms.length) {
    return null
  }

  return (
    <section className="py-10 sm:py-12 lg:py-16">
      <div className="content-container">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#3b2f2f] sm:text-3xl">
            Shop by room
          </h2>
          <LocalizedClientLink
            href="/collections/rooms"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/80"
          >
            All rooms
            <span aria-hidden="true">{"\u2192"}</span>
          </LocalizedClientLink>
        </div>

        <div className="relative mt-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-8 bg-gradient-to-r" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-8 bg-gradient-to-l" />

          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="no-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 md:gap-6"
            >
              {rooms.map((room) => (
                <LocalizedClientLink
                  key={room.label}
                  href={room.href}
                  className="group relative h-48 w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-[#f3e7e1] shadow-lg transition-transform snap-start sm:h-56 sm:w-48 md:h-64 md:w-60 lg:h-72 lg:w-64"
                >
                  <div
                    className="absolute inset-0 scale-105 bg-cover bg-center transition duration-300 group-hover:scale-110 group-hover:opacity-60"
                    style={{
                      backgroundImage: `url(${room.backgroundImage || DEFAULT_IMAGE})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/25 to-transparent transition duration-300 group-hover:from-black/70 group-hover:via-black/45" />
                  <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                    <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white drop-shadow-sm sm:text-base">
                      {room.label}
                    </span>
                  </div>
                </LocalizedClientLink>
              ))}
            </div>

            <button
              type="button"
              aria-label="Scroll rooms left"
              className="absolute left-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border border-[#d8cfc8] bg-white/95 text-[#3b2f2f] shadow-xl transition hover:bg-white md:flex"
              onClick={() => handleScroll("prev")}
            >
              <span aria-hidden="true">{"\u2039"}</span>
            </button>

            <button
              type="button"
              aria-label="Scroll rooms right"
              className="absolute right-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-[#d8cfc8] bg-white/95 text-[#3b2f2f] shadow-xl transition hover:bg-white md:flex"
              onClick={() => handleScroll("next")}
            >
              <span aria-hidden="true">{"\u203a"}</span>
            </button>

            <div className="mt-4 flex justify-center gap-3 md:hidden">
              <button
                type="button"
                aria-label="Scroll rooms left"
                className="h-10 w-10 rounded-full border border-[#d8cfc8] bg-white text-[#3b2f2f] shadow-md transition hover:bg-[#f5ece6]"
                onClick={() => handleScroll("prev")}
              >
                <span aria-hidden="true">{"\u2039"}</span>
              </button>
              <button
                type="button"
                aria-label="Scroll rooms right"
                className="h-10 w-10 rounded-full border border-[#d8cfc8] bg-white text-[#3b2f2f] shadow-md transition hover:bg-[#f5ece6]"
                onClick={() => handleScroll("next")}
              >
                <span aria-hidden="true">{"\u203a"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RoomsCarousel
