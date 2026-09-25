// Contexte des retraites en quelques chiffres, vérifiés sur les publications les plus récentes (septembre 2026).
// Chaque bloc : valeurs, source, lien. L'interface (ui/contexte-retraites.js) les affiche dans l'ordre.

const COR = {
  source: "COR, rapport annuel de juin 2026",
  url: "https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf",
};

export const contexte = {
  // « Le rapport démographique entre les cotisants et les retraités s'est dégradé depuis 2002, passant de 2,1 à
  // 1,8 en 2025 […] À l'horizon 2070, ce ratio s'établirait à 1,3 » (scénario de référence).
  cotisants: {
    ...COR,
    detail: "partie 2, chapitre 1",
    lignes: [
      { label: "2002", valeur: 2.1 },
      { label: "2025", valeur: 1.8 },
      { label: "2070 (projection)", valeur: 1.3 },
    ],
  },

  // Taux de pauvreté monétaire (seuil à 60 % du niveau de vie médian), 2024.
  pauvrete: {
    source: "Insee Première n° 2117, « Niveau de vie et pauvreté en 2024 », juillet 2026",
    url: "https://www.insee.fr/fr/statistiques/9019316",
    lignes: [
      { label: "Enfants", valeur: 0.224, statut: "actifs" },
      { label: "Ensemble de la population", valeur: 0.154, statut: "neutre" },
      { label: "Retraités", valeur: 0.104, statut: "retraites" },
    ],
  },

  // Taux de remplacement net à la liquidation, cas type de salarié non-cadre du privé (pension nette / moyenne des
  // 12 derniers salaires nets), par génération, scénario de référence. Données de la figure 3.3.
  remplacement: {
    ...COR,
    detail: "figure 3.3",
    lignes: [
      { label: "Né en 1960", valeur: 0.748 },
      { label: "Né en 1980", valeur: 0.7 },
      { label: "Né en 2000", valeur: 0.687 },
    ],
    // Pension moyenne rapportée au revenu d'activité moyen : 54,6 % en 2025, 45,3 % en 2070.
    pensionRelative: { en2025: 0.546, en2070: 0.453 },
  },
};
