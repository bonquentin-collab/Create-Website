// Text normalisation helpers shared by adapters.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', euro: '€' };

export function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|li|div|h\d|br)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
      }
      return ENTITIES[e.toLowerCase()] ?? ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cut at a word boundary, append an ellipsis when truncated. */
export function excerpt(text, max = 320) {
  const t = stripHtml(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${cut.slice(0, at > max * 0.6 ? at : max).replace(/[\s,;:.–-]+$/, '')}…`;
}

/** Parse the many date shapes the portal returns into YYYY-MM-DD (UTC calendar day). */
export function toIsoDay(value) {
  if (!value) return null;
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function safeJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** The portal returns every metadata field as an array; take the first value. */
export const first = (meta, key) => (Array.isArray(meta?.[key]) ? meta[key][0] : meta?.[key]) ?? null;
export const all = (meta, key) => (Array.isArray(meta?.[key]) ? meta[key].filter((v) => v !== null && v !== '') : []);
