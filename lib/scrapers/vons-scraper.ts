import { BaseScraper } from "./base-scraper"

export class VonsScraper extends BaseScraper {
  constructor() {
    super({
      name: "Vons",
      regularEggUrl: "https://www.vons.com/shop/product-details.970041.html",
      regularEggSelector: ".product-price",
      organicEggUrl: null, // Add organic URL if available
      organicEggSelector: null,
    })
  }
}

