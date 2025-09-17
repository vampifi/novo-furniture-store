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


// [#474546]

// import { getCategoriesList } from "@lib/data/categories"
// import { getCollectionsList } from "@lib/data/collections"
// import { Text, clx } from "@medusajs/ui"

// import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import MedusaCTA from "@modules/layout/components/medusa-cta"

// export default async function Footer() {
//   const { collections } = await getCollectionsList(0, 6)
//   const { product_categories } = await getCategoriesList(0, 6)

//   return (
//     <footer className="bg-[#474546] py-16 text-white">
//       <div className="content-container flex flex-col w-full">
//         {/* Main Footer Content */}
//         <div className="flex flex-col gap-y-12 md:flex-row items-start justify-between py-16">
//           {/* Logo and Branding */}
//           <div className="flex flex-col items-start mb-8 md:mb-0">
//             <LocalizedClientLink
//               href="/"
//               className="text-4xl font-bold text-white uppercase hover:text-primary mb-6"
//             >
//               NOVA FURNITURE
//             </LocalizedClientLink>
//             <Text className="text-sm text-muted mb-4">
//               Your trusted furniture store for modern living. Offering quality and style in every piece.
//             </Text>
//           </div>

//           {/* Links Section */}
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
//             {/* Categories */}
//             {product_categories && product_categories.length > 0 && (
//               <div className="flex flex-col gap-y-4">
//                 <span className="text-lg font-semibold mb-4">Categories</span>
//                 <ul className="space-y-3">
//                   {product_categories.slice(0, 6).map((c) => {
//                     if (c.parent_category) return null

//                     const children =
//                       c.category_children?.map((child) => ({
//                         name: child.name,
//                         handle: child.handle,
//                         id: child.id,
//                       })) || null

//                     return (
//                       <li key={c.id} className="text-sm text-muted">
//                         <LocalizedClientLink
//                           className="hover:text-primary transition-all"
//                           href={`/categories/${c.handle}`}
//                         >
//                           {c.name}
//                         </LocalizedClientLink>
//                         {children && (
//                           <ul className="ml-4 space-y-2">
//                             {children.map((child) => (
//                               <li key={child.id}>
//                                 <LocalizedClientLink
//                                   className="hover:text-primary text-sm transition-all"
//                                   href={`/categories/${child.handle}`}
//                                 >
//                                   {child.name}
//                                 </LocalizedClientLink>
//                               </li>
//                             ))}
//                           </ul>
//                         )}
//                       </li>
//                     )
//                   })}
//                 </ul>
//               </div>
//             )}

//             {/* Collections */}
//             {collections && collections.length > 0 && (
//               <div className="flex flex-col gap-y-4">
//                 <span className="text-lg font-semibold mb-4">Collections</span>
//                 <ul className="space-y-3">
//                   {collections.slice(0, 6).map((c) => (
//                     <li key={c.id} className="text-sm text-muted">
//                       <LocalizedClientLink
//                         className="hover:text-primary transition-all"
//                         href={`/collections/${c.handle}`}
//                       >
//                         {c.title}
//                       </LocalizedClientLink>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Medusa Links */}
//             <div className="flex flex-col gap-y-4">
//               <span className="text-lg font-semibold mb-4">Medusa</span>
//               <ul className="space-y-3 text-sm text-muted">
//                 <li>
//                   <a
//                     href="https://github.com/medusajs"
//                     target="_blank"
//                     rel="noreferrer"
//                     className="hover:text-primary transition-all"
//                   >
//                     GitHub
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="https://docs.medusajs.com"
//                     target="_blank"
//                     rel="noreferrer"
//                     className="hover:text-primary transition-all"
//                   >
//                     Documentation
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="https://github.com/medusajs/nextjs-starter-medusa"
//                     target="_blank"
//                     rel="noreferrer"
//                     className="hover:text-primary transition-all"
//                   >
//                     Source code
//                   </a>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>

//         {/* Footer Bottom Content */}
//         <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted py-6">
//           {/* Copyright Text */}
//           <Text className="text-center md:text-left text-white">
//             © {new Date().getFullYear()} Nova Furniture. All rights reserved.
//           </Text>

//           {/* Social Media Icons */}
//           <div className="flex space-x-6 mt-6 md:mt-0">
//             <a href="#" className="hover:text-primary transition-all">
//               <i className="fab fa-facebook-f"></i>
//             </a>
//             <a href="#" className="hover:text-primary transition-all">
//               <i className="fab fa-instagram"></i>
//             </a>
//             <a href="#" className="hover:text-primary transition-all">
//               <i className="fab fa-twitter"></i>
//             </a>
//             <a href="#" className="hover:text-primary transition-all">
//               <i className="fab fa-pinterest"></i>
//             </a>
//           </div>

