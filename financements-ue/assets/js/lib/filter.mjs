// Filter state ⇄ URL, and the pure filtering/sorting logic shared by the
// explorer, the calendar and the deadline strip.

import { addDays, todayIso } from './format.mjs';

export const EMPTY_FILTERS = Object.freeze({
  q: '',
  kinds: [],
  status: [],
  programme: '',
  closing: '', // '7' | '30' | '90' (days)
  week: '', // Monday ISO date — set by clicking the deadline strip
  budgetMin: '',
  sort: 'deadline',
});

export const SORTS = {
  deadline: 'Clôture la plus proche',
  budget: 'Budget le plus élevé',
  recent: 'Ajout le plus récent',
};

export function filtersFromParams(params) {
  const list = (k) => (params.get(k) || '').split(',').filter(Boolean);
  return {
    ...EMPTY_FILTERS,
    q: params.get('q') || '',
    kinds: list('nature'),
    status: list('statut'),
    programme: params.get('programme') || '',
    closing: params.get('cloture') || '',
    week: params.get('semaine') || '',
    budgetMin: params.get('budget') || '',
    sort: SORTS[params.get('tri')] ? params.get('tri') : 'deadline',
  };
}

export function filtersToParams(f) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.kinds.length) p.set('nature', f.kinds.join(','));
  if (f.status.length) p.set('statut', f.status.join(','));
  if (f.programme) p.set('programme', f.programme);
  if (f.closing) p.set('cloture', f.closing);
  if (f.week) p.set('semaine', f.week);
  if (f.budgetMin) p.set('budget', f.budgetMin);
  if (f.sort && f.sort !== 'deadline') p.set('tri', f.sort);
  return p;
}

export const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Pre-computed lowercase haystack, cached on the record. */
function haystack(o) {
  if (!o._hay) {
    o._hay = fold([o.title, o.ref, o.call, o.callTitle, o.programme, o.authority, o.actionType, o.summary, ...(o.themes || []), ...(o.zones || [])].join(' '));
  }
  return o._hay;
}

export function matches(o, f, today = todayIso(), { ignore = [] } = {}) {
  if (f.q && !ignore.includes('q')) {
    const h = haystack(o);
    for (const term of fold(f.q).split(/\s+/).filter(Boolean)) if (!h.includes(term)) return false;
  }
  if (f.kinds.length && !ignore.includes('kinds') && !f.kinds.includes(o.kind)) return false;
  if (f.status.length && !ignore.includes('status') && !f.status.includes(o.status)) return false;
  if (f.programme && !ignore.includes('programme') && o.programme !== f.programme) return false;
  if (f.closing && !ignore.includes('closing')) {
    if (!o.deadline || o.deadline > addDays(today, Number(f.closing))) return false;
  }
  if (f.week && !ignore.includes('week')) {
    if (!o.deadline || o.deadline < f.week || o.deadline > addDays(f.week, 6)) return false;
  }
  if (f.budgetMin && !ignore.includes('budgetMin')) {
    if (!o.budget || o.budget < Number(f.budgetMin)) return false;
  }
  return true;
}

export function applyFilters(items, f, today = todayIso(), opts) {
  const out = items.filter((o) => matches(o, f, today, opts));
  return sortItems(out, f.sort);
}

export function sortItems(items, sort = 'deadline') {
  const byDeadline = (a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.title.localeCompare(b.title, 'fr');
  const cmp = {
    deadline: byDeadline,
    budget: (a, b) => (b.budget || 0) - (a.budget || 0) || byDeadline(a, b),
    recent: (a, b) => (b.firstSeen || '').localeCompare(a.firstSeen || '') || byDeadline(a, b),
  }[sort] || byDeadline;
  return [...items].sort(cmp);
}

/** Facet counts computed with every other active filter applied (classic faceted search). */
export function facetCounts(items, f, key, today = todayIso()) {
  const ignore = { kind: 'kinds', status: 'status', programme: 'programme' }[key];
  const counts = new Map();
  for (const o of items) {
    if (!matches(o, f, today, { ignore: [ignore] })) continue;
    counts.set(o[key], (counts.get(o[key]) || 0) + 1);
  }
  return counts;
}

export const isActive = (f) => Boolean(f.q || f.kinds.length || f.status.length || f.programme || f.closing || f.week || f.budgetMin);
