// lib/scrapers/walmart-scraper.ts
// Walmart-specific scraping logic

import { eggScraperConfig, isMatchingEggProduct } from './egg-scraper';
import { chromium } from 'playwright';

export async function scrapeWalmartEggs(storeId: string, state: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to Walmart eggs page for this store
    await page.goto(`https://www.walmart.com/browse/food/eggs/976759_976791_9991568?facet=retailer:Walmart&storeId=${storeId}`);
    
    // Wait for product grid to load
    await page.waitForSelector('.product-grid-item', { timeout: 30000 });
    
    // Extract all egg products
    const eggProducts = await page.$$eval('.product-grid-item', (products) => {
      return products.map(product => {
        const titleElement = product.querySelector('.product-title-link');
        const priceElement = product.querySelector('.price-main');
        const sizeElement = product.querySelector('.product-variant-swatch');
        
        return {
          title: titleElement ? titleElement.textContent.trim() : '',
          price: priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9.]/g, '')) : 0,
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
      retailer: 'walmart',
      storeId,
      state,
      regularPrice: regularAvgPrice,
      organicPrice: organicAvgPrice,
      regularSampleSize: regularEggs.length,
      organicSampleSize: organicEggs.length,
      scrapedAt: new Date()
    };
  } catch (error) {
    console.error(`Error scraping Walmart store ${storeId}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}
