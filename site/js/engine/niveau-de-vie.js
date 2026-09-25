// Effets des réformes sur le niveau de vie d'un actif et d'un retraité, en part du revenu disponible.
// Approximation : un effet exprimé en % d'une catégorie de revenu (salaire, pension) est pondéré par le
// poids de ce revenu dans le revenu disponible du ménage (`composition`). Fonctions pures, testées.
//
// composition = { partActivite: 0..1, partPensions: 0..1 }   (voir params/niveau-de-vie.js)

/** Hausse du salaire net (en part) quand la CSG sur les revenus d'activité baisse de `points`. */
export const gainNetCsg = (points, csg, ratioNetSurBrut) => (csg.activite.assiette * points) / 100 / ratioNetSurBrut;

/** TVA sociale : baisse de CSG des actifs, hausse des prix pour tous. */
export function effetTvaSociale(r, { csg, ratioNetSurBrut, composition }) {
  return {
    actifs: composition.partActivite * gainNetCsg(r.baisseCsg, csg, ratioNetSurBrut) - r.pertePrix,
    retraites: -r.pertePrix,
  };
}

/** CSG des retraités alignée : perte moyenne sur les pensions, recette reversée aux actifs. */
export function effetCsgRetraites(recettes, { csg, ratioNetSurBrut, composition, pensionsTotales }) {
  const baisseCsgActifs = recettes / csg.activite.valeurPoint;
  return {
    actifs: composition.partActivite * gainNetCsg(baisseCsgActifs, csg, ratioNetSurBrut),
    retraites: -composition.partPensions * (recettes / pensionsTotales),
  };
}

/**
 * Retraites sans impôts : baisse des pensions, hausse des cotisations, et part de l'argent libéré
 * reversée aux actifs (Md€ par an).
 */
export function effetFinancement({ baissePensions, hausseCotisations }, versementActifs, { ratioNetSurBrut, composition, masseSalarialeBrute }) {
  const masseNette = masseSalarialeBrute * ratioNetSurBrut;
  return {
    actifs: composition.partActivite * (-hausseCotisations / ratioNetSurBrut + versementActifs / masseNette),
    retraites: -composition.partPensions * baissePensions,
  };
}

/** Cumule des effets (multiplicativement : chaque réforme s'applique au revenu déjà modifié). */
export function cumuler(effets) {
  return effets.reduce(
    (acc, e) => ({ actifs: (1 + acc.actifs) * (1 + e.actifs) - 1, retraites: (1 + acc.retraites) * (1 + e.retraites) - 1 }),
    { actifs: 0, retraites: 0 },
  );
}
