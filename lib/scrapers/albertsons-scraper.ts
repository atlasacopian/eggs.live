import { BaseScraper } from "./base-scraper"

export class AlbertsonsScraper extends BaseScraper {
  constructor() {
    super({
      name: "Albertsons",
      regularEggUrl: "https://www.albertsons.com/shop/product-details.970041.html",
      regularEggSelector: ".product-price",
      organicEggUrl: null,
      organicEggSelector: null,
    })
  }
}

