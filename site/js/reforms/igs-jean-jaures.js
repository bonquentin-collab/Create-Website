// Impôt sur les grandes successions (IGS), Fondation Jean-Jaurès, novembre 2024.
// A. Ouizille, T. Iberrakene, B. Julien-Vauzelle, « Face à la "grande transmission",
// l'impôt sur les grandes successions ».
// Tous les chiffres ci-dessous sont repris de l'étude (tableaux 1, 5, 6, 7 et 8).

const annees = Array.from({ length: 16 }, (_, i) => 2025 + i);

export const igsJeanJaures = {
  id: "igs-jean-jaures",
  label: "Impôt sur les grandes successions",
  labelCourt: "IGS",
  source: {
    titre: "Face à la « grande transmission », l'impôt sur les grandes successions",
    auteurs: "Alexandre Ouizille, Théo Iberrakene, Boris Julien-Vauzelle",
    editeur: "Fondation Jean-Jaurès",
    date: "novembre 2024",
    url: "https://www.jean-jaures.org/publication/face-a-la-grande-transmission-limpot-sur-les-grandes-successions/",
    pdf: "https://www.jean-jaures.org/wp-content/uploads/2024/11/Rapport_IGS.pdf",
  },

  piliers: [
    {
      id: "pilier1",
      nom: "Pilier 1",
      titre: "Élargir l'assiette, rendre le barème plus progressif",
      texte:
        "Toutes les transmissions reçues au cours de la vie entrent dans l'assiette, assurance-vie comprise. Démembrement de propriété supprimé, pacte Dutreil resserré mais conservé pour les commerces, TPE, PME et ETI. Rien à payer jusqu'à 200\u00a0000\u00a0€ reçus.",
    },
    {
      id: "pilier2",
      nom: "Pilier 2",
      titre: "Taxer les plus-values latentes du top 1 %",
      texte:
        "Aujourd'hui, les plus-values accumulées sur un patrimoine sont effacées au décès. Pour les plus grandes successions, elles seraient soumises au prélèvement forfaitaire unique (PFU), avec un étalement possible sur dix ans.",
    },
    {
      id: "pilier3",
      nom: "Pilier 3",
      titre: "Un barème unique, calculé sur toute une vie",
      texte:
        "L'impôt se calcule sur ce que chaque personne reçoit tout au long de sa vie, en donations comme en héritages, avec le même barème quel que soit le lien de parenté. Sans objectif de rendement.",
    },
  ],

  // Tableau 6 : barème sur la fraction des sommes perçues tout au long de la vie (source CAE, 2021).
  bareme: [
    { jusqua: 200_000, taux: 0 },
    { jusqua: 800_000, taux: 0.05 },
    { jusqua: 1_200_000, taux: 0.15 },
    { jusqua: 2_000_000, taux: 0.25 },
    { jusqua: 4_000_000, taux: 0.35 },
    { jusqua: 6_000_000, taux: 0.45 },
    { jusqua: Infinity, taux: 0.5 },
  ],

  // Pilier 2 : PFU sur les plus-values latentes transmises (taux légal 2024).
  pfu: 0.3,

  // Tableau 1 : flux successoral annuel (donations + successions), Md€.
  fluxSuccessoral: {
    annees,
    valeurs: [464, 476, 489, 502, 516, 529, 543, 557, 571, 585, 600, 615, 630, 645, 661, 677],
    totalAnnonce: 9_059,
  },

  // Tableaux 7 et 8 : recettes additionnelles, Md€ courants.
  recettes: {
    annees,
    series: [
      {
        id: "pilier1",
        label: "Pilier 1 : assiette et barème",
        valeurs: [12.32, 12.66, 13.0, 13.35, 13.7, 14.06, 14.43, 14.8, 15.17, 15.56, 15.95, 16.34, 16.74, 17.15, 17.56, 17.98],
      },
      {
        id: "pilier2",
        label: "Pilier 2 : plus-values latentes",
        valeurs: [6.62, 6.95, 7.3, 7.67, 8.05, 8.45, 8.87, 9.36, 9.86, 10.39, 10.95, 11.54, 12.16, 12.86, 13.54, 14.26],
      },
    ],
    totalAnnonce: 399.62,
    moyenneAnnuelleAnnoncee: 24.98,
  },

  // Recettes actuelles des droits de mutation à titre gratuit, et taux effectif avant / après.
  contexte: {
    dmtg2023: 20.8,
    tauxEffectifActuel: 0.047,
    tauxEffectifApres: 0.09,
    partPatrimoineTop10: 0.55,
    partPatrimoineBottom50: 0.08,
  },

  // Affectation retenue par l'étude. Aucune clé de répartition chiffrée n'est donnée.
  affectation: {
    priorites: ["la transition écologique", "la recherche", "l'éducation"],
    texte:
      "L'étude affecte les recettes à l'investissement dans l'avenir, sans les reverser directement aux ménages. Elle précise que l'IGS est « sans impact sur la fiscalité du travail ».",
  },
};
