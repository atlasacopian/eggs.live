import type { AppProps } from "next/app"
import { ThemeProvider } from "@/components/theme-provider"
import "@/styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  )
}

