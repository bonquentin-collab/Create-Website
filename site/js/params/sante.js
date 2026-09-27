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

  // Dépense de santé moyenne par personne ayant eu au moins un remboursement dans l'année, 2023, en euros :
  // remboursement de l'Assurance maladie obligatoire (AMO), complément de la complémentaire santé solidaire (C2S),
  // et reste à charge après AMO (ticket modérateur et forfait hospitalier, dépassements et tarifs libres,
  // participations forfaitaires et franchises), que se partagent complémentaire santé et patient.
  usagers: {
    source: "Drees, dépenses de santé et restes à charge 2023 (données de l'Assurance maladie)",
    url: "https://data.drees.solidarites-sante.gouv.fr/explore/dataset/depenses-de-sante-et-restes-a-charge/information/",
    annee: 2023,
    lignes: [
      { age: "0-10 ans", depense: 1211, amo: 925, c2s: 50, ticketModerateur: 149, depassements: 88, franchises: 0, personnes: 8216128 },
      { age: "11-20 ans", depense: 1345, amo: 887, c2s: 51, ticketModerateur: 143, depassements: 263, franchises: 2, personnes: 8186259 },
      { age: "21-30 ans", depense: 1503, amo: 1134, c2s: 43, ticketModerateur: 169, depassements: 145, franchises: 14, personnes: 7938340 },
      { age: "31-40 ans", depense: 1944, amo: 1477, c2s: 56, ticketModerateur: 202, depassements: 194, franchises: 17, personnes: 8390307 },
      { age: "41-50 ans", depense: 2328, amo: 1713, c2s: 59, ticketModerateur: 232, depassements: 303, franchises: 21, personnes: 8488253 },
      { age: "51-60 ans", depense: 3324, amo: 2557, c2s: 58, ticketModerateur: 276, depassements: 407, franchises: 27, personnes: 8912890 },
      { age: "61-70 ans", depense: 4684, amo: 3822, c2s: 51, ticketModerateur: 333, depassements: 444, franchises: 35, personnes: 7991246, retraite: true },
      { age: "71-80 ans", depense: 6616, amo: 5587, c2s: 34, ticketModerateur: 452, depassements: 497, franchises: 46, personnes: 6355648, retraite: true },
      { age: "80 ans ou plus", depense: 9009, amo: 7858, c2s: 28, ticketModerateur: 638, depassements: 434, franchises: 52, personnes: 3975523, retraite: true },
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

  // Reste à charge final, après remboursement par la complémentaire santé, par personne et par an (2019).
  // Sert à partager le reste à charge après AMO de 2023 entre complémentaire et patient : estimation du site.
  resteFinal: {
    source: "Drees, La complémentaire santé, édition 2024, fiche 14 (modèle Ines-Omar 2019)",
    url: "https://drees.solidarites-sante.gouv.fr/sites/default/files/2024-07/CS24%20-%20Fiche%2014%20-%20Le%20reste%20%C3%A0%20charge%20des%20personnes%20apr%C3%A8s%20remboursement%20par%20l%E2%80%99assurance%20maladie%20compl%C3%A9mentaire.pdf",
    annee: 2019,
    // Tranches de la Drees et tranches du graphique qu'elles couvrent.
    tranches: [
      { age: "20-39 ans", valeur: 100, couvre: ["21-30 ans", "31-40 ans"] },
      { age: "40-59 ans", valeur: 180, couvre: ["41-50 ans", "51-60 ans"] },
      { age: "60-69 ans", valeur: 280, couvre: ["61-70 ans"] },
      { age: "70 ans ou plus", valeur: 410, couvre: ["71-80 ans", "80 ans ou plus"] },
    ],
  },

  // Prime moyenne mensuelle d'un contrat individuel de complémentaire santé, 2023.
  primes: {
    source: "Drees, enquête auprès des organismes complémentaires, données 2023 (septembre 2025)",
    url: "https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/jeux-de-donnees/250923_DATA_organismes-couvertures-compl%C3%A9mentaires-sant%C3%A9",
    a20ans: 36,
    a85ans: 142,
  },

  // Taux d'effort en santé, en % du revenu : financement de l'assurance maladie obligatoire (cotisations maladie,
  // CSG, taxes sur la consommation, autres), primes de complémentaire et restes à charge, selon le niveau de vie et
  // la situation de la personne la plus âgée du ménage, 2019.
  effort: {
    source: "Drees, Études et Résultats n° 1345, juillet 2025, tableau complémentaire C (modèle Ines-Omar 2019)",
    url: "https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse/250828_ER_depenses-de-sante",
    annee: 2019,
    niveaux: [
      { id: "tres-modeste", label: "Très modestes", aide: "moins de 60 % du niveau de vie médian" },
      { id: "plutot-modeste", label: "Plutôt modestes", aide: "60 à 90 %" },
      { id: "median", label: "Médians", aide: "90 à 120 %" },
      { id: "plutot-aise", label: "Plutôt aisés", aide: "120 à 180 %" },
      { id: "tres-aise", label: "Très aisés", aide: "plus de 180 %" },
    ],
    actifs: {
      amo: [11.42, 12.59, 14.06, 15.41, 16.16],
      primes: [2.38, 2.15, 1.79, 1.56, 1.13],
      reste: [1.53, 0.92, 0.71, 0.57, 0.41],
      total: [15.33, 15.66, 16.56, 17.53, 17.7],
    },
    retraites: {
      amo: [6.32, 6.13, 7.19, 8.18, 7.74],
      primes: [6, 5.81, 4.53, 3.46, 2.37],
      reste: [1.94, 1.63, 1.47, 1.49, 1.14],
      total: [14.26, 13.57, 13.19, 13.12, 11.25],
    },
  },
};
