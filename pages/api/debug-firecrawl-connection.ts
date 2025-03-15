import type { NextApiRequest, NextApiResponse } from "next"

interface EndpointTest {
  url: string
  method: "GET" | "POST"
  headers?: Record<string, string>
  body?: any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY

    // Basic diagnostic info
    const info = {
      timestamp: new Date().toISOString(),
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 5)}...` : "Not set",
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || "unknown",
      nodeVersion: process.version,
    }

    if (!apiKey) {
      return res.status(400).json({
        ...info,
        success: false,
        error: "API key not configured",
        message: "Please set up the FIRECRAWL_API_KEY environment variable",
      })
    }

    // Define test endpoints with different variations
    const endpoints: EndpointTest[] = [
      // Test different base URLs with status endpoint
      {
        url: "https://api.firecrawl.com/v1/status",
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      {
        url: "https://api.firecrawl.dev/v1/status",
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      {
        url: "https://api.firecrawl.com/status",
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      // Test with different auth header formats
      {
        url: "https://api.firecrawl.com/status",
        method: "GET",
        headers: { Authorization: `Token ${apiKey}` },
      },
      {
        url: "https://api.firecrawl.com/status",
        method: "GET",
        headers: { "X-API-Key": apiKey },
      },
      // Test scrape endpoint
      {
        url: "https://api.firecrawl.com/v1/scrape",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: {
          url: "https://example.com",
          timeout: 5000,
        },
      },
    ]

    // Test each endpoint
    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const start = Date.now()
        try {
          const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: endpoint.headers,
            body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
          })

          const duration = Date.now() - start
          const text = await response.text()
          let json = null

          try {
            json = JSON.parse(text)
          } catch (e) {
            // Response wasn't JSON
          }

          return {
            endpoint: endpoint.url,
            method: endpoint.method,
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            duration,
            headers: Object.fromEntries(response.headers.entries()),
            response: {
              text: text.substring(0, 500), // First 500 chars only
              json,
            },
          }
        } catch (error) {
          return {
            endpoint: endpoint.url,
            method: endpoint.method,
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    // Analyze results
    const successfulEndpoint = results.find((r) => r.status === "fulfilled" && r.value.success)

    // Network-level diagnostics
    const networkInfo = {
      dns: await testDNS("api.firecrawl.com"),
      ping: await testConnection("api.firecrawl.com"),
    }

    return res.status(200).json({
      ...info,
      success: !!successfulEndpoint,
      message: successfulEndpoint ? "Found working Firecrawl endpoint" : "All connection attempts failed",
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason })),
      networkDiagnostics: networkInfo,
      recommendations: generateRecommendations(results, networkInfo),
    })
  } catch (error) {
    console.error("Firecrawl connection diagnostic error:", error)
    return res.status(500).json({
      success: false,
      error: "Diagnostic test failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : undefined,
    })
  }
}

async function testDNS(hostname: string): Promise<{ success: boolean; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null)

    clearTimeout(timeoutId)

    return {
      success: !!response,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "DNS lookup failed",
    }
  }
}

async function testConnection(hostname: string): Promise<{ success: boolean; latency?: number; error?: string }> {
  try {
    const start = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    await fetch(`https://${hostname}`, {
      method: "HEAD",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - start

    return {
      success: true,
      latency,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    }
  }
}

function generateRecommendations(
  results: PromiseSettledResult<any>[],
  networkInfo: { dns: { success: boolean }; ping: { success: boolean } },
): string[] {
  const recommendations: string[] = []

  // Check for common issues
  const hasAuthErrors = results.some(
    (r) => r.status === "fulfilled" && (r.value.status === 401 || r.value.status === 403),
  )
  const hasNotFoundErrors = results.some((r) => r.status === "fulfilled" && r.value.status === 404)
  const hasNetworkErrors = results.some(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error?.includes("fetch failed")),
  )

  if (!networkInfo.dns.success) {
    recommendations.push("DNS resolution failed. Check if api.firecrawl.com is accessible from your network.")
  }

  if (!networkInfo.ping.success) {
    recommendations.push(
      "Cannot establish connection to Firecrawl API. Check your network connectivity and firewall settings.",
    )
  }

  if (hasAuthErrors) {
    recommendations.push("Authentication errors detected. Verify your API key is valid and properly formatted.")
  }

  if (hasNotFoundErrors) {
    recommendations.push(
      "404 errors indicate endpoint URLs might have changed. Check Firecrawl documentation for current endpoints.",
    )
  }

  if (hasNetworkErrors) {
    recommendations.push("Network errors detected. Check if your deployment region has access to Firecrawl API.")
  }

  if (recommendations.length === 0) {
    recommendations.push("No specific issues identified. Contact Firecrawl support for assistance.")
  }

  return recommendations
}

