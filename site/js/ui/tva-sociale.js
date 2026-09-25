// Onglet « TVA sociale » : une hausse de TVA dont toute la recette baisse la CSG des actifs.
// Le salarié gagne sur sa fiche de paie mais paie plus cher ce qu'il achète ; le retraité ne fait que payer.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { tvaSociale, gainBaisseCsg } from "../engine/prelevements.js";
import { tva, csg } from "../params/prelevements.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { effetTvaSociale } from "../engine/niveau-de-vie.js";
import { publier } from "./etat-reformes.js";

const unDecimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export function monter(racine) {
  const curseurPoints = h("input", { type: "range", id: "t-points", name: "points", min: 0, max: 5, step: 0.5, value: 2 });
  const sortiePoints = h("output", { for: "t-points" });
  const curseurRep = h("input", { type: "range", id: "t-rep", name: "repercussion", min: 0, max: 100, step: 5, value: 100 });
  const sortieRep = h("output", { for: "t-rep" });
  const champSalaire = h("input", { id: "t-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });
  const champPension = h("input", { id: "t-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "1 541" });
  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h("div", { class: "champ" }, h("label", { for: "t-points" }, "Hausse de la TVA : ", sortiePoints), curseurPoints),
    h(
      "fieldset",
      { class: "champ" },
      h("legend", {}, "Sur quels taux ?"),
      h(
        "div",
        { class: "choix choix--colonne" },
        h("label", {}, h("input", { type: "radio", name: "cible", value: "normal", checked: true }), "Le taux normal seulement (20 %)"),
        h("label", {}, h("input", { type: "radio", name: "cible", value: "tousTaux" }), "Tous les taux, y compris l'alimentation (5,5 %)"),
      ),
    ),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "t-rep" }, "Part de la hausse répercutée dans les prix : ", sortieRep),
      curseurRep,
      h("p", { class: "aide" }, "Par le passé, environ 75 % des hausses de TVA ont été répercutées tout de suite (Insee)."),
    ),
    h("div", { class: "champ" }, h("label", { for: "t-salaire" }, "Votre salaire net mensuel"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
    h("div", { class: "champ" }, h("label", { for: "t-pension" }, "Ou votre pension nette mensuelle"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite", "data-resultat": true });

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h("p", {}, "La TVA sociale consiste à augmenter la TVA pour baisser les prélèvements sur le travail. Ici, toute la recette sert à baisser la CSG des actifs. Tout le monde paie la TVA, y compris les retraités ; seuls les actifs profitent de la baisse de CSG."),
    ),
    h("div", { class: "simulateur" }, form, resultat),
  );
  formaterALaSortie(champSalaire, lireMontant, nombre);
  formaterALaSortie(champPension, lireMontant, nombre);

  let dernier = null;
  const rendu = () => {
    const points = Number(curseurPoints.value);
    const cible = form.querySelector('input[name="cible"]:checked').value;
    const repercussion = Number(curseurRep.value) / 100;
    const r = tvaSociale(points, cible, repercussion, tva, csg);
    const salaire = lireMontant(champSalaire.value);
    const pension = lireMontant(champPension.value);

    sortiePoints.textContent = `+${unDecimal.format(points)} point${points > 1 ? "s" : ""}`;
    sortieRep.textContent = pourcent(repercussion);

    const gain = gainBaisseCsg(salaire, r.baisseCsg, csg, macro.ratioNetSurBrut.valeur);
    const coutActif = salaire * r.pertePrix;
    const soldeActif = gain - coutActif;
    const coutRetraite = pension * r.pertePrix;

    const verdict = points === 0 ? "neutre" : soldeActif > 0.5 ? "gagne" : "perd";
    const tampon = h(
      "p",
      { class: `tampon ${verdict === "gagne" ? "tampon--actifs" : verdict === "neutre" ? "tampon--neutre" : ""}` },
      { gagne: "L'actif y gagne", perd: "L'actif y perd", neutre: "Rien ne change" }[verdict],
    );
    remplir(
      resultat,
      tampon,
      h("p", { class: "resultat__phrase" }, `+${unDecimal.format(points)} ${points > 1 ? "points" : "point"} de TVA ${points > 1 ? "rapportent" : "rapporte"} ${milliards(r.recettes)} par an, de quoi baisser la CSG des actifs de ${unDecimal.format(r.baisseCsg)} ${r.baisseCsg > 1 ? "points" : "point"} (de 9,2 % à ${unDecimal.format(9.2 - r.baisseCsg)} %).`),
      h(
        "dl",
        { class: "comparatif" },
        h("div", {}, h("dt", {}, "Un actif"), h("dd", {}, ecartEuros(soldeActif), h("span", { class: "sous" }, `${ecartEuros(gain)} sur la paie, ${ecartEuros(-coutActif)} de prix, par mois`))),
        h("div", {}, h("dt", {}, "Un retraité"), h("dd", {}, ecartEuros(-coutRetraite), h("span", { class: "sous" }, "par mois, la première année"))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        `Les prix montent d'environ ${pourcent(r.pertePrix)} (DG Trésor). Les pensions sont revalorisées sur l'inflation avec environ un an de retard : le retraité récupère ensuite l'essentiel, mais cette revalorisation coûte à son tour aux caisses de retraite. Le gain des actifs suppose que les employeurs ne rognent pas les salaires en retour.`,
      ),
      h("p", { class: "resultat__detail" }, `La TVA pèse 12 % du revenu des 10 % les plus modestes, contre 5 % pour les 10 % les plus aisés (Insee, 2019) : la hausse touche davantage les petits revenus, même si la baisse de CSG la compense pour ceux qui travaillent.`),
    );
    if (dernier !== null && dernier !== verdict) rejouer(tampon);
    dernier = verdict;
    publier("tva", {
      label: `TVA sociale (+${unDecimal.format(points)} pt)`,
      ...effetTvaSociale(r, { csg, ratioNetSurBrut: macro.ratioNetSurBrut.valeur, composition: niveauDeVie.composition }),
    });
  };

  surChangement(form, rendu);
  rendu();
}
