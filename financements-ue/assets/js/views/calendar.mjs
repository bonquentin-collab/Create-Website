// Deadlines grouped by month and day, with iCal export of the filtered set.

import { html, raw, $, idToSlug } from '../lib/dom.mjs';
import { applyFilters } from '../lib/filter.mjs';
import { downloadIcs } from '../lib/ics.mjs';
import { KIND_LABELS, formatMonth, formatDow, parseDay, formatInt, todayIso, formatEur } from '../lib/format.mjs';
import { config } from '../config.mjs';
import { renderFilters, bindFilters, syncFilters, renderChips, removeChip, statusPill } from './components.mjs';

const MAX_DAYS = 120;

function calendarHtml(items, f) {
  const list = applyFilters(items, { ...f, sort: 'deadline' }).filter((o) => o.deadline);
  const today = todayIso();
  const months = new Map();
  for (const o of list) {
    const m = o.deadline.slice(0, 7);
    if (!months.has(m)) months.set(m, new Map());
    const days = months.get(m);
    if (!days.has(o.deadline)) days.set(o.deadline, []);
    days.get(o.deadline).push(o);
  }
  let dayBudget = MAX_DAYS;
  const blocks = [];
  for (const [m, days] of months) {
    if (dayBudget <= 0) break;
    const entries = [...days].slice(0, dayBudget);
    dayBudget -= entries.length;
    const count = [...days.values()].reduce((s, d) => s + d.length, 0);
    blocks.push(html`
      <section class="month" aria-labelledby="m-${m}">
        <div class="month__head"><h2 id="m-${m}">${formatMonth(parseDay(`${m}-01`))}</h2><span>${formatInt(count)} clôture${count > 1 ? 's' : ''}</span></div>
        ${entries.map(([day, os]) => html`
          <div class="day">
            <div class="day__date"><div class="day__num">${Number(day.slice(8))}</div><div class="day__dow">${day === today ? 'auj.' : formatDow(parseDay(day))}</div></div>
            <ul class="day__items">${os.map((o) => html`
              <li>${statusPill(o)} <a href="#/opportunite/${idToSlug(o.id)}">${o.title}</a>
                <small>${KIND_LABELS[o.kind]} · ${o.programme}${o.budget ? ` · ${formatEur(o.budget)}` : ''}</small></li>`)}
            </ul>
          </div>`)}
      </section>`);
  }
  const noDate = applyFilters(items, f).filter((o) => !o.deadline).length;
  return html`
    <div class="results__bar">
      <p class="results__count" role="status" aria-live="polite"><strong>${formatInt(list.length)}</strong> dates de clôture</p>
      ${config.CAN_DOWNLOAD ? html`<button class="btn" type="button" data-ics ${raw(list.length ? '' : 'disabled')}>Exporter vers mon agenda (.ics)</button>` : ''}
    </div>
    ${renderChips(f)}
    ${blocks.length ? blocks : html`<div class="panel empty"><p>Aucune clôture ne correspond à ces filtres.</p></div>`}
    ${dayBudget <= 0 ? html`<p class="chart__sub">Affichage limité aux ${MAX_DAYS} prochaines dates. Affinez les filtres pour voir la suite.${config.CAN_DOWNLOAD ? ' L’export .ics contient toutes les dates.' : ''}</p>` : ''}
    ${noDate ? html`<p class="chart__sub">${formatInt(noDate)} opportunité${noDate > 1 ? 's' : ''} sans date limite publiée (avis de préinformation, ouvertures à venir) n’apparaissent pas ici.</p>` : ''}`;
}

export default {
  title: 'Calendrier',
  render({ data, filters }) {
    return html`
      <header class="page-head">
        <h1>Calendrier des clôtures</h1>
        <p>Toutes les dates limites à venir, jour par jour.${config.CAN_DOWNLOAD ? ' Exportez la sélection vers Outlook, Google Agenda ou Apple Calendrier.' : ''}</p>
      </header>
      <div class="cal-layout">
        ${renderFilters(data.opportunities, filters)}
        <section id="cal">${calendarHtml(data.opportunities, filters)}</section>
      </div>`;
  },
  mount({ root, data, getFilters, setFilters }) {
    const opp = data.opportunities;
    const update = (f) => {
      setFilters(f);
      $('#cal', root).innerHTML = calendarHtml(opp, f);
      syncFilters(root, opp, f);
    };
    bindFilters(root, getFilters, update);
    $('#cal', root).addEventListener('click', (e) => {
      if (e.target.closest('[data-ics]')) {
        const list = applyFilters(opp, { ...getFilters(), sort: 'deadline' }).filter((o) => o.deadline);
        downloadIcs(list);
      }
      const chip = e.target.closest('[data-chip]');
      if (chip) update(removeChip(getFilters(), chip.dataset.chip));
    });
  },
};
