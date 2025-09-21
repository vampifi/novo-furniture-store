"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { HiArrowRight } from "react-icons/hi"

type BrandLogo = {
  id: number
  name: string
  logo: string
}

type BrandHighlight = {
  id: number
  eyebrow: string
  heading: string
  description: string
  ctaLabel: string
  videoSrc: string
  reverse?: boolean
}

const BRAND_LOGOS: BrandLogo[] = [
  {
    id: 1,
    name: "Elle",
    logo: "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758206019/elle_u5q6hi.png",
  },
  {
    id: 2,
    name: "Evening Standard",
    logo: "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758206019/Evening_Standard_logo_2_l693km.png",
  },
  {
    id: 3,
    name: "GQ",
    logo: "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758206019/GQ_1_ggf1nu.png",
  },
]

const BRAND_HIGHLIGHTS: BrandHighlight[] = [
  {
    id: 1,
    eyebrow: "#DualsGavin",
    heading: "All of a sudden you want more duvet days.",
    description:
      "Explore our diverse selections of beds, from luxurious king-size frames to space-saving sofa beds, designed to suit every style and budget.",
    ctaLabel: "SHOP BEDS",
    videoSrc: "https://res.cloudinary.com/dhbh2lu21/video/upload/v1758206023/novo-brands1_ewmgch.mp4",
  },
  {
    id: 2,
    eyebrow: "#NovoLiving",
    heading: "We're like those high quality expensive brands. Just not the expensive bit.",
    description:
      "Discover our collection of sofas, featuring everything from cosy loveseats perfect for small spaces to luxurious sectional sofas ideal for entertaining guests. Find the perfect blend of comfort and style to complement your home.",
    ctaLabel: "SHOP SOFAS",
    videoSrc: "https://res.cloudinary.com/dhbh2lu21/video/upload/v1758218794/novo-furniture-2_fjunhp.mp4",
    reverse: true,
  },
]

const BrandsSection = () => {
  return (
    <section className="mx-auto w-full bg-gradient-to-b from-[#f6ede4] via-[#f5ece3] to-[#f1e3d8] py-16 md:py-20 lg:py-24">
      <div className="container mx-auto flex w-full flex-col gap-9 lg:px-16">
        <div className="hidden md:flex w-full justify-center pb-12">
          <p className="text-xs font-medium tracking-[0.7em] text-[#8c7d70]">
            AS SEEN IN
          </p>
        </div>

        <div className="hidden md:grid grid-cols-3 items-center gap-14 pb-16">
          {BRAND_LOGOS.map((brand) => (
            <div key={brand.id} className="flex w-full justify-center">
              <div className="relative h-20 w-48 transition-opacity duration-200 hover:opacity-80">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain"
                  quality={100}
                  sizes="176px"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-16 lg:gap-20">
          {BRAND_HIGHLIGHTS.map((highlight) => (
            <BrandHighlightBlock key={highlight.id} highlight={highlight} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default BrandsSection

type BrandHighlightBlockProps = {
  highlight: BrandHighlight
}

const BrandHighlightBlock = ({ highlight }: BrandHighlightBlockProps) => {
  const { eyebrow, heading, description, ctaLabel, videoSrc, reverse } = highlight

  const gridColumns = reverse
    ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
    : "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
  const textColumnSpacing = reverse
    ? "lg:pr-12 xl:pr-16"
    : "lg:pl-12 xl:pl-16"

  return (
    <div
      className={`grid grid-cols-1 ${gridColumns} items-center gap-12 lg:gap-[4rem] xl:gap-[6rem]`}
    >
      <div className={`order-1 ${reverse ? "lg:order-2" : "lg:order-1"}`}>
        <BrandVideoCard src={videoSrc} ariaLabel={`${ctaLabel.toLowerCase()} video`} />
      </div>

      <div
        className={`order-2 flex flex-col justify-center gap-3 sm:gap-4 text-left ${
          reverse ? "lg:order-1" : "lg:order-2"
        } ${textColumnSpacing}`}
      >
        <span className="text-sm font-medium italic tracking-wide text-[#8f7b69]">
          {eyebrow}
        </span>
        <h2 className="max-w-lg text-2xl font-semibold leading-tight text-[#2d2419] sm:text-3xl md:text-4xl lg:text-[2.65rem]">
          {heading}
        </h2>
        <p className="max-w-xl text-[0.98rem] leading-[1.85] text-[#5e5144]">
          {description}
        </p>
        <button
          type="button"
          className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#2f2517] px-8 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-[0_18px_40px_rgba(47,37,23,0.24)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#21180f] hover:shadow-[0_20px_46px_rgba(47,37,23,0.32)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8c6b6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5ece3] sm:w-auto"
        >
          <span>{ctaLabel}</span>
          <HiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}

type BrandVideoCardProps = {
  src: string
  ariaLabel?: string
}

const BrandVideoCard = ({ src, ariaLabel }: BrandVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) {
        setProgress(0)
        return
      }

      setProgress((video.currentTime / video.duration) * 100)
    }
    const handleEnded = () => {
      setProgress(0)
      setIsPlaying(false)
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current

    if (!video) return

    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  return (
    <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[34px] border border-white/40 bg-[#eee0d4] shadow-[0_30px_80px_-45px_rgba(61,41,20,0.55)]">
      <video
        ref={videoRef}
        className="h-full w-full cursor-pointer object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
        loop
        muted
        playsInline
        onClick={togglePlay}
        aria-label={ariaLabel}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />

      <button
        type="button"
        onClick={togglePlay}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#3b301f] shadow-lg transition-transform duration-300 hover:scale-105"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          {isPlaying ? (
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>

      <div className="absolute inset-x-7 bottom-5 h-[3px] overflow-hidden rounded-full bg-white/40">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
