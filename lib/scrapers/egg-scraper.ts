import { BaseScraper } from "./base-scraper";

// This is a generic egg scraper that can be used as a fallback
export class EggScraper extends BaseScraper {
  constructor() {
    super({
      name: "Generic Egg Scraper",
      regularEggUrl: null,
      regularEggSelector: null,
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
