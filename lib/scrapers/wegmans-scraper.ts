import { BaseScraper } from "./base-scraper";

export class WegmansScraper extends BaseScraper {
  constructor() {
    super({
      name: "Wegmans",
      regularEggUrl: "https://shop.wegmans.com/product/46709/wegmans-grade-a-large-eggs",
      regularEggSelector: '[data-testid="product-price"]',
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
