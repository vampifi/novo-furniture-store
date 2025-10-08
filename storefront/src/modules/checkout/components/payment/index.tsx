"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RadioGroup } from "@headlessui/react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"

import PaymentContainer from "@modules/checkout/components/payment-container"
import { isStripe as isStripeFunc, paymentInfoMap } from "@lib/constants"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import { initiatePaymentSession } from "@lib/data/cart"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const isStripe = isStripeFunc(activeSession?.provider_id)
  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#443B33",
          "::placeholder": {
            color: "#B7A598",
          },
        },
      },
      classes: {
        base: "mt-0 block h-11 w-full rounded-xl border border-[#E8DCD2] bg-white px-4 pt-3 pb-1 text-sm text-[#443B33] transition focus:border-[#443B33] focus:outline-none",
      },
    }
  }, [])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeFunc(selectedPaymentMethod) && !activeSession

      if (!activeSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
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
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F] transition hover:text-[#443B33]"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div className="pt-4">
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setSelectedPaymentMethod(value)}
              >
                <div className="flex flex-col gap-3">
                  {availablePaymentMethods
                    .sort((a, b) => {
                      return a.provider_id > b.provider_id ? 1 : -1
                    })
                    .map((paymentMethod) => {
                      return (
                        <PaymentContainer
                          paymentInfoMap={paymentInfoMap}
                          paymentProviderId={paymentMethod.id}
                          key={paymentMethod.id}
                          selectedPaymentOptionId={selectedPaymentMethod}
                        />
                      )
                    })}
                </div>
              </RadioGroup>
              {isStripe && stripeReady && (
                <div className="mt-5 flex flex-col gap-2 transition-all duration-150 ease-in-out">
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                    Enter your card details:
                  </Text>

                  <CardElement
                    options={useOptions as StripeCardElementOptions}
                    onChange={(e) => {
                      setCardBrand(
                        e.brand &&
                          e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                      )
                      setError(e.error?.message || null)
                      setCardComplete(e.complete)
                    }}
                  />
                </div>
              )}
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col gap-1 text-sm text-[#6A5C52]">
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                Payment method
              </Text>
              <Text data-testid="payment-method-summary">Gift card</Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6 h-12 w-full rounded-full bg-[#221C18] text-sm font-semibold uppercase tracking-[0.16em] text-[#EFE4DC] transition hover:bg-[#2E261F]"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripe && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeFunc(selectedPaymentMethod)
              ? "Enter card details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="grid gap-4 text-sm text-[#6A5C52] sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Payment method
                </Text>
                <Text data-testid="payment-method-summary">
                  {paymentInfoMap[selectedPaymentMethod]?.title ||
                    selectedPaymentMethod}
                </Text>
              </div>
              <div className="flex flex-col gap-1">
                <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                  Details
                </Text>
                <div
                  className="flex items-center gap-2"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex h-7 w-fit items-center rounded-full bg-[#F3EAE2] px-3">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeFunc(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Confirm at next step"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col gap-1 text-sm text-[#6A5C52]">
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]">
                Payment method
              </Text>
              <Text data-testid="payment-method-summary">Gift card</Text>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Payment
