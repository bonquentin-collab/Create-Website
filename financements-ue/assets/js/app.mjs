// App shell: hash router, shared filter state, live-update wiring.

import { StaticJsonSource } from './data/source.mjs';
import { filtersFromParams, filtersToParams } from './lib/filter.mjs';
import { formatInt, formatRelativeTime } from './lib/format.mjs';
import { html, toast, $, $$ } from './lib/dom.mjs';
import explorer from './views/explorer.mjs';
import calendar from './views/calendar.mjs';
import dashboard from './views/dashboard.mjs';
import cohesion from './views/cohesion.mjs';
import instruments from './views/instruments.mjs';
import sources from './views/sources.mjs';
import detail from './views/detail.mjs';

const ROUTES = {
  '': explorer,
  calendrier: calendar,
  'tableau-de-bord': dashboard,
  'fonds-regionaux': cohesion,
  instruments,
  sources,
  opportunite: detail,
};
const FILTERED = new Set(['', 'calendrier']);

const source = new StaticJsonSource();
const main = document.getElementById('main');
const state = { data: null, filters: null, route: null, lastListHash: '#/' };

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [name, ...rest] = path.split('/');
  return { name: ROUTES[name] ? name : '', id: rest.join('/'), params: new URLSearchParams(query) };
}

function setFilters(f) {
  state.filters = f;
  const qs = filtersToParams(f).toString();
  const hash = `#/${state.route.name}${qs ? `?${qs}` : ''}`;
  history.replaceState(null, '', hash);
  state.lastListHash = hash;
}

function navigate(hash, { replace = false, keepScroll = false } = {}) {
  if (replace) {
    history.replaceState(null, '', hash);
    render({ keepScroll });
  } else {
    location.hash = hash;
  }
}

function renderFreshness() {
  const el = document.getElementById('freshness');
  const { meta } = state.data;
  const stale = meta.sources.some((s) => s.status !== 'ok');
  el.innerHTML = html`<span class="freshness__dot ${stale ? 'is-stale' : ''}" aria-hidden="true"></span>Données mises à jour ${formatRelativeTime(meta.generatedAt)} · ${formatInt(meta.counts.opportunities)} opportunités, ${formatInt(meta.counts.cohesion)} programmes régionaux${stale ? ' · une source n’a pas pu être actualisée' : ''} · <a href="#/sources">Sources</a>`.toString();
}

function render({ keepScroll = false } = {}) {
  const r = parseHash();
  const changedPage = !state.route || state.route.name !== r.name || state.route.id !== r.id;
  state.route = r;
  const view = ROUTES[r.name];
  if (FILTERED.has(r.name)) {
    state.filters = filtersFromParams(r.params);
    state.lastListHash = location.hash || '#/';
  }
  const ctx = {
    root: main,
    data: state.data,
    params: { ...Object.fromEntries(r.params), id: r.id },
    filters: state.filters || filtersFromParams(new URLSearchParams()),
    getFilters: () => state.filters,
    setFilters,
    navigate,
    lastListHash: state.lastListHash,
  };
  main.innerHTML = view.render(ctx).toString();
  view.mount?.(ctx);
  document.title = r.name === '' ? 'EU Funding Gateway' : `${view.title} · EU Funding Gateway`;
  for (const a of $$('.nav a')) {
    const active = a.dataset.route === (r.name || 'explorer') || (r.name === 'opportunite' && a.dataset.route === 'explorer');
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  $('#nav').classList.remove('is-open');
  $('.nav-toggle').setAttribute('aria-expanded', 'false');
  if (changedPage && !keepScroll) {
    window.scrollTo(0, 0);
    if (state.booted) main.focus({ preventScroll: true });
  }
  state.booted = true;
}

async function boot() {
  $('.nav-toggle').addEventListener('click', (e) => {
    const open = $('#nav').classList.toggle('is-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  try {
    state.data = await source.load();
  } catch (err) {
    main.innerHTML = html`<div class="page-head"><h1>Données indisponibles</h1><p>${err.message}. Rechargez la page dans quelques instants.</p></div>`.toString();
    return;
  }
  renderFreshness();
  window.addEventListener('hashchange', () => render());
  render();

  source.subscribe((next, prev) => {
    const before = new Set(prev.opportunities.map((o) => o.id));
    const added = next.opportunities.filter((o) => !before.has(o.id)).length;
    state.data = next;
    renderFreshness();
    if (state.route.name !== 'opportunite') render({ keepScroll: true });
    toast(added ? `Données actualisées : ${formatInt(added)} nouvelle${added > 1 ? 's' : ''} opportunité${added > 1 ? 's' : ''}.` : 'Données actualisées.');
  });
  setInterval(renderFreshness, 60000);
}

boot();
