// lib/scrapers/kroger-scraper.ts
// Kroger-specific scraping logic

import { eggScraperConfig, isMatchingEggProduct } from './egg-scraper';
import { chromium } from 'playwright';

export async function scrapeKrogerEggs(storeId: string, state: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to Kroger eggs page for this store
    await page.goto(`https://www.kroger.com/pl/eggs/0104?fulfillment=all&storeId=${storeId}`);
    
    // Wait for product grid to load
    await page.waitForSelector('.ProductCard', { timeout: 30000 });
    
    // Extract all egg products
    const eggProducts = await page.$$eval('.ProductCard', (products) => {
      return products.map(product => {
        const titleElement = product.querySelector('.kds-Text--l');
        const priceElement = product.querySelector('.kds-Price');
        const sizeElement = product.querySelector('.kds-Text--s');
        
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
      retailer: 'kroger',
      storeId,
      state,
      regularPrice: regularAvgPrice,
      organicPrice: organicAvgPrice,
      regularSampleSize: regularEggs.length,
      organicSampleSize: organicEggs.length,
      scrapedAt: new Date()
    };
  } catch (error) {
    console.error(`Error scraping Kroger store ${storeId}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}
