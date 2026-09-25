// Onglet « Retraites sans impôts » : et si les pensions ne vivaient que de ressources « logiques » ?
// L'utilisateur choisit les ressources à garder, qui comble le trou (retraités ou actifs), et à quoi sert
// l'argent public libéré (salaires ou services publics, via le répartiteur).

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { ressourcesRetirees, comblerTrou, pensionApres, perteSalaire } from "../engine/retraites.js";
import { retraites } from "../params/retraites.js";
import { macro } from "../params/macro.js";
import { creerRepartiteur } from "./composants/repartiteur.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { effetFinancement } from "../engine/niveau-de-vie.js";
import { publier } from "./etat-reformes.js";

const PENSIONS_TYPES = [
  { label: "Petite pension", montant: 1000 },
  { label: "Pension médiane (brut)", montant: retraites.pensionMedianeBrute.valeur },
  { label: "Pension moyenne (net)", montant: retraites.pensionMoyenneNette.valeur },
  { label: "Pension confortable", montant: 3000 },
];

const MODELES = [
  { id: "moitie", label: "Moitié salaires, moitié services publics", parts: { actifs: 3, ecole: 1, hopital: 1, ecologie: 1 } },
  { id: "actifs", label: "Tout pour les salaires", parts: { actifs: 1 } },
  { id: "services", label: "Tout pour l'école et l'hôpital", parts: { ecole: 1, hopital: 1 } },
  { id: "vide", label: "Tout remettre à zéro", parts: {} },
];

