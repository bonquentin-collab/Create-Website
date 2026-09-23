// Barèmes progressifs par tranches.
// Une tranche = { jusqua: plafond de la tranche en € (Infinity pour la dernière), taux: 0..1 }.

/**
 * Applique un barème progressif à un montant imposable.
 * @param {number} montant
 * @param {{jusqua:number, taux:number}[]} tranches triées par plafond croissant
 * @returns {{impot:number, detail:{de:number, a:number, taux:number, base:number, impot:number}[]}}
 */
export function appliquerBareme(montant, tranches) {
  const detail = [];
  let impot = 0;
  let plancher = 0;
  const m = Math.max(0, montant);
  for (const { jusqua, taux } of tranches) {
    if (m <= plancher) break;
    const base = Math.min(m, jusqua) - plancher;
    const du = base * taux;
    detail.push({ de: plancher, a: jusqua, taux, base, impot: du });
    impot += du;
    plancher = jusqua;
  }
  return { impot, detail };
}

/** Taux marginal atteint pour un montant donné. */
export function tauxMarginal(montant, tranches) {
  let plancher = 0;
  for (const t of tranches) {
    if (montant <= t.jusqua && montant > plancher) return t.taux;
    plancher = t.jusqua;
  }
  return montant <= 0 ? 0 : tranches[tranches.length - 1].taux;
}
