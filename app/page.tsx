import EggPriceTracker from "@/components/egg-price-tracker"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "eggs.live - US Egg Price Tracker",
  description: "Track real-time egg prices across major US retailers",
}

export default function Home() {
  return (
    <main>
      <EggPriceTracker />
    </main>
  )
}

