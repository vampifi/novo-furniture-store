import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'
import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { OrderCanceledTemplate, ORDER_CANCELED, isOrderCanceledTemplateData } from './order-canceled'
import { OrderDispatchedTemplate, ORDER_DISPATCHED, isOrderDispatchedTemplateData } from './order-dispatched'
import {
  NewsletterWelcomeEmail,
  NEWSLETTER_WELCOME,
  isNewsletterWelcomeData,
} from './newsletter-welcome'
import {
  NewsletterNewContentEmail,
  NEWSLETTER_NEW_CONTENT,
  isNewsletterNewContentData,
} from './newsletter-new-content'

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  ORDER_CANCELED,
  ORDER_DISPATCHED,
  NEWSLETTER_WELCOME,
  NEWSLETTER_NEW_CONTENT,
} as const

export type EmailTemplateType = keyof typeof EmailTemplates

export function generateEmailTemplate(templateKey: string, data: unknown): ReactNode {
  switch (templateKey) {
    case EmailTemplates.INVITE_USER:
      if (!isInviteUserData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.INVITE_USER}"`
        )
      }
      return <InviteUserEmail {...data} />

    case EmailTemplates.ORDER_PLACED:
      if (!isOrderPlacedTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_PLACED}"`
        )
      }
      return <OrderPlacedTemplate {...data} />
    case EmailTemplates.ORDER_CANCELED:
      if (!isOrderCanceledTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_CANCELED}"`
        )
      }
      return <OrderCanceledTemplate {...data} />
    case EmailTemplates.ORDER_DISPATCHED:
      if (!isOrderDispatchedTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_DISPATCHED}"`
        )
      }
      return <OrderDispatchedTemplate {...data} />
    case EmailTemplates.NEWSLETTER_WELCOME:
      if (!isNewsletterWelcomeData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.NEWSLETTER_WELCOME}"`
        )
      }
      return <NewsletterWelcomeEmail {...data} />
    case EmailTemplates.NEWSLETTER_NEW_CONTENT:
      if (!isNewsletterNewContentData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.NEWSLETTER_NEW_CONTENT}"`
        )
      }
      return <NewsletterNewContentEmail {...data} />

    default:
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown template key: "${templateKey}"`
      )
  }
}

export {
  InviteUserEmail,
  OrderPlacedTemplate,
  OrderCanceledTemplate,
  OrderDispatchedTemplate,
  NewsletterWelcomeEmail,
  NewsletterNewContentEmail,
}