//           {/* Payment Icons */}
//           <div className="flex space-x-6 mt-6 md:mt-0">
//             <img src="/images/apple-pay.png" alt="Apple Pay" className="h-8" />
//             <img src="/images/google-pay.png" alt="Google Pay" className="h-8" />
//             <img src="/images/credit-card.png" alt="Credit Card" className="h-8" />
//             <img src="/images/paypal.png" alt="PayPal" className="h-8" />
//           </div>
//         </div>

//         {/* Back to Top Button */}
//         <div className="text-center mt-6">
//           <a href="#top" className="text-sm hover:text-primary transition-all">
//             Back to Top
//           </a>
//         </div>
//       </div>
//     </footer>
//   )
// }

import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)

  return (
    <footer className="bg-[#474546] py-16 text-white">
      <div className="content-container flex flex-col w-full">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-y-12 md:flex-row items-start justify-between py-16">
          {/* Logo and Branding */}
          <div className="flex flex-col items-start mb-8 md:mb-0">
            <LocalizedClientLink
              href="/"
              className="text-4xl font-bold text-white uppercase hover:text-primary mb-6"
            >
              NOVA FURNITURE
            </LocalizedClientLink>
            <Text className="text-sm text-muted mb-4">
              Your trusted furniture store for modern living. Offering quality and style in every piece.
            </Text>
          </div>

          {/* 6 Column Footer Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-12">
            {/* Categories */}
            {product_categories && product_categories.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <span className="text-lg font-semibold mb-4">Categories</span>
                <ul className="space-y-3">
                  {product_categories.slice(0, 6).map((c) => {
                    if (c.parent_category) return null

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li key={c.id} className="text-sm text-muted">
                        <LocalizedClientLink
                          className="hover:text-primary transition-all"
                          href={`/categories/${c.handle}`}
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="ml-4 space-y-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <LocalizedClientLink
                                  className="hover:text-primary text-sm transition-all"
                                  href={`/categories/${child.handle}`}
                                >
                                  {child.name}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Collections */}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <span className="text-lg font-semibold mb-4">Collections</span>
                <ul className="space-y-3">
                  {collections.slice(0, 6).map((c) => (
                    <li key={c.id} className="text-sm text-muted">
                      <LocalizedClientLink
                        className="hover:text-primary transition-all"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medusa Links */}
            <div className="flex flex-col gap-y-4">
              <span className="text-lg font-semibold mb-4">Medusa</span>
              <ul className="space-y-3 text-sm text-muted">
                <li>
                  <a
                    href="https://github.com/medusajs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary transition-all"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.medusajs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary transition-all"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/medusajs/nextjs-starter-medusa"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary transition-all"
                  >
                    Source code
                  </a>
                </li>
              </ul>
            </div>

            {/* Other Links (About Us, Contact, etc.) */}
            <div className="flex flex-col gap-y-4">
              <span className="text-lg font-semibold mb-4">Quick Links</span>
              <ul className="space-y-3 text-sm text-muted">
                <li>
                  <LocalizedClientLink
                    className="hover:text-primary transition-all"
                    href="/about"
                  >
                    About Us
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-primary transition-all"
                    href="/contact"
                  >
                    Contact
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-primary transition-all"
                    href="/faq"
                  >
                    FAQs
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

         

            {/* Social Media */}
            <div className="flex flex-col gap-y-4">
              <span className="text-lg font-semibold mb-4">Follow Us</span>
              <div className="flex space-x-6 mt-4">
                <a href="#" className="hover:text-primary transition-all">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="hover:text-primary transition-all">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="hover:text-primary transition-all">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="hover:text-primary transition-all">
                  <i className="fab fa-pinterest"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Content */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted py-6">
          {/* Copyright Text */}
          <Text className="text-center md:text-left text-white">
            © {new Date().getFullYear()} Nova Furniture. All rights reserved.
          </Text>

          {/* Payment Icons */}
          <div className="flex space-x-6 mt-6 md:mt-0">
            <img src="/images/apple-pay.png" alt="Apple Pay" className="h-8" />
            <img src="/images/google-pay.png" alt="Google Pay" className="h-8" />
            <img src="/images/credit-card.png" alt="Credit Card" className="h-8" />
            <img src="/images/paypal.png" alt="PayPal" className="h-8" />
          </div>
        </div>

        {/* Back to Top Button */}
        <div className="text-center mt-6">
          <a
            href="#top"
            className="text-sm hover:text-primary transition-all fixed bottom-10 right-10 bg-primary text-white rounded-full p-3"
          >
            ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
