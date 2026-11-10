// Single opportunity page.

import { html, $, slugToId } from '../lib/dom.mjs';
import { downloadIcs } from '../lib/ics.mjs';
import { KIND_LABELS, KIND_HELP, formatDay, formatDayLong, formatEur, formatCountdown, daysUntil, formatInt } from '../lib/format.mjs';
import { statusPill, isNew } from './components.mjs';
import { config } from '../config.mjs';

const fact = (label, value) => (value ? html`<div><dt>${label}</dt><dd>${value}</dd></div>` : '');

export default {
  title: 'Opportunité',
  render({ data, params }) {
    const id = slugToId(params.id || '');
    const o = data.opportunities.find((x) => x.id === id);
    if (!o) {
      return html`<div class="page-head"><h1>Opportunité introuvable</h1>
        <p>Elle a probablement été clôturée depuis la dernière mise à jour. <a href="#/">Revenir à l’explorateur</a>.</p></div>`;
    }
    const days = daysUntil(o.deadline);
    const grant = o.grantMin && o.grantMax
      ? o.grantMin === o.grantMax ? formatEur(o.grantMin) : `${formatEur(o.grantMin)} à ${formatEur(o.grantMax)}`
      : null;
    return html`
      <article class="detail">
        <div>
          <a class="detail__back" href="#/" data-back>Retour aux résultats</a>
          <div class="row__meta" style="margin-top:16px">${statusPill(o)} <span class="kind">${KIND_LABELS[o.kind]}</span>
            ${isNew(o) ? html`<span class="status status--new">Nouveau</span>` : ''}${o.notice ? html`<span>${o.notice}</span>` : ''}</div>
          <h1>${o.title}</h1>
          ${o.summary ? html`<p class="detail__summary">${o.summary}</p>` : ''}
          <p class="chart__sub" style="margin-top:12px">${KIND_HELP[o.kind]}</p>
          ${o.themes?.length || o.zones?.length ? html`<div class="tags">${[...(o.themes || []), ...(o.zones || [])].map((t) => html`<span class="tag">${t}</span>`)}</div>` : ''}
          <div class="actions">
            <a class="btn btn--primary" href="${o.url}" target="_blank" rel="noopener">Voir la page officielle</a>
            ${o.deadline && config.CAN_DOWNLOAD ? html`<button class="btn" type="button" data-ics>Ajouter la clôture à mon agenda</button>` : ''}
          </div>
          <p class="chart__sub" style="margin-top:12px">La page officielle fait foi pour l’éligibilité, les documents et l’heure exacte de clôture (souvent 17 h, heure de Bruxelles).</p>
        </div>
        <aside class="panel">
          <dl class="facts">
            ${fact('Date limite', o.deadline ? `${formatDayLong(o.deadline)} (${formatCountdown(days)})` : 'Non publiée')}
            ${o.deadlines?.length > 1 ? fact('Étapes', o.deadlines.map(formatDay).join(', ')) : ''}
            ${fact(o.status === 'forthcoming' ? 'Ouverture prévue' : 'Ouvert depuis', o.opens ? formatDay(o.opens) : null)}
            ${fact(o.kind === 'tender' ? 'Valeur estimée' : 'Budget total', o.budget ? formatEur(o.budget, { precise: true }) : null)}
            ${fact('Contribution UE par projet', grant)}
            ${fact('Projets financés (prévision)', o.grants ? formatInt(o.grants) : null)}
            ${fact('Programme', o.programme)}
            ${fact('Appel', o.callTitle ? `${o.callTitle}${o.call ? ` (${o.call})` : ''}` : o.call)}
            ${fact('Référence', o.ref)}
            ${fact('Type d’action', o.actionType)}
            ${fact(o.kind === 'cascade' ? 'Projet porteur' : 'Autorité', o.authority)}
          </dl>
        </aside>
      </article>`;
  },
  mount({ root, data, params, lastListHash }) {
    const id = slugToId(params.id || '');
    const o = data.opportunities.find((x) => x.id === id);
    const back = $('[data-back]', root);
    if (back && lastListHash) back.setAttribute('href', lastListHash);
    $('[data-ics]', root)?.addEventListener('click', () => downloadIcs([o], `cloture-${String(o.ref || 'appel').replace(/[^\w-]+/g, '_')}.ics`));
  },
};
