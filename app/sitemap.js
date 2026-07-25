// Zip codes can't be practically enumerated (any of ~40,000 US ZIPs could be
// a valid page), so this seeds crawlers with the homepage plus a curated set
// of major-city ZIPs to demonstrate the /[zipCode] page template. Google
// discovers additional ZIPs organically from there (internal links, direct
// visits, and its own crawl of the dynamic route pattern).
const MAJOR_CITY_ZIPS = [
  '10001', // New York, NY
  '90026', // Los Angeles, CA
  '60601', // Chicago, IL
  '77002', // Houston, TX
  '85001', // Phoenix, AZ
  '19102', // Philadelphia, PA
  '78201', // San Antonio, TX
  '92101', // San Diego, CA
  '75201', // Dallas, TX
  '95101', // San Jose, CA
  '78701', // Austin, TX
  '32202', // Jacksonville, FL
  '76102', // Fort Worth, TX
  '43215', // Columbus, OH
  '28202', // Charlotte, NC
  '94102', // San Francisco, CA
  '46204', // Indianapolis, IN
  '98101', // Seattle, WA
  '80202', // Denver, CO
  '20001', // Washington, DC
  '02108', // Boston, MA
  '37201', // Nashville, TN
  '48226', // Detroit, MI
  '97201', // Portland, OR
  '38103', // Memphis, TN
  '89101', // Las Vegas, NV
  '40202', // Louisville, KY
  '21201', // Baltimore, MD
  '53202', // Milwaukee, WI
  '87102', // Albuquerque, NM
  '85701', // Tucson, AZ
  '30303', // Atlanta, GA
  '33130', // Miami, FL
  '95814', // Sacramento, CA
  '64105', // Kansas City, MO
  '44113', // Cleveland, OH
  '70112', // New Orleans, LA
  '55401', // Minneapolis, MN
  '33602', // Tampa, FL
  '32801', // Orlando, FL
];

export default function sitemap() {
  const now = new Date();
  return [
    {
      url: 'https://eggs.live',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...MAJOR_CITY_ZIPS.map(zip => ({
      url: `https://eggs.live/${zip}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
  ];
}
