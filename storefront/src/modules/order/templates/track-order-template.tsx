"use client"

import Image from "next/image"
import { FormEvent, useMemo, useState } from "react"

const TRACK_ORDER_IMAGE =
  "https://res.cloudinary.com/dhbh2lu21/image/upload/v1758560328/login-register-novo-image_euyyf4.webp"

const tabs = [
  { id: "order", label: "Order number" },
  { id: "tracking", label: "Tracking number" },
] as const

const TrackOrderTemplate = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("order")
  const [submitted, setSubmitted] = useState(false)

  const primaryPlaceholder = useMemo(() => {
    if (activeTab === "tracking") {
      return "Tracking number"
    }

    return "Order number"
  }, [activeTab])

  const showContactField = activeTab === "order"

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="relative isolate min-h-[520px] overflow-hidden bg-[#0f0d0b] text-white">
      <Image
        src={TRACK_ORDER_IMAGE}
        alt="Layered pillows in soft lighting"
        fill
        priority
        className="object-cover"
        sizes="(max-width: 1023px) 100vw, 100vw"
      />
      <div className="absolute inset-0 bg-[#13100d]/35" />

      <div className="relative z-10">
        <div className="content-container flex flex-col justify-between gap-12 py-24 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="font-serif text-[46px] leading-[1.05] tracking-[0.02em] text-white sm:text-[54px] md:text-[62px]">
              Track your order
            </p>
          </div>

          <div className="w-full max-w-sm rounded-[30px] bg-white p-9 text-[#12100e] shadow-[0_26px_65px_rgba(17,14,12,0.28)]">
            <div className="flex items-center gap-6 border-b border-[#12100e]/15 pb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#6c645e]">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSubmitted(false)
                    }}
                    className={`relative pb-2 transition-colors ${
                      isActive ? "text-[#12100e]" : "hover:text-[#12100e]/70"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-opacity ${
                        isActive ? "bg-[#12100e] opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <input
                  id="primary-field"
                  name="primary-field"
                  required
                  placeholder={primaryPlaceholder}
                  className="h-12 w-full rounded-2xl border border-[#12100e]/25 bg-white px-4 text-base font-medium text-[#12100e] outline-none transition focus:border-[#12100e] focus:ring-2 focus:ring-[#12100e]/15 placeholder:text-[#8b827a] placeholder:opacity-80"
                />
              </div>

              {showContactField && (
                <div>
                  <input
                    id="contact-field"
                    name="contact-field"
                    type="email"
                    required
                    placeholder="Email"
                    className="h-12 w-full rounded-2xl border border-[#12100e]/25 bg-white px-4 text-base font-medium text-[#12100e] outline-none transition focus:border-[#12100e] focus:ring-2 focus:ring-[#12100e]/15 placeholder:text-[#8b827a] placeholder:opacity-80"
                  />
                </div>
              )}

              <button
                type="submit"
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#12100e] text-xs font-semibold uppercase tracking-[0.38em] text-white shadow-[0px_16px_32px_rgba(0,0,0,0.22)] transition hover:bg-black"
              >
                Track
              </button>

              {showContactField && (
                <p className="text-center text-xs text-[#6c645e]">
                  Verify by{' '}
                  <button type="button" className="font-semibold underline underline-offset-4">
                    phone number
                  </button>
                </p>
              )}

              {submitted && (
                <div className="rounded-2xl border border-[#ded4cc] bg-[#f7f3ef] px-5 py-4 text-sm text-[#3f3a36]">
                  We&apos;ve sent the latest tracking details to your inbox. Check your
                  spam folder if you haven&apos;t received an update.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrackOrderTemplate
