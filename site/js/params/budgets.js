// Destinations possibles des recettes, avec le budget public actuel de chacune.
// Services de l'État : crédits de paiement du budget général, PLF 2025, par mission (dépenses de personnel
// comprises), données ouvertes « PLF 2025 - Dépenses 2025 selon destination » (data.economie.gouv.fr).
// Hôpital : sous-objectif « établissements de santé » de l'Ondam 2025, PLFSS 2025.
//
// Pour ajouter une destination : ajouter un objet à ce tableau. L'interface la liste automatiquement.
// `poste` : le poste de dépense publique qu'elle abonde dans le camembert (params/depenses.js).

const SOURCE_PLF = {
  source: "PLF 2025, crédits de paiement du budget général par mission",
  url: "https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/",
};

export const destinations = [
  {
    id: "actifs",
    label: "Le salaire net des actifs",
    resume: "Versé directement aux personnes en emploi",
    type: "actifs",
  },
  {
    id: "ecole",
    poste: "education",
    label: "L'école",
    resume: "Mission « Enseignement scolaire »",
    type: "service",
    budget: 88.82,
    ...SOURCE_PLF,
  },
  {
    id: "hopital",
    poste: "sante",
    label: "L'hôpital",
    resume: "Ondam « établissements de santé »",
    type: "service",
    budget: 108.8,
    source: "PLFSS 2025, sous-objectif « établissements de santé » de l'Ondam (263,9 Md€ au total)",
    url: "https://www.banquedesterritoires.fr/plfss-2025-le-budget-de-la-securite-sociale-sur-une-ligne-de-crete",
  },
  {
    id: "recherche",
    poste: "education",
    label: "La recherche et l'université",
    resume: "Mission « Recherche et enseignement supérieur »",
    type: "service",
    budget: 31.29,
    ...SOURCE_PLF,
  },
  {
    id: "ecologie",
    poste: "autres",
    label: "La transition écologique",
    resume: "Mission « Écologie, développement et mobilité durables »",
    type: "service",
    budget: 20.5,
    ...SOURCE_PLF,
  },
  {
    id: "logement",
    poste: "autres",
    label: "Le logement et les territoires",
    resume: "Mission « Cohésion des territoires »",
    type: "service",
    budget: 23.78,
    ...SOURCE_PLF,
  },
  {
    id: "justice",
    poste: "justice",
    label: "La justice",
    resume: "Mission « Justice »",
    type: "service",
    budget: 12.46,
    ...SOURCE_PLF,
  },
];

export function trouverDestination(id) {
  return destinations.find((d) => d.id === id);
}
