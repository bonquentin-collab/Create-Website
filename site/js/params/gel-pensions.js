// Gel de la revalorisation des pensions au-delà d'un seuil (« hautes pensions »).
// Données : distribution des pensions et chiffres de contexte, vérifiés en septembre 2026.

export const gel = {
  // Distribution de la pension mensuelle brute totale (droit direct + réversion + majoration enfants), fin 2020,
  // tous retraités de droit direct d'un régime de base. Dernière distribution détaillée publiée par la Drees.
  // Chaque ligne : [de, à (null = au-delà), % des retraités], en euros de 2020.
  distribution2020: {
    source: "Drees, échantillon interrégimes de retraités (EIR) 2020, tableau 5",
    url: "https://data.drees.solidarites-sante.gouv.fr/explore/dataset/4178_distribution-des-pensions-mensuelles/information/",
    tranches: [
    [0, 100, 2.43],
    [100, 200, 2.46],
    [200, 300, 2.35],
    [300, 400, 2.17],
    [400, 500, 2.0],
    [500, 600, 2.06],
    [600, 700, 2.28],
    [700, 800, 2.94],
    [800, 900, 4.36],
    [900, 1000, 4.44],
    [1000, 1100, 4.2],
    [1100, 1200, 4.4],
    [1200, 1300, 4.59],
    [1300, 1400, 4.82],
    [1400, 1500, 4.9],
    [1500, 1600, 4.75],
    [1600, 1700, 4.47],
    [1700, 1800, 4.23],
    [1800, 1900, 4.0],
    [1900, 2000, 3.76],
    [2000, 2100, 3.63],
    [2100, 2200, 2.99],
    [2200, 2300, 2.6],
    [2300, 2400, 2.3],
    [2400, 2500, 1.99],
    [2500, 2600, 1.73],
    [2600, 2700, 1.53],
    [2700, 2800, 1.33],
    [2800, 2900, 1.17],
    [2900, 3000, 1.01],
    [3000, 3100, 0.9],
    [3100, 3200, 0.76],
    [3200, 3300, 0.67],
    [3300, 3400, 0.57],
    [3400, 3500, 0.51],
    [3500, 3600, 0.46],
    [3600, 3700, 0.4],
    [3700, 3800, 0.38],
    [3800, 3900, 0.31],
    [3900, 4000, 0.29],
    [4000, 4100, 0.26],
    [4100, 4200, 0.22],
    [4200, 4300, 0.2],
    [4300, 4400, 0.19],
    [4400, 4500, 0.18],
    [4500, null, 1.82],
    ],
    // Pension moyenne supposée dans la tranche ouverte (au-delà de 4 500 €) ; la moyenne obtenue (1 628 €) est
    // cohérente avec la pension moyenne totale de fin 2020.
    sommet: 6000,
  },

  // Passage des euros de fin 2020 aux pensions de 2026 : +15 % de 2020 à 2024 (revalorisations légales de 11,9 %
  // et arrivée de nouveaux retraités aux pensions plus élevées ; pension moyenne totale de 1 860 € en 2024 selon le
  // COR, figure 3.25), puis revalorisations de 2,2 % en 2025 et 0,9 % en 2026. Estimation du site.
  facteur2026: 1.19,

  retraites: {
    valeur: 17.3e6,
    source: "Drees, effectifs de retraités fin 2024 (17,3 millions de retraités de droit direct, dont 16,4 en France)",
    url: "https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/jeux-de-donnees/effectifs-de-retraites-et-montants-des",
  },

  // Revalorisation des pensions de base au 1er janvier 2026 (inflation hors tabac).
  revalorisation2026: 0.009,
  // Plus forte revalorisation récente : 5,3 % au 1er janvier 2024.
  revalorisation2024: 0.053,

  // Part de la pension venant des régimes de base (seule gelée dans la proposition). 71 % pour le cas type de
  // non-cadre du privé né en 1960 (COR 2026, figure 3.3 : 53,0 % de taux de remplacement Cnav sur 74,8 %),
  // moins pour un cadre, 100 % pour un fonctionnaire. Valeur par défaut : 75 %, estimation du site.
  partBase: 0.75,

  // Précédent : en 2020, les pensions de base ont été revalorisées de 1 % jusqu'à 2 000 € de pension totale brute,
  // de 0,3 % au-delà (loi de financement de la sécurité sociale pour 2020).
  precedent2020: { seuil: 2000, sous: 0.01, dessus: 0.003 },

  // Prélèvements sur une pension au taux normal de CSG : CSG 8,3 % + CRDS 0,5 % + Casa 0,3 %.
  prelevementsTauxNormal: 0.091,

  // Épargne des ménages (part du revenu disponible non consommée), 2017.
  epargne: {
    source: "Insee Première n° 1815, 2020 (enquête Budget de famille 2017)",
    url: "https://www.insee.fr/fr/statistiques/4764600",
    plus70: 0.218,
    cinquiemeAise: 0.284, // 20 % des ménages les plus aisés
    moins40: 0.09,
  },
};
