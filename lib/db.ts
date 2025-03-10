import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Test the database connection
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to database")
  })
  .catch((e) => {
    console.error("Failed to connect to database:", e)
  })

