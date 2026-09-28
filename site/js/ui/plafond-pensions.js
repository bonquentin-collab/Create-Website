// Onglet « Plafond des pensions » : aucune pension totale au-delà d'un plafond choisi ; l'économie est répartie
// par l'utilisateur entre le salaire net des actifs et des services publics (répartiteur commun du site).

import { h, remplir, surChangement, formaterALaSortie } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { economiePlafond, pertePlafond } from "../engine/plafond.js";
import { effetFinancement } from "../engine/niveau-de-vie.js";
import { gel } from "../params/gel-pensions.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { creerRepartiteur } from "./composants/repartiteur.js";
import { publier } from "./etat-reformes.js";

const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MODELES = [
  { id: "actifs", label: "Tout pour les salaires", parts: { actifs: 1 } },
  { id: "moitie", label: "Moitié salaires, moitié services publics", parts: { actifs: 3, ecole: 1, hopital: 1, ecologie: 1 } },
  { id: "services", label: "Tout pour l'école et l'hôpital", parts: { ecole: 1, hopital: 1 } },
  { id: "vide", label: "Tout remettre à zéro", parts: {} },
];

export function monter(racine) {
  const curseur = h("input", { type: "range", id: "pl-plafond", name: "plafond", min: 2500, max: 8000, step: 250, value: 4000 });
  const sortie = h("output", { for: "pl-plafond" });
  const champPension = h("input", { id: "pl-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "5 000" });
  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h("div", { class: "champ" }, h("label", { for: "pl-plafond" }, "Plafond de la pension totale brute : ", sortie), curseur, h("p", { class: "aide" }, "Base et complémentaire additionnées, par personne et par mois. Au-delà, la pension est ramenée au plafond.")),
    h("div", { class: "champ" }, h("label", { for: "pl-pension" }, "Votre pension brute mensuelle totale"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite" });
  const zoneRepartiteur = h("div");

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h("p", {}, "Et si aucune pension ne pouvait dépasser un certain montant ? Toute pension au-delà du plafond serait ramenée à ce plafond. Ce simulateur calcule l'économie et vous laisse décider de son usage : salaires des actifs ou services publics."),
    ),
    h("div", { class: "simulateur" }, form, resultat),
    h("h3", { class: "titre-graphique" }, "À quoi servirait l'économie ?"),
    zoneRepartiteur,
  );
  formaterALaSortie(champPension, lireMontant, nombre);

  let economie = 0;
  let versementActifs = 0;
  const publierEffet = () =>
    publier("plafond", {
      label: `Plafond des pensions à ${euros(Number(curseur.value))} (${milliards(economie)})`,
      ...effetFinancement({ baissePensions: economie / niveauDeVie.pensionsTotales.valeur, hausseCotisations: 0 }, versementActifs, {
        ratioNetSurBrut: macro.ratioNetSurBrut.valeur,
        composition: niveauDeVie.composition,
        masseSalarialeBrute: macro.masseSalarialeBrute.valeur / 1e9,
      }),
    });

  const repartiteur = creerRepartiteur(zoneRepartiteur, {
    prefixe: "pl",
    cleLien: "plafond",
    modeles: MODELES,
    phrase: (enveloppe) => `Le plafond libère ${milliards(enveloppe)} par an.`,
    noteActifs: "Versé aux personnes en emploi, par une hausse du salaire net.",
    surChangement: (r) => {
      versementActifs = r.actifs ?? 0;
      publierEffet();
    },
  });

  const rendu = () => {
    const plafond = Number(curseur.value);
    sortie.textContent = euros(plafond);
    const r = economiePlafond(gel.distribution2020, { plafond, retraites: gel.retraites.valeur, facteur: gel.facteur2026 });
    economie = r.economie;
    const pension = lireMontant(champPension.value);
    const perte = pertePlafond(pension, plafond);
    remplir(
      resultat,
      h("p", { class: "tampon tampon--actifs" }, `+${milliards(r.economie)} par an`),
      h(
        "p",
        { class: "resultat__phrase" },
        `Environ ${pourcent(r.part)} des retraités (${r.concernes >= 1e6 ? `${virgule.format(r.concernes / 1e6)} million${r.concernes >= 2e6 ? "s" : ""}` : `${nombre(Math.round(r.concernes / 1000) * 1000)}`}) touchent plus de ${euros(plafond)} brut par mois. Ramener leur pension au plafond économiserait ${milliards(r.economie)} par an, ${pourcent(r.economie / r.masseTotale)} de l'ensemble des pensions.`,
      ),
      h(
        "dl",
        { class: "comparatif" },
        h("div", {}, h("dt", {}, "Votre pension"), h("dd", {}, perte > 0 ? ecartEuros(-perte) : "0 €", h("span", { class: "sous" }, perte > 0 ? `brut par mois, soit ${euros(plafond)} au lieu de ${euros(pension)}` : "vous êtes sous le plafond"))),
        h("div", {}, h("dt", {}, "Retraités concernés"), h("dd", {}, pourcent(r.part), h("span", { class: "sous" }, "des retraités de droit direct"))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        "Estimation du site : distribution des pensions de la Drees (fin 2020) portée aux montants de 2026, 17,3 millions de retraités. Au-delà de 5 350 € environ, la Drees ne détaille plus la distribution : le calcul y suppose une pension moyenne d'environ 7 100 €, ce qui rend l'estimation plus fragile pour les plafonds élevés. Sans effet sur les comportements ni contentieux juridique (un plafond rétroactif sur des droits acquis serait contesté).",
      ),
    );
    repartiteur.definirBaissePensions(r.economie / r.masseTotale);
    repartiteur.definirEnveloppe(r.economie);
    publierEffet();
  };

  surChangement(form, rendu);
  rendu();
}
