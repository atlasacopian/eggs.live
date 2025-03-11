"use client"

interface EggTypeSelectorProps {
  selected: string
  onChange: (type: string) => void
}

export function EggTypeSelector({ selected, onChange }: EggTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onChange("regular")}
        className={`w-full rounded-lg border p-4 text-left transition-all ${
          selected === "regular" ? "border-black bg-black text-white" : "hover:border-gray-300"
        }`}
      >
        <div className="font-medium">Regular Eggs</div>
        <div className={`text-sm ${selected === "regular" ? "text-gray-300" : "text-gray-500"}`}>
          Conventional, non-organic eggs
        </div>
      </button>

      <button
        onClick={() => onChange("organic")}
        className={`w-full rounded-lg border p-4 text-left transition-all ${
          selected === "organic" ? "border-black bg-black text-white" : "hover:border-gray-300"
        }`}
      >
        <div className="font-medium">Organic Eggs</div>
        <div className={`text-sm ${selected === "organic" ? "text-gray-300" : "text-gray-500"}`}>
          USDA certified organic eggs
        </div>
      </button>
    </div>
  )
}

