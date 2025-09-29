import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getRegion } from "./regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { sortProducts } from "@lib/util/sort-products"

export type ProductListFilters = {
  priceRange?: {
    min?: number
    max?: number
  }
  collectionIds?: string[]
  categoryIds?: string[]
  inStock?: boolean
  colors?: string[]
}

export const getProductsById = cache(async function ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) {
  return sdk.store.product
    .list(
      {
        id: ids,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) => products)
})

export const getProductByHandle = cache(async function (
  handle: string,
  regionId: string
) {
  return sdk.store.product
    .list(
      {
        handle,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products }) => products[0])
})

export const getProductsList = cache(async function ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12
  const validPageParam = Math.max(pageParam, 1);
  const offset = (validPageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
  return sdk.store.product
    .list(
      {
        limit,
        offset,
        region_id: region.id,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+categories",
        ...queryParams,
      },
      { next: { tags: ["products"] } }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
})

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const getProductsListWithSort = cache(async function ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
  filters,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  filters?: ProductListFilters
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await getProductsList({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const filteredByCollections = filters?.collectionIds?.length
    ? products.filter((product) => {
        if (!filters.collectionIds?.length) {
          return true
        }

        if (!product.collection_id) {
          // The API was already scoped by collection_id via query params, so keep it.
          return true
        }

        return filters.collectionIds.includes(product.collection_id)
      })
    : products

  const filteredByCategories = filters?.categoryIds?.length
    ? filteredByCollections.filter((product) => {
        if (!filters.categoryIds?.length) {
          return true
        }

        if (!product.categories?.length) {
          // Missing categories metadata – keep the product, since the API call was already filtered.
          return true
        }

        return product.categories.some((category) =>
          category?.id ? filters.categoryIds?.includes(category.id) : false
        )
      })
    : filteredByCollections

  const filteredByAvailability = filters?.inStock
    ? filteredByCategories.filter((product) =>
        product.variants?.some((variant: any) =>
          typeof variant.inventory_quantity === "number"
            ? variant.inventory_quantity > 0
            : true
        )
      )
    : filteredByCategories

  const filteredByPrice = filters?.priceRange
    ? filteredByAvailability.filter((product) => {
        const variantPrices = (product.variants || [])
          .map((variant: any) => variant.calculated_price?.calculated_amount)
          .filter((amount): amount is number => typeof amount === "number")

        if (!variantPrices.length) {
          return false
        }

        const lowestPrice = Math.min(...variantPrices)

        const minThreshold =
          typeof filters.priceRange?.min === "number"
            ? Math.round(filters.priceRange.min * 100)
            : undefined
        const maxThreshold =
          typeof filters.priceRange?.max === "number"
            ? Math.round(filters.priceRange.max * 100)
            : undefined

        if (typeof minThreshold === "number" && lowestPrice < minThreshold) {
          return false
        }

        if (typeof maxThreshold === "number" && lowestPrice > maxThreshold) {
          return false
        }

        return true
      })
    : filteredByAvailability

  const filteredByColors = filters?.colors?.length
    ? filteredByPrice.filter((product) => {
        if (!filters.colors?.length) {
          return true
        }

        const normalizeColorString = (value: string) =>
          value.toLowerCase().replace(/[-_/]/g, " ").replace(/\s+/g, " ").trim()

        const normalizedFilters = filters.colors
          .map(normalizeColorString)
          .filter(Boolean)

        if (!normalizedFilters.length) {
          return true
        }

        const candidateValues = new Set<string>()

        const addCandidate = (raw?: string | null) => {
          if (!raw) {
            return
          }

          const lower = raw.toLowerCase()
          candidateValues.add(lower)

          const normalized = normalizeColorString(raw)
          if (normalized) {
            candidateValues.add(normalized)
          }
        }

        ;(product.tags || []).forEach((tag: any) => addCandidate(tag?.value))

        const metadataColor = (product as any)?.metadata?.color
        addCandidate(metadataColor)

        ;(product.options || []).forEach((option: any) => {
          const title = String(option?.title ?? "").toLowerCase()
          const looksLikeColor =
            title.includes("color") || title.includes("colour") || title.includes("finish")

          if (!looksLikeColor) {
            return
          }

          ;(option?.values || []).forEach((value: any) => addCandidate(String(value)))
        })

        ;(product.variants || []).forEach((variant: any) => {
          addCandidate(variant?.metadata?.color)
        })

        if (!candidateValues.size) {
          return filters.collectionIds?.length || filters.categoryIds?.length
            ? true
            : false
        }

        return normalizedFilters.some((color) =>
          Array.from(candidateValues).some((value) => value.includes(color))
        )
      })
    : filteredByPrice

  const sortedProducts = sortProducts(filteredByColors, sortBy)

  const safePage = Math.max(page, 1)
  const offset = (safePage - 1) * limit

  const paginatedProducts = sortedProducts.slice(offset, offset + limit)
  const totalCount = sortedProducts.length
  const hasNextPage = offset + limit < totalCount
  const nextPage = hasNextPage ? safePage + 1 : null

  return {
    response: {
      products: paginatedProducts,
      count: totalCount,
    },
    nextPage,
    queryParams,
  }
})
