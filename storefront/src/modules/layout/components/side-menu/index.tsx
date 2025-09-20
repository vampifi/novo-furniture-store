"use client"

import { Dialog, Transition } from "@headlessui/react"
import type { HttpTypes, StoreProductCategory } from "@medusajs/types"
import { Fragment, useMemo, useState } from "react"
import { HiOutlineChevronRight, HiOutlineX } from "react-icons/hi"
import { RxHamburgerMenu } from "react-icons/rx"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface SideMenuProps {
  product_categories: StoreProductCategory[] | null
  collections?: HttpTypes.StoreCollection[] | null
}

const SideMenu = ({ product_categories, collections }: SideMenuProps) => {
  const [open, setOpen] = useState(false)

  const categoryItems = useMemo(() => {
    if (!product_categories?.length) {
      return [] as Array<{
        id: string
        label: string
        href: string
        variant: "sale" | "new" | "default"
      }>
    }

    const topLevel = product_categories
      .filter((category) => !category.parent_category_id)
      .sort((a, b) => {
        const rankDiff = (a.rank ?? 999) - (b.rank ?? 999)
        if (rankDiff !== 0) {
          return rankDiff
        }
        return (a.name || "").localeCompare(b.name || "")
      })

    return topLevel.map((category) => {
      const handle = category.handle?.toLowerCase() || ""
      const variant: "sale" | "new" | "default" = handle.includes("sale")
        ? "sale"
        : handle.includes("new")
        ? "new"
        : "default"

      return {
        id: category.id,
        label: category.name || category.handle || "Category",
        href: category.handle ? `/categories/${category.handle}` : `/categories/${category.id}`,
        variant,
      }
    })
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

  const closeMenu = () => setOpen(false)

  const renderNavItem = (
    item: { id: string; label: string; href: string; variant?: "sale" | "new" | "default" },
    testId: string
  ) => {
    const baseClasses =
      "flex items-center justify-between rounded-lg px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-colors"

    const variantClasses =
      item.variant === "sale"
        ? "bg-primary text-white"
        : item.variant === "new"
        ? "bg-white text-primary"
        : "text-[#3b2f2f] hover:bg-white hover:text-primary"

    return (
      <li key={item.id}>
        <LocalizedClientLink
          href={item.href}
          onClick={closeMenu}
          className={`${baseClasses} ${variantClasses}`}
          data-testid={testId}
        >
          <span>{item.label}</span>
          <HiOutlineChevronRight className="h-4 w-4" />
        </LocalizedClientLink>
      </li>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
            <Dialog.Panel className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-[#f7eee8] text-[#3b2f2f] shadow-2xl">
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

              <nav className="flex-1 overflow-y-auto px-2 py-4">
                {categoryItems.length ? (
                  <ul className="space-y-1">
                    {categoryItems.map((category) =>
                      renderNavItem(category, `category-${category.id}-link`)
                    )}
                    {renderNavItem(
                      {
                        id: "inspiration",
                        label: "Inspiration",
                        href: "/inspiration",
                        variant: "default",
                      },
                      "inspiration-link"
                    )}
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
                      {collectionItems.map((collection) =>
                        renderNavItem(
                          { ...collection, variant: "default" },
                          `collection-${collection.id}-link`
                        )
                      )}
                    </ul>
                  </div>
                ) : null}
              </nav>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}

export default SideMenu
