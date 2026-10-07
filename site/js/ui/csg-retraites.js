// Onglet « CSG des retraités » : aligner la CSG sur les pensions sur celle des salaires (9,2 %),
// et reverser la recette aux actifs par une baisse de leur CSG.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { alignementCsg, perteRetraite, gainBaisseCsg } from "../engine/prelevements.js";
import { csg } from "../params/prelevements.js";
import { ipp129 } from "../params/ipp-retraites.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { effetCsgRetraites } from "../engine/niveau-de-vie.js";
import { publier } from "./etat-reformes.js";
import { memoriserFormulaire } from "./etat-bilan.js";
import { avisRessource } from "./avis-ressource.js";

const unDecimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const taux = (t) => `${unDecimal.format(t * 100)} %`;

export function monter(racine) {
  const bareme = csg.retraites.taux;
  const champPension = h("input", { id: "c-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "1 800" });
  const selectTaux = h("select", { id: "c-taux", name: "taux" }, bareme.map((t) => h("option", { value: t.id, selected: t.id === "normal" }, t.label)));
  const champSalaire = h("input", { id: "c-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });
  const avisCsg = h("div", { class: "avis", hidden: true, "aria-live": "polite" });
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
        h("label", {}, h("input", { type: "radio", name: "portee", value: "median-normal" }), "Ceux aux taux médian (6,6 %) et normal (8,3 %)"),
      ),
      h("p", { class: "aide" }, "Les retraités exonérés ou au taux réduit (3,8 %), aux plus petites pensions, ne changent pas."),
      avisCsg,
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
      h(
        "p",
        {},
        "Selon l'IPP (2026), aligner aussi le taux médian pèse surtout sur les classes moyennes de retraités : leur taux monterait de 2,6 points, contre 0,9 point pour le taux normal. N'aligner que le taux normal épargne le milieu de la distribution, mais rapporte presque trois fois moins. ",
        h("a", { href: ipp129.url }, "Lire la note de l'IPP"),
        ".",
      ),
    ),
    h("div", { class: "simulateur" }, form, resultat),
  );
  formaterALaSortie(champPension, lireMontant, nombre);
  formaterALaSortie(champSalaire, lireMontant, nombre);

  let dernier = null;
  const rendu = () => {
    const portee = form.querySelector('input[name="portee"]:checked').value;
    // Affectation unique : si la hausse du taux normal finance déjà l'Assurance maladie (Santé), seule la part du
    // taux médian reste ici.
    const complet = alignementCsg(portee, csg);
    const normalSeul = alignementCsg("normal", csg);
    const tauxNormal = bareme.find((t) => t.id === "normal").taux;
    const a = csgGardee.tient()
      ? complet
      : { recettes: complet.recettes - normalSeul.recettes, net: complet.net - normalSeul.net, nouveauTaux: (id) => (id === "normal" ? tauxNormal : complet.nouveauTaux(id)) };
    const pension = lireMontant(champPension.value);
    const actuel = bareme.find((t) => t.id === selectTaux.value);
    const nouveau = a.nouveauTaux(actuel.id);
    const perte = perteRetraite(pension, actuel.taux, nouveau);
    const baisseCsgActifs = a.net / csg.activite.valeurPoint;
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
        h("div", {}, h("dt", {}, "Recette nette"), h("dd", {}, milliards(a.net), h("span", { class: "sous" }, `par an : ${milliards(a.recettes)} de CSG, moins l'impôt sur le revenu perdu`))),
        h("div", {}, h("dt", {}, "Baisse de CSG des actifs"), h("dd", {}, `−${unDecimal.format(baisseCsgActifs)} pt`, h("span", { class: "sous" }, `soit ${ecartEuros(gainActif)} par mois sur ce salaire`))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        "Calé sur l'IPP (2026, microsimulation pour 2027) : 1,5 Md€ net pour le seul taux normal, 4,2 Md€ net pour les taux médian et normal. Le rendement net tient compte de l'impôt sur le revenu perdu, la hausse portant sur la part déductible de la CSG ; c'est lui qui est reversé aux actifs. Votre perte est calculée avant cet effet d'impôt.",
      ),
    );
    const cle = `${concerne}`;
    if (dernier !== null && dernier !== cle) rejouer(tampon);
    dernier = cle;
    publier("csg", {
      label: portee === "normal" ? "CSG des retraités au taux normal alignée" : "CSG des retraités aux taux médian et normal alignée",
      ...effetCsgRetraites(a.recettes, {
        csg,
        ratioNetSurBrut: macro.ratioNetSurBrut.valeur,
        composition: niveauDeVie.composition,
        pensionsTotales: niveauDeVie.pensionsTotales.valeur,
      }, a.net),
      bilan: {
        usagePrincipal: "actifs",
        net: a.net,
        usages: { actifs: a.net },
        ressources: portee === "normal" ? ["csg-pensions-normal"] : ["csg-pensions-normal", "csg-pensions-median"],
        reglages: [portee === "normal" ? "Taux normal des pensions aligné sur 9,2 %" : "Taux médian et normal des pensions alignés sur 9,2 %", "rendement net reversé aux actifs en baisse de CSG"],
        details: { portee, brut: a.recettes },
      },
    });
  };

  const csgGardee = avisRessource(avisCsg, {
    ressource: "csg-pensions-normal",
    moi: "csg",
    quoi: "La hausse de CSG des pensions au taux normal",
    ailleurs: { sante: { texte: "dans Santé › Simuler, elle finance l'Assurance maladie", lien: "sante-simuler.html" } },
    surChange: () => rendu(),
  });
  memoriserFormulaire(form, "retraites-csg", "csg");
  surChangement(form, rendu);
  rendu();
}
