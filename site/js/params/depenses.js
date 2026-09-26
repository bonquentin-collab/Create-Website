// Dépenses publiques françaises par grande fonction, 2024 (État, collectivités et Sécurité sociale).
// Classification internationale COFOG (Eurostat, table gov_10a_exp, secteur S13, millions d'euros).
// Les retraites regroupent « vieillesse » (GF1002) et « survivants » (GF1003, pensions de réversion) : 432,6 Md€,
// proche des 422 Md€ de dépenses de retraite du COR (périmètres voisins mais pas identiques).
// Particularité de la COFOG : les pensions des fonctionnaires sont classées en « vieillesse », pas dans le
// service où ils ont travaillé. On les rend ici à leur service : pensions des anciens enseignants à
// l'éducation, pensions militaires à la défense (rapport annuel sur les pensions de la fonction publique, PLF 2026).
//
// Pour ajouter un poste : le déclarer dans `construirePostes` ou `detailReste` avec sa couleur (jeton CSS --poste-<id>), puis, si le
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
  // Détail de « tout le reste » (services généraux, ordre public hors justice, affaires économiques, etc.)
  servicesGeneraux: 181.1, // GF01
  interetsDette: 58.87, // GF0107
  rechercheFondamentale: 19.88, // GF0104
  rechercheAppliquee: 21.43, // GF0408 (R&D affaires économiques)
  ordrePublic: 52.11, // GF03 : police 28,9, pompiers 7,9, tribunaux, prisons, divers
  affairesEconomiques: 166.07, // GF04
  transports: 60.69, // GF0405
  environnement: 30.29, // GF05
  logementEquipements: 42.13, // GF06
  culture: 43.07, // GF08
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
      detail: "Famille, chômage, handicap, aides au logement, pauvreté",
      montant: cofog.protectionSociale - cofog.vieillesse - cofog.survivants,
      pensions: 0,
    },
    ...detailReste(),
  ];
}

// « Tout le reste » détaillé en neuf postes ; le dernier (administration) est calculé par différence pour que
// la somme des postes égale exactement le total des dépenses.
function detailReste() {
  const c = cofog;
  const postesReste = [
    { id: "dette", label: "Intérêts de la dette", detail: "Intérêts versés sur la dette publique", montant: c.interetsDette },
    { id: "transports", label: "Transports", detail: "Routes, rail, transports en commun", montant: c.transports },
    { id: "economie", label: "Économie et emploi", detail: "Aides aux entreprises et à l'emploi, énergie, agriculture, industrie", montant: c.affairesEconomiques - c.transports - c.rechercheAppliquee },
    { id: "recherche", label: "Recherche", detail: "Recherche fondamentale et appliquée", montant: c.rechercheFondamentale + c.rechercheAppliquee },
    { id: "securite", label: "Police et secours", detail: "Police, gendarmerie, pompiers", montant: c.ordrePublic - c.tribunaux - c.prisons },
    { id: "culture", label: "Culture et sport", detail: "Culture, sport, loisirs, médias publics, cultes", montant: c.culture },
    { id: "logement", label: "Logement et équipements", detail: "Logement, eau, éclairage public, aménagement", montant: c.logementEquipements },
    { id: "environnement", label: "Environnement", detail: "Déchets, eaux usées, pollution, biodiversité", montant: c.environnement },
  ];
  const connus = c.sante + c.education + c.defense + c.tribunaux + c.prisons + c.protectionSociale + postesReste.reduce((t, p) => t + p.montant, 0);
  postesReste.push({
    id: "administration",
    label: "Administration générale",
    detail: "Parlement, impôts et finances publiques, collectivités, aide au développement",
    montant: c.total - connus,
  });
  return postesReste.map((p) => ({ ...p, pensions: 0 }));
}

export const postes = construirePostes();

export const depenses = { annee: 2024, total: cofog.total, postes, ...EUROSTAT, jaune: JAUNE };
