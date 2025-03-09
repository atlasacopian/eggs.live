import { BaseScraper } from "./base-scraper"

export class Food4LessScraper extends BaseScraper {
  constructor() {
    super({
      name: "Food 4 Less",
      regularEggUrl: "https://www.food4less.com/p/kroger-grade-a-large-eggs/0001111060933",
      regularEggSelector: ".kds-Price-promotional, .kds-Price-regular",
      organicEggUrl: "https://www.food4less.com/p/simple-truth-organic-cage-free-large-brown-eggs/0001111087374",
      organicEggSelector: ".kds-Price-promotional, .kds-Price-regular",
    })
  }
}
