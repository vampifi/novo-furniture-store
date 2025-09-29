"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { PRICE_RANGE_FILTERS } from "@modules/store/constants/filters"
import { clx, Text } from "@medusajs/ui"

type FilterOption = {
  id: string
  label: string
  count?: number
  value?: string
}

type RefinementListProps = {
  categories: FilterOption[]
  collections: FilterOption[]
  colors: FilterOption[]
  lockedCategoryIds?: string[]
  lockedCollectionIds?: string[]
  variant?: "sidebar" | "drawer"
}

type SectionKey = "price" | "collections" | "categories" | "colors" | "availability"

const joinValues = (values: string[]) =>
  values.filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index)

const splitValues = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []

const DEFAULT_VISIBLE_COUNT = 6

const priceQuickFilters = PRICE_RANGE_FILTERS.slice(0, 3)

const SECTION_ICONS: Record<SectionKey, string> = {
  price: "£",
  collections: "◎",
  categories: "▢",
  colors: "●",
  availability: "✓",
}

const COLOR_SWATCH_LOOKUP: { keywords: RegExp; hex: string }[] = [
  { keywords: /black|ink|cow|stripe/i, hex: "#1f2933" },
  { keywords: /natural|cream|linen|oatmeal|teddy/i, hex: "#e7d8c2" },
  { keywords: /grey|gray|silver|smoke/i, hex: "#a0a4b0" },
  { keywords: /green|forest/i, hex: "#2f7d4b" },
  { keywords: /white|clear|glass/i, hex: "#f5f5f5" },
  { keywords: /brown|wood|marble|concrete/i, hex: "#b28a5a" },
  { keywords: /orange|burnt/i, hex: "#d9782d" },
  { keywords: /blue|royal/i, hex: "#3c6fd8" },
  { keywords: /purple|aubergine|raspberry/i, hex: "#8854d0" },
  { keywords: /pink/i, hex: "#e17bb3" },
  { keywords: /gold|yellow/i, hex: "#e7b44a" },
  { keywords: /red|rust/i, hex: "#c14a4a" },
  { keywords: /champagne|cream/i, hex: "#f1e4d3" },
]

const getColorSwatch = (label: string) => {
  const normalized = label.toLowerCase()
  const match = COLOR_SWATCH_LOOKUP.find(({ keywords }) => keywords.test(normalized))

  if (match) {
    return match.hex
  }

  return "#cdd1d9"
}

