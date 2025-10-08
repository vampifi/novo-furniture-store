"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Spinner from "@modules/common/icons/spinner"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useFormState } from "react-dom"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useFormState(setAddresses, null)

  return (
    <div className="rounded-[28px] border border-[#E8DCD2] bg-white px-5 py-6 text-[#443B33] shadow-[0px_20px_40px_rgba(68,59,51,0.08)] sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EDE1D8] pb-4">
        <Heading
          level="h2"
          className="flex items-center gap-2 text-[20px] font-semibold uppercase tracking-[0.12em] text-[#221C18]"
        >
          Shipping address
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F] transition hover:text-[#443B33]"
              data-testid="edit-address-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction} className="pt-4">
          <div className="flex flex-col gap-6">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div className="flex flex-col gap-4">
                <Heading
                  level="h3"
                  className="text-[18px] font-semibold uppercase tracking-[0.12em] text-[#221C18]"
                >
                  Billing address
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton
              className="mt-2 h-12 w-full rounded-full bg-[#221C18] text-sm font-semibold uppercase tracking-[0.16em] text-[#EFE4DC] transition hover:bg-[#2E261F]"
              data-testid="submit-address-button"
            >
              Continue to delivery
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div className="pt-4">
          {cart && cart.shipping_address ? (
            <div className="grid gap-6 text-sm text-[#6A5C52] sm:grid-cols-3">
              <div className="flex flex-col gap-1" data-testid="shipping-address-summary">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Shipping
                </Text>
                <Text>{cart.shipping_address.first_name} {cart.shipping_address.last_name}</Text>
                <Text>
                  {cart.shipping_address.address_1}
                  {cart.shipping_address.address_2 ? ` ${cart.shipping_address.address_2}` : ""}
                </Text>
                <Text>
                  {cart.shipping_address.postal_code}, {cart.shipping_address.city}
                </Text>
                <Text>{cart.shipping_address.country_code?.toUpperCase()}</Text>
              </div>

              <div className="flex flex-col gap-1" data-testid="shipping-contact-summary">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Contact
                </Text>
                {cart.shipping_address.phone && <Text>{cart.shipping_address.phone}</Text>}
                <Text>{cart.email}</Text>
              </div>

              <div className="flex flex-col gap-1" data-testid="billing-address-summary">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Billing
                </Text>

                {sameAsBilling ? (
                  <Text>Same as shipping.</Text>
                ) : (
                  <>
                    <Text>
                      {cart.billing_address?.first_name} {cart.billing_address?.last_name}
                    </Text>
                    <Text>
                      {cart.billing_address?.address_1}
                      {cart.billing_address?.address_2 ? ` ${cart.billing_address?.address_2}` : ""}
                    </Text>
                    <Text>
                      {cart.billing_address?.postal_code}, {cart.billing_address?.city}
                    </Text>
                    <Text>{cart.billing_address?.country_code?.toUpperCase()}</Text>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex w-full justify-center py-6">
              <Spinner />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Addresses
