import { Button, Hr, Link, Section, Text } from '@react-email/components'
import { Base } from './base'

export const NEWSLETTER_WELCOME = 'newsletter-welcome'

export interface NewsletterWelcomeProps {
  preview?: string
  storeUrl: string
  unsubscribeUrl?: string
}

export const isNewsletterWelcomeData = (
  data: any
): data is NewsletterWelcomeProps =>
  typeof data === 'object' &&
  data !== null &&
  typeof data.storeUrl === 'string' &&
  (typeof data.preview === 'string' || data.preview === undefined) &&
  (typeof data.unsubscribeUrl === 'string' || data.unsubscribeUrl === undefined)

export const NewsletterWelcomeEmail = ({
  storeUrl,
  unsubscribeUrl,
  preview = "You're on the list. Expect new drops, design stories, and offers from Novo.",
}: NewsletterWelcomeProps) => {
  return (
    <Base preview={preview}>
      <Section className="bg-white px-8 py-10">
        <Text className="text-[13px] uppercase tracking-[0.24em] text-[#6A5C55] mb-2">
          Novo Furniture
        </Text>
        <Text className="text-[26px] leading-[34px] font-semibold text-[#2E2623] mb-4">
          Welcome to the newsletter
        </Text>
        <Text className="text-[16px] leading-[26px] text-[#433A35] mb-6">
          Thanks for subscribing. We&apos;ll share new collections, design inspiration, and
          exclusive offers straight to your inbox. No spam—just the good stuff.
        </Text>
        <Button
          href={storeUrl}
          className="bg-[#2E2623] text-white text-[14px] font-semibold px-5 py-3 rounded-full no-underline"
        >
          Explore the latest
        </Button>
        <Hr className="border border-solid border-[#EFE7E0] my-8 mx-0 w-full" />
        <Text className="text-[13px] leading-[22px] text-[#7A6E67]">
          Prefer fewer emails?{' '}
          {unsubscribeUrl ? (
            <Link href={unsubscribeUrl} className="text-[#2E2623] underline">
              Unsubscribe here
            </Link>
          ) : (
            'Unsubscribe anytime from your profile.'
          )}
        </Text>
      </Section>
    </Base>
  )
}

NewsletterWelcomeEmail.PreviewProps = {
  storeUrl: 'https://novo-furniture.com',
  unsubscribeUrl: 'https://novo-furniture.com/unsubscribe',
} as NewsletterWelcomeProps

export default NewsletterWelcomeEmail
