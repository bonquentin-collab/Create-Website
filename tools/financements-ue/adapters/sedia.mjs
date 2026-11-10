// Adapter for the EU Funding & Tenders Portal search API (SEDIA).
// Public endpoint, no key beyond the public "SEDIA" apiKey used by the portal itself.
//
//   type 1 = grant topics (Horizon Europe, LIFE, Digital Europe, CEF, Erasmus+, EU4Health…)
//   type 8 = cascade funding calls (financial support to third parties, run by EU-funded projects)
//   type 2 = EU external action calls for proposals (INTPA / NEAR "Prospect")
//   type 0 = calls for tenders from EU institutions and agencies
//
// The portal keeps "open" status on records whose deadline has passed, so every
// record is re-qualified against today's date (see qualifyStatus).

import { fetchWithRetry, sleep } from '../lib/http.mjs';
import { excerpt, first, all, safeJson, stripHtml, toIsoDay, toNumber } from '../lib/text.mjs';
import { compact } from '../lib/schema.mjs';

const BASE = 'https://api.tech.ec.europa.eu/search-api/prod/rest';
const API_KEY = 'SEDIA';
const PAGE_SIZE = 100;
const STATUS = { forthcoming: '31094501', open: '31094502' };
const PORTAL = 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities';

const KIND_BY_TYPE = { 1: 'grant', 8: 'cascade', 2: 'external', 0: 'tender' };

function form(query, sort) {
  const fd = new FormData();
  fd.append('query', new Blob([JSON.stringify(query)], { type: 'application/json' }));
  fd.append('languages', new Blob([JSON.stringify(['en'])], { type: 'application/json' }));
  if (sort) fd.append('sort', new Blob([JSON.stringify(sort)], { type: 'application/json' }));
  return fd;
}

// Without an explicit sort the API's pagination is unstable: about 17 % of
// records never appear while others repeat across pages. Sorting on the
// identifier makes page boundaries deterministic.
const STABLE_SORT = { order: 'ASC', field: 'identifier' };

function baseQuery(types) {
  return {
    bool: {
      must: [
        { terms: { type: types.map(String) } },
        { terms: { status: [STATUS.forthcoming, STATUS.open] } },
      ],
    },
  };
}

/** Code → label lookups for every facet we display (programmes, zones, priorities…). */
export async function fetchFacets(types) {
  const res = await fetchWithRetry(`${BASE}/facet?apiKey=${API_KEY}&text=***`, { method: 'POST', body: form(baseQuery(types)) });
  const json = await res.json();
  const facets = {};
  for (const f of json.facets || []) {
    facets[f.name] = Object.fromEntries((f.values || []).map((v) => [String(v.rawValue), String(v.value).trim()]));
  }
  return facets;
}

export async function* searchAll(types, { pageSize = PAGE_SIZE, maxPages = 100, delayMs = 250 } = {}) {
  for (let page = 1; page <= maxPages; page++) {
    const url = `${BASE}/search?apiKey=${API_KEY}&text=***&pageSize=${pageSize}&pageNumber=${page}`;
    const res = await fetchWithRetry(url, { method: 'POST', body: form(baseQuery(types), STABLE_SORT) });
    const json = await res.json();
    const results = json.results || [];
    for (const r of results) yield r;
    if (results.length < pageSize || page * pageSize >= (json.totalResults || 0)) return;
    await sleep(delayMs);
  }
}

// ---------------------------------------------------------------------------
// Normalisation

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Decide whether a record still belongs on the site, and with which status.
 * Returns null for anything that is in fact closed or too stale to trust.
 */
export function qualifyStatus({ rawStatus, opens, deadlines, published }, today = todayIso()) {
  const future = deadlines.filter((d) => d >= today).sort();
  if (deadlines.length && !future.length) return null; // every deadline passed
  // The opening date wins over the portal flag; without one, trust the flag.
  let status = rawStatus === STATUS.forthcoming ? 'forthcoming' : 'open';
  if (opens) status = opens > today ? 'forthcoming' : 'open';
  if (!deadlines.length) {
    // No deadline at all: only keep if recently published (portal leaves stale records "open").
    const ref = published || opens;
    if (!ref) return null;
    const ageDays = (Date.parse(today) - Date.parse(ref)) / 86400000;
    if (ageDays > 365) return null;
  }
  return { status, deadline: future[0] ?? null, deadlines: future };
}

