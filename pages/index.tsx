import { EggSearch } from "@/components/egg-search"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-2 text-center">eggs.live</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">Find egg prices near you in Los Angeles</p>

      <EggSearch />
    </div>
  )
}

