"use client"

import { Heading, Input, Text } from "@medusajs/ui"
import React from "react"
import { useFormState } from "react-dom"

import { applyPromotions, submitPromotionForm } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StoreCartPromotion[]
  }
}

const formatPromotionValue = (
  promotion: HttpTypes.StorePromotion | HttpTypes.StoreCartPromotion
) => {
  const method = promotion.application_method

  if (!method || method.value === undefined) {
    return "Applied promotion"
  }

  const value =
    typeof method.value === "string" ? parseFloat(method.value) : method.value

  if (value === undefined || Number.isNaN(value)) {
    return "Applied promotion"
  }

  if (method.type === "percentage") {
    return `${Math.round(value)}% off`
  }

  if (method.currency_code) {
    return `${convertToLocale({
      amount: value,
      currency_code: method.currency_code,
    })} off`
  }

  return "Promotion applied"
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code === undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code === undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    await applyPromotions(codes)

    if (input) {
      input.value = ""
    }
  }

  const [message, formAction] = useFormState(submitPromotionForm, null)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <Heading className="text-base font-semibold text-[#2F2621]">
          Promotion code
        </Heading>
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="text-sm font-medium text-primary transition hover:opacity-80"
          data-testid="add-discount-button"
          aria-expanded={isOpen}
        >
          {isOpen ? "Hide field" : "Add code"}
        </button>
      </div>
      <Text className="text-sm text-[#7A6B60]">
        Apply a valid code to update your total.
      </Text>

      {isOpen && (
        <form
          action={(a) => addPromotionCode(a)}
          className="flex flex-col gap-3 rounded-xl border border-[#E0D6CE] bg-white px-4 py-4 shadow-sm"
        >
          <div className="flex flex-col justify-center items-center gap-3 sm:flex-row">
            <Input
              className="w-full border-[#D9CEC5] text-sm font-medium text-[#2F2621] placeholder:text-[#B6A89D] focus:border-primary"
              id="promotion-input"
              name="code"
              type="text"
              autoFocus={false}
              placeholder="Enter promotion code"
              data-testid="discount-input"
            />
            <SubmitButton
              variant="primary"
              className="w-full sm:w-32"
              data-testid="discount-apply-button"
            >
              Apply
            </SubmitButton>
          </div>

          <ErrorMessage
            error={message}
            data-testid="discount-error-message"
          />
        </form>
      )}
      {promotions.length > 0 && (
        <div className="flex flex-col gap-3">
          <Text className="text-sm font-semibold text-[#3F3630]">
            Applied promotions
          </Text>

          {promotions.map((promotion) => {
            return (
              <div
                key={promotion.id}
                className="flex items-center justify-between rounded-lg border border-[#E2D9D0] bg-white px-4 py-3 text-sm text-[#3F3630]"
                data-testid="discount-row"
              >
                <div className="flex flex-col">
                  <span data-testid="discount-code">
                    {promotion.code || "Automatic discount"}
                  </span>
                  <Text className="text-xs text-[#8C7B6F]">
                    {formatPromotionValue(promotion)}
                  </Text>
                </div>
                {!promotion.is_automatic && (
                  <button
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-[#8C7B6F] transition hover:text-primary"
                    onClick={() => {
                      if (!promotion.code) {
                        return
                      }

                      removePromotionCode(promotion.code)
                    }}
                    data-testid="remove-discount-button"
                  >
                    <Trash size={14} />
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscountCode
