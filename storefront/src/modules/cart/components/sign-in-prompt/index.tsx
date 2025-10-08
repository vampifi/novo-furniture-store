import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex flex-col gap-6 rounded-[24px] border border-[#E8DCD2] bg-[#F3EAE2] px-6 py-6 text-[#443B33] shadow-[0px_12px_30px_rgba(68,59,51,0.1)] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
      <div className="max-w-md">
        <Heading
          level="h2"
          className="text-[22px] font-semibold uppercase tracking-[0.12em] text-[#221C18]"
        >
          Already have an account?
        </Heading>
        <Text className="mt-2 text-sm text-[#6A5C52] sm:text-base">
          Sign in to access saved details and a faster checkout.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="h-11 rounded-full border border-[#443B33] bg-white px-6 text-[#221C18] transition hover:bg-[#EBDDCF] hover:text-[#221C18]"
            data-testid="sign-in-button"
          >
            Sign in
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
