import { Suspense } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import User from "@modules/common/icons/user"
import { BiSupport } from "react-icons/bi"
import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { HiOutlineSearch, HiOutlineShoppingBag } from "react-icons/hi"
import { HiShieldCheck, HiOutlineBriefcase, HiStar } from "react-icons/hi"
import SideMenu from "@modules/layout/components/side-menu"
import MiddleNavLinks from "@modules/layout/components/middle-nav-links"
import PromoCountdown from "@modules/layout/components/promo-countdown"

export default async function Nav() {
  const { product_categories } = await getCategoriesList(0, 200)
  const { collections } = await getCollectionsList(0, 6)

  const topLevelCategories = (product_categories ?? [])
    .filter((category) => !category.parent_category_id)
    .sort((a, b) => {
      const rankDiff = (a.rank ?? 999) - (b.rank ?? 999)
      if (rankDiff !== 0) {
        return rankDiff
      }
      return (a.name || "").localeCompare(b.name || "")
    })
    .slice(0, 6)

  return (
    <>
      <div className="bg-primary text-white">
        <div className="content-container flex flex-col items-center justify-center gap-3 py-3 text-center text-sm font-semibold uppercase md:flex-row md:justify-center md:text-left">
          <span className="tracking-[0.2em]">
            Daily Deal + Extra 15% Off Selected Lines
          </span>
          <PromoCountdown />
          <span className="rounded-full bg-white px-4 py-1 text-primary shadow-sm">
            Use Code: <span className="font-bold">EXTRA15</span>
          </span>
        </div>
      </div>

      <div className="bg-background">
        {/* First Section: Logo, Search, Icons */}
        <header className="relative mx-auto">
          <nav className="content-container flex w-full items-center justify-between gap-4 py-3 md:gap-6 md:py-9">
            {/* Left: Mobile menu button (visible on mobile only) */}
            <SideMenu
              product_categories={product_categories}
              collections={collections}
            />

            <LocalizedClientLink
              href="/"
              className="text-2xl font-semibold uppercase tracking-[0.3em] text-textColor transition-colors hover:text-ui-fg-base sm:text-3xl md:text-5xl"
              data-testid="nav-store-link"
            >
              NOVO
            </LocalizedClientLink>

            {/* Right: Icons (mobile) and Search (desktop) */}
            <div className="flex flex-1 items-center justify-end gap-3 md:gap-6">
              <LocalizedClientLink
                href="/search"
                aria-label="Search"
                className="hidden md:flex text-[#3b2f2f]/80 transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:text-[#3b2f2f]"
              >
                <HiOutlineSearch className="h-6 w-6 stroke-[1.2]" />
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/search"
                className="md:hidden rounded-full border border-[#3b2f2f]/10 bg-white/80 p-2 text-[#3b2f2f]/80 shadow-sm transition-colors hover:text-[#3b2f2f]"
              >
                <HiOutlineSearch className="h-5 w-5 stroke-[1.2]" />
              </LocalizedClientLink>

              <div className="flex items-center gap-3 md:hidden">
                <LocalizedClientLink
                  className="rounded-full border border-[#3b2f2f]/10 bg-white/80 p-2 text-[#3b2f2f]/80 transition-colors hover:bg-white hover:text-[#3b2f2f]"
                  href="/account"
                  data-testid="nav-account-link-mobile"
                >
                  <User className="h-5 w-5 stroke-[1.2]" />
                </LocalizedClientLink>

                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/80 text-[#3b2f2f]/80 transition-colors hover:bg-white hover:text-[#3b2f2f]"
                      href="/cart"
                      data-testid="nav-cart-link-mobile"
                    >
                      <span className="sr-only">Open cart</span>
                      <span className="absolute -top-1 -right-1 min-w-[1.2rem] rounded-full bg-primary px-1 text-center text-[0.6rem] font-semibold text-white shadow">
                        0
                      </span>
                      <HiOutlineShoppingBag className="h-5 w-5 stroke-[1.2]" />
                    </LocalizedClientLink>
                  }
                >
                  {/* Mobile cart indicator */}
                  <CartButton variant="mobile" />
                </Suspense>
              </div>

              <div className="hidden items-center gap-8 md:flex">
                <LocalizedClientLink
                  className="rounded-full p-2 text-[#3b2f2f]/70 transition-colors hover:bg-white/70 hover:text-[#3b2f2f]"
                  href="/support"
                >
                  <BiSupport className="h-6 w-6" />
                </LocalizedClientLink>

                <LocalizedClientLink
                  className="rounded-full border border-[#3b2f2f]/10 bg-white/80 p-2 text-[#3b2f2f]/70 transition-colors hover:bg-white hover:text-[#3b2f2f]"
                  href="/account"
                  data-testid="nav-account-link"
                >
                  <User className="h-6 w-6 stroke-[1.2]" />
                </LocalizedClientLink>

                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#3b2f2f]/10 bg-white/80 text-[#3b2f2f]/70 transition-colors hover:bg-white hover:text-[#3b2f2f]"
                      href="/cart"
                      data-testid="nav-cart-link"
                    >
                      <span className="sr-only">Open cart</span>
                      <span className="absolute -top-1 -right-1 min-w-[1.4rem] rounded-full bg-primary px-1 text-center text-[0.65rem] font-semibold text-white shadow">
                        0
                      </span>
                      <HiOutlineShoppingBag className="h-6 w-6 stroke-[1.2]" />
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </div>
          </nav>
        </header>

        {/* Second Section: Categories */}
        <div>
          <div className="content-container">
            <div className="hidden md:block py-5">
              <MiddleNavLinks categories={topLevelCategories ?? null} />
            </div>
            <div className="hidden md:flex items-center gap-8 pb-5 text-sm text-[#6b5b5b]">
              <LocalizedClientLink
                className="font-normal tracking-[0.2em] text-[#3b2f2f] hover:text-ui-fg-base"
                href="/inspiration"
              >
                Inspiration
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        {/* Third Section: Informational Bar */}
        <div className="hidden md:block text-[#3b2f2f]">
          <div className="content-container">
            <div className="flex flex-col gap-5 py-5 text-center text-base md:flex-row md:items-center md:justify-evenly md:gap-10">
              <div className="flex items-center justify-center gap-3">
                <HiShieldCheck className="h-6 w-6 stroke-[1.2] text-green-600" />
                <p>
                  <span className="font-semibold">Finance</span> Available
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <HiOutlineBriefcase className="h-6 w-6 stroke-[1.2] text-purple-600" />
                <p>
                  <span className="font-semibold">10+</span> years of experience
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <HiStar className="h-6 w-6 text-yellow-500" />
                <p>
                  Thousands <span className="font-semibold">of happy reviewers</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
