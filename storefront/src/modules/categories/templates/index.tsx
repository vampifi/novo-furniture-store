import { notFound } from "next/navigation"
import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilters from "@modules/store/components/mobile-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { COLOR_FILTERS } from "@modules/store/constants/filters"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { HttpTypes } from "@medusajs/types"

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

export default async function CategoryTemplate({
  categories,
  sortBy,
  page,
  countryCode,
  searchParams,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort = sortBy || "created_at"

  const category = categories[categories.length - 1]
  const parents = categories.slice(0, categories.length - 1)

  if (!category || !countryCode) notFound()

  let categoryFilters = [] as ReturnType<typeof mapCategoriesToFilter>
  let collectionFilters = [] as ReturnType<typeof mapCollectionsToFilter>

  try {
    const [allCategories, collectionsResult] = await Promise.all([
      listCategories(),
      getCollectionsList(0, 50),
    ])

    categoryFilters = mapCategoriesToFilter(allCategories as any[])
    collectionFilters = mapCollectionsToFilter(collectionsResult?.collections as any[])
  } catch (error) {
    categoryFilters = []
    collectionFilters = []
  }

  return (
    <div
      className="content-container flex flex-col gap-8 py-10 lg:flex-row lg:gap-10"
      data-testid="category-container"
    >
      <MobileFilters
        sortBy={sort}
        categories={categoryFilters}
        collections={collectionFilters}
        colors={COLOR_FILTERS}
        lockedCategoryIds={category.id ? [category.id] : []}
      />
      <div className="hidden lg:block lg:max-w-[320px] lg:shrink-0">
        <RefinementList
          categories={categoryFilters}
          collections={collectionFilters}
          colors={COLOR_FILTERS}
          lockedCategoryIds={category.id ? [category.id] : []}
        />
      </div>
      <div className="flex-1 lg:pl-4">
        <div className="mb-8 space-y-4">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Store", href: "/store" },
              ...parents.map((parent) => ({
                label: parent.name ?? "Category",
                href: parent.handle ? `/categories/${parent.handle}` : undefined,
              })),
              { label: category.name ?? "Category" },
            ]}
          />
          <h1
            className="text-3xl font-semibold tracking-tight text-ui-fg-base"
            data-testid="category-page-title"
          >
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-prose text-sm text-ui-fg-muted">
              {category.description}
            </p>
          )}
        </div>
        {category.category_children && category.category_children.length > 0 && (
          <div className="mb-10 rounded-2xl border border-ui-border-subtle/60 bg-ui-bg-base/90 p-6 shadow-[0_10px_24px_rgba(17,24,39,0.08)]">
            <h2 className="mb-4 text-base font-semibold text-ui-fg-base">
              Explore subcategories
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {category.category_children.map((child) => (
                <li key={child.id}>
                  <InteractiveLink href={`/categories/${child.handle}`}>
                    {child.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </div>
  )
}