export function monter(racine) {
  const depenses = retraites.depenses.valeur;
  const assiette = macro.masseSalarialeBrute.valeur / 1e9;

  // ----- Structure -----
  const listeRessources = h("div", { class: "ressources" });
  const curseurPart = h("input", { type: "range", id: "f-part", name: "part", min: 0, max: 100, step: 5, value: 50 });
  const sortiePart = h("output", { for: "f-part", class: "curseur-double__valeurs" });
  const champPension = h("input", { id: "f-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: nombre(retraites.pensionMoyenneNette.valeur) });
  const champSalaire = h("input", { id: "f-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });
  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h("fieldset", { class: "champ" }, h("legend", {}, "Quelles ressources garder pour payer les retraites ?"), h("p", { class: "aide" }, "Cochées : ce qui continue de financer les pensions. Les cases pré-cochées sont les ressources assises sur le travail."), listeRessources),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "f-part" }, "Qui comble le trou ?"),
      h("div", { class: "curseur-double" }, h("span", {}, "Les actifs"), curseurPart, h("span", {}, "Les retraités")),
      sortiePart,
    ),
    h("div", { class: "champ" }, h("label", { for: "f-pension" }, "Votre pension nette mensuelle, si vous êtes à la retraite"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
    h("div", { class: "champ" }, h("label", { for: "f-salaire" }, "Votre salaire net mensuel, si vous travaillez"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite", "data-resultat": true });
  const zoneRepartiteur = h("div");

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h("p", {}, "Les retraites ne vivent pas que de cotisations : l'État, la CSG, la TVA et d'autres caisses en paient environ un tiers. Imaginez qu'on impose de les financer uniquement par des ressources liées au travail. Il faudrait alors trouver l'argent manquant, et de l'argent public serait libéré pour autre chose."),
    ),
    controverse(),
    h("div", { class: "simulateur" }, form, resultat),
    h(
      "div",
      { class: "liberation" },
      h("h3", { class: "titre-graphique" }, "Et l'argent public libéré, vous en feriez quoi ?"),
      h("p", { class: "texte" }, "Les impôts et subventions qui ne financent plus les retraites peuvent aller aux salaires des actifs ou aux services publics."),
      zoneRepartiteur,
    ),
  );

  const cases = new Map();
  listeRessources.replaceChildren(
    ...retraites.ressources.map((r) => {
      const idCase = `f-r-${r.id}`;
      const c = h("input", { type: "checkbox", id: idCase, name: "ressource", value: r.id, checked: r.fixe || r.logique ? true : false, disabled: r.fixe ? true : false });
      cases.set(r.id, c);
      return h(
        "div",
        { class: `ressource${r.fixe ? " ressource--fixe" : ""}` },
        c,
        h("label", { for: idCase }, h("span", { class: "ressource__label" }, r.label), h("span", { class: "ressource__montant" }, milliards(r.montant))),
        r.note ? h("p", { class: "ressource__note" }, r.note, r.url ? [" ", h("a", { href: r.url }, "Source")] : null) : null,
      );
    }),
  );
  formaterALaSortie(champPension, lireMontant, nombre);
  formaterALaSortie(champSalaire, lireMontant, nombre);

  // Dernier état connu, pour republier l'effet quand la répartition de l'argent libéré change.
  let dernierComblement = { baissePensions: 0, hausseCotisations: 0 };
  let versementActifs = 0;
  let dernierRetire = 0;
  const publierEffet = () =>
    publier("financement", {
      label: `Retraites sans impôts (${milliards(dernierRetire)} retirés)`,
      ...effetFinancement(dernierComblement, versementActifs, {
        ratioNetSurBrut: macro.ratioNetSurBrut.valeur,
        composition: niveauDeVie.composition,
        masseSalarialeBrute: assiette,
      }),
    });

  const repartiteur = creerRepartiteur(zoneRepartiteur, {
    surChangement: (r) => {
      versementActifs = r.actifs ?? 0;
      publierEffet();
    },
    prefixe: "fl",
    cleLien: "liberation",
    modeles: MODELES,
    phrase: (enveloppe) => `${milliards(enveloppe)} d'argent public ne financent plus les retraites.`,
    noteActifs: "Si ce sont les actifs qui comblent le trou par leurs cotisations, ce gain compense en partie leur perte.",
  });

  let dernierTrou = null;
  const rendu = () => {
    const gardees = [...cases].filter(([, c]) => c.checked).map(([id]) => id);
    const { retire } = ressourcesRetirees(retraites.ressources, gardees);
    const partPensions = Number(curseurPart.value) / 100;
    const c = comblerTrou(retire, partPensions, depenses, assiette);
    const pension = lireMontant(champPension.value);
    const salaire = lireMontant(champSalaire.value);

    sortiePart.textContent = `${100 - curseurPart.value} % par les cotisations, ${curseurPart.value} % par les pensions`;

    const tampon = h("p", { class: `tampon ${retire > 0 ? "" : "tampon--neutre"}` }, retire > 0 ? `Il manque ${milliards(retire)}` : "Rien ne change");
    remplir(
      resultat,
      tampon,
      h("p", { class: "resultat__phrase" }, `Sans ces ressources, les retraites perdent ${milliards(retire)} par an, ${pourcent(retire / depenses)} de ce qu'elles coûtent.`),
      retire > 0
        ? [
            h(
              "dl",
              { class: "comparatif" },
              h("div", {}, h("dt", {}, "Pensions"), h("dd", {}, c.baissePensions > 0 ? `−${pourcent(c.baissePensions)}` : "0 %", h("span", { class: "sous" }, `${milliards(c.parPensions)} pris sur les retraités`))),
              h("div", {}, h("dt", {}, "Cotisations"), h("dd", {}, c.hausseCotisations > 0 ? `+${nombre1(c.hausseCotisations * 100)} pt` : "0 pt", h("span", { class: "sous" }, `${milliards(c.parCotisations)} de plus sur les salaires bruts`))),
            ),
            pension > 0 && c.baissePensions > 0
              ? h("p", { class: "resultat__phrase" }, `Votre pension passerait de ${euros(pension)} à ${euros(pensionApres(pension, c.baissePensions))} par mois, soit ${ecartEuros(-pension * c.baissePensions)}.`)
              : null,
            salaire > 0 && c.hausseCotisations > 0
              ? h("p", { class: "resultat__phrase" }, `Votre salaire net baisserait d'environ ${euros(perteSalaire(salaire, c.hausseCotisations, macro.ratioNetSurBrut.valeur))} par mois, si la hausse pèse sur les salaires.`)
              : null,
            c.baissePensions > 0 ? tablePensions(c.baissePensions) : null,
            h("p", { class: "resultat__detail" }, "Hypothèses : baisse uniforme de toutes les pensions ; hausse de cotisation sur les 1 108 Md€ de salaires bruts (Insee 2024), supportée à terme par les salariés. Sans effet sur l'emploi ni sur les comportements."),
          ]
        : h("p", { class: "resultat__detail" }, "Décochez une ressource pour voir ce qu'il faudrait trouver à la place."),
    );
    if (dernierTrou !== null && (dernierTrou > 0) !== (retire > 0)) rejouer(tampon);
    dernierTrou = retire;
    dernierComblement = c;
    dernierRetire = retire;
    repartiteur.definirEnveloppe(retire);
  };

  surChangement(form, rendu);
  rendu();
}

function tablePensions(baisse) {
  return h(
    "table",
    { class: "table-pensions" },
    h("caption", {}, "Ce que deviendraient quelques pensions (par mois)"),
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Pension"), h("th", { scope: "col" }, "Aujourd'hui"), h("th", { scope: "col" }, "Après"))),
    h(
      "tbody",
      {},
      PENSIONS_TYPES.map((p) =>
        h("tr", {}, h("th", { scope: "row" }, p.label), h("td", {}, euros(p.montant)), h("td", {}, euros(pensionApres(p.montant, baisse)))),
      ),
    ),
  );
}

function controverse() {
  return h(
    "details",
    { class: "controverse" },
    h("summary", {}, "Un tiers ? Ce que disent les uns et les autres"),
    h(
      "ul",
      {},
      retraites.controverse.map((c) => h("li", {}, h("strong", {}, c.qui), " : ", c.dit, " ", h("a", { href: c.url }, "Source"))),
    ),
  );
}

const unDecimal = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nombre1 = (v) => unDecimal.format(v);
