import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import BrandsSection from "@modules/home/components/brands"
import LuxuryShowcase from "@modules/home/components/luxury-showcase"
import AwardHero from "@modules/home/components/award-hero"
import ShopByRoom from "@modules/home/components/shop-by-room"
import TrendingSection from "@modules/home/components/trending-collections"
import TopCollections from "@modules/home/components/top-collections"

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
      <ShopByRoom />
      {/* <AwardHero /> */}
      {/* <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div> */}
      <div>
        <TrendingSection />
        <TopCollections />
        <BrandsSection />
        <LuxuryShowcase />
      </div>
    </>
  )
}
