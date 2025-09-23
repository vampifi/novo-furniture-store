import Image from "next/image"

const HERO_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp"

const SECONDARY_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758452078/st-ives-light-weight-knit-cushion-cover-ballet-slipper-175304_1024x1024_crop_center_gtweyq.webp"

const AboutTemplate = () => {
  return (
    <div className="bg-[#faf6f3] text-[#372f2a]">
      <section className="relative isolate">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={HERO_IMAGE}
            alt="Plush bedroom setting"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#16110f]/45" />
        </div>
        <div className="relative z-10 flex min-h-[380px] items-center justify-center px-6 py-24 text-center sm:min-h-[460px]">
          <div className="max-w-3xl space-y-7">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">
              Our Story
            </p>
            <h1 className="font-serif text-[46px] leading-[1.05] tracking-[0.01em] text-white sm:text-[58px] md:text-[66px]">
              Delivering luxury for less. Always.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-white/85 sm:text-[18px]">
              Beautiful design should feel effortless. From signature bedding to
              heirloom-inspired furniture, every Novo piece is crafted to bring
              warmth, comfort, and distinction to daily life.
            </p>
          </div>
        </div>
      </section>

      <section className="content-container py-16 md:py-20">
        <div className="space-y-5 text-center">
          <h2 className="font-serif text-[34px] tracking-[0.02em] text-[#2b221d] sm:text-[42px]">
            Our Promise To You
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-[#5a4f48]">
            We do things differently at Novo to bring you the very best in value
            and quality for the home. Leading with exceptional prices on
            furniture, bedding, lighting, and more, our mission will never
            change: <span className="font-semibold">Delivering luxury for less. Always.</span>
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <h3 className="font-serif text-[30px] tracking-[0.01em] text-[#2b221d] sm:text-[34px]">
              Amazing Prices
            </h3>
            <p className="text-[17px] leading-8 text-[#5a4f48]">
              Everyone deserves elevated design, which is why we work tirelessly
              to craft thoughtful collections without the premium mark-up.
              Through direct design and exclusive partnerships, we keep prices
              fair and transparent so you can create your dream home with ease.
            </p>
            <p className="text-[17px] leading-8 text-[#5a4f48]">
              Enjoy seasonal offers, flexible payment options, and bundles
              curated to help you refresh every room without compromise.
            </p>
          </div>
          <div className="relative h-[260px] w-full overflow-hidden sm:h-[340px] md:h-[380px]">
            <Image
              src={HERO_IMAGE}
              alt="Neutral bedroom styling"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 40vw"
            />
          </div>
        </div>

        <div className="my-20 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="order-2 relative h-[280px] w-full overflow-hidden sm:h-[340px] md:h-[380px] lg:order-1">
            <Image
              src={HERO_IMAGE}
              alt="Statement bedroom vignette"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 45vw"
            />
          </div>
          <div className="order-1 space-y-5 lg:order-2">
            <h3 className="font-serif text-[30px] tracking-[0.01em] text-[#2b221d] sm:text-[34px]">
              Exclusive Designs
            </h3>
            <p className="text-[17px] leading-8 text-[#5a4f48]">
              Working side by side with our designers and makers, we create
              exclusive luxury collections for the home. We’re proud of our
              unique and timeless styles, using premium materials and designs for
              uncompromised quality, always.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="order-2 space-y-5 lg:order-1">
            <h3 className="font-serif text-[30px] tracking-[0.01em] text-[#2b221d] sm:text-[34px]">
              Trusted Craftsmanship
            </h3>
            <p className="text-[17px] leading-8 text-[#5a4f48]">
              Since 2018, our dedicated team has designed and curated everything
              in-house to ensure every collection feels cohesive, thoughtful, and
              built to last. We partner with ateliers around the world that share
              our commitment to ethical sourcing and meticulous finishing.
            </p>
            <p className="text-[17px] leading-8 text-[#5a4f48]">
              From the initial sketch to the final stitch, we obsess over every
              detail so you can enjoy furniture and decor that elevate daily
              rituals and stand the test of time.
            </p>
          </div>
          <div className="relative order-1 h-[260px] w-full overflow-hidden sm:h-[340px] md:h-[380px] lg:order-2">
            <Image
              src={SECONDARY_IMAGE}
              alt="Textured cushions on a sofa"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutTemplate
