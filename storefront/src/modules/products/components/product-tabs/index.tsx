import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { StoreProductCustomAttribute } from "@lib/data/products"

import Accordion from "./accordion"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  customAttributes?: StoreProductCustomAttribute[]
}

const ProductTabs = ({ product, customAttributes = [] }: ProductTabsProps) => {
  const sections = [
    {
      label: "Product information",
      value: "product-information",
      content: <ProductInfoPanel product={product} />,
    },
  ]

  if (customAttributes.length) {
    sections.push({
      label: "Specifications",
      value: "product-specifications",
      content: <ProductCustomAttributesPanel attributes={customAttributes} />,
    })
  }

  sections.push({
    label: "Shipping & returns",
    value: "shipping-and-returns",
    content: <ShippingInfoPanel />,
  })

  return (
    <section className="rounded-3xl border border-[#E3DAD3] bg-white p-5 xsmall:p-6 sm:p-7 medium:p-8 shadow-sm">
      <Heading level="h3" className="text-xl font-semibold uppercase tracking-[0.18em] text-[#221C18]">
        Details & FAQs
      </Heading>
      <Text className="mt-2 text-sm text-[#77685D]">
        Everything you need to know about your new product—from materials to
        delivery support.
      </Text>
      <Accordion type="multiple" className="mt-6 flex flex-col gap-4 text-[#4A4038]">
        {sections.map((section) => (
          <Accordion.Item
            key={section.value}
            title={section.label}
            value={section.value}
            className="bg-ui-bg-subtle/40"
          >
            <div className="pt-2 text-sm text-ui-fg-muted">{section.content}</div>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  )
}

const ProductInfoPanel = ({ product }: ProductTabsProps) => {
  const rows = [
    {
      label: "Material",
      value: product.material,
    },
    {
      label: "Country of origin",
      value: product.origin_country,
    },
    {
      label: "Type",
      value: product.type?.value,
    },
    {
      label: "Weight",
      value: formatSpecValue(product.weight, (weight) => `${weight} g`),
    },
    {
      label: "Dimensions",
      value: formatDimensionValue(product.length, product.width, product.height),
    },
  ]

  return (
    <div className="space-y-4 text-[#4A4038]">
      {rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7B6F]">
                {row.label}
              </span>
              <Text className="text-base text-[#4A4038]">{row.value ?? "-"}</Text>
            </div>
          ))}
        </div>
      ) : (
        <Text className="text-[#77685D]">
          We&apos;re gathering product specifications for this item.
        </Text>
      )}
    </div>
  )
}

const ShippingInfoPanel = () => {
  const items = [
    {
      label: "Fast delivery",
      description:
        "Your package will arrive in 3-5 business days at your preferred location.",
      Icon: FastDelivery,
    },
    {
      label: "Simple exchanges",
      description:
        "Is the fit not quite right? We’ll exchange your product for a new one.",
      Icon: Refresh,
    },
    {
      label: "Easy returns",
      description:
        "Return your product within 30 days for a full refund—no questions asked.",
      Icon: Back,
    },
  ]

  return (
    <div className="flex flex-col gap-4 text-[#4A4038]">
      {items.map(({ Icon, description, label }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F3] shadow-sm">
            <Icon />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#2F2721]">{label}</span>
            <Text className="text-[#6F6157]">{description}</Text>
          </div>
        </div>
      ))}
    </div>
  )
}

const ProductCustomAttributesPanel = ({
  attributes,
}: {
  attributes: StoreProductCustomAttribute[]
}) => {
  return (
    <div className="space-y-4 text-[#4A4038]">
      <div className="grid gap-4 sm:grid-cols-2">
        {attributes.map((attribute) => {
          const type = attribute.category_custom_attribute?.type ?? undefined
          const label =
            attribute.category_custom_attribute?.label ||
            attribute.category_custom_attribute?.key ||
            "Attribute"
          const value = formatAttributeValue(attribute)

          return (
            <div key={attribute.id} className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7B6F]">
                {label}
              </span>
              {renderAttributeValue(value, type)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const renderAttributeValue = (value: string | null, type?: string) => {
  if (!value) {
    return <Text className="text-base text-[#4A4038]">-</Text>
  }

  if (type === "file" && isLikelyUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-base text-[#2F6ADE] underline hover:text-[#1A4FAA]"
      >
        Download
      </a>
    )
  }

  return <Text className="text-base text-[#4A4038]">{value}</Text>
}

const formatAttributeValue = (
  attribute: StoreProductCustomAttribute
): string | null => {
  if (!attribute.value && !attribute.options) {
    return null
  }

  const raw = attribute.value ?? attribute.options ?? null

  if (typeof raw !== "string") {
    return raw ?? null
  }

  const trimmed = raw.trim()

  if (!trimmed.length) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)

    if (Array.isArray(parsed)) {
      return parsed.join(", ") || null
    }

    if (parsed && typeof parsed === "object") {
      return Object.values(parsed)
        .filter((value) => value !== undefined && value !== null)
        .map(String)
        .join(", ")
    }
  } catch (error) {
    // Value is not JSON formatted; fall back to raw string
  }

  return trimmed
}

const isLikelyUrl = (value: string) => {
  try {
    const url = new URL(value)
    return Boolean(url.protocol && url.host)
  } catch (error) {
    return false
  }
}

const formatSpecValue = (
  value: number | string | null | undefined,
  formatter?: (value: number | string) => string
) => {
  if (value === null || value === undefined || value === "") {
    return undefined
  }

  if (formatter) {
    return formatter(value)
  }

  return String(value)
}

const formatDimensionValue = (
  length?: number | null,
  width?: number | null,
  height?: number | null
) => {
  if (length && width && height) {
    return `${length}L × ${width}W × ${height}H`
  }

  return undefined
}

export default ProductTabs
