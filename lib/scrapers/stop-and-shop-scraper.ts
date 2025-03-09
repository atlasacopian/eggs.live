import { BaseScraper } from "./base-scraper";

export class StopAndShopScraper extends BaseScraper {
  constructor() {
    super({
      name: "Stop & Shop",
      regularEggUrl: "https://stopandshop.com/product-search/large%20eggs",
      regularEggSelector: ".current-price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
