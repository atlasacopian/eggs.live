import { ZipSearch } from "@/components/zip-search"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">eggs.live</h1>
      <p className="text-xl text-gray-600 mb-8">Find egg prices near you in Los Angeles</p>

      <ZipSearch />
    </div>
  )
}

