// Client-only: gets the browser's current position and reverse-geocodes it to
// a US ZIP code via BigDataCloud's free, CORS-enabled, no-API-key endpoint
// (built specifically for client-side reverse geocoding). Resolves to null
// (rather than throwing) on any failure - permission denied, timeout, no zip
// in the response - so callers can fall back to a default.
export function getCurrentZip() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Bound the reverse-geocode call too, so a slow/unreachable API
          // can't extend the wait past the geolocation timeout below.
          const controller = new AbortController();
          const abortTimer = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: controller.signal }
          );
          clearTimeout(abortTimer);
          const data = await res.json();
          const zip = String(data?.postcode || '').replace(/\D/g, '').slice(0, 5);
          resolve(/^\d{5}$/.test(zip) ? zip : null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      // enableHighAccuracy:false skips waiting for a full GPS lock (which can
      // take 10-30s) in favor of faster WiFi/cell-based positioning; timeout
      // caps the wait instead of hanging indefinitely (shortened from 8s -
      // still subject to however long the browser's own permission+location
      // lookup takes, but fails over to the 90026 default sooner).
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
    );
  });
}
