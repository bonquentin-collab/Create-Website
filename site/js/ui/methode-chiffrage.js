// Héritage › Méthode : hypothèses du chiffrage de l'IGS, scénario de l'étude et scénario actualisé, avec formules.

import { h } from "./dom.js";
import { milliards, milliardsRonds } from "../engine/format.js";
import { tableDonnees } from "./graphiques/colonnes.js";
import { chiffrage } from "../params/igs-chiffrage.js";
import { chiffrerIgs } from "../engine/igs-chiffrage.js";

const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const pct = (v) => `${virgule.format(v * 100)} %`;
const md = (v) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v)} Md€`;

export function monter(racine) {
  const { etude: e, actualise: a } = chiffrage.scenarios;
  const re = chiffrerIgs(e, e.hypotheses, chiffrage);
  const ra = chiffrerIgs(a, a.hypotheses, chiffrage);
  const p2 = chiffrage.pilier2;
  const table = h("div");
  tableDonnees(table, ["Hypothèse", e.label, a.label, "Source"], [
    ["PIB 2025", md(re.pib[0]), md(ra.pib[0]), `${e.sources.pib} / ${a.sources.pib}`],
    ["Croissance du PIB ensuite", pct(e.hypotheses.croissancePib), pct(a.hypotheses.croissancePib), "Étude"],
    ["Flux successoral", "15 % du PIB en 2021 → 23 % en 2050", "idem", chiffrage.flux.source],
    ["Droits de succession et donations 2025", md(re.dmtg[0]), md(ra.dmtg[0]), `${e.sources.dmtg} / ${a.sources.dmtg}`],
    ["Pilier 1 en 2021", md(chiffrage.pilier1.recettes2021), "idem", chiffrage.pilier1.source],
    ["Patrimoine net des ménages 2022", md(e.patrimoine[2022]), md(a.patrimoine[2022]), `${e.sources.patrimoine} / ${a.sources.patrimoine}`],
    ["Part du top 1 % en 2022", pct(p2.partTop1.valeur), "idem", p2.partTop1.source],
    ["Croissance du patrimoine du top 1 %", pct(e.hypotheses.rendementTop1), pct(a.hypotheses.rendementTop1), p2.sources.rendement],
    ["Mortalité du top 1 %", `${pct(p2.mortalite[0])} (2025) → ${pct(p2.mortalite.at(-1))} (2040)`, "idem", "Insee (2021) et rapport du CPO sur les assujettis à l'ISF"],
    ["Part de plus-values latentes", pct(e.hypotheses.partPV), "idem", p2.sources.partPV],
    ["PFU", pct(e.hypotheses.pfu), pct(a.hypotheses.pfu), `${e.sources.pfu} / ${a.sources.pfu}`],
    ["Assiette après abattements ; droits déjà payés", `${pct(p2.abattement)} ; −${pct(p2.dmtgDeduits)}`, "idem", "Hannezo et al. (2022) ; CAE (2021)"],
    ["Résultat : recettes 2025", milliards(re.premiereAnnee), milliards(ra.premiereAnnee), "Calcul"],
    ["Résultat : cumul 2025-2040", milliardsRonds(re.cumul), milliardsRonds(ra.cumul), "Calcul"],
  ]);
  racine.replaceChildren(
    h("h2", { class: "titre-section", id: "chiffrage" }, "Le chiffrage des recettes"),
    h(
      "div",
      { class: "texte" },
      h("p", {}, "Les recettes sont recalculées dans votre navigateur avec les formules du classeur de l'étude, qui donnent exactement ses chiffres. Le scénario « Actualisé 2026 » ne change que des données connues depuis ; les curseurs de la page Comprendre permettent de tester les autres hypothèses."),
      h("p", {}, "Flux successoral = PIB × part du PIB transmise (interpolée de 15 % en 2021 à 23 % en 2050). Pilier 1 = 10 Md€ × flux de l'année ÷ flux de 2021. Pilier 2 = patrimoine du top 1 % × mortalité × part de plus-values latentes × PFU × 80 % × (1 − 20 %), le patrimoine du top 1 % partant de 24 % du patrimoine de 2022 et croissant chaque année au rythme choisi. Taux effectif = droits de succession (actuels, ou avec la réforme) ÷ flux successoral, en 2025."),
      h("p", {}, "Limites : l'étude mêle euros courants et croissances réelles (le PIB y croît de 1 % par an, sans inflation), fait croître la part du top 1 % de 24 % à 35 % du patrimoine en 2040, et n'intègre aucun effet de comportement (exil, optimisation, étalement du paiement sur dix ans)."),
    ),
    h("details", { class: "table-donnees", open: true }, h("summary", {}, "Hypothèses, par scénario"), table),
  );
}
