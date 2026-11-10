// Runtime configuration. To move to a real-time backend later, point DATA_BASE
// at an API that serves the same documents (meta, opportunities, cohesion,
// instruments) and/or set LIVE_STREAM_URL to an SSE endpoint emitting
// `{"type":"update","generatedAt":"…"}` events. The views do not change.

// A host page can override any key through window.EFG_CONFIG (set before the app loads).
const overrides = (typeof window !== 'undefined' && window.EFG_CONFIG) || {};

export const config = {
  DATA_BASE: new URL('../../data/', import.meta.url).href,
  // How often the page re-checks meta.json for a newer dataset (ms). 0 disables.
  POLL_INTERVAL_MS: 10 * 60 * 1000,
  // Optional Server-Sent Events endpoint; when set, it replaces polling.
  LIVE_STREAM_URL: null,
  PAGE_SIZE: 40,
  // Records whose deadline is this close are flagged as urgent.
  URGENT_DAYS: 14,
  // A record first seen within this window is flagged as new.
  NEW_DAYS: 7,
  // Whether the page may start a file download (.ics export). Sandboxed hosts set this to false.
  CAN_DOWNLOAD: true,
  ...overrides,
};
