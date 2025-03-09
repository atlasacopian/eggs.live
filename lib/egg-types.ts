// lib/egg-types.ts
// Defines the egg types we're tracking

export const eggTypes = {
  REGULAR: {
    id: 'REGULAR',
    name: 'Regular Eggs',
    description: 'Grade A Large White Eggs (Dozen)',
    searchTerms: ['grade a eggs', 'large white eggs', 'dozen eggs'],
    excludeTerms: ['organic', 'free range', 'cage free', 'pasture raised'],
    defaultPrice: 3.50, // Fallback if scraping fails
  },
  ORGANIC: {
    id: 'ORGANIC',
    name: 'Organic Eggs',
    description: 'USDA Certified Organic Large White Eggs (Dozen)',
    searchTerms: ['organic eggs', 'organic large eggs', 'organic white eggs'],
    includeTerms: ['usda organic', 'certified organic'],
    defaultPrice: 6.38, // Fallback if scraping fails
  }
}

// Retailer-specific product identifiers for each egg type
export const retailerProductMap = {
  walmart: {
    REGULAR: {
      productIds: ['12345', '23456'], // Example product IDs
      urlPatterns: [
        '/grocery/eggs/regular-eggs',
        '/ip/Great-Value-Large-White-Eggs-12-Count'
      ]
    },
    ORGANIC: {
      productIds: ['34567', '45678'],
      urlPatterns: [
        '/grocery/eggs/organic-eggs',
        '/ip/Great-Value-Organic-Cage-Free-Large-White-Eggs-12-Count'
      ]
    }
  },
  kroger: {
    REGULAR: {
      productIds: ['0001111042195', '0001111042196'],
      urlPatterns: [
        '/p/kroger-grade-a-large-eggs'
      ]
    },
    ORGANIC: {
      productIds: ['0001111089597', '0001111089598'],
      urlPatterns: [
        '/p/simple-truth-organic-cage-free-large-brown-eggs'
      ]
    }
  },
  // Add entries for all other retailers
}
