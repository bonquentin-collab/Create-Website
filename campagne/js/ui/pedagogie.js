// Section « Comprendre » : fiches des niches, cartes des idées reçues, citations, données du graphique des taux.
import { niches, heritiers, citations, faits, baremes } from "../donnees/sources.js";
import { bareme } from "../moteur/modele.js";
import { comparer } from "../moteur/comparaison.js";
import { nombre } from "./format.js";

const ICONES = {
  dutreil: '<path d="M4 34V16l10-6v8l10-6v8l10-6v20z"/><path d="M4 34h32"/><path d="M12 28h4M22 28h4"/>',
  assuranceVie: '<path d="M20 5 7 10v9c0 8 6 14 13 16 7-2 13-8 13-16v-9z"/><path d="m14 20 4 4 8-8"/>',
  demembrement: '<path d="M5 19 20 7l15 12"/><path d="M9 16v18h22V16"/><path d="M20 34V22" stroke-dasharray="3 3"/>',
  abattement: '<rect x="6" y="14" width="28" height="20" rx="2"/><path d="M6 20h28M20 14v20"/><path d="M20 14c-4-6-10-6-10-2s6 2 10 2c4 0 10 2 10-2s-6-4-10 2"/>',
  pvl: '<path d="M5 33 15 22l7 6L35 10"/><path d="M27 10h8v8"/><path d="M5 37h30" stroke-dasharray="2 4"/>',
};

export function fichesNiches(conteneur) {
  conteneur.innerHTML = niches.fiches.map((f) => `
    <article class="niche">
      <svg viewBox="0 0 40 40" aria-hidden="true">${ICONES[f.id]}</svg>
      <h4>${f.nom}</h4>
      <p>${f.principe}</p>
      <p class="cout">${f.cout}<small>${f.periode}</small></p>
      <p class="art">${f.article}. ${f.detail} <a href="${f.url}">${f.source}</a>.</p>
    </article>`).join("");
}

const NOMS = { "P80-90": "Top 20 à 10 %", "P90-95": "Top 10 à 5 %", "P95-99": "Top 5 à 1 %", "P99-99,5": "Top 1 à 0,5 %", "P99,5-99,9": "Top 0,5 à 0,1 %", "P99,9-100": "Top 0,1 %" };
const montant = (a) => (a >= 1e6 ? `${nombre(a / 1e6, a >= 1e7 ? 0 : 1)} M€` : `${nombre(a / 1000)} 000 €`);

// Taux du barème : héritage net moyen de la tranche, reçu pour moitié de chaque parent, 100 000 € d'abattement chacun.
export function donneesTaux() {
  return heritiers.tranches.filter((t) => NOMS[t.id]).map((t) => ({
    nom: NOMS[t.id],
    montant: montant(t.a),
    bareme: (100 * 2 * bareme(Math.max(0, t.a / 2 - 100_000), baremes.actuel)) / t.a,
    reel: 100 * t.tauxEco,
  }));
}

const MYTHES = [
  { idee: "Tout le monde paie des droits de succession.", gros: "1 sur 4",
    texte: () => `En 2022, sur ${nombre(faits.deces[2022])} décès, ${nombre(faits.declarations2022.payantes)} seulement ont donné lieu au paiement de droits.`,
    source: "Cour des comptes, Les droits de succession, 2024, tableau 7" },
  { idee: "L'héritage aide à démarrer dans la vie.", gros: "50 ans",
    texte: () => `C'est l'âge moyen auquel on hérite de ses parents, et ce sera ${faits.ageHeritage.en2035} ans en 2035. L'héritage arrive quand la vie est déjà faite.`,
    source: "Cour des comptes, 2024, d'après France Stratégie" },
  { idee: "Tout le monde hérite un jour d'un beau patrimoine.", gros: "70 000 €",
    texte: () => `La moitié d'une génération reçoit moins que cela sur toute sa vie, souvent rien. Le 1 % qui hérite le plus reçoit 4,2 millions.`,
    source: "CAE, note n° 69, 2021" },
  { idee: "Ils ont payé des impôts toute leur vie.", gros: () => `+${nombre(100 * (faits.logement[2025] / faits.logement[2000] - 1))} %`,
    texte: () => `C'est la hausse du prix des logements depuis 2000, contre +${nombre(100 * (faits.prix[2025] / faits.prix[2000] - 1))} % pour les prix. La plus-value sur la résidence principale n'est jamais imposée, et au décès toutes les plus-values sont effacées : un bien peut passer de génération en génération « sans jamais avoir à payer l'impôt sur les plus-values ».`,
    source: "Insee, prix des logements anciens ; Eurostat, prix à la consommation ; CAE, note n° 69, 2021" },
  { idee: "Taxer l'héritage, c'est une double imposition.", gros: () => `${nombre(Math.round(100 * comparer().heritage / 300_000))} %`,
    texte: () => {
      const c = comparer();
      const k = (x) => `${nombre(Math.round(x / 100) * 100)} €`;
      return `C'est ce que paie un enfant qui hérite de 300\u00a0000\u00a0€ d'un parent (${k(c.heritage)}). Gagner la même somme en travaillant coûte ${k(c.salaire)} de CSG et d'impôt sur le revenu, ${k(c.capital)} en dividendes. L'héritier n'a payé aucun impôt sur la formation de ce patrimoine, dont 60 % est lui-même hérité : ne pas le taxer, c'est fabriquer une société d'héritiers.`;
    },
    source: "Barèmes 2026, calcul du site (voir Méthode) ; CAE, note n° 69, 2021" },
];

export function mythes(conteneur) {
  conteneur.innerHTML = MYTHES.map((m, i) => `
    <div class="carte-mythe" data-retournee="false">
      <button type="button" aria-pressed="false" aria-label="Retourner la carte : ${m.idee}">
        <div class="faces">
          <div class="face avant"><q>${m.idee}</q><span class="indice">Ce qu'on entend · retourner</span></div>
          <div class="face arriere"><span class="gros">${typeof m.gros === "function" ? m.gros() : m.gros}</span><p>${m.texte()}</p><span class="source">${m.source}</span></div>
        </div>
      </button>
    </div>`).join("");
  conteneur.querySelectorAll(".carte-mythe").forEach((c) => {
    const b = c.querySelector("button");
    b.addEventListener("click", () => {
      const v = c.dataset.retournee !== "true";
      c.dataset.retournee = v; b.setAttribute("aria-pressed", v);
    });
  });
}

export function citationsTextes() {
  const cae = document.getElementById("citation-cae");
  cae.innerHTML = `« ${citations.cae.texte} »<footer><a href="${citations.cae.url}">${citations.cae.source}</a></footer>`;
  document.getElementById("citation-mirabeau").textContent = `« ${citations.mirabeau.texte} »`;
  document.getElementById("source-mirabeau").innerHTML = `<a href="${citations.mirabeau.url}">${citations.mirabeau.source}</a>.`;
}
