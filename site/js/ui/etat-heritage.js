// Scénario de chiffrage de l'IGS choisi dans Héritage › Comprendre (étude ou actualisé, hypothèses modifiées),
// mémorisé dans le navigateur pour que les pages Simuler reprennent les mêmes recettes.

import { chiffrage } from "../params/igs-chiffrage.js";
import { chiffrerIgs } from "../engine/igs-chiffrage.js";

const CLE = "heritage-chiffrage";

export function lireEtat() {
  try {
    const e = JSON.parse(localStorage.getItem(CLE) ?? "null");
    if (e && chiffrage.scenarios[e.scenario]) return { scenario: e.scenario, hypotheses: e.hypotheses ?? {} };
  } catch {
    // stockage indisponible : scénario de l'étude
  }
  return { scenario: "etude", hypotheses: {} };
}

export function enregistrerEtat(etat) {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // sans stockage, le choix vaut pour la page seulement
  }
}

/** Hypothèses effectives : celles du scénario, remplacées par celles que l'utilisateur a modifiées. */
export const hypothesesDe = (etat) => ({ ...chiffrage.scenarios[etat.scenario].hypotheses, ...etat.hypotheses });

/** La réforme avec les recettes et taux effectifs recalculés pour le scénario et les hypothèses choisis. */
export function appliquerChiffrage(reforme, etat) {
  const scenario = chiffrage.scenarios[etat.scenario];
  const r = chiffrerIgs(scenario, hypothesesDe(etat), chiffrage);
  const modifie = Object.keys(etat.hypotheses).some((k) => etat.hypotheses[k] !== scenario.hypotheses[k]);
  return {
    ...reforme,
    chiffrage: r,
    scenario: { id: scenario.id, label: modifie ? `${scenario.label}, hypothèses modifiées` : scenario.label },
    recettes: {
      ...reforme.recettes,
      annees: r.annees,
      series: reforme.recettes.series.map((s) => ({ ...s, valeurs: r[s.id] })),
      totalAnnonce: r.cumul,
      moyenneAnnuelleAnnoncee: r.moyenne,
    },
    contexte: { ...reforme.contexte, tauxEffectifActuel: r.tauxEffectifActuel, tauxEffectifApres: r.tauxEffectifApres },
  };
}
