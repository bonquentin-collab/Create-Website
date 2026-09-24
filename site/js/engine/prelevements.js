// TVA sociale et alignement de la CSG des retraités. Fonctions pures, testées.

/**
 * TVA sociale : hausse de TVA dont toute la recette finance une baisse de CSG des actifs.
 * @param {number} points        points de TVA ajoutés
 * @param {"normal"|"tousTaux"} cible
 * @param {number} repercussion  0..1, part de la hausse répercutée dans les prix
 */
export function tvaSociale(points, cible, repercussion, tva, csg) {
  const recettes = points * tva.pointNet[cible];
  const baisseCsg = Math.min(csg.activite.taux * 100, recettes / csg.activite.valeurPoint); // en points
  const pertePrix = points * tva.pertePouvoirAchatParPoint[cible] * repercussion; // part du revenu
  return { recettes, baisseCsg, pertePrix };
}

/** Gain mensuel d'un salarié quand la CSG baisse de `points` (sur 98,25 % du brut). */
export function gainBaisseCsg(salaireNetMensuel, points, csg, ratioNetSurBrut) {
  const brut = salaireNetMensuel / ratioNetSurBrut;
  return brut * csg.activite.assiette * (points / 100);
}

/** Taux de CSG d'un retraité selon son revenu fiscal de référence (1 part). */
export function tauxCsgRetraite(rfr, bareme) {
  return bareme.find((t) => rfr <= t.jusqua) ?? bareme.at(-1);
}

/**
 * Alignement de la CSG des retraités sur celle des actifs.
 * @param {"normal"|"tous"} portee  aligner le seul taux normal, ou tous les taux imposés (pas les exonérés)
 * @returns {{ recettes:number, nouveauTaux:(id:string)=>number }}
 */
export function alignementCsg(portee, csg) {
  const cible = csg.activite.taux;
  const bareme = csg.retraites.taux;
  const concerne = (id) => (portee === "normal" ? id === "normal" : id !== "exonere");
  const { assiettes } = csg.retraites;
  let recettes = 0;
  for (const t of bareme) if (concerne(t.id) && assiettes[t.id]) recettes += assiettes[t.id] * (cible - t.taux);
  return { recettes, nouveauTaux: (id) => (concerne(id) ? cible : bareme.find((t) => t.id === id).taux) };
}

/** Perte mensuelle d'un retraité dont le taux passe de `avant` à `apres` (CSG sur 100 % de la pension brute). */
export const perteRetraite = (pensionBruteMensuelle, avant, apres) => pensionBruteMensuelle * Math.max(0, apres - avant);
