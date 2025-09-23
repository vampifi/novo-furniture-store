import { Metadata } from "next"

import AboutTemplate from "@modules/content/templates/about-template"

export const metadata: Metadata = {
  title: "About Novo",
  description:
    "Discover the story behind Novo Furniture and how we deliver luxury design for less with thoughtful collections crafted to elevate every room.",
}

export default function AboutPage() {
  return <AboutTemplate />
}
