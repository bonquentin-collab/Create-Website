// Onglet « CSG des retraités » : aligner la CSG sur les pensions sur celle des salaires (9,2 %),
// et reverser la recette aux actifs par une baisse de leur CSG.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { alignementCsg, perteRetraite, gainBaisseCsg } from "../engine/prelevements.js";
import { csg } from "../params/prelevements.js";
import { macro } from "../params/macro.js";

const unDecimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const taux = (t) => `${unDecimal.format(t * 100)} %`;

export function monter(racine) {
  const bareme = csg.retraites.taux;
  const champPension = h("input", { id: "c-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "1 800" });
  const selectTaux = h("select", { id: "c-taux", name: "taux" }, bareme.map((t) => h("option", { value: t.id, selected: t.id === "normal" }, t.label)));
  const champSalaire = h("input", { id: "c-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });
  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h(
      "fieldset",
      { class: "champ" },
      h("legend", {}, "Quels retraités passent à 9,2 % ?"),
      h(
        "div",
        { class: "choix choix--colonne" },
        h("label", {}, h("input", { type: "radio", name: "portee", value: "normal", checked: true }), "Ceux au taux normal (8,3 %), les plus aisés"),
        h("label", {}, h("input", { type: "radio", name: "portee", value: "tous" }), "Tous ceux qui paient la CSG (3,8 %, 6,6 % et 8,3 %)"),
      ),
      h("p", { class: "aide" }, "Les retraités exonérés, aux plus petites pensions, le restent dans les deux cas."),
    ),
    h("div", { class: "champ" }, h("label", { for: "c-pension" }, "Votre pension brute mensuelle"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "c-taux" }, "Votre taux de CSG aujourd'hui"),
      selectTaux,
      h("p", { class: "aide" }, "Il dépend du revenu fiscal de référence : pour une personne seule, taux normal au-delà de 26 004 € par an (seuils 2025). Il figure sur votre relevé de pension."),
    ),
    h("div", { class: "champ" }, h("label", { for: "c-salaire" }, "Le salaire net d'un actif, pour comparer"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite", "data-resultat": true });

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h("p", {}, "Sur un salaire, la CSG est de 9,2 %. Sur une pension, elle va de 0 à 8,3 % selon le revenu. Aligner les retraités sur les actifs rapporterait de l'argent, que ce simulateur reverse aux actifs sous forme de baisse de CSG."),
    ),
    h("div", { class: "simulateur" }, form, resultat),
  );
  formaterALaSortie(champPension, lireMontant, nombre);
  formaterALaSortie(champSalaire, lireMontant, nombre);

  let dernier = null;
  const rendu = () => {
    const portee = form.querySelector('input[name="portee"]:checked').value;
    const a = alignementCsg(portee, csg);
    const pension = lireMontant(champPension.value);
    const actuel = bareme.find((t) => t.id === selectTaux.value);
    const nouveau = a.nouveauTaux(actuel.id);
    const perte = perteRetraite(pension, actuel.taux, nouveau);
    const baisseCsgActifs = a.recettes / csg.activite.valeurPoint;
    const gainActif = gainBaisseCsg(lireMontant(champSalaire.value), baisseCsgActifs, csg, macro.ratioNetSurBrut.valeur);

    const concerne = perte > 0.5;
    const tampon = h("p", { class: `tampon ${concerne ? "" : "tampon--neutre"}` }, concerne ? `${ecartEuros(-perte)} par mois` : "Vous n'êtes pas concerné");
    remplir(
      resultat,
      tampon,
      h(
        "p",
        { class: "resultat__phrase" },
        concerne
          ? `Votre CSG passerait de ${taux(actuel.taux)} à ${taux(nouveau)} : votre pension nette baisserait de ${euros(perte)} par mois, ${euros(perte * 12)} par an.`
          : `Avec ce choix, votre taux reste de ${taux(actuel.taux)}.`,
      ),
      h(
        "dl",
        { class: "comparatif" },
        h("div", {}, h("dt", {}, "Recette"), h("dd", {}, milliards(a.recettes), h("span", { class: "sous" }, "par an, estimation du simulateur"))),
        h("div", {}, h("dt", {}, "Baisse de CSG des actifs"), h("dd", {}, `−${unDecimal.format(baisseCsgActifs)} pt`, h("span", { class: "sous" }, `soit ${ecartEuros(gainActif)} par mois sur ce salaire`))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        "Estimation du simulateur, faute de chiffrage officiel : assiettes des pensions par taux calibrées sur les recettes de CSG 2025 (CCSS, mai 2026). Pour comparaison, la hausse de 1,7 point de 2018 avait rapporté 4,5 Md€ sur les pensions. La part déductible de la CSG, qui réduit un peu la perte via l'impôt sur le revenu, n'est pas prise en compte.",
      ),
    );
    const cle = `${concerne}`;
    if (dernier !== null && dernier !== cle) rejouer(tampon);
    dernier = cle;
  };

  surChangement(form, rendu);
  rendu();
}
