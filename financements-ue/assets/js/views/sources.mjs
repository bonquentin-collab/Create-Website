// Sources, freshness and method.

import { html } from '../lib/dom.mjs';
import { formatInt, formatRelativeTime } from '../lib/format.mjs';

const STATUS = { ok: 'À jour', stale: 'Données conservées (échec de la dernière collecte)', error: 'Indisponible' };

export default {
  title: 'Sources',
  render({ data }) {
    const { meta } = data;
    return html`
      <header class="page-head">
        <h1>Sources et méthode</h1>
        <p>Toutes les données viennent de sources publiques de l’Union européenne. Elles sont collectées automatiquement une fois par jour.</p>
      </header>
      <div class="panel table-wrap" style="padding:0">
        <table class="data-table" style="margin:0">
          <thead><tr><th scope="col">Source</th><th scope="col">Type</th><th scope="col">État</th><th scope="col">Dernière collecte</th><th scope="col" class="num">Enregistrements</th></tr></thead>
          <tbody>${meta.sources.map((s) => html`
            <tr>
              <td><a href="${s.homepage}" target="_blank" rel="noopener">${s.label}</a><br><small class="chart__sub">${s.description}</small></td>
              <td>${s.mode === 'live' ? 'Flux live' : 'Catalogue'}</td>
              <td><span class="src-status src-status--${s.status}">${STATUS[s.status] || s.status}</span></td>
              <td>${s.updatedAt ? formatRelativeTime(s.updatedAt) : '—'}</td>
              <td class="num">${formatInt(s.count || 0)}</td>
            </tr>`)}
          </tbody>
        </table>
      </div>
      <div class="prose section">
        <h2>Ce qui est affiché</h2>
        <p><strong>Flux live.</strong> Le portail Funding &amp; Tenders de la Commission est interrogé chaque jour via son API de recherche publique. Le portail garde le statut « ouvert » sur des appels dont la date limite est passée : chaque enregistrement est donc requalifié. Une opportunité est retirée quand toutes ses dates limites sont dépassées, ou quand elle n’a pas de date limite et a été publiée il y a plus d’un an.</p>
        <p><strong>Fonds régionaux.</strong> Les programmes 2021-2027 et leurs montants viennent de la plateforme Cohesion Open Data. Les appels de ces programmes sont publiés par chaque autorité de gestion. Ils pourront être ajoutés pays par pays sous forme de nouvelles sources.</p>
        <p><strong>Instruments financiers.</strong> Le catalogue est rédigé et relu à la main, car ces produits sont distribués par des intermédiaires et non par appels à projets.</p>
        <h2>Limites</h2>
        <p>Les montants affichés sont indicatifs : budget total d’un topic, valeur estimée d’un marché, enveloppe d’un programme. L’heure exacte de clôture, l’éligibilité et les documents à fournir sont sur la page officielle, qui fait foi.</p>
        <p>EU Funding Gateway est un service indépendant. Il n’est ni édité ni approuvé par la Commission européenne.</p>
      </div>`;
  },
};
