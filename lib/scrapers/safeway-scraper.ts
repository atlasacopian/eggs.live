import { BaseScraper } from "./base-scraper";

export class SafewayScraper extends BaseScraper {
  constructor() {
    super({
      name: "Safeway",
      regularEggUrl: "https://www.safeway.com/shop/product-details.970041.html",
      regularEggSelector: ".product-price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
