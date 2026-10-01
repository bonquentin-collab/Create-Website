// « Comment mettre à contribution les retraités pour le redressement des finances publiques ? », Notes IPP n° 129,
// septembre 2026 (P. Aubert, S. Duchesne, M. Tô, T. Tochev), microsimulation TAXIPP 2.4.2 enrichie (EIR, Drees),
// année 2027, simulation statique avec effets de second tour (impôt, CSG, prestations), sans effets de comportement.

export const ipp129 = {
  source: "IPP, Notes n° 129, « Comment mettre à contribution les retraités pour le redressement des finances publiques ? », septembre 2026",
  url: "https://www.ipp.eu/publication/comment-mettre-a-contribution-les-retraites-pour-le-redressement-des-finances-publiques/",
  pdf: "https://www.ipp.eu/wp-content/uploads/2026/09/Note_contribution_retraites_129.pdf",
  annee: 2027,

  // Tableau 1. rendement : gain net pour les finances publiques (Md€) ; concernes : part des retraités dont la pension
  // est désindexée ; perdants : part des retraités dont le ménage perd plus de 1 € par an ; perte : perte moyenne de
  // niveau de vie de l'ensemble des retraités (€/mois) ; variation : en % du niveau de vie moyen ; pertePerdants :
  // perte moyenne des perdants (€/mois) ; retraitePerdants : retraite brute totale moyenne des perdants (€/mois).
  scenarios: [
    { id: "A1", groupe: "principales", label: "Suppression de l'abattement de 10 %", rendement: 5.4, concernes: null, perdants: 0.65, perte: 27, variation: -0.0104, pertePerdants: 41, retraitePerdants: 2203 },
    { id: "D1", groupe: "principales", label: "Gel de toutes les pensions de base", rendement: 5.2, concernes: 0.93, perdants: 0.94, perte: 27, variation: -0.0107, pertePerdants: 29, retraitePerdants: 1922 },
    { id: "C1", groupe: "principales", label: "CSG à 9,2 % (taux médian et normal)", rendement: 4.2, concernes: null, perdants: 0.69, perte: 22, variation: -0.0085, pertePerdants: 32, retraitePerdants: 2218 },
    { id: "D2", groupe: "seuils", label: "Gel au-delà de la pension médiane (1 639 €)", rendement: 3.7, concernes: 0.49, perdants: 0.61, perte: 19, variation: -0.0075, pertePerdants: 31, retraitePerdants: 2376 },
    { id: "D3", groupe: "seuils", label: "Gel au-delà de 2 000 €", rendement: 2.8, concernes: 0.35, perdants: 0.46, perte: 15, variation: -0.0058, pertePerdants: 32, retraitePerdants: 2621 },
    { id: "D4", groupe: "seuils", label: "Gel au-delà de 3 000 €", rendement: 1.2, concernes: 0.13, perdants: 0.18, perte: 6, variation: -0.0024, pertePerdants: 33, retraitePerdants: 3414 },
    { id: "C2", groupe: "egal", label: "CSG à 9,2 % (taux normal seulement)", rendement: 1.5, concernes: null, perdants: 0.38, perte: 8, variation: -0.003, pertePerdants: 20, retraitePerdants: 2623 },
    { id: "D5", groupe: "egal", label: "Revalorisation réduite d'un point au-delà de la médiane", rendement: 1.5, concernes: 0.49, perdants: 0.61, perte: 8, variation: -0.003, pertePerdants: 12, retraitePerdants: 2376 },
    { id: "A2", groupe: "egal", label: "Plafond de l'abattement abaissé à 2 545 €", rendement: 1.5, concernes: null, perdants: 0.4, perte: 8, variation: -0.003, pertePerdants: 19, retraitePerdants: 2715 },
  ],

  // Profils de l'effort selon le niveau de vie (figures 2 à 4), en une phrase.
  profils: {
    C2: "Effort concentré sur la moitié la plus aisée : les dix premiers vingtièmes de niveau de vie sont presque épargnés.",
    D5: "Effort dès le milieu de la distribution : la pension individuelle peut être élevée dans un ménage modeste.",
    A2: "Effort concentré sur la moitié la plus aisée, comme la CSG : il dépend du revenu de tout le foyer.",
  },

  // Abattement de 10 % sur les pensions à l'impôt sur le revenu (CGI, art. 158, 5-a), revenus 2025 : plafond par
  // foyer et plancher par pensionné. Recettes nettes chiffrées par l'IPP : suppression 5,4 Md€ (dont 5,0 d'impôt sur le
  // revenu et 0,4 de moindres aides au logement) ; plafond ramené à 2 545 € : 1,5 Md€.
  abattement: {
    taux: 0.1,
    plafond: 4439,
    plancher: 454,
    points: [
      { plafond: 0, recettes: 5.4 },
      { plafond: 2545, recettes: 1.5 },
      { plafond: 4439, recettes: 0 },
    ],
    aidesLogement: 0.4,
  },

  // CSG : l'alignement porte sur la part déductible, ce qui réduit l'impôt sur le revenu (effet de second tour) :
  // environ 0,6 Md€ sur 4,8 Md€ de hausse de CSG pour l'alignement des taux médian et normal, soit −12,5 %.
  csgEffetNet: 0.875,
};
