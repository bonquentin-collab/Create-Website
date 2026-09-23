// Agrégats macroéconomiques utilisés pour ramener des recettes nationales à l'échelle d'une personne.
// Chaque valeur porte sa source : c'est ce fichier qu'il faut mettre à jour quand l'Insee publie.

export const macro = {
  personnesEnEmploi: {
    valeur: 30_400_000,
    source: "Insee, Emploi, chômage, revenus du travail, édition 2025 : 30,4 millions de personnes en emploi fin 2024",
    url: "https://www.insee.fr/fr/statistiques/8376894",
  },
  salaries: {
    valeur: 27_000_000,
    source: "Insee, même source : 27,0 millions de salariés fin 2024",
    url: "https://www.insee.fr/fr/statistiques/8376894",
  },
  masseSalarialeBrute: {
    valeur: 1_108.5e9,
    source: "Insee, Comptes de la Nation 2024, tableau 6.205 (salaires et traitements bruts, total branches)",
    url: "https://www.insee.fr/fr/statistiques/8574681?sommaire=8574832",
  },
  // Passage du salaire net au salaire brut, ordre de grandeur pour un salarié du privé non cadre.
  ratioNetSurBrut: {
    valeur: 0.78,
    source: "Hypothèse du simulateur : environ 22 % de cotisations et contributions salariales",
  },
};
