
import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import User from "@modules/common/icons/user"
import { BiSupport } from "react-icons/bi"
import { CiShoppingCart } from "react-icons/ci"
import { getCategoriesList } from "@lib/data/categories"
import { HiOutlineMenu, HiOutlineSearch, HiOutlineUser, HiOutlineShoppingBag } from "react-icons/hi";
import { HiShieldCheck, HiUsers, HiStar } from "react-icons/hi";
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const { product_categories } = await getCategoriesList(0, 6)
  console.log("Product Categories in Nav:", product_categories);
  return (
    <>
      <div className="py-2 bg-primary">
      <nav className="content-container text-ui-fg-subtle flex items-center justify-center w-full h-full text-base-regular">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
          <p className="uppercase text-white font-bold text-center md:text-left">
            EXTRA 15% OFF SELECTED LINES
          </p>
          <span className="px-3 py-1 bg-white text-primary rounded-2xl shadow-md flex items-center gap-2 font-normal justify-center whitespace-nowrap">
            USE CODE: <span className="font-bold">EXTRA15</span>
          </span>
        </div>
      </nav>
    </div>
     

      <div className="bg-background">
      {/* First Section: Logo, Search, Icons */}
      <header className="relative mx-auto">
        <nav className="content-container py-4 flex items-center justify-between w-full">
          {/* Left: Mobile menu button (visible on mobile only) */}
          <button className="md:hidden p-2 rounded-md text-gray-600 ">
            <SideMenu regions={regions} product_categories={product_categories}/>
          </button>

          <LocalizedClientLink
            href="/"
            className="text-4xl md:text-6xl font-bold hover:text-ui-fg-base uppercase text-[#474546] mx-auto md:mx-0"
            data-testid="nav-store-link"
          >
            NOVO
          </LocalizedClientLink>

          {/* Right: Icons (mobile) and Search (desktop) */}
          <div className="flex items-center space-x-4 md:space-x-6">
           
            <LocalizedClientLink href="/search" className="hidden md:flex relative w-full min-w-96">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 rounded-full focus:outline-none transition-all"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-black">
                <HiOutlineSearch className="h-5 w-5" />
              </span>
            </LocalizedClientLink>

            {/* Mobile Search Icon */}
            <LocalizedClientLink href="/search" className="md:hidden p-2 rounded-md ">
              <HiOutlineSearch className="h-5 w-5" />
            </LocalizedClientLink>

            {/* Support Icon (desktop only) */}
            <LocalizedClientLink className="hidden md:block hover:text-ui-fg-base p-2 rounded-md text-[#474546]" href="/support">
              <BiSupport className="h-5 w-5" />
            </LocalizedClientLink>

            {/* User Icon */}
            <LocalizedClientLink
              className="hover:text-ui-fg-base p-2 rounded-md text-[#474546]"
              href="/account"
              data-testid="nav-account-link"
            >
              <User className="w-6 h-6"/>
            </LocalizedClientLink>

            {/* Cart Button */}
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2 p-2 rounded-md "
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                  {/* <HiOutlineShoppingBag className="h-5 w-5" />
                  <span className="hidden md:inline">(0)</span> */}
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
        
        {/* Mobile search bar (hidden by default) */}
        <div className="md:hidden px-3 pb-4 hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              <HiOutlineSearch className="h-5 w-5" />
            </span>
          </div>
        </div>
      </header>

      {/* Second Section: Categories */}
      <div>
        <div className="content-container">
          {/* Desktop categories */}
          <div className="hidden md:flex items-center justify-start space-x-6 py-3">
            {product_categories?.slice(0, 6).map((category) => (
              <LocalizedClientLink
                key={category.id}
                className="hover:text-ui-fg-base font-normal py-1 px-2 rounded-md text-[#474546"
                href={`/categories/${category.handle}`}
                data-testid="category-link"
              >
                {category.name}
              </LocalizedClientLink>
            ))}
          </div>
          
        
        </div>
      </div>

      {/* Third Section: Informational Bar */}
      <div className="hidden md:block text-[#474546]">
        <div className="content-container">
          <div className="flex flex-col md:flex-row justify-between text-center py-3 gap-3 md:gap-0">
            <div className="flex-1 flex items-center justify-center gap-2">
              <HiShieldCheck className="h-5 w-5 text-green-600" />
              <p className="text-sm">
                <span className="font-semibold">0% Finance</span> Available
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <HiUsers className="h-5 w-5 text-purple-600" />
              <p className="text-sm">
                Over <span className="font-semibold">1,000,000</span> Happy Customers
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <HiStar className="h-5 w-5 text-yellow-500" />
              <p className="text-sm">
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
