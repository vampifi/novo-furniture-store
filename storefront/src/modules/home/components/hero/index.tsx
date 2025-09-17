import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import Image from "next/image"

const Hero = () => {
  return (
    <div className="h-96 w-full border-b border-ui-border-base relative bg-ui-bg-subtle bg-background">
    <Image 
      src="https://res.cloudinary.com/dhbh2lu21/image/upload/v1758089072/WebBanner_Novo-furniture_ay0axy.webp"
      alt="Novo furniture Hero Image"
      className="h-auto max-w-full object-cover"
      layout="fill"
    />
    </div>

    
  )
}

export default Hero


{/* <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
      </div> */}