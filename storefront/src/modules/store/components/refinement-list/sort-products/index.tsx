"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { clx } from "@medusajs/ui"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  label?: string
  variant?: "default" | "pill"
  className?: string
}

const sortOptions: { value: SortOptions; label: string }[] = [
  {
    value: "created_at",
    label: "Relevance",
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
  },
]

const SortProducts = ({
  sortBy,
  label = "Sort By",
  variant = "default",
  className,
}: SortProductsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onSortChange = useCallback(
    (value: SortOptions) => {
      const params = new URLSearchParams(searchParams)

      if (value === "created_at") {
        params.delete("sortBy")
      } else {
        params.set("sortBy", value)
      }

      params.delete("page")

      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    },
    [router, pathname, searchParams]
  )

  if (variant === "pill") {
    return (
      <div className={clx("relative", className)}>
        <select
          aria-label={label}
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as SortOptions)}
          className="peer w-full appearance-none rounded-full border border-[#E3DAD3] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5C5149] transition-all focus:border-[#C9B7A8] focus:outline-none focus:text-[#3F3C3D]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6F6157] transition-colors peer-focus:text-[#3F3C3D]">
          ▾
        </span>
      </div>
    )
  }

  return (
    <label
      className={clx(
        "flex items-center gap-3 text-sm font-medium text-ui-fg-muted",
        className
      )}
    >
      {label}
      <select
        value={sortBy}
        onChange={(event) => onSortChange(event.target.value as SortOptions)}
        className="rounded-full border border-ui-border-subtle bg-ui-bg-base px-4 py-2 text-sm font-medium text-ui-fg-base shadow-sm transition-colors focus:border-primary focus:outline-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default SortProducts
