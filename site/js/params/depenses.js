// Dépenses publiques françaises par grande fonction, 2024 (État, collectivités et Sécurité sociale).
// Classification internationale COFOG (Eurostat, table gov_10a_exp, secteur S13, millions d'euros).
// Les retraites regroupent « vieillesse » (GF1002) et « survivants » (GF1003, pensions de réversion) : 432,6 Md€,
// proche des 422 Md€ de dépenses de retraite du COR (périmètres voisins mais pas identiques).
// Particularité de la COFOG : les pensions des fonctionnaires sont classées en « vieillesse », pas dans le
// service où ils ont travaillé. On les rend ici à leur service : pensions des anciens enseignants à
// l'éducation, pensions militaires à la défense (rapport annuel sur les pensions de la fonction publique, PLF 2026).
//
// Pour ajouter un poste : le déclarer dans `postes` avec sa couleur (jeton CSS --poste-<id>), puis, si le
// répartiteur peut l'abonder, indiquer `poste: "<id>"` dans la destination correspondante de budgets.js.

const EUROSTAT = {
  source: "Eurostat, dépenses des administrations publiques par fonction (COFOG), France 2024",
  url: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table",
};
const JAUNE = {
  source: "Rapport sur les pensions de retraite de la fonction publique, annexe au PLF 2026",
  url: "https://questions.assemblee-nationale.fr/dyn/contenu/visualisation/1090002/file/12-Jaune2026_Pensions.pdf",
};

// Pensions de l'État en 2024 : 52,1 Md€ civiles, 10,9 Md€ militaires.
// « Les anciens agents de l'éducation nationale comptent pour environ la moitié des pensionnés civils » :
// on leur attribue la moitié des pensions civiles (estimation, à pension moyenne égale).
export const pensionsFonctionnaires = {
  enseignants: 52.1 / 2,
  militaires: 10.9,
  ...JAUNE,
};

const cofog = {
  total: 1671.8,
  vieillesse: 391.95, // GF1002 : pensions de droit direct, minimum vieillesse, dépendance
  survivants: 40.61, // GF1003 : pensions de réversion, classées à part par la COFOG
  protectionSociale: 693.03, // GF10
  sante: 261.16, // GF07
  education: 148.64, // GF09
  defense: 54.2, // GF02
  tribunaux: 8.3, // GF0303
  prisons: 5.12, // GF0304
};

const { enseignants, militaires } = pensionsFonctionnaires;

// Chaque poste : montant 2024 en Md€ et part de ce montant faite de pensions (touchée par une baisse des pensions).
// `pensionsDansServices` : vrai → pensions des enseignants à l'éducation et pensions militaires à la défense ;
// faux → toutes les pensions restent dans « Retraites », comme dans la comptabilité publique (COFOG).
export function construirePostes({ pensionsDansServices = true } = {}) {
  const ens = pensionsDansServices ? enseignants : 0;
  const mil = pensionsDansServices ? militaires : 0;
  const retraites = cofog.vieillesse + cofog.survivants - ens - mil;
  return [
    {
      id: "retraites",
      label: "Retraites",
      detail: pensionsDansServices
        ? "Pensions de retraite et de réversion, minimum vieillesse, hors anciens enseignants et militaires"
        : "Toutes les pensions de retraite et de réversion, minimum vieillesse",
      montant: retraites,
      pensions: retraites,
    },
    { id: "sante", label: "Santé", detail: "Hôpitaux, soins de ville, médicaments", montant: cofog.sante, pensions: 0 },
    {
      id: "education",
      label: "Éducation",
      detail: pensionsDansServices
        ? "Écoles, collèges, lycées, universités, avec les pensions des anciens enseignants"
        : "Écoles, collèges, lycées, universités",
      montant: cofog.education + ens,
      pensions: ens,
    },
    {
      id: "defense",
      label: "Défense",
      detail: pensionsDansServices ? "Armées, avec les pensions militaires" : "Armées",
      montant: cofog.defense + mil,
      pensions: mil,
    },
    { id: "justice", label: "Justice", detail: "Tribunaux et prisons", montant: cofog.tribunaux + cofog.prisons, pensions: 0 },
    {
      id: "social",
      label: "Autres aides sociales",
      detail: "Famille, chômage, handicap, logement, pauvreté",
      montant: cofog.protectionSociale - cofog.vieillesse - cofog.survivants,
      pensions: 0,
    },
    {
      id: "autres",
      label: "Tout le reste",
      detail: "Intérêts de la dette, police, transports, économie, environnement, culture…",
      montant: cofog.total - cofog.protectionSociale - cofog.sante - cofog.education - cofog.defense - cofog.tribunaux - cofog.prisons,
      pensions: 0,
    },
  ];
}

export const postes = construirePostes();

export const depenses = { annee: 2024, total: cofog.total, postes, ...EUROSTAT, jaune: JAUNE };
