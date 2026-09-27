// Page « Comprendre » des retraites : comment la santé est financée, qui la finance selon l'âge (estimation),
// puis qui l'utilise selon l'âge. Les deux graphiques par âge partagent la même échelle pour être comparés.

import { h } from "./dom.js";
import { euros, pourcent, milliards } from "../engine/format.js";
import { sante } from "../params/sante.js";
import { financementSanteParAge, concentration, quiPaieParAge } from "../engine/sante.js";
import { barresEmpilees } from "./graphiques/barres-empilees.js";
import { barresHorizontales } from "./graphiques/barres.js";
import { tableDonnees } from "./graphiques/colonnes.js";

const COULEURS = { actifs: "var(--serie-actifs)", retraites: "var(--serie-actuel)" };
const ECHELLE = 9500; // même maximum pour « qui finance » et « qui utilise »
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const pct1 = (v) => `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)}\u00a0%`;
// Les trois canaux de paiement, mêmes couleurs dans les deux graphiques « qui paie ».
const CANAUX = [
  { id: "secu", label: "Sécurité sociale (cotisations, CSG, impôts)", couleur: "var(--serie-actuel)" },
  { id: "complementaire", label: "Complémentaire santé", couleur: "var(--poste-recherche)" },
  { id: "patient", label: "Le patient lui-même", couleur: "var(--serie-tampon)" },
];

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
    figureQuiPaie(),
    figureEffort(),
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

/** Pour une personne soignée, qui paie ses soins selon son âge (euros ou part de la dépense). */
function figureQuiPaie() {
  const { usagers, resteFinal, primes } = sante;
  const lignes = quiPaieParAge(usagers.lignes, resteFinal.tranches);
  const zone = h("div");
  const phrase = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const table = h("div");
  const boutons = [
    h("button", { type: "button", "aria-pressed": "true", "data-unite": "euros" }, "En euros"),
    h("button", { type: "button", "aria-pressed": "false", "data-unite": "part" }, "En part de la dépense"),
  ];
  const dessiner = (unite) => {
    for (const b of boutons) b.setAttribute("aria-pressed", String(b.dataset.unite === unite));
    const enPart = unite === "part";
    barresEmpilees(zone, {
      segments: CANAUX,
      lignes: lignes.map((l) => ({
        label: l.age,
        totalEuros: l.total,
        valeurs: enPart
          ? { secu: l.secu / l.total, complementaire: l.complementaire / l.total, patient: l.patient / l.total }
          : { secu: l.secu, complementaire: l.complementaire, patient: l.patient },
      })),
      format: enPart ? (v) => pct0.format(v) : (v) => euros(v),
      formatTotal: (v, l) => euros(enPart ? l.totalEuros : v),
      max: enPart ? 1 : 9500,
      etiquetteMin: enPart ? 0.07 : 0.1,
    });
  };
  const vieux = lignes.at(-1);
  const jeune = lignes[0];
  phrase.textContent = `À 80 ans ou plus, sur ${euros(vieux.total)} de soins par an, la Sécurité sociale en paie ${pct0.format(vieux.secu / vieux.total)} et la personne environ ${euros(vieux.patient)}. Entre 21 et 30 ans : ${pct0.format(jeune.secu / jeune.total)} et ${euros(jeune.patient)}.`;
  tableDonnees(
    table,
    ["Âge", "Sécurité sociale", "Complémentaire (estimation)", "Patient (estimation)", "Total"],
    lignes.map((l) => [l.age, euros(l.secu), euros(l.complementaire), euros(l.patient), euros(l.total)]),
  );
  const bascule = h("div", { class: "bascule", role: "group", "aria-label": "Unité du graphique" }, boutons);
  bascule.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-unite]");
    if (b) dessiner(b.dataset.unite);
  });
  dessiner("euros");
  return h(
    "figure",
    { class: "graphique" },
    h(
      "figcaption",
      {},
      h("h3", { class: "titre-graphique" }, "Qui paie les soins\u00a0? La Sécurité sociale, d'autant plus qu'on avance en âge"),
      h("p", { class: "sous-titre" }, `Dépense de santé moyenne d'une personne soignée, par an, selon qui la règle (${usagers.annee}). Adultes de 21 ans ou plus.`),
      bascule,
    ),
    zone,
    phrase,
    h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), table),
    h(
      "p",
      { class: "note" },
      `À cela s'ajoutent les primes de complémentaire santé : pour un contrat individuel, ${euros(primes.a20ans)} par mois en moyenne à 20 ans et ${euros(primes.a85ans)} à 85 ans (2023). Les salariés paient moins, leur employeur finançant au moins la moitié de leur contrat collectif. `,
      h("a", { href: primes.url }, "Source"),
      ".",
    ),
    h(
      "p",
      { class: "note" },
      "Sources : ",
      h("a", { href: usagers.url }, usagers.source),
      " ; ",
      h("a", { href: resteFinal.url }, resteFinal.source),
      `. Estimation du site : le reste à charge final de ${resteFinal.annee} (par grandes tranches d'âge) partage le reste après Sécurité sociale entre complémentaire et patient.`,
    ),
  );
}

