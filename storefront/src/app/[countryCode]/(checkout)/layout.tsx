import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-[#F8F3EE] text-[#443B33] small:min-h-screen">
      <div className="h-16 border-b border-[#E8DCD2] bg-[#F3EAE2]/80 backdrop-blur">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex basis-0 flex-1 items-center gap-x-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8C7B6F] transition hover:text-[#443B33]"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="text-base font-semibold uppercase tracking-[0.32em] text-[#221C18] transition hover:text-[#2E261F]"
            data-testid="store-link"
          >
            NOVO Store
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="flex w-full items-center justify-center py-6">
      </div>
    </div>
  )
}
