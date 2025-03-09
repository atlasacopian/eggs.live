// Simple scheduler for running scrapers
export class ScraperScheduler {
  private interval: NodeJS.Timeout | null = null;
  
  constructor(private scrapeFunction: () => Promise<void>, private intervalMinutes: number = 1440) {
    // Default to daily (1440 minutes)
  }
  
  start() {
    if (this.interval) {
      this.stop();
    }
    
    // Run immediately
    this.scrapeFunction();
    
    // Then schedule
    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.interval = setInterval(() => {
      this.scrapeFunction();
    }, intervalMs);
    
    console.log(`Scheduler started. Will run every ${this.intervalMinutes} minutes.`);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('Scheduler stopped.');
    }
  }
}
