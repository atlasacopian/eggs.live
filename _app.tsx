import type { AppProps } from "next/app"
import "@/styles/globals.css"
import Head from "next/head"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>eggs.live | real-time egg price tracker</title>
        <meta name="description" content="Track egg prices in real-time across multiple stores" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-white">
        <Component {...pageProps} />
      </div>
    </>
  )
}

