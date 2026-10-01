// Retraites › Méthode : les neuf scénarios de l'IPP (note n° 129) et la façon dont le simulateur s'y cale.

import { h } from "./dom.js";
import { euros, milliards } from "../engine/format.js";
import { tableDonnees } from "./graphiques/colonnes.js";
import { ipp129 } from "../params/ipp-retraites.js";
import { gel } from "../params/gel-pensions.js";
import { csg } from "../params/prelevements.js";

const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const pct2 = new Intl.NumberFormat("fr-FR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GROUPES = { principales: "Mesures débattues", seuils: "Gel selon le seuil de pension", egal: "À rendement égal" };

export function monter(racine) {
  const table = h("div");
  tableDonnees(
    table,
    ["Scénario", "Gain net (Md€)", "Retraités désindexés", "Retraités perdants", "Perte moyenne (€/mois)", "Niveau de vie moyen", "Perte des perdants (€/mois)", "Retraite des perdants (€/mois)"],
    ipp129.scenarios.map((s) => [
      `${GROUPES[s.groupe]} : ${s.label}`,
      milliards(s.rendement),
      s.concernes == null ? "–" : pct0.format(s.concernes),
      pct0.format(s.perdants),
      euros(-s.perte),
      pct2.format(s.variation),
      euros(-s.pertePerdants),
      euros(s.retraitePerdants),
    ]),
  );
  const p = gel.profilBase;
  racine.replaceChildren(
    h("h2", { class: "titre-section", id: "ipp" }, "Le calage sur l'Institut des politiques publiques"),
    h(
      "div",
      { class: "texte" },
      h(
        "p",
        {},
        "L'IPP a chiffré en septembre 2026 les trois façons de « mettre à contribution » les retraités, avec son modèle de microsimulation TAXIPP (année 2027, effets sur l'impôt, la CSG et les prestations compris, sans réaction des comportements). ",
        h("a", { href: ipp129.url }, ipp129.source),
        ".",
      ),
      h(
        "p",
        {},
        `Gel des pensions : la distribution des pensions de la Drees (2020) est portée à 2027 par un facteur de ${String(gel.facteur).replace(".", ",")}, qui redonne la médiane de l'IPP (1 639 €) et 35 % des retraités au-dessus de 2 000 €. Seule la pension de base est gelée ; sa part baisse quand la pension monte : ${pct0.format(p.base)} jusqu'à ${euros(p.jusqua)}, puis linéairement jusqu'à ${pct0.format(p.haut)} à partir de ${euros(p.apartirDe)}. Ce profil, estimé par le site, redonne à 2 % près les quatre chiffrages de l'IPP (gel au-delà de 0 €, de la médiane, de 2 000 € et de 3 000 €). Le gain net pour les finances publiques est ${pct0.format(gel.ipp.effetNet)} de l'économie des régimes (5,2 Md€ pour 6,6 Md€).`,
      ),
      h(
        "p",
        {},
        `CSG : les assiettes des pensions au taux normal (${milliards(csg.retraites.assiettes.normal)}) et médian (${milliards(csg.retraites.assiettes.median)}) redonnent les deux chiffrages de l'IPP (1,5 et 4,2 Md€ nets). L'impôt sur le revenu reprend environ ${pct0.format(1 - csg.retraites.effetNet)} de la hausse, qui porte sur la part déductible de la CSG.`,
      ),
      h(
        "p",
        {},
        `Abattement de 10 % : la recette est interpolée entre les points chiffrés par l'IPP (suppression : ${milliards(ipp129.abattement.points[0].recettes)}, dont ${milliards(ipp129.abattement.aidesLogement)} de moindres aides au logement ; plafond à ${euros(ipp129.abattement.points[1].plafond)} : ${milliards(ipp129.abattement.points[1].recettes)}). La hausse d'impôt d'un foyer est approchée par l'abattement perdu multiplié par son taux marginal.`,
      ),
      h(
        "p",
        {},
        "Dans tous les onglets, c'est le gain net qui est reversé aux actifs. Ce que perd un retraité est calculé avant effet sur l'impôt et les prestations.",
      ),
      h(
        "p",
        {},
        "À retenir : la CSG et l'abattement ne changent rien au solde du système de retraite, sauf à leur affecter la recette ; seul le gel agit sur ses dépenses. Un gel ne rapporte qu'en s'érodant, au fil des décès, alors qu'une hausse de CSG ou la fin de l'abattement rapportent chaque année, mais une seule fois.",
      ),
    ),
    h("details", { class: "table-donnees", open: true }, h("summary", {}, "Les neuf scénarios de l'IPP (tableau 1 de la note)"), table),
    h(
      "p",
      { class: "note" },
      "Perdants : retraités dont le ménage perd plus de 1 € par an. Perte moyenne : sur l'ensemble des retraités. Retraite des perdants : pension brute totale moyenne avant réforme. Les trois derniers scénarios sont calibrés pour rapporter autant que l'alignement du seul taux normal de CSG.",
    ),
  );
}
