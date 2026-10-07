// Onglet « Salaire ou services publics » de la page héritage : répartir les recettes de l'IGS.
// Toute la mécanique est dans composants/repartiteur.js ; ce module fournit les enveloppes annuelles.

import { creerRepartiteur } from "./composants/repartiteur.js";
import { milliards } from "../engine/format.js";
import { enregistrerMesure, marquerTouchee, usagesRepartition } from "./etat-bilan.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";

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

  // Pour la page Bilan : recettes annuelles moyennes de l'IGS et leur usage, au prorata de la répartition choisie.
  const moyenne = enveloppes[0].montant;
  let premiere = true;
  const enregistrer = (r) => {
    const reparti = Object.values(r).reduce((t, v) => t + v, 0);
    const k = reparti > 0 ? moyenne / reparti : 0;
    const echelle = Object.fromEntries(Object.entries(r).map(([cle, v]) => [cle, v * k]));
    const actifs = echelle.actifs ?? 0;
    const masseNette = (macro.masseSalarialeBrute.valeur / 1e9) * macro.ratioNetSurBrut.valeur;
    enregistrerMesure("igs", {
      espace: "heritage",
      label: `Impôt sur les grandes successions (${milliards(moyenne)} par an en moyenne)`,
      lien: "heritage-simuler.html",
      net: moyenne,
      usages: usagesRepartition(echelle, moyenne),
      ressources: ["igs"],
      reglages: [`Chiffrage : ${reforme.scenario?.label ?? "étude"}`, `${milliards(actifs)} par an aux actifs, ${milliards(Math.max(0, Object.values(echelle).reduce((t, v) => t + v, 0) - actifs))} aux services publics`],
      effet: { actifs: (actifs / masseNette) * niveauDeVie.composition.partActivite, retraites: 0 },
      details: {},
    });
    if (!premiere) marquerTouchee("igs");
    premiere = false;
  };

  creerRepartiteur(racine.querySelector("[data-repartiteur]"), {
    surChangement: enregistrer,
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
