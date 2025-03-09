import { BaseScraper } from "./base-scraper";

export class WinnDixieScraper extends BaseScraper {
  constructor() {
    super({
      name: "Winn-Dixie",
      regularEggUrl: "https://www.winndixie.com/shop/product-details/winn-dixie-grade-a-large-eggs-12-ct-00021140980018",
      regularEggSelector: ".price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
