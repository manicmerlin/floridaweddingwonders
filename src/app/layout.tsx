import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5WN9B7HLTH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5WN9B7HLTH');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
