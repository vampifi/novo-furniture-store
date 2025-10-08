import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const hasItems = Boolean(cart?.items?.length)

  return (
    <div className="bg-[#F8F3EE] py-12 sm:py-20">
      <div
        className="content-container text-[#443B33]"
        data-testid="cart-container"
      >
        <div className="mb-10 flex flex-col gap-2 sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8C7B6F]">
            {hasItems ? "Your cart" : "Nothing in your cart yet"}
          </span>
          <Heading
            level="h1"
            className="text-[28px] leading-[38px] font-semibold uppercase tracking-[0.1em] text-[#221C18] sm:text-[40px] sm:leading-[52px]"
          >
            {hasItems ? "Review your selections" : "Let's find something beautiful"}
          </Heading>
        </div>

        {hasItems ? (
          <div className="grid grid-cols-1 gap-10 small:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-6">
              {!customer && <SignInPrompt />}
              <ItemsTemplate items={cart?.items} />
            </div>

            <aside className="small:sticky small:top-24">
              {cart && cart.region && <Summary cart={cart as any} />}
            </aside>
          </div>
        ) : (
          <EmptyCartMessage />
        )}
      </div>
    </div>
  )
}

export default CartTemplate
