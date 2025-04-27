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

export const metadata = {
  title: 'eggs.live',
  description: 'Egg prices near you',
}

export default function RootLayout({ children }) {
  return (
    // Apply font class to html tag for global scope
    <html lang="en" className={`${roboto_mono.className} dark-theme`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Removed manual <link> tags for Google Fonts */}
      </head>
      <body style={{ background: '#000' }}>
        {children}
      </body>
    </html>
  )
} 