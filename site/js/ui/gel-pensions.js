// Onglet « Gel des hautes pensions » : ne pas revaloriser la pension de base au-delà d'un seuil de pension
// totale, reverser l'économie aux actifs par une baisse de CSG, et montrer ce que cela représente pour un retraité.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { economieGel, perteMensuelle } from "../engine/gel-pensions.js";
import { gainBaisseCsg } from "../engine/prelevements.js";
import { effetCsgRetraites } from "../engine/niveau-de-vie.js";
import { gel } from "../params/gel-pensions.js";
import { csg } from "../params/prelevements.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { logement } from "../params/logement.js";
import { contexte } from "../params/contexte-retraites.js";
import { publier } from "./etat-reformes.js";

const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const deuxDecimales = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const pt = (t) => `${virgule.format(t * 100)} %`;

export function monter(racine) {
  const curseurSeuil = h("input", { type: "range", id: "g-seuil", name: "seuil", min: 1500, max: 4000, step: 100, value: 2000 });
  const sortieSeuil = h("output", { for: "g-seuil" });
  const curseurTaux = h("input", { type: "range", id: "g-taux", name: "taux", min: 0.1, max: 6, step: 0.1, value: gel.revalorisation2026 * 100 });
  const sortieTaux = h("output", { for: "g-taux" });
  const curseurBase = h("input", { type: "range", id: "g-base", name: "base", min: 50, max: 100, step: 5, value: gel.partBase * 100 });
  const sortieBase = h("output", { for: "g-base" });
  const champPension = h("input", { id: "g-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "2 500" });
  const champSalaire = h("input", { id: "g-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });

  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h("div", { class: "champ" }, h("label", { for: "g-seuil" }, "Geler au-delà d'une pension totale brute de ", sortieSeuil), curseurSeuil),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "g-taux" }, "Revalorisation non versée : ", sortieTaux),
      curseurTaux,
      h("p", { class: "aide" }, `Les pensions de base ont été revalorisées de ${pt(gel.revalorisation2026)} en 2026, de ${pt(gel.revalorisation2024)} en 2024. Elles suivent l'inflation.`),
    ),
    h(
      "fieldset",
      { class: "champ" },
      h("legend", {}, "Ce qui n'est pas revalorisé"),
      h(
        "div",
        { class: "choix choix--colonne" },
        h("label", {}, h("input", { type: "radio", name: "mode", value: "tout", checked: true }), "Toute la pension de base des retraités au-dessus du seuil"),
        h("label", {}, h("input", { type: "radio", name: "mode", value: "au-dela" }), "Seulement la part de pension au-dessus du seuil (pas d'effet de seuil)"),
      ),
    ),
    h("div", { class: "champ" }, h("label", { for: "g-pension" }, "Votre pension brute mensuelle totale"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
    h("div", { class: "champ" }, h("label", { for: "g-salaire" }, "Le salaire net d'un actif, pour comparer"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
    h(
      "details",
      { class: "avance" },
      h("summary", {}, "Hypothèse avancée"),
      h(
        "div",
        { class: "champ" },
        h("label", { for: "g-base" }, "Part de la pension venant des régimes de base : ", sortieBase),
        curseurBase,
        h("p", { class: "aide" }, "Seule la pension de base est gelée ; les complémentaires (Agirc-Arrco…) fixent leur revalorisation elles-mêmes. Environ 71 % pour un non-cadre du privé, moins pour un cadre, 100 % pour un fonctionnaire."),
      ),
    ),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite" });
  const retraitesConcernes = h("div", { class: "gel-contexte", "aria-live": "polite" });

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h(
        "p",
        {},
        "Chaque année, les pensions de base suivent l'inflation. Une proposition revient souvent : ne pas revaloriser les pensions les plus élevées tant que le déficit public reste important, et utiliser l'économie ailleurs. Ici, elle sert à baisser la CSG des actifs.",
      ),
      h(
        "p",
        {},
        `Ce ne serait pas une première : en 2020, les pensions de base ont été revalorisées de ${pourcent(gel.precedent2020.sous)} jusqu'à ${euros(gel.precedent2020.seuil)} de pension totale, et de seulement ${pt(gel.precedent2020.dessus)} au-delà.`,
      ),
    ),
    h("div", { class: "simulateur" }, form, resultat),
    retraitesConcernes,
  );
  formaterALaSortie(champPension, lireMontant, nombre);
  formaterALaSortie(champSalaire, lireMontant, nombre);

  let dernier = null;
  const rendu = () => {
    const seuil = Number(curseurSeuil.value);
    const taux = Number(curseurTaux.value) / 100;
    const partBase = Number(curseurBase.value) / 100;
    const mode = form.querySelector('input[name="mode"]:checked').value;
    sortieSeuil.textContent = euros(seuil);
    sortieTaux.textContent = pt(taux);
    sortieBase.textContent = pct0.format(partBase);

    const reglages = { seuil, taux, partBase, mode };
    const r = economieGel(gel.distribution2020, { ...reglages, retraites: gel.retraites.valeur, facteur: gel.facteur2026 });
    const pension = lireMontant(champPension.value);
    const perte = perteMensuelle(pension, reglages);
    const baisseCsgActifs = r.economie / csg.activite.valeurPoint;
    const gainActif = gainBaisseCsg(lireMontant(champSalaire.value), baisseCsgActifs, csg, macro.ratioNetSurBrut.valeur);

    // Ce que la perte représente dans l'épargne d'un retraité à cette pension (ordre de grandeur).
    const netMensuel = pension * (1 - gel.prelevementsTauxNormal);
    const epargneMensuelle = netMensuel * gel.epargne.plus70;
    const perteNette = perte * (1 - gel.prelevementsTauxNormal);

    const tampon = h("p", { class: "tampon tampon--actifs" }, `+${milliards(r.economie)} par an`);
    remplir(
      resultat,
      tampon,
      h(
        "p",
        { class: "resultat__phrase" },
        `Environ ${pct0.format(r.part)} des retraités (${virgule.format(r.concernes / 1e6)} millions) touchent plus de ${euros(seuil)} brut par mois. Sans revalorisation de leur pension de base, l'État et la Sécurité sociale économiseraient ${milliards(r.economie)} la première année, puis autant les années suivantes tant que le retard n'est pas rattrapé.`,
      ),
      h(
        "dl",
        { class: "comparatif" },
        h(
          "div",
          {},
          h("dt", {}, "Votre pension"),
          h("dd", {}, perte > 0 ? ecartEuros(-perte) : "0 €", h("span", { class: "sous" }, perte > 0 ? `brut par mois (${ecartEuros(-perte * 12)} par an)` : "vous êtes sous le seuil")),
        ),
        h("div", {}, h("dt", {}, "CSG des actifs"), h("dd", {}, `−${deuxDecimales.format(baisseCsgActifs)} pt`, h("span", { class: "sous" }, `soit ${ecartEuros(gainActif)} par mois sur ce salaire`))),
      ),
      perte > 0
        ? h(
            "p",
            { class: "resultat__phrase" },
            `Pour vous, cela représente ${euros(perteNette)} net par mois. Un ménage de 70 ans ou plus épargne en moyenne ${pourcent(gel.epargne.plus70)} de son revenu : à cette pension, environ ${euros(epargneMensuelle)} par mois. La perte en représenterait ${pct0.format(perteNette / epargneMensuelle)}.`,
          )
        : null,
      h(
        "p",
        { class: "resultat__detail" },
        "Estimation du site : distribution des pensions de la Drees (fin 2020) portée aux montants de 2026, 17,3 millions de retraités. La perte vient d'une revalorisation non versée : la pension ne baisse pas, elle ne suit pas les prix cette année-là.",
      ),
    );
    if (dernier !== null && Math.abs(dernier - r.economie) > 0.5) rejouer(tampon);
    dernier = r.economie;

    remplir(
      retraitesConcernes,
      h("h3", { class: "titre-graphique" }, "Et pour les retraités concernés ?"),
      h(
        "p",
        { class: "texte" },
        "Les retraités au-dessus du seuil sont, en moyenne, parmi les ménages les plus à l'aise : ils épargnent, sont propriétaires et n'ont plus d'emprunt. Ces chiffres portent sur l'ensemble des retraités ou des plus âgés ; ceux que le gel concerne ont, par définition, des pensions supérieures à la moyenne.",
      ),
      h(
        "dl",
        { class: "chiffres chiffres--gel" },
        chiffre("Part du revenu épargnée", pourcent(gel.epargne.plus70), `ménages de 70 ans ou plus ; ${pourcent(gel.epargne.cinquiemeAise)} pour les 20 % de ménages les plus aisés`),
        chiffre("Propriétaires de leur logement", pct0.format(logement.proprietaires.lignes.at(-1).v2021), `des 65 ans ou plus ; leurs emprunts ne pèsent que ${pourcent(logement.endettement.lignes.at(-1).valeur)} de leur patrimoine`),
        chiffre("Taux de pauvreté", pourcent(contexte.pauvrete.lignes.at(-1).valeur), `chez les retraités, contre ${pourcent(contexte.pauvrete.lignes[1].valeur)} dans l'ensemble de la population`),
      ),
      h(
        "p",
        { class: "note" },
        "Sources : ",
        h("a", { href: gel.epargne.url }, gel.epargne.source),
        " ; ",
        h("a", { href: logement.proprietaires.url }, "Insee, Les revenus et le patrimoine des ménages, 2024"),
        " ; ",
        h("a", { href: contexte.pauvrete.url }, contexte.pauvrete.source),
        " ; ",
        h("a", { href: gel.distribution2020.url }, gel.distribution2020.source),
        ".",
      ),
    );

    publier("gel", {
      label: `Gel des pensions au-delà de ${euros(seuil)} (${milliards(r.economie)} aux actifs)`,
      ...effetCsgRetraites(r.economie, {
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

function chiffre(titre, valeur, detail) {
  return h("div", { class: "chiffre" }, h("dt", {}, titre), h("dd", {}, valeur, h("span", { class: "sous" }, detail)));
}
