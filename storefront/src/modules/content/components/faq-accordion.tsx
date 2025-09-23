"use client"

import { useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type { FaqItem } from "../data/faqs"

type Props = {
  items: FaqItem[]
  initialOpenIndex?: number | null
}

const FaqAccordion = ({ items, initialOpenIndex = 0 }: Props) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(initialOpenIndex)

  const handleFaqToggle = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index))
  }

  return (
    <div className="divide-y divide-[#d7cec7]">
      {items.map((faq, index) => {
        const isActive = activeFaq === index

        return (
          <div key={faq.question} className="py-6">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-6 text-left"
              onClick={() => handleFaqToggle(index)}
              aria-expanded={isActive}
              aria-controls={`faq-panel-${index}`}
            >
              <span className="font-serif text-xl text-[#3f3a36] md:text-2xl">
                {faq.question}
              </span>
              <span className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3f3a36] bg-white">
                <span className="block h-[2px] w-4 bg-[#3f3a36] transition-transform duration-200" />
                <span
                  className={`absolute block h-[2px] w-4 bg-[#3f3a36] transition-all duration-200 ${
                    isActive ? "opacity-0" : "opacity-100"
                  } ${isActive ? "rotate-0" : "rotate-90"}`}
                />
              </span>
            </button>
            <div
              id={`faq-panel-${index}`}
              className={`overflow-hidden text-[#6f6660] transition-all duration-300 ease-in-out ${
                isActive ? "mt-4 max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4 text-base leading-7">
                {faq.answer.map((paragraph, answerIndex) => (
                  <p key={`${faq.question}-${answerIndex}`}>{paragraph}</p>
                ))}
                {faq.ctaLabel && faq.ctaHref ? (
                  <LocalizedClientLink
                    href={faq.ctaHref}
                    className="inline-flex items-center justify-center rounded-full border border-[#3f3a36] bg-[#0f0d0b] px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-[0px_14px_40px_rgba(64,58,51,0.2)] transition hover:bg-[#3f3a36]"
                  >
                    {faq.ctaLabel}
                  </LocalizedClientLink>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FaqAccordion
