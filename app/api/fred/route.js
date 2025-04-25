export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'APU0000708111'
  const start = searchParams.get('start') || '2020-01-01'
  const end = searchParams.get('end') || new Date().toISOString().split('T')[0]
  const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY || process.env.FRED_API_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing FRED API key' }), { status: 500 })
  }

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${symbol}&api_key=${apiKey}&file_type=json&observation_start=${start}&observation_end=${end}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'FRED fetch failed' }), { status: 502 })
    }
    const data = await res.json()
    return Response.json(data)
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
} 