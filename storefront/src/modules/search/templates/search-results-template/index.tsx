import { listCategories } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilters from "@modules/store/components/mobile-filters"
import SortProducts, {
  SortOptions,
} from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { Heading, Text } from "@medusajs/ui"
import { COLOR_FILTERS, PRICE_RANGE_FILTERS } from "@modules/store/constants/filters"

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

  const parseMultiValueParam = (value?: string | string[]) => {
    if (!value) {
      return []
    }

    const values = Array.isArray(value) ? value : [value]
    return Array.from(
      new Set(
        values
          .flatMap((entry) => entry.split(","))
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    )
  }

  const selectedCategoryIds = parseMultiValueParam(searchParams?.["categories"])
  const selectedCollectionIds = parseMultiValueParam(searchParams?.["collections"])
  const selectedColorIds = parseMultiValueParam(searchParams?.["colors"])
  const selectedPriceParam = (() => {
    const priceParam = searchParams?.["priceRange"]
    return Array.isArray(priceParam) ? priceParam[0] : priceParam
  })()
  const inStockOnly = (() => {
    const stockParam = searchParams?.["inStock"]
    if (Array.isArray(stockParam)) {
      return stockParam.includes("true")
    }
    return stockParam === "true"
  })()

  const categoryLookup = new Map(categoryFilters.map((category) => [category.id, category.label]))
  const collectionLookup = new Map(
    collectionFilters.map((collection) => [collection.id, collection.label])
  )
  const colorLookup = new Map(COLOR_FILTERS.map((color) => [color.id, color.label]))

  const activeFilters: { key: string; label: string }[] = []

  selectedCategoryIds.forEach((id) => {
    const label = categoryLookup.get(id) || id
    activeFilters.push({ key: `category-${id}`, label })
  })

  selectedCollectionIds.forEach((id) => {
    const label = collectionLookup.get(id) || id
    activeFilters.push({ key: `collection-${id}`, label })
  })

  selectedColorIds.forEach((id) => {
    const label = colorLookup.get(id) || id.replace(/-/g, " ")
    activeFilters.push({ key: `color-${id}`, label })
  })

  if (selectedPriceParam) {
    const priceLabel =
      PRICE_RANGE_FILTERS.find((option) => option.value === selectedPriceParam)?.label ||
      selectedPriceParam
    activeFilters.push({ key: `price-${selectedPriceParam}`, label: priceLabel })
  }

  if (inStockOnly) {
    activeFilters.push({ key: "stock", label: "In stock only" })
  }

  const hasActiveFilters = activeFilters.length > 0
  const effectiveSortBy: SortOptions = sortBy || "created_at"
  const baseResultsPath = countryCode
    ? `/${countryCode}/results/${encodeURIComponent(query)}`
    : `/results/${encodeURIComponent(query)}`

  return (
    <div className="bg-[#FAF6F3] text-[#352F2B]">
      <div className="content-container flex flex-col gap-8 py-10 lg:flex-row lg:gap-12">
        <div className="hidden lg:block lg:w-[320px] lg:shrink-0">
          <RefinementList
            categories={categoryFilters}
            collections={collectionFilters}
            colors={COLOR_FILTERS}
          />
        </div>
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              <div className="hidden md:flex items-center gap-3">
                {hasActiveFilters && (
                  <LocalizedClientLink
                    href={baseResultsPath}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E4D5C8] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#3F3C3D] transition hover:border-[#C9B7A8] hover:text-[#201A16]"
                  >
                    Clear filters
                  </LocalizedClientLink>
                )}
                <SortProducts
                  sortBy={effectiveSortBy}
                  label="Sort"
                  className="text-sm font-semibold text-[#5C5149]"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter.key}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E4D5C8] bg-[#FBF3ED] px-3 py-1 text-xs font-medium text-[#3F3C3D]"
                  >
                    {filter.label}
                  </span>
                ))}
                <LocalizedClientLink
                  href={baseResultsPath}
                  className="inline-flex items-center gap-2 rounded-full border border-transparent bg-[#F6EDE6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3F3C3D] transition hover:bg-[#ecdccd] md:hidden"
                >
                  Clear filters
                </LocalizedClientLink>
              </div>
            )}
            {!hasActiveFilters && (
              <div className="flex md:hidden flex-wrap gap-3">
                <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
                  Sort & filter
                </Text>
                <Text className="text-xs text-[#5C5149]">
                  Use the controls above to fine-tune your results.
                </Text>
              </div>
            )}
          </section>
          {ids.length > 0 ? (
            <PaginatedProducts
              productsIds={ids}
              sortBy={sortBy}
              page={pageNumber}
              countryCode={countryCode}
              searchParams={searchParams}
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
