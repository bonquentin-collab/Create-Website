// Hériter ou gagner la même somme : ce que l'on paie (barèmes 2026, personne seule).
// Héritage : un enfant reçoit le montant d'un parent (CGI art. 777 et 779).
// Salaire : salarié du privé, le montant gagné en salaire brut sur 5 ans ; on ne compte que la CSG, la CRDS et
// l'impôt sur le revenu (pas les cotisations de retraite, qui ouvrent des droits).
// Revenus du capital : prélèvement forfaitaire unique de 31,4 % (12,8 % d'impôt + 18,6 % de prélèvements sociaux, 2026).
import { bareme } from "./modele.js";
import { baremes } from "../donnees/sources.js";

export const parametres2026 = {
  // Barème de l'impôt sur le revenu 2026 (revenus 2025), loi de finances pour 2026 : seuils relevés de 0,9 %.
  ir: [
    { jusqua: 11_600, taux: 0 }, { jusqua: 29_579, taux: 0.11 }, { jusqua: 84_577, taux: 0.3 },
    { jusqua: 181_917, taux: 0.41 }, { jusqua: Infinity, taux: 0.45 },
  ],
  abattementFraisPro: 0.1,
  // CSG 9,2 % + CRDS 0,5 % sur 98,25 % du salaire brut ; 6,8 points de CSG déductibles.
  csgCrds: 0.097 * 0.9825,
  csgDeductible: 0.068 * 0.9825,
  // Cotisations salariales hors CSG (vieillesse 7,30 %, Agirc-Arrco et CEG 4,01 %), sous le plafond : déductibles.
  cotisations: 0.1131,
  pfu: 0.314,
  annees: 5,
};

export function comparer(montant = 300_000, p = parametres2026) {
  const heritage = bareme(Math.max(0, montant - 100_000), baremes.actuel);
  const brutAnnuel = montant / p.annees;
  const netImposable = brutAnnuel * (1 - p.cotisations - p.csgDeductible);
  const ir = bareme(netImposable * (1 - p.abattementFraisPro), p.ir);
  const salaire = p.annees * (ir + brutAnnuel * p.csgCrds);
  const capital = montant * p.pfu;
  return { montant, heritage, salaire, capital };
}
