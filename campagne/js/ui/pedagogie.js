// Section « Comprendre » : fiches des niches, cartes des mythes, citations, données du graphique des taux.
import { niches, heritiers, citations, faits, baremes } from "../donnees/sources.js";
import { bareme } from "../moteur/modele.js";
import { comparer, parametres2026 } from "../moteur/comparaison.js";
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

const NOMS = { "P80-90": "Top 20–10 %", "P90-95": "Top 10–5 %", "P95-99": "Top 5–1 %", "P99-99,5": "Top 1–0,5 %", "P99,5-99,9": "Top 0,5–0,1 %", "P99,9-100": "Top 0,1 %" };
const montant = (a) => (a >= 1e6 ? `${nombre(a / 1e6, a >= 1e7 ? 0 : 1)} M€` : `${nombre(a / 1000)} 000 €`);

// Taux théorique (droits / héritage déclaré) et taux effectivement payé (droits / héritage économique), en %.
// Les 80 % du bas sont regroupés, pondérés par ce qu'ils reçoivent.
export function donneesTaux() {
  const bas = heritiers.tranches.filter((t) => !NOMS[t.id]);
  const masse = bas.reduce((s, t) => s + t.p * t.a, 0);
  const poids = bas.reduce((s, t) => s + t.p, 0);
  return [
    {
      nom: "80 % du bas",
      montant: montant(Math.round(masse / poids / 1000) * 1000),
      declare: (100 * bas.reduce((s, t) => s + t.p * t.a * t.tauxDeclare, 0)) / masse,
      reel: (100 * bas.reduce((s, t) => s + t.p * t.a * t.tauxEco, 0)) / masse,
    },
    ...heritiers.tranches.filter((t) => NOMS[t.id]).map((t) => ({ nom: NOMS[t.id], montant: montant(t.a), declare: 100 * t.tauxDeclare, reel: 100 * t.tauxEco })),
  ];
}

// Héritier de 300 000 € (150 000 € de chaque parent, 100 000 € d'abattement par parent) et même somme gagnée
// en salaire brut sur dix ans (CSG, CRDS et impôt sur le revenu 2026 : moteur/comparaison.js).
const heritage300 = () => 2 * bareme(150_000 - 100_000, baremes.actuel);
const salaire300 = () => comparer(300_000, { ...parametres2026, annees: 10 }).salaire;

const MYTHES = [
  { idee: "Tout le monde paie des droits de succession", gros: () => `${nombre(Math.round(100 * (1 - faits.declarations2022.payantes / faits.deces[2022]) / 5) * 5)} %`,
    texte: () => `des successions ne paient aucun droit : en 2022, sur ${nombre(faits.deces[2022])} décès, ${nombre(faits.declarations2022.payantes)} seulement ont donné lieu au paiement de droits.`,
    source: "Cour des comptes, Les droits de succession, 2024, tableau 7 (données DGFiP)" },
  { idee: "L'héritage est un coup de pouce aux jeunes", gros: "50 ans",
    texte: () => `C'est l'âge moyen auquel on hérite aujourd'hui, contre 30 ans au début du XX<sup>e</sup> siècle. Ce sera ${faits.ageHeritage.en2035} ans en 2035.`,
    source: "CAE, note n° 69, 2021 ; Cour des comptes, 2024, d'après France Stratégie" },
  { idee: "Tout le monde hérite un jour d'un beau patrimoine", gros: "70 000 €",
    texte: () => "La moitié d'une génération reçoit moins que cela sur toute sa vie. Le 1 % qui hérite le plus reçoit 4,2 millions en moyenne.",
    source: "CAE, note n° 69, 2021" },
  { idee: "Taxer l'héritage est injuste", gros: () => `${nombre((100 * heritage300()) / 300_000, 1)} %`,
    texte: () => `C'est ce que paie en impôt un enfant qui hérite de 300 000 € de ses parents (150 000 € de chacun), ce qui le place déjà parmi les 15 % qui héritent le plus. Gagner la même somme en salaire sur dix ans coûterait environ ${nombre(Math.round(salaire300() / 1000) * 1000)} € de CSG et d'impôt sur le revenu, soit ${nombre((100 * salaire300()) / 300_000)} %.`,
    source: "Barèmes 2026, abattement de 100 000 € par parent, calcul du site ; top 15 % : CAE, note n° 69, 2021" },
];

export function mythes(conteneur) {
  conteneur.innerHTML = MYTHES.map((m) => `
    <div class="carte-mythe" data-retournee="false">
      <button type="button" aria-pressed="false" aria-label="Retourner la carte : ${m.idee}">
        <div class="faces">
          <div class="face avant"><q>${m.idee}</q></div>
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
  const bloc = document.getElementById("citation-mirabeau");
  const src = document.getElementById("source-mirabeau");
  if (!citations.mirabeau) { bloc.hidden = true; src.hidden = true; return; }
  bloc.textContent = `« ${citations.mirabeau.texte} »`;
  src.innerHTML = citations.mirabeau.url ? `<a href="${citations.mirabeau.url}">${citations.mirabeau.source}</a>.` : `${citations.mirabeau.source}.`;
}
