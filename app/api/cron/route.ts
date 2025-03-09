// app/api/cron/route.ts

import { NextResponse } from 'next/server';
import { scheduleDailyScraping } from '../../../lib/scrapers/scheduler';

export async function GET() {
  try {
    await scheduleDailyScraping();
    return NextResponse.json({ success: true, message: 'Scraping job initiated' });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
