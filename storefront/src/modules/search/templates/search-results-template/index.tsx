import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SearchPageInput from "@modules/search/components/search-page-input"
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

  const decodedQuery = (() => {
    try {
      return decodeURIComponent(query)
    } catch (error) {
      return query
    }
  })()

  return (
    <div className="bg-[#FAF6F3] text-[#352F2B]">
      <div className="content-container flex flex-col gap-8 py-10 lg:flex-row lg:gap-12">
        <aside className="hidden lg:block lg:w-[320px] lg:shrink-0">
          <div className="sticky top-24 rounded-3xl border border-[#E4D5C8] bg-white/95 p-5 shadow-[0_10px_24px_rgba(31,26,23,0.08)]">
            <RefinementList
              categories={categoryFilters}
              collections={collectionFilters}
              colors={COLOR_FILTERS}
            />
          </div>
        </aside>
        <main className="flex-1 lg:pl-2">
          <div className="mb-6 lg:hidden">
            <MobileFilters
              sortBy={sortBy || "created_at"}
              categories={categoryFilters}
              collections={collectionFilters}
              colors={COLOR_FILTERS}
            />
          </div>
          <section className="flex flex-col gap-5 rounded-3xl border border-[#E4D5C8] bg-white/97 px-6 py-6 shadow-[0_12px_28px_rgba(31,26,23,0.1)]">
            <SearchPageInput initialValue={decodedQuery} />
            <div className="flex flex-col gap-1">
              <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
                Search results
              </Text>
              <Heading className="text-3xl font-semibold text-[#201A16]">
                {decodedQuery}
              </Heading>
              <Text className="text-sm text-[#5C5149]">
                {ids.length} matching product{ids.length === 1 ? "" : "s"}
              </Text>
            </div>
            <LocalizedClientLink
              href="/store"
              className="inline-flex w-max items-center gap-2 rounded-full border border-transparent bg-[#F6EDE6] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#3F3C3D] transition hover:bg-[#ecdccd]"
            >
              Clear search
            </LocalizedClientLink>
          </section>
          {ids.length > 0 ? (
            <PaginatedProducts
              productsIds={ids}
              sortBy={sortBy}
              page={pageNumber}
              countryCode={countryCode}
              searchParams={searchParams}
              cardVariant="search"
            />
          ) : (
            <section className="mt-6 rounded-3xl border border-[#E4D5C8] bg-white/95 px-6 py-8 shadow-[0_12px_26px_rgba(31,26,23,0.12)]">
              <Heading className="text-2xl font-semibold text-[#201A16]">
                No results for “{decodedQuery}”
              </Heading>
              <p className="mt-3 text-sm text-[#5C5149]">
                Refine your wording or browse our curated collections.
              </p>
              <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  "Living Room",
                  "Bedroom",
                  "Workspace",
                  "Lighting",
                ].map((suggestion) => (
                  <li
                    key={suggestion}
                    className="rounded-2xl border border-[#E4D5C8] bg-[#FBF3ED] px-4 py-3 text-center font-medium text-[#3F3C3D]"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
              <LocalizedClientLink
                href="/store"
                className="mt-5 inline-flex items-center justify-center rounded-full border border-[#E4D5C8] bg-white px-5 py-2 text-sm font-semibold text-[#3F3C3D] transition hover:border-[#CBB6A8] hover:text-[#201A16]"
              >
                Browse all products
              </LocalizedClientLink>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default SearchResultsTemplate
