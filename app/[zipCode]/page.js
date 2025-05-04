// Enable dynamic SSR for this dynamic route
export const dynamic = 'force-dynamic';

import ClientZipPage from './ClientZipPage.jsx';

export default function Page({ params }) {
  const { zipCode } = params;
  return <ClientZipPage zipCode={zipCode} />;
}