const { Client } = require("pg")

async function runDirectMigration() {
  // Create a new PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("Starting direct SQL migration...")

    // Connect to the database
    await client.connect()
    console.log("Connected to database")

    // Create tables if they don't exist
    await client.query(`
      -- Create store table
      CREATE TABLE IF NOT EXISTS store (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create store_locations table
      CREATE TABLE IF NOT EXISTS store_locations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        address TEXT,
        "zipCode" TEXT NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (store_id) REFERENCES store(id)
      );
      
      -- Create la_egg_prices table
      CREATE TABLE IF NOT EXISTS la_egg_prices (
        id SERIAL PRIMARY KEY,
        store_location_id INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        "eggType" TEXT DEFAULT 'regular',
        "inStock" BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (store_location_id) REFERENCES store_locations(id)
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS store_locations_store_id_idx ON store_locations(store_id);
      CREATE INDEX IF NOT EXISTS store_locations_zipcode_idx ON store_locations("zipCode");
      CREATE INDEX IF NOT EXISTS la_egg_prices_store_location_id_idx ON la_egg_prices(store_location_id);
      CREATE INDEX IF NOT EXISTS la_egg_prices_date_idx ON la_egg_prices(date);
    `)

    console.log("Database schema created successfully")

    // Close the connection
    await client.end()
    console.log("Database connection closed")
  } catch (error) {
    console.error("Migration error:", error)
    // Try to close the connection even if there was an error
    try {
      await client.end()
    } catch (e) {
      // Ignore errors when closing connection
    }
    process.exit(1)
  }
}

// Run the migration
runDirectMigration()

