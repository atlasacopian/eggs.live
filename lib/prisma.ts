import { PrismaClient } from "@prisma/client"

// Add retry logic and connection pooling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}

