import { getProductsListWithSort, ProductListFilters } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import SortProducts, {
  SortOptions,
} from "@modules/store/components/refinement-list/sort-products"
import {
  DEFAULT_PAGE_SIZE,
  PRICE_RANGE_FILTERS,
} from "@modules/store/constants/filters"

type SearchParamRecord = Record<string, string | string[] | undefined>

const PRODUCT_LIMIT = DEFAULT_PAGE_SIZE

const parseArrayParam = (value?: string | string[]) => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .join(",")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const parsePriceRange = (value?: string | string[]) => {
  if (!value) {
    return undefined
  }

  const flattened = Array.isArray(value) ? value[0] : value
  return PRICE_RANGE_FILTERS.find((range) => range.value === flattened)
}

type PaginatedProductsProps = {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  searchParams?: SearchParamRecord
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  searchParams = {},
}: PaginatedProductsProps) {
  const queryParams: {
    limit: number
    collection_id?: string[]
    category_id?: string[]
    id?: string[]
    order?: string
  } = {
    limit: PRODUCT_LIMIT,
  }

  const queryCollectionIds = parseArrayParam(searchParams["collections"])
  const queryCategoryIds = parseArrayParam(searchParams["categories"])
  const queryColorIds = parseArrayParam(searchParams["colors"])
  const normalizedColorFilters = queryColorIds.map((entry) =>
    entry.toLowerCase().replace(/-/g, " ")
  )
  const priceRangeParam = parsePriceRange(searchParams["priceRange"])
  const inStockOnly = searchParams["inStock"] === "true"

  const combinedCollectionIds = Array.from(
    new Set([
      ...(collectionId ? [collectionId] : []),
      ...queryCollectionIds,
    ])
  )

  const combinedCategoryIds = Array.from(
    new Set([
      ...(categoryId ? [categoryId] : []),
      ...queryCategoryIds,
    ])
  )

  if (combinedCollectionIds.length) {
    queryParams["collection_id"] = combinedCollectionIds
  }

  if (combinedCategoryIds.length) {
    queryParams["category_id"] = combinedCategoryIds
  }

  if (productsIds?.length) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const filters: ProductListFilters = {
    collectionIds: combinedCollectionIds,
    categoryIds: combinedCategoryIds,
    inStock: inStockOnly,
    priceRange: priceRangeParam
      ? { min: priceRangeParam.min, max: priceRangeParam.max }
      : undefined,
    colors: normalizedColorFilters.length ? normalizedColorFilters : undefined,
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    filters,
  })

  const totalPages = Math.max(Math.ceil(count / PRODUCT_LIMIT), 1)
  const safePage = Math.max(page, 1)
  const boundedPage = Math.min(safePage, totalPages)
  const startIndex = count === 0 ? 0 : (boundedPage - 1) * PRODUCT_LIMIT + 1
  const endIndex = count === 0 ? 0 : startIndex + products.length - 1

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-start gap-4 rounded-3xl border border-ui-border-subtle/60 bg-ui-bg-base/90 px-6 py-5 shadow-[0_12px_28px_rgba(17,24,39,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-ui-fg-muted">
          {count === 0 ? (
            <span>No products found</span>
          ) : (
            <span>
              Showing {startIndex} - {endIndex} of {count} items
            </span>
          )}
        </div>
        <SortProducts
          sortBy={sortBy || "created_at"}
          className="hidden sm:flex"
        />
      </header>

      <ul
        className="grid w-full grid-cols-2 gap-5 max-[360px]:grid-cols-1 small:grid-cols-2 medium:grid-cols-3 xl:grid-cols-4"
        data-testid="products-list"
      >
        {products.map((product) => (
          <li key={product.id} className="h-full">
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={boundedPage}
          totalPages={totalPages}
        />
      )}
    </div>
  )
}
