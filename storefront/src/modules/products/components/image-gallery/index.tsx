"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"

import X from "@modules/common/icons/x"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

type ArrowProps = {
  direction: "left" | "right"
}

const Arrow = ({ direction }: ArrowProps) => {
  const style: CSSProperties | undefined =
    direction === "left" ? { transform: "scaleX(-1)" } : undefined

  return (
    <svg
      width={12}
      height={20}
      viewBox="0 0 12 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      role="presentation"
    >
      <path
        d="M2 2L10 10L2 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const totalImages = images.length
  const hasMultipleImages = useMemo(() => totalImages > 1, [totalImages])

  useEffect(() => {
    setActiveIndex((current) => {
      if (totalImages === 0) {
        return 0
      }

      if (current > totalImages - 1) {
        return 0
      }

      return current
    })
  }, [totalImages])

  useEffect(() => {
    if (!isLightboxOpen) {
      document.body.style.removeProperty("overflow")
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false)
        return
      }

      if (event.key === "ArrowRight" && totalImages) {
        setActiveIndex((current) => (current + 1) % totalImages)
        return
      }

      if (event.key === "ArrowLeft" && totalImages) {
        setActiveIndex((current) => (current - 1 + totalImages) % totalImages)
      }
    }

    document.body.style.setProperty("overflow", "hidden")
    document.addEventListener("keydown", handleKeydown)

    return () => {
      document.body.style.removeProperty("overflow")
      document.removeEventListener("keydown", handleKeydown)
    }
  }, [isLightboxOpen, totalImages])

  if (!totalImages) {
    return (
      <Container className="relative aspect-[4/5] w-full overflow-hidden rounded-none bg-ui-bg-subtle shadow-sm" />
    )
  }

  const handleSelectIndex = (nextIndex: number) => {
    const normalizedIndex = (nextIndex + totalImages) % totalImages
    setActiveIndex(normalizedIndex)
  }

  const handleNext = () => handleSelectIndex(activeIndex + 1)
  const handlePrev = () => handleSelectIndex(activeIndex - 1)

  const activeImage = images[activeIndex]

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 xsmall:gap-5 small:flex-row small:items-start small:gap-7">
      <div
        className="order-2 flex w-full items-center gap-3 overflow-x-auto pb-2 pl-1 pr-1 [-ms-overflow-style:none] small:order-1 small:max-h-[620px] small:min-w-[140px] small:w-auto small:flex-col small:items-start small:gap-4 small:overflow-x-hidden small:overflow-y-auto small:pb-0"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((image, index) => {
          const isActive = index === activeIndex

          return (
            <button
              key={image.id || image.url || index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border border-transparent bg-[#F3EAE2] transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89E8B] xsmall:h-24 xsmall:w-24 small:h-28 small:w-28 ${isActive ? "border-[#C9B7A8]" : "hover:border-[#C9B7A8]"}`}
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={isActive}
            >
              {image.url && (
                <Image
                  src={image.url}
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="order-1 min-w-0 flex-1 small:order-2">
        <Container className="relative aspect-[4/5] w-full min-w-0 overflow-hidden rounded-none bg-white shadow-lg">
          {hasMultipleImages && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-2 xsmall:px-3 sm:px-4">
              <button
                type="button"
                onClick={handlePrev}
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E3DAD3] bg-white/95 text-[#3A322D] shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition hover:bg-white sm:h-12 sm:w-12"
                aria-label="View previous image"
              >
                <Arrow direction="left" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E3DAD3] bg-white/95 text-[#3A322D] shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition hover:bg-white sm:h-12 sm:w-12"
                aria-label="View next image"
              >
                <Arrow direction="right" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-[#E3DAD3] bg-white/95 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6F6157] shadow-sm transition hover:text-[#3A322D] xsmall:right-4 xsmall:top-4 xsmall:bottom-auto xsmall:text-xs"
          >
            View large
          </button>

          {activeImage?.url && (
            <Image
              src={activeImage.url}
              priority={activeIndex <= 2}
              alt={`Product image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 576px) 320px, (max-width: 768px) 480px, (max-width: 992px) 640px, 960px"
              className="object-cover"
            />
          )}

          {hasMultipleImages && (
            <div className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#6F6157] shadow-sm xsmall:bottom-4 xsmall:text-xs">
              <span className="hidden sm:inline tracking-[0.25em] text-[11px] uppercase text-[#8C7B6F]">
                {activeIndex + 1} / {totalImages}
              </span>
              <div className="flex items-center gap-1.5">
                {images.map((image, index) => {
                  const isActive = index === activeIndex
                  return (
                    <button
                      key={image.id || image.url || index}
                      type="button"
                      onClick={() => handleSelectIndex(index)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        isActive
                          ? "bg-ui-fg-base"
                          : "bg-ui-border-base hover:bg-ui-fg-subtle"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </Container>
      </div>

      {isLightboxOpen && activeImage?.url && (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-ui-bg-base/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-sm font-medium text-ui-fg-subtle">
              Image {activeIndex + 1} of {totalImages}
            </p>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-xs uppercase tracking-wide text-ui-fg-muted transition hover:text-ui-fg-base"
              aria-label="Close gallery"
            >
              <X size="16" />
              Close
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-6 pb-10">
            {hasMultipleImages && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-8 inline-flex h-12 w-12 items-center justify-center rounded-full border border-ui-border-base/20 bg-white/95 text-ui-fg-base shadow-[0_20px_44px_rgba(15,23,42,0.25)] transition hover:bg-white"
                aria-label="View previous image"
              >
                <Arrow direction="left" />
              </button>
            )}

            <div className="relative h-full w-full max-h-[85vh] max-w-5xl">
              <Image
                key={activeImage.url}
                src={activeImage.url}
                alt={`Product image ${activeIndex + 1} enlarged`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {hasMultipleImages && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-8 inline-flex h-12 w-12 items-center justify-center rounded-full border border-ui-border-base/20 bg-white/95 text-ui-fg-base shadow-[0_20px_44px_rgba(15,23,42,0.25)] transition hover:bg-white"
                aria-label="View next image"
              >
                <Arrow direction="right" />
              </button>
            )}
          </div>
          {hasMultipleImages && (
            <div className="flex items-center justify-center gap-1.5 pb-6">
              {images.map((image, index) => {
                const isActive = index === activeIndex
                return (
                  <button
                    key={`lightbox-${image.id || image.url || index}`}
                    type="button"
                    onClick={() => handleSelectIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      isActive
                        ? "bg-ui-fg-base"
                        : "bg-ui-border-base hover:bg-ui-fg-subtle"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
