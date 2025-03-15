import type { AppProps } from "next/app"
import "@/styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Component {...pageProps} />
    </div>
  )
}

