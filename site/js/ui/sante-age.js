// Page « Comprendre » des retraites : comment la santé est financée, qui la finance selon l'âge (estimation),
// puis qui l'utilise selon l'âge. Les deux graphiques par âge partagent la même échelle pour être comparés.

import { h } from "./dom.js";
import { euros, pourcent, milliards } from "../engine/format.js";
import { sante } from "../params/sante.js";
import { financementSanteParAge, concentration } from "../engine/sante.js";
import { barresHorizontales } from "./graphiques/barres.js";
import { tableDonnees } from "./graphiques/colonnes.js";

const COULEURS = { actifs: "var(--serie-actifs)", retraites: "var(--serie-actuel)" };
const ECHELLE = 9500; // même maximum pour « qui finance » et « qui utilise »
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

export function monter(racine) {
  const { financeurs, usagers, financementParAge: fpa } = sante;
  const verse = financementSanteParAge(fpa);
  const ageDebut = (label) => parseInt(label, 10);
  const c = concentration(usagers.lignes, (l) => l.retraite);

  const zoneFinanceurs = h("div");
  const zoneFinance = h("div");
  const zoneUsage = h("div");
  const tableFinance = h("div");
  const tableUsage = h("div");
  const legendeAges = () =>
    h(
      "div",
      { class: "legende" },
      h("span", {}, h("i", { class: "pastille", style: { background: COULEURS.actifs } }), "Âges d'activité"),
      h("span", {}, h("i", { class: "pastille", style: { background: COULEURS.retraites } }), "Âges de la retraite"),
    );

  racine.replaceChildren(
    h("h2", { class: "titre-section", id: "titre-sante" }, "La santé : financée par les actifs, utilisée surtout par les plus âgés"),
    h(
      "p",
      { class: "texte" },
      `La santé est le deuxième poste de dépense publique après les retraites. En ${financeurs.annee}, les soins et biens médicaux ont coûté ${milliards(financeurs.total)}. Comme pour les retraites, ce sont surtout les actifs qui paient et les plus âgés qui en bénéficient : c'est le principe de la solidarité, mais il pèse de plus en plus avec le vieillissement.`,
    ),
    h(
      "figure",
      { class: "graphique" },
      h("figcaption", {}, h("h3", { class: "titre-graphique" }, "Sur 100 € de soins, la Sécurité sociale en paie 79"), h("p", { class: "sous-titre" }, `Financement de la consommation de soins et de biens médicaux, ${financeurs.annee}.`)),
      zoneFinanceurs,
      h("p", { class: "note" }, "Source : ", h("a", { href: financeurs.url }, financeurs.source), ". La Sécurité sociale est elle-même financée par les cotisations, la CSG et d'autres impôts."),
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Qui finance ? Surtout les ménages de 30 à 59 ans"),
        h("p", { class: "sous-titre" }, `Part des impôts et cotisations d'un ménage qui finance la santé publique, selon l'âge de la personne de référence, en euros par an et par unité de consommation (${fpa.annee}). Estimation du site.`),
      ),
      legendeAges(),
      zoneFinance,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableFinance),
      h(
        "p",
        { class: "note" },
        "Estimation : prélèvements payés à chaque âge (",
        h("a", { href: fpa.url }, fpa.source),
        `), dont ${pourcent(fpa.partSante)} financent la santé publique, soit la part de la santé dans l'ensemble des prélèvements en ${fpa.annee} (Eurostat). L'unité de consommation compte 1 pour le premier adulte du ménage, 0,5 pour les autres personnes de 14 ans ou plus, 0,3 pour les enfants.`,
      ),
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, `Qui utilise ? Six fois plus de soins après 80 ans qu'à 25 ans`),
        h("p", { class: "sous-titre" }, `Dépense de santé moyenne par personne soignée, en euros par an (${usagers.annee}) ; le tableau détaille la part remboursée par l'Assurance maladie. Même échelle que le graphique précédent.`),
      ),
      legendeAges(),
      zoneUsage,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableUsage),
      h(
        "dl",
        { class: "chiffres chiffres--sante" },
        h("div", { class: "chiffre" }, h("dt", {}, "Personnes de 61 ans ou plus"), h("dd", {}, pct0.format(c.partPersonnes), h("span", { class: "sous" }, "des personnes soignées"))),
        h("div", { class: "chiffre" }, h("dt", {}, "Leur part des dépenses"), h("dd", {}, pct0.format(c.partDepense), h("span", { class: "sous" }, `sur ${milliards(c.totalDepense / 1e9)} de dépenses`))),
      ),
      h("p", { class: "note" }, "Source : ", h("a", { href: usagers.url }, usagers.source), ". Champ : personnes ayant eu au moins un remboursement de l'Assurance maladie dans l'année."),
    ),
  );

  const f = financeurs.lignes;
  barresHorizontales(zoneFinanceurs, {
    lignes: f.map((l, i) => ({ label: l.label, valeur: l.valeur / financeurs.total, couleur: ["var(--serie-actuel)", "var(--serie-actifs)", "var(--serie-tampon)", "var(--serie-neutre)"][i] })),
    formatValeur: (v) => `${Math.round(v * 100)} €`,
    max: 1,
  });

  const lignesFinance = fpa.ages.map((age, i) => ({ label: age, valeur: verse[i], couleur: ageDebut(age) >= fpa.ageRetraite ? COULEURS.retraites : COULEURS.actifs }));
  barresHorizontales(zoneFinance, { lignes: lignesFinance, formatValeur: (v) => euros(v), max: ECHELLE });
  tableDonnees(tableFinance, ["Âge de la personne de référence", "Versé pour la santé (€ par UC et par an)"], lignesFinance.map((l) => [l.label, euros(l.valeur)]));

  const lignesUsage = usagers.lignes.map((l) => ({ label: l.age, valeur: l.depense, couleur: l.retraite ? COULEURS.retraites : COULEURS.actifs }));
  barresHorizontales(zoneUsage, { lignes: lignesUsage, formatValeur: (v) => euros(v), max: ECHELLE });
  tableDonnees(
    tableUsage,
    ["Âge", "Dépense moyenne (€ par an)", "Dont Assurance maladie", "Personnes soignées"],
    usagers.lignes.map((l) => [l.age, euros(l.depense), euros(l.amo), new Intl.NumberFormat("fr-FR").format(l.personnes)]),
  );
}
