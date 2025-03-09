export interface ScraperConfig {
  name: string
  regularEggUrl: string | null
  regularEggSelector: string | null
  organicEggUrl: string | null
  organicEggSelector: string | null
}

export class BaseScraper {
  name: string
  regularEggUrl: string | null
  regularEggSelector: string | null
  organicEggUrl: string | null
  organicEggSelector: string | null

  constructor(config: ScraperConfig) {
    this.name = config.name
    this.regularEggUrl = config.regularEggUrl
    this.regularEggSelector = config.regularEggSelector
    this.organicEggUrl = config.organicEggUrl
    this.organicEggSelector = config.organicEggSelector
  }

  async scrape(): Promise<{ regular: number | null; organic: number | null }> {
    // This is a placeholder implementation
    console.log(`Placeholder scraper for ${this.name}`)
    return {
      regular: null,
      organic: null,
    }
  }
}

export type { ScraperConfig }

