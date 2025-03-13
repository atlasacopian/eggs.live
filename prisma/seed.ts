import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  // Create some initial stores
  const stores = [
    { name: "Food 4 Less" },
    { name: "Albertsons" },
    { name: "H-E-B" },
    { name: "Meijer" },
    { name: "Sprouts" },
    { name: "Erewhon" },
    { name: "Food Lion" },
    { name: "Giant Eagle" },
    { name: "Ralphs" },
    { name: "Shop Rite" },
    { name: "Stop and Shop" },
    { name: "Vons" },
    { name: "Winn Dixie" },
    { name: "Weis Markets" },
    { name: "Harris Teeter" },
  ]

  for (const store of stores) {
    await prisma.store.upsert({
      where: { name: store.name },
      update: {},
      create: { name: store.name },
    })
  }

  // Create Echo Park store locations
  const echoParkStores = [
    { name: "Food 4 Less", address: "Echo Park / Silver Lake area", zipCode: "90026" },
    { name: "Smart & Final", address: "Echo Park / Silver Lake area", zipCode: "90026" },
    { name: "Gelson's", address: "Echo Park / Silver Lake area", zipCode: "90026" },
    { name: "Pavilions", address: "Echo Park / Silver Lake area", zipCode: "90026" },
  ]

  for (const location of echoParkStores) {
    const store = await prisma.store.findFirst({
      where: { name: location.name },
    })

    if (store) {
      await prisma.store_locations.upsert({
        where: {
          id: 0, // This will always fail, forcing an insert
        },
        update: {},
        create: {
          store_id: store.id,
          address: location.address,
          zipCode: location.zipCode,
          latitude: 34.0781, // Approximate coordinates for Echo Park
          longitude: -118.2613,
        },
      })
    }
  }

  console.log("Seed data created successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

