import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "eggs.live - Track Egg Prices in Los Angeles",
  description: "Find the best egg prices near you in Los Angeles",
  // Remove all icon references
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>{/* No favicon references here */}</head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

