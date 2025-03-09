// lib/scrapers/egg-scraper.ts
// Core egg scraping utilities

export const eggScraperConfig = {
  // Specific egg products we're tracking
  targetProducts: {
    regular: {
      count: 12, // Strictly 12-count only
      keywords: ['large eggs', 'grade a eggs', 'white eggs', 'brown eggs', '12 count', 'dozen'],
      excludeKeywords: ['organic', 'free-range', 'cage-free', 'omega', '6 count', '18 count', 'half dozen']
    },
    organic: {
      count: 12, // Strictly 12-count only
      keywords: ['organic eggs', 'organic large eggs', '12 count', 'dozen'],
      excludeKeywords: ['extra large', 'jumbo', '6 count', '18 count', 'half dozen']
    }
  },
  
  // Price calculation method
  priceCalculation: 'AVERAGE', // Not 'LOWEST'
  
  // Number of products to sample for average
  sampleSize: 3, // Take average of 3 matching products if available
  
  // Strict 12-count enforcement
  strictCountEnforcement: true
}

// Helper to determine if a product matches our criteria
export function isMatchingEggProduct(
  productTitle: string, 
  productSize: string,
  type: 'regular' | 'organic'
): boolean {
  const config = eggScraperConfig.targetProducts[type];
  const title = productTitle.toLowerCase();
  const size = productSize.toLowerCase();
  const combined = title + ' ' + size;
  
  // Strictly enforce 12-count only
  const countMatch = 
    combined.includes('12 count') || 
    combined.includes('12-count') || 
    combined.includes('dozen') ||
    combined.includes('12ct') ||
    combined.includes('12 ct') ||
    combined.includes('12pk') ||
    combined.includes('12 pk');
  
  // Explicitly exclude other counts
  const wrongCountMatch =
    combined.includes('6 count') ||
    combined.includes('6-count') ||
    combined.includes('6ct') ||
    combined.includes('6 ct') ||
    combined.includes('half dozen') ||
    combined.includes('18 count') ||
    combined.includes('18-count') ||
    combined.includes('18ct') ||
    combined.includes('18 ct') ||
    combined.includes('24 count') ||
    combined.includes('24-count');
  
  if (!countMatch || wrongCountMatch) {
    return false;
  }
  
  // Check for keywords
  const hasKeyword = config.keywords.some(keyword => combined.includes(keyword));
  
  // Check for exclude keywords
  const hasExcludeKeyword = config.excludeKeywords.some(keyword => combined.includes(keyword));
  
  return hasKeyword && !hasExcludeKeyword;
}
