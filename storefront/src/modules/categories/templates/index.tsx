import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ArrowUpRightMini } from "@medusajs/icons"
import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
          <div className="mb-10">
            <div className="rounded-[28px] border border-[#efe5db] bg-gradient-to-br from-[#faf5ef] via-[#fffefd] to-[#f4e6da] p-6 shadow-[0_12px_32px_rgba(59,47,47,0.08)] sm:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#b08a68]">
                    Explore
                  </span>
                  <h2 className="text-2xl font-semibold text-[#3b2f2f] sm:text-3xl">
                    Browse subcategories
                  </h2>
                  <p className="max-w-2xl text-sm text-[#5b4a4a]/80 sm:text-base">
                    Narrow your search and jump straight into the collections that match your style.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.category_children.map((child) => {
                  const href = child.handle
                    ? `/categories/${child.handle}`
                    : `/categories/${child.id}`

                  return (
                    <LocalizedClientLink
                      key={child.id}
                      href={href}
                      className="group relative block overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_14px_28px_rgba(59,47,47,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(59,47,47,0.12)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#f9e9dd]/40 via-transparent to-[#f1d9c3]/60 opacity-0 transition duration-300 group-hover:opacity-100" />
                      <div className="relative flex items-start justify-between gap-3">
                        <span className="block text-lg font-semibold text-[#2f2727] sm:text-xl">
                          {child.name}
                        </span>
                        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#ead8c8] bg-white/80 text-[#a96c3f] transition duration-300 group-hover:border-[#a96c3f] group-hover:bg-[#a96c3f] group-hover:text-white">
                          <ArrowUpRightMini className="h-4 w-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                      {child.description && (
                        <p className="relative mt-3 text-sm leading-6 text-[#5b4a4a]/80 line-clamp-2">
                          {child.description}
                        </p>
                      )}
                    </LocalizedClientLink>
                  )
                })}
              </div>
            </div>
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
