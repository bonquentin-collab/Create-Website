// Gel de la revalorisation des pensions au-delà d'un seuil : qui est concerné, combien cela rapporte,
// ce que perd un retraité. Fonctions pures, montants mensuels bruts.

/**
 * Part des retraités au-dessus du seuil et masses de pension correspondantes, par retraité (moyenne sur tous).
 * Les tranches (euros d'origine) sont multipliées par `facteur` ; répartition supposée uniforme dans une tranche.
 * @returns {{ part:number, masse:number, masseAuDela:number, moyenne:number }}
 */
export function auDessusDuSeuil({ tranches, sommet }, seuil, facteur = 1) {
  let part = 0;
  let masse = 0;
  let masseAuDela = 0;
  let moyenne = 0;
  for (const [de, a, pct] of tranches) {
    const p = pct / 100;
    const lo = de * facteur;
    if (a == null) {
      const m = sommet * facteur;
      moyenne += p * m;
      if (m > seuil) {
        part += p;
        masse += p * m;
        masseAuDela += p * (m - seuil);
      }
      continue;
    }
    const hi = a * facteur;
    moyenne += (p * (lo + hi)) / 2;
    if (hi <= seuil) continue;
    const bas = Math.max(lo, seuil);
    const q = p * ((hi - bas) / (hi - lo));
    part += q;
    masse += (q * (bas + hi)) / 2;
    masseAuDela += (q * (bas + hi)) / 2 - q * seuil;
  }
  return { part, masse, masseAuDela, moyenne };
}

/**
 * Économie annuelle (Md€) d'un gel de la revalorisation `taux` sur la part `partBase` des pensions au-dessus du seuil.
 * mode "tout" : toute la pension des retraités concernés est gelée ; "au-dela" : seulement ce qui dépasse le seuil.
 */
export function economieGel(distribution, { seuil, taux, partBase, mode = "tout", retraites, facteur = 1 }) {
  const r = auDessusDuSeuil(distribution, seuil, facteur);
  const assiette = mode === "au-dela" ? r.masseAuDela : r.masse;
  return {
    economie: (retraites * 12 * assiette * partBase * taux) / 1e9,
    part: r.part,
    concernes: r.part * retraites,
    masseTotale: (retraites * 12 * r.moyenne) / 1e9,
  };
}

/** Perte mensuelle brute d'un retraité à `pension` € par mois. */
export function perteMensuelle(pension, { seuil, taux, partBase, mode = "tout" }) {
  if (pension <= seuil) return 0;
  return (mode === "au-dela" ? pension - seuil : pension) * partBase * taux;
}
