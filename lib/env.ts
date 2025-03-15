// Environment variables validation and access

export interface EnvVariables {
  DATABASE_URL: string
  FIRECRAWL_API_KEY?: string
  NODE_ENV: "development" | "production" | "test"
}

export function getEnvVariables(): EnvVariables {
  // Required variables
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  }
}

// Check if we're in a development environment
export function isDevelopment(): boolean {
  return getEnvVariables().NODE_ENV === "development"
}

// Check if we have Firecrawl API key configured
export function hasFirecrawlApiKey(): boolean {
  return !!getEnvVariables().FIRECRAWL_API_KEY
}

