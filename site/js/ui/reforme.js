// Section « la réforme » : chiffres clés, choix du chiffrage (étude ou actualisé, hypothèses modifiables),
// piliers et trajectoire des recettes. Le choix est mémorisé pour les pages Simuler (etat-heritage.js).

import { h } from "./dom.js";
import { milliards, milliardsRonds, pourcent } from "../engine/format.js";
import { colonnesEmpilees, tableDonnees } from "./graphiques/colonnes.js";
import { chiffrage } from "../params/igs-chiffrage.js";
import { chiffrerIgs } from "../engine/igs-chiffrage.js";
import { lireEtat, enregistrerEtat, hypothesesDe, appliquerChiffrage } from "./etat-heritage.js";

const COULEURS = { pilier1: "var(--serie-actuel)", pilier2: "var(--serie-tampon)" };
const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct = (v) => `${virgule.format(v * 100)} %`;

// Hypothèses réglables : [clé, libellé, min, max, pas] en pourcentage, et une aide.
const CURSEURS = [
  ["croissancePib", "Croissance annuelle du PIB", 0, 3, 0.1, "L'étude retient +1 % par an. Le flux successoral est une part du PIB : plus de croissance, plus de transmissions."],
  ["fluxCible", "Héritages et donations en 2050, en part du PIB", 18, 28, 0.5, "15 % en 2021, 23 % en 2050 selon le Conseil d'analyse économique : les baby-boomers transmettent."],
  ["rendementTop1", "Croissance annuelle du patrimoine du 1 % le plus riche", 0, 6, 0.1, null],
  ["partPV", "Part de plus-values latentes dans ce patrimoine", 20, 60, 0.1, "41 % selon Saez et al. (2021) : gains jamais taxés, effacés aujourd'hui au décès."],
  ["pfu", "Taux du prélèvement forfaitaire unique (PFU)", 24, 36, 0.1, "30 % en 2024, 31,4 % depuis 2026. Appliqué à 80 % de l'assiette (abattements), moins 20 % de droits déjà payés."],
];

