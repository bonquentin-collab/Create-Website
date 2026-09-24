// Financement du système de retraite en 2025, tous régimes (base et complémentaires, FSV compris).
// Source principale : COR, « Évolutions et perspectives des retraites en France », rapport annuel juin 2026,
// tableau 2.2 (PDF p. 89) et chiffres de dépenses (PDF p. 67).
// Le FSV est intérieur au système dans les comptes du COR : sa CSG est déjà dans les impôts affectés.

const COR_2026 = {
  source: "COR, rapport annuel juin 2026, tableau 2.2",
  url: "https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf",
};

export const retraites = {
  annee: 2025,
  depenses: { valeur: 422.2, ...COR_2026, detail: "Dépenses brutes de retraite, 14,1 % du PIB" },

  // Ressources par nature (Md€). `groupe` sert au ruban d'ouverture ; `logique` indique si la ressource
  // est gardée par défaut dans le scénario « des retraites financées par des ressources propres ».
  ressources: [
    {
      id: "cotisations",
      groupe: "cotisations",
      label: "Cotisations des salariés, des employeurs et des indépendants",
      montant: 277.0,
      fixe: true,
      note: "Dont 100,9 Md€ payés par les salariés, 154,6 par les employeurs, 14,5 par les indépendants et 7,1 par les opérateurs de l'État.",
    },
    {
      id: "etat-part-privee",
      groupe: "etat",
      label: "État employeur : la part équivalente à une cotisation normale",
      montant: 21.0,
      logique: true,
      note: "Ce que l'État paierait pour ses fonctionnaires s'il cotisait comme un employeur ordinaire. Estimation du CAE (Focus n° 121, 2025) : 21,5 Md€ sur 50,4 en 2023, soit 43 %, appliqués aux 49,3 Md€ de 2025.",
      url: "https://cae-eco.fr/static/pdf/Focus_121_pension_2509123.pdf",
    },
    {
      id: "etat-equilibre",
      groupe: "etat",
      label: "État employeur : le complément qui équilibre le régime des fonctionnaires",
      montant: 28.3,
      logique: false,
      note: "Le reste de la contribution de l'État (49,3 Md€ en 2025) : un transfert du budget général selon le CAE, une « subvention d'équilibre » selon Fipeco. La Cour des comptes y voit à la fois une cotisation, de la solidarité et un financement d'équilibre.",
    },
    {
      id: "subventions",
      groupe: "etat",
      label: "Subventions d'équilibre aux régimes spéciaux (SNCF, RATP, mines, marins…)",
      montant: 7.7,
      logique: false,
    },
    {
      id: "csg",
      groupe: "impots",
      label: "CSG affectée aux retraites",
      montant: 21.9,
      logique: false,
    },
    {
      id: "forfait-social",
      groupe: "impots",
      label: "Forfait social et taxe sur les salaires",
      montant: 17.9,
      logique: true,
      note: "Des prélèvements assis sur les rémunérations : proches, dans leur logique, d'une cotisation.",
    },
    {
      id: "tva",
      groupe: "impots",
      label: "TVA et taxes sur la consommation",
      montant: 17.4,
      logique: false,
    },
    {
      id: "autres-impots",
      groupe: "impots",
      label: "Autres impôts et taxes affectés",
      montant: 7.4,
      logique: false,
    },
    {
      id: "cnaf",
      groupe: "transferts",
      label: "Transferts de la branche famille (trimestres des parents au foyer)",
      montant: 11.2,
      logique: true,
      note: "La CNAF cotise pour les parents qui s'arrêtent de travailler (AVPF) : une cotisation versée pour leur compte.",
    },
    {
      id: "unedic",
      groupe: "transferts",
      label: "Transferts de l'assurance chômage (trimestres de chômage)",
      montant: 3.9,
      logique: true,
      note: "L'Unédic cotise pour les périodes de chômage indemnisé.",
    },
    {
      id: "autres-transferts",
      groupe: "transferts",
      label: "Autres transferts",
      montant: 1.3,
      logique: false,
    },
    {
      id: "produits",
      groupe: "autres",
      label: "Produits financiers et autres produits",
      montant: 7.0,
      fixe: true,
      note: "5,6 Md€ de produits financiers (réserves des complémentaires) et 1,4 Md€ d'autres produits.",
    },
  ],

  groupes: [
    { id: "cotisations", label: "Cotisations", legende: "de cotisations", couleur: "var(--serie-actifs)" },
    { id: "etat", label: "État employeur et subventions", legende: "de l'État employeur et de subventions", couleur: "var(--serie-actuel)" },
    { id: "impots", label: "Impôts et taxes affectés", legende: "d'impôts (CSG, TVA, taxes…)", couleur: "var(--serie-tampon)" },
    { id: "transferts", label: "Transferts d'autres organismes", legende: "d'autres caisses (famille, chômage)", couleur: "var(--serie-neutre)" },
    { id: "autres", label: "Produits financiers et divers", legende: "de placements et divers", couleur: "var(--trame)" },
  ],

  // Retraités et pensions. DREES, « Les retraités et les retraites », édition 2025 (données fin 2023),
  // cité par des sources secondaires : le site de la DREES n'était pas accessible lors de la collecte.
  retraitesDroitDirect: { valeur: 17.4e6, source: "COR, rapport annuel juin 2026 (2025, estimation)" },
  cotisants: { valeur: 30.6e6, source: "COR, rapport annuel juin 2026 (2025, estimation)" },
  pensionMoyenneNette: { valeur: 1541, source: "DREES, édition 2025, pension moyenne de droit direct nette, fin 2023" },
  pensionMedianeBrute: { valeur: 1400, source: "DREES (fin 2023), cité par L'Opinion, 24/08/2026" },

  controverse: [
    {
      qui: "COR (2026)",
      dit: "Seuls 277 milliards d'euros, soit près des deux tiers, proviennent des cotisations.",
      url: "https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf",
    },
    {
      qui: "Fipeco, François Ecalle (2026)",
      dit: "Un tiers vient d'impôts affectés et de subventions ; la cotisation de l'État employeur est en réalité une subvention d'équilibre.",
      url: "https://www.fipeco.fr/fiche/La-situation-et-les-perspectives-des-r%C3%A9gimes-de-retraite",
    },
    {
      qui: "Jean-Pascal Beaufret, Fondapol (2025)",
      dit: "Au-delà d'un taux de cotisation de 28 %, tout est subvention : 83 Md€ en 2024, un « besoin de financement » de 81 Md€.",
      url: "https://www.fondapol.org/app/uploads/2025/02/259_beaufret_fr_2025-02-10_w.pdf",
    },
    {
      qui: "CAE, Focus n° 121 (2025)",
      dit: "Pas de déficit caché : sur 50,4 Md€ versés par l'État en 2023, 21,5 relèvent d'une vraie cotisation employeur et 28,9 d'un transfert.",
      url: "https://cae-eco.fr/static/pdf/Focus_121_pension_2509123.pdf",
    },
    {
      qui: "Cour des comptes (2025)",
      dit: "La contribution de l'État est à la fois une cotisation employeur, de la solidarité et un éventuel financement d'équilibre.",
      url: "https://www.ccomptes.fr/sites/default/files/2025-02/20250220-Situation-financiere-et-perspectives-du-systeme-de%20retraites_0.pdf",
    },
  ],
};
