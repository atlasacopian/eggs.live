import { PrismaClient } from "@prisma/client"

// Add connection URL validation
function getValidatedConnectionUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

// Create a single instance of Prisma Client with better error handling
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getValidatedConnectionUrl(),
      },
    },
  })

// In development, preserve the Prisma instance across hot reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Helper function to safely execute Prisma queries with proper connection handling
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T | null> {
  try {
    // Validate connection URL before attempting query
    getValidatedConnectionUrl();
    
    const result = await queryFn();
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    // Log more details about the connection
    console.error("Connection details:", {
      hasConnectionString: !!process.env.DATABASE_URL,
      connectionStringLength: process.env.DATABASE_URL?.length || 0,
      isDevelopment: process.env.NODE_ENV === "development",
    });
    return null;
  } finally {
    if (process.env.NODE_ENV === "production") {
      try {
        await prisma.$disconnect();
      } catch (e) {
        console.error("Error disconnecting from database:", e);
      }
    }
  }
}

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    return { success: true, message: "Connected to database successfully" };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error connecting to database",
      details: error
    };
  }
}
