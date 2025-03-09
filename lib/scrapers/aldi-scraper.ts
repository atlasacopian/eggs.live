import { BaseScraper } from "./base-scraper";

export class AldiScraper extends BaseScraper {
  constructor() {
    super({
      name: "Aldi",
      regularEggUrl: "https://www.aldi.us/en/products/dairy-eggs/eggs/",
      regularEggSelector: ".price-wrapper .price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
