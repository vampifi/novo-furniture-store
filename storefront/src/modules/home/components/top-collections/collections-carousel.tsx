"use client"

import { useCallback, useRef } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export interface CollectionCard {
  id: string
  label: string
  href: string
  backgroundImage?: string | null
}

const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp"

const FALLBACK_IMAGES = [
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp",
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp",
]

interface CollectionsCarouselProps {
  collections: CollectionCard[]
}

const CollectionsCarousel = ({ collections }: CollectionsCarouselProps) => {
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

  if (!collections.length) {
    return null
  }

  return (
    <section className="py-10 sm:py-12 lg:py-16">
      <div className="content-container">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#3b2f2f] sm:text-3xl">
            Trending this week
          </h2>
          <LocalizedClientLink
            href="/collections"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/80"
          >
            All collections
            <span aria-hidden="true">{"\u2192"}</span>
          </LocalizedClientLink>
        </div>

        <div className="relative mt-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-8 " />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-8 " />

          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="no-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 md:gap-6"
            >
              {collections.map((collection, index) => {
                const fallbackImage = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] || DEFAULT_IMAGE
                const backgroundImage = collection.backgroundImage || fallbackImage || DEFAULT_IMAGE

                return (
                  <LocalizedClientLink
                    key={collection.id}
                    href={collection.href}
                    className="group relative h-80 w-56 flex-shrink-0 overflow-hidden rounded-[18px]  shadow-xl transition-transform duration-300 snap-start sm:h-[22rem] sm:w-64 md:h-[24rem] md:w-72 lg:h-[26rem] lg:w-80"
                  >
                    <div
                      className="absolute inset-0 scale-105 bg-cover bg-center transition duration-500 ease-out group-hover:scale-110 group-hover:opacity-60"
                      style={{
                        backgroundImage: `url(${backgroundImage})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/15 transition duration-500 ease-out group-hover:from-black/80 group-hover:via-black/55 group-hover:to-black/20" />
                    <div className="absolute inset-0 flex flex-col items-center justify-between px-7 py-8 text-center text-white">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.55em] text-white/85">
                        Introducing
                      </span>
                      <span className="text-2xl font-semibold uppercase tracking-[0.22em] text-white drop-shadow-lg sm:text-3xl md:text-[2.1rem]">
                        {collection.label}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white/80 md:text-sm">
                        2025 Collections
                      </span>
                    </div>
                    <div className="pointer-events-none absolute inset-3 rounded-[14px] border border-white/15 transition-opacity duration-300 group-hover:border-white/35 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                      <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                      <div className="absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    </div>
                  </LocalizedClientLink>
                )
              })}
            </div>

            <button
              type="button"
              aria-label="Scroll collections left"
              className="absolute left-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border border-[#d8cfc8] bg-white/95 text-[#3b2f2f] shadow-xl transition hover:bg-white md:flex"
              onClick={() => handleScroll("prev")}
            >
              <span aria-hidden="true">{"\u2039"}</span>
            </button>

            <button
              type="button"
              aria-label="Scroll collections right"
              className="absolute right-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-[#d8cfc8] bg-white/95 text-[#3b2f2f] shadow-xl transition hover:bg-white md:flex"
              onClick={() => handleScroll("next")}
            >
              <span aria-hidden="true">{"\u203a"}</span>
            </button>

            <div className="mt-4 flex justify-center gap-3 md:hidden">
              <button
                type="button"
                aria-label="Scroll collections left"
                className="h-10 w-10 rounded-full border border-[#d8cfc8] bg-white text-[#3b2f2f] shadow-md transition hover:bg-[#f5ece6]"
                onClick={() => handleScroll("prev")}
              >
                <span aria-hidden="true">{"\u2039"}</span>
              </button>
              <button
                type="button"
                aria-label="Scroll collections right"
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

export default CollectionsCarousel