/** Taux d'effort en santé selon le niveau de vie : actifs en emploi et retraités côte à côte. */
function figureEffort() {
  const { effort } = sante;
  const zone = h("div");
  const table = h("div");
  const lignes = effort.niveaux.flatMap((n, i) =>
    [
      ["Actifs en emploi", effort.actifs],
      ["Retraités", effort.retraites],
    ].map(([label, g]) => ({ label, groupe: `${n.label} (${n.aide})`, valeurs: { secu: g.amo[i], complementaire: g.primes[i], patient: g.reste[i] } })),
  );
  barresEmpilees(zone, {
    segments: [
      { ...CANAUX[0], label: "Financement de la Sécurité sociale (cotisations maladie, CSG, taxes)" },
      { ...CANAUX[1], label: "Primes de complémentaire santé" },
      { ...CANAUX[2], label: "Restes à charge" },
    ],
    lignes,
    format: pct1,
    max: 19,
    etiquetteMin: 0.2,
  });
  tableDonnees(
    table,
    ["Niveau de vie", "Situation", "Sécurité sociale", "Primes", "Restes à charge", "Total"],
    effort.niveaux.flatMap((n, i) =>
      [
        ["Actifs en emploi", effort.actifs],
        ["Retraités", effort.retraites],
      ].map(([label, g]) => [n.label, label, pct1(g.amo[i]), pct1(g.primes[i]), pct1(g.reste[i]), pct1(g.total[i])]),
    ),
  );
  const a = effort.actifs.total;
  const r = effort.retraites.total;
  return h(
    "figure",
    { class: "graphique" },
    h(
      "figcaption",
      {},
      h("h3", { class: "titre-graphique" }, "Part du revenu consacrée à la santé\u00a0: elle monte avec le revenu des actifs, elle baisse avec celui des retraités"),
      h("p", { class: "sous-titre" }, `Tout compris : prélèvements qui financent la Sécurité sociale, primes de complémentaire et restes à charge, en % du revenu du ménage (${effort.annee}), selon la situation de sa personne la plus âgée.`),
    ),
    h(
      "dl",
      { class: "chiffres chiffres--sante" },
      h("div", { class: "chiffre" }, h("dt", {}, "Actifs très aisés"), h("dd", {}, pct1(a.at(-1)), h("span", { class: "sous" }, `contre ${pct1(a[0])} pour les très modestes`))),
      h("div", { class: "chiffre" }, h("dt", {}, "Retraités très aisés"), h("dd", {}, pct1(r.at(-1)), h("span", { class: "sous" }, `contre ${pct1(r[0])} pour les très modestes`))),
    ),
    zone,
    h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), table),
    h(
      "p",
      { class: "note" },
      "Les actifs financent l'Assurance maladie par leurs cotisations et une CSG à 9,2 % ; les retraités, surtout par leurs primes de complémentaire et leurs restes à charge, qui pèsent davantage sur les plus modestes. Source : ",
      h("a", { href: effort.url }, effort.source),
      ".",
    ),
  );
}
