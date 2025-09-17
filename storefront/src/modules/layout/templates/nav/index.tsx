// import { Suspense } from "react"

// import { listRegions } from "@lib/data/regions"
// import { StoreRegion } from "@medusajs/types"
// import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import CartButton from "@modules/layout/components/cart-button"
// import SideMenu from "@modules/layout/components/side-menu"
// import User from "@modules/common/icons/user"
// import { CiShoppingBasket, CiShoppingCart } from "react-icons/ci"
// import { BiSupport } from "react-icons/bi"

// export default async function Nav() {
//   const regions = await listRegions().then((regions: StoreRegion[]) => regions)

//   return (
//     <div className="sticky top-0 inset-x-0 z-50 group">
//       <header className="relative h-28 mx-auto border-b duration-200 bg-background border-ui-border-base">
//         <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
//           {/* <div className="flex-1 basis-0 h-full flex items-center"> */}
//           <div className="h-full items-center flex">
//             {/* <SideMenu regions={regions} /> */}
//             <LocalizedClientLink
//               href="/"
//               className="text-6xl font-extrabold hover:text-ui-fg-base uppercase text-[#474546]"
//               data-testid="nav-store-link"
//             >
//               DUSK
//             </LocalizedClientLink>
//           </div>
//           {/* </div> */}

//           {/* <div className="flex items-center h-full">
//             <LocalizedClientLink
//               href="/"
//               className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase text-primary"
//               data-testid="nav-store-link"
//             >
//               Medusa Store
//             </LocalizedClientLink>
//           </div> */}

//           <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
//             <div className="hidden small:flex items-center gap-x-6 h-full">
//               {/* {process.env.NEXT_PUBLIC_FEATURE_SEARCH_ENABLED && ( */}
//               <LocalizedClientLink
//                 className="hover:text-ui-fg-base"
//                 href="/search"
//                 scroll={false}
//                 data-testid="nav-search-link"
//               >
//                 <div className="flex items-center justify-center">
//                   <div className="relative w-full max-w-md">
//                     <input
//                       type="text"
//                       placeholder="Search"
//                       className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
//                     />
//                     <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-5 w-5"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                         stroke-width="2"
//                       >
//                         <path
//                           stroke-linecap="round"
//                           stroke-linejoin="round"
//                           d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
//                         />
//                       </svg>
//                     </span>
//                   </div>
//                 </div>
//               </LocalizedClientLink>
//               {/* )} */}

//               <LocalizedClientLink className="hover:text-ui-fg-base" href="/">
//                 <BiSupport className="w-6 h-6" />
//               </LocalizedClientLink>

//               <LocalizedClientLink
//                 className="hover:text-ui-fg-base"
//                 href="/account"
//                 data-testid="nav-account-link"
//               >
//                 <User className="w-6 h-6" />
//               </LocalizedClientLink>
//             </div>
//             <div className="flex items-center">
//               <Suspense
//                 fallback={
//                   <LocalizedClientLink
//                     className="hover:text-ui-fg-base flex gap-2"
//                     href="/cart"
//                     data-testid="nav-cart-link"
//                   >
//                     Cart (0)
//                   </LocalizedClientLink>
//                 }
//               >
//                 <CartButton />
//               </Suspense>
//               <CiShoppingCart className="w-6 h-6" />
//             </div>
//           </div>
//         </nav>
//       </header>
//     </div>
//   )
// }

import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import User from "@modules/common/icons/user"
import { BiSupport } from "react-icons/bi"
import { CiShoppingCart } from "react-icons/ci"
import { getCategoriesList } from "@lib/data/categories" // Import to fetch categories

export default async function Nav() {
  // Fetch regions and categories dynamically
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const { product_categories } = await getCategoriesList(0, 6) // Fetch the first 6 categories

  return (
    <div className="bg-background">
      {/* <div className="sticky top-0 inset-x-0 z-50 group"> */}
      <header className="relative h-28 mx-auto  ">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          {/* Logo and Top Icons */}
          <div className="h-full items-center flex justify-between w-full">
            {/* Logo */}
            <LocalizedClientLink
              href="/"
              className="text-6xl font-extrabold hover:text-ui-fg-base uppercase text-[#474546]"
              data-testid="nav-store-link"
            >
              DUSK
            </LocalizedClientLink>

            {/* Right-side icons (Search, Support, User, Cart) */}
            <div className="flex items-center space-x-8">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/search"
                scroll={false}
                data-testid="nav-search-link"
              >
                <div className="relative min-w-96 max-w-md">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
                      />
                    </svg>
                  </span>
                </div>
              </LocalizedClientLink>

              {/* Support Icon */}
              <LocalizedClientLink className="hover:text-ui-fg-base" href="/">
                <BiSupport className="w-6 h-6" />
              </LocalizedClientLink>

              {/* User Icon */}
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                <User className="w-6 h-6" />
              </LocalizedClientLink>

              {/* Cart Button */}
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base flex gap-2"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Cart (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
              <CiShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </nav>
      </header>

      {/* Categories Below the Logo */}
      <div className=" py-3">
        <div className="content-container">
          <ul className="flex space-x-6">
            {product_categories &&
              product_categories.length > 0 &&
              product_categories.slice(0, 6).map((category) => (
                <li key={category.id} className="text-small-regular">
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href={`/categories/${category.handle}`}
                    data-testid="category-link"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              ))}
          </ul>
        </div>
      </div>
      {/* Informational Bar Below Categories */}
      <div className="flex justify-between text-center space-x-4 py-4">
        <div className="flex-1">
          <p className="text-small-regular  ">
            <span className="font-bold">0% Finance</span> Available</p>
        </div>
        <div className="flex-1">
          <p className="text-small-regular ">
            Over <span className="font-bold">1,000,000</span> Happy Customers
          </p>
        </div>
        <div className="flex-1">
          <p className="text-small-regular">85,000+ <span className="font-bold">5 Star Reviews</span></p>
        </div>
      </div>
    </div>
  )
}
