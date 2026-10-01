// Encadré « à rendement égal » en tête de Retraites › Simuler : les trois façons de faire contribuer les retraités
// comparées par l'IPP (note n° 129) pour la même recette, avec qui perd et combien. Tableau complet dans Méthode.

import { h } from "./dom.js";
import { euros, milliards } from "../engine/format.js";
import { ipp129 } from "../params/ipp-retraites.js";

const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const ONGLETS = { C2: ["onglet-csg", "CSG des retraités"], D5: ["onglet-gel", "Gel des hautes pensions"], A2: ["onglet-abattement", "Abattement de 10 %"] };

export function monter(racine) {
  const s = Object.fromEntries(ipp129.scenarios.map((x) => [x.id, x]));
  const egal = ["C2", "A2", "D5"].map((id) => s[id]);
  racine.replaceChildren(
    h("h2", { class: "titre-section", id: "titre-pistes" }, "Faire contribuer les retraités : trois pistes, un même rendement"),
    h(
      "p",
      { class: "texte" },
      `Pour un même gain de ${milliards(egal[0].rendement)} par an, l'Institut des politiques publiques a comparé qui perd, et combien. La CSG et l'abattement font porter l'effort sur les retraités les plus aisés ; une revalorisation réduite au-delà de la pension médiane touche plus de monde, dont des ménages modestes.`,
    ),
    h(
      "ul",
      { class: "pistes" },
      egal.map((x) =>
        h(
          "li",
          { class: "piste" },
          h("p", { class: "piste__titre" }, x.label),
          h(
            "dl",
            { class: "piste__chiffres" },
            h("div", {}, h("dt", {}, "Retraités perdants"), h("dd", {}, pct0.format(x.perdants))),
            h("div", {}, h("dt", {}, "Perte moyenne des perdants"), h("dd", {}, `${euros(x.pertePerdants)} par mois`)),
            h("div", {}, h("dt", {}, "Leur retraite moyenne"), h("dd", {}, `${euros(x.retraitePerdants)} par mois`)),
          ),
          h("p", { class: "piste__profil" }, ipp129.profils[x.id]),
          h("a", { class: "piste__lien", href: `#${ONGLETS[x.id][0].replace("onglet-", "")}`, "data-onglet": ONGLETS[x.id][0] }, `Simuler : ${ONGLETS[x.id][1]} →`),
        ),
      ),
    ),
    h(
      "p",
      { class: "note" },
      `Aux montants débattus, les rendements diffèrent : ${milliards(s.A1.rendement)} pour la suppression de l'abattement, ${milliards(s.D1.rendement)} pour le gel de toutes les pensions de base, ${milliards(s.C1.rendement)} pour la CSG à 9,2 % aux taux médian et normal. Source : `,
      h("a", { href: ipp129.url }, ipp129.source),
      " (microsimulation pour 2027, gains nets pour les finances publiques). ",
      h("a", { href: "retraites-methode.html#ipp" }, "Tableau complet des neuf scénarios"),
      ".",
    ),
  );
  // Les liens ouvrent l'onglet correspondant du simulateur.
  racine.addEventListener("click", (e) => {
    const lien = e.target.closest("[data-onglet]");
    if (!lien) return;
    const onglet = document.getElementById(lien.dataset.onglet);
    if (!onglet) return;
    e.preventDefault();
    onglet.click();
    document.getElementById("simulateur")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
