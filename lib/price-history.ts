// lib/price-history.ts
// Historical price data for the graph

export const usdaHistoricalData = [
  { date: '3/8/2024', price: 2.93 },  // Start from oldest
  { date: '4/8/2024', price: 3.15 },
  { date: '5/8/2024', price: 3.42 },
  { date: '6/8/2024', price: 3.68 },
  { date: '7/8/2024', price: 3.89 },
  { date: '8/8/2024', price: 4.12 },
  { date: '9/8/2024', price: 4.25 },
  { date: '10/8/2024', price: 4.38 },
  { date: '11/8/2024', price: 4.45 },
  { date: '12/8/2024', price: 4.58 },
  { date: '1/8/2025', price: 4.72 },
  { date: '2/8/2025', price: 4.85 },
  { date: '3/8/2025', price: 4.94 }   // End with newest
].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
