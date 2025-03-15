import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Scraper Test</CardTitle>
            <CardDescription>Test the Firecrawl scraper with specific URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test the scraper with any URL and store name to see if it can extract egg prices correctly.</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/scraper-test" passHref>
              <Button>Go to Scraper Test</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Sample Scrape</CardTitle>
            <CardDescription>Run a sample scrape of LA stores</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Scrape a representative sample of stores in Los Angeles to test the scraper at scale.</p>
          </CardContent>
          <CardFooter>
            <Link href="/api/cron/scrape-la-sample" passHref>
              <Button>Run Sample Scrape</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Latest Prices</CardTitle>
            <CardDescription>View the latest egg prices</CardDescription>
          </CardHeader>
          <CardContent>
            <p>See the most recent egg prices that have been scraped from all stores.</p>
          </CardContent>
          <CardFooter>
            <Link href="/api/cheapest-eggs" passHref>
              <Button>View Latest Prices</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

