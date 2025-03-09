import { BaseScraper } from "./base-scraper";

export class TargetScraper extends BaseScraper {
  constructor() {
    super({
      name: "Target",
      regularEggUrl: "https://www.target.com/p/grade-a-large-eggs-12ct-good-38-gather-8482/-/A-14713534",
      regularEggSelector: '[data-test="product-price"]',
      organicEggUrl: "https://www.target.com/p/organic-cage-free-large-grade-a-eggs-12ct-good-38-gather-8482/-/A-14713537",
      organicEggSelector: '[data-test="product-price"]',
    });
  }
}
