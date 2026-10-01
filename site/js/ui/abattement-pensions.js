// Onglet « Abattement de 10 % » : supprimer ou abaisser l'abattement sur les pensions à l'impôt sur le revenu,
// reverser la recette aux actifs par une baisse de CSG, et montrer la hausse d'impôt d'un foyer de retraités.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, lireMontant, nombre } from "../engine/format.js";
import { recettesAbattement, hausseImpotFoyer } from "../engine/abattement.js";
import { gainBaisseCsg } from "../engine/prelevements.js";
import { effetCsgRetraites } from "../engine/niveau-de-vie.js";
import { ipp129 } from "../params/ipp-retraites.js";
import { csg } from "../params/prelevements.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { publier } from "./etat-reformes.js";

const deuxDecimales = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const TMI = [0, 0.11, 0.3, 0.41, 0.45];

export function monter(racine) {
  const ab = ipp129.abattement;
  const curseur = h("input", { type: "range", id: "ab-plafond", name: "plafond", min: 0, max: ab.plafond, step: 1, value: 0 });
  const sortie = h("output", { for: "ab-plafond" });
  const champPensions = h("input", { id: "ab-pensions", name: "pensions", inputmode: "decimal", autocomplete: "off", value: "30 000" });
  const selectPensionnes = h("select", { id: "ab-pensionnes", name: "pensionnes" }, h("option", { value: "1" }, "1"), h("option", { value: "2" }, "2"));
  const selectTmi = h("select", { id: "ab-tmi", name: "tmi" }, TMI.map((t) => h("option", { value: String(t), selected: t === 0.11 }, `${Math.round(t * 100)} %`)));
  const champSalaire = h("input", { id: "ab-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });

  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h(
      "div",
      { class: "champ" },
      h("label", { for: "ab-plafond" }, "Plafond de l'abattement par foyer : ", sortie),
      curseur,
      h("p", { class: "aide" }, `Aujourd'hui ${euros(ab.plafond)} par an. À 0 €, l'abattement est supprimé.`),
    ),
    h("div", { class: "champ" }, h("label", { for: "ab-pensions" }, "Pensions du foyer, montant annuel déclaré aux impôts"), h("div", { class: "case" }, champPensions, h("span", { "aria-hidden": "true" }, "€"))),
    h("div", { class: "champ" }, h("label", { for: "ab-pensionnes" }, "Nombre de retraités dans le foyer"), selectPensionnes),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "ab-tmi" }, "Taux marginal d'imposition du foyer"),
      selectTmi,
      h("p", { class: "aide" }, "Il figure sur votre avis d'impôt. Un foyer non imposable (0 %) ne paie rien de plus."),
    ),
    h("div", { class: "champ" }, h("label", { for: "ab-salaire" }, "Le salaire net d'un actif, pour comparer"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite" });

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h(
        "p",
        {},
        `Depuis 1978, les retraités déduisent 10 % de leurs pensions de leur revenu imposable, comme les salariés pour leurs frais professionnels, dans la limite de ${euros(ab.plafond)} par foyer. Le gouvernement met en balance, pour le budget 2027, cet abattement et la revalorisation des pensions. Ici, la recette baisse la CSG des actifs.`,
      ),
      h(
        "p",
        {},
        "Selon l'IPP (2026), c'est la piste la plus redistributive des trois : la perte croît avec le niveau de vie, car seuls les foyers imposables y perdent. Avec une exception : les aides au logement tenant compte du revenu après abattement, les retraités les plus modestes y perdraient aussi. ",
        h("a", { href: ipp129.url }, "Lire la note de l'IPP"),
        ".",
      ),
    ),
    h("div", { class: "simulateur" }, form, resultat),
  );
  formaterALaSortie(champPensions, lireMontant, nombre);
  formaterALaSortie(champSalaire, lireMontant, nombre);

  let dernier = null;
  const rendu = () => {
    const plafond = Number(curseur.value);
    sortie.textContent = plafond === 0 ? "supprimé" : euros(plafond);
    const recettes = recettesAbattement(plafond, ab.points);
    const f = hausseImpotFoyer(
      { pensions: lireMontant(champPensions.value), pensionnes: Number(selectPensionnes.value), tauxMarginal: Number(selectTmi.value), plafond },
      ab,
    );
    const baisseCsgActifs = recettes / csg.activite.valeurPoint;
    const gainActif = gainBaisseCsg(lireMontant(champSalaire.value), baisseCsgActifs, csg, macro.ratioNetSurBrut.valeur);

    const tampon = h("p", { class: `tampon ${recettes > 0.05 ? "tampon--actifs" : "tampon--neutre"}` }, `+${milliards(recettes)} par an`);
    remplir(
      resultat,
      tampon,
      h(
        "p",
        { class: "resultat__phrase" },
        plafond === 0
          ? `Supprimer l'abattement rapporterait environ ${milliards(recettes)} par an : surtout de l'impôt sur le revenu, et ${milliards(ab.aidesLogement)} de moindres aides au logement.`
          : `Ramener le plafond à ${euros(plafond)} par foyer rapporterait environ ${milliards(recettes)} par an.`,
      ),
      h(
        "dl",
        { class: "comparatif" },
        h(
          "div",
          {},
          h("dt", {}, "Votre foyer"),
          h("dd", {}, f.hausse > 0 ? ecartEuros(-f.hausse / 12) : "0 €", h("span", { class: "sous" }, f.hausse > 0 ? `par mois d'impôt en plus (${ecartEuros(-f.hausse)} par an) : abattement de ${euros(f.avant)} ramené à ${euros(f.apres)}` : "pas d'impôt en plus")),
        ),
        h("div", {}, h("dt", {}, "CSG des actifs"), h("dd", {}, `−${deuxDecimales.format(baisseCsgActifs)} pt`, h("span", { class: "sous" }, `soit ${ecartEuros(gainActif)} par mois sur ce salaire`))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        `Recette calée sur l'IPP (2026, microsimulation pour 2027) : ${milliards(ab.points[0].recettes)} pour la suppression, ${milliards(ab.points[1].recettes)} pour un plafond de ${euros(ab.points[1].plafond)} ; entre ces points, interpolation du site. Votre hausse d'impôt est approchée par l'abattement perdu multiplié par votre taux marginal (sans décote ni changement de tranche) ; une éventuelle baisse des aides au logement n'est pas comptée.`,
      ),
    );
    if (dernier !== null && Math.abs(dernier - recettes) > 0.5) rejouer(tampon);
    dernier = recettes;

    publier("abattement", {
      label: plafond === 0 ? `Abattement de 10 % supprimé (${milliards(recettes)})` : `Plafond de l'abattement à ${euros(plafond)} (${milliards(recettes)})`,
      ...effetCsgRetraites(recettes, {
        csg,
        ratioNetSurBrut: macro.ratioNetSurBrut.valeur,
        composition: niveauDeVie.composition,
        pensionsTotales: niveauDeVie.pensionsTotales.valeur,
      }),
    });
  };

  surChangement(form, rendu);
  rendu();
}
