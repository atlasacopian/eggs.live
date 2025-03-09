// lib/store-coverage.ts
// Defines the store coverage for our egg price scraping

export const storeLocations = {
  // Define all 50 US states
  states: [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ],
  
  // Store location mapping - 2 locations per state for each retailer
  retailers: {
    walmart: {
      storeIds: {
        'AL': ['1234', '5678'],
        'AK': ['2345', '6789'],
        // Add entries for all 50 states with 2 store IDs each
      },
      urlTemplate: 'https://www.walmart.com/store/[STORE_ID]/grocery/eggs'
    },
    kroger: {
      storeIds: {
        // Kroger isn't in all 50 states, so we'll map the states they do operate in
        'AL': ['1001', '1002'],
        'AZ': ['2001', '2002'],
        // Add entries for all states where Kroger operates
      },
      urlTemplate: 'https://www.kroger.com/stores/grocery/eggs/[STORE_ID]'
    },
    // Add entries for all other retailers
  }
}

// Scraping schedule configuration
export const scrapingConfig = {
  frequency: 'daily',
  timeOfDay: '02:00', // 2 AM to avoid peak traffic times
  timeout: 30000, // 30 seconds per request
  retryAttempts: 3,
  concurrencyLimit: 5, // Limit parallel requests to avoid IP blocks
  userAgentRotation: true // Rotate user agents to avoid detection
}
