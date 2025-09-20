import CartDropdown from "../cart-dropdown"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart.items, cart.region_id!)
    cart.items = enrichedItems
  }

  return cart
}

interface CartButtonProps {
  variant?: "default" | "mobile"
}

export default async function CartButton({ variant = "default" }: CartButtonProps = {}) {
  const cart = await fetchCart()

  return <CartDropdown cart={cart} variant={variant} />
}
