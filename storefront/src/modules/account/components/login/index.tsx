import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { login } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const INPUT_CLASSES =
  "h-12 w-full rounded-full border border-transparent bg-white px-6 text-base text-[#3f3a36] shadow-[0px_18px_50px_rgba(64,58,51,0.12)] transition focus:border-[#3f3a36] focus:outline-none focus:ring-2 focus:ring-[#3f3a36] placeholder:text-[#877d76]"

const PRIMARY_BUTTON_CLASSES =
  "mt-2 w-full rounded-full !bg-[#3f3a36] !text-white !uppercase tracking-[0.35em] !leading-6 !py-4 !h-auto shadow-[0px_18px_50px_rgba(64,58,51,0.18)] transition hover:!bg-[#2f2b29] hover:shadow-[0px_22px_60px_rgba(48,42,36,0.25)]"

const OUTLINE_BUTTON_CLASSES =
  "w-full rounded-full border border-[#3f3a36] bg-transparent py-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#3f3a36] shadow-[0px_18px_50px_rgba(64,58,51,0.08)] transition hover:bg-[#3f3a36] hover:text-white hover:shadow-[0px_22px_60px_rgba(48,42,36,0.2)]"

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)

  return (
    <div className="w-full max-w-2xl" data-testid="login-page">
      <div className="space-y-3">
        <h1 className="font-serif text-5xl text-[#3f3a36]">Login</h1>
        <p className="max-w-md text-base text-[#6f6660]">
          Welcome back. Sign in to access your saved preferences and faster checkout.
        </p>
      </div>

      <form className="mt-10 space-y-6" action={formAction}>
        <div className="space-y-4">
          <label className="sr-only" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            title="Enter a valid email address."
            data-testid="email-input"
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
            autoComplete="current-password"
            placeholder="Password"
            data-testid="password-input"
            className={INPUT_CLASSES}
          />
        </div>

        <ErrorMessage error={message} data-testid="login-error-message" />

        <div className="flex justify-center text-xs font-semibold uppercase tracking-[0.3em] text-[#3f3a36]">
          <LocalizedClientLink
            href="/account/password-recovery"
            className="underline underline-offset-4 decoration-[#3f3a36] transition hover:decoration-transparent"
          >
            Forgot your password?
          </LocalizedClientLink>
        </div>

        <SubmitButton
          data-testid="sign-in-button"
          className={PRIMARY_BUTTON_CLASSES}
          variant="transparent"
        >
          Log In
        </SubmitButton>
      </form>

      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.4em] text-[#90857f]">
          <span className="h-px flex-1 bg-[#d7cec7]" />
          or
          <span className="h-px flex-1 bg-[#d7cec7]" />
        </div>

        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className={OUTLINE_BUTTON_CLASSES}
          data-testid="register-button"
          type="button"
        >
          Create Account
        </button>
      </div>
    </div>
  )
}

export default Login
