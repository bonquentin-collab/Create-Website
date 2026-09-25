// Section « la réforme » : chiffres clés, piliers et trajectoire des recettes.

import { h } from "./dom.js";
import { milliards, milliardsRonds, pourcent } from "../engine/format.js";
import { colonnesEmpilees, tableDonnees } from "./graphiques/colonnes.js";

const COULEURS = { pilier1: "var(--serie-actuel)", pilier2: "var(--serie-tampon)" };

export function monter(racine, { reforme }) {
  const { recettes } = reforme;

  remplirChiffres(racine, reforme);

  racine.querySelector("[data-piliers]").replaceChildren(
    ...reforme.piliers.map((p) => h("li", { class: "pilier" }, h("p", { class: "pilier__nom" }, p.nom), h("h3", {}, p.titre), h("p", {}, p.texte))),
  );

  const series = recettes.series.map((s) => ({ ...s, couleur: COULEURS[s.id] ?? "var(--serie-neutre)" }));
  racine.querySelector("[data-legende-trajectoire]").replaceChildren(
    ...series.map((s) => h("span", {}, h("i", { class: "pastille", style: { background: s.couleur } }), s.label)),
  );
  colonnesEmpilees(racine.querySelector('[data-graphique="trajectoire"]'), {
    label: "Recettes supplémentaires de l'IGS par année, de 2025 à 2040",
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
export function remplirChiffres(racine, { recettes, contexte }) {
  const premiere = recettes.series.reduce((t, s) => t + s.valeurs[0], 0);
  const chiffres = {
    "premiere-annee": milliards(premiere),
    cumul: milliardsRonds(recettes.totalAnnonce),
    "taux-effectif": `${pourcent(contexte.tauxEffectifActuel)} → ${pourcent(contexte.tauxEffectifApres)}`,
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
