// Base scraper
export * from "./base-scraper"

// Individual store scrapers
export * from "./aldi-scraper"
export * from "./albertsons-scraper"
export * from "./costco-scraper"
export * from "./egg-scraper"
export * from "./erewhon-scraper"
export * from "./food-lion-scraper"
export * from "./food4less-scraper"
export * from "./giant-eagle-scraper"
export * from "./heb-scraper"
export * from "./kroger-scraper"
export * from "./meijer-scraper"
export * from "./publix-scraper"
export * from "./ralphs-scraper"
export * from "./safeway-scraper"
export * from "./shoprite-scraper"
export * from "./sprouts-scraper"
export * from "./stop-and-shop-scraper"
export * from "./target-scraper"
export * from "./trader-joes-scraper"
export * from "./walmart-scraper"
export * from "./wegmans-scraper"
export * from "./whole-foods-scraper"
export * from "./winn-dixie-scraper"
export * from "./vons-scraper"

// Scheduler
export * from "./scheduler"

// Export a list of all scrapers for easy initialization
import { AldiScraper } from "./aldi-scraper"
import { AlbertsonsScraper } from "./albertsons-scraper"
import { CostcoScraper } from "./costco-scraper"
import { ErewhonScraper } from "./erewhon-scraper"
import { FoodLionScraper } from "./food-lion-scraper"
import { Food4LessScraper } from "./food4less-scraper"
import { GiantEagleScraper } from "./giant-eagle-scraper"
import { HEBScraper } from "./heb-scraper"
import { KrogerScraper } from "./kroger-scraper"
import { MeijerScraper } from "./meijer-scraper"
import { PublixScraper } from "./publix-scraper"
import { RalphsScraper } from "./ralphs-scraper"
import { SafewayScraper } from "./safeway-scraper"
import { ShopRiteScraper } from "./shoprite-scraper"
import { SproutsScraper } from "./sprouts-scraper"
import { StopAndShopScraper } from "./stop-and-shop-scraper"
import { TargetScraper } from "./target-scraper"
import { TraderJoesScraper } from "./trader-joes-scraper"
import { WalmartScraper } from "./walmart-scraper"
import { WegmansScraper } from "./wegmans-scraper"
import { WholeFoodsScraper } from "./whole-foods-scraper"
import { WinnDixieScraper } from "./winn-dixie-scraper"
import { VonsScraper } from "./vons-scraper"
import type { BaseScraper } from "./base-scraper"

export const getAllScrapers = (): BaseScraper[] => {
  return [
    new AldiScraper(),
    new AlbertsonsScraper(),
    new CostcoScraper(),
    new ErewhonScraper(),
    new FoodLionScraper(),
    new Food4LessScraper(),
    new GiantEagleScraper(),
    new HEBScraper(),
    new KrogerScraper(),
    new MeijerScraper(),
    new PublixScraper(),
    new RalphsScraper(),
    new SafewayScraper(),
    new ShopRiteScraper(),
    new SproutsScraper(),
    new StopAndShopScraper(),
    new TargetScraper(),
    new TraderJoesScraper(),
    new VonsScraper(),
    new WalmartScraper(),
    new WegmansScraper(),
    new WholeFoodsScraper(),
    new WinnDixieScraper(),
  ]
}

// Re-export the main scraper functions
export { scrapeEggPrices, seedHistoricalData } from "../scrapers"
