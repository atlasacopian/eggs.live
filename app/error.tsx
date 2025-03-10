"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-green-400 font-mono">
      <h1 className="text-2xl mb-4">🥚 Egg Price Tracker</h1>
      <div className="bg-black border border-green-400 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl mb-4">Database Connection Error</h2>
        <p className="mb-4">We're having trouble connecting to our database. Please try again later.</p>
        <button onClick={reset} className="bg-green-400 text-black px-4 py-2 rounded hover:bg-green-500">
          Try again
        </button>
      </div>
    </div>
  )
}

