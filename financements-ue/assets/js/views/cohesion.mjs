// Shared-management funds: 2021-2027 programmes per Member State.

import { html, raw, $ } from '../lib/dom.mjs';
import { formatEur, formatPct, formatInt } from '../lib/format.mjs';

const EU27 = 'AT BE BG CY CZ DE DK EE EL ES FI FR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK'.split(' ');
const KOHESIO_ISO = { EL: 'GR' };

function countryBlock(programmes, code) {
  const list = programmes.filter((p) => p.country === code).sort((a, b) => b.eu - a.eu);
  if (!list.length) return html`<div class="panel empty"><p>Aucun programme trouvé pour ce territoire.</p></div>`;
  const name = list[0].countryName;
  const total = list.reduce((s, p) => s + p.eu, 0);
  const fi = list.reduce((s, p) => s + p.eu * (p.fiShare || 0), 0);
  const funds = new Map();
  for (const p of list) for (const f of p.funds) funds.set(f.fund, (funds.get(f.fund) || 0) + f.eu);
  return html`
    <section class="section" aria-labelledby="c-name">
      <div>
        <h2 id="c-name">${name} : ${formatEur(total)} de fonds européens programmés</h2>
        <p class="chart__sub">${formatInt(list.length)} programmes 2021-2027, dont ${formatEur(fi)} sous forme d’instruments financiers (${formatPct(total ? fi / total : 0)}).</p>
      </div>
      <p class="fund-split">${[...funds].sort((a, b) => b[1] - a[1]).map(([f, v]) => html`<span><strong>${f}</strong> ${formatEur(v)}</span>`)}</p>
      <div class="panel table-wrap" style="padding:0">
        <table class="data-table" style="margin:0">
          <caption class="visually-hidden">Programmes de ${name}</caption>
          <thead><tr><th scope="col">Programme</th><th scope="col">Fonds</th><th scope="col">Priorités principales</th><th scope="col" class="num">Montant UE</th><th scope="col" class="num">Part instruments financiers</th></tr></thead>
          <tbody>${list.map((p) => html`
            <tr>
              <td><a href="${p.url}" target="_blank" rel="noopener">${p.title}</a><br><small class="chart__sub">${p.cci}</small></td>
              <td>${p.funds.map((f) => f.fund).join(', ')}</td>
              <td>${p.objectives.join(' ; ')}</td>
              <td class="num">${formatEur(p.eu)}</td>
              <td class="num">${p.fiShare ? formatPct(p.fiShare) : '—'}</td>
            </tr>`)}
          </tbody>
        </table>
      </div>
      <p>
        <a class="btn" href="https://kohesio.ec.europa.eu/en/projects?country=${KOHESIO_ISO[code] || code}" target="_blank" rel="noopener">Voir les projets déjà financés (Kohesio)</a>
      </p>
    </section>`;
}

export default {
  title: 'Fonds régionaux',
  render({ data, params }) {
    const programmes = data.cohesion;
    const codes = [...new Set(programmes.map((p) => p.country))];
    const names = Object.fromEntries(programmes.map((p) => [p.country, p.countryName]));
    const eu = EU27.filter((c) => codes.includes(c)).sort((a, b) => names[a].localeCompare(names[b], 'fr'));
    const other = codes.filter((c) => !EU27.includes(c)).sort();
    const selected = codes.includes(params.pays) ? params.pays : 'FR';
    return html`
      <header class="page-head">
        <h1>Fonds régionaux et de cohésion</h1>
        <p>FEDER, FSE+, Fonds de cohésion, Fonds pour une transition juste, Interreg et fonds affaires intérieures : ces fonds sont gérés par chaque État membre ou région, qui publie ses propres appels.</p>
      </header>
      <div class="prose panel">
        <p><strong>Comment candidater.</strong> Les appels sont lancés par l’autorité de gestion du programme (souvent le conseil régional ou un ministère). Repérez le programme de votre territoire ci-dessous, puis consultez la page de son autorité de gestion. L’annuaire officiel est sur le site de la <a href="https://ec.europa.eu/regional_policy/in-your-country/managing-authorities_en" target="_blank" rel="noopener">politique régionale de la Commission</a>.</p>
      </div>
      <div class="section">
        <div class="country-picker">
          <div>
            <label class="field-label" for="country">Territoire</label><br>
            <select class="select" id="country">
              <optgroup label="États membres">${eu.map((c) => html`<option value="${c}" ${raw(c === selected ? 'selected' : '')}>${names[c]}</option>`)}</optgroup>
              <optgroup label="Coopération et pays associés">${other.map((c) => html`<option value="${c}" ${raw(c === selected ? 'selected' : '')}>${names[c]}</option>`)}</optgroup>
            </select>
          </div>
        </div>
      </div>
      <div id="country-block">${countryBlock(programmes, selected)}</div>
      <p class="chart__sub" style="margin-top:20px">Source : Cohesion Open Data, jeu « 2021-2027 Planned finances detailed ». Montants UE programmés, hors cofinancement national.</p>`;
  },
  mount({ root, navigate }) {
    $('#country', root).addEventListener('change', (e) => {
      navigate(`#/fonds-regionaux?pays=${e.target.value}`, { replace: true, keepScroll: true });
    });
  },
};
