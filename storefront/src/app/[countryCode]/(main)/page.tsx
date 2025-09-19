import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import BrandsSection from "@modules/home/components/brands"
import LuxuryShowcase from "@modules/home/components/luxury-showcase"
import NewsletterSubscription from "@modules/home/components/news-letter"
import AwardHero from "@modules/home/components/award-hero"

export const metadata: Metadata = {
  title: "Novo Furniture - Home",
  description:
    "Discover premium furniture collections at Novo Furniture. Shop now for quality, style, and comfort.",
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      
      <div className="py-12 bg-background">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <div>
        <AwardHero />
        <BrandsSection />
        <LuxuryShowcase />
        <NewsletterSubscription />
      </div>
    </>
  )
}
