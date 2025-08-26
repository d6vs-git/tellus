import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Lora, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { SessionRedirect } from "../components/SessionRedirect"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
})

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
})

export const metadata: Metadata = {
  title: "Tellus",
  description: "The Pulse of Customer Experience",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${lora.variable} ${ibmPlexMono.variable} antialiased`}>
      <body>
        <Providers>
          <SessionRedirect />
          <main className="">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
