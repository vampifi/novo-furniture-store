export type FaqItem = {
  question: string
  answer: string[]
  ctaLabel?: string
  ctaHref?: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "I have purchased an item with an estimated delivery. What happens next?",
    answer: [
      "We aim to process all orders as fast as possible but ask to allow 10 working days for all standard delivery orders to be dispatched.",
      "You will receive an email from us confirming that it's on the way to you. If you haven't received a dispatch email within 10 working days of placing your order, it's likely that you have purchased something on pre-order.",
      "Please refer to your order confirmation for an estimated timeframe of when your order will be dispatched.",
    ],
    ctaLabel: "Delivery Information",
    ctaHref: "/content/delivery-information",
  },
  {
    question: "My order has been delivered but I am missing items. What should I do?",
    answer: [
      "If your order arrives and not all items are included, there is a chance that it has a different estimated delivery date or will be arriving separately. Please ensure that you have referred to the estimated delivery timeframes on your order confirmation and only contact us if these have passed.",
      "There's also a chance that your order has been split into multiple parcels. If this is the case, you should have received multiple tracking links. If all items have been dispatched and should have been delivered, please get in touch within 7 days of receiving the delivery confirmation.",
    ],
  },
  {
    question: "How do I know if my furniture will fit?",
    answer: [
      "We highly recommend that you thoroughly check our 'Will It Fit?' guide, linked on all products, before making any purchases. This will help you ensure that the furniture will fit through your doors, hallways, and into your desired space.",
      "Properly measuring your space and understanding the dimensions of the furniture can save you time and hassle. Please take a few moments to review the guide to make your delivery and setup process as smooth as possible.",
      "Please be advised that, if our delivery partners are unable to deliver the product due to size restrictions, you will be charged a return fee.",
    ],
    ctaLabel: "Will it fit?",
    ctaHref: "/content/will-it-fit",
  },
]
