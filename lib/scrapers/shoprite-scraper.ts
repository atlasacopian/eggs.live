import { BaseScraper } from "./base-scraper";

export class ShopRiteScraper extends BaseScraper {
  constructor() {
    super({
      name: "ShopRite",
      regularEggUrl: "https://www.shoprite.com/sm/pickup/rsid/3000/product/grade-a-large-eggs-00041190455616",
      regularEggSelector: ".ProductPrice",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
