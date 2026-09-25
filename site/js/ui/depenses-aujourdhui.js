// Page « Comprendre » des retraites : où va l'argent public aujourd'hui (anneau seul, sans choix à faire).
// La version qui réagit aux réformes est sur la page « Simuler ».

import { h } from "./dom.js";
import { camembertAvantApres } from "./graphiques/camembert.js";
import { depenses, construirePostes } from "../params/depenses.js";
import { appliquerChoix } from "../engine/depenses.js";

export function monter(racine) {
  const zone = h("div");
  const caseAcocher = h("input", { type: "checkbox", id: "da-pensions", checked: true });
  racine.replaceChildren(
    h("h2", { class: "titre-section" }, "Où va l'argent public\u00a0?"),
    h(
      "p",
      { class: "texte" },
      "Les retraites sont le premier poste de dépense publique, devant la santé. Cochez ou décochez la case pour ranger les pensions des anciens enseignants et militaires dans leur administration ou dans les retraites. ",
      h("a", { href: "retraites-simuler.html#depenses" }, "Voir comment ce partage changerait avec vos réformes"),
      ".",
    ),
    zone,
  );
  let postes = depenses.postes;
  const camembert = camembertAvantApres(zone, {
    postes,
    seul: true,
    titre: `Dépenses publiques ${depenses.annee} par grande fonction`,
    sousTitre: "État, collectivités et Sécurité sociale, en milliards d'euros et en part du total.",
    options: h(
      "div",
      { class: "camembert__options" },
      h(
        "label",
        { class: "case-a-cocher", for: "da-pensions" },
        caseAcocher,
        h("span", {}, "Compter les pensions des anciens enseignants et des militaires dans leur administration"),
      ),
    ),
    notes: [h("p", { class: "note" }, "Sources : ", h("a", { href: depenses.url }, depenses.source), " ; ", h("a", { href: depenses.jaune.url }, depenses.jaune.source), ".")],
  });
  const rendu = () => camembert.maj(appliquerChoix(postes, {}, 0));
  caseAcocher.addEventListener("change", () => {
    postes = construirePostes({ pensionsDansServices: caseAcocher.checked });
    camembert.definirPostes(postes);
    rendu();
  });
  rendu();
}
