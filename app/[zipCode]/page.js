// Enable dynamic SSR for this dynamic route
export const dynamic = 'force-dynamic';

import ClientZipPage from './ClientZipPage.jsx';

export default async function Page({ params }) {
  const { zipCode } = await params;
  return <ClientZipPage zipCode={zipCode} />;
}