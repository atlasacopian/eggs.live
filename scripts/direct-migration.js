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

    // First, let's check the existing schema to see column names
    console.log("Checking existing schema...")

    // Check if store_locations table exists and get column names
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_locations'
      );
    `)

    const tableExists = tableCheckResult.rows[0].exists

    // If table exists, check column names
    let zipCodeColumnName = "zipcode" // Default to lowercase

    if (tableExists) {
      const columnCheckResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'store_locations' 
        AND (column_name = 'zipCode' OR column_name = 'zipcode');
      `)

      if (columnCheckResult.rows.length > 0) {
        zipCodeColumnName = columnCheckResult.rows[0].column_name
        console.log(`Found existing zipCode column: ${zipCodeColumnName}`)
      }
    }

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
    `)

    // Create store_locations table with the correct column name
    await client.query(`
      -- Create store_locations table
      CREATE TABLE IF NOT EXISTS store_locations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        address TEXT,
        ${zipCodeColumnName} TEXT NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (store_id) REFERENCES store(id)
      );
    `)

    // Create la_egg_prices table
    await client.query(`
      -- Create la_egg_prices table
      CREATE TABLE IF NOT EXISTS la_egg_prices (
        id SERIAL PRIMARY KEY,
        store_location_id INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        "eggType" TEXT DEFAULT 'regular',
        FOREIGN KEY (store_location_id) REFERENCES store_locations(id)
      );
    `)

    // Check if inStock column exists
    const inStockColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'la_egg_prices' 
        AND column_name = 'inStock'
      );
    `)

    // Add inStock column if it doesn't exist
    if (!inStockColumnExists.rows[0].exists) {
      console.log("Adding inStock column to la_egg_prices table")
      await client.query(`
        ALTER TABLE la_egg_prices 
        ADD COLUMN "inStock" BOOLEAN DEFAULT TRUE;
      `)
    }

    // Create indexes with the correct column name
    await client.query(`
      -- Create indexes
      CREATE INDEX IF NOT EXISTS store_locations_store_id_idx ON store_locations(store_id);
      CREATE INDEX IF NOT EXISTS store_locations_zipcode_idx ON store_locations(${zipCodeColumnName});
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

