import { BaseScraper } from "./base-scraper"

export class ErewhonScraper extends BaseScraper {
  constructor() {
    super({
      name: "Erewhon",
      regularEggUrl: "https://www.erewhonmarket.com/products/vital-farms-pasture-raised-large-eggs",
      regularEggSelector: ".product-price .price",
      organicEggUrl: null,
      organicEggSelector: null,
    })
  }
}

