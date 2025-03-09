import { BaseScraper } from "./base-scraper";

export class CostcoScraper extends BaseScraper {
  constructor() {
    super({
      name: "Costco",
      regularEggUrl: "https://www.costco.com/kirkland-signature-cage-free-usda-aa-large-eggs%2c-24-count.product.100406922.html",
      regularEggSelector: ".price",
      organicEggUrl: "https://www.costco.com/kirkland-signature-usda-organic-large-eggs%2C-24-count.product.100406922.html",
      organicEggSelector: ".price",
    });
  }
}
