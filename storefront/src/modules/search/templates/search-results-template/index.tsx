import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilters from "@modules/store/components/mobile-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { Heading, Text } from "@medusajs/ui"
import { COLOR_FILTERS } from "@modules/store/constants/filters"

type SearchResultsTemplateProps = {
  query: string
  ids: string[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: Record<string, string | string[] | undefined>
}

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

const SearchResultsTemplate = async ({
  query,
  ids,
  sortBy,
  page,
  countryCode,
  searchParams,
}: SearchResultsTemplateProps) => {
  const pageNumber = page ? parseInt(page, 10) : 1

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
        sortBy={sortBy || "created_at"}
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
        <div className="mb-8 flex flex-col gap-2 rounded-3xl border border-ui-border-subtle/60 bg-ui-bg-base/95 px-6 py-5 shadow-[0_12px_28px_rgba(17,24,39,0.08)]">
          <Text className="text-sm uppercase tracking-[0.28em] text-ui-fg-muted">
            Search results for
          </Text>
          <Heading className="text-3xl font-semibold text-ui-fg-base">
            {decodeURI(query)}
          </Heading>
          <Text className="text-sm text-ui-fg-muted">
            {ids.length} matching products
          </Text>
          <LocalizedClientLink
            href="/store"
            className="text-sm font-medium text-ui-fg-interactive transition-colors hover:text-primary"
          >
            Clear search
          </LocalizedClientLink>
        </div>
        {ids.length > 0 ? (
          <PaginatedProducts
            productsIds={ids}
            sortBy={sortBy}
            page={pageNumber}
            countryCode={countryCode}
            searchParams={searchParams}
          />
        ) : (
          <Text className="mt-6 text-sm text-ui-fg-muted">No results found. Try updating your filters.</Text>
        )}
      </div>
    </div>
  )
}

export default SearchResultsTemplate
