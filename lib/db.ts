import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!(global as any).prisma) {
    ;(global as any).prisma = new PrismaClient()
  }
  prisma = (global as any).prisma
}

export default prisma

// Helper functions for database operations
export async function getStores() {
  return await prisma.store.findMany({
    include: {
      store_locations: true,
    },
  })
}

export async function getStoreLocations() {
  return await prisma.store_locations.findMany({
    include: {
      store: true,
    },
  })
}

export async function getLatestEggPrices() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return await prisma.la_egg_prices.findMany({
    where: {
      date: {
        gte: today,
      },
    },
    include: {
      store_location: {
        include: {
          store: true,
        },
      },
    },
  })
}

export async function getCheapestEggsByType(eggType: string = 'regular', zipCode?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const whereClause: any = {
    date: {
      gte: today,
    },
    eggType,
    inStock: true,
  }
  
  if (zipCode) {
    whereClause.store_location = {
      zipCode,
    }
  }
  
  return await prisma.la_egg_prices.findMany({
    where: whereClause,
    orderBy: {
      price: 'asc',
    },
    take: 5,
    include: {
      store_location: {
        include: {
          store: true,
        },
      },
    },
  })
}
