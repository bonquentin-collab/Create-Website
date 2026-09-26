// Point d'entrée. Chaque élément portant data-module="nom" reçoit le module d'interface du même nom.
// Pour ajouter une fonctionnalité : créer js/ui/<nom>.js exportant monter(element, contexte),
// l'inscrire ci-dessous, puis poser data-module="<nom>" sur sa section dans la page HTML voulue.

import { reference, reformes } from "./reforms/index.js";
import { monter as theme } from "./ui/theme.js";
import { monter as ruban } from "./ui/ruban.js";
import { monter as reforme, monterRappel as rappelReforme } from "./ui/reforme.js";
import { monter as entete } from "./ui/entete.js";
import { monter as depensesAujourdhui } from "./ui/depenses-aujourdhui.js";
import { monter as simulateurHeritage } from "./ui/simulateur-heritage.js";
import { monter as simulateurSalaire } from "./ui/simulateur-salaire.js";
import { monter as repartition } from "./ui/repartition.js";
import { monter as onglets } from "./ui/onglets.js";
import { monter as rubanRetraites } from "./ui/ruban-retraites.js";
import { monter as tvaSociale } from "./ui/tva-sociale.js";
import { monter as csgRetraites } from "./ui/csg-retraites.js";
import { monter as financementRetraites } from "./ui/financement-retraites.js";
import { monter as methodeRetraites } from "./ui/methode-retraites.js";
import { monter as contexteRetraites } from "./ui/contexte-retraites.js";
import { monter as gelPensions } from "./ui/gel-pensions.js";
import { monter as santeAge } from "./ui/sante-age.js";
import { monter as niveauxDeVie } from "./ui/niveaux-de-vie.js";

const modules = {
  entete,
  theme,
  "rappel-reforme": rappelReforme,
  "depenses-aujourdhui": depensesAujourdhui,
  ruban,
  reforme,
  "simulateur-heritage": simulateurHeritage,
  "simulateur-salaire": simulateurSalaire,
  repartition,
  onglets,
  "ruban-retraites": rubanRetraites,
  "tva-sociale": tvaSociale,
  "csg-retraites": csgRetraites,
  "financement-retraites": financementRetraites,
  "methode-retraites": methodeRetraites,
  "contexte-retraites": contexteRetraites,
  "gel-pensions": gelPensions,
  "sante-age": santeAge,
  "niveaux-de-vie": niveauxDeVie,
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
