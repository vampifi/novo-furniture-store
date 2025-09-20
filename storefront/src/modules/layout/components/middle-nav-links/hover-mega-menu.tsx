"use client"

import { useMemo, useState } from "react"
import type { KeyboardEvent } from "react"
import type { HttpTypes, StoreProductCategory } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategoryWithChildren = StoreProductCategory & {
  category_children?: StoreProductCategory[] | null
}

interface HoverMegaMenuProps {
  categories: CategoryWithChildren[]
  collections: HttpTypes.StoreCollection[]
}

type NavItem =
  | {
      key: string
      label: string
      href: string
      type: "category"
      category: CategoryWithChildren
      variant: "pill" | "highlight" | "default"
    }
  | {
      key: string
      label: string
      href: string
      type: "collection"
      collection: HttpTypes.StoreCollection
      variant: "default"
    }

const HoverMegaMenu = ({ categories, collections }: HoverMegaMenuProps) => {
  const [openKey, setOpenKey] = useState<string | null>(null)

  const items = useMemo<NavItem[]>(() => {
    const categoryItems = categories.map<NavItem>((category) => ({
      key: `category-${category.id}`,
      label: category.name || category.handle || "Category",
      href: category.handle
        ? `/categories/${category.handle}`
        : `/categories/${category.id}`,
      type: "category",
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

    const collectionItems = collections.map<NavItem>((collection) => ({
      key: `collection-${collection.id}`,
      label: collection.title || collection.handle || "Collection",
      href: collection.handle
        ? `/collections/${collection.handle}`
        : `/collections/${collection.id}`,
      type: "collection",
      collection,
      variant: "default",
    }))

    return [...categoryItems, ...collectionItems]
  }, [categories, collections])

  const currentItem = useMemo(() => {
    if (!openKey) {
      return null
    }

    return items.find((item) => item.key === openKey) ?? null
  }, [items, openKey])

  const categoryColumns = useMemo(() => {
    if (!currentItem || currentItem.type !== "category") {
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

  const shouldRenderPanel = currentItem?.type === "category" && categoryColumns.length > 0

  return (
    <div className="relative" onMouseLeave={() => setOpenKey(null)}>
      <div className="flex flex-wrap items-center gap-6">
        {items.map((item) => (
          <LocalizedClientLink
            key={item.key}
            className={`font-medium transition-all ${(() => {
              if (item.variant === "pill") {
                return "rounded-full bg-primary px-4 py-1 text-white shadow hover:bg-primary/90"
              }
              if (item.variant === "highlight") {
                return "px-2 py-1 text-[#3b2f2f] underline decoration-2 underline-offset-8"
              }
              const baseColor = openKey === item.key ? "text-ui-fg-base" : "text-[#474546]"
              return `${baseColor} px-2 py-1 rounded-md hover:text-ui-fg-base`
            })()}`}
            href={item.href}
            data-testid={
              item.type === "category" ? "category-link" : "collection-link"
            }
            onMouseEnter={() => setOpenKey(item.key)}
            onFocus={() => setOpenKey(item.key)}
            onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
              if (event.key === "Escape") {
                setOpenKey(null)
              }
            }}
            aria-haspopup="true"
            aria-expanded={openKey === item.key}
          >
            {item.label}
          </LocalizedClientLink>
        ))}
      </div>

      {shouldRenderPanel && currentItem && (
        <div className="absolute left-1/2 top-full z-30 mt-2 w-screen -translate-x-1/2">
          <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="grid gap-8 bg-ui-bg-subtle/60 p-10 md:grid-cols-3 lg:grid-cols-4">
              {categoryColumns.map((column) => (
                <div key={column.id} className="space-y-4">
                  <LocalizedClientLink
                    className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3b2f2f] hover:text-ui-fg-base"
                    href={column.href}
                  >
                    {column.title}
                  </LocalizedClientLink>
                  <ul className="space-y-2 text-sm text-[#474546]">
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
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ui-border-subtle bg-white px-6 py-4 text-sm text-[#3b2f2f] md:px-10 md:py-6">
              <div>
                <p className="font-semibold">Explore the {currentItem.label} range</p>
                <p className="text-xs text-ui-fg-muted">
                  Discover curated pieces tailored for your space.
                </p>
              </div>
              <LocalizedClientLink
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                href={currentItem.href}
              >
                Shop {currentItem.label}
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HoverMegaMenu
