import { BaseScraper } from "./base-scraper"

export class MeijerScraper extends BaseScraper {
  constructor() {
    super({
      name: "Meijer",
      regularEggUrl: "https://www.meijer.com/shopping/product/meijer-large-white-eggs-12-ct/70882510182.html",
      regularEggSelector: ".price-container .price",
      organicEggUrl: null,
      organicEggSelector: null,
    })
  }
}

