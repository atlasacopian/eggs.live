import { BaseScraper } from "./base-scraper";

export class TraderJoesScraper extends BaseScraper {
  constructor() {
    super({
      name: "Trader Joe's",
      regularEggUrl: "https://www.traderjoes.com/home/products/pdp/cage-free-large-eggs-057333",
      regularEggSelector: ".ProductPrice_productPrice__price__3-50O",
      organicEggUrl: "https://www.traderjoes.com/home/products/pdp/organic-eggs-057334",
      organicEggSelector: ".ProductPrice_productPrice__price__3-50O",
    });
  }
}
