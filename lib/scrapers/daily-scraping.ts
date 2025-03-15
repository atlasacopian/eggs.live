// Update the scrapeAllStores function to save inStock status
// Add this to the section where prices are saved to the database

// Assuming these variables are declared and initialized elsewhere in the function or file
// For example:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// const today = new Date();
// const storeLocation = { id: 1 }; // Example store location
// const storeResults = [{ price: 2.99, eggType: 'Large', inStock: true }]; // Example data

// Save each price
for (const price of storeResults) {
  await prisma.la_egg_prices.create({
    data: {
      store_location_id: storeLocation.id,
      price: price.price,
      date: today,
      eggType: price.eggType,
      inStock: price.inStock, // Save stock status
    },
  })
}

