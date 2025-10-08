"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const selectedShippingMethod = availableShippingMethods?.find(
    // To do: remove the previously selected shipping method instead of using the last one
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="rounded-[28px] border border-[#E8DCD2] bg-white px-5 py-6 text-[#443B33] shadow-[0px_20px_40px_rgba(68,59,51,0.08)] sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EDE1D8] pb-4">
        <Heading
          level="h2"
          className={clx(
            "flex items-center gap-2 text-[20px] font-semibold uppercase tracking-[0.12em] text-[#221C18]",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F] transition hover:text-[#443B33]"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div className="pt-4" data-testid="delivery-options-container">
          <RadioGroup value={selectedShippingMethod?.id} onChange={set}>
            <div className="flex flex-col gap-3">
              {availableShippingMethods?.map((option) => {
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex flex-col gap-3 rounded-2xl border border-[#E8DCD2] bg-white px-4 py-4 transition hover:border-[#CBB8A9] sm:flex-row sm:items-center sm:justify-between sm:px-6",
                      {
                        "border-[#443B33] shadow-[0px_12px_28px_rgba(68,59,51,0.12)]":
                          option.id === selectedShippingMethod?.id,
                      }
                    )}
                  >
                    <div className="flex items-center gap-x-4">
                      <Radio checked={option.id === selectedShippingMethod?.id} />
                      <Text className="text-base font-semibold text-[#221C18]">
                        {option.name}
                      </Text>
                    </div>
                    <Text className="text-sm font-semibold text-[#221C18]">
                      {convertToLocale({
                        amount: option.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </Text>
                  </RadioGroup.Option>
                )
              })}
            </div>
          </RadioGroup>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6 h-12 w-full rounded-full bg-[#221C18] text-sm font-semibold uppercase tracking-[0.16em] text-[#EFE4DC] transition hover:bg-[#2E261F]"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods?.[0]}
            data-testid="submit-delivery-option-button"
          >
            Continue to payment
          </Button>
        </div>
      ) : (
        <div className="pt-4">
          {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
            <div className="grid gap-2 text-sm text-[#6A5C52] sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Method
                </Text>
                <Text>
                  {selectedShippingMethod?.name}
                </Text>
              </div>
              <div className="flex flex-col gap-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Cost
                </Text>
                <Text>
                  {convertToLocale({
                    amount: selectedShippingMethod?.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Shipping
