// Simulateur « Mon héritage » : impôt dû sous le droit actuel et sous la réforme.

import { h, remplir, lireFormulaire, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, pourcent, lireMontant, nombre } from "../engine/format.js";
import { comparer } from "../engine/succession.js";
import { courbesLog } from "./graphiques/courbes.js";
import { tableDonnees } from "./graphiques/colonnes.js";

const COURBE = { xMin: 100_000, xMax: 50_000_000 };

export function monter(racine, { reforme, reference }) {
  const form = racine.querySelector("[data-formulaire]");
  const sortie = racine.querySelector("[data-resultat]");
  let dernierVerdict = null;

  for (const input of form.querySelectorAll("input[inputmode]")) formaterALaSortie(input, lireMontant, nombre);

  const lire = () => {
    const f = lireFormulaire(form);
    return {
      montant: lireMontant(f.montant),
      assuranceVie: lireMontant(f.assuranceVie),
      nbParents: Number(f.nbParents) === 1 ? 1 : 2,
      plusValuesLatentes: lireMontant(f.plusValuesLatentes),
    };
  };

  // Graphique : taux moyen selon le montant reçu, pour le nombre de parents choisi.
  let nbParents = lire().nbParents;
  const series = [
    { id: "actuel", label: reference.label, couleur: "var(--serie-actuel)", f: (x) => reference.calculer({ montant: x, nbParents }).tauxMoyen },
    { id: reforme.id, label: reforme.labelCourt, couleur: "var(--serie-tampon)", f: (x) => reforme.calculer({ montant: x, nbParents }).tauxMoyen },
  ];
  racine.querySelector("[data-legende-courbe]").replaceChildren(
    ...series.map((s) => h("span", {}, h("i", { class: "trait", style: { background: s.couleur } }), s.label)),
  );
  const courbe = courbesLog(racine.querySelector('[data-graphique="courbe"]'), {
    ...COURBE,
    yMax: 0.5,
    yPas: 0.1,
    graduationsX: [100_000, 300_000, 1_000_000, 3_000_000, 10_000_000, 30_000_000],
    series,
    formatX: montantCourt,
    formatXLong: (x) => `${euros(x)} reçus`,
    formatY: (v) => pourcent(v),
    label: "Taux moyen d'imposition selon le montant hérité, droit actuel et IGS",
  });

  const legenderCourbe = () => {
    const bascule = seuilDeBascule(series[0].f, series[1].f);
    const parents = nbParents === 2 ? "de deux parents" : "d'un parent";
    racine.querySelector("[data-sous-titre-courbe]").textContent =
      `Taux moyen d'imposition selon le montant reçu ${parents}, sans assurance-vie ni plus-values.` +
      (bascule ? ` Le barème de l'IGS devient plus lourd au-delà d'environ ${montantCourt(bascule)}.` : "");
    const points = [100_000, 200_000, 300_000, 500_000, 1e6, 2e6, 5e6, 1e7, 2e7, 5e7];
    tableDonnees(
      racine.querySelector('[data-table="courbe"]'),
      ["Montant reçu", ...series.map((s) => s.label)],
      points.map((x) => [euros(x), ...series.map((s) => pourcent(s.f(x)))]),
    );
  };

  const rendu = () => {
    const situation = lire();
    if (situation.nbParents !== nbParents) {
      nbParents = situation.nbParents;
      courbe.redessiner();
      legenderCourbe();
    }
    const { avant, apres, ecart } = comparer(situation, reference.calculer, reforme.calculer);
    const verdict = Math.abs(ecart) < 1 ? "egal" : ecart < 0 ? "moins" : "plus";

    const tampon = h(
      "p",
      { class: `tampon ${verdict === "moins" ? "tampon--actifs" : verdict === "egal" ? "tampon--neutre" : ""}` },
      { moins: "Vous paieriez moins", plus: "Vous paieriez plus", egal: "Rien ne change" }[verdict],
    );

    const phrase =
      avant.recu === 0
        ? "Indiquez un montant pour voir le calcul."
        : verdict === "egal"
          ? `Sur ${euros(avant.recu)} reçus, votre impôt reste de ${euros(avant.impot)}.`
          : `Sur ${euros(avant.recu)} reçus, vous garderiez ${euros(apres.net)} au lieu de ${euros(avant.net)}, soit ${ecartEuros(-ecart)}.`;

    const postes = apres.postes.filter((p) => p.montant > 0.5);
    remplir(
      sortie,
      tampon,
      h(
        "dl",
        { class: "comparatif" },
        h("div", {}, h("dt", {}, reference.label), h("dd", {}, euros(avant.impot), h("span", { class: "sous" }, `${pourcent(avant.tauxMoyen)} de ce que vous recevez`))),
        h("div", {}, h("dt", {}, `Avec l'${reforme.labelCourt}`), h("dd", {}, euros(apres.impot), h("span", { class: "sous" }, `${pourcent(apres.tauxMoyen)} de ce que vous recevez`))),
      ),
      h("p", { class: "resultat__phrase" }, phrase),
      postes.length > 1 ? h("p", { class: "resultat__detail" }, `Dont ${postes.map((p) => `${p.label.charAt(0).toLowerCase()}${p.label.slice(1)} : ${euros(p.montant)}`).join(" ; ")}.`) : null,
    );
    if (verdict !== dernierVerdict) rejouer(tampon);
    dernierVerdict = verdict;
    courbe.marquer(situation.montant + situation.assuranceVie || null);
  };

  surChangement(form, rendu);
  legenderCourbe();
  rendu();
}

const unDecimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
function montantCourt(x) {
  if (x >= 1e6) return `${unDecimal.format(x / 1e6)} M€`;
  return `${nombre(Math.round(x / 1000))} k€`;
}

function seuilDeBascule(fAvant, fApres) {
  for (let x = COURBE.xMin; x <= COURBE.xMax; x *= 1.02) if (fApres(x) > fAvant(x)) return x;
  return null;
}
