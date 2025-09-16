// import { getCategoriesList } from "@lib/data/categories"
// import { getCollectionsList } from "@lib/data/collections"
// import { Text, clx } from "@medusajs/ui"

// import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import MedusaCTA from "@modules/layout/components/medusa-cta"

// export default async function Footer() {
//   const { collections } = await getCollectionsList(0, 6)
//   const { product_categories } = await getCategoriesList(0, 6)

//   return (
//     <footer className="border-t border-ui-border-base w-full">
//       <div className="content-container flex flex-col w-full">
//         <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-40">
//           <div>
//             <LocalizedClientLink
//               href="/"
//               className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase text-primary"
//             >
//               NOVA FURNITURE
//             </LocalizedClientLink>
//           </div>
//           <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
//             {product_categories && product_categories?.length > 0 && (
//               <div className="flex flex-col gap-y-2">
//                 <span className="txt-small-plus txt-ui-fg-base">
//                   Categories
//                 </span>
//                 <ul
//                   className="grid grid-cols-1 gap-2"
//                   data-testid="footer-categories"
//                 >
//                   {product_categories?.slice(0, 6).map((c) => {
//                     if (c.parent_category) {
//                       return
//                     }

//                     const children =
//                       c.category_children?.map((child) => ({
//                         name: child.name,
//                         handle: child.handle,
//                         id: child.id,
//                       })) || null

//                     return (
//                       <li
//                         className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
//                         key={c.id}
//                       >
//                         <LocalizedClientLink
//                           className={clx(
//                             "hover:text-ui-fg-base",
//                             children && "txt-small-plus"
//                           )}
//                           href={`/categories/${c.handle}`}
//                           data-testid="category-link"
//                         >
//                           {c.name}
//                         </LocalizedClientLink>
//                         {children && (
//                           <ul className="grid grid-cols-1 ml-3 gap-2">
//                             {children &&
//                               children.map((child) => (
//                                 <li key={child.id}>
//                                   <LocalizedClientLink
//                                     className="hover:text-ui-fg-base"
//                                     href={`/categories/${child.handle}`}
//                                     data-testid="category-link"
//                                   >
//                                     {child.name}
//                                   </LocalizedClientLink>
//                                 </li>
//                               ))}
//                           </ul>
//                         )}
//                       </li>
//                     )
//                   })}
//                 </ul>
//               </div>
//             )}
//             {collections && collections.length > 0 && (
//               <div className="flex flex-col gap-y-2">
//                 <span className="txt-small-plus txt-ui-fg-base">
//                   Collections
//                 </span>
//                 <ul
//                   className={clx(
//                     "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
//                     {
//                       "grid-cols-2": (collections?.length || 0) > 3,
//                     }
//                   )}
//                 >
//                   {collections?.slice(0, 6).map((c) => (
//                     <li key={c.id}>
//                       <LocalizedClientLink
//                         className="hover:text-ui-fg-base"
//                         href={`/collections/${c.handle}`}
//                       >
//                         {c.title}
//                       </LocalizedClientLink>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//             <div className="flex flex-col gap-y-2">
//               <span className="txt-small-plus txt-ui-fg-base">Medusa</span>
//               <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
//                 <li>
//                   <a
//                     href="https://github.com/medusajs"
//                     target="_blank"
//                     rel="noreferrer"
//                     className="hover:text-ui-fg-base"
//                   >
//                     GitHub
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="https://docs.medusajs.com"
//                     target="_blank"
//                     rel="noreferrer"
//                     className="hover:text-ui-fg-base"
//                   >
//                     Documentation
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="https://github.com/medusajs/nextjs-starter-medusa"
//                     target="_blank"
//                     rel="noreferrer"
//                     className="hover:text-ui-fg-base"
//                   >
//                     Source code
//                   </a>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>
//         <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
//           <Text className="txt-compact-small">
//             © {new Date().getFullYear()} Nova Furniture. All rights reserved.
//           </Text>
//           <MedusaCTA />
//         </div>
//       </div>
//     </footer>
//   )
// }


