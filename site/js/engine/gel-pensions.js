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
 * Part de la pension venant des régimes de base selon le montant de la pension totale : `base` jusqu'à `jusqua`,
 * puis décroissance linéaire jusqu'à `haut` à partir de `apartirDe` (les hautes pensions comptent plus de
 * complémentaire). Un nombre est accepté pour une part uniforme.
 */
export function partDeBase(profil, pension) {
  if (typeof profil === "number") return profil;
  const { jusqua, base, apartirDe, haut } = profil;
  if (pension <= jusqua) return base;
  if (pension >= apartirDe) return haut;
  return base + ((haut - base) * (pension - jusqua)) / (apartirDe - jusqua);
}

/**
 * Masses de pension de base au-dessus du seuil, par retraité (moyenne sur tous) : dans chaque tranche, la partie
 * au-dessus du seuil est pondérée par la part de base à son point moyen.
 */
export function baseAuDessusDuSeuil({ tranches, sommet }, seuil, facteur, profil) {
  let masse = 0;
  let masseAuDela = 0;
  for (const [de, a, pct] of tranches) {
    const p = pct / 100;
    if (a == null) {
      const m = sommet * facteur;
      if (m > seuil) {
        const b = partDeBase(profil, m);
        masse += p * m * b;
        masseAuDela += p * (m - seuil) * b;
      }
      continue;
    }
    const lo = de * facteur;
    const hi = a * facteur;
    if (hi <= seuil) continue;
    const bas = Math.max(lo, seuil);
    const q = p * ((hi - bas) / (hi - lo));
    const b = partDeBase(profil, (bas + hi) / 2);
    masse += ((q * (bas + hi)) / 2) * b;
    masseAuDela += ((q * (bas + hi)) / 2 - q * seuil) * b;
  }
  return { masse, masseAuDela };
}

/**
 * Économie annuelle (Md€) d'un gel de la revalorisation `taux` de la pension de base des retraités au-dessus du seuil.
 * mode "tout" : toute la pension de base des retraités concernés est gelée ; "au-dela" : seulement la part au-delà du
 * seuil. `partBase` : profil de part de base selon la pension (voir partDeBase) ou part uniforme.
 */
export function economieGel(distribution, { seuil, taux, partBase, mode = "tout", retraites, facteur = 1 }) {
  const r = auDessusDuSeuil(distribution, seuil, facteur);
  const b = baseAuDessusDuSeuil(distribution, seuil, facteur, partBase);
  const assiette = mode === "au-dela" ? b.masseAuDela : b.masse;
  return {
    economie: (retraites * 12 * assiette * taux) / 1e9,
    part: r.part,
    concernes: r.part * retraites,
    masseTotale: (retraites * 12 * r.moyenne) / 1e9,
  };
}

/** Perte mensuelle brute d'un retraité à `pension` € par mois. */
export function perteMensuelle(pension, { seuil, taux, partBase, mode = "tout" }) {
  if (pension <= seuil) return 0;
  return (mode === "au-dela" ? pension - seuil : pension) * partDeBase(partBase, pension) * taux;
}

/**
 * Économie de l'année `annee` (0 = première année) et cumul sur `annee + 1` ans, en Md€ constants.
 * Sans ajustement des futures pensions, les retraités concernés sortent peu à peu (décès, part `sortie` par an) et
 * leurs successeurs liquident au taux d'annuité inchangé : l'économie s'érode. Avec la baisse du taux d'annuité à la
 * liquidation pour les futurs retraités au-dessus du seuil, le nombre de pensions concernées reste stable.
 */
export function trajectoireEconomie(economie, { annee, sortie, futurs = false }) {
  const facteurAn = (t) => (futurs ? 1 : (1 - sortie) ** t);
  let cumul = 0;
  for (let t = 0; t <= annee; t++) cumul += economie * facteurAn(t);
  return { annee: economie * facteurAn(annee), cumul };
}

/** Valeur d'un trimestre validé, en part du salaire de référence (taux d'annuité), éventuellement réduite. */
export const valeurTrimestre = ({ tauxPlein, trimestresRequis }, reduction = 0) => (tauxPlein / trimestresRequis) * (1 - reduction);
