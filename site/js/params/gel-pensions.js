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

  // Passage des euros de fin 2020 aux pensions de 2027 : facteur calé sur la distribution de l'IPP (note n° 129,
  // septembre 2026, microsimulation TAXIPP) : pension médiane de 1 639 € par mois, 35 % des retraités au-dessus de
  // 2 000 €, 13 % au-dessus de 3 000 € en 2027 (le modèle donne 1 641 €, 35 % et 11 %). Champ de l'IPP : toutes les
  // personnes percevant une pension, pension brute totale tous régimes.
  facteur: 1.1,

  retraites: {
    valeur: 17.3e6,
    source: "Drees, effectifs de retraités fin 2024 (17,3 millions de retraités de droit direct, dont 16,4 en France)",
    url: "https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/jeux-de-donnees/effectifs-de-retraites-et-montants-des",
  },

  // Revalorisation des pensions de base au 1er janvier 2026 (inflation hors tabac).
  revalorisation2026: 0.009,
  // Revalorisation prévue au 1er janvier 2027 : environ 2,5 % (inflation estimée pour 2026, IPP note n° 129).
  revalorisation2027: 0.025,
  // Plus forte revalorisation récente : 5,3 % au 1er janvier 2024.
  revalorisation2024: 0.053,

  // Part de la pension venant des régimes de base, en moyenne : deux tiers (IPP 2026, ch. 3 : 0,37 point de
  // sous-indexation uniforme rapporte 1 Md€, soit environ 270 Md€ de pensions de base ; IPP note n° 129 : le gel des
  // pensions de base économiserait 6,6 Md€ avec 2,5 % d'inflation, soit 264 Md€). Sert aux leviers qui touchent toutes
  // les pensions (Santé).
  partBase: 0.67,

  // Part de base selon le montant de la pension : les hautes pensions comptent davantage de complémentaire.
  // Profil calé sur les quatre chiffrages de l'IPP (note n° 129, gel des pensions de base au-delà de 0 €, de la médiane,
  // de 2 000 € et de 3 000 € : 6,6, 4,7, 3,6 et 1,5 Md€ d'économie directe) ; estimation du site.
  profilBase: { jusqua: 1500, base: 0.79, apartirDe: 3000, haut: 0.63 },

  // Rapport de l'IPP sur la désindexation des retraites (Perspectives budgétaires 2027, chapitre 3).
  ipp: {
    source: "IPP, Perspectives budgétaires 2027, chapitre 3 : sous-indexation des retraites (Aubert, Tô, Tochev, 2026)",
    url: "https://www.ipp.eu/wp-content/uploads/2026/07/Chapitre_Desindexation_retraite___Rapport_Perspectives_Budgetaires_2027-4.pdf",
    // L'économie pour l'ensemble des finances publiques est inférieure d'environ 20 % à celle des régimes (moins
    // d'impôt sur le revenu et de CSG, plus de prestations) : 5,2 Md€ nets pour 6,6 Md€ d'économie directe en 2027
    // (IPP, note n° 129). Rapport retenu : 0,79.
    effetNet: 0.79,
    // Valeur d'un trimestre : taux plein de 50 % du salaire de référence réparti sur la durée requise (172 trimestres
    // pour les générations nées à partir de 1965).
    tauxPlein: 0.5,
    trimestresRequis: 172,
  },

  // Sortie des retraités actuels : 651 000 décès en 2025 (Insee, bilan démographique), dont près de 9 sur 10 à
  // 60 ans ou plus, rapportés à 17,3 millions de retraités : environ 3 % du stock par an. Ordre de grandeur : les
  // hautes pensions sont un peu plus jeunes, donc sortent un peu moins vite. Sans ajustement des futures pensions,
  // l'économie s'érode d'autant.
  deces: { valeur: 651000, source: "Insee Première n° 2087, Bilan démographique 2025", url: "https://www.insee.fr/fr/statistiques/8719824" },
  sortieAnnuelle: 0.03,

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
