import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="flex flex-col gap-6 rounded-[32px] border border-[#E8DCD2] bg-white/95 px-8 py-16 text-[#443B33] shadow-[0px_24px_48px_rgba(68,59,51,0.08)] sm:px-12"
      data-testid="empty-cart-message"
    >
      <span className="uppercase text-[11px] font-semibold tracking-[0.28em] text-[#B7A598]">
        Your cart
      </span>
      <Heading level="h1" className="text-[32px] leading-[42px] font-semibold text-[#221C18] sm:text-[40px] sm:leading-[52px]">
        It feels a little light in here
      </Heading>
      <Text className="max-w-xl text-sm text-[#6A5C52] sm:text-base">
        You don&apos;t have anything in your cart yet. Browse the store and add your favorites to see them here.
      </Text>
      <div>
        <InteractiveLink href="/store">Explore products</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
