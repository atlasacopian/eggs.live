import type React from "react"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/EGG-zmK9uDISD4eBHGN1PrwHXmqZ4A19y5.png"
          type="image/png"
          sizes="32x32"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#000",
          minHeight: "100vh",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  )
}