function topicBudget(meta, identifier) {
  const overview = safeJson(first(meta, 'budgetOverview'), null);
  const map = overview?.budgetTopicActionMap;
  if (!map) return {};
  let budget = 0;
  let grantMin = null;
  let grantMax = null;
  let grants = 0;
  let found = false;
  const deadlines = new Set();
  for (const actions of Object.values(map)) {
    for (const a of actions || []) {
      const action = String(a.action || '');
      if (!(action === identifier || action.startsWith(`${identifier} `))) continue;
      found = true;
      for (const v of Object.values(a.budgetYearMap || {})) budget += toNumber(v) || 0;
      if (toNumber(a.minContribution)) grantMin = Math.min(grantMin ?? Infinity, toNumber(a.minContribution));
      if (toNumber(a.maxContribution)) grantMax = Math.max(grantMax ?? 0, toNumber(a.maxContribution));
      if (toNumber(a.expectedGrants)) grants += toNumber(a.expectedGrants);
      for (const d of a.deadlineDates || []) if (toIsoDay(d)) deadlines.add(toIsoDay(d));
    }
  }
  if (!found) return {};
  return { budget: budget || null, grantMin, grantMax, grants: grants || null, deadlines: [...deadlines] };
}

const labelOf = (facets, facet, code) => (code && facets?.[facet]?.[String(code)]) || null;
const labelsOf = (facets, facet, codes) => [...new Set(codes.map((c) => labelOf(facets, facet, c)).filter(Boolean))];

