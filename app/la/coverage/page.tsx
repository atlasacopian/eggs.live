import { LACoverage } from "@/components/la-coverage"

export default function LACoveragePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Los Angeles Store Coverage</h1>
      <p className="text-gray-600 mb-8">Track egg price coverage across Los Angeles County</p>

      <LACoverage />
    </div>
  )
}

