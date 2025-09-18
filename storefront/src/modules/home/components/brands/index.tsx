"use client"

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { HiArrowRight } from 'react-icons/hi'

const BrandsSection = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current
    const progress = progressRef.current

    if (!video || !progress) return

    const updateProgress = () => {
      const percentage = (video.currentTime / video.duration) * 100
      progress.style.width = `${percentage}%`
    }

    video.addEventListener('timeupdate', updateProgress)
    return () => video.removeEventListener('timeupdate', updateProgress)
  }, [])

  return (
    <section className="w-full py-10 md:py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header - Visible on all screens */}
        <div className="flex justify-center text-center mb-6 md:mb-12 lg:mb-16">
          <p className="font-normal text-[#474546] text-base md:text-lg lg:text-xl tracking-wide">
            AS SEEN IN
          </p>
        </div>

        {/* Brand Logos - Responsive grid */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 md:mb-16 lg:mb-20">
          {[
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
            }
          ].map((brand) => (
            <div key={brand.id} className="flex justify-center items-center p-2">
              <div className="relative w-full h-12 sm:h-16 md:h-20 lg:h-24 transition-opacity hover:opacity-80">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain"
                  quality={100}
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 30vw, 25vw"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Video and Text Content - Stack on mobile, side by side on desktop */}
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-start mb-20">
          {/* Video Section - Full width on mobile, half on desktop */}
          <div className="w-full lg:w-1/2">
            <div className="relative rounded-lg md:rounded-xl overflow-hidden bg-gray-100 shadow-md md:shadow-lg aspect-video w-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source 
                  src="https://res.cloudinary.com/dhbh2lu21/video/upload/v1758206023/novo-brands1_ewmgch.mp4" 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
              
              {/* Play/Pause overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
              }`}>
                <button
                  onClick={togglePlay}
                  className="p-2 sm:p-3 md:p-4 rounded-full bg-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  <svg 
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-800" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {isPlaying ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Video progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  ref={progressRef}
                  className="h-full bg-white/90 transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Text Content - Full width on mobile, half on desktop */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] xl:text-5xl font-light text-[#474546] mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight">
              All of a sudden you want more
              duvet days.
            </h2>
            
            <div className="mb-3 sm:mb-4 md:mb-5">
              <span className="inline-block text-[#474546] text-xs sm:text-sm font-medium tracking-wide uppercase">
                #DualsGavin
              </span>
            </div>
            
            <p className="text-sm sm:text-base md:text-lg text-[#474546] mb-5 sm:mb-6 md:mb-7 leading-relaxed opacity-95">
              Explore our diverse selections of beds, from luxurious king-size frames to 
              space-saving sofa beds, designed to suit every style and budget.
            </p>
            
            <div>
              <button className="flex items-center justify-center gap-2 sm:gap-3 bg-[#474546] hover:bg-gray-700 text-white px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 rounded-full font-medium transition-all duration-300 w-full sm:w-fit group shadow-md hover:shadow-lg">
                <span>SHOP BEDS</span>
                <HiArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" /> 
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-start">
         
          {/* Text Content - Full width on mobile, half on desktop */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-5">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] xl:text-5xl font-light text-[#474546] mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight">
            We&apos;re like those high quality expensive brands. Just not the expensive bit.
            </h2>
            
            
            <p className="text-sm sm:text-base md:text-lg text-[#474546] mb-5 sm:mb-6 md:mb-7 leading-relaxed opacity-95">
              Discover our collection of sofas, featuring everything from cosy loveseats perfect for small spaces to luxurious sectional sofas ideal for entertaining guests. Find the perfect blend of comfort and style to complement
your home.
            </p>
            
            <div>
              <button className="flex items-center justify-center gap-2 sm:gap-3 bg-[#474546] hover:bg-gray-700 text-white px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 rounded-full font-medium transition-all duration-300 w-full sm:w-fit group shadow-md hover:shadow-lg">
                <span>SHOP BEDS</span>
                <HiArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" /> 
              </button>
            </div>
          </div>
         
          {/* Video Section - Full width on mobile, half on desktop */}
          <div className="w-full lg:w-1/2">
            <div className="relative rounded-lg md:rounded-xl overflow-hidden bg-gray-100 shadow-md md:shadow-lg aspect-video w-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source 
                  src="https://res.cloudinary.com/dhbh2lu21/video/upload/v1758218794/novo-furniture-2_fjunhp.mp4" 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
              
              {/* Play/Pause overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
              }`}>
                <button
                  onClick={togglePlay}
                  className="p-2 sm:p-3 md:p-4 rounded-full bg-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  <svg 
                    className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-800" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {isPlaying ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Video progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  ref={progressRef}
                  className="h-full bg-white/90 transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>

         



        </div>
      </div>
    </section>
  )
}

export default BrandsSection