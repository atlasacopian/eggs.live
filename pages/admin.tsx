"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Database, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<any>(null)
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [adminKey, setAdminKey] = useState("")

  // Check database status
  const checkDatabase = async () => {
    setDbLoading(true)
    try {
      const response = await fetch("/api/db-check")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ success: false, error: "Failed to check database" })
    } finally {
      setDbLoading(false)
    }
  }

  // Run manual LA scrape
  const runLAScrape = async () => {
    if (!adminKey) {
      alert("Please enter your admin key")
      return
    }

    setScrapeLoading(true)
    try {
      const response = await fetch(`/api/scrape-la?key=${adminKey}`)
      const data = await response.json()
      setScrapeStatus(data)
    } catch (error) {
      setScrapeStatus({ success: false, error: "Failed to run scraper" })
    } finally {
      setScrapeLoading(false)
    }
  }

  // Run database migration
  const runMigration = async () => {
    setDbLoading(true)
    try {
      const response = await fetch("/api/run-migration")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ success: false, error: "Failed to run migration" })
    } finally {
      setDbLoading(false)
    }
  }

  // Seed database with test data
  const seedDatabase = async () => {
    setDbLoading(true)
    try {
      const response = await fetch("/api/seed")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ success: false, error: "Failed to seed database" })
    } finally {
      setDbLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Enter your admin key to access restricted functionality:</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Admin key"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="database">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="database">Database Management</TabsTrigger>
            <TabsTrigger value="scraper">Scraper Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button onClick={checkDatabase} disabled={dbLoading}>
                    {dbLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Check Database Status
                  </Button>
                  <Button onClick={runMigration} disabled={dbLoading}>
                    {dbLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Run Database Migration
                  </Button>
                  <Button onClick={seedDatabase} disabled={dbLoading}>
                    {dbLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Seed Test Data
                  </Button>
                  <Link href="/api/verify-schema" target="_blank">
                    <Button variant="outline" className="w-full">
                      Verify Schema
                    </Button>
                  </Link>
                </div>

                {dbStatus && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Database Status:</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(dbStatus, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scraper" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Scraper Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>Run scrapers manually to collect egg price data:</p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Button onClick={runLAScrape} disabled={scrapeLoading || !adminKey} className="w-full">
                      {scrapeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Run LA Scraper
                    </Button>

                    <Link href="/api/debug" target="_blank">
                      <Button variant="outline" className="w-full">
                        View Debug Data
                      </Button>
                    </Link>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Link href="/la/coverage">
                      <Button variant="outline" className="w-full">
                        View LA Coverage
                      </Button>
                    </Link>

                    <Link href="/la">
                      <Button variant="outline" className="w-full">
                        View LA Prices
                      </Button>
                    </Link>
                  </div>

                  {scrapeStatus && (
                    <div className="mt-2">
                      <h3 className="font-medium mb-2">Scraper Status:</h3>
                      <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                        <pre className="text-xs">{JSON.stringify(scrapeStatus, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

