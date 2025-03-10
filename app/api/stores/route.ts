import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      stores,
    })
  } catch (error) {
    console.error("Error fetching stores:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch store data",
      },
      { status: 500 },
    )
  }
}

