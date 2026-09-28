// Santé › Simuler : mieux répartir l'effort de financement de la santé entre âges. Données vérifiées en septembre 2026.
// Les valeurs marquées `estimation` sont des calculs ou des hypothèses du site.

export const santeReformes = {
  // Déficit de la branche maladie du régime général, prévision 2026.
  deficitMaladie: {
    valeur: -13.8,
    source: "Commission des comptes de la sécurité sociale, rapport de mai 2026",
    url: "https://www.securite-sociale.fr/files/live/sites/SSFR/files/medias/CCSS/2026/CCSS%20mai%202026_assembl%C3%A9_V2.pdf",
  },

  // Cotisation maladie des retraités : 1 % sur les pensions complémentaires (Agirc-Arrco, Ircantec) pour les retraités
  // au taux médian ou normal de CSG. Jusqu'en 1998, les pensions de base en supportaient une aussi, remplacée par la CSG.
  cotisationMaladie: {
    complementaires: 0.01,
    source: "Question écrite n° 161 à l'Assemblée nationale, 8 octobre 2024 ; service-public.gouv.fr (prélèvements sur les pensions)",
    url: "https://questions.assemblee-nationale.fr/q17/17-161QE.htm",
    // Part des retraités au taux médian ou normal (Cnav, fin 2024), voir params/prelevements.js.
  },

  // Part de la pension brute dans le revenu des retraités, par niveau de vie, touchée par chaque levier (estimation du
  // site à partir des seuils de CSG 2025 : le taux normal commence vers 2 400 € de pension brute pour une personne
  // seule, le taux médian vers 1 550 €). Ordre des niveaux : très modestes → très aisés (Drees, ER 1345).
  exposition: {
    tauxNormal: [0, 0, 0.5, 1, 1],
    tauxMedianOuNormal: [0, 0.6, 1, 1, 1],
    estimation: true,
  },

  // Taux d'effort en primes de complémentaire et restes à charge (en % du revenu disponible après financement de
  // l'assurance maladie obligatoire), par dixième de ménages classés selon ce taux d'effort, 2019 ; composition des
  // groupes (situation de la personne la plus âgée, niveau de vie modeste = moins de 90 % du médian).
  effortPrive: {
    source: "Drees, Études et Résultats n° 1345, juillet 2025, encadré 3 et tableaux complémentaires A et G (Ines-Omar 2019)",
    url: "https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse/250828_ER_depenses-de-sante",
    annee: 2019,
    // [label, part des ménages dans le groupe (cumulée dans les tops), taux d'effort moyen en %, retraités modestes %,
    //  retraités médians à aisés %]
    dixiemes: [
      ["D1", 0.28, 9.02, 4.21],
      ["D2", 1.21, 5.57, 4.37],
      ["D3", 1.85, 3.15, 7.63],
      ["D4", 2.46, 2.49, 12.68],
      ["D5", 3.07, 3.39, 20.18],
      ["D6", 3.75, 5.41, 27.75],
      ["D7", 4.58, 9.84, 36.95],
      ["D8", 5.68, 21.99, 42.03],
      ["D9", 7.33, 36.04, 38.1],
      ["D10", 12.68, 53.65, 26.84],
    ],
    tops: [
      ["Top 5 %", 0.05, 15.82, 56.21, 23.99],
      ["Top 2 %", 0.02, 21.2, 59.2, 18.28],
      ["Top 1 %", 0.01, 26.87, 58.76, 14.43],
    ],
    moyenne: 4.29,
    // Primes et restes à charge moyens par ménage, 2019, en euros (tableau A, ensemble) : 1 021 + 387.
    depenseMoyenneMenage: 1408,
  },

  // 63,4 millions de personnes dans le champ (Insee, ERFS 2019), 2,2 personnes par ménage : environ 28,8 millions de
  // ménages.
  menages: { valeur: 28.8e6, source: "Insee Première n° 1875, 2021 (champ de 63,4 millions de personnes)", url: "https://www.insee.fr/fr/statistiques/5431993", estimation: true },

  // Passage de 2019 à 2024 : dépenses de soins payées par les complémentaires et les ménages, 44,3 Md€ en 2019,
  // 52,5 Md€ en 2024 (Drees, comptes de la santé).
  evolution2019_2024: (32.52 + 19.96) / (26.74 + 17.52),
};
