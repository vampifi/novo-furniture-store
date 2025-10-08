import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilters from "@modules/store/components/mobile-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { COLOR_FILTERS } from "@modules/store/constants/filters"
import Breadcrumb from "@modules/common/components/breadcrumb"

import PaginatedProducts from "./paginated-products"

type FilterOption = {
  id: string
  label: string
  count?: number
  value?: string
}

const deriveCount = (source: any): number | undefined => {
  if (typeof source?.product_count === "number") {
    return source.product_count
  }

  if (typeof source?.products_count === "number") {
    return source.products_count
  }

  if (typeof source?.metadata?.product_count === "number") {
    return source.metadata.product_count
  }

  if (Array.isArray(source?.products)) {
    return source.products.length
  }

  return undefined
}

const mapCollectionsToFilter = (collections: any[] | undefined): FilterOption[] => {
  if (!collections?.length) {
    return []
  }

  return collections
    .filter((collection) => !!collection?.id)
    .map((collection) => ({
      id: collection.id,
      label: collection.title ?? "Untitled collection",
      value: collection.handle ?? collection.id,
      count: deriveCount(collection),
    }))
}

const mapCategoriesToFilter = (categories: any[] | undefined): FilterOption[] => {
  if (!categories?.length) {
    return []
  }

  return categories
    .filter((category) => !!category?.id)
    .map((category) => ({
      id: category.id,
      label: category.name ?? "Untitled category",
      value: category.handle ?? category.id,
      count: deriveCount(category),
    }))
}

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  searchParams,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: Record<string, string | string[] | undefined>
}) => {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort = sortBy || "created_at"

  let categoryFilters: FilterOption[] = []
  let collectionFilters: FilterOption[] = []

  try {
    const [categories, collectionsResult] = await Promise.all([
      listCategories(),
      getCollectionsList(0, 50),
    ])

    categoryFilters = mapCategoriesToFilter(categories as any[])
    collectionFilters = mapCollectionsToFilter(collectionsResult?.collections as any[])
  } catch (error) {
    categoryFilters = []
    collectionFilters = []
  }

  return (
    <div className="bg-[#FAF6F3] text-[#352F2B]">
      <div
        className="content-container flex flex-col gap-8 py-10 lg:flex-row lg:gap-10"
        data-testid="category-container"
      >
        <MobileFilters
          sortBy={sort}
          categories={categoryFilters}
          collections={collectionFilters}
          colors={COLOR_FILTERS}
        />
        <div className="hidden lg:block lg:max-w-[320px] lg:shrink-0">
          <RefinementList
            categories={categoryFilters}
            collections={collectionFilters}
            colors={COLOR_FILTERS}
          />
        </div>
        <div className="flex-1 lg:pl-4">
          <div className="mb-8 space-y-4">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Store", href: "/store" },
                { label: "All Products" },
              ]}
            />
            <h1
              className="text-3xl font-semibold tracking-tight text-[#221C18]"
              data-testid="store-page-title"
            >
              All Products
            </h1>
            <p className="mt-2 max-w-prose text-sm text-[#5C5149]">
              Discover curated sofas, loungers, and home accents designed to elevate every room in your home.
            </p>
          </div>
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              searchParams={searchParams}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
