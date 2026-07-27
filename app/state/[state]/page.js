export const dynamic = 'force-dynamic';

import ClientStatePage from './ClientStatePage.jsx';
import { getStoreDataByState } from '../../../lib/store-data';

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
};

export async function generateMetadata({ params }) {
  const { state } = await params;
  const code = state.toUpperCase();
  const stateName = STATE_NAMES[code] || code;
  const title = `Egg Prices in ${stateName}`;
  const description = `Live egg prices across ${stateName}. Compare regular and organic egg prices at grocery stores statewide, updated daily.`;
  const url = `https://eggs.live/state/${code}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: 'summary', title, description },
  };
}

export default async function Page({ params }) {
  const { state } = await params;
  const code = state.toUpperCase();
  const stateName = STATE_NAMES[code] || code;
  const data = await getStoreDataByState(code);

  return <ClientStatePage stateCode={code} stateName={stateName} initialData={data} />;
}
