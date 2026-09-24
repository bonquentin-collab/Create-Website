// Façons de verser aux actifs la part des recettes qui leur est attribuée.
// Ce ne sont pas des propositions de la Fondation Jean-Jaurès : ce sont des variantes du simulateur.
//
// Chaque mode expose calculer({ recettes, part, profil, macro }) et renvoie
// { annuel, mensuel } en euros pour la personne décrite par `profil`.
// `recettes` est en euros ; `part` (0 à 1, 1 par défaut) est la fraction versée aux actifs.
// Pour ajouter un mode : l'ajouter à ce tableau, l'interface le liste automatiquement.

const parMois = (annuel) => ({ annuel, mensuel: annuel / 12 });

export const scenarios = [
  {
    id: "dividende",
    label: "Le même montant pour chaque actif",
    description:
      "La somme est divisée à parts égales entre les 30,4 millions de personnes en emploi, salariées ou indépendantes.",
    calculer: ({ recettes, part = 1, macro }) => parMois((recettes * part) / macro.personnesEnEmploi.valeur),
  },
  {
    id: "cotisations",
    label: "Une baisse des cotisations, proportionnelle au salaire",
    description:
      "La somme finance une baisse uniforme du taux de cotisation salariale. Le gain suit le salaire : les salaires élevés gagnent plus en euros.",
    calculer: ({ recettes, part = 1, profil, macro }) => {
      const brutAnnuel = (profil.salaireNetMensuel * 12) / macro.ratioNetSurBrut.valeur;
      return parMois((recettes * part * brutAnnuel) / macro.masseSalarialeBrute.valeur);
    },
  },
];

export function trouverScenario(id) {
  return scenarios.find((s) => s.id === id) ?? scenarios[0];
}
