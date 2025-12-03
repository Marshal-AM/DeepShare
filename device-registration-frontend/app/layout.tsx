import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'i-Witness Device Registration',
  description: 'Register your i-Witness device',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

