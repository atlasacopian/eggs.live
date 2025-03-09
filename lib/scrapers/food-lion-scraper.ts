import { BaseScraper } from "./base-scraper";

export class FoodLionScraper extends BaseScraper {
  constructor() {
    super({
      name: "Food Lion",
      regularEggUrl: "https://shop.foodlion.com/product/large-white-eggs/00041130007015",
      regularEggSelector: ".product-price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
