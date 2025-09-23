import Image from "next/image"
import { Metadata } from "next"

import FaqAccordion from "@modules/content/components/faq-accordion"
import { FAQ_ITEMS } from "@modules/content/data/faqs"

const FAQ_HERO_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp"

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to the most common questions about orders, deliveries, and product fit at Novo Furniture.",
}

export default function FaqsPage() {
  return (
    <div className="bg-[#FAF6F3] pb-20">
      <section className="relative overflow-hidden">
        <div className="content-container flex flex-col-reverse items-center gap-12 py-16 lg:flex-row lg:py-24">
          <div className="w-full space-y-6 lg:w-1/2">
            <span className="inline-flex items-center rounded-full border border-[#3f3a36] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#3f3a36]">
              Help Centre
            </span>
            <h1 className="font-serif text-4xl text-[#3f3a36] sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#6f6660]">
              Need support with an order or planning a delivery? Browse our most asked questions to find clear answers and helpful guides tailored to the Novo experience.
            </p>
          </div>
          <div className="relative w-full overflow-hidden rounded-[32px] border border-[#e6ddd5] bg-white/40 shadow-[0px_30px_80px_rgba(64,58,51,0.15)] lg:w-1/2">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={FAQ_HERO_IMAGE}
                alt="Calming bedroom inspiration with layered neutral tones"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1023px) 100vw, 48vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="content-container">
        <div className="rounded-[32px] border border-[#e6ddd5] bg-white/70 p-8 shadow-[0px_24px_60px_rgba(64,58,51,0.1)] sm:p-10 lg:p-12">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  )
}