import { getCategoriesList } from "@lib/data/categories";
import { getCollectionsList } from "@lib/data/collections";
import { Text, clx } from "@medusajs/ui";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import MedusaCTA from "@modules/layout/components/medusa-cta";

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6);
  const { product_categories } = await getCategoriesList(0, 6);

  return (
    <footer className="border-t border-ui-border-base w-full bg-[#474546]">
      <div className="content-container flex flex-col w-full">
        {/* Footer Top */}
        <div className="flex flex-col gap-y-6 sm:flex-row items-start justify-between py-16">
          {/* Logo Section */}
          <div>
            <LocalizedClientLink
              href="/"
              className="text-xl text-white font-bold uppercase hover:text-primary"
            >
              Dusk
            </LocalizedClientLink>
          </div>

          {/* Footer Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 sm:gap-x-16">
            {/* Dusk Style */}
            <div className="flex flex-col gap-y-2 text-white">
              <span className="font-semibold">Dusk Style</span>
              <ul className="space-y-2">
                <li><LocalizedClientLink href="/about-us">About Us</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/inspiration">Inspiration</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/blog">Blog</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/buying-guides">Buying Guides</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/best-sellers">Best Sellers</LocalizedClientLink></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div className="flex flex-col gap-y-2 text-white">
              <span className="font-semibold">Customer Care</span>
              <ul className="space-y-2">
                <li><LocalizedClientLink href="/track-my-order">Track My Order</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/help-faqs">Help & FAQs</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/delivery">Delivery</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/returns">Returns</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/rewards">MyDusk Rewards</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/sleep-trial">100-Night Sleep Trial</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/will-it-fit">Will It Fit?</LocalizedClientLink></li>
              </ul>
            </div>

            {/* Our Website */}
            <div className="flex flex-col gap-y-2 text-white">
              <span className="font-semibold">Our Website</span>
              <ul className="space-y-2">
                <li><LocalizedClientLink href="/terms-and-conditions">Terms & Conditions</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/privacy-policy">Privacy Policy</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/klarna">Klarna</LocalizedClientLink></li>
              </ul>
            </div>

            {/* Best Sellers */}
            <div className="flex flex-col gap-y-2 text-white">
              <span className="font-semibold">Best Sellers</span>
              <ul className="space-y-2">
                <li><LocalizedClientLink href="/luxury-bedding">Luxury Bedding</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/beds">Beds</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/ottoman-beds">Ottoman Beds</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/mattresses">Mattresses</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/sofas">Sofas</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/corner-sofas">Corner Sofas</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/dining-tables">Dining Tables</LocalizedClientLink></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex w-full justify-between items-center py-8 text-sm text-gray-400">
          {/* Back to Top Button */}
          <button className="text-white hover:text-primary">
            Back to Top
          </button>

          {/* Social Media & Payment Methods */}
          <div className="flex items-center gap-4">
            {/* Social Media Icons */}
            <div className="flex gap-3">
              <LocalizedClientLink href="https://www.instagram.com" target="_blank">
                <img src="/images/instagram-icon.png" alt="Instagram" className="w-6 h-6" />
              </LocalizedClientLink>
              <LocalizedClientLink href="https://www.tiktok.com" target="_blank">
                <img src="/images/tiktok-icon.png" alt="TikTok" className="w-6 h-6" />
              </LocalizedClientLink>
              <LocalizedClientLink href="https://www.pinterest.com" target="_blank">
                <img src="/images/pinterest-icon.png" alt="Pinterest" className="w-6 h-6" />
              </LocalizedClientLink>
            </div>

            {/* Payment Methods */}
            <div className="flex gap-4">
              <img src="/images/apple-pay-icon.png" alt="Apple Pay" className="w-8 h-8" />
              <img src="/images/google-pay-icon.png" alt="Google Pay" className="w-8 h-8" />
              <img src="/images/paypal-icon.png" alt="PayPal" className="w-8 h-8" />
              <img src="/images/visa-icon.png" alt="Visa" className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="flex justify-center items-center py-4 text-white text-sm">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Dusk. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
}
