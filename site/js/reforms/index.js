// Registre des réformes. Pour en ajouter une : créer un fichier dans ce dossier sur le modèle
// d'igs-jean-jaures.js, puis l'ajouter ici avec sa fonction de calcul individuel.

import { droitActuel } from "../params/droit-actuel.js";
import { impotDroitActuel, impotBaremeVie } from "../engine/succession.js";
import { igsJeanJaures } from "./igs-jean-jaures.js";

export const reference = {
  ...droitActuel,
  calculer: (situation) => impotDroitActuel(situation, droitActuel),
};

export const reformes = [
  {
    ...igsJeanJaures,
    calculer: (situation) => impotBaremeVie(situation, igsJeanJaures),
  },
];

export function trouverReforme(id) {
  return reformes.find((r) => r.id === id) ?? reformes[0];
}
