// Droit actuel des successions en ligne directe (parent → enfant).
// Source : Code général des impôts, art. 777 (barème), 779 (abattement), 990 I (assurance-vie).
// Montants en vigueur en 2024, repris dans l'étude de la Fondation Jean-Jaurès (tableau 2).

export const droitActuel = {
  id: "droit-actuel",
  label: "Droit actuel",
  annee: 2024,
  source: "Code général des impôts, art. 777, 779 et 990 I",

  // Abattement par enfant et par parent.
  abattementEnfant: 100_000,

  baremeLigneDirecte: [
    { jusqua: 8_072, taux: 0.05 },
    { jusqua: 12_109, taux: 0.1 },
    { jusqua: 15_932, taux: 0.15 },
    { jusqua: 552_324, taux: 0.2 },
    { jusqua: 902_838, taux: 0.3 },
    { jusqua: 1_805_677, taux: 0.4 },
    { jusqua: Infinity, taux: 0.45 },
  ],

  // Assurance-vie, primes versées avant 70 ans (art. 990 I), par bénéficiaire et par assuré.
  assuranceVie: {
    abattement: 152_500,
    bareme: [
      { jusqua: 700_000, taux: 0.2 },
      { jusqua: Infinity, taux: 0.3125 },
    ],
  },
};
