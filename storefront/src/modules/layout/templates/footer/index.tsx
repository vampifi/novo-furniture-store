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
            
//           </div>

//           {/* 6 Column Footer Layout */}
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-12">
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

//             {/* Other Links (About Us, Contact, etc.) */}
//             <div className="flex flex-col gap-y-4">
//               <span className="text-lg font-semibold mb-4">Quick Links</span>
//               <ul className="space-y-3 text-sm text-muted">
//                 <li>
//                   <LocalizedClientLink
//                     className="hover:text-primary transition-all"
//                     href="/about"
//                   >
//                     About Us
//                   </LocalizedClientLink>
//                 </li>
//                 <li>
//                   <LocalizedClientLink
//                     className="hover:text-primary transition-all"
//                     href="/contact"
//                   >
//                     Contact
//                   </LocalizedClientLink>
//                 </li>
//                 <li>
//                   <LocalizedClientLink
//                     className="hover:text-primary transition-all"
//                     href="/faq"
//                   >
//                     FAQs
//                   </LocalizedClientLink>
//                 </li>
//               </ul>
//             </div>

         

//             {/* Social Media */}
//             <div className="flex flex-col gap-y-4">
//               <span className="text-lg font-semibold mb-4">Follow Us</span>
//               <div className="flex space-x-6 mt-4">
//                 <a href="#" className="hover:text-primary transition-all">
//                   <i className="fab fa-facebook-f"></i>
//                 </a>
//                 <a href="#" className="hover:text-primary transition-all">
//                   <i className="fab fa-instagram"></i>
//                 </a>
//                 <a href="#" className="hover:text-primary transition-all">
//                   <i className="fab fa-twitter"></i>
//                 </a>
//                 <a href="#" className="hover:text-primary transition-all">
//                   <i className="fab fa-pinterest"></i>
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer Bottom Content */}
//         <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted py-6">
//           {/* Copyright Text */}
//           <Text className="text-center md:text-left text-white">
//             © {new Date().getFullYear()} Nova Furniture. All rights reserved.
//           </Text>

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
//           <a
//             href="#top"
//             className="text-sm hover:text-primary transition-all fixed bottom-10 right-10 bg-primary text-white rounded-full p-3"
//           >
//             ↑
//           </a>
//         </div>
//       </div>
//     </footer>
//   )
// }



