import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters, filtersFromParams, filtersToParams, facetCounts, EMPTY_FILTERS } from '../financements-ue/assets/js/lib/filter.mjs';
import { formatEur, formatCountdown, daysUntil, weekStart } from '../financements-ue/assets/js/lib/format.mjs';
import { toIcs } from '../financements-ue/assets/js/lib/ics.mjs';

const TODAY = '2026-11-10';
const items = [
  { id: 'a', kind: 'grant', status: 'open', title: 'Hydrogène vert', programme: 'Horizon Europe', deadline: '2026-11-20', budget: 5e6, firstSeen: '2026-11-01' },
  { id: 'b', kind: 'tender', status: 'open', title: 'Cleaning services', programme: 'Marchés', deadline: '2027-03-01', budget: 2e5, firstSeen: '2026-11-09' },
  { id: 'c', kind: 'grant', status: 'forthcoming', title: 'Soil health', programme: 'Horizon Europe', deadline: null, budget: null },
];

test('filters round-trip through the URL', () => {
  const f = { ...EMPTY_FILTERS, q: 'sol', kinds: ['grant', 'tender'], closing: '30', sort: 'budget' };
  assert.deepEqual(filtersFromParams(filtersToParams(f)), f);
});

test('search is accent- and case-insensitive', () => {
  assert.deepEqual(applyFilters(items, { ...EMPTY_FILTERS, q: 'HYDROGENE' }, TODAY).map((o) => o.id), ['a']);
});

test('closing window and week filters', () => {
  assert.deepEqual(applyFilters(items, { ...EMPTY_FILTERS, closing: '30' }, TODAY).map((o) => o.id), ['a']);
  assert.deepEqual(applyFilters(items, { ...EMPTY_FILTERS, week: '2026-11-16' }, TODAY).map((o) => o.id), ['a']);
});

test('sorting by deadline puts undated records last; by budget puts largest first', () => {
  assert.deepEqual(applyFilters(items, EMPTY_FILTERS, TODAY).map((o) => o.id), ['a', 'b', 'c']);
  assert.deepEqual(applyFilters(items, { ...EMPTY_FILTERS, sort: 'budget' }, TODAY).map((o) => o.id), ['a', 'b', 'c']);
  assert.deepEqual(applyFilters(items, { ...EMPTY_FILTERS, sort: 'recent' }, TODAY).map((o) => o.id), ['b', 'a', 'c']);
});

test('facet counts ignore their own dimension', () => {
  const counts = facetCounts(items, { ...EMPTY_FILTERS, kinds: ['tender'] }, 'kind', TODAY);
  assert.equal(counts.get('grant'), 2);
  assert.equal(counts.get('tender'), 1);
});

test('formatting', () => {
  assert.equal(formatEur(12_500_000).replace(/\s/g, ' '), '12,5 M€');
  assert.equal(formatEur(450_000).replace(/\s/g, ' '), '450 k€');
  assert.equal(formatCountdown(0), 'clôture aujourd’hui');
  assert.equal(daysUntil('2026-11-20', TODAY), 10);
  assert.equal(weekStart('2026-11-15'), '2026-11-09');
});

test('iCal export produces one all-day event per dated record', () => {
  const ics = toIcs(items, { now: new Date('2026-11-10T00:00:00Z') });
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
  assert.match(ics, /DTSTART;VALUE=DATE:20261120/);
  assert.match(ics, /DTEND;VALUE=DATE:20261121/);
});
