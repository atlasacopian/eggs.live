// lib/scrapers/scheduler.ts
// Scheduler for daily egg price scraping

import { storeLocations, scrapingConfig } from '../store-coverage';
import { prisma } from '../db';
import { scrapeStore } from './base-scraper';

export async function scheduleDailyScraping() {
  console.log('Starting daily egg price scraping job');
  
  // Track overall statistics
  const stats = {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    startTime: new Date(),
    endTime: null,
    byRetailer: {}
  };
  
  // Process each retailer
  for (const [retailer, retailerConfig] of Object.entries(storeLocations.retailers)) {
    const retailerStats = {
      attempts: 0,
      successful: 0,
      failed: 0,
      statesCovered: 0,
      prices: {
        regular: [],
        organic: []
      }
    };
    
    stats.byRetailer[retailer] = retailerStats;
    
    // Process each state
    for (const state of storeLocations.states) {
      const storeIds = retailerConfig.storeIds[state];
      if (!storeIds || storeIds.length === 0) continue;
      
      let stateSuccess = false;
      
      // Try to scrape 2 locations per state
      for (const storeId of storeIds) {
        retailerStats.attempts++;
        stats.totalAttempts++;
        
        try {
          // Scrape the store
          const result = await scrapeStore(retailer, storeId, state, {
            timeout: scrapingConfig.timeout,
            retries: scrapingConfig.retryAttempts
          });
          
          if (result && result.success) {
            // Add to price arrays for averaging
            if (result.regularPrice) retailerStats.prices.regular.push(result.regularPrice);
            if (result.organicPrice) retailerStats.prices.organic.push(result.organicPrice);
            
            retailerStats.successful++;
            stats.successful++;
            stateSuccess = true;
          } else {
            retailerStats.failed++;
            stats.failed++;
          }
        } catch (error) {
          console.error(`Error scraping ${retailer} store ${storeId} in ${state}:`, error);
          retailerStats.failed++;
          stats.failed++;
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (stateSuccess) {
        retailerStats.statesCovered++;
      }
    }
    
    // Calculate averages for this retailer
    if (retailerStats.prices.regular.length > 0) {
      const avgRegular = retailerStats.prices.regular.reduce((sum, price) => sum + price, 0) / 
                         retailerStats.prices.regular.length;
      
      await prisma.retailerAverage.create({
        data: {
          retailer,
          eggType: 'REGULAR',
          averagePrice: avgRegular,
          dataPoints: retailerStats.prices.regular.length,
          statesCovered: retailerStats.statesCovered,
          calculatedAt: new Date()
        }
      });
    }
    
    if (retailerStats.prices.organic.length > 0) {
      const avgOrganic = retailerStats.prices.organic.reduce((sum, price) => sum + price, 0) / 
                         retailerStats.prices.organic.length;
      
      await prisma.retailerAverage.create({
        data: {
          retailer,
          eggType: 'ORGANIC',
          averagePrice: avgOrganic,
          dataPoints: retailerStats.prices.organic.length,
          statesCovered: retailerStats.statesCovered,
          calculatedAt: new Date()
        }
      });
    }
    
    // Add delay between retailers
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Calculate national averages
  await calculateNationalAverages();
  
  // Complete stats
  stats.endTime = new Date();
  console.log('Daily scraping completed', stats);
  
  // Store scraping job stats
  await prisma.scrapingJob.create({
    data: {
      startTime: stats.startTime,
      endTime: stats.endTime,
      totalAttempts: stats.totalAttempts,
      successful: stats.successful,
      failed: stats.failed,
      statsJson: JSON.stringify(stats)
    }
  });
}

async function calculateNationalAverages() {
  // Calculate national average for regular eggs
  const regularRetailerAverages = await prisma.retailerAverage.findMany({
    where: {
      eggType: 'REGULAR',
      calculatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });
  
  if (regularRetailerAverages.length > 0) {
    const nationalRegularAvg = regularRetailerAverages.reduce((sum, record) => 
      sum + record.averagePrice, 0) / regularRetailerAverages.length;
    
    await prisma.nationalAverage.create({
      data: {
        eggType: 'REGULAR',
        averagePrice: nationalRegularAvg,
        retailerCount: regularRetailerAverages.length,
        statesCovered: Math.max(...regularRetailerAverages.map(r => r.statesCovered)),
        calculatedAt: new Date()
      }
    });
  }
  
  // Calculate national average for organic eggs
  const organicRetailerAverages = await prisma.retailerAverage.findMany({
    where: {
      eggType: 'ORGANIC',
      calculatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });
  
  if (organicRetailerAverages.length > 0) {
    const nationalOrganicAvg = organicRetailerAverages.reduce((sum, record) => 
      sum + record.averagePrice, 0) / organicRetailerAverages.length;
    
    await prisma.nationalAverage.create({
      data: {
        eggType: 'ORGANIC',
        averagePrice: nationalOrganicAvg,
        retailerCount: organicRetailerAverages.length,
        statesCovered: Math.max(...organicRetailerAverages.map(r => r.statesCovered)),
        calculatedAt: new Date()
      }
    });
  }
}
