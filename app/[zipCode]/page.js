// Enable dynamic SSR for this dynamic route
export const dynamic = 'force-dynamic';

import ClientZipPage from './ClientZipPage.jsx';
import { getStoreData } from '../../lib/store-data';

function priceRange(stores, key) {
  const prices = stores.map(s => s[key]).filter(p => typeof p === 'number');
  if (!prices.length) return null;
  return { low: Math.min(...prices), high: Math.max(...prices), count: prices.length };
}

export async function generateMetadata({ params }) {
  const { zipCode } = await params;
  const data = await getStoreData({ zip: zipCode });
  const stores = data?.stores || [];
  const regularRange = priceRange(stores, 'regular_price');

  const title = regularRange
    ? `Egg Prices in ${zipCode} – From $${regularRange.low.toFixed(2)}`
    : `Egg Prices in ${zipCode}`;
  const description = stores.length
    ? `Live egg prices near ZIP code ${zipCode}. Compare regular and organic egg prices at ${stores.length} nearby grocery stores${regularRange ? `, starting from $${regularRange.low.toFixed(2)}` : ''}, updated daily.`
    : `Live egg price tracker for ZIP code ${zipCode}. Compare regular and organic egg prices at grocery stores near you, updated daily.`;
  const url = `https://eggs.live/${zipCode}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }) {
  const { zipCode } = await params;
  // Fetch store data during the server render instead of waiting for the
  // client to hydrate and then start fetching - the page arrives with data
  // already in it instead of showing a loading spinner first.
  const initialData = await getStoreData({ zip: zipCode });
  const stores = initialData?.stores || [];

  const regularRange = priceRange(stores, 'regular_price');
  const organicRange = priceRange(stores, 'organic_price');

  const jsonLdBlocks = [];

  if (regularRange || organicRange) {
    jsonLdBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `Eggs – ZIP ${zipCode}`,
      description: `Egg prices at grocery stores near ZIP code ${zipCode}`,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: (regularRange ?? organicRange).low,
        highPrice: (regularRange ?? organicRange).high,
        offerCount: (regularRange ?? organicRange).count,
      },
    });
  }

  if (stores.length) {
    jsonLdBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Egg prices by store near ZIP ${zipCode}`,
      itemListElement: stores.slice(0, 20).map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'GroceryStore',
          name: s.name,
          address: s.address,
          ...(typeof s.regular_price === 'number' || typeof s.organic_price === 'number'
            ? {
                makesOffer: [
                  typeof s.regular_price === 'number' && {
                    '@type': 'Offer',
                    name: 'Regular eggs',
                    price: s.regular_price,
                    priceCurrency: 'USD',
                  },
                  typeof s.organic_price === 'number' && {
                    '@type': 'Offer',
                    name: 'Organic eggs',
                    price: s.organic_price,
                    priceCurrency: 'USD',
                  },
                ].filter(Boolean),
              }
            : {}),
        },
      })),
    });
  }

  return (
    <>
      {jsonLdBlocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <ClientZipPage zipCode={zipCode} initialData={initialData} />
    </>
  );
}
