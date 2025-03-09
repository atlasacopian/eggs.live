import { BaseScraper } from "./base-scraper";

export class WholeFoodsScraper extends BaseScraper {
  constructor() {
    super({
      name: "Whole Foods",
      regularEggUrl: "https://www.amazon.com/365-Everyday-Value-Large-Brown/dp/B07QK1VDPT/",
      regularEggSelector: ".a-price .a-offscreen",
      organicEggUrl: "https://www.amazon.com/365-Everyday-Value-Organic-Large/dp/B07QK1VDPT/",
      organicEggSelector: ".a-price .a-offscreen",
    });
  }
}
