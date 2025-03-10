import { prisma, safeQuery } from "@/lib/db"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestPage() {
  let dbStatus = "Unknown"
  let error = null
  let tables = []
  let connectionString = ""

  try {
    // Test database connection
    await prisma.$connect()
    dbStatus = "Connected"

    // Get list of tables to verify schema
    const tableQuery = await safeQuery(() => 
      prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
    );
    
    tables = tableQuery as { table_name: string }[] || []

    // Get sanitized connection string (hide credentials)
    const dbUrl = process.env.DATABASE_URL || "";
    connectionString = dbUrl.replace(/\/\/.*@/, "//[hidden]@");

  } catch (e) {
    dbStatus = "Error"
    error = e instanceof Error ? e.message : String(e)
  }

  return (
    <div className="min-h-screen bg-black p-8 text-green-400 font-mono">
      <h1 className="text-2xl font-bold mb-8">🥚 eggs.live - Database Status</h1>

      <div className="space-y-6">
        <div className="bg-black/30 p-4 rounded-lg">
          <h2 className="text-xl mb-2">Connection Status</h2>
          <p className={dbStatus === "Connected" ? "text-green-400" : "text-red-400"}>
            {dbStatus}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg">
            <h2 className="text-xl mb-2">Error Details</h2>
            <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        <div className="bg-black/30 p-4 rounded-lg">
          <h2 className="text-xl mb-2">Connection Info</h2>
          <pre className="text-sm">{connectionString || "No connection string found"}</pre>
        </div>

        {tables.length > 0 && (
          <div className="bg-black/30 p-4 rounded-lg">
            <h2 className="text-xl mb-2">Database Tables</h2>
            <ul className="list-disc pl-5">
              {tables.map((table: any) => (
                <li key={table.table_name}>{table.table_name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <a href="/" className="text-blue-400 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}
