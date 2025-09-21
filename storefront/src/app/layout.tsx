import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "styles/globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className={`${montserrat.variable} font-sans`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
