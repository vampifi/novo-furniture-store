"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import type { StoreProductCategory } from "@medusajs/types"
import { usePathname } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategoryWithChildren = StoreProductCategory & {
  category_children?: StoreProductCategory[] | null
}

interface HoverMegaMenuProps {
  categories: CategoryWithChildren[]
}

type NavItem = {
  key: string
  label: string
  href: string
  category: CategoryWithChildren
  variant: "pill" | "highlight" | "default"
}

const HoverMegaMenu = ({ categories }: HoverMegaMenuProps) => {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const pathname = usePathname()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => {
      setOpenKey(null)
    }, 180)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
      }
    }
  }, [])

  const items = useMemo<NavItem[]>(() => {
    return categories.map<NavItem>((category) => ({
      key: `category-${category.id}`,
      label: category.name || category.handle || "Category",
      href: category.handle
        ? `/categories/${category.handle}`
        : `/categories/${category.id}`,
      category,
      variant: (() => {
        const handle = (category.handle || "").toLowerCase()
        if (handle.includes("sale")) {
          return "pill"
        }
        if (handle.includes("new")) {
          return "highlight"
        }
        return "default"
      })(),
    }))
  }, [categories])

  const activeKey = useMemo(() => {
    if (!pathname) {
      return null
    }

    const normalizedPath = pathname.replace(/\/$/, "")

    const matchedItem = items.find((item) => {
      const normalizedHref = item.href.replace(/\/$/, "")
      if (!normalizedHref) {
        return false
      }

      return (
        normalizedPath === normalizedHref ||
        normalizedPath.endsWith(normalizedHref) ||
        normalizedPath.includes(`${normalizedHref}/`)
      )
    })

    return matchedItem?.key ?? null
  }, [items, pathname])

  const currentItem = useMemo(() => {
    if (!openKey) {
      return null
    }

    return items.find((item) => item.key === openKey) ?? null
  }, [items, openKey])

  const subcategories = useMemo(() => {
    if (!currentItem) {
      return [] as {
        id: string
        label: string
        href: string
      }[]
    }

    return ((currentItem.category.category_children ?? []).filter(Boolean) as CategoryWithChildren[]).map(
      (child) => ({
        id: child.id,
        label: child.name || child.handle || "Category",
        href: child.handle ? `/categories/${child.handle}` : currentItem.href,
      })
    )
  }, [currentItem])

  const shouldRenderPanel = Boolean(currentItem)

  return (
    <div
      className="relative"
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
    >
      <div className="flex flex-wrap items-center gap-6">
        {items.map((item) => {
          const isHovered = openKey === item.key
          const isActive = isHovered || activeKey === item.key

          return (
            <LocalizedClientLink
              key={item.key}
              className={`transition-all ${(() => {
                if (item.variant === "pill") {
                  return `rounded-full bg-primary py-1 text-white shadow ${
                    isActive ? "font-semibold" : "font-medium"
                  } hover:bg-primary/90`
                }
                if (item.variant === "highlight") {
                  const fontClasses = isActive ? "font-semibold" : "font-normal"
                  return `relative pb-2 border-b-2 ${
                    isActive ? "border-primary" : "border-transparent hover:border-primary"
                  } text-[#3b2f2f] ${fontClasses} hover:text-ui-fg-base`
                }
                const baseColor = isActive ? "text-ui-fg-base" : "text-[#474546]"
                const fontClasses = isActive ? "font-semibold" : "font-normal"
                return `${baseColor} ${fontClasses} relative tracking-[0.1em] pb-2 border-b-2 ${
                  isActive ? "border-primary" : "border-transparent hover:border-primary"
                } hover:text-ui-fg-base`
              })()}`}
              href={item.href}
              data-testid="category-link"
              onMouseEnter={() => {
                clearCloseTimer()
                setOpenKey(item.key)
              }}
              onFocus={() => {
                clearCloseTimer()
                setOpenKey(item.key)
              }}
              onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
                if (event.key === "Escape") {
                  setOpenKey(null)
                }
              }}
              aria-haspopup="true"
              aria-expanded={isHovered}
            >
              {item.label}
            </LocalizedClientLink>
          )
        })}
      </div>

      {shouldRenderPanel && currentItem && (
        <div
          className="absolute inset-x-0 top-full z-30 mt-2 w-full"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <div className="w-full bg-[#FAF6F3] shadow-2xl">
            <div className="flex w-full flex-col gap-6 px-6 py-8 sm:px-8 lg:px-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  {currentItem.label}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[#3b2f2f]">
                  Shop subcategories
                </h3>
              </div>

              {subcategories.length ? (
                <div className="grid gap-y-4 gap-x-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subcategories.map((subcategory) => (
                    <LocalizedClientLink
                      key={subcategory.id}
                      className="group flex items-center justify-between rounded-2xl border border-transparent bg-white/85 px-5 py-4 text-sm font-medium text-[#2F2620] shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#E8DACE] hover:bg-white hover:text-ui-fg-base hover:shadow-[0_12px_28px_rgba(34,28,24,0.12)]"
                      href={subcategory.href}
                    >
                      <span className="tracking-wide">
                        {subcategory.label}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0E6DD] text-[#2E261F] transition-all duration-150 group-hover:bg-[#221C18] group-hover:text-[#EFE4DC] group-hover:translate-x-1">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.3335 3.99984L10.6668 8.00034L5.3335 12.0008"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </LocalizedClientLink>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#474546]">
                  We&apos;re curating inspiration for {currentItem.label}. Check back soon for fresh ideas, or explore the full selection now.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HoverMegaMenu
