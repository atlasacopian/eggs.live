"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CoverageData {
  date: string
  totalPossibleLocations: number
  totalScrapedLocations: number
  overallCoverage: number
  chainCoverage: Array<{
    chain: string
    possibleLocations: number
    scrapedLocations: number
    coverage: number
    scrapedZipCodes: string[]
  }>
  totalChains: number
  totalZipCodes: number
}

export function LACoverage() {
  const [coverageData, setCoverageData] = useState<CoverageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCoverage() {
      try {
        setLoading(true)
        const response = await fetch("/api/la-coverage")

        if (!response.ok) {
          throw new Error("Failed to fetch LA coverage data")
        }

        const data = await response.json()
        setCoverageData(data)
      } catch (err) {
        console.error("Error fetching LA coverage:", err)
        setError("Failed to load coverage data")
      } finally {
        setLoading(false)
      }
    }

    fetchCoverage()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading LA coverage data...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>
  }

  if (!coverageData) {
    return <div className="text-center py-8">No coverage data available</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LA Store Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Overall Coverage</span>
                <span className="text-sm font-medium">{coverageData.overallCoverage}%</span>
              </div>
              <Progress value={coverageData.overallCoverage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {coverageData.totalScrapedLocations} of {coverageData.totalPossibleLocations} possible locations
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coverageData.chainCoverage.map((chain) => (
                <div key={chain.chain} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{chain.chain}</span>
                    <span className="text-sm font-medium">{chain.coverage}%</span>
                  </div>
                  <Progress value={chain.coverage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {chain.scrapedLocations} of {chain.possibleLocations} locations
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coverage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Chains</p>
                <p className="text-2xl font-bold">{coverageData.totalChains}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Zip Codes</p>
                <p className="text-2xl font-bold">{coverageData.totalZipCodes}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Chain Coverage Breakdown</p>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-muted/50 p-2 text-sm font-medium">
                  <div className="col-span-4">Chain</div>
                  <div className="col-span-3">Coverage</div>
                  <div className="col-span-5">Locations</div>
                </div>
                <div className="divide-y">
                  {coverageData.chainCoverage
                    .sort((a, b) => b.coverage - a.coverage)
                    .map((chain) => (
                      <div key={chain.chain} className="grid grid-cols-12 p-2 text-sm">
                        <div className="col-span-4 font-medium">{chain.chain}</div>
                        <div className="col-span-3">
                          <span
                            className={
                              chain.coverage > 50
                                ? "text-green-600"
                                : chain.coverage > 20
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {chain.coverage}%
                          </span>
                        </div>
                        <div className="col-span-5 text-muted-foreground">
                          {chain.scrapedLocations} / {chain.possibleLocations}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

