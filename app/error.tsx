"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-gray-500">{error.message || "There was an error connecting to the database"}</p>
        <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Try again
        </button>
      </div>
    </div>
  )
}

