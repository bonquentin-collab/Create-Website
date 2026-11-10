// The normalised Opportunity schema. Every adapter that produces "opportunities"
// (live calls, tenders, regional calls scraped later...) must return objects of
// this shape, so the front end never needs to know where a record came from.
//
// {
//   id:        string   globally unique, prefixed by source id ("sedia:HORIZON-CL5-2027-06-D6-11")
//   source:    string   adapter id that produced the record
//   kind:      'grant' | 'tender' | 'cascade' | 'external'
//   status:    'open' | 'forthcoming'
//   title:     string
//   ref:       string|null   official identifier (topic id, tender reference…)
//   call:      string|null   parent call identifier
//   programme: string        human label of the funding programme
//   programmeCode: string|null
//   authority: string|null   contracting authority / granting body
//   opens:     'YYYY-MM-DD'|null
//   deadline:  'YYYY-MM-DD'|null   next upcoming deadline
//   deadlines: string[]       every known deadline (multi-stage calls)
//   published: 'YYYY-MM-DD'|null   first time the portal indexed it
//   budget:    number|null    total indicative budget (EUR)
//   grantMin / grantMax: number|null   EU contribution per project (EUR)
//   grants:    number|null    expected number of grants
//   actionType: string|null   e.g. "HORIZON Innovation Actions", "Services"
//   themes:    string[]
//   zones:     string[]       geographic zones (mostly for external action & tenders)
//   summary:   string         plain-text excerpt
//   url:       string         official page
// }

export const KINDS = ['grant', 'tender', 'cascade', 'external'];
export const STATUSES = ['open', 'forthcoming'];

export function validateOpportunity(o) {
  const errors = [];
  if (!o || typeof o !== 'object') return ['not an object'];
  if (!o.id || typeof o.id !== 'string') errors.push('id');
  if (!o.source) errors.push('source');
  if (!KINDS.includes(o.kind)) errors.push(`kind=${o.kind}`);
  if (!STATUSES.includes(o.status)) errors.push(`status=${o.status}`);
  if (!o.title) errors.push('title');
  if (!o.url || !/^https?:\/\//.test(o.url)) errors.push('url');
  for (const k of ['opens', 'deadline', 'published']) {
    if (o[k] !== null && o[k] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(o[k])) errors.push(k);
  }
  return errors;
}

/** Drop empty/null keys to keep the published JSON small. */
export function compact(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
