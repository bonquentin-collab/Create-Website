// Plafonnement des pensions : toute pension totale brute au-delà du plafond est ramenée au plafond.

import { auDessusDuSeuil } from "./gel-pensions.js";

/**
 * @returns {{ economie:number, part:number, concernes:number, masseTotale:number }} économie annuelle en Md€
 */
export function economiePlafond(distribution, { plafond, retraites, facteur = 1 }) {
  const r = auDessusDuSeuil(distribution, plafond, facteur);
  return {
    economie: (retraites * 12 * r.masseAuDela) / 1e9,
    part: r.part,
    concernes: r.part * retraites,
    masseTotale: (retraites * 12 * r.moyenne) / 1e9,
  };
}

/** Perte mensuelle brute pour une pension donnée. */
export const pertePlafond = (pension, plafond) => Math.max(0, pension - plafond);
