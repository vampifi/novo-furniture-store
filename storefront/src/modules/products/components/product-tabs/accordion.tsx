import { Text, clx } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import React from "react"

type AccordionItemProps = AccordionPrimitive.AccordionItemProps & {
  title: string
  subtitle?: string
  description?: string
  required?: boolean
  tooltip?: string
  forceMountContent?: true
  headingSize?: "small" | "medium" | "large"
  customTrigger?: React.ReactNode
  complete?: boolean
  active?: boolean
  triggerable?: boolean
  children: React.ReactNode
}

type AccordionProps =
  | (AccordionPrimitive.AccordionSingleProps &
      React.RefAttributes<HTMLDivElement>)
  | (AccordionPrimitive.AccordionMultipleProps &
      React.RefAttributes<HTMLDivElement>)

const Accordion: React.FC<AccordionProps> & {
  Item: React.FC<AccordionItemProps>
} = ({ children, ...props }) => {
  return (
    /* x@ts-expect-error */
    <AccordionPrimitive.Root {...props}>{children}</AccordionPrimitive.Root>
  )
}

const Item: React.FC<AccordionItemProps> = ({
  title,
  subtitle,
  description,
  children,
  className,
  headingSize = "large",
  customTrigger = undefined,
  forceMountContent = undefined,
  triggerable,
  ...props
}) => {
  return (
    /* x@ts-expect-error */
    <AccordionPrimitive.Item
      {...props}
      className={clx(
        "group rounded-2xl border border-[#E3DAD3] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {/* x@ts-expect-error */}
      <AccordionPrimitive.Header className="px-2">
        <div className="flex flex-col gap-2 px-4 py-5">
          <div className="flex w-full items-center justify-between gap-4">
            <Text className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2F2721]">
              {title}
            </Text>
            {/* x@ts-expect-error */}
            <AccordionPrimitive.Trigger className="group inline-flex items-center justify-center rounded-full">
              {customTrigger || <MorphingTrigger />}
            </AccordionPrimitive.Trigger>
          </div>
          {subtitle && (
            <Text as="span" size="small" className="text-[#77685D]">
              {subtitle}
            </Text>
          )}
        </div>
      </AccordionPrimitive.Header>
      {/* x@ts-expect-error */}
      <AccordionPrimitive.Content
        forceMount={forceMountContent}
        className={clx(
          "radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open radix-state-closed:pointer-events-none px-2 pb-5"
        )}
      >
        <div className="inter-base-regular group-radix-state-closed:animate-accordion-close px-4 text-[#4A4038]">
          {description && <Text>{description}</Text>}
          <div className="w-full">{children}</div>
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

Accordion.Item = Item

const MorphingTrigger = () => {
  return (
    <div className="rounded-full border border-[#E3DAD3] bg-[#FAF6F3] p-1 text-[#2F2721] transition-colors group-hover:bg-[#F0E7E0]">
      <div className="relative h-7 w-7">
        <span className="absolute left-1/2 top-1.5 bottom-1.5 w-[1.5px] -translate-x-1/2 rounded-full bg-[#C4B6AA] transition-all duration-200 group-radix-state-open:opacity-0" />
        <span className="absolute top-1/2 left-1.5 right-1.5 h-[1.5px] -translate-y-1/2 rounded-full bg-[#C4B6AA] transition-all duration-200" />
      </div>
    </div>
  )
}

export default Accordion
