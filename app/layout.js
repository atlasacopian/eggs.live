// Removed 'use client' directive to allow metadata export
import './globals.css'
import { Roboto_Mono } from 'next/font/google' // Import the font function

// Configure the font
const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono', // Optional: define CSS variable if needed elsewhere
  weight: ['300', '400', '700'], // Specify needed weights
  display: 'swap', // Use swap for font display strategy
})

const SITE_DESCRIPTION =
  'Live egg price tracker comparing regular and organic egg prices at grocery stores near you, updated daily. Enter your ZIP code to see current egg prices at Target, Kroger, and more.'

export const metadata = {
  metadataBase: new URL('https://eggs.live'),
  title: {
    default: 'Live Egg Prices Near You | eggs.live',
    template: '%s | eggs.live',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'egg prices',
    'egg price tracker',
    'egg prices near me',
    'current egg prices',
    'organic egg prices',
    'egg price by zip code',
  ],
  openGraph: {
    title: 'Live Egg Prices Near You',
    description: SITE_DESCRIPTION,
    url: 'https://eggs.live',
    siteName: 'eggs.live',
    images: [{ url: '/logo_test2.png', width: 2280, height: 1138, alt: 'eggs.live – Egg Price Tracker' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Egg Prices Near You',
    description: SITE_DESCRIPTION,
    images: ['/logo_test2.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'eggs.live',
  url: 'https://eggs.live',
  description: SITE_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://eggs.live/{zip_code}',
    },
    'query-input': 'required name=zip_code',
  },
}

export default function RootLayout({ children }) {
  return (
    // Apply font class to html tag for global scope
    <html lang="en" className={`${roboto_mono.className} dark-theme`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Removed manual <link> tags for Google Fonts */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body style={{ background: '#000' }}>
        {children}
      </body>
    </html>
  )
} 