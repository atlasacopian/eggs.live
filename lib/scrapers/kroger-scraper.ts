import { BaseScraper } from "./base-scraper";

export class KrogerScraper extends BaseScraper {
  constructor() {
    super({
      name: "Kroger",
      regularEggUrl: "https://www.kroger.com/p/kroger-grade-a-large-eggs/0001111060933",
      regularEggSelector: ".kds-Price-promotional, .kds-Price-regular",
      organicEggUrl: "https://www.kroger.com/p/simple-truth-organic-cage-free-large-brown-eggs/0001111087374",
      organicEggSelector: ".kds-Price-promotional, .kds-Price-regular",
    });
  }
}
