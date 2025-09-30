import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import {
  PRODUCT_ACCENT_BG_SOFT_CLASS,
  PRODUCT_ACCENT_BORDER_CLASS,
  PRODUCT_ACCENT_TEXT_CLASS,
} from "../../constants/theme"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = option.values?.map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions?.map((v) => {
          return (
            <button
              onClick={() => updateOption(option.title ?? "", v ?? "")}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 transition-shadow ease-in-out duration-150",
                v === current && PRODUCT_ACCENT_BORDER_CLASS,
                v === current && PRODUCT_ACCENT_BG_SOFT_CLASS,
                v === current && PRODUCT_ACCENT_TEXT_CLASS,
                v !== current && "hover:shadow-elevation-card-rest"
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
