import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType")

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    let query = `
    SELECT ep.id, ep."storeId", ep.price, ep.date, ep."eggType", s.name as store_name, s.website as store_website
    FROM egg_prices ep
    JOIN stores s ON ep."storeId" = s.id
    WHERE s.id != 'costco' -- Exclude Costco
    AND s.name NOT LIKE '%TEST%' -- Exclude test entries
    AND s.name NOT LIKE '%test%'
  `

    const params = []
    if (eggType) {
      query += ` AND ep."eggType" = $1`
      params.push(eggType)
    }

    query += ` ORDER BY s.name ASC`

    const result = await pool.query(query, params)

    // Also get a list of all stores to include those without prices
    const storesQuery = `
      SELECT id, name, website
      FROM stores
      WHERE id != 'costco'
      AND name NOT LIKE '%TEST%'
      AND name NOT LIKE '%test%'
      ORDER BY name ASC
    `

    const storesResult = await pool.query(storesQuery)

    // Create a map of all stores
    const allStores = new Map()
    storesResult.rows.forEach((store) => {
      if (eggType) {
        // If eggType is specified, only add that type
        allStores.set(`${store.id}-${eggType}`, {
          id: `${store.id}-${eggType}`,
          storeId: store.id,
          price: null,
          date: new Date().toISOString().split("T")[0],
          eggType: eggType,
          store_name: store.name,
          store_website: store.website,
        })
      } else {
        // Otherwise add both types
        allStores.set(`${store.id}-regular`, {
          id: `${store.id}-regular`,
          storeId: store.id,
          price: null,
          date: new Date().toISOString().split("T")[0],
          eggType: "regular",
          store_name: store.name,
          store_website: store.website,
        })

        allStores.set(`${store.id}-organic`, {
          id: `${store.id}-organic`,
          storeId: store.id,
          price: null,
          date: new Date().toISOString().split("T")[0],
          eggType: "organic",
          store_name: store.name,
          store_website: store.website,
        })
      }
    })

    // Update with actual prices from the database
    result.rows.forEach((price) => {
      const key = `${price.storeId}-${price.eggType}`
      if (allStores.has(key)) {
        allStores.set(key, price)
      }
    })

    // Convert map to array
    const prices = Array.from(allStores.values())

    await pool.end()

    return NextResponse.json({
      success: true,
      prices: prices,
    })
  } catch (error) {
    console.error("Error fetching prices:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch price data",
      },
      { status: 500 },
    )
  }
}

