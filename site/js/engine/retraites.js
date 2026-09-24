// Scénario « des retraites financées par leurs seules ressources propres ». Fonctions pures, testées.
//
// On retire du financement des retraites les ressources que l'utilisateur juge non « logiques » (impôts,
// subventions…). Le trou ainsi créé est comblé soit par une baisse des pensions, soit par une hausse des
// cotisations, dans la proportion choisie. L'argent public qui ne va plus aux retraites est « libéré ».
// Le déficit déjà existant n'est pas compté : on mesure l'effet du seul changement de financement.

/** Somme des ressources, en Md€. */
export const totalRessources = (ressources) => ressources.reduce((t, r) => t + r.montant, 0);

/**
 * @param {{id:string, montant:number, fixe?:boolean}[]} ressources
 * @param {Set<string>|string[]} gardees  identifiants des ressources conservées
 * @returns {{ retire:number, garde:number, retirees:object[] }}
 */
export function ressourcesRetirees(ressources, gardees) {
  const garder = new Set(gardees);
  const retirees = ressources.filter((r) => !r.fixe && !garder.has(r.id));
  const retire = totalRessources(retirees);
  return { retire, garde: totalRessources(ressources) - retire, retirees };
}

/**
 * Comble un trou (Md€) entre baisse des pensions et hausse des cotisations.
 * @param {number} trou            Md€ à trouver chaque année
 * @param {number} partPensions    0..1, part comblée par la baisse des pensions
 * @param {number} depenses        dépenses de retraite (Md€)
 * @param {number} assiette        assiette des cotisations (Md€ de salaires bruts)
 */
export function comblerTrou(trou, partPensions, depenses, assiette) {
  const p = Math.min(1, Math.max(0, partPensions));
  const parPensions = trou * p;
  const parCotisations = trou - parPensions;
  return {
    parPensions,
    parCotisations,
    baissePensions: depenses > 0 ? parPensions / depenses : 0,
    hausseCotisations: assiette > 0 ? parCotisations / assiette : 0,
  };
}

/** Pension mensuelle après une baisse proportionnelle. */
export const pensionApres = (pension, baisse) => pension * (1 - baisse);

/** Perte mensuelle sur le salaire si la hausse de cotisation pèse entièrement sur le salaire brut. */
export const perteSalaire = (salaireNetMensuel, hausseCotisations, ratioNetSurBrut) =>
  (salaireNetMensuel / ratioNetSurBrut) * hausseCotisations;
