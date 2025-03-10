import { PrismaClient } from "@prisma/client"

// Create a single instance of Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we already have a Prisma instance to avoid multiple instances during hot reloading
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

// In development, preserve the Prisma instance across hot reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

