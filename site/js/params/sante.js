// Santé : qui paie, et pour qui. Données vérifiées en septembre 2026.

export const sante = {
  // Consommation de soins et de biens médicaux (CSBM) 2024, par financeur, en Md€.
  financeurs: {
    source: "Drees, comptes de la santé (édition 2025), répartition par financeur",
    url: "https://data.drees.solidarites-sante.gouv.fr/explore/dataset/cns_financement/information/",
    annee: 2024,
    total: 254.8,
    lignes: [
      { id: "secu", label: "Sécurité sociale", valeur: 200.55 },
      { id: "oc", label: "Complémentaires santé (mutuelles, assurances…)", valeur: 32.52 },
      { id: "menages", label: "Les patients eux-mêmes", valeur: 19.96 },
      { id: "etat", label: "État", valeur: 1.77 },
    ],
  },

  // Dépense de santé moyenne par personne ayant eu au moins un remboursement dans l'année, 2023, en euros,
  // et part remboursée par l'Assurance maladie obligatoire (AMO).
  usagers: {
    source: "Drees, dépenses de santé et restes à charge 2023 (données de l'Assurance maladie)",
    url: "https://data.drees.solidarites-sante.gouv.fr/explore/dataset/depenses-de-sante-et-restes-a-charge/information/",
    annee: 2023,
    lignes: [
      { age: "0-10 ans", depense: 1211, amo: 925, personnes: 8216128 },
      { age: "11-20 ans", depense: 1345, amo: 887, personnes: 8186259 },
      { age: "21-30 ans", depense: 1503, amo: 1134, personnes: 7938340 },
      { age: "31-40 ans", depense: 1944, amo: 1477, personnes: 8390307 },
      { age: "41-50 ans", depense: 2328, amo: 1713, personnes: 8488253 },
      { age: "51-60 ans", depense: 3324, amo: 2557, personnes: 8912890 },
      { age: "61-70 ans", depense: 4684, amo: 3822, personnes: 7991246, retraite: true },
      { age: "71-80 ans", depense: 6616, amo: 5587, personnes: 6355648, retraite: true },
      { age: "80 ans ou plus", depense: 9009, amo: 7858, personnes: 3975523, retraite: true },
    ],
  },

  // Estimation du site : ce que chaque âge verse pour la santé publique. Prélèvements obligatoires payés par les
  // ménages selon l'âge de la personne de référence, en euros par unité de consommation (UC) et par an, 2019
  // (revenu avant transferts × taux de prélèvement), multipliés par la part des prélèvements qui finance la santé
  // publique en 2019 (dépenses de santé des administrations 198,1 Md€ / prélèvements 1 149,5 Md€, Eurostat).
  financementParAge: {
    source: "Insee Analyses n° 88, « La redistribution élargie… », 2023, figures 5 et 6 (comptes nationaux distribués 2019)",
    url: "https://www.insee.fr/fr/statistiques/7669723",
    annee: 2019,
    partSante: 198.15 / 1149.5,
    ages: ["18-24 ans", "25-29 ans", "30-34 ans", "35-39 ans", "40-44 ans", "45-49 ans", "50-54 ans", "55-59 ans", "60-64 ans", "65-69 ans", "70-74 ans", "75-79 ans", "80 ans ou plus"],
    revenuAvantTransferts: [18180, 34840, 39990, 43800, 46140, 47290, 53320, 60810, 39520, 18880, 15510, 12840, 13010],
    // Taux de prélèvement en % du revenu avant transferts : taxes sur les produits, taxes sur la production et
    // impôt sur les sociétés, impôts sur les revenus et le patrimoine, cotisations sociales.
    taux: [
      [20.2, 14.1, 12.7, 12, 11.6, 11.4, 10.5, 9.4, 10.6, 12.9, 13.1, 13.7, 13.7],
      [1.8, 2.2, 2.7, 2.8, 2.9, 2.9, 2.8, 2.9, 3.3, 4, 4.2, 4.6, 4.7],
      [8.9, 10.3, 10.2, 11.4, 12.3, 12.8, 14.8, 16.1, 15.7, 15.5, 17, 14.6, 13.6],
      [23.2, 26.7, 26.9, 26.4, 26.6, 26, 25.2, 23.2, 17.3, 7.9, 4, 3.9, 3.7],
    ],
    // Âge à partir duquel la tranche est rangée parmi les « âges de la retraite » (même convention que le site).
    ageRetraite: 65,
  },
};
