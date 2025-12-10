import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Geist_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/contexts/wallet-context"
import { WalletGate } from "@/components/wallet-gate"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "DeepShare",
  description: "Share & Monetize REAL real-world data (not AI)",
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${geistMono.variable} ${inter.variable}`}>
      <body className="font-sans antialiased overflow-x-hidden">
        <div className="noise-overlay" />
        <WalletProvider>
          <WalletGate>{children}</WalletGate>
        </WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}
