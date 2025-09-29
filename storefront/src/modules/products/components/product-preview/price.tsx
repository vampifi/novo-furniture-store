import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

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
        showSaleDetails && "text-ui-fg-interactive"
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
