// Scénarios de redistribution des recettes vers les actifs.
// Aucun de ces scénarios, hormis « etude », n'est proposé par la Fondation Jean-Jaurès :
// ce sont des variantes du simulateur, affichées comme telles.
//
// Chaque scénario expose calculer({ recettes, part, profil, macro }) et renvoie
// { annuel, mensuel } en euros pour la personne décrite par `profil`.
// Pour ajouter un scénario : l'ajouter à ce tableau, l'interface le liste automatiquement.

const parMois = (annuel) => ({ annuel, mensuel: annuel / 12 });

export const scenarios = [
  {
    id: "etude",
    label: "Affectation de l'étude",
    resume: "Transition écologique, recherche, éducation",
    description:
      "Les recettes financent des investissements publics. Le gain n'arrive pas sur la fiche de paie : il passe par les services publics et l'avenir collectif.",
    extension: false,
    calculer: () => parMois(0),
  },
  {
    id: "dividende",
    label: "Un montant égal pour chaque actif",
    resume: "Même somme pour chaque personne en emploi",
    description:
      "La part choisie des recettes est divisée à parts égales entre les 30,4 millions de personnes en emploi, salariées ou indépendantes.",
    extension: true,
    calculer: ({ recettes, part, macro }) => parMois((recettes * part) / macro.personnesEnEmploi.valeur),
  },
  {
    id: "cotisations",
    label: "Une baisse des cotisations salariales",
    resume: "Proportionnelle au salaire brut",
    description:
      "La part choisie des recettes finance une baisse uniforme du taux de cotisation salariale. Le gain est proportionnel au salaire : les salaires élevés gagnent plus en euros.",
    extension: true,
    calculer: ({ recettes, part, profil, macro }) => {
      const brutAnnuel = (profil.salaireNetMensuel * 12) / macro.ratioNetSurBrut.valeur;
      return parMois((recettes * part * brutAnnuel) / macro.masseSalarialeBrute.valeur);
    },
  },
];

export function trouverScenario(id) {
  return scenarios.find((s) => s.id === id) ?? scenarios[0];
}
