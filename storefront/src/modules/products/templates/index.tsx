import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { Heading, Text } from "@medusajs/ui"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import { StoreProductCustomAttribute } from "@lib/data/products"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  customAttributes?: StoreProductCustomAttribute[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  customAttributes,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-[#FAF6F3] text-[#352F2B]">
      <div
        className="content-container space-y-10 py-8 xsmall:py-10 xsmall:space-y-12 lg:space-y-16"
        data-testid="product-container"
      >
        <div className="grid gap-8 xsmall:gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-14">
          <div className="min-w-0 border border-[#E3DAD3] bg-[#FDF8F4] p-3 xsmall:p-4 sm:p-6 shadow-sm">
            <ImageGallery images={product?.images || []} />
          </div>
          <aside className="min-w-0 flex flex-col gap-5 xsmall:gap-6 lg:gap-8">
            <section className="rounded-3xl border border-[#E3DAD3] bg-white p-5 xsmall:p-6 sm:p-7 medium:p-8 shadow-sm">
              <ProductInfo product={product} />
            </section>
            <section className="rounded-3xl border border-[#E3DAD3] bg-white p-5 xsmall:p-6 sm:p-7 medium:p-8 shadow-sm">
              <Suspense
                fallback={
                  <ProductActions
                    disabled={true}
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>
            </section>
            <section className="rounded-3xl border border-dashed border-[#E3DAD3] bg-[#FDF8F4] p-6 text-left shadow-sm sm:p-8">
              <ProductOnboardingCta />
            </section>
          </aside>
        </div>

        <div className="flex flex-col gap-6 xsmall:gap-8">
          <section className="rounded-3xl border border-[#E3DAD3] bg-white p-5 xsmall:p-6 sm:p-7 medium:p-8 shadow-sm">
            <Heading level="h3" className="text-xl font-semibold text-[#221C18]">
              Product Description
            </Heading>
            <Text className="mt-4 text-base leading-7 text-[#5C5149] whitespace-pre-line">
              {product.description || "No description available for this product yet."}
            </Text>
          </section>
          <ProductTabs product={product} customAttributes={customAttributes} />
        </div>
      </div>
      <div
        className="content-container pb-16"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
