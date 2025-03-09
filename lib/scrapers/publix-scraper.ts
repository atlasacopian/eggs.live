import { BaseScraper } from "./base-scraper";

export class PublixScraper extends BaseScraper {
  constructor() {
    super({
      name: "Publix",
      regularEggUrl: "https://www.publix.com/pd/publix-eggs-large/RIO-PCI-114195",
      regularEggSelector: ".reg-price, .sale-price",
      organicEggUrl: null,
      organicEggSelector: null,
    });
  }
}