const RefinementList = ({
  categories,
  collections,
  colors,
  lockedCategoryIds = [],
  lockedCollectionIds = [],
  variant = "sidebar",
}: RefinementListProps) => {
  const isDrawer = variant === "drawer"
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedCategories = useMemo(() => {
    const current = splitValues(searchParams.get("categories"))
    return joinValues([...current, ...lockedCategoryIds])
  }, [searchParams, lockedCategoryIds])

  const selectedCollections = useMemo(() => {
    const current = splitValues(searchParams.get("collections"))
    return joinValues([...current, ...lockedCollectionIds])
  }, [searchParams, lockedCollectionIds])

  const selectedPrice = searchParams.get("priceRange") ?? undefined
  const inStockOnly = searchParams.get("inStock") === "true"

  const removableCategoryIds = selectedCategories.filter(
    (id) => !lockedCategoryIds.includes(id)
  )
  const removableCollectionIds = selectedCollections.filter(
    (id) => !lockedCollectionIds.includes(id)
  )

  const categoryOptionMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  )

  const collectionOptionMap = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections]
  )

  const colorOptionMap = useMemo(
    () => new Map(colors.map((color) => [color.id, color])),
    [colors]
  )

  const selectedColors = useMemo(
    () => joinValues(splitValues(searchParams.get("colors"))),
    [searchParams]
  )

  const removableColorIds = selectedColors

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    price: true,
    collections: true,
    categories: true,
    colors: true,
    availability: true,
  })

  const [collectionsQuery, setCollectionsQuery] = useState("")
  const [categoriesQuery, setCategoriesQuery] = useState("")
  const [showAllCollections, setShowAllCollections] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [colorQuery, setColorQuery] = useState("")

  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const applyQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams)
      mutate(params)
      params.delete("page")

      const ensuredCategories = joinValues([
        ...splitValues(params.get("categories")),
        ...lockedCategoryIds,
      ])
      params.delete("categories")
      if (ensuredCategories.length) {
        params.set("categories", ensuredCategories.join(","))
      }

      const ensuredCollections = joinValues([
        ...splitValues(params.get("collections")),
        ...lockedCollectionIds,
      ])
      params.delete("collections")
      if (ensuredCollections.length) {
        params.set("collections", ensuredCollections.join(","))
      }

      const ensuredColors = joinValues(splitValues(params.get("colors")))
      params.delete("colors")
      if (ensuredColors.length) {
        params.set("colors", ensuredColors.join(","))
      }

      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams, lockedCategoryIds, lockedCollectionIds]
  )

  const toggleMultiValue = useCallback(
    (
      key: "categories" | "collections" | "colors",
      value: string,
      lockedValues: string[] = []
    ) => {
      applyQuery((params) => {
        const current = splitValues(params.get(key))
        const next = new Set(current)

        if (next.has(value)) {
          next.delete(value)
        } else {
          next.add(value)
        }

        lockedValues.forEach((locked) => next.add(locked))

        params.delete(key)
        if (next.size) {
          params.set(key, Array.from(next).join(","))
        }
      })
    },
    [applyQuery]
  )

  const setPriceRange = useCallback(
    (value?: string) => {
      applyQuery((params) => {
        if (!value) {
          params.delete("priceRange")
        } else {
          params.set("priceRange", value)
        }
      })
    },
    [applyQuery]
  )

  const toggleColor = useCallback(
    (id: string) => {
      toggleMultiValue("colors", id)
    },
    [toggleMultiValue]
  )

  const toggleInStock = useCallback(() => {
    applyQuery((params) => {
      if (params.get("inStock") === "true") {
        params.delete("inStock")
      } else {
        params.set("inStock", "true")
      }
    })
  }, [applyQuery])

  const hasActiveFilters =
    removableCategoryIds.length > 0 ||
    removableCollectionIds.length > 0 ||
    removableColorIds.length > 0 ||
    !!selectedPrice ||
    inStockOnly

  const canClearAll = hasActiveFilters

  const clearAll = useCallback(() => {
    if (!hasActiveFilters) {
      return
    }

    applyQuery((params) => {
      params.delete("categories")
      params.delete("collections")
      params.delete("priceRange")
      params.delete("inStock")
      params.delete("colors")

      if (lockedCategoryIds.length) {
        params.set("categories", joinValues(lockedCategoryIds).join(","))
      }

      if (lockedCollectionIds.length) {
        params.set("collections", joinValues(lockedCollectionIds).join(","))
      }
    })

    setCollectionsQuery("")
    setCategoriesQuery("")
    setColorQuery("")
    setShowAllCollections(false)
    setShowAllCategories(false)
  }, [applyQuery, hasActiveFilters, lockedCategoryIds, lockedCollectionIds])

  const removeCategory = useCallback(
    (id: string) => {
      toggleMultiValue("categories", id, lockedCategoryIds)
    },
    [toggleMultiValue, lockedCategoryIds]
  )

  const removeCollection = useCallback(
    (id: string) => {
      toggleMultiValue("collections", id, lockedCollectionIds)
    },
    [toggleMultiValue, lockedCollectionIds]
  )

  const renderCheckbox = (
    option: FilterOption,
    isChecked: boolean,
    lockedValues: string[],
    onToggle: (id: string) => void
  ) => {
    const isLocked = lockedValues.includes(option.id)

    return (
      <label
        key={option.id}
        className={clx(
          "group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-ui-border-subtle/70 bg-ui-bg-base/95 px-3 py-2 text-sm text-ui-fg-subtle transition-all duration-200 hover:border-primary/40 hover:bg-primary/5",
          isChecked &&
            "border-primary/70 bg-primary/10 text-primary shadow-[0_8px_18px_rgba(36,99,235,0.15)]",
          isLocked && "cursor-not-allowed opacity-70 hover:border-ui-border-subtle/70 hover:bg-ui-bg-base/95"
        )}
        aria-disabled={isLocked}
      >
        <span className="flex items-center gap-3">
          <input
            type="checkbox"
            className={clx(
              "h-4 w-4 rounded border-ui-border-subtle text-primary transition-colors focus:ring-primary",
              isLocked && "border-ui-border-subtle/80"
            )}
            checked={isChecked}
            onChange={() => {
              if (!isLocked) {
                onToggle(option.id)
              }
            }}
            disabled={isLocked}
          />
          <span className="font-medium leading-tight">{option.label}</span>
        </span>
        <span className="flex items-center gap-2">
          {typeof option.count === "number" && option.count > 0 && (
            <span className="rounded-full bg-ui-border-subtle/60 px-2 py-[2px] text-[11px] font-semibold text-ui-fg-muted">
              {option.count}
            </span>
          )}
          {isLocked && (
            <span className="rounded-full bg-ui-border-subtle/30 px-2 py-[2px] text-[10px] uppercase tracking-[0.24em] text-ui-fg-muted">
              locked
            </span>
          )}
        </span>
      </label>
    )
  }

  const renderColorOption = (option: FilterOption) => {
    const isChecked = selectedColors.includes(option.id)

    return (
      <label
        key={option.id}
        className={clx(
          "group flex cursor-pointer items-center gap-3 rounded-2xl border border-ui-border-subtle/70 bg-ui-bg-base/95 px-3 py-2 text-sm font-medium text-ui-fg-subtle transition-all duration-200 hover:border-primary/40 hover:bg-primary/5",
          isChecked &&
            "border-primary/70 bg-primary/10 text-primary shadow-[0_8px_18px_rgba(36,99,235,0.15)]"
        )}
      >
        <div className="flex w-full items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-ui-border-subtle text-primary focus:ring-primary"
            checked={isChecked}
            onChange={() => toggleColor(option.id)}
          />
          <span className="flex items-center gap-3">
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span
                className="h-5 w-5 rounded-full border border-ui-border-subtle/60 shadow-sm"
                style={{ background: getColorSwatch(option.label) }}
                aria-hidden
              />
              <span
                aria-hidden
                className={clx(
                  "absolute inset-0 rounded-full border-2 border-primary/80 transition-opacity",
                  isChecked ? "opacity-100" : "opacity-0"
                )}
              />
            </span>
            <span className="leading-tight">{option.label}</span>
          </span>
        </div>
      </label>
    )
  }

  const filteredCollections = useMemo(() => {
    const normalizedQuery = collectionsQuery.trim().toLowerCase()
    const filtered = normalizedQuery
      ? collections.filter((collection) =>
          collection.label.toLowerCase().includes(normalizedQuery)
        )
      : collections

    if (showAllCollections || filtered.length <= DEFAULT_VISIBLE_COUNT) {
      return filtered
    }

    return filtered.slice(0, DEFAULT_VISIBLE_COUNT)
  }, [collections, collectionsQuery, showAllCollections])

  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoriesQuery.trim().toLowerCase()
    const filtered = normalizedQuery
      ? categories.filter((category) =>
          category.label.toLowerCase().includes(normalizedQuery)
        )
      : categories

    if (showAllCategories || filtered.length <= DEFAULT_VISIBLE_COUNT) {
      return filtered
    }

    return filtered.slice(0, DEFAULT_VISIBLE_COUNT)
  }, [categories, categoriesQuery, showAllCategories])

  const filteredColors = useMemo(() => {
    const normalizedQuery = colorQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return colors
    }

    return colors.filter((color) =>
      color.label.toLowerCase().includes(normalizedQuery)
    )
  }, [colors, colorQuery])

  const collectionsQueryValue = collectionsQuery.trim()
  const categoriesQueryValue = categoriesQuery.trim()
  const colorQueryValue = colorQuery.trim()

  const SectionHeader = ({
    title,
    section,
    badgeCount,
  }: {
    title: string
    section: SectionKey
    badgeCount?: number
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between rounded-xl border border-transparent bg-ui-bg-subtle/40 px-3 py-3 text-left transition-all duration-200 hover:border-primary/30"
      aria-expanded={openSections[section]}
    >
      <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-ui-fg-muted">
        <span className="text-base text-primary/80" aria-hidden>
          {SECTION_ICONS[section]}
        </span>
        {title}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-[2px] text-[10px] font-semibold text-primary">
            {badgeCount}
          </span>
        )}
      </span>
      <span
        className={clx(
          "text-lg text-ui-fg-muted transition-transform duration-200",
          openSections[section] ? "rotate-0" : "-rotate-180"
        )}
        aria-hidden
      >
        ▾
      </span>
    </button>
  )

  return (
    <aside
      className={clx(
        "w-full shrink-0 bg-ui-bg-base small:max-w-[320px]",
        isDrawer && "max-w-none bg-transparent"
      )}
    >
      <div
        className={clx(
          isDrawer
            ? "relative flex flex-col gap-6 rounded-[28px] border border-ui-border-subtle/50 bg-ui-bg-base/95 p-5 shadow-[0_18px_42px_rgba(17,24,39,0.12)]"
            : "sticky top-24 flex flex-col gap-6 rounded-[32px] border border-ui-border-subtle/60 bg-gradient-to-br from-ui-bg-base via-ui-bg-base/95 to-primary/5 p-6 shadow-[0_18px_42px_rgba(17,24,39,0.12)] backdrop-blur-sm"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Text className="text-sm font-semibold uppercase tracking-[0.32em] text-primary/70">
              Refine
            </Text>
            <Text className="text-2xl font-semibold tracking-tight text-ui-fg-base">
              Filters
            </Text>
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={!canClearAll}
            aria-disabled={!canClearAll}
            className={clx(
              "rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] transition-colors",
              canClearAll
                ? "text-ui-fg-interactive hover:border-primary/40 hover:text-primary"
                : "cursor-not-allowed border-ui-border-subtle/50 text-ui-fg-muted"
            )}
          >
            Clear all
          </button>
        </div>
        <Text className="text-xs text-ui-fg-muted">
          Toggle filters below to instantly update the product grid. Use search to jump straight to the category or collection you need.
        </Text>

        {hasActiveFilters && (
          <section className="space-y-3">
            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-fg-muted">
              Active filters
            </Text>
            <div className="flex flex-wrap gap-2">
              {selectedPrice && (
                <button
                  type="button"
                  onClick={() => setPriceRange(undefined)}
                  className="group inline-flex items-center gap-2 rounded-full border border-ui-border-subtle/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base transition-colors hover:border-primary hover:text-primary"
                >
                  {PRICE_RANGE_FILTERS.find((range) => range.value === selectedPrice)?.label ?? "Price"}
                  <span className="text-sm" aria-hidden>
                    ×
                  </span>
                </button>
              )}

              {removableColorIds.map((colorId) => {
                const colorOption = colorOptionMap.get(colorId)
                const label = colorOption?.label ?? colorId.replace(/-/g, " ")

                return (
                  <button
                    type="button"
                    key={`active-color-${colorId}`}
                    onClick={() => toggleColor(colorId)}
                    className="group inline-flex items-center gap-2 rounded-full border border-ui-border-subtle/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base transition-colors hover:border-primary hover:text-primary"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border border-ui-border-subtle/70"
                        style={{ background: getColorSwatch(label) }}
                        aria-hidden
                      />
                      {label}
                    </span>
                    {typeof colorOption?.count === "number" && colorOption.count > 0 && (
                      <span className="rounded-full bg-ui-border-subtle/60 px-2 py-[2px] text-[11px] font-semibold text-ui-fg-muted">
                        {colorOption.count}
                      </span>
                    )}
                    <span className="text-sm" aria-hidden>
                      ×
                    </span>
                  </button>
                )
              })}

              {removableCollectionIds.map((collectionId) => {
                const option = collectionOptionMap.get(collectionId)

                return (
                  <button
                    type="button"
                    key={`active-collection-${collectionId}`}
                    onClick={() => removeCollection(collectionId)}
                    className="group inline-flex items-center gap-2 rounded-full border border-ui-border-subtle/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base transition-colors hover:border-primary hover:text-primary"
                  >
                    {option?.label ?? "Collection"}
                    {typeof option?.count === "number" && option.count > 0 && (
                      <span className="rounded-full bg-ui-border-subtle/60 px-2 py-[2px] text-[11px] font-semibold text-ui-fg-muted">
                        {option.count}
                      </span>
                    )}
                    <span className="text-sm" aria-hidden>
                      ×
                    </span>
                  </button>
                )
              })}

              {removableCategoryIds.map((categoryId) => {
                const option = categoryOptionMap.get(categoryId)

                return (
                  <button
                    type="button"
                    key={`active-category-${categoryId}`}
                    onClick={() => removeCategory(categoryId)}
                    className="group inline-flex items-center gap-2 rounded-full border border-ui-border-subtle/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base transition-colors hover:border-primary hover:text-primary"
                  >
                    {option?.label ?? "Category"}
                    {typeof option?.count === "number" && option.count > 0 && (
                      <span className="rounded-full bg-ui-border-subtle/60 px-2 py-[2px] text-[11px] font-semibold text-ui-fg-muted">
                        {option.count}
                      </span>
                    )}
                    <span className="text-sm" aria-hidden>
                      ×
                    </span>
                  </button>
                )
              })}

              {inStockOnly && (
                <button
                  type="button"
                  onClick={toggleInStock}
                  className="group inline-flex items-center gap-2 rounded-full border border-ui-border-subtle/70 bg-ui-bg-base px-3 py-1 text-xs font-medium text-ui-fg-base transition-colors hover:border-primary hover:text-primary"
                >
                  In stock
                  <span className="text-sm" aria-hidden>
                    ×
                  </span>
                </button>
              )}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <SectionHeader
            title="Price Range"
            section="price"
            badgeCount={selectedPrice ? 1 : 0}
          />
          {openSections.price && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {priceQuickFilters.map((option) => {
                  const isActive = selectedPrice === option.value

                  return (
                    <button
                      key={`quick-price-${option.value}`}
                      type="button"
                      onClick={() =>
                        setPriceRange(isActive ? undefined : option.value)
                      }
                      className={clx(
                        "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-[0_6px_14px_rgba(36,99,235,0.12)]"
                          : "border-ui-border-subtle/70 bg-ui-bg-base text-ui-fg-muted hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {PRICE_RANGE_FILTERS.map((option) => {
                const isActive = selectedPrice === option.value
                return (
                  <label
                    key={option.value}
                    className={clx(
                      "flex cursor-pointer items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5",
                      isActive && "border-primary/60 bg-primary/10 shadow-sm text-primary"
                    )}
                  >
                    <span className="font-medium text-ui-fg-subtle">
                      {option.label}
                    </span>
                    <input
                      type="radio"
                      name="price-range"
                      checked={isActive}
                      onChange={() => setPriceRange(option.value)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                  </label>
                )
              })}
              {!selectedPrice && (
                <span className="text-xs text-ui-fg-muted">
                  Tap a band to narrow by budget.
                </span>
              )}
              {selectedPrice && (
                <button
                  type="button"
                  onClick={() => setPriceRange(undefined)}
                  className="self-start text-sm font-medium text-ui-fg-interactive transition-colors hover:text-primary"
                >
                  Clear price filter
                </button>
              )}
            </div>
          )}
        </section>

        {collections.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="Collections"
              section="collections"
              badgeCount={removableCollectionIds.length}
            />
            {openSections.collections && (
              <div className="space-y-3">
                {collections.length > DEFAULT_VISIBLE_COUNT && (
                  <input
                    type="search"
                    value={collectionsQuery}
                    onChange={(event) => {
                      setCollectionsQuery(event.target.value)
                      setShowAllCollections(false)
                    }}
                    placeholder="Search collections"
                    className="w-full rounded-full border border-ui-border-subtle bg-transparent px-3 py-2 text-sm text-ui-fg-subtle transition-colors focus:border-primary focus:outline-none"
                  />
                )}
                {collections.length > DEFAULT_VISIBLE_COUNT && (
                  <span className="block text-xs text-ui-fg-muted">
                    Start typing to filter matching collections.
                  </span>
                )}
                <div className="max-h-64 overflow-y-auto rounded-3xl border border-ui-border-subtle/60 bg-ui-bg-subtle/60 p-2 pr-3 shadow-inner no-scrollbar">
                  {filteredCollections.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {filteredCollections.map((collection) =>
                        renderCheckbox(
                          collection,
                          selectedCollections.includes(collection.id),
                          lockedCollectionIds,
                          (id) =>
                            toggleMultiValue("collections", id, lockedCollectionIds)
                        )
                      )}
                    </div>
                  ) : (
                    <p className="px-1 py-6 text-center text-sm text-ui-fg-muted">
                      {collectionsQueryValue
                        ? `No collections match “${collectionsQueryValue}”.`
                        : "No collections available."}
                    </p>
                  )}
                </div>
                {collections.length > DEFAULT_VISIBLE_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllCollections((prev) => !prev)}
                    className="self-start text-sm font-medium text-ui-fg-interactive transition-colors hover:text-primary"
                  >
                    {showAllCollections ? "Show fewer" : "Show all"} collections
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {categories.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="Categories"
              section="categories"
              badgeCount={removableCategoryIds.length}
            />
            {openSections.categories && (
              <div className="space-y-3">
                {categories.length > DEFAULT_VISIBLE_COUNT && (
                  <input
                    type="search"
                    value={categoriesQuery}
                    onChange={(event) => {
                      setCategoriesQuery(event.target.value)
                      setShowAllCategories(false)
                    }}
                    placeholder="Search categories"
                    className="w-full rounded-full border border-ui-border-subtle bg-transparent px-3 py-2 text-sm text-ui-fg-subtle transition-colors focus:border-primary focus:outline-none"
                  />
                )}
                {categories.length > DEFAULT_VISIBLE_COUNT && (
                  <span className="block text-xs text-ui-fg-muted">
                    Quickly narrow down a long list of categories.
                  </span>
                )}
                <div className="max-h-64 overflow-y-auto rounded-3xl border border-ui-border-subtle/60 bg-ui-bg-subtle/60 p-2 pr-3 shadow-inner no-scrollbar">
                  {filteredCategories.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {filteredCategories.map((category) =>
                        renderCheckbox(
                          category,
                          selectedCategories.includes(category.id),
                          lockedCategoryIds,
                          (id) =>
                            toggleMultiValue("categories", id, lockedCategoryIds)
                        )
                      )}
                    </div>
                  ) : (
                    <p className="px-1 py-6 text-center text-sm text-ui-fg-muted">
                      {categoriesQueryValue
                        ? `No categories match “${categoriesQueryValue}”.`
                        : "No categories available."}
                    </p>
                  )}
                </div>
                {categories.length > DEFAULT_VISIBLE_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="self-start text-sm font-medium text-ui-fg-interactive transition-colors hover:text-primary"
                  >
                    {showAllCategories ? "Show fewer" : "Show all"} categories
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {colors.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="Colors"
              section="colors"
              badgeCount={removableColorIds.length}
            />
            {openSections.colors && (
              <div className="space-y-3">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ui-fg-muted/80">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path
                        d="m21 21-4.35-4.35m1.02-4.83a6.33 6.33 0 1 1-12.66 0 6.33 6.33 0 0 1 12.66 0z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={colorQuery}
                    onChange={(event) => setColorQuery(event.target.value)}
                    placeholder="Search colors"
                    className="w-full rounded-full border border-ui-border-subtle bg-transparent py-2 pl-9 pr-3 text-sm text-ui-fg-subtle transition-colors focus:border-primary focus:outline-none"
                    aria-label="Search colors"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </div>
                {colors.length > DEFAULT_VISIBLE_COUNT && (
                  <span className="block text-xs text-ui-fg-muted">
                    Explore palette options or search for a specific finish.
                  </span>
                )}
                <div className="max-h-64 overflow-y-auto rounded-3xl border border-ui-border-subtle/60 bg-ui-bg-subtle/60 p-2 pr-3 shadow-inner no-scrollbar">
                  {filteredColors.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {filteredColors.map((color) => renderColorOption(color))}
                    </div>
                  ) : (
                    <p className="px-1 py-6 text-center text-sm text-ui-fg-muted">
                      {colorQueryValue
                        ? `No colors match “${colorQueryValue}”.`
                        : "No colors available."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <SectionHeader
            title="Availability"
            section="availability"
            badgeCount={inStockOnly ? 1 : 0}
          />
          {openSections.availability && (
            <label
              className={clx(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5",
                inStockOnly && "border-primary/60 bg-primary/10 shadow-sm"
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-ui-border-subtle text-primary focus:ring-primary"
                checked={inStockOnly}
                onChange={toggleInStock}
              />
              <span className="text-sm font-medium text-ui-fg-subtle">
                In stock only
              </span>
            </label>
          )}
        </section>
      </div>
    </aside>
  )
}

export default RefinementList
