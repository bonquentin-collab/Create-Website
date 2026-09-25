// Niveaux de vie médians des retraités et des actifs, 1996-2024, et par âge.
// Source principale : Insee, Chiffres-clés « Niveau de vie selon le statut d'activité » et « selon l'âge »
// (ERFS, fichier reve-niv-vie-individu-activite.xlsx), euros constants 2024, publiés le 9 juillet 2026.
// Ruptures de série en 2010, 2012 et 2020 (changements de l'enquête) : on retient la valeur après rupture.

const annees = Array.from({ length: 29 }, (_, i) => 1996 + i);

export const niveauDeVie = {
  source: "Insee, niveau de vie selon le statut d'activité (ERFS), euros constants 2024",
  url: "https://www.insee.fr/fr/statistiques/2415628",
  urlAge: "https://www.insee.fr/fr/statistiques/2416878",
  annees,
  // Médianes annuelles par personne (€ 2024).
  series: {
    ensemble: [20670, 20700, 21130, 21440, 21830, 22370, 22960, 22900, 22780, 23190, 23520, 24010, 24420, 24490, 24220, 24220, 24200, 24180, 24230, 24320, 24550, 24650, 24690, 25340, 26160, 26070, 26030, 26280, 26740],
    retraites: [21280, 21010, 21350, 21850, 22030, 22420, 22690, 22610, 22580, 22830, 23670, 23970, 24140, 24430, 24020, 24160, 24990, 25060, 25040, 25260, 25720, 25880, 25350, 25740, 26380, 26080, 25610, 25920, 26830],
    emploi: [23080, 23300, 23800, 23930, 24290, 24920, 25620, 25500, 25430, 25810, 25980, 26680, 26940, 27260, 27070, 27040, 26950, 26760, 26750, 26960, 27180, 27140, 27470, 28110, 29050, 29110, 29230, 29320, 29860],
  },
  ruptures: [2010, 2012, 2020],

  // Médianes par âge (€ 2024), 1996 et 2024.
  parAge: [
    { age: "Moins de 18 ans", v1996: 18760, v2024: 23820, statut: "actifs" },
    { age: "18-29 ans", v1996: 19350, v2024: 25860, statut: "actifs" },
    { age: "30-39 ans", v1996: 20860, v2024: 27610, statut: "actifs" },
    { age: "40-49 ans", v1996: 22290, v2024: 27280, statut: "actifs" },
    { age: "50-64 ans", v1996: 23580, v2024: 29590, statut: "actifs" },
    { age: "65-74 ans", v1996: 21620, v2024: 27340, statut: "retraites" },
    { age: "75 ans et plus", v1996: 20420, v2024: 26480, statut: "retraites" },
  ],

  // Poids des revenus dans le revenu des ménages, avant impôts, 2023 (COR, juin 2026, figure 3.8, d'après l'ERFS).
  composition: {
    partPensions: 0.778,
    partActivite: 0.841,
    source: "COR, rapport annuel juin 2026, figure 3.8 : pensions 77,8 % du revenu des ménages retraités, revenus d'activité 84,1 % de celui des ménages actifs",
  },

  // Masse des pensions (Md€, 2025) : 361 de droit direct et 39 de réversion (COR, juin 2026).
  pensionsTotales: { valeur: 400, source: "COR, rapport annuel juin 2026" },

  // Projection du COR : niveau de vie moyen des retraités rapporté à l'ensemble de la population (scénario de référence).
  projectionCor: {
    source: "COR, rapport annuel juin 2026, scénario de référence",
    url: "https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf",
    points: [
      { annee: 2023, valeur: 1.002 },
      { annee: 2030, valeur: 1.022 },
      { annee: 2040, valeur: 0.969 },
      { annee: 2050, valeur: 0.951 },
      { annee: 2070, valeur: 0.903 },
    ],
  },

  ft: {
    titre: "France and Britain are in thrall to pensioners",
    auteur: "John Burn-Murdoch, Financial Times, 13 septembre 2025",
    url: "https://www.ft.com/content/d419bd2d-a6ba-44a5-a93a-1276f3e5d2d7",
    resume: "Le graphique du FT compare le revenu des plus de 65 ans à celui des 18-64 ans (Luxembourg Income Study) : en France, les retraités ont un revenu légèrement supérieur à celui des actifs d'âge moyen, cas rare parmi les pays riches.",
  },
};
