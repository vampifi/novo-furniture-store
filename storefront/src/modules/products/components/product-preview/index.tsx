import { Badge, Text, clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

const COLOR_OPTION_TOKENS = ["color", "colour", "finish", "fabric", "shade"]

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
  })

  const accentLabel = product.collection?.title || product.tags?.[0]?.value
  const hasMultipleColourways = product.options?.some((option) => {
    const normalizedTitle = option.title?.toLowerCase()

    if (!normalizedTitle) {
      return false
    }

    const representsColour = COLOR_OPTION_TOKENS.some((token) =>
      normalizedTitle.includes(token)
    )

    return representsColour && (option.values?.length || 0) > 1
  })

  const saleLabel =
    cheapestPrice?.price_type === "sale" &&
    (cheapestPrice.percentage_diff
      ? `Extra ${Math.round(cheapestPrice.percentage_diff)}% off`
      : "Limited offer")

  const metadata = product.metadata as Record<string, unknown> | undefined
  const parseNumber = (value: unknown) => {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }

    return undefined
  }

  const ratingValue =
    parseNumber(metadata?.rating) ??
    parseNumber(metadata?.rating_value) ??
    parseNumber(metadata?.average_rating)

  const ratingCount =
    parseNumber(metadata?.rating_count) ??
    parseNumber(metadata?.review_count) ??
    parseNumber(metadata?.reviews)

  const roundedRating = ratingValue
    ? Math.round(Math.min(Math.max(ratingValue, 0), 5) * 10) / 10
    : undefined
  const filledStars = roundedRating ? Math.round(roundedRating) : 0

  const showRatingRow = roundedRating || ratingCount

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block h-full"
    >
      <article
        className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-ui-border-subtle/60 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_28px_60px_rgba(36,99,235,0.18)] sm:rounded-[24px]"
        data-testid="product-wrapper"
      >
        <div className="relative overflow-hidden rounded-t-[20px] bg-ui-bg-subtle sm:rounded-t-[24px]">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="!p-0 !rounded-t-[20px] !rounded-b-none shadow-none sm:!rounded-t-[24px]"
          />

          {cheapestPrice?.price_type === "sale" && saleLabel && (
            <Badge
              className="absolute left-2.5 top-2.5 rounded-full bg-[#c3355b] px-2.5 py-[6px] text-[9px] font-semibold uppercase tracking-[0.18em] text-white shadow-md sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.22em]"
            >
              {saleLabel}
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 rounded-b-[20px] border-t border-ui-border-subtle/40 bg-white px-4 pb-4 pt-3 sm:gap-5 sm:rounded-b-[24px] sm:px-6 sm:pb-6 sm:pt-6">
          {accentLabel && (
            <span className="inline-flex w-max items-center gap-1.5 rounded-full border border-ui-border-subtle/60 bg-ui-bg-subtle/60 px-2.5 py-[5px] text-[9px] font-semibold uppercase tracking-[0.22em] text-ui-fg-muted sm:gap-2 sm:px-3 sm:py-[6px] sm:text-[11px] sm:tracking-[0.28em]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden />
              {accentLabel}
            </span>
          )}

          <Text
            className="line-clamp-2 text-[15px] font-semibold leading-snug text-ui-fg-base sm:text-lg lg:text-xl"
            data-testid="product-title"
          >
            {product.title}
          </Text>

          <div className="flex flex-col gap-2 sm:gap-3">
            {hasMultipleColourways && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ui-fg-muted sm:gap-2 sm:text-sm">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-ui-border-subtle/60 bg-white sm:h-5 sm:w-5"
                  aria-hidden
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#ff007a_0deg,#ff9800_120deg,#37b679_240deg,#ff007a_360deg)] sm:h-3 sm:w-3"></span>
                </span>
                More colours available
              </span>
            )}

            {cheapestPrice && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <PreviewPrice
                  price={cheapestPrice}
                  className="text-base font-semibold text-[#c3355b] sm:text-xl"
                  originalClassName="text-[11px] font-medium text-ui-fg-muted sm:text-sm"
                />
                {cheapestPrice.price_type === "sale" &&
                  typeof cheapestPrice.percentage_diff === "number" &&
                  cheapestPrice.percentage_diff > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-xs sm:tracking-[0.2em]">
                      Save {Math.round(cheapestPrice.percentage_diff)}%
                    </span>
                  )}
              </div>
            )}
          </div>

          {showRatingRow && (
            <div className="flex items-center gap-2 text-[11px] text-ui-fg-muted sm:gap-3 sm:text-sm">
              {roundedRating && (
                <span className="flex items-center gap-[2px] text-base text-[#f5a623] sm:gap-1" aria-label={`Rated ${roundedRating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={index}
                      className={clx(
                        "text-sm leading-none sm:text-lg",
                        index < filledStars ? "opacity-100" : "opacity-30"
                      )}
                    >
                      ★
                    </span>
                  ))}
                </span>
              )}
              {roundedRating && (
                <span className="font-semibold text-ui-fg-base sm:text-sm">
                  {roundedRating.toFixed(1)}
                </span>
              )}
              {typeof ratingCount === "number" && ratingCount > 0 && (
                <span className="text-[11px] text-ui-fg-muted sm:text-sm">
                  ({ratingCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </LocalizedClientLink>
  )
}
