"use client"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import { updateLineItem } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import LineItemOptions from "@modules/common/components/line-item-options"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LineItemPrice from "@modules/common/components/line-item-price"
import DeleteButton from "@modules/common/components/delete-button"
import ErrorMessage from "@modules/checkout/components/error-message"
import Spinner from "@modules/common/icons/spinner"

type MobileItemProps = {
  item: HttpTypes.StoreCartLineItem
}

const MobileItem = ({ item }: MobileItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { handle } = item.variant?.product ?? {}

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#EDE1D8] bg-white px-4 py-4 shadow-sm">
      <div className="flex justify-between gap-3">
        <LocalizedClientLink
          href={`/products/${handle}`}
          className="flex shrink-0"
        >
          <Thumbnail
            thumbnail={item.variant?.product?.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            className="!w-20 !rounded-2xl overflow-hidden border border-[#E4D6CB]"
          />
        </LocalizedClientLink>
        <div className="flex flex-1 flex-col gap-2">
          <Text className="text-sm font-semibold text-[#221C18]">
            {item.product_title}
          </Text>
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant-mobile"
          />
        </div>
        <DeleteButton
          id={item.id}
          data-testid="product-delete-button-mobile"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C7B6F]"
        >
          Remove
        </DeleteButton>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-[#97897E]">
          Quantity
          <div className="flex items-center gap-2">
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="h-10 w-20 rounded-lg border border-[#D9CEC5] px-0 [&>select]:h-10 [&>select]:w-full [&>select]:px-2 [&>select]:text-sm"
              data-testid="product-select-button-mobile"
            >
              {Array.from(
                { length: Math.min(maxQuantity, 10) },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner size="16" />}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-[#97897E]">
          Price
          <span className="text-sm font-semibold text-[#3F3630]">
            <LineItemUnitPrice item={item} style="tight" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-[#FBF3ED] px-4 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-[#8C7B6F]">
          Total
        </span>
        <span className="text-base font-semibold text-[#2F2621]">
          <LineItemPrice item={item} style="tight" />
        </span>
      </div>

      <ErrorMessage
        error={error}
        data-testid="product-error-message-mobile"
      />
    </div>
  )
}

export default MobileItem
