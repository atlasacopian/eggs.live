import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Inter, JetBrains_Mono } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })
const mono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata = {
  title: "eggs.live",
  description: "Track egg prices across the US and in Echo Park, Los Angeles",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={mono.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

