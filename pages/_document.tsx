import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Find egg prices near you in Los Angeles" />
        <title>eggs.live - Track Egg Prices in Los Angeles</title>
        {/* No favicon reference */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

