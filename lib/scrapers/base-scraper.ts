export interface ScraperConfig {
  name: string;
  regularEggUrl: string | null;
  regularEggSelector: string | null;
  organicEggUrl: string | null;
  organicEggSelector: string | null;
}

export class BaseScraper {
  name: string;
  regularEggUrl: string | null;
  regularEggSelector: string | null;
  organicEggUrl: string | null;
  organicEggSelector: string | null;

  constructor(config: ScraperConfig) {
    this.name = config.name;
    this.regularEggUrl = config.regularEggUrl;
    this.regularEggSelector = config.regularEggSelector;
    this.organicEggUrl = config.organicEggUrl;
    this.organicEggSelector = config.organicEggSelector;
  }

  async scrape(): Promise<{ regular: number | null; organic: number | null }> {
    // This is a placeholder implementation that doesn't use Playwright
    console.log(`Placeholder scraper for ${this.name}`);
    
    // Generate random placeholder prices for demonstration
    const regularPrice = this.regularEggUrl ? 3 + Math.random() * 2 : null;
    const organicPrice = this.organicEggUrl ? 5 + Math.random() * 3 : null;
    
    return {
      regular: regularPrice ? parseFloat(regularPrice.toFixed(2)) : null,
      organic: organicPrice ? parseFloat(organicPrice.toFixed(2)) : null,
    };
  }
}
