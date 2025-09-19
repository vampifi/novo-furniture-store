import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text } from "@medusajs/ui"
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaPinterestP,
} from "react-icons/fa"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BackToTop from "@modules/layout/components/back-to-top"

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)

  return (
    <footer className="bg-[#474546] text-white relative">
      <div className="content-container px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-20">
          <div className="lg:row-span-2">
            <LocalizedClientLink
              href="/"
              className="text-3xl font-bold text-white hover:text-primary transition-colors duration-300 inline-block mb-6"
            >
              NOVO FURNITURE
            </LocalizedClientLink>
          </div>

          {product_categories && product_categories.length > 0 && (
            <div className="lg:mt-10">
              <h3 className="text-lg font-medium text-white mb-5">Shop Categories</h3>
              <ul className="space-y-3 text-lg text-gray-300">
                {product_categories.slice(0, 6).map((c) => {
                  if (c.parent_category) return null
                  return (
                    <li key={c.id}>
                      <LocalizedClientLink
                        href={`/categories/${c.handle}`}
                        className="hover:text-white transition-colors duration-300"
                      >
                        {c.name}
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

         
          {collections && collections.length > 0 && (
            <div className="lg:mt-10">
              <h3 className="text-lg font-medium text-white mb-5">Collections</h3>
              <ul className="space-y-3 text-lg text-gray-300">
                {collections.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink
                      href={`/collections/${c.handle}`}
                      className="hover:text-white transition-colors duration-300"
                    >
                      {c.title}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="lg:mt-10">
            <h3 className="text-lg font-medium text-white mb-5">Support</h3>
            <ul className="space-y-3 text-lg text-gray-300">
              {[
                { name: "Contact Us", href: "/contact" },
                { name: "Shipping Info", href: "/shipping" },
                { name: "Returns & Exchanges", href: "/returns" },
                { name: "FAQ", href: "/faq" },
                { name: "Warranty", href: "/warranty" },
                { name: "Track Order", href: "/track-order" },
              ].map((item, i) => (
                <li key={i}>
                  <LocalizedClientLink
                    href={item.href}
                    className="hover:text-white transition-colors duration-300"
                  >
                    {item.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          
          <div className="lg:mt-10">
            <h3 className="text-lg font-medium text-white mb-5">Company</h3>
            <ul className="space-y-3 text-lg text-gray-300">
              {[
                { name: "About Us", href: "/about" },
                { name: "Our Story", href: "/story" },
                { name: "Sustainability", href: "/sustainability" },
                { name: "Careers", href: "/careers" },
                { name: "Press", href: "/press" },
                { name: "Blog", href: "/blog" },
              ].map((item, i) => (
                <li key={i}>
                  <LocalizedClientLink
                    href={item.href}
                    className="hover:text-white transition-colors duration-300"
                  >
                    {item.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

         
          <div className="lg:mt-10">
            <p className="text-lg font-medium text-white mb-4">Stay in touch</p>
            <div className="flex gap-4">
              {[
                {
                  icon: FaFacebookF,
                  label: "Facebook",
                  href: "https://facebook.com",
                },
                {
                  icon: FaInstagram,
                  label: "Instagram",
                  href: "https://instagram.com",
                },
                { icon: FaTiktok, label: "TikTok", href: "https://tiktok.com" },
                {
                  icon: FaPinterestP,
                  label: "Pinterest",
                  href: "https://pinterest.com",
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

       
        <div className="border-t border-gray-600 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400">
          <Text>
            © {new Date().getFullYear()} Nova Furniture. All rights reserved.
          </Text>

          {/* Payment Methods */}
          <div className="flex items-center justify-stretch gap-4">
            {["Apple Pay", "Google Pay", "Mastercard", "Visa"].map(
              (method) => (
                <div
                  key={method}
                  className="w-20 h-9 bg-gray-800 rounded-md flex items-center justify-center border border-gray-700"
                >
                  <span className="text-xs text-gray-400 font-medium">{method}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

     
      <BackToTop />
    </footer>
  )
}