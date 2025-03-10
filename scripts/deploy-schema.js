import { execSync } from "child_process"

console.log("Deploying Prisma schema...")

try {
  // Generate Prisma Client
  execSync("npx prisma generate", { stdio: "inherit" })

  // Deploy the schema
  execSync("npx prisma db push", { stdio: "inherit" })

  console.log("Schema deployed successfully!")
} catch (error) {
  console.error("Error deploying schema:", error)
  process.exit(1)
}

