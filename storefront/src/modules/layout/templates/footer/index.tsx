import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text } from "@medusajs/ui"
import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaTiktok,
} from "react-icons/fa"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BackToTop from "@modules/layout/components/back-to-top"

type FooterLink = {
  name: string
  href: string
}

type FooterColumnProps = {
  title: string
  links: FooterLink[]
}

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)

  const rootCategories = (product_categories ?? []).filter(
    (category) => !category.parent_category
  )

  const customerCareLinks: FooterLink[] = [
    { name: "Track My Order", href: "/track-order" },
    { name: "Help & FAQs", href: "/content/faqs" },
    { name: "Delivery", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Warranty", href: "/warranty" },
  ]

  const websiteLinks: FooterLink[] = [
    { name: "About Us", href: "/content/about" },
    { name: "Blog", href: "/blog" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Cookies", href: "/cookies" },
  ]

  const categoryLinks: FooterLink[] = rootCategories.slice(0, 6).map(
    (category) => ({
      name: category.name,
      href: `/categories/${category.handle}`,
    })
  )

  const collectionLinks: FooterLink[] = (collections ?? [])
    .slice(0, 6)
    .map((collection) => ({
      name: collection.title,
      href: `/collections/${collection.handle}`,
    }))

  const footerColumns: FooterColumnProps[] = [
    { title: "Customer Care", links: customerCareLinks },
    { title: "Our Website", links: websiteLinks },
    { title: "Categories", links: categoryLinks },
    { title: "Collections", links: collectionLinks },
  ].filter((column) => column.links.length > 0)

  const socialLinks = [
    { icon: FaFacebookF, label: "Facebook", href: "https://facebook.com" },
    { icon: FaInstagram, label: "Instagram", href: "https://instagram.com" },
    { icon: FaTiktok, label: "TikTok", href: "https://tiktok.com" },
    { icon: FaPinterestP, label: "Pinterest", href: "https://pinterest.com" },
  ] as const

  const paymentMethods = [
    { label: "Apple Pay", short: "Apple Pay" },
    { label: "Google Pay", short: "G Pay" },
    { label: "Mastercard", short: "Mastercard" },
    { label: "Visa", short: "Visa" },
  ]

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-[#3f3c3d] text-white">
      <div className="content-container px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(180px,1fr)_repeat(5,minmax(140px,1fr))] lg:gap-16">
          <div>
            <LocalizedClientLink
              href="/"
              className="text-3xl font-semibold tracking-[0.25em]"
            >
              NOVO
            </LocalizedClientLink>
          </div>

          {footerColumns.map((column) => (
            <FooterColumn
              key={column.title}
              title={column.title}
              links={column.links}
            />
          ))}

          <div>
            <p
              id="footer-social-heading"
              className="text-sm font-semibold uppercase tracking-[0.28em]"
            >
              Stay in Touch
            </p>
            <ul
              className="mt-5 flex items-center gap-4 text-lg"
              role="list"
              aria-labelledby="footer-social-heading"
            >
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="transition-colors hover:text-secondary"
                  >
                    <social.icon aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <Text as="p">© {currentYear} Novo Furniture. All rights reserved.</Text>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide">
            <span className="text-white/60">Pay securely with</span>
            <ul className="flex flex-wrap items-center gap-2" role="list">
              {paymentMethods.map((method) => (
                <li key={method.label}>
                  <span
                    className="inline-flex h-8 min-w-[70px] items-center justify-center rounded-md bg-white/10 px-3 text-white"
                    aria-label={method.label}
                  >
                    {method.short}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section
          aria-labelledby="footer-disclaimer"
          className="mt-6 text-[0.68rem] leading-relaxed text-white/50"
        >
          <p id="footer-disclaimer">
            Interest free credit agreements provided by third-party providers are
            not regulated by the Financial Conduct Authority and may not be
            covered by the Financial Ombudsman Service. Your eligibility is
            subject to status and terms. Novo Furniture (Retail) Ltd is
            registered in England & Wales with company number 00000000 and
            registered office at 1 Modern Way, London, EC2N 4AA.
          </p>
        </section>
      </div>

      <BackToTop />
    </footer>
  )
}

const FooterColumn = ({ title, links }: FooterColumnProps) => {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.28em]">
        {title}
      </p>
      <nav aria-label={title} className="mt-5">
        <ul className="space-y-3 text-base text-white/80" role="list">
          {links.map((item) => (
            <li key={item.name}>
              <LocalizedClientLink
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
