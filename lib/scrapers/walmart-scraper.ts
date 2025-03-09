import { BaseScraper } from "./base-scraper";

export class WalmartScraper extends BaseScraper {
  constructor() {
    super({
      name: "Walmart",
      regularEggUrl: "https://www.walmart.com/ip/Great-Value-Large-White-Eggs-12-Count/145051970",
      regularEggSelector: ".f6-bu.f6-bv.f6-bw",
      organicEggUrl: "https://www.walmart.com/ip/Great-Value-Organic-Cage-Free-Large-Brown-Eggs-12-Count/51259469",
      organicEggSelector: ".f6-bu.f6-bv.f6-bw",
    });
  }
}
