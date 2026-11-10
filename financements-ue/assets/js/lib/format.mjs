// French formatting helpers (pure, no DOM).

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayLongFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthShortFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
const dowFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });
const intFmt = new Intl.NumberFormat('fr-FR');

export const KIND_LABELS = {
  grant: 'Subvention',
  cascade: 'Financement en cascade',
  external: 'Action extérieure',
  tender: 'Appel d’offres',
};
export const KIND_HELP = {
  grant: 'Financement direct de la Commission pour des projets, souvent en consortium.',
  cascade: 'Petites aides redistribuées par un projet européen à des tiers, souvent des PME.',
  external: 'Appels à propositions pour des projets hors de l’UE.',
  tender: 'Contrat de prestation, de fourniture ou de travaux pour une institution de l’UE.',
};
export const STATUS_LABELS = { open: 'Ouvert', forthcoming: 'À venir' };

export const parseDay = (iso) => (iso ? new Date(`${iso}T00:00:00Z`) : null);
export const todayIso = () => new Date().toISOString().slice(0, 10);

export function formatDay(iso) {
  return iso ? dayFmt.format(parseDay(iso)) : '—';
}
export function formatDayLong(iso) {
  return iso ? dayLongFmt.format(parseDay(iso)) : '—';
}
export const formatMonth = (d) => monthFmt.format(d);
export const formatMonthShort = (d) => monthShortFmt.format(d).replace('.', '');
export const formatDow = (d) => dowFmt.format(d).replace('.', '');
export const formatInt = (n) => intFmt.format(n);

export function daysUntil(iso, today = todayIso()) {
  if (!iso) return null;
  return Math.round((parseDay(iso) - parseDay(today)) / 86400000);
}

export function formatCountdown(days) {
  if (days === null || days === undefined) return '';
  if (days < 0) return 'clôturé';
  if (days === 0) return 'clôture aujourd’hui';
  if (days === 1) return 'clôture demain';
  if (days < 60) return `dans ${days} jours`;
  const months = Math.round(days / 30.4);
  return `dans ${months} mois`;
}

/** 12 500 000 → "12,5 M€" ; 450 000 → "450 k€" ; 2.4e9 → "2,4 Md€". */
export function formatEur(n, { precise = false } = {}) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (precise) return `${intFmt.format(Math.round(n))} €`;
  const abs = Math.abs(n);
  const fmt = (v, unit) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: v < 100 ? 1 : 0 }).format(v)} ${unit}`;
  if (abs >= 1e9) return fmt(n / 1e9, 'Md€');
  if (abs >= 1e6) return fmt(n / 1e6, 'M€');
  if (abs >= 1e3) return fmt(n / 1e3, 'k€');
  return `${intFmt.format(n)} €`;
}

export function formatPct(x) {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: x < 0.1 ? 1 : 0 }).format(x);
}

export function formatRelativeTime(isoDateTime, now = new Date()) {
  const diffMin = Math.round((now - new Date(isoDateTime)) / 60000);
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
  const h = Math.round(diffMin / 60);
  if (Math.abs(h) < 48) return rtf.format(-h, 'hour');
  return rtf.format(-Math.round(h / 24), 'day');
}

/** Monday (UTC) of the week containing iso, as YYYY-MM-DD. */
export function weekStart(iso) {
  const d = parseDay(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
export function addDays(iso, n) {
  const d = parseDay(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
