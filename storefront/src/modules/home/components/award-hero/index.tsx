import Image from "next/image"

const AwardHero = () => {
  return (
    <div className="relative w-full border-b border-ui-border-base bg-ui-bg-subtle bg-background">
      {/* Mobile-first responsive container with aspect ratio */}
      <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 xl:h-96 2xl:h-[28rem] overflow-hidden">
        <Image 
          src="https://res.cloudinary.com/dhbh2lu21/image/upload/v1758301005/novo-furniture4_svrydv.webp"
          alt="Novo furniture Hero Image"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 100vw"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-50"></div>
      </div>
    </div>
  )
}

export default AwardHero