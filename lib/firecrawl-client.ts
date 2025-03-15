// Firecrawl API client for web scraping

interface FirecrawlOptions {
  apiKey: string
  maxRetries?: number
  timeout?: number
}

interface FirecrawlResponse {
  url: string
  content: string
  status: number
  headers: Record<string, string>
  json?: any
  error?: string
}

export class FirecrawlClient {
  private apiKey: string
  private baseUrl = "https://api.firecrawl.dev"
  private maxRetries: number
  private timeout: number

  constructor(options: FirecrawlOptions) {
    this.apiKey = options.apiKey
    this.maxRetries = options.maxRetries || 3
    this.timeout = options.timeout || 30000 // 30 seconds default
  }

  /**
   * Scrape a webpage using Firecrawl
   */
  async scrape(
    url: string,
    options: {
      waitForSelector?: string
      javascript?: boolean
      proxy?: boolean
      geolocation?: string
    } = {},
  ): Promise<FirecrawlResponse> {
    const endpoint = `${this.baseUrl}/v1/scrape`

    const requestBody = {
      url,
      javascript: options.javascript !== false, // Enable JS by default
      waitForSelector: options.waitForSelector,
      proxy: options.proxy || false,
      geolocation: options.geolocation,
    }

    let attempts = 0
    let lastError: Error | null = null

    while (attempts < this.maxRetries) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(this.timeout),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Firecrawl API error (${response.status}): ${errorText}`)
        }

        const data = await response.json()
        return data as FirecrawlResponse
      } catch (error) {
        lastError = error as Error
        attempts++

        // Wait before retrying (exponential backoff)
        if (attempts < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
        }
      }
    }

    throw lastError || new Error("Failed to scrape URL after multiple attempts")
  }

  /**
   * Extract structured data from a webpage using Firecrawl's extraction API
   */
  async extract(
    url: string,
    schema: Record<string, any>,
    options: {
      javascript?: boolean
      proxy?: boolean
    } = {},
  ): Promise<any> {
    const endpoint = `${this.baseUrl}/v1/extract`

    const requestBody = {
      url,
      schema,
      javascript: options.javascript !== false,
      proxy: options.proxy || false,
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Firecrawl extraction API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  }
}

