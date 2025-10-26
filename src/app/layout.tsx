import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { generateHomeMetadata, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  ...generateHomeMetadata(),
  metadataBase: new URL(SITE_CONFIG.url),
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#1e3a8a" />
        
        {/* Hreflang tags for multilingual support */}
        <link rel="alternate" hrefLang="x-default" href="https://floridaweddingwonders.com" />
        <link rel="alternate" hrefLang="en" href="https://floridaweddingwonders.com" />
        <link rel="alternate" hrefLang="es" href="https://floridaweddingwonders.com/es" />
        
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
        
        {/* Structured Data - Organization */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Florida Wedding Wonders',
              url: 'https://floridaweddingwonders.com',
              logo: 'https://floridaweddingwonders.com/images/logo.png',
              description: 'Discover Florida\'s most beautiful wedding venues, trusted vendors, and elegant bridal shops.',
              sameAs: [
                'https://twitter.com/flweddingwonder',
                'https://facebook.com/floridaweddingwonders',
                'https://instagram.com/floridaweddingwonders',
              ],
            }),
          }}
        />
        
        {/* Structured Data - Website */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Florida Wedding Wonders',
              url: 'https://floridaweddingwonders.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://floridaweddingwonders.com/venues?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
