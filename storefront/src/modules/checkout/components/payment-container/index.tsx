import { RadioGroup } from "@headlessui/react"
import { InformationCircleSolid } from "@medusajs/icons"
import { Text, Tooltip, clx } from "@medusajs/ui"
import React from "react"

import Radio from "@modules/common/components/radio"

import PaymentTest from "../payment-test"
import { isManual } from "@lib/constants"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <>
      <RadioGroup.Option
        key={paymentProviderId}
        value={paymentProviderId}
        disabled={disabled}
        className={clx(
          "flex cursor-pointer flex-col gap-3 rounded-2xl border border-[#E8DCD2] bg-white px-4 py-4 transition hover:border-[#CBB8A9] sm:flex-row sm:items-center sm:justify-between sm:px-6",
          {
            "border-[#443B33] shadow-[0px_12px_28px_rgba(68,59,51,0.12)]":
              selectedPaymentOptionId === paymentProviderId,
          }
        )}
      >
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-base font-semibold text-[#221C18]">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3EAE2] text-[#443B33]">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
        {isManual(paymentProviderId) && isDevelopment && (
          <PaymentTest className="small:hidden text-[10px]" />
        )}
      </RadioGroup.Option>
    </>
  )
}

export default PaymentContainer
