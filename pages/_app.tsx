import type { AppProps } from "next/app"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <main className={`min-h-screen bg-gradient-to-b from-amber-50 to-white ${inter.className}`}>
        <Component {...pageProps} />
      </main>
    </ThemeProvider>
  )
}