function tenderDeadline(meta) {
  const out = [];
  const d = toIsoDay(first(meta, 'deadlineDate'));
  if (d) out.push(d);
  const lots = String(first(meta, 'lots') || '');
  for (const m of lots.matchAll(/"tenderSubmissionDeadlinePeriod":\{"endDate":"(\d{4}-\d{2}-\d{2})/g)) out.push(m[1]);
  // Low/middle-value procedures ("-EXA") close on a registration deadline instead.
  const exa = toIsoDay(first(meta, 'cftEXARegistrationDeadline'));
  if (exa) out.push(exa);
  return [...new Set(out)];
}

function tenderValue(meta) {
  const v = toNumber(String(first(meta, 'cftEstimatedTotalProcedureValue') || '').replace(/[^\d.]/g, ''));
  if (v) return v;
  const lots = String(first(meta, 'lots') || '');
  const m = lots.match(/"estimatedOverallContractAmount":(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : toNumber(first(meta, 'cftEstimatedOverallContractAmount'));
}

function authorityOf(meta, facets) {
  const lead = safeJson(first(meta, 'cftLeadContractingAuthorityCode'), []);
  const name = Array.isArray(lead) ? lead.find((a) => a.isLeadAuthority)?.name || lead[0]?.name : null;
  return name || labelOf(facets, 'cftPartyLegalEntityId', first(meta, 'cftPartyLegalEntityId'));
}

export function normalise(result, facets, today = todayIso()) {
  const meta = result.metadata || {};
  const type = Number(first(meta, 'type'));
  const kind = KIND_BY_TYPE[type];
  if (!kind) return null;

  const identifier = first(meta, 'identifier');
  const title = first(meta, 'title') || first(meta, 'caName') || first(meta, 'callTitle') || result.summary;
  const opens = toIsoDay(first(meta, 'startDate'));
  const published = toIsoDay(first(meta, 'esDA_FirstIngestDate')) || toIsoDay(first(meta, 'cftPublicationDateEForm')) || opens;
  const url = first(meta, 'url') || first(meta, 'esST_URL') || result.url;

  let rec = {
    source: 'sedia',
    kind,
    title: String(title || '').trim(),
    ref: identifier,
    call: first(meta, 'callIdentifier'),
    programmeCode: first(meta, 'frameworkProgramme'),
    programme: labelOf(facets, 'frameworkProgramme', first(meta, 'frameworkProgramme')),
    opens,
    published,
    url,
  };
  let deadlines = all(meta, 'deadlineDate').map(toIsoDay).filter(Boolean);

  if (kind === 'grant') {
    const b = topicBudget(meta, identifier);
    deadlines = [...new Set([...deadlines, ...(b.deadlines || [])])];
    Object.assign(rec, {
      id: `sedia:${identifier}`,
      budget: b.budget ?? null,
      grantMin: b.grantMin ?? null,
      grantMax: b.grantMax ?? null,
      grants: b.grants ?? null,
      actionType: all(meta, 'typesOfAction')[0] || null,
      themes: [
        ...labelsOf(facets, 'crossCuttingPriorities', all(meta, 'crossCuttingPriorities')),
        ...all(meta, 'keywords').filter((k) => !/^[A-Z0-9-]+$/.test(k) && k !== '[]'),
      ].slice(0, 8),
      callTitle: first(meta, 'callTitle'),
      summary: excerpt(stripHtml(first(meta, 'descriptionByte')).replace(/^(Expected (Outcomes?|Impacts?)|ExpectedOutcome|Scope)\s*:\s*/i, ''), 320),
      url: url || `${PORTAL}/topic-details/${identifier}`,
    });
  } else if (kind === 'cascade') {
    Object.assign(rec, {
      id: `sedia:cascade:${first(meta, 'ccm2Id') || result.reference}`,
      title: String(first(meta, 'caName') || title || '').trim(),
      budget: toNumber(first(meta, 'budget')),
      authority: [first(meta, 'projectAcronym'), first(meta, 'projectName')].filter(Boolean).join(' – ') || null,
      summary: excerpt(first(meta, 'furtherInformation') || first(meta, 'description'), 320),
    });
  } else if (kind === 'external') {
    Object.assign(rec, {
      id: `sedia:external:${first(meta, 'callIdentifier') || result.reference}`,
      programme: labelOf(facets, 'programmeDivisionProspect', first(meta, 'programmeDivisionProspect')) || rec.programme,
      budget: first(meta, 'currency') === 'EUR' ? toNumber(first(meta, 'budget')) : null,
      actionType: labelOf(facets, 'contractType', first(meta, 'contractType')),
      zones: labelsOf(facets, 'geographicalZones', all(meta, 'geographicalZones')),
      summary: '',
    });
  } else if (kind === 'tender') {
    deadlines = [...new Set([...deadlines, ...tenderDeadline(meta)])];
    Object.assign(rec, {
      id: `sedia:tender:${first(meta, 'cftId') || identifier || result.reference}`,
      ref: first(meta, 'callIdentifier') || identifier,
      call: null,
      budget: tenderValue(meta),
      authority: authorityOf(meta, facets),
      programme: rec.programme || 'Marchés des institutions de l’UE',
      actionType: labelOf(facets, 'contractType', first(meta, 'contractType')),
      themes: labelsOf(facets, 'mainCpv', all(meta, 'mainCpv')).slice(0, 3),
      zones: labelsOf(facets, 'geographicalZones', all(meta, 'geographicalZones')),
      summary: excerpt(first(meta, 'description'), 320),
    });
  }

  const q = qualifyStatus({ rawStatus: first(meta, 'status'), opens, deadlines, published }, today);
  if (!q) return null;
  rec = { ...rec, ...q };
  // Prior information notices announce a tender that is not open yet.
  if (kind === 'tender' && /-PIN$/.test(rec.id) && !rec.deadline) {
    rec.status = 'forthcoming';
    rec.notice = 'Avis de préinformation';
    const planned = toIsoDay(first(meta, 'cftPlannedDate'));
    rec.opens = planned && planned >= today ? planned : null;
  }
  if (!rec.programme) rec.programme = 'Autres programmes';
  return compact(rec);
}

// ---------------------------------------------------------------------------
// Adapter definition (see adapters/index.mjs for the contract)

export function sediaAdapter({ id, label, types, description }) {
  return {
    id,
    label,
    description,
    output: 'opportunities',
    mode: 'live',
    homepage: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home',
    async run({ log, today }) {
      const facets = await fetchFacets(types);
      const items = [];
      const seen = new Set();
      let raw = 0;
      let dropped = 0;
      for await (const r of searchAll(types)) {
        raw++;
        const o = normalise(r, facets, today);
        if (!o) {
          dropped++;
          continue;
        }
        if (seen.has(o.id)) continue;
        seen.add(o.id);
        items.push(o);
      }
      log(`${id}: ${raw} records fetched, ${items.length} kept, ${dropped} closed or stale dropped`);
      return { items, stats: { fetched: raw, kept: items.length, dropped } };
    },
  };
}
