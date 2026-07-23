import { getStoreData } from '../../../lib/store-data'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  const data = await getStoreData({ zip, lat, lon })
  return Response.json(data)
}
