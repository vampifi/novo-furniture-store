"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Badge } from "@medusajs/ui"

type SearchResultCardProps = {
  product: HttpTypes.StoreProduct
}

const SearchResultCard = ({ product }: SearchResultCardProps) => {
  const price = getProductPrice({ product })
  const selectedPrice = price.variantPrice ?? price.cheapestPrice
  const saleLabel =
    selectedPrice?.price_type === "sale" &&
    (selectedPrice.percentage_diff
      ? `Save ${Math.round(selectedPrice.percentage_diff)}%`
      : "Limited offer")

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <article className="flex flex-col overflow-hidden rounded-3xl border border-[#E4D5C8] bg-white/97 shadow-[0_10px_30px_rgba(32,26,22,0.12)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(32,26,22,0.14)] sm:flex-row">
        <div className="relative w-full shrink-0 overflow-hidden bg-[#F6EDE6] sm:w-48 sm:border-r sm:border-[#E4D5C8]">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              width={320}
              height={320}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full min-h-[180px] w-full items-center justify-center text-sm text-[#7A6B61]">
              No image
            </div>
          )}
          {saleLabel && (
            <Badge className="absolute left-3 top-3 rounded-full bg-[#c3355b] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-lg">
              {saleLabel}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-2">
            {product.collection?.title && (
              <span className="inline-flex w-max items-center gap-2 rounded-full border border-[#E4D5C8] bg-[#FBF3ED] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7A6B61]">
                {product.collection.title}
              </span>
            )}
            <h3 className="text-lg font-semibold text-[#201A16] transition group-hover:text-[#3F3C3D] sm:text-xl">
              {product.title}
            </h3>
            {product.description && (
              <p className="line-clamp-2 text-sm text-[#5C5149]">
                {product.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {selectedPrice && (
              <div className="flex items-baseline gap-3 text-[#201A16]">
                <span className="text-xl font-semibold">
                  {selectedPrice.calculated_price}
                </span>
                {selectedPrice.price_type === "sale" && (
                  <span className="text-sm text-[#7A6B61] line-through">
                    {selectedPrice.original_price}
                  </span>
                )}
              </div>
            )}
            <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#8C7B6F]">
              Tap to view details
            </span>
          </div>
        </div>
      </article>
    </LocalizedClientLink>
  )
}

export default SearchResultCard
