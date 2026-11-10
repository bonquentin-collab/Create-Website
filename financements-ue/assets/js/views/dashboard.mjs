// Dashboard: headline figures + ranked bar charts, each with a table view.

import { html, raw } from '../lib/dom.mjs';
import { filtersToParams, EMPTY_FILTERS } from '../lib/filter.mjs';
import { KIND_LABELS, formatEur, formatInt, todayIso, addDays, formatMonth, parseDay } from '../lib/format.mjs';

const explorerLink = (patch) => `#/?${filtersToParams({ ...EMPTY_FILTERS, ...patch })}`;

/**
 * Ranked horizontal bars. Single series → one colour, value labelled at the end
 * of each bar, a table view for screen readers and exact figures.
 */
function hbars({ id, title, sub, rows, format, valueLabel, wide = false, note = '' }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return html`
    <section class="chart ${raw(wide ? 'chart--wide' : '')}" aria-labelledby="${id}">
      <div><h2 id="${id}">${title}</h2>${sub ? html`<p class="chart__sub">${sub}</p>` : ''}</div>
      <div class="hbars" role="list">
        ${rows.map((r) => html`
          <div class="hbar" role="listitem" title="${r.label} : ${format(r.value)}">
            <span class="hbar__label">${r.href ? html`<a href="${r.href}">${r.label}</a>` : r.label}</span>
            <span class="hbar__track" aria-hidden="true"><span class="hbar__fill" style="display:block;width:${((r.value / max) * 100).toFixed(2)}%"></span></span>
            <span class="hbar__value">${format(r.value)}</span>
          </div>`)}
      </div>
      ${note ? html`<p class="chart__sub">${note}</p>` : ''}
      <details class="table-view"><summary>Voir le tableau</summary>
        <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">${title}</th><th scope="col" class="num">${valueLabel}</th></tr></thead>
        <tbody>${rows.map((r) => html`<tr><td>${r.label}</td><td class="num">${format(r.value)}</td></tr>`)}</tbody></table></div>
      </details>
    </section>`;
}

function groupSum(items, key, val) {
  const m = new Map();
  for (const it of items) m.set(key(it), (m.get(key(it)) || 0) + val(it));
  return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default {
  title: 'Tableau de bord',
  render({ data }) {
    const opp = data.opportunities;
    const today = todayIso();
    const open = opp.filter((o) => o.status === 'open');
    const soon = opp.filter((o) => o.status === 'forthcoming');
    const funding = opp.filter((o) => o.kind !== 'tender');
    const fundingBudget = funding.reduce((s, o) => s + (o.budget || 0), 0);
    const closing30 = opp.filter((o) => o.deadline && o.deadline <= addDays(today, 30)).length;
    const cohesionTotal = data.cohesion.reduce((s, p) => s + p.eu, 0);

    const byProgramme = groupSum(funding.filter((o) => o.budget), (o) => o.programme, (o) => o.budget)
      .slice(0, 10)
      .map((r) => ({ ...r, href: explorerLink({ programme: r.label }) }));
    const byKind = groupSum(opp, (o) => o.kind, () => 1).map((r) => ({ label: KIND_LABELS[r.label], value: r.value, href: explorerLink({ kinds: [r.label] }) }));

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = parseDay(`${today.slice(0, 7)}-01`);
      d.setUTCMonth(d.getUTCMonth() + i);
      return d.toISOString().slice(0, 7);
    });
    const byMonth = months.map((m) => ({ label: formatMonth(parseDay(`${m}-01`)), value: opp.filter((o) => o.deadline?.startsWith(m)).length }));

    const EU27 = new Set('AT BE BG CY CZ DE DK EE EL ES FI FR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK'.split(' '));
    const byCountry = groupSum(data.cohesion.filter((p) => EU27.has(p.country)), (p) => `${p.countryName}|${p.country}`, (p) => p.eu).map((r) => {
      const [label, code] = r.label.split('|');
      return { label, value: r.value, href: `#/fonds-regionaux?pays=${code}` };
    });
    const byFund = groupSum(data.cohesion.flatMap((p) => p.funds), (f) => f.fund, (f) => f.eu);

    return html`
      <header class="page-head">
        <h1>Tableau de bord</h1>
        <p>Vue d’ensemble des financements européens disponibles aujourd’hui et des enveloppes 2021-2027 de la politique de cohésion.</p>
      </header>
      <section class="stats" aria-label="Chiffres clés">
        <div class="stat"><span class="stat__value">${formatInt(open.length)}</span><span class="stat__label">opportunités ouvertes</span><span class="stat__note">candidature possible aujourd’hui</span></div>
        <div class="stat"><span class="stat__value">${formatInt(soon.length)}</span><span class="stat__label">à venir</span><span class="stat__note">annoncées, pas encore ouvertes</span></div>
        <div class="stat"><span class="stat__value">${formatEur(fundingBudget)}</span><span class="stat__label">de budget annoncé</span><span class="stat__note">subventions, cascade et action extérieure</span></div>
        <div class="stat"><span class="stat__value">${formatInt(closing30)}</span><span class="stat__label">clôtures sous 30 jours</span><span class="stat__note"><a href="${explorerLink({ closing: '30' })}">Voir la liste</a></span></div>
      </section>
      <div class="charts">
        ${hbars({ id: 'c-prog', title: 'Budget annoncé par programme', sub: 'Opportunités ouvertes et à venir hors marchés publics, 10 premiers programmes', rows: byProgramme, format: formatEur, valueLabel: 'Budget' })}
        ${hbars({ id: 'c-kind', title: 'Opportunités par nature', sub: 'Ouvertes et à venir', rows: byKind, format: formatInt, valueLabel: 'Nombre' })}
        ${hbars({ id: 'c-month', title: 'Clôtures par mois', sub: 'Nombre de dates limites sur les 12 prochains mois', rows: byMonth, format: formatInt, valueLabel: 'Clôtures', wide: true })}
        ${hbars({ id: 'c-country', title: 'Politique de cohésion : dotation UE par État membre', sub: `Programmes 2021-2027, ${formatEur(cohesionTotal)} au total (y compris Interreg et pays associés). Cliquez sur un pays pour voir ses programmes.`, rows: byCountry, format: formatEur, valueLabel: 'Montant UE', wide: true })}
        ${hbars({ id: 'c-fund', title: 'Politique de cohésion : répartition par fonds', sub: 'Montant UE programmé 2021-2027', rows: byFund, format: formatEur, valueLabel: 'Montant UE', wide: true })}
      </div>`;
  },
};
