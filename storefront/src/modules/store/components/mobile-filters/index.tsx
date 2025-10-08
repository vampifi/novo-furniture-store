"use client"

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react"
import { useSearchParams } from "next/navigation"

import { clx } from "@medusajs/ui"

import RefinementList from "../refinement-list"
import SortProducts, {
  SortOptions,
} from "../refinement-list/sort-products"

const CHEVRON = "▾"
const CLOSE = "✕"
const DRAWER_ID = "mobile-filters-drawer"

type RefinementListProps = ComponentProps<typeof RefinementList>

type MobileFiltersProps = {
  sortBy: SortOptions
} & Pick<
  RefinementListProps,
  "categories" | "collections" | "colors" | "lockedCategoryIds" | "lockedCollectionIds"
>

const MobileFilters = ({ sortBy, ...refinementProps }: MobileFiltersProps) => {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const searchParams = useSearchParams()

  const splitValues = (value: string | null) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : []

  const activeFiltersCount = useMemo(() => {
    if (!searchParams) {
      return 0
    }

    const categories = splitValues(searchParams.get("categories"))
    const collections = splitValues(searchParams.get("collections"))
    const colors = splitValues(searchParams.get("colors"))
    const price = searchParams.get("priceRange") ? 1 : 0
    const stock = searchParams.get("inStock") === "true" ? 1 : 0

    const categoryCount = categories.filter(
      (id) => !(refinementProps.lockedCategoryIds || []).includes(id)
    ).length
    const collectionCount = collections.filter(
      (id) => !(refinementProps.lockedCollectionIds || []).includes(id)
    ).length

    return (
      categoryCount +
      collectionCount +
      colors.length +
      price +
      stock
    )
  }, [searchParams, refinementProps.lockedCategoryIds, refinementProps.lockedCollectionIds])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!mounted && open) {
      setMounted(true)
    }
  }, [open, mounted])

  useEffect(() => {
    if (!mounted && !open) {
      return
    }

    if (!open) {
      const timeout = setTimeout(() => setMounted(false), 220)
      return () => clearTimeout(timeout)
    }
  }, [open, mounted])

  const handleOpen = () => {
    if (!mounted) {
      setMounted(true)
      requestAnimationFrame(() => setOpen(true))
      return
    }

    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className="space-y-4 lg:hidden">
      <div className="rounded-3xl border border-[#E3DAD3] bg-[#fdf8f3]/90 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleOpen}
            aria-expanded={open}
            aria-controls={DRAWER_ID}
            className="flex items-center justify-between gap-3 rounded-full border border-[#E3DAD3] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5C5149] transition-all hover:border-[#C9B7A8] hover:text-[#3F3C3D]"
          >
            <span className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E3DAD3] bg-[#fdf8f3] text-[10px] font-semibold text-[#6F6157]">
                ⊕
              </span>
              Filter
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-[2px] text-[10px] font-semibold text-primary">
                  {activeFiltersCount}
                </span>
              )}
            </span>
            <span aria-hidden>{CHEVRON}</span>
          </button>
          <SortProducts
            sortBy={sortBy}
            variant="pill"
            label="Sort products"
            className="col-span-1 w-full"
          />
        </div>
      </div>

      {mounted && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className={clx(
              "absolute inset-0 bg-black/40 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0"
            )}
            role="presentation"
            onClick={handleClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            id={DRAWER_ID}
            className={clx(
              "relative ml-auto flex h-full w-full max-w-full overflow-hidden bg-[#fdf8f3] shadow-[0_28px_56px_rgba(15,23,42,0.25)] transition-transform duration-200 ease-out",
              "sm:max-w-[360px] sm:rounded-l-[32px]",
              open ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex h-full flex-col">
              <header className="relative flex items-center justify-between gap-4 bg-gradient-to-br from-[#f9ede1] via-[#fdf8f3] to-[#f3e5d9] px-4 pb-4 pt-5 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)] sm:px-5 sm:pt-6">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/70">
                    Filters
                  </span>
                  <span className="text-base font-semibold text-ui-fg-base">
                    Refine your results
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="text-xs text-ui-fg-muted">
                      {activeFiltersCount} active filter
                      {activeFiltersCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close filters"
                  ref={closeButtonRef}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ui-border-subtle/60 bg-white/90 text-sm font-semibold text-ui-fg-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span aria-hidden>{CLOSE}</span>
                </button>
              </header>
              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-5 sm:pt-6">
                <RefinementList {...refinementProps} variant="drawer" />
              </div>
              <footer className="border-t border-ui-border-subtle/60 bg-white/90 px-4 py-4 shadow-[0_-10px_24px_rgba(17,24,39,0.06)] backdrop-blur-sm sm:bg-white/80">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-[0_12px_24px_rgba(36,99,235,0.35)] transition-transform hover:translate-y-[1px] hover:shadow-[0_10px_20px_rgba(36,99,235,0.25)]"
                >
                  Show results
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileFilters
