// Onglet « Salaire ou services publics » de la page héritage : répartir les recettes de l'IGS.
// Toute la mécanique est dans composants/repartiteur.js ; ce module fournit les enveloppes annuelles.

import { creerRepartiteur } from "./composants/repartiteur.js";
import { milliards } from "../engine/format.js";

const MOYENNE = "moyenne";

export function monter(racine, { reforme }) {
  const { recettes } = reforme;
  const totalAnnee = (i) => recettes.series.reduce((t, s) => t + s.valeurs[i], 0);
  const enveloppes = [
    {
      valeur: MOYENNE,
      libelle: `Moyenne ${recettes.annees[0]}-${recettes.annees.at(-1)}`,
      montant: recettes.annees.reduce((t, _, i) => t + totalAnnee(i), 0) / recettes.annees.length,
    },
    ...recettes.annees.map((a, i) => ({ valeur: String(a), libelle: String(a), montant: totalAnnee(i) })),
  ];

  creerRepartiteur(racine.querySelector("[data-repartiteur]"), {
    prefixe: "r",
    zoneDepenses: document.querySelector("[data-depenses]"),
    titreDepenses: "Aujourd'hui, puis avec vos choix",
    cleLien: "repartition",
    enveloppes,
    etiquetteEnveloppe: "Recettes de l'année",
    phrase: (enveloppe, choix) =>
      `${choix === MOYENNE ? "En moyenne chaque année" : `En ${choix}`}, l'impôt rapporterait ${milliards(enveloppe)}.`,
    noteActifs: "Variante du simulateur : l'étude ne propose pas de reverser les recettes aux actifs.",
  });
}
