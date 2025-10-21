import type { StoreProductCategory } from "@medusajs/types"

import HoverMegaMenu from "./hover-mega-menu"

interface MiddleNavLinksProps {
  categories?: StoreProductCategory[] | null
}

const MiddleNavLinks = ({ categories }: MiddleNavLinksProps) => {
  const visibleCategories = categories ?? []

  if (!visibleCategories.length) {
    return null
  }

  return <HoverMegaMenu categories={visibleCategories} />
}

export default MiddleNavLinks
