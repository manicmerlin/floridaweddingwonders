import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Florida Wedding Wonders - Premier Wedding Venues in Florida',
  description: 'Discover Florida\'s most beautiful wedding venues. From beachfront resorts to historic estates, find your perfect wedding venue in the Sunshine State.',
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
