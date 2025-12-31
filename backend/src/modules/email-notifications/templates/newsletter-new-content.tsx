import { Button, Hr, Img, Link, Section, Text } from '@react-email/components'
import { Base } from './base'

export const NEWSLETTER_NEW_CONTENT = 'newsletter-new-content'

export interface NewsletterNewContentProps {
  title: string
  readUrl: string
  excerpt?: string | null
  coverImage?: string | null
  authorName?: string | null
  preview?: string
  unsubscribeUrl?: string
}

export const isNewsletterNewContentData = (
  data: any
): data is NewsletterNewContentProps =>
  typeof data === 'object' &&
  data !== null &&
  typeof data.title === 'string' &&
  typeof data.readUrl === 'string' &&
  (typeof data.excerpt === 'string' || data.excerpt === null || data.excerpt === undefined) &&
  (typeof data.coverImage === 'string' || data.coverImage === null || data.coverImage === undefined) &&
  (typeof data.authorName === 'string' || data.authorName === null || data.authorName === undefined) &&
  (typeof data.preview === 'string' || data.preview === undefined) &&
  (typeof data.unsubscribeUrl === 'string' || data.unsubscribeUrl === undefined)

export const NewsletterNewContentEmail = ({
  title,
  excerpt,
  coverImage,
  readUrl,
  authorName,
  unsubscribeUrl,
  preview = 'Fresh from the journal: your latest story from Novo.',
}: NewsletterNewContentProps) => {
  return (
    <Base preview={preview}>
      <Section className="bg-white px-8 py-10">
        <Text className="text-[13px] uppercase tracking-[0.24em] text-[#6A5C55] mb-2">
          Novo Journal
        </Text>
        <Text className="text-[26px] leading-[34px] font-semibold text-[#2E2623] mb-3">
          {title}
        </Text>
        {authorName ? (
          <Text className="text-[13px] leading-[20px] text-[#7A6E67] mb-4">
            By {authorName}
          </Text>
        ) : null}
        {coverImage ? (
          <Section className="mb-5">
            <Img
              src={coverImage}
              alt={title}
              className="w-full h-auto rounded-[14px] border border-solid border-[#EFE7E0]"
            />
          </Section>
        ) : null}
        {excerpt ? (
          <Text className="text-[16px] leading-[26px] text-[#433A35] mb-6">
            {excerpt}
          </Text>
        ) : (
          <Text className="text-[16px] leading-[26px] text-[#433A35] mb-6">
            Step inside for the full story.
          </Text>
        )}
        <Button
          href={readUrl}
          className="bg-[#2E2623] text-white text-[14px] font-semibold px-5 py-3 rounded-full no-underline"
        >
          Read now
        </Button>
        <Hr className="border border-solid border-[#EFE7E0] my-8 mx-0 w-full" />
        {unsubscribeUrl ? (
          <Text className="text-[13px] leading-[22px] text-[#7A6E67]">
            Not into updates?{' '}
            <Link href={unsubscribeUrl} className="text-[#2E2623] underline">
              Unsubscribe here
            </Link>
            .
          </Text>
        ) : null}
      </Section>
    </Base>
  )
}

NewsletterNewContentEmail.PreviewProps = {
  title: 'New in: Serene living spaces',
  excerpt: 'Layered neutrals, sculptural silhouettes, and lighting that softens every corner.',
  readUrl: 'https://novo-furniture.com/blog/serene-living-spaces',
  coverImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
} as NewsletterNewContentProps

export default NewsletterNewContentEmail
