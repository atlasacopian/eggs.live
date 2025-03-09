import { BaseScraper } from "./base-scraper";

export class GiantEagleScraper extends BaseScraper {
  constructor() {
    super({
      name: "Giant Eagle",
      regularEggUrl: "https://shop.gianteagle.com/waterworks/product/00041130007015",
      regularEggSelector: ".product__price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
