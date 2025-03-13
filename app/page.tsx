"use client"
import CurrentPrice from "@/components/current-price"
import { Button } from "@/components/ui/button"

export default function Home() {
  // const [location, setLocation] = useState<"nationwide" | "echo-park">("nationwide")
  // const [eggType, setEggType] = useState<"regular" | "organic">("regular")

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">eggs.live</h1>
        <p className="text-xl">Real-time egg prices across the US and Echo Park, Los Angeles</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 mb-6">
          <Button variant="default">Nationwide</Button>
          <Button variant="outline">Echo Park / Silver Lake</Button>
        </div>

        <CurrentPrice eggType="regular" />
      </div>
    </main>
  )
}

