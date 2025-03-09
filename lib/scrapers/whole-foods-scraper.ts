// lib/scrapers/whole-foods-scraper.ts
// Whole Foods-specific scraping logic

import { eggScraperConfig, isMatchingEggProduct } from './egg-scraper';
import { chromium } from 'playwright';

export async function scrapeWholeFoodsEggs(storeId: string, state: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to Whole Foods eggs page for this store
    await page.goto(`https://www.amazon.com/s?k=eggs&i=wholefoods&store-id=${storeId}`);
    
    // Wait for product grid to load
    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 30000 });
    
    // Extract all egg products
    const eggProducts = await page.$$eval('[data-component-type="s-search-result"]', (products) => {
      return products.map(product => {
        const titleElement = product.querySelector('h2');
        const priceElement = product.querySelector('.a-price-whole');
        const priceFractionElement = product.querySelector('.a-price-fraction');
        const sizeElement = product.querySelector('.a-size-base.a-color-secondary');
        
        const priceWhole = priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9.]/g, '')) : 0;
        const priceFraction = priceFractionElement ? parseFloat(priceFractionElement.textContent) / 100 : 0;
        
        return {
          title: titleElement ? titleElement.textContent.trim() : '',
          price: priceWhole + priceFraction,
          size: sizeElement ? sizeElement.textContent.trim() : ''
        };
      });
    });
    
    // Filter and categorize products - STRICTLY 12-count only
    const regularEggs = eggProducts.filter(product => 
      isMatchingEggProduct(product.title, product.size, 'regular')
    );
    
    const organicEggs = eggProducts.filter(product => 
      isMatchingEggProduct(product.title, product.size, 'organic')
    );
    
    // Calculate average prices (not lowest)
    let regularAvgPrice = null;
    if (regularEggs.length > 0) {
      regularAvgPrice = regularEggs.reduce((sum, product) => sum + product.price, 0) / 
                        regularEggs.length;
    }
    
    let organicAvgPrice = null;
    if (organicEggs.length > 0) {
      organicAvgPrice = organicEggs.reduce((sum, product) => sum + product.price, 0) / 
                        organicEggs.length;
    }
    
    return {
      retailer: 'wholefoods',
      storeId,
      state,
      regularPrice: regularAvgPrice,
      organicPrice: organicAvgPrice,
      regularSampleSize: regularEggs.length,
      organicSampleSize: organicEggs.length,
      scrapedAt: new Date()
    };
  } catch (error) {
    console.error(`Error scraping Whole Foods store ${storeId}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}
