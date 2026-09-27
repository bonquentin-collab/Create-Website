// Ce que chaque génération reçoit en pensions pour ce qu'elle a cotisé. Données vérifiées en septembre 2026.

const COR = { source: "COR, rapport annuel de juin 2026", url: "https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf" };

export const rendement = {
  // Taux de rendement interne (TRI) net du cas type de salarié non-cadre du privé à carrière complète, actualisé
  // selon l'évolution du salaire moyen (SMPT) : au-dessus de 0, la génération reçoit plus que ses cotisations
  // revalorisées comme les salaires (figure 3.7). Durée de retraite, espérance de vie à 60 ans et durée de carrière
  // moyennes de la génération (figures 3.6 et 3.2), qui servent à placer cotisations et pensions dans le temps.
  generations: [
    { annee: 1940, tri: 0.01985, dureeRetraite: 24.71, esperanceA60: 25.52, dureeCarriere: 35.3 },
    { annee: 1945, tri: 0.01887, dureeRetraite: 25.01, esperanceA60: 25.79, dureeCarriere: 36.27 },
    { annee: 1950, tri: 0.01768, dureeRetraite: 25.51, esperanceA60: 25.99, dureeCarriere: 38.02 },
    { annee: 1955, tri: 0.01243, dureeRetraite: 24.18, esperanceA60: 26.1, dureeCarriere: 39.46 },
    { annee: 1960, tri: 0.01212, dureeRetraite: 24.23, esperanceA60: 26.67, dureeCarriere: 39.33 },
    { annee: 1965, tri: 0.01105, dureeRetraite: 23.77, esperanceA60: 27.25, dureeCarriere: 39.13 },
    { annee: 1970, tri: 0.00882, dureeRetraite: 23.6, esperanceA60: 27.78, dureeCarriere: 39.05 },
    { annee: 1975, tri: 0.00776, dureeRetraite: 23.81, esperanceA60: 28.3, dureeCarriere: 38.34 },
    { annee: 1980, tri: 0.00796, dureeRetraite: 24.33, esperanceA60: 28.8, dureeCarriere: 38.35 },
    { annee: 1985, tri: 0.00786, dureeRetraite: 24.73, esperanceA60: 29.29, dureeCarriere: 38.04 },
    { annee: 1990, tri: 0.00795, dureeRetraite: 25.16, esperanceA60: 29.74, dureeCarriere: 37.85 },
    { annee: 1995, tri: 0.00824, dureeRetraite: 25.58, esperanceA60: 30.17, dureeCarriere: 37.87 },
    { annee: 2000, tri: 0.00827, dureeRetraite: 26.02, esperanceA60: 30.58, dureeCarriere: 37.91 },
  ],
  // TRI net de la génération 2000 selon le profil (figure 3.A). « Smic avec exonérations » : seules les
  // cotisations effectivement payées sont comptées, les allègements étant compensés par l'impôt.
  profils2000: [
    { label: "Cadre", tri: 0.00044 },
    { label: "Non-cadre", tri: 0.00827 },
    { label: "Smic, cotisations payées", tri: 0.02868 },
    { label: "Smic, avant allègements", tri: 0.00327 },
    { label: "Homme sans enfant", tri: 0.00482 },
    { label: "Femme sans enfant", tri: 0.01633 },
    { label: "Femme, 2 enfants", tri: 0.01924 },
    { label: "Femme, 3 enfants", tri: 0.0222 },
  ],
  // Les pensions en cours de retraite suivent les prix, pas les salaires : rapportées au salaire moyen, elles
  // perdent chaque année l'équivalent des gains de productivité (hypothèse : 1 % par an).
  decrochagePension: 0.01,
  ...COR,

  // Part des ressources du système de retraite qui ne vient pas des cotisations (impôts et taxes affectés, CSG,
  // subventions de l'État, transferts d'autres caisses), et part payée par les retraités eux-mêmes.
  // 1987 et 2018 : COR, séance du 17 octobre 2019, document 2 ; 2004-2025 : COR 2026, figure 2.11.
  // Avant 1987 : niveau de 1987 (le Fonds national de solidarité existe depuis 1956). Après 2025 : niveau de 2025.
  impots: {
    source: "COR, « L'état du financement du système de retraite », séance du 17 octobre 2019 ; COR 2026, figure 2.11",
    url: "https://www.cor-retraites.fr/sites/default/files/2019-11/Doc_2_%C3%A9tat_financement_0.pdf",
    partHorsCotisations: {
      1987: 0.121, 2004: 0.1797, 2005: 0.179, 2006: 0.1795, 2007: 0.1771, 2008: 0.1906, 2009: 0.1811, 2010: 0.1775,
      2011: 0.1934, 2012: 0.1974, 2013: 0.205, 2014: 0.208, 2015: 0.2089, 2016: 0.2081, 2017: 0.2052, 2018: 0.2026,
      2019: 0.2005, 2020: 0.2158, 2021: 0.2079, 2022: 0.2101, 2023: 0.2089, 2024: 0.2089, 2025: 0.2104,
    },
    // Part des ressources totales payée par les retraités (CSG sur les pensions, TVA…) : quasi nulle avant 1994,
    // date où la CSG commence à financer les retraites (via le Fonds de solidarité vieillesse), environ 5 % en 2018.
    partPayeeParRetraites: { 1993: 0, 2018: 0.05 },
  },
};
