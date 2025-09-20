
import { Suspense } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import User from "@modules/common/icons/user"
import { BiSupport } from "react-icons/bi"
import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { HiOutlineHeart, HiOutlineSearch, HiOutlineShoppingBag } from "react-icons/hi"
import { HiShieldCheck, HiUsers, HiStar } from "react-icons/hi"
import SideMenu from "@modules/layout/components/side-menu"
import MiddleNavLinks from "@modules/layout/components/middle-nav-links"
import PromoCountdown from "@modules/layout/components/promo-countdown"
import SearchBar from "@modules/layout/components/search-bar"

export default async function Nav() {
  const { product_categories } = await getCategoriesList(0, 6)
  const { collections } = await getCollectionsList(0, 6)
  return (
    <>
      <div className="bg-primary text-white">
        <div className="content-container flex flex-col items-center justify-center gap-3 py-3 text-center text-xs font-semibold uppercase md:flex-row md:justify-between md:text-left">
          <span className="tracking-[0.2em]">Daily Deal + Extra 15% Off Selected Lines</span>
          <PromoCountdown />
          <span className="rounded-full bg-white px-4 py-1 text-primary shadow-sm">
            Use Code: <span className="font-bold">EXTRA15</span>
          </span>
        </div>
      </div>

      <div className="bg-[#f7eee8] shadow-[0_6px_12px_rgba(59,47,47,0.08)]">
      {/* First Section: Logo, Search, Icons */}
      <header className="relative mx-auto">
        <nav className="content-container flex w-full items-center justify-between gap-3 py-4 md:gap-5 md:py-5">
          {/* Left: Mobile menu button (visible on mobile only) */}
          <SideMenu
            product_categories={product_categories}
            collections={collections}
          />

          <LocalizedClientLink
            href="/"
            className="text-2xl font-extrabold uppercase tracking-[0.3em] text-[#3b2f2f] transition-colors hover:text-ui-fg-base sm:text-3xl md:text-5xl"
            data-testid="nav-store-link"
          >
            NOVO
          </LocalizedClientLink>

          {/* Right: Icons (mobile) and Search (desktop) */}
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-5">
            <div className="hidden md:block">
              <SearchBar />
            </div>

            <LocalizedClientLink
              href="/search"
              className="md:hidden rounded-full border border-[#3b2f2f]/10 bg-white/80 p-2 text-[#3b2f2f] shadow-sm"
            >
              <HiOutlineSearch className="h-5 w-5" />
            </LocalizedClientLink>

            <div className="flex items-center gap-2 md:hidden">
              <LocalizedClientLink
                className="rounded-full border border-[#3b2f2f]/10 bg-white/80 p-2 text-[#3b2f2f] transition-colors hover:bg-white"
                href="/account"
                data-testid="nav-account-link-mobile"
              >
                <User className="h-5 w-5" />
              </LocalizedClientLink>

              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/80 text-[#3b2f2f] transition-colors hover:bg-white"
                    href="/cart"
                    data-testid="nav-cart-link-mobile"
                  >
                    <span className="sr-only">Open cart</span>
                    <span className="absolute -top-1 -right-1 min-w-[1.2rem] rounded-full bg-primary px-1 text-center text-[0.6rem] font-semibold text-white shadow">
                      0
                    </span>
                    <HiOutlineShoppingBag className="h-5 w-5" />
                  </LocalizedClientLink>
                }
              >
                {/* Mobile cart indicator */}
                <CartButton variant="mobile" />
              </Suspense>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <LocalizedClientLink
                className="rounded-full p-2 text-[#3b2f2f] transition-colors hover:bg-white/70"
                href="/wishlist"
              >
                <HiOutlineHeart className="h-5 w-5" />
              </LocalizedClientLink>

              <LocalizedClientLink
                className="rounded-full p-2 text-[#3b2f2f] transition-colors hover:bg-white/70"
                href="/support"
              >
                <BiSupport className="h-5 w-5" />
              </LocalizedClientLink>

              <LocalizedClientLink
                className="rounded-full border border-[#3b2f2f]/10 bg-white/80 p-2 text-[#3b2f2f] transition-colors hover:bg-white"
                href="/account"
                data-testid="nav-account-link"
              >
                <User className="h-6 w-6" />
              </LocalizedClientLink>

              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/80 text-[#3b2f2f] transition-colors hover:bg-white"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    <span className="sr-only">Open cart</span>
                    <span className="absolute -top-1 -right-1 min-w-[1.4rem] rounded-full bg-primary px-1 text-center text-[0.65rem] font-semibold text-white shadow">
                      0
                    </span>
                    <HiOutlineShoppingBag className="h-6 w-6" />
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>
        </nav>
      </header>

      {/* Second Section: Categories & Collections */}
      <div>
        <div className="content-container">
          <div className="hidden md:block py-5">
            <MiddleNavLinks
              categories={product_categories ?? null}
              collections={collections ?? null}
            />
          </div>
          <div className="hidden md:flex items-center gap-8 pb-5 text-sm text-[#6b5b5b]">
            <LocalizedClientLink
              className="font-medium uppercase tracking-[0.2em] text-[#3b2f2f] hover:text-ui-fg-base"
              href="/inspiration"
            >
              Inspiration
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      {/* Third Section: Informational Bar */}
      <div className="hidden md:block bg-white/70 text-[#3b2f2f]">
        <div className="content-container">
          <div className="flex flex-col gap-4 py-4 text-center text-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-center gap-3">
              <HiShieldCheck className="h-6 w-6 text-green-600" />
              <p>
                <span className="font-semibold">0% Finance</span> Available
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <HiUsers className="h-6 w-6 text-purple-600" />
              <p>
                Over <span className="font-semibold">1,000,000</span> Happy Customers
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <HiStar className="h-6 w-6 text-yellow-500" />
              <p>
                85,000+ <span className="font-semibold">5 Star Reviews</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