import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BackToTop from "@modules/layout/components/back-to-top"

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/10 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="content-container relative z-10 flex flex-col w-full">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-y-16 lg:gap-y-20 py-16 lg:py-24 px-6">
          {/* Premium Brand Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
            {/* Brand Identity */}
            <div className="lg:col-span-1 flex flex-col items-start">
              <LocalizedClientLink
                href="/"
                className="text-3xl md:text-4xl font-bold text-white hover:text-primary transition-all duration-500 mb-6 group"
              >
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary-light transition-all duration-500">
                  NOVA FURNITURE
                </span>
              </LocalizedClientLink>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 max-w-md">
                Crafting exceptional living spaces with premium furniture that combines elegance, comfort, and timeless design.
              </p>
              
              {/* Trust Badges */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Premium Quality
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  Free Shipping
                </div>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/30 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Join the Nova Family
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Be the first to receive exclusive offers, design tips, and new collection launches.
                    </p>
                  </div>
                  <form action="/subscribe" method="POST" className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        className="w-full px-6 py-4 rounded-xl bg-gray-800/50 border border-gray-600/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                        required
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <button 
                      type="submit"
                      className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 font-semibold shadow-lg hover:shadow-primary/25 hover:translate-y-[-2px]"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Categories */}
            {product_categories && product_categories.length > 0 && (
              <div className="flex flex-col gap-y-5">
                <span className="text-lg font-semibold text-white flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  Shop Categories
                </span>
                <ul className="space-y-4">
                  {product_categories.slice(0, 6).map((c) => {
                    if (c.parent_category) return null
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="text-gray-400 hover:text-white transition-all duration-300 text-sm flex items-center gap-3 group py-2"
                          href={`/categories/${c.handle}`}
                        >
                          <div className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary group-hover:scale-125 transition-all duration-300"></div>
                          <span className="group-hover:translate-x-2 transition-transform duration-300">
                            {c.name}
                          </span>
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Collections */}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-5">
                <span className="text-lg font-semibold text-white flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  Collections
                </span>
                <ul className="space-y-4">
                  {collections.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="text-gray-400 hover:text-white transition-all duration-300 text-sm flex items-center gap-3 group py-2"
                        href={`/collections/${c.handle}`}
                      >
                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary group-hover:scale-125 transition-all duration-300"></div>
                        <span className="group-hover:translate-x-2 transition-transform duration-300">
                          {c.title}
                        </span>
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Customer Support */}
            <div className="flex flex-col gap-y-5">
              <span className="text-lg font-semibold text-white flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Support
              </span>
              <ul className="space-y-4 text-sm">
                {[
                  { name: 'Contact Us', href: '/contact' },
                  { name: 'Shipping Info', href: '/shipping' },
                  { name: 'Returns & Exchanges', href: '/returns' },
                  { name: 'FAQ', href: '/faq' },
                  { name: 'Warranty', href: '/warranty' },
                  { name: 'Track Order', href: '/track-order' }
                ].map((item, index) => (
                  <li key={index}>
                    <LocalizedClientLink
                      className="text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-3 group py-2"
                      href={item.href}
                    >
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary group-hover:scale-125 transition-all duration-300"></div>
                      <span className="group-hover:translate-x-2 transition-transform duration-300">
                        {item.name}
                      </span>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Info */}
            <div className="flex flex-col gap-y-5">
              <span className="text-lg font-semibold text-white flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Company
              </span>
              <ul className="space-y-4 text-sm">
                {[
                  { name: 'About Us', href: '/about' },
                  { name: 'Our Story', href: '/story' },
                  { name: 'Sustainability', href: '/sustainability' },
                  { name: 'Careers', href: '/careers' },
                  { name: 'Press', href: '/press' },
                  { name: 'Blog', href: '/blog' }
                ].map((item, index) => (
                  <li key={index}>
                    <LocalizedClientLink
                      className="text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-3 group py-2"
                      href={item.href}
                    >
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary group-hover:scale-125 transition-all duration-300"></div>
                      <span className="group-hover:translate-x-2 transition-transform duration-300">
                        {item.name}
                      </span>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Social */}
            <div className="flex flex-col gap-y-5">
              <span className="text-lg font-semibold text-white flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                Connect
              </span>
              
              {/* Contact Info */}
              <div className="space-y-4 text-sm text-gray-400 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 mt-0.5 text-primary">📍</div>
                  <p>123 Design District Ave<br />Furniture City, FC 12345</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 text-primary">📞</div>
                  <p>+1 (555) 123-NOVA</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 text-primary">✉️</div>
                  <p>hello@novafurniture.com</p>
                </div>
              </div>

              {/* Social Media */}
              <div className="flex gap-4">
                {[
                  { icon: '📘', label: 'Facebook', href: 'https://facebook.com' },
                  { icon: '📷', label: 'Instagram', href: 'https://instagram.com' },
                  { icon: '🐦', label: 'Twitter', href: 'https://twitter.com' },
                  { icon: '📌', label: 'Pinterest', href: 'https://pinterest.com' },
                  { icon: '🎥', label: 'YouTube', href: 'https://youtube.com' }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center text-lg transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110 border border-gray-700/30 hover:border-primary/30"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800/50 mt-8 pt-12 pb-16 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <Text className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Nova Furniture. All rights reserved.
              </Text>
              <div className="flex gap-6 mt-3 text-xs text-gray-600">
                <LocalizedClientLink href="/privacy" className="hover:text-gray-400 transition-colors">
                  Privacy Policy
                </LocalizedClientLink>
                <LocalizedClientLink href="/terms" className="hover:text-gray-400 transition-colors">
                  Terms of Service
                </LocalizedClientLink>
                <LocalizedClientLink href="/cookies" className="hover:text-gray-400 transition-colors">
                  Cookie Policy
                </LocalizedClientLink>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-4">
              {['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay', 'Google Pay'].map((method) => (
                <div
                  key={method}
                  className="w-12 h-8 bg-gray-800/50 backdrop-blur-sm rounded-md flex items-center justify-center border border-gray-700/30"
                >
                  <span className="text-xs font-medium text-gray-400">{method}</span>
                </div>
              ))}
            </div>

            {/* Trust Seals */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl">⭐</div>
                <div className="text-xs text-gray-500 mt-1">5-Star Rated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">🚚</div>
                <div className="text-xs text-gray-500 mt-1">Free Shipping</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">🔒</div>
                <div className="text-xs text-gray-500 mt-1">Secure Checkout</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </footer>
  )
}