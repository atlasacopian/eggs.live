import fetch from 'node-fetch';

/**
 * fetch() that retries transient failures: network errors (e.g. the runner's
 * DNS briefly failing with EAI_AGAIN) and 429/5xx responses. Other 4xx
 * responses are returned immediately so callers still see real API errors.
 */
export async function fetchWithRetry(url, options, { attempts = 3, delayMs = 5000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status >= 500) && attempt < attempts) {
        console.warn(`   ↻ HTTP ${res.status}, retrying (${attempt}/${attempts})…`);
      } else {
        return res;
      }
    } catch (err) {
      if (attempt >= attempts) throw err;
      console.warn(`   ↻ ${err.code || err.message}, retrying (${attempt}/${attempts})…`);
    }
    await new Promise((r) => setTimeout(r, delayMs * attempt));
  }
}
