// Enable dynamic SSR for this dynamic route
export const dynamic = 'force-dynamic';

import ClientZipPage from './ClientZipPage.jsx';
import { getStoreData } from '../../lib/store-data';

export default async function Page({ params }) {
  const { zipCode } = await params;
  // Fetch store data during the server render instead of waiting for the
  // client to hydrate and then start fetching - the page arrives with data
  // already in it instead of showing a loading spinner first.
  const initialData = await getStoreData({ zip: zipCode });
  return <ClientZipPage zipCode={zipCode} initialData={initialData} />;
}