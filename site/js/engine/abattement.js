// Abattement de 10 % sur les pensions à l'impôt sur le revenu (CGI, art. 158, 5-a) : recette d'un plafond abaissé ou
// d'une suppression, et hausse d'impôt pour un foyer. Fonctions pures, testées.

/**
 * Recette nette (Md€) pour un plafond d'abattement par foyer donné : interpolation linéaire entre les points chiffrés
 * par l'IPP (suppression, plafond abaissé, plafond actuel), constante hors bornes.
 * @param {number} plafond  plafond annuel par foyer (€) ; 0 = suppression
 * @param {{plafond:number, recettes:number}[]} points  triés par plafond croissant
 */
export function recettesAbattement(plafond, points) {
  if (plafond <= points[0].plafond) return points[0].recettes;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (plafond <= b.plafond) return a.recettes + ((b.recettes - a.recettes) * (plafond - a.plafond)) / (b.plafond - a.plafond);
  }
  return points.at(-1).recettes;
}

/** Abattement d'un foyer (€ par an) : 10 % des pensions, au moins le plancher par pensionné, au plus le plafond. */
export function abattementFoyer(pensions, pensionnes, plafond, { taux, plancher }) {
  return Math.max(0, Math.min(pensions, plafond, Math.max(taux * pensions, plancher * pensionnes)));
}

/**
 * Hausse d'impôt annuelle d'un foyer (€) quand le plafond passe au niveau choisi : abattement perdu × taux marginal.
 * Approximation : ni décote, ni changement de tranche, ni effet sur les aides au logement.
 */
export function hausseImpotFoyer({ pensions, pensionnes, tauxMarginal, plafond }, abattement) {
  const avant = abattementFoyer(pensions, pensionnes, abattement.plafond, abattement);
  const apres = abattementFoyer(pensions, pensionnes, Math.min(plafond, abattement.plafond), abattement);
  return { avant, apres, hausse: (avant - apres) * tauxMarginal };
}
