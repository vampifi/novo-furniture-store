import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"
import { PRODUCT_ACCENT_TEXT_CLASS } from "../../constants/theme"

type PreviewPriceProps = {
  price: VariantPrice
  className?: string
  originalClassName?: string
}

export default async function PreviewPrice({
  price,
  className,
  originalClassName,
}: PreviewPriceProps) {
  if (!price) {
    return null
  }

  const showSaleDetails = price.price_type === "sale"
  const formattedPriceClassName = className
    ? clx("transition-colors", className)
    : clx(
        "text-ui-fg-muted transition-colors",
        showSaleDetails && PRODUCT_ACCENT_TEXT_CLASS
      )

  return (
    <>
      {showSaleDetails && (
        <Text
          className={clx("line-through text-ui-fg-muted", originalClassName)}
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={formattedPriceClassName}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </>
  )
}
