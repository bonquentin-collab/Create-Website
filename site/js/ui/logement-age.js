// Onglet « Logement et patrimoine » : les besoins que le niveau de vie standard ne voit pas.
// Les retraités sont le plus souvent propriétaires sans crédit ; les jeunes louent ou remboursent.

import { h } from "./dom.js";
import { pourcent } from "../engine/format.js";
import { logement } from "../params/logement.js";
import { pente } from "./graphiques/pente.js";
import { barresHorizontales } from "./graphiques/barres.js";
import { tableDonnees } from "./graphiques/colonnes.js";

const COULEURS = { actifs: "var(--serie-actifs)", retraites: "var(--serie-actuel)" };
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

export function construireLogement(racine) {
  const { loyersImputes: li, proprietaires, endettement, epargne } = logement;
  const zonePente = h("div", { class: "graphique__zone graphique__zone--pente" });
  const zoneProprio = h("div");
  const zoneDette = h("div");
  const tableProprio = h("div");

  racine.replaceChildren(
    h(
      "p",
      { class: "texte" },
      "Le niveau de vie mesure un revenu, pas des besoins. Or un retraité est le plus souvent propriétaire de son logement, sans crédit à rembourser ; un jeune actif paie un loyer ou rembourse un emprunt, et doit encore se constituer un patrimoine. Une fois le logement pris en compte, l'avance des actifs disparaît presque.",
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Avec le logement, les retraités rattrapent les actifs"),
        h("p", { class: "sous-titre" }, "Niveau de vie moyen en % de celui de l'ensemble de la population, sans puis avec les loyers imputés (le loyer que le propriétaire n'a pas à payer, compté comme un revenu)."),
      ),
      zonePente,
      h("p", { class: "note" }, "Source : ", h("a", { href: li.url }, li.source), "."),
    ),
    h(
      "div",
      { class: "chiffres chiffres--duo" },
      tuile("Propriétaires de leur logement", `${pct0.format(proprietaires.lignes[0].v2021)} des moins de 30 ans`, `${pct0.format(proprietaires.lignes.at(-1).v2021)} des 65 ans ou plus`),
      tuile("Dette dans le patrimoine des propriétaires", `${pct0.format(endettement.lignes[0].valeur)} avant 30 ans`, `${pct0.format(endettement.lignes.at(-1).valeur)} après 65 ans`),
      tuile("Part du revenu épargnée", `moins de ${pct0.format(epargne.moins40)} avant 40 ans`, `${pourcent(epargne.plus70)} à 70 ans ou plus`),
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Devenir propriétaire : de plus en plus tard"),
        h("p", { class: "sous-titre" }, "Part des ménages propriétaires de leur résidence principale selon l'âge, début 2021. Le point noir marque 1998."),
      ),
      zoneProprio,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableProprio),
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Les jeunes propriétaires doivent encore la moitié de leur bien"),
        h("p", { class: "sous-titre" }, `Part de l'endettement dans le patrimoine brut des ménages propriétaires, début 2021. Les 65 ans ou plus ne représentent que ${pourcent(endettement.partAccedants65)} des propriétaires qui remboursent encore un emprunt.`),
      ),
      zoneDette,
      h("p", { class: "note" }, "Sources : ", h("a", { href: proprietaires.url }, "Insee, Les revenus et le patrimoine des ménages, 2024"), " ; ", h("a", { href: epargne.url }, epargne.source), "."),
    ),
  );

  pente(zonePente, {
    colonnes: ["Sans loyers imputés", "Avec loyers imputés"],
    series: [
      { label: "Actifs", couleur: COULEURS.actifs, valeurs: [li.sans.actifs, li.avec.actifs] },
      { label: "Retraités", couleur: COULEURS.retraites, valeurs: [li.sans.retraites, li.avec.retraites] },
    ],
    format: (v) => pourcent(v),
    label: `Niveau de vie des actifs : ${pourcent(li.sans.actifs)} sans loyers imputés, ${pourcent(li.avec.actifs)} avec. Retraités : ${pourcent(li.sans.retraites)} puis ${pourcent(li.avec.retraites)}.`,
  });

  barresHorizontales(zoneProprio, {
    lignes: proprietaires.lignes.map((l) => ({ label: l.age, valeur: l.v2021, avant: l.v1998, couleur: COULEURS[l.statut] })),
    formatValeur: (v) => pourcent(v),
    max: 1,
    libelleAvant: "1998",
  });
  tableDonnees(tableProprio, ["Âge", "1998", "2010", "2021"], [
    ["Moins de 30 ans", "11,2 %", "12,8 %", "16,7 %"],
    ["30-39 ans", "42 %", "47,2 %", "47,3 %"],
    ["40-49 ans", "61,1 %", "58,5 %", "57,8 %"],
    ["50-64 ans", "71,6 %", "69,1 %", "62,6 %"],
    ["65 ans ou plus", "69,2 %", "71,7 %", "70,2 %"],
  ]);

  barresHorizontales(zoneDette, {
    lignes: endettement.lignes.map((l) => ({ label: l.age, valeur: l.valeur, couleur: COULEURS[l.statut] })),
    formatValeur: (v) => pourcent(v),
    max: 0.6,
  });
}

function tuile(titre, jeunes, anciens) {
  return h(
    "div",
    { class: "chiffre chiffre--duo" },
    h("p", { class: "chiffre__titre" }, titre),
    h("p", { class: "chiffre__ligne chiffre__ligne--actifs" }, jeunes),
    h("p", { class: "chiffre__ligne chiffre__ligne--retraites" }, anciens),
  );
}
