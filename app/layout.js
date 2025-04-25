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
  title: 'EGGS LIVE',
  description: 'Egg prices near you',
}

export default function RootLayout({ children }) {
  return (
    // Apply font class to html tag for global scope
    <html lang="en" className={roboto_mono.className}>
      <head>
        {/* Removed manual <link> tags for Google Fonts */}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
} 