"use client"

import { Popover, Transition } from "@headlessui/react"
import { Button } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"
import { HiOutlineShoppingBag } from "react-icons/hi"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

const CartDropdown = ({
  cart: cartState,
  variant = "default",
}: {
  cart?: HttpTypes.StoreCart | null
  variant?: "default" | "mobile"
}) => {
  const totalItems =
    cartState?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>()
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const subtotal = cartState?.subtotal ?? 0
  const itemLabel = `${totalItems} item${totalItems === 1 ? "" : "s"}`
  const itemRef = useRef<number>(totalItems || 0)
  const pathname = usePathname()

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (variant === "mobile") {
      itemRef.current = totalItems
      return
    }

    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    itemRef.current = totalItems
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, pathname, variant])

  if (variant === "mobile") {
    return (
      <LocalizedClientLink
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/80 text-[#3b2f2f]/80 transition-colors hover:bg-white hover:text-[#3b2f2f]"
        href="/cart"
        data-testid="nav-cart-link-mobile"
      >
        <span className="sr-only">Open cart</span>
        <span className="absolute -top-1 -right-1 min-w-[1.2rem] rounded-full bg-primary px-1 text-center text-[0.6rem] font-semibold text-white shadow">
          {totalItems}
        </span>
        <HiOutlineShoppingBag className="h-5 w-5 stroke-[1.2]" />
      </LocalizedClientLink>
    )
  }

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <Popover.Button className="h-full">
          <LocalizedClientLink
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/80 text-[#3b2f2f]/70 transition-colors hover:bg-white hover:text-[#3b2f2f] md:h-11 md:w-11"
            href="/cart"
            data-testid="nav-cart-link"
          >
            <span className="sr-only">Open cart</span>
            <span className="absolute -top-1 -right-1 min-w-[1.4rem] rounded-full bg-primary px-1 text-center text-[0.65rem] font-semibold text-white shadow">
              {totalItems}
            </span>
            <HiOutlineShoppingBag className="h-5 w-5 stroke-[1.2] md:h-6 md:w-6" />
          </LocalizedClientLink>
        </Popover.Button>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel
            static
            className="hidden small:block absolute top-[calc(100%+14px)] right-0 w-[420px] max-w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-[#E4D5C8] bg-white/95 text-[#3F3A36] shadow-[0_28px_48px_rgba(31,26,23,0.16)] backdrop-blur-[2px]"
            data-testid="nav-cart-dropdown"
          >
            <div className="flex items-center justify-between border-b border-[#E4D5C8] bg-[#FBF3ED]/90 px-6 py-5">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold uppercase tracking-[0.28em] text-[#6F6157]">
                  Your bag
                </h3>
                <span className="text-xs font-medium text-[#8C7B6F]">
                  {itemLabel}
                </span>
              </div>
              <span className="inline-flex items-center justify-center rounded-full border border-[#E4D5C8] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5C4F46]">
                Subtotal
              </span>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="no-scrollbar flex max-h-[420px] flex-col gap-5 overflow-y-auto px-6 py-6">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="group grid grid-cols-[110px_1fr] gap-4 rounded-[22px] border border-[#E4D5C8]/80 bg-white/95 p-3 shadow-[0_10px_28px_rgba(31,26,23,0.08)] transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-[0_24px_48px_rgba(31,26,23,0.14)]"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.variant?.product?.handle}`}
                          className="flex w-full items-center justify-center"
                        >
                          <Thumbnail
                            thumbnail={item.variant?.product?.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1 gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-col gap-1">
                                <h3 className="text-sm font-semibold leading-tight text-[#2F2621]">
                                  <LocalizedClientLink
                                    href={`/products/${item.variant?.product?.handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span
                                  className="text-xs font-medium uppercase tracking-[0.18em] text-[#8C7B6F]"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-start justify-end">
                                <LineItemPrice item={item} style="tight" />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1 self-start text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C7B6F] transition-colors hover:text-primary"
                            data-testid="cart-item-remove-button"
                          >
                            Remove
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex flex-col gap-4 border-t border-[#E4D5C8] bg-[#FAF6F3]/80 px-6 py-6 text-sm text-[#5C4F46]">
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span className="text-[#3F3630]">
                      Subtotal{" "}
                      <span className="pl-1 text-sm font-medium text-[#8C7B6F]">
                        (inc. taxes)
                      </span>
                    </span>
                    <span
                      className="text-lg font-semibold text-[#2F2621]"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full rounded-full border border-black bg-black text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-[0_18px_36px_rgba(0,0,0,0.28)] transition hover:border-[#111111] hover:bg-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      Go to cart
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-5 bg-[#FAF6F3]/70 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E4D5C8] bg-white text-sm font-semibold text-[#8C7B6F] shadow-sm">
                  0
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-base font-semibold text-[#3F3630]">
                    Your bag is empty
                  </span>
                  <span className="text-sm text-[#8C7B6F]">
                    Discover furniture and decor tailored to your style.
                  </span>
                </div>
                <LocalizedClientLink href="/store">
                  <Button
                    onClick={close}
                    className="rounded-full border border-[#E4D5C8] bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#5C4F46] shadow-sm transition hover:bg-[#FBF3ED]"
                  >
                    Explore products
                  </Button>
                </LocalizedClientLink>
              </div>
            )}
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
