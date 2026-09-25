// Besoins et situation patrimoniale selon l'âge : ce que le niveau de vie « standard » ne montre pas.

export const logement = {
  // Niveau de vie moyen rapporté à l'ensemble de la population, sans et avec loyers imputés
  // (le loyer qu'un propriétaire n'a pas à payer, compté comme un revenu en nature).
  loyersImputes: {
    source: "COR, rapport annuel juin 2026, figures 3.8 et 3.9 (estimation du SG-COR à partir de l'ERFS 2021)",
    url: "https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf",
    sans: { retraites: 1.002, actifs: 1.091 },
    avec: { retraites: 1.065, actifs: 1.072 },
  },

  // Part des ménages propriétaires de leur résidence principale, selon l'âge de la personne de référence.
  proprietaires: {
    source: "Insee, Les revenus et le patrimoine des ménages, édition 2024, fiche « Détention de la résidence principale », figure 1",
    url: "https://www.insee.fr/fr/statistiques/7941429?sommaire=7941491",
    lignes: [
      { age: "Moins de 30 ans", v1998: 0.112, v2021: 0.167, statut: "actifs" },
      { age: "30-39 ans", v1998: 0.42, v2021: 0.473, statut: "actifs" },
      { age: "40-49 ans", v1998: 0.611, v2021: 0.578, statut: "actifs" },
      { age: "50-64 ans", v1998: 0.716, v2021: 0.626, statut: "actifs" },
      { age: "65 ans ou plus", v1998: 0.692, v2021: 0.702, statut: "retraites" },
    ],
  },

  // Chez les propriétaires : part de l'endettement dans le patrimoine brut, début 2021.
  endettement: {
    source: "Insee, même fiche, figure 3 (ménages propriétaires de leur résidence principale)",
    url: "https://www.insee.fr/fr/statistiques/7941429?sommaire=7941491",
    lignes: [
      { age: "Moins de 30 ans", valeur: 0.492, statut: "actifs" },
      { age: "30-39 ans", valeur: 0.424, statut: "actifs" },
      { age: "40-49 ans", valeur: 0.246, statut: "actifs" },
      { age: "50-64 ans", valeur: 0.103, statut: "actifs" },
      { age: "65 ans ou plus", valeur: 0.013, statut: "retraites" },
    ],
    // Parmi les propriétaires qui remboursent encore un emprunt (accédants), part des 65 ans ou plus.
    partAccedants65: 0.044,
  },

  epargne: {
    source: "Insee Première n° 1815, 2020 (enquête Budget de famille 2017)",
    url: "https://www.insee.fr/fr/statistiques/4764600",
    moins40: 0.09, // « moins de 9 % chez les moins de 40 ans »
    plus70: 0.218,
    moyenne: 0.159,
  },
};
