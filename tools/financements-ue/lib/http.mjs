// Minimal HTTP helpers with retry/backoff. No dependencies (Node >= 20).

const UA = 'eu-funding-gateway/1.0 (+open-data aggregator)';

export async function fetchWithRetry(url, init = {}, { retries = 4, baseDelayMs = 2000, timeoutMs = 60000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers || {}) },
        signal: ctrl.signal,
      });
      if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status} on ${url}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const err = new Error(`HTTP ${res.status} on ${url}: ${body.slice(0, 200)}`);
        err.fatal = true;
        throw err;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (err.fatal || attempt === retries) break;
      await sleep(baseDelayMs * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

export async function getJson(url, init, opts) {
  const res = await fetchWithRetry(url, init, opts);
  return res.json();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
