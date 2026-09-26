// Section « Le contexte en chiffres » de la page retraites : quatre fiches courtes, chacune avec un titre qui dit
// ce qu'il faut retenir, un petit graphique en barres et sa source.

import { h } from "./dom.js";
import { pourcent } from "../engine/format.js";
import { contexte } from "../params/contexte-retraites.js";
import { postes, pensionsFonctionnaires } from "../params/depenses.js";
import { barresHorizontales } from "./graphiques/barres.js";

const COULEURS = { actifs: "var(--serie-actifs)", retraites: "var(--serie-actuel)", neutre: "var(--serie-neutre)" };
const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

export function monter(racine) {
  const { cotisants, pauvrete, remplacement } = contexte;
  const par = Object.fromEntries(postes.map((p) => [p.id, p]));

  const fiche = (titre, texte, remplirZone, source) => {
    const zone = h("div");
    const el = h("article", { class: "fiche" }, h("h3", { class: "fiche__titre" }, titre), h("p", { class: "fiche__texte" }, texte), zone, h("p", { class: "note" }, ...source));
    remplirZone(zone);
    return el;
  };
  const lien = (b) => [h("a", { href: b.url }, b.source), b.detail ? `, ${b.detail}` : "", "."];

  racine.replaceChildren(
    h("h2", { class: "titre-section", id: "titre-contexte" }, "Le contexte en chiffres"),
    h(
      "p",
      { class: "texte" },
      "Le système par répartition a été bâti quand beaucoup de retraités étaient pauvres. Ce n'est plus le cas, alors que les actifs, moins nombreux, en portent le coût et peuvent attendre des pensions moins généreuses.",
    ),
    h(
      "div",
      { class: "fiches" },
      fiche(
        "De moins en moins de cotisants par retraité",
        "Nombre de cotisants pour un retraité, tous régimes.",
        (z) => barresHorizontales(z, { lignes: cotisants.lignes.map((l) => ({ ...l, couleur: COULEURS.neutre })), formatValeur: (v) => virgule.format(v), max: 2.3 }),
        lien(cotisants),
      ),
      fiche(
        "Les enfants deux fois plus pauvres que les retraités",
        "Part des personnes sous le seuil de pauvreté (60 % du niveau de vie médian), en 2024.",
        (z) => barresHorizontales(z, { lignes: pauvrete.lignes.map((l) => ({ label: l.label, valeur: l.valeur, couleur: COULEURS[l.statut] })), formatValeur: (v) => pourcent(v), max: 0.25 }),
        lien(pauvrete),
      ),
      fiche(
        "Les jeunes générations toucheront une pension moins généreuse",
        `Pension nette à la retraite, en % des derniers salaires nets, pour un salarié non-cadre du privé. En moyenne, la pension passerait de ${pourcent(remplacement.pensionRelative.en2025)} du revenu d'activité en 2025 à ${pourcent(remplacement.pensionRelative.en2070)} en 2070.`,
        (z) => barresHorizontales(z, { lignes: remplacement.lignes.map((l) => ({ ...l, couleur: COULEURS.actifs })), formatValeur: (v) => pourcent(v), max: 0.8 }),
        lien(remplacement),
      ),
      fiche(
        "Une partie de l'éducation et de la défense paie des pensions",
        "Part des pensions d'anciens fonctionnaires dans la dépense publique totale de chaque domaine, en 2024.",
        (z) =>
          barresHorizontales(z, {
            lignes: [
              { label: "Éducation", valeur: par.education.pensions / par.education.montant, couleur: "var(--poste-education)" },
              { label: "Défense", valeur: par.defense.pensions / par.defense.montant, couleur: "var(--poste-defense)" },
            ],
            formatValeur: (v) => pct0.format(v),
            max: 0.25,
          }),
        [
          "Calcul du site : pensions des anciens enseignants (estimation) et pensions militaires, ",
          h("a", { href: pensionsFonctionnaires.url }, "rapport sur les pensions, PLF 2026"),
          ", rapportées aux dépenses d'éducation et de défense de toutes les administrations (Eurostat). Voir ",
          h("a", { href: "#haut" }, "où va l'argent public"),
          ".",
        ],
      ),
    ),
  );
}
