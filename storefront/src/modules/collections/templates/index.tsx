import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilters from "@modules/store/components/mobile-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { COLOR_FILTERS } from "@modules/store/constants/filters"

const mapCollectionsToFilter = (collections: any[] | undefined) =>
  (collections || [])
    .filter((collection) => !!collection?.id)
    .map((collection) => ({
      id: collection.id,
      label: collection.title ?? "Untitled collection",
      value: collection.handle ?? collection.id,
      count:
        typeof collection?.product_count === "number"
          ? collection.product_count
          : Array.isArray(collection?.products)
            ? collection.products.length
            : undefined,
    }))

const mapCategoriesToFilter = (categories: any[] | undefined) =>
  (categories || [])
    .filter((category) => !!category?.id)
    .map((category) => ({
      id: category.id,
      label: category.name ?? "Untitled category",
      value: category.handle ?? category.id,
      count:
        typeof category?.product_count === "number"
          ? category.product_count
          : Array.isArray(category?.products)
            ? category.products.length
            : undefined,
    }))

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  searchParams,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort = sortBy || "created_at"

  let categoryFilters = [] as ReturnType<typeof mapCategoriesToFilter>
  let collectionFilters = [] as ReturnType<typeof mapCollectionsToFilter>

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
    <div className="content-container flex flex-col gap-8 py-10 lg:flex-row lg:gap-10">
      <MobileFilters
        sortBy={sort}
        categories={categoryFilters}
        collections={collectionFilters}
        colors={COLOR_FILTERS}
        lockedCollectionIds={collection.id ? [collection.id] : []}
      />
      <div className="hidden lg:block lg:max-w-[320px] lg:shrink-0">
        <RefinementList
          categories={categoryFilters}
          collections={collectionFilters}
          colors={COLOR_FILTERS}
          lockedCollectionIds={collection.id ? [collection.id] : []}
        />
      </div>
      <div className="flex-1 lg:pl-4">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ui-fg-base">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-3 max-w-prose text-sm text-ui-fg-muted">
              {collection.description}
            </p>
          )}
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </div>
  )
}
