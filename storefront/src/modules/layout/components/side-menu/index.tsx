"use client"

import { Dialog, Transition } from "@headlessui/react"
import type { HttpTypes, StoreProductCategory } from "@medusajs/types"
import { Fragment, useMemo, useState } from "react"
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX } from "react-icons/hi"
import { RxHamburgerMenu } from "react-icons/rx"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface SideMenuProps {
  product_categories: StoreProductCategory[] | null
  collections?: HttpTypes.StoreCollection[] | null
}

type CategoryItem = {
  id: string
  label: string
  href: string
  variant: "sale" | "new" | "default"
  children: CategoryItem[]
}

const SideMenu = ({ product_categories, collections }: SideMenuProps) => {
  const [open, setOpen] = useState(false)
  const [categoryStack, setCategoryStack] = useState<CategoryItem[]>([])

  const categoryItems = useMemo<CategoryItem[]>(() => {
    if (!product_categories?.length) {
      return []
    }

    const sortCategories = (a: StoreProductCategory, b: StoreProductCategory) => {
      const rankDiff = (a.rank ?? 999) - (b.rank ?? 999)
      if (rankDiff !== 0) {
        return rankDiff
      }
      return (a.name || "").localeCompare(b.name || "")
    }

    const categoriesByParent = new Map<string | null, StoreProductCategory[]>()

    for (const category of product_categories) {
      const parentId = category.parent_category_id ?? null
      const existing = categoriesByParent.get(parentId)
      if (existing) {
        existing.push(category)
      } else {
        categoriesByParent.set(parentId, [category])
      }
    }

    const buildCategoryItem = (category: StoreProductCategory): CategoryItem => {
      const handle = category.handle?.toLowerCase() || ""
      const variant: CategoryItem["variant"] = handle.includes("sale")
        ? "sale"
        : handle.includes("new")
        ? "new"
        : "default"

      const children = (categoriesByParent.get(category.id) ?? [])
        .slice()
        .sort(sortCategories)
        .map(buildCategoryItem)

      return {
        id: category.id,
        label: category.name || category.handle || "Category",
        href: category.handle ? `/categories/${category.handle}` : `/categories/${category.id}`,
        variant,
        children,
      }
    }

    const maxTopLevelToShow = 6

    const topLevel = (categoriesByParent.get(null) ?? [])
      .slice()
      .sort(sortCategories)
      .slice(0, maxTopLevelToShow)

    return topLevel.map(buildCategoryItem)
  }, [product_categories])

  const collectionItems = useMemo(() => {
    if (!collections?.length) {
      return [] as Array<{ id: string; label: string; href: string }>
    }

    return collections.slice(0, 10).map((collection) => ({
      id: collection.id,
      label: collection.title || collection.handle || "Collection",
      href: collection.handle
        ? `/collections/${collection.handle}`
        : `/collections/${collection.id}`,
    }))
  }, [collections])

  const activeCategory = useMemo(() => {
    if (!categoryStack.length) {
      return null
    }

    return categoryStack[categoryStack.length - 1]
  }, [categoryStack])

  const parentCategory = useMemo(() => {
    if (categoryStack.length < 2) {
      return null
    }

    return categoryStack[categoryStack.length - 2]
  }, [categoryStack])

  const closeMenu = () => {
    setCategoryStack([])
    setOpen(false)
  }

  const navItemBaseClasses =
    "flex items-center justify-between rounded-lg px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-colors"

  const getVariantClasses = (variant: CategoryItem["variant"]) => {
    if (variant === "sale") {
      return "bg-primary text-white hover:bg-primary/90"
    }
    if (variant === "new") {
      return "bg-white text-primary hover:bg-white/80"
    }
    return "text-[#3b2f2f] hover:bg-white hover:text-primary"
  }

  return (
    <>
      <button
        onClick={() => {
          setCategoryStack([])
          setOpen(true)
        }}
        className="md:hidden inline-flex items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/70 p-2 text-[#3b2f2f] shadow-sm"
        aria-label="Open navigation menu"
        data-testid="nav-menu-button"
      >
        <RxHamburgerMenu className="h-6 w-6" />
      </button>

      <Transition show={open} as={Fragment} appear>
        <Dialog onClose={closeMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 left-0 flex w-full max-w-md flex-col bg-[#f7eee8] text-[#3b2f2f] shadow-2xl sm:max-w-lg">
              <div className="flex items-center justify-between border-b border-[#e5d7cf] px-6 py-4">
                <Dialog.Title className="text-sm font-semibold uppercase tracking-[0.3em]">
                  Browse
                </Dialog.Title>
                <button
                  onClick={closeMenu}
                  className="rounded-full p-2 text-[#3b2f2f] transition-colors hover:bg-white"
                  aria-label="Close navigation menu"
                  data-testid="close-menu-button"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <div
                  className={`absolute inset-0 flex h-full flex-col transform transition-transform duration-200 ease-out ${
                    activeCategory ? "-translate-x-full" : "translate-x-0"
                  }`}
                  aria-hidden={Boolean(activeCategory)}
                >
                  <nav className="flex-1 overflow-y-auto px-2 py-4">
                    {categoryItems.length ? (
                      <ul className="space-y-1">
                        {categoryItems.map((category) => {
                          const hasChildren = category.children.length > 0
                          const isActive = categoryStack[0]?.id === category.id
                          const itemClasses = `${navItemBaseClasses} ${getVariantClasses(category.variant)} ${
                            isActive ? "ring-1 ring-primary/40" : ""
                          }`

                          if (hasChildren) {
                            return (
                              <li key={category.id}>
                                <button
                                  type="button"
                                  onClick={() => setCategoryStack([category])}
                                  className={`${itemClasses} w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60`}
                                  data-testid={`category-${category.id}-link`}
                                  aria-haspopup="true"
                                  aria-expanded={isActive}
                                >
                                  <span>{category.label}</span>
                                  <HiOutlineChevronRight className="h-4 w-4" />
                                </button>
                              </li>
                            )
                          }

                          return (
                            <li key={category.id}>
                              <LocalizedClientLink
                                href={category.href}
                                onClick={closeMenu}
                                className={itemClasses}
                                data-testid={`category-${category.id}-link`}
                              >
                                <span>{category.label}</span>
                                <HiOutlineChevronRight className="h-4 w-4" />
                              </LocalizedClientLink>
                            </li>
                          )
                        })}
                        <li key="inspiration">
                          <LocalizedClientLink
                            href="/inspiration"
                            onClick={closeMenu}
                            className={`${navItemBaseClasses} ${getVariantClasses("default")}`}
                            data-testid="inspiration-link"
                          >
                            <span>Inspiration</span>
                            <HiOutlineChevronRight className="h-4 w-4" />
                          </LocalizedClientLink>
                        </li>
                      </ul>
                    ) : (
                      <p className="px-5 py-3 text-sm text-[#8f7f78]">
                        No categories available.
                      </p>
                    )}

                    {collectionItems.length ? (
                      <div className="mt-6 border-t border-[#e5d7cf] pt-4">
                        <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8f7f78]">
                          Collections
                        </p>
                        <ul className="space-y-1">
                          {collectionItems.map((collection) => (
                            <li key={collection.id}>
                              <LocalizedClientLink
                                href={collection.href}
                                onClick={closeMenu}
                                className={`${navItemBaseClasses} ${getVariantClasses("default")}`}
                                data-testid={`collection-${collection.id}-link`}
                              >
                                <span>{collection.label}</span>
                                <HiOutlineChevronRight className="h-4 w-4" />
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </nav>
                </div>

                <div
                  className={`absolute inset-0 flex h-full flex-col transform transition-transform duration-200 ease-out ${
                    activeCategory ? "translate-x-0" : "translate-x-full"
                  }`}
                  aria-hidden={Boolean(!activeCategory)}
                >
                  {activeCategory ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#e5d7cf] px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setCategoryStack((prev) => prev.slice(0, -1))
                          }
                          className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#3b2f2f] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          aria-label={parentCategory ? `Back to ${parentCategory.label}` : "Back to main menu"}
                        >
                          <HiOutlineChevronLeft className="h-4 w-4" />
                          Back
                        </button>
                        <div className="text-right">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[#8f7f78]">
                            {activeCategory.children.length ? "Subcategories" : "Browse"}
                          </p>
                          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.25em]">
                            {activeCategory.label}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto px-2 py-4">
                        <ul className="space-y-1">
                          <li>
                            <LocalizedClientLink
                              href={activeCategory.href}
                              onClick={closeMenu}
                              className={`${navItemBaseClasses} bg-white text-primary hover:bg-white/80`}
                              data-testid={`category-${activeCategory.id}-shop-all-link`}
                            >
                              <span className="tracking-[0.15em]">
                                Shop all {activeCategory.label}
                              </span>
                              <HiOutlineChevronRight className="h-4 w-4" />
                            </LocalizedClientLink>
                          </li>

                          {activeCategory.children.length ? (
                            activeCategory.children.map((child) => {
                              const childHasChildren = child.children.length > 0
                              const isChildActive = categoryStack.some(
                                (stackCategory) => stackCategory.id === child.id
                              )
                              const childClasses = `${navItemBaseClasses} ${getVariantClasses(child.variant)} ${
                                childHasChildren ? "w-full text-left" : ""
                              } ${isChildActive ? "ring-1 ring-primary/40" : ""}`

                              if (childHasChildren) {
                                return (
                                  <li key={child.id}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCategoryStack((prev) => {
                                          const next = prev[prev.length - 1]
                                          if (next?.id === child.id) {
                                            return prev
                                          }
                                          return [...prev, child]
                                        })
                                      }
                                      className={`${childClasses} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60`}
                                      data-testid={`subcategory-${child.id}-drilldown`}
                                      aria-haspopup="true"
                                      aria-expanded={isChildActive}
                                    >
                                      <span className="tracking-[0.15em]">{child.label}</span>
                                      <HiOutlineChevronRight className="h-4 w-4" />
                                    </button>
                                  </li>
                                )
                              }

                              return (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    href={child.href}
                                    onClick={closeMenu}
                                    className={childClasses}
                                    data-testid={`subcategory-${child.id}-link`}
                                  >
                                    <span className="tracking-[0.15em]">{child.label}</span>
                                    <HiOutlineChevronRight className="h-4 w-4" />
                                  </LocalizedClientLink>
                                </li>
                              )
                            })
                          ) : (
                            <li>
                              <p className="px-5 py-3 text-sm text-[#8f7f78]">
                                We&apos;re curating more for {activeCategory.label}. Explore the full assortment in the meantime.
                              </p>
                            </li>
                          )}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}

export default SideMenu