export function monter(racine, contexte) {
  let etat = lireEtat();
  const { reforme: base } = contexte;

  racine.querySelector("[data-piliers]").replaceChildren(
    ...base.piliers.map((p) => h("li", { class: "pilier" }, h("p", { class: "pilier__nom" }, p.nom), h("h3", {}, p.titre), h("p", {}, p.texte))),
  );

  // Bloc de chiffrage
  const zone = racine.querySelector("[data-chiffrage]");
  const boutons = Object.values(chiffrage.scenarios).map((s) => h("button", { type: "button", "data-scenario": s.id, "aria-pressed": "false" }, s.label));
  const description = h("p", { class: "chiffrage__description" });
  const comparaison = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const curseurs = CURSEURS.map(([cle, label, min, max, pas, aide]) => {
    const input = h("input", { type: "range", id: `ch-${cle}`, name: cle, min, max, step: pas });
    const sortie = h("output", { for: `ch-${cle}` });
    const aideEl = h("p", { class: "aide" }, aide ?? "");
    return { cle, input, sortie, aideEl, champ: h("div", { class: "champ" }, h("label", { for: `ch-${cle}` }, `${label} : `, sortie), input, aideEl) };
  });
  const retour = h("button", { type: "button", class: "bouton--discret" }, "Revenir aux hypothèses du scénario");
  const form = h("form", { class: "formulaire formulaire--hypotheses", novalidate: true }, curseurs.map((c) => c.champ), retour);
  const sources = h("p", { class: "note" });
  zone.id = "chiffrage";
  zone.replaceChildren(
    h("h3", { class: "titre-graphique" }, "Avec quelles hypothèses ?"),
    h("div", { class: "bascule", role: "group", "aria-label": "Scénario de chiffrage" }, boutons),
    description,
    comparaison,
    h("details", { class: "avance" }, h("summary", {}, "Modifier les hypothèses"), form),
    sources,
  );

  const etude = chiffrage.scenarios.etude;
  const reference = chiffrerIgs(etude, etude.hypotheses, chiffrage);

  const rendu = () => {
    const reforme = appliquerChiffrage(base, etat);
    const r = reforme.chiffrage;
    const hyp = hypothesesDe(etat);
    const scenario = chiffrage.scenarios[etat.scenario];
    for (const b of boutons) b.setAttribute("aria-pressed", String(b.dataset.scenario === etat.scenario));
    for (const c of curseurs) {
      if (document.activeElement !== c.input) c.input.value = String(Math.round(hyp[c.cle] * 1000) / 10);
      c.sortie.textContent = pct(hyp[c.cle]);
      if (c.cle === "rendementTop1") c.aideEl.textContent = `Sa part du patrimoine passerait de 24 % en 2022 à ${pct(r.partTop1Fin)} en ${r.derniereAnnee}. L'étude retient 4,1 % (6,1 % de rendement moyen, moins 2 % d'inflation) ; l'ensemble des ménages : 2,07 %.`;
    }
    retour.hidden = !Object.keys(etat.hypotheses).length;
    description.textContent = scenario.description;
    const ecart = r.cumul - reference.cumul;
    comparaison.textContent =
      Math.abs(ecart) < 0.05
        ? `De ${r.annees[0]} à ${r.derniereAnnee}, l'impôt rapporterait ${milliardsRonds(r.cumul)} : ${milliardsRonds(r.pilier1.reduce((a, b) => a + b, 0))} pour le pilier 1, ${milliardsRonds(r.pilier2.reduce((a, b) => a + b, 0))} pour le pilier 2. Ce sont les chiffres de l'étude.`
        : `De ${r.annees[0]} à ${r.derniereAnnee}, l'impôt rapporterait ${milliardsRonds(r.cumul)}, soit ${ecart > 0 ? "+" : "−"}${milliardsRonds(Math.abs(ecart))} par rapport à l'étude (${milliardsRonds(reference.cumul)}). Transmissions sur la période : ${milliardsRonds(r.cumulFlux)}.`;
    const s = scenario.sources;
    sources.replaceChildren(
      "Hypothèses du scénario : PIB, ",
      s.pibUrl ? h("a", { href: s.pibUrl }, s.pib) : s.pib,
      " ; droits de succession actuels, ",
      s.dmtgUrl ? h("a", { href: s.dmtgUrl }, s.dmtg) : s.dmtg,
      " ; patrimoine, ",
      s.patrimoineUrl ? h("a", { href: s.patrimoineUrl }, s.patrimoine) : s.patrimoine,
      ` ; ${s.pfu}. Formules et autres hypothèses : `,
      h("a", { href: "heritage-methode.html#chiffrage" }, "page Méthode"),
      ".",
    );

    remplirChiffres(racine, reforme);
    const sousTitre = racine.querySelector("[data-sous-titre-trajectoire]");
    if (sousTitre) sousTitre.textContent = `Recettes supplémentaires, en milliards d'euros courants. Scénario : ${reforme.scenario.label}.`;
    dessinerTrajectoire(racine, reforme.recettes);
  };

  zone.querySelector(".bascule").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-scenario]");
    if (!b) return;
    etat = { scenario: b.dataset.scenario, hypotheses: {} };
    enregistrerEtat(etat);
    rendu();
  });
  retour.addEventListener("click", () => {
    etat = { ...etat, hypotheses: {} };
    enregistrerEtat(etat);
    rendu();
  });
  // Seul le curseur déplacé est enregistré : les autres gardent leur valeur exacte (pas d'arrondi au pas du curseur).
  form.addEventListener("input", (e) => {
    const c = curseurs.find((x) => x.input === e.target);
    if (!c) return;
    const hypotheses = { ...etat.hypotheses, [c.cle]: Number(c.input.value) / 100 };
    if (Math.abs(hypotheses[c.cle] - chiffrage.scenarios[etat.scenario].hypotheses[c.cle]) < 1e-9) delete hypotheses[c.cle];
    etat = { ...etat, hypotheses };
    enregistrerEtat(etat);
    rendu();
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  rendu();
}

function dessinerTrajectoire(racine, recettes) {
  const series = recettes.series.map((s) => ({ ...s, couleur: COULEURS[s.id] ?? "var(--serie-neutre)" }));
  racine.querySelector("[data-legende-trajectoire]").replaceChildren(
    ...series.map((s) => h("span", {}, h("i", { class: "pastille", style: { background: s.couleur } }), s.label)),
  );
  colonnesEmpilees(racine.querySelector('[data-graphique="trajectoire"]'), {
    label: `Recettes supplémentaires de l'IGS par année, de ${recettes.annees[0]} à ${recettes.annees.at(-1)}`,
    categories: recettes.annees,
    series,
    formatValeur: milliards,
    formatAxe: (v) => String(v),
  });
  tableDonnees(
    racine.querySelector('[data-table="trajectoire"]'),
    ["Année", ...series.map((s) => s.label), "Total"],
    recettes.annees.map((a, i) => [String(a), ...series.map((s) => milliards(s.valeurs[i])), milliards(series.reduce((t, s) => t + s.valeurs[i], 0))]),
  );
}

/** Remplit les chiffres clés (data-chiffre) : aussi utilisé par le rappel en tête de la page « Simuler ». */
export function remplirChiffres(racine, { recettes, contexte, scenario }) {
  const premiere = recettes.series.reduce((t, s) => t + s.valeurs[0], 0);
  const chiffres = {
    "premiere-annee": milliards(premiere),
    cumul: milliardsRonds(recettes.totalAnnonce),
    "taux-effectif": `${pourcent(contexte.tauxEffectifActuel)} → ${pourcent(contexte.tauxEffectifApres)}`,
    scenario: scenario ? `scénario « ${scenario.label} »` : "",
  };
  for (const [cle, valeur] of Object.entries(chiffres)) {
    const el = racine.querySelector(`[data-chiffre="${cle}"]`);
    if (el) el.textContent = valeur;
  }
  racine
    .querySelector('[data-chiffre="taux-effectif"]')
    ?.setAttribute("aria-label", `de ${pourcent(contexte.tauxEffectifActuel)} aujourd'hui à ${pourcent(contexte.tauxEffectifApres)} avec la réforme`);
}

export function monterRappel(racine, { reforme }) {
  remplirChiffres(racine, reforme);
}
