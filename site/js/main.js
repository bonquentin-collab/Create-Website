// Point d'entrée. Chaque élément portant data-module="nom" reçoit le module d'interface du même nom.
// Pour ajouter une fonctionnalité : créer js/ui/<nom>.js exportant monter(element, contexte),
// l'inscrire ci-dessous, puis poser data-module="<nom>" sur sa section dans index.html.

import { reference, reformes } from "./reforms/index.js";
import { monter as theme } from "./ui/theme.js";
import { monter as ruban } from "./ui/ruban.js";
import { monter as reforme } from "./ui/reforme.js";
import { monter as simulateurHeritage } from "./ui/simulateur-heritage.js";
import { monter as repartition } from "./ui/repartition.js";

const modules = {
  theme,
  ruban,
  reforme,
  "simulateur-heritage": simulateurHeritage,
  repartition,
};

const contexte = {
  reference,
  reforme: reformes[0],
};

for (const el of document.querySelectorAll("[data-module]")) {
  const monter = modules[el.dataset.module];
  if (!monter) {
    console.warn(`Module inconnu : ${el.dataset.module}`);
    continue;
  }
  try {
    monter(el, contexte);
  } catch (erreur) {
    console.error(`Échec du module ${el.dataset.module}`, erreur);
  }
}

for (const lien of document.querySelectorAll("[data-lien-etude]")) lien.href = contexte.reforme.source.url;
