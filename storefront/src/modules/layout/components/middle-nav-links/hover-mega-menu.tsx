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

  const categoryColumns = useMemo(() => {
    if (!currentItem) {
      return [] as {
        id: string
        title: string
        href: string
        links: { id: string; label: string; href: string }[]
      }[]
    }

    const directChildren = (currentItem.category.category_children ?? []).filter(
      Boolean
    ) as CategoryWithChildren[]

    return directChildren.slice(0, 8).map((child) => {
      const grandChildren = (child.category_children ?? []).filter(Boolean) as
        | CategoryWithChildren[]
        | undefined

      const linkList = (grandChildren?.slice(0, 10) ?? []).map((grand) => ({
        id: grand.id,
        label: grand.name || grand.handle || "Category",
        href: grand.handle
          ? `/categories/${grand.handle}`
          : currentItem.href,
      }))

      if (!linkList.length) {
        linkList.push({
          id: child.id,
          label: child.name || child.handle || "Category",
          href: child.handle
            ? `/categories/${child.handle}`
            : currentItem.href,
        })
      }

      return {
        id: child.id,
        title: child.name || child.handle || "Category",
        href: child.handle
          ? `/categories/${child.handle}`
          : currentItem.href,
        links: linkList,
      }
    })
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
          className="absolute left-1/2 top-full z-30 mt-2 flex w-screen -translate-x-1/2 justify-center px-4 sm:px-6 lg:px-8"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <div className="w-full max-w-none overflow-hidden rounded-none bg-white/95 shadow-2xl backdrop-blur-md md:rounded-3xl">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:gap-12 lg:p-10">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  {currentItem.label}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-[#3b2f2f]">
                  Explore curated styles for every space
                </h3>
                <p className="mt-2 text-sm text-[#6b5b5b]">
                  Discover pieces that pair beautifully with {currentItem.label}. Shop the trend, browse inspirations, or jump straight into the full collection.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <LocalizedClientLink
                    className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                    href={currentItem.href}
                  >
                    Shop {currentItem.label}
                  </LocalizedClientLink>
                  <LocalizedClientLink
                    className="rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    href={`${currentItem.href}?sort=trending`}
                  >
                    View Trending
                  </LocalizedClientLink>
                </div>
              </div>

              <div className="flex-1">
                {categoryColumns.length ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryColumns.map((column) => (
                      <div key={column.id} className="rounded-2xl bg-ui-bg-subtle/60 p-5 shadow-sm transition-transform hover:-translate-y-1">
                        <LocalizedClientLink
                          className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3b2f2f] hover:text-ui-fg-base"
                          href={column.href}
                        >
                          {column.title}
                        </LocalizedClientLink>
                        <ul className="mt-3 space-y-2 text-sm text-[#474546]">
                          {column.links.map((link) => (
                            <li key={link.id}>
                              <LocalizedClientLink
                                className="transition-colors hover:text-ui-fg-base"
                                href={link.href}
                              >
                                {link.label}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-center gap-4 rounded-2xl bg-ui-bg-subtle/60 p-6 text-sm text-[#474546] shadow-sm">
                    <p>
                      We&apos;re curating inspiration for <span className="font-semibold text-[#3b2f2f]">{currentItem.label}</span>. Check back soon for fresh ideas, or explore the full selection now.
                    </p>
                    <LocalizedClientLink
                      className="self-start rounded-full border border-[#3b2f2f]/30 px-5 py-2 text-sm font-medium text-[#3b2f2f] transition-colors hover:border-primary hover:text-primary"
                      href={currentItem.href}
                    >
                      Browse all {currentItem.label}
                    </LocalizedClientLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HoverMegaMenu
