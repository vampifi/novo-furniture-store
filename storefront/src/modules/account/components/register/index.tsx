"use client"

import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const INPUT_CLASSES =
  "h-12 w-full rounded-full border border-transparent bg-white px-6 text-base text-[#3f3a36] shadow-[0px_18px_50px_rgba(64,58,51,0.12)] transition focus:border-[#3f3a36] focus:outline-none focus:ring-2 focus:ring-[#3f3a36] placeholder:text-[#877d76]"

const PRIMARY_BUTTON_CLASSES =
  "mt-2 w-full rounded-full !bg-[#3f3a36] !text-white !uppercase tracking-[0.35em] !leading-6 !py-4 !h-auto shadow-[0px_18px_50px_rgba(64,58,51,0.18)] transition hover:!bg-[#2f2b29] hover:shadow-[0px_22px_60px_rgba(48,42,36,0.25)]"

const OUTLINE_BUTTON_CLASSES =
  "w-full rounded-full border border-[#3f3a36] bg-transparent py-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#3f3a36] shadow-[0px_18px_50px_rgba(64,58,51,0.08)] transition hover:bg-[#3f3a36] hover:text-white hover:shadow-[0px_22px_60px_rgba(48,42,36,0.2)]"

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(signup, null)

  return (
    <div className="w-full max-w-2xl" data-testid="register-page">
      <div className="space-y-3">
        <h1 className="font-serif text-5xl text-[#3f3a36]">Create Account</h1>
        <p className="max-w-xl text-base text-[#6f6660]">
          Create an account to view your order history, save your favourite finds, and update your details whenever you like.
        </p>
      </div>

      <form className="mt-10 space-y-6" action={formAction}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="sr-only" htmlFor="first_name">
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                required
                autoComplete="given-name"
                placeholder="First Name"
                data-testid="first-name-input"
                className={INPUT_CLASSES}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="last_name">
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                required
                autoComplete="family-name"
                placeholder="Last Name"
                data-testid="last-name-input"
                className={INPUT_CLASSES}
              />
            </div>
          </div>

          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email Address"
            data-testid="email-input"
            className={INPUT_CLASSES}
          />

          <label className="sr-only" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Phone"
            data-testid="phone-input"
            className={INPUT_CLASSES}
          />

          <label className="sr-only" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Password"
            data-testid="password-input"
            className={INPUT_CLASSES}
          />
        </div>

        <ErrorMessage error={message} data-testid="register-error" />

        <p className="text-sm leading-6 text-[#6f6660]">
          By creating an account, you agree to NOVO Store&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink href="/content/terms-of-use" className="underline">
            Terms of Use
          </LocalizedClientLink>
          .
        </p>

        <SubmitButton
          className={PRIMARY_BUTTON_CLASSES}
          data-testid="register-button"
          variant="transparent"
        >
          Create an Account
        </SubmitButton>
      </form>

      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.4em] text-[#90857f]">
          <span className="h-px flex-1 bg-[#d7cec7]" />
          or
          <span className="h-px flex-1 bg-[#d7cec7]" />
        </div>

        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className={OUTLINE_BUTTON_CLASSES}
        >
          Already have an account?
        </button>
      </div>
    </div>
  )
}

export default Register
