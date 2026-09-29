// Chiffrage de l'IGS : hypothèses du classeur de l'étude (Fondation Jean-Jaurès, 2024) et hypothèses actualisées
// (septembre 2026). Le modèle est dans engine/igs-chiffrage.js ; chaque valeur porte sa source.

export const chiffrage = {
  annees: { debut: 2025, fin: 2040 },

  // Flux successoral (donations + successions) en part du PIB : 15 % en 2021, 23 % en 2050, interpolation linéaire.
  flux: { annee0: 2021, part0: 0.15, anneeCible: 2050, source: "CAE, note n° 63, 2021 (d'après Goupille-Lebret et al.)" },

  // Pilier 1 : 10 Md€ de recettes supplémentaires en 2021, qui évoluent ensuite comme le flux successoral.
  pilier1: { recettes2021: 10, source: "CAE (2021), simulation de la réforme de l'assiette et du barème, reprise par l'étude" },

  // Pilier 2 : plus-values latentes transmises au décès par le top 1 %.
  pilier2: {
    // Taux de mortalité des plus fortunés, 2025 à 2040 (Insee 2021 et rapport du CPO sur les assujettis à l'ISF).
    mortalite: [0.0223, 0.0225, 0.0227, 0.0229, 0.0231, 0.0233, 0.0235, 0.0238, 0.0241, 0.0244, 0.0247, 0.025, 0.0253, 0.0257, 0.026, 0.0263],
    anneeReference: 2022,
    partTop1: { valeur: 0.24, source: "World Inequality Database, 2022" },
    // Croissance du patrimoine de l'ensemble des ménages, pour afficher la part du top 1 % (4,07 % − 2 % d'inflation).
    croissanceGenerale: 0.0207,
    // Abattements pour durée de détention : l'assiette taxée au PFU est ramenée à 80 % (Hannezo et al., 2022).
    abattement: 0.8,
    // Les DMTG déjà acquittés sur ces biens réduisent l'impôt dû (CAE, 2021) : 20 %.
    dmtgDeduits: 0.2,
    sources: {
      rendement: "Garbinti, Goupille-Lebret et Piketty (2021) : 6,10 % par an en moyenne sur 2005-2014, moins 2 % d'inflation",
      partPV: "Saez et al. (2021) : 17 681 Md€ de plus-values latentes sur 42 861 Md€ de patrimoine du top 1 %",
    },
  },

  scenarios: {
    etude: {
      id: "etude",
      label: "Étude 2024",
      description: "Les hypothèses du classeur de l'étude, telles quelles.",
      // PIB en Md€ : valeurs connues puis croissance annuelle.
      pib: { 2021: 2508.1023, 2022: 2655.435, 2023: 2822.5 },
      // DMTG actuels (successions et donations) en Md€ : valeurs connues puis évolution comme le flux successoral.
      dmtg: { 2021: 18.7, 2022: 18.7, 2023: 20.8 },
      // Patrimoine net des ménages, Md€ (2022 : ancrage du top 1 % ; 2023 : dernière valeur connue).
      patrimoine: { 2022: 13837.63065, 2023: 13642.86636 },
      hypotheses: { croissancePib: 0.01, fluxCible: 0.23, rendementTop1: 0.041, partPV: 17681 / 42861, pfu: 0.3 },
      sources: {
        pib: "Insee jusqu'en 2023, puis +1 % par an (étude)",
        dmtg: "20,8 Md€ en 2023, puis comme le flux successoral (étude)",
        patrimoine: "Banque de France, patrimoine net des ménages (étude)",
        pfu: "PFU de 30 % (2024)",
      },
    },
    actualise: {
      id: "actualise",
      label: "Actualisé 2026",
      description: "PIB, recettes des droits de succession, patrimoine des ménages et PFU mis à jour avec les derniers chiffres officiels.",
      // 2025 : 2 991,1 Md€, +1,9 % en valeur (Insee, comptes de la Nation 2025) ; 2024 déduit de cette évolution.
      pib: { 2021: 2508.1023, 2022: 2655.435, 2023: 2822.5, 2024: 2991.1 / 1.019, 2025: 2991.1 },
      // Voies et moyens, PLF 2026, tome I : 20,9 Md€ en 2024 (4,9 donations + 16,0 successions), 20,7 prévus en 2025
      // (4,5 + 16,2), 21,4 en 2026 (4,4 + 17,0).
      dmtg: { 2021: 18.7, 2022: 18.7, 2023: 20.8, 2024: 20.9, 2025: 20.7, 2026: 21.4 },
      // Insee-Banque de France, comptes de patrimoine : 14 953 Md€ fin 2024, +0,7 % en 2024, +0,6 % en 2023.
      patrimoine: { 2022: 14953 / 1.007 / 1.006, 2023: 14953 / 1.007, 2024: 14953 },
      hypotheses: { croissancePib: 0.01, fluxCible: 0.23, rendementTop1: 0.041, partPV: 17681 / 42861, pfu: 0.314 },
      sources: {
        pib: "Insee, Les comptes de la Nation en 2025 (Insee Première n° 2105) ; puis +1 % par an comme l'étude",
        pibUrl: "https://www.insee.fr/fr/statistiques/8996855",
        dmtg: "Évaluation des voies et moyens, PLF 2026, tome I ; puis comme le flux successoral",
        dmtgUrl: "https://www.assemblee-nationale.fr/dyn/contenu/visualisation/1087930/file/PLF%202026%20-%20V%26M%20TI%20-%20Evaluations%20des%20recettes.pdf",
        patrimoine: "Insee Première n° 2081, Le patrimoine économique national en 2024 (ménages, ISBLSM comprises)",
        patrimoineUrl: "https://www.insee.fr/fr/statistiques/8661938",
        pfu: "PFU de 31,4 % depuis le 1er janvier 2026 (12,8 % d'impôt + 18,6 % de prélèvements sociaux, LFSS 2026)",
      },
    },
  },
};
