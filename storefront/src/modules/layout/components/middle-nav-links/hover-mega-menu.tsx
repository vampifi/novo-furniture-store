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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {subcategories.map((subcategory) => (
                    <LocalizedClientLink
                      key={subcategory.id}
                      className="text-sm font-medium text-[#3b2f2f] transition-colors hover:text-ui-fg-base"
                      href={subcategory.href}
                    >
                      {subcategory.label}
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
