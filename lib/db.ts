import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient | undefined

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"],
    errorFormat: "pretty",
  })
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["error"],
      errorFormat: "pretty",
    })
  }
  prisma = global.prisma as PrismaClient
}

// Test the connection immediately
prisma
  .$connect()
  .then(() => {
    console.log("Database connection successful")
  })
  .catch((e) => {
    console.error("Database connection failed:", e)
    // Don't throw here, let the application handle the error gracefully
  })

export { prisma }

