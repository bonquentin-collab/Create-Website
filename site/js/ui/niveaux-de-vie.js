// Section « Retraités et actifs : qui vit le mieux ? », dans l'esprit du graphique du Financial Times
// (John Burn-Murdoch, 2025) : niveaux de vie médians des retraités et des personnes en emploi depuis 1996,
// par âge, et où ils arriveraient avec les réformes réglées dans les onglets de la page.

import { h, remplir } from "./dom.js";
import { euros, pourcent, nombre } from "../engine/format.js";
import { cumuler } from "../engine/niveau-de-vie.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { lireReformes, surMaj } from "./etat-reformes.js";
import { lignesTemporelles } from "./graphiques/lignes.js";
import { barresHorizontales } from "./graphiques/barres.js";
import { tableDonnees } from "./graphiques/colonnes.js";
import { construireLogement } from "./logement-age.js";
import { monter as monterOnglets } from "./onglets.js";

const COULEURS = { emploi: "var(--serie-actifs)", retraites: "var(--serie-actuel)", ensemble: "var(--serie-neutre)" };
const parMois = (v) => v / 12;
const signe = (v) => `${v >= 0 ? "+" : "−"}${pourcent(Math.abs(v))}`;

export function monter(racine) {
  // « comprendre » : logement + historique, sans réformes ; « simuler » : effet des réformes réglées sur la page.
  const avecReformes = racine.dataset.mode !== "comprendre";
  const { annees, series } = niveauDeVie;
  const derniere = annees.length - 1;
  const cochees = new Set();
  const vues = new Set();

  const listeReformes = h("div", { class: "reformes-choix" });
  const chiffres = h("dl", { class: "chiffres chiffres--nv", "aria-live": "polite" });
  const zoneLignes = h("div", { class: "graphique__zone" });
  const zoneBarres = h("div", {});
  const tableLignes = h("div");
  const noteAge = h("p", { class: "note" });

  const seriesMensuelles = [
    { id: "emploi", label: "Personnes en emploi", couleur: COULEURS.emploi, valeurs: series.emploi.map(parMois) },
    { id: "retraites", label: "Retraités", couleur: COULEURS.retraites, valeurs: series.retraites.map(parMois) },
    { id: "ensemble", label: "Ensemble", couleur: COULEURS.ensemble, valeurs: series.ensemble.map(parMois), discret: true },
  ];

  const panneauLogement = h("div", { class: "onglets__panneau", role: "tabpanel", id: "panneau-nv-logement", "aria-labelledby": "onglet-nv-logement", tabindex: 0 });
  const panneauReformes = h(
    "div",
    avecReformes ? {} : { class: "onglets__panneau", role: "tabpanel", id: "panneau-nv-reformes", "aria-labelledby": "onglet-nv-reformes", tabindex: 0, hidden: true },
    avecReformes ? h("fieldset", { class: "champ reformes" }, h("legend", {}, "Appliquer les réformes réglées plus haut"), listeReformes) : null,
    chiffres,
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Niveau de vie médian, en euros de 2024 par mois"),
        h("p", { class: "sous-titre" }, "Par personne, après impôts et prestations, 1996-2024. Les petits traits sous l'axe marquent les changements de méthode de l'enquête (2010, 2012, 2020)."),
      ),
      h(
        "div",
        { class: "legende" },
        seriesMensuelles.map((se) => h("span", {}, h("i", { class: "trait", style: { background: se.couleur } }), se.label)),
        avecReformes ? h("span", {}, h("i", { class: "anneau" }), "Avec vos réformes") : null,
      ),
      zoneLignes,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableLignes),
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Par âge\u00a0: les 50-64 ans en tête, les jeunes loin derrière"),
        h("p", { class: "sous-titre" }, "Niveau de vie médian par tranche d'âge en 2024, en euros de 2024 par mois. Le point noir marque 1996."),
      ),
      h(
        "div",
        { class: "legende" },
        h("span", {}, h("i", { class: "pastille", style: { background: COULEURS.emploi } }), "Âges d'activité"),
        h("span", {}, h("i", { class: "pastille", style: { background: COULEURS.retraites } }), "Âges de la retraite"),
        h("span", {}, h("i", { class: "point-noir" }), "1996"),
        avecReformes ? h("span", {}, h("i", { class: "anneau" }), "Avec vos réformes") : null,
      ),
      zoneBarres,
      noteAge,
    ),
    h(
      "p",
      { class: "note" },
      `Et demain ? Selon le COR (juin 2026), le niveau de vie moyen des retraités, aujourd'hui égal à celui de l'ensemble de la population, n'en représenterait plus que ${pourcent(niveauDeVie.projectionCor.points.at(-1).valeur)} en 2070 sans réforme, car les pensions progressent moins vite que les salaires. `,
      h("a", { href: niveauDeVie.projectionCor.url }, "Rapport du COR"),
      ".",
    ),
  );
  const onglets = h(
    "div",
    { class: "onglets" },
    h(
      "div",
      { class: "onglets__liste", role: "tablist", "aria-label": "Deux lectures du niveau de vie" },
      h("button", { type: "button", role: "tab", class: "onglet", id: "onglet-nv-logement", "aria-controls": "panneau-nv-logement", "aria-selected": "true" }, "Logement et patrimoine"),
      h("button", { type: "button", role: "tab", class: "onglet", id: "onglet-nv-reformes", "aria-controls": "panneau-nv-reformes", "aria-selected": "false", tabindex: -1 }, "Niveau de vie depuis 1996"),
    ),
    panneauLogement,
    panneauReformes,
  );

  if (avecReformes) {
    racine.replaceChildren(
      h("h2", { class: "titre-section", id: "titre-niveaux" }, "Et sur les niveaux de vie\u00a0?"),
      h(
        "p",
        { class: "texte" },
        "Chaque réforme réglée plus haut apparaît ci-dessous. Cochez-les pour voir où elles mèneraient le niveau de vie médian des retraités et des personnes en emploi (anneaux), à côté de son évolution depuis 1996. ",
        h("a", { href: "retraites.html#niveaux" }, "Comprendre les écarts de besoins entre jeunes et retraités"),
        ".",
      ),
      panneauReformes,
    );
  } else {
    racine.replaceChildren(
      h("h2", { class: "titre-section", id: "titre-niveaux" }, "Retraités et actifs\u00a0: qui vit le mieux\u00a0?"),
      h(
        "div",
        { class: "texte" },
        h(
          "p",
          {},
          "En 2025, le Financial Times a montré que la France est l'un des rares pays riches où les retraités vivent aussi bien que les actifs. Mais à revenu égal, les besoins diffèrent : logement, crédit, enfants, épargne à constituer. Le premier onglet compare jeunes et retraités sur ces besoins ; le second suit le niveau de vie depuis 1996. ",
          h("a", { href: niveauDeVie.ft.url }, "L'article du FT"),
          ".",
        ),
      ),
      onglets,
    );
    construireLogement(panneauLogement);
    monterOnglets(onglets);
  }
  racine.closest("section")?.setAttribute("aria-labelledby", "titre-niveaux");

  const graphique = lignesTemporelles(zoneLignes, {
    annees,
    series: seriesMensuelles,
    formatY: (v) => euros(v),
    formatAxe: (v) => nombre(v),
    ruptures: niveauDeVie.ruptures,
    libelleApres: "Réformes",
    label: "Niveau de vie médian mensuel des personnes en emploi, des retraités et de l'ensemble, 1996-2024",
  });
  tableDonnees(
    tableLignes,
    ["Année", ...seriesMensuelles.map((se) => se.label), "Retraités / en emploi"],
    annees.map((a, i) => [String(a), ...seriesMensuelles.map((se) => euros(se.valeurs[i])), pourcent(series.retraites[i] / series.emploi[i])]),
  );

  const lignesAge = niveauDeVie.parAge.map((l) => ({
    label: l.age,
    valeur: parMois(l.v2024),
    avant: parMois(l.v1996),
    couleur: l.statut === "retraites" ? COULEURS.retraites : COULEURS.emploi,
  }));
  const barres = barresHorizontales(zoneBarres, { lignes: lignesAge, formatValeur: (v) => euros(v), max: 2600 });

  const rendu = () => {
    const reformes = avecReformes ? lireReformes() : [];
    // Sur la page « Simuler », une réforme qui apparaît est cochée d'office ; l'utilisateur peut la décocher.
    for (const r of reformes) if (!vues.has(r.id)) (vues.add(r.id), cochees.add(r.id));
    const focusAvant = document.activeElement?.closest?.(".reforme-choix") ? document.activeElement.value : null;
    // Liste des réformes, avec leur effet actuel.
    if (avecReformes) remplir(
      listeReformes,
      reformes.length
        ? reformes.map((r) =>
            h(
              "label",
              { class: "reforme-choix" },
              h("input", { type: "checkbox", value: r.id, checked: cochees.has(r.id) }),
              h("span", { class: "reforme-choix__label" }, r.label),
              h("span", { class: "reforme-choix__effet" }, `actifs ${signe(r.actifs)}, retraités ${signe(r.retraites)}`),
            ),
          )
        : h("p", { class: "aide" }, "Aucune réforme réglée pour l'instant."),
    );
    if (focusAvant) listeReformes.querySelector(`input[value="${focusAvant}"]`)?.focus();

    const actives = reformes.filter((r) => cochees.has(r.id));
    const effet = cumuler(actives);
    const retraitesAvant = series.retraites[derniere];
    const emploiAvant = series.emploi[derniere];
    const ratioAvant = retraitesAvant / emploiAvant;
    const ratioApres = (retraitesAvant * (1 + effet.retraites)) / (emploiAvant * (1 + effet.actifs));

    remplir(
      chiffres,
      h(
        "div",
        { class: "chiffre" },
        h("dt", {}, "Niveau de vie des retraités, en % de celui des personnes en emploi"),
        h("dd", {}, actives.length ? `${pourcent(ratioAvant)} → ${pourcent(ratioApres)}` : pourcent(ratioAvant)),
      ),
      h(
        "div",
        { class: "chiffre" },
        h("dt", {}, "Retraité médian, par mois"),
        h("dd", {}, euros(parMois(retraitesAvant * (1 + effet.retraites))), h("span", { class: "sous" }, actives.length ? ` ${signe(effet.retraites)}` : " en 2024")),
      ),
      h(
        "div",
        { class: "chiffre" },
        h("dt", {}, "Personne en emploi médiane, par mois"),
        h("dd", {}, euros(parMois(emploiAvant * (1 + effet.actifs))), h("span", { class: "sous" }, actives.length ? ` ${signe(effet.actifs)}` : " en 2024")),
      ),
    );

    graphique.definirApres(
      actives.length
        ? { emploi: parMois(emploiAvant * (1 + effet.actifs)), retraites: parMois(retraitesAvant * (1 + effet.retraites)) }
        : null,
    );
    barres.definirApres(
      actives.length ? niveauDeVie.parAge.map((l) => parMois(l.v2024 * (1 + (l.statut === "retraites" ? effet.retraites : effet.actifs)))) : null,
    );
    noteAge.textContent = actives.length
      ? "Hypothèse simplificatrice : l'effet « actifs » est appliqué aux moins de 65 ans, l'effet « retraités » aux 65 ans et plus. En réalité, chaque tranche d'âge mêle actifs, chômeurs, retraités et enfants."
      : "Source : Insee, niveau de vie selon l'âge (ERFS), euros constants 2024.";
  };

  listeReformes.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    e.target.checked ? cochees.add(e.target.value) : cochees.delete(e.target.value);
    rendu();
  });
  surMaj(rendu);
  rendu();
}
