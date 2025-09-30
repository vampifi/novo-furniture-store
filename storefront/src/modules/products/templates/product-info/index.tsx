import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

type MetaItem = {
  label: string
  value?: string | null
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const availability = determineAvailability(product)

  const meta: MetaItem[] = [
    {
      label: "SKU",
      value: product.handle,
    },
    {
      label: "Product type",
      value: product.type?.value,
    },
    {
      label: "Material",
      value: product.material,
    },
    {
      label: "Availability",
      value: availability,
    },
  ]

  return (
    <div id="product-info" className="flex flex-col gap-6 text-[#443B33]">
      <div className="flex flex-col gap-3">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="w-max rounded-full bg-[#EFE4DC] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#6A5C52] transition hover:text-[#463B33]"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="font-semibold uppercase tracking-[0.12em] text-[#221C18] text-2xl leading-8 sm:text-[32px] sm:leading-[46px]"
          data-testid="product-title"
        >
          {product.title}
        </Heading>
        {product.subtitle && (
          <Text className="text-base text-[#6A5C52]" data-testid="product-subtitle">
            {product.subtitle}
          </Text>
        )}
      </div>

      <div className="grid gap-4 border-t border-[#E3DAD3] pt-6 text-sm text-ui-fg-muted sm:grid-cols-2">
        {meta.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <span className="font-semibold uppercase tracking-[0.18em] text-[#8C7B6F] text-xs">
              {item.label}
            </span>
            <span className="text-base text-[#443B33]">{formatMetaValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const determineAvailability = (product: HttpTypes.StoreProduct): string | undefined => {
  if (!product.variants?.length) {
    return undefined
  }

  const isAvailable = product.variants.some((variant) => {
    if (!variant) {
      return false
    }

    if (!variant.manage_inventory) {
      return true
    }

    if (variant.allow_backorder) {
      return true
    }

    return (variant.inventory_quantity ?? 0) > 0
  })

  return isAvailable ? "In stock" : "Out of stock"
}

const formatMetaValue = (value?: string | null) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value
  }

  return "-"
}

export default ProductInfo
