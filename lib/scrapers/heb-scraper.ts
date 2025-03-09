import { BaseScraper } from "./base-scraper"

export class HEBScraper extends BaseScraper {
  constructor() {
    super({
      name: "H-E-B",
      regularEggUrl: "https://www.heb.com/product-detail/h-e-b-grade-a-large-eggs/1064033",
      regularEggSelector: ".prod-price",
      organicEggUrl: null,
      organicEggSelector: null,
    })
  }
}

