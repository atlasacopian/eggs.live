import { BaseScraper } from "./base-scraper";

export class SproutsScraper extends BaseScraper {
  constructor() {
    super({
      name: "Sprouts",
      regularEggUrl: "https://shop.sprouts.com/product/33795/cage-free-large-grade-a-brown-eggs",
      regularEggSelector: ".product-price",
      organicEggUrl: "https://shop.sprouts.com/product/33796/sprouts-organic-cage-free-large-grade-a-brown-eggs",
      organicEggSelector: ".product-price",
    });
  }
}
