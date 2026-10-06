// TVA et CSG : taux, rendements et effets, 2025. Chaque valeur porte sa source.
// Les valeurs marquées `estimation: true` sont des calculs du simulateur, pas des chiffres officiels.

export const tva = {
  taux: { normal: 0.2, intermediaire: 0.1, reduit: 0.055, particulier: 0.021 },
  recettesNettes: { valeur: 210.0, source: "PLF 2026, annexe Voies et moyens, tome I (prévision 2025)", url: "https://www.assemblee-nationale.fr/dyn/contenu/visualisation/1087930/file/PLF%202026%20-%20V%26M%20TI%20-%20Evaluations%20des%20recettes.pdf" },
  // Rendement d'un point, net de la TVA payée par les administrations publiques elles-mêmes.
  pointNet: {
    normal: 7.5,
    tousTaux: 11.4,
    source: "DG Trésor, Trésor-Éco n° 371, septembre 2025, tableaux 1 et 2",
    url: "https://www.tresor.economie.gouv.fr/Articles/2025/09/25/analyse-de-la-composition-des-recettes-de-tva",
  },
  // Perte de pouvoir d'achat des ménages pour une hausse d'un point de TVA, répercussion totale dans les prix, selon le
  // cinquième de niveau de vie (du plus modeste au plus aisé). Valeurs lues sur le graphique 4 du Trésor-Éco n° 371
  // (segments « taux normal » et total des quatre taux), au 0,01 point près. La moyenne de l'ensemble des ménages est
  // publiée pour tous les taux (0,5 %) ; pour le taux normal seul, elle est déduite du graphique : 0,5 % × part du taux
  // normal dans la perte totale (0,312 / 0,522), soit 0,30 %.
  pertePouvoirAchatParPoint: (() => {
    const parCinquieme = { normal: [0.0039, 0.0031, 0.003, 0.0031, 0.0025], tousTaux: [0.0067, 0.0051, 0.0051, 0.005, 0.0042] };
    const moyenne = (t) => t.reduce((a, b) => a + b, 0) / t.length;
    return {
      parCinquieme,
      tousTaux: 0.005,
      normal: (0.005 * moyenne(parCinquieme.normal)) / moyenne(parCinquieme.tousTaux),
      source: "DG Trésor, Trésor-Éco n° 371, septembre 2025, graphique 4 (valeurs lues sur le graphique) et texte (0,5 % pour l'ensemble des ménages)",
      url: "https://www.tresor.economie.gouv.fr/Articles/2025/09/25/analyse-de-la-composition-des-recettes-de-tva",
    };
  })(),
  repercussionCourtTerme: { valeur: 0.75, source: "Insee, note de conjoncture de décembre 2013 (hausses passées de TVA)" },
  effortParDecile: { d1: 0.12, d10: 0.05, source: "Insee Analyses n° 43, 2019 : la TVA pèse 12 % du revenu disponible des 10 % les plus modestes, 5 % des 10 % les plus aisés", url: "https://www.insee.fr/fr/statistiques/3713290" },
};

export const csg = {
  activite: {
    taux: 0.092,
    assiette: 0.9825,
    recettes: 110.7,
    // Valeur d'un point de CSG sur les revenus d'activité : 110,7 / 9,2.
    valeurPoint: 12.0,
    estimation: true,
    source: "CCSS, rapport de mai 2026, tableau 1 (recettes 2025) ; valeur du point : calcul du simulateur",
    url: "https://www.securite-sociale.fr/files/live/sites/SSFR/files/medias/CCSS/2026/CCSS%20mai%202026_assembl%C3%A9_V2.pdf",
  },
  retraites: {
    // Taux sur les pensions selon le revenu fiscal de référence (1 part, seuils 2025, revenus de 2023).
    taux: [
      { id: "exonere", label: "Exonéré", taux: 0, jusqua: 12817 },
      { id: "reduit", label: "Taux réduit, 3,8 %", taux: 0.038, jusqua: 16755 },
      { id: "median", label: "Taux médian, 6,6 %", taux: 0.066, jusqua: 26004 },
      { id: "normal", label: "Taux normal, 8,3 %", taux: 0.083, jusqua: Infinity },
    ],
    recettes: 25.4,
    source: "Code de la sécurité sociale, art. L136-8 ; seuils 2025 : service-public.gouv.fr",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2971",
    // Assiette des pensions par taux (Md€), calée sur les chiffrages de l'IPP (note n° 129, 2027) : aligner le seul
    // taux normal sur 9,2 % rapporte 1,5 Md€ net, aligner les taux médian et normal 4,2 Md€ net, l'impôt sur le
    // revenu reprenant environ 12,5 % de la hausse de CSG (part déductible). Soit 1,71 Md€ brut pour 0,9 point sur le
    // taux normal (190,5 Md€) et 3,09 Md€ pour 2,6 points sur le taux médian (118,7 Md€). Taux réduit : estimation
    // calibrée sur les recettes de CSG 2025 (CCSS, mai 2026).
    assiettes: { normal: 190.5, median: 118.7, reduit: 27, estimation: true },
    // Rendement net pour les finances publiques / hausse de CSG (IPP, note n° 129) : 0,875.
    effetNet: 0.875,
    repartitionRetraites: { exonere: 0.29, reduit: 0.15, median: 0.27, normal: 0.29, source: "CNAV, recueil statistique 2025, retraités du régime général fin 2024" },
  },
  point2018: { source: "La hausse de 1,7 point de 2018 a rapporté 4,5 Md€ sur les pensions (Sénat)", url: "https://www.senat.fr/rap/l17-077-2/l17-077-218.html" },
};
