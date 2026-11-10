// Home: hero + deadline strip + faceted list of every live opportunity.

import { html, raw, $ } from '../lib/dom.mjs';
import { config } from '../config.mjs';
import { applyFilters, SORTS } from '../lib/filter.mjs';
import { formatInt, formatDay } from '../lib/format.mjs';
import { renderFilters, bindFilters, syncFilters, renderStrip, bindStrip, renderChips, removeChip, renderRow } from './components.mjs';

let firstPaint = true;

function resultsHtml(items, f, limit) {
  const list = applyFilters(items, f);
  const shown = list.slice(0, limit);
  return html`
    <div class="results__bar">
      <p class="results__count" role="status" aria-live="polite"><strong>${formatInt(list.length)}</strong> ${list.length > 1 ? 'opportunités' : 'opportunité'}</p>
      <div class="results__tools">
        <label for="f-sort">Trier par</label>
        <select class="select" id="f-sort">${Object.entries(SORTS).map(([v, l]) => html`<option value="${v}" ${raw(f.sort === v ? 'selected' : '')}>${l}</option>`)}</select>
      </div>
    </div>
    ${renderChips(f)}
    ${shown.length
      ? html`<ol class="list">${shown.map((o) => renderRow(o))}</ol>
        ${list.length > shown.length ? html`<div class="more"><button class="btn" type="button" data-more>Afficher ${Math.min(config.PAGE_SIZE, list.length - shown.length)} de plus</button></div>` : ''}`
      : html`<div class="panel empty"><p>Aucune opportunité ne correspond à ces filtres. Retirez un filtre ou élargissez la période de clôture.</p></div>`}`;
}

export default {
  title: 'Explorer',
  render({ data, filters }) {
    const opp = data.opportunities;
    const open = opp.filter((o) => o.status === 'open').length;
    const soon = opp.length - open;
    return html`
      <section class="hero">
        <h1>Les financements européens ouverts, au même endroit</h1>
        <p class="hero__lede"><strong>${formatInt(open)} appels ouverts</strong> et <strong>${formatInt(soon)} à venir</strong> : subventions, financements en cascade, action extérieure et marchés publics de l’UE. Les fonds régionaux et les instruments financiers ont leurs propres pages. Données du ${formatDay(data.meta.generatedAt.slice(0, 10))}.</p>
        <form class="search" role="search" id="search">
          <label class="visually-hidden" for="q">Rechercher un financement</label>
          <input id="q" name="q" type="search" placeholder="Mot-clé ou référence" value="${filters.q}" autocomplete="off">
          <button type="submit">Rechercher</button>
        </form>
      </section>
      ${renderStrip(opp, filters, { entering: firstPaint })}
      <div class="explorer">
        ${renderFilters(opp, filters)}
        <section id="results" aria-label="Résultats">${resultsHtml(opp, filters, config.PAGE_SIZE)}</section>
      </div>`;
  },
  mount({ root, data, getFilters, setFilters }) {
    firstPaint = false;
    const opp = data.opportunities;
    let limit = config.PAGE_SIZE;

    const update = (f, { scroll = false } = {}) => {
      limit = config.PAGE_SIZE;
      setFilters(f);
      refresh();
      if (scroll) $('#results', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const refresh = () => {
      const f = getFilters();
      $('#results', root).innerHTML = resultsHtml(opp, f, limit);
      const strip = $('#strip', root);
      const focused = document.activeElement?.dataset?.week;
      strip.outerHTML = renderStrip(opp, f).toString();
      bindStrip(root, getFilters, (nf) => update(nf));
      if (focused) root.querySelector(`[data-week="${focused}"]`)?.focus();
      syncFilters(root, opp, f);
    };

    bindFilters(root, getFilters, (f) => update(f));
    bindStrip(root, getFilters, (f) => update(f));

    const q = $('#q', root);
    let t;
    q.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => update({ ...getFilters(), q: q.value.trim() }), 180);
    });
    $('#search', root).addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(t);
      update({ ...getFilters(), q: q.value.trim() }, { scroll: true });
    });

    $('#results', root).addEventListener('click', (e) => {
      if (e.target.closest('[data-more]')) {
        limit += config.PAGE_SIZE;
        $('#results', root).innerHTML = resultsHtml(opp, getFilters(), limit);
        return;
      }
      const chip = e.target.closest('[data-chip]');
      if (chip) {
        const nf = removeChip(getFilters(), chip.dataset.chip);
        if (chip.dataset.chip === 'q') q.value = '';
        update(nf);
      }
    });
    $('#results', root).addEventListener('change', (e) => {
      if (e.target.id === 'f-sort') update({ ...getFilters(), sort: e.target.value });
    });
  },
};
