// Financial instruments catalogue (loans, guarantees, equity).

import { html, $$ } from '../lib/dom.mjs';
import { formatEur } from '../lib/format.mjs';

export default {
  title: 'Instruments financiers',
  render({ data, params }) {
    const items = data.instruments;
    const forms = [...new Set(items.flatMap((i) => i.forms))];
    const active = params.forme && forms.includes(params.forme) ? params.forme : '';
    const shown = active ? items.filter((i) => i.forms.includes(active)) : items;
    return html`
      <header class="page-head">
        <h1>Instruments financiers</h1>
        <p>Prêts, garanties et fonds propres soutenus par l’UE. Il n’y a pas d’appel à projets : on y accède par une banque, un fonds ou une institution partenaire.</p>
      </header>
      <div class="chips" role="group" aria-label="Filtrer par forme de financement">
        <button type="button" class="chip" data-forme="" aria-pressed="${!active}">Toutes les formes</button>
        ${forms.map((f) => html`<button type="button" class="chip" data-forme="${f}" aria-pressed="${active === f}">${f}</button>`)}
      </div>
      <div class="inst-list">
        ${shown.map((i) => html`
          <article class="inst">
            <div>
              <h3><a href="${i.url}" target="_blank" rel="noopener">${i.name}</a></h3>
              <p class="inst__family">${i.family}</p>
              <p style="margin-top:10px">${i.summary}</p>
              ${i.amount ? html`<p style="margin-top:10px"><span class="inst__amount">${formatEur(i.amount)}</span> <span class="chart__sub">${i.amountLabel}</span></p>` : ''}
              <div class="inst__tags">${i.forms.map((f) => html`<span class="tag">${f}</span>`)}</div>
            </div>
            <dl>
              <div><dt>Pour qui</dt><dd>${i.audience.join(', ')}</dd></div>
              <div><dt>Comment y accéder</dt><dd>${i.access}</dd></div>
            </dl>
          </article>`)}
      </div>
      <p class="chart__sub" style="margin-top:16px">Catalogue relu manuellement. Les conditions, plafonds et intermédiaires évoluent : la page officielle de chaque instrument fait foi.</p>`;
  },
  mount({ root, navigate }) {
    for (const b of $$('[data-forme]', root)) {
      b.addEventListener('click', () => navigate(b.dataset.forme ? `#/instruments?forme=${encodeURIComponent(b.dataset.forme)}` : '#/instruments', { replace: true, keepScroll: true }));
    }
  },
};
