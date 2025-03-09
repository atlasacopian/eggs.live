import { BaseScraper } from "./base-scraper";

export class RalphsScraper extends BaseScraper {
  constructor() {
    super({
      name: "Ralphs",
      regularEggUrl: "https://www.ralphs.com/p/large-eggs/0001111060933",
      regularEggSelector: ".kds-Price-promotional, .kds-Price-regular",
      organicEggUrl: "https://www.ralphs.com/p/simple-truth-organic-cage-free-large-brown-eggs/0001111087374",
      organicEggSelector: ".kds-Price-promotional, .kds-Price-regular",
    });
  }
}
