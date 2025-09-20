import type { HttpTypes, StoreProductCategory } from "@medusajs/types"

import HoverMegaMenu from "./hover-mega-menu"

interface MiddleNavLinksProps {
  categories?: StoreProductCategory[] | null
  collections?: HttpTypes.StoreCollection[] | null
}

const MiddleNavLinks = ({ categories, collections }: MiddleNavLinksProps) => {
  const visibleCategories = categories?.slice(0, 6) ?? []
  const visibleCollections = collections?.slice(0, 6) ?? []

  if (!visibleCategories.length && !visibleCollections.length) {
    return null
  }

  return (
    <HoverMegaMenu
      categories={visibleCategories}
      collections={visibleCollections}
    />
  )
}

export default MiddleNavLinks
