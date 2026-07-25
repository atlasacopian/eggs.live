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
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
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
      // caps the wait instead of hanging indefinitely.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}
