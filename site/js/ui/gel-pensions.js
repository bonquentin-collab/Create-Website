// Onglet « Gel des hautes pensions » : ne pas revaloriser la pension de base au-delà d'un seuil de pension
// totale, reverser l'économie aux actifs par une baisse de CSG, et montrer ce que cela représente pour un retraité.

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { economieGel, perteMensuelle, trajectoireEconomie, valeurTrimestre, partDeBase } from "../engine/gel-pensions.js";
import { ipp129 } from "../params/ipp-retraites.js";
import { gainBaisseCsg } from "../engine/prelevements.js";
import { effetCsgRetraites } from "../engine/niveau-de-vie.js";
import { gel } from "../params/gel-pensions.js";
import { csg } from "../params/prelevements.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { logement } from "../params/logement.js";
import { contexte } from "../params/contexte-retraites.js";
import { publier } from "./etat-reformes.js";
import { memoriserFormulaire } from "./etat-bilan.js";

const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const deuxDecimales = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const pt = (t) => `${virgule.format(t * 100)} %`;
const troisDecimales = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const ANNEES = 10; // horizon : de 2026 à 2036

export function monter(racine) {
  const curseurSeuil = h("input", { type: "range", id: "g-seuil", name: "seuil", min: 1500, max: 4000, step: 100, value: 2000 });
  const sortieSeuil = h("output", { for: "g-seuil" });
  const curseurTaux = h("input", { type: "range", id: "g-taux", name: "taux", min: 0.1, max: 6, step: 0.1, value: gel.revalorisation2027 * 100 });
  const sortieTaux = h("output", { for: "g-taux" });
  const champPension = h("input", { id: "g-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "2 500" });
  const champSalaire = h("input", { id: "g-salaire", name: "salaire", inputmode: "decimal", autocomplete: "off", value: "2 100" });
  const caseFuturs = h("input", { type: "checkbox", id: "g-futurs", name: "futurs" });

  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h("div", { class: "champ" }, h("label", { for: "g-seuil" }, "Geler au-delà d'une pension totale brute de ", sortieSeuil), curseurSeuil),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "g-taux" }, "Revalorisation non versée : ", sortieTaux),
      curseurTaux,
      h("p", { class: "aide" }, `Les pensions de base suivent l'inflation : ${pt(gel.revalorisation2026)} en 2026, ${pt(gel.revalorisation2024)} en 2024, environ ${pt(gel.revalorisation2027)} prévus au 1er janvier 2027.`),
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
    h(
      "div",
      { class: "champ" },
      h("label", { class: "case-a-cocher" }, caseFuturs, "Appliquer aussi aux futurs retraités (baisse du taux d'annuité à la liquidation)"),
      h("p", { class: "aide" }, "Sans cela, les nouveaux retraités au-dessus du seuil partent avec une pension calculée comme avant, et l'économie s'éteint peu à peu. L'IPP juge la sous-indexation cohérente seulement si l'on ajuste aussi la pension de départ."),
    ),
    h("div", { class: "champ" }, h("label", { for: "g-pension" }, "Votre pension brute mensuelle totale"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
    h("div", { class: "champ" }, h("label", { for: "g-salaire" }, "Le salaire net d'un actif, pour comparer"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
    h(
      "details",
      { class: "avance" },
      h("summary", {}, "Pension de base et complémentaire"),
      h(
        "p",
        { class: "aide" },
        `Seule la pension de base est gelée ; les complémentaires (Agirc-Arrco…) fixent leur revalorisation elles-mêmes. La part de base baisse quand la pension monte : environ ${pct0.format(gel.profilBase.base)} jusqu'à ${euros(gel.profilBase.jusqua)}, ${pct0.format(gel.profilBase.haut)} au-delà de ${euros(gel.profilBase.apartirDe)} (calage sur l'IPP, voir Méthode).`,
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
        "L'Institut des politiques publiques (IPP) nuance en 2026. Ne pas revaloriser toutes les pensions pèse davantage sur les retraités modestes. Cibler les pensions élevées touche plutôt les plus aisés, mais imparfaitement : le gel vise la pension de chacun, alors que le niveau de vie se mesure par ménage, si bien qu'une partie de l'effort retombe sur des ménages modestes. Les tout plus riches perdent moins, car leurs revenus viennent surtout des complémentaires et du patrimoine. Enfin, moduler la revalorisation selon le montant s'éloigne du principe contributif : une pension reflète ce que l'on a cotisé. ",
        h("a", { href: gel.ipp.url }, "Lire le rapport de l'IPP"),
        ".",
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
    const partBase = gel.profilBase;
    const mode = form.querySelector('input[name="mode"]:checked').value;
    const futurs = caseFuturs.checked;
    sortieSeuil.textContent = euros(seuil);
    sortieTaux.textContent = pt(taux);

    const reglages = { seuil, taux, partBase, mode };
    const r = economieGel(gel.distribution2020, { ...reglages, retraites: gel.retraites.valeur, facteur: gel.facteur });
    const pension = lireMontant(champPension.value);
    const perte = perteMensuelle(pension, reglages);
    const baisseCsgActifs = (r.economie * gel.ipp.effetNet) / csg.activite.valeurPoint;
    const gainActif = gainBaisseCsg(lireMontant(champSalaire.value), baisseCsgActifs, csg, macro.ratioNetSurBrut.valeur);

    // Ce que la perte représente dans l'épargne d'un retraité à cette pension (ordre de grandeur).
    const netMensuel = pension * (1 - gel.prelevementsTauxNormal);
    const epargneMensuelle = netMensuel * gel.epargne.plus70;
    const perteNette = perte * (1 - gel.prelevementsTauxNormal);

    const traj = trajectoireEconomie(r.economie, { annee: ANNEES, sortie: gel.sortieAnnuelle, futurs });
    const trajAutre = trajectoireEconomie(r.economie, { annee: ANNEES, sortie: gel.sortieAnnuelle, futurs: !futurs });
    const trimestreAvant = valeurTrimestre(gel.ipp);
    // Réduction du taux d'annuité : toute la revalorisation en mode « tout », la part au-delà du seuil sinon
    // (calculée alors pour la pension saisie).
    const pensionSaisie = lireMontant(champPension.value);
    const reduction = mode === "tout" ? taux : pensionSaisie > seuil ? (taux * (pensionSaisie - seuil)) / pensionSaisie : null;
    const trimestreApres = reduction == null ? null : valeurTrimestre(gel.ipp, reduction);
    const tampon = h("p", { class: "tampon tampon--actifs" }, `+${milliards(r.economie)} par an`);
    remplir(
      resultat,
      tampon,
      h(
        "p",
        { class: "resultat__phrase" },
        `Environ ${pct0.format(r.part)} des retraités (${virgule.format(r.concernes / 1e6)} millions) touchent plus de ${euros(seuil)} brut par mois. Sans revalorisation de leur pension de base, les régimes de retraite économiseraient ${milliards(r.economie)} la première année. Pour l'ensemble des finances publiques, le gain net serait plutôt de ${milliards(r.economie * gel.ipp.effetNet)} : des pensions plus faibles rapportent aussi moins d'impôt et de CSG.`,
      ),
      h(
        "dl",
        { class: "comparatif" },
        h(
          "div",
          {},
          h("dt", {}, `Économie en ${2026 + ANNEES}`),
          h("dd", {}, milliards(traj.annee), h("span", { class: "sous" }, futurs ? `futurs retraités inclus (${milliards(trajAutre.annee)} sans eux)` : `retraités actuels seulement (${milliards(trajAutre.annee)} avec les futurs)`)),
        ),
        h("div", {}, h("dt", {}, `Cumul 2026-${2026 + ANNEES}`), h("dd", {}, milliards(traj.cumul), h("span", { class: "sous" }, `contre ${milliards(trajAutre.cumul)} ${futurs ? "sans" : "avec"} les futurs retraités`))),
      ),
      futurs && trimestreApres != null
        ? h(
            "p",
            { class: "resultat__detail" },
            `Valeur d'un trimestre validé pour un futur retraité ${mode === "tout" ? "au-dessus du seuil" : `à ${euros(pensionSaisie)} de pension`}, dans le régime de base : ${troisDecimales.format(trimestreApres * 100)} % du salaire de référence au lieu de ${troisDecimales.format(trimestreAvant * 100)} % (taux plein de 50 % réparti sur 172 trimestres).`,
          )
        : null,
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
        "Calé sur l'IPP (2026, microsimulation pour 2027) : avec 2,5 % de revalorisation non versée, 5,2 Md€ nets pour toutes les pensions, 3,7 au-delà de la médiane (1 639 €), 2,8 au-delà de 2 000 €, 1,2 au-delà de 3 000 €. Gain net : environ 20 % de moins que l'économie des régimes ; c'est lui qui est reversé aux actifs. Sans les futurs retraités, environ 3 % des retraités concernés sortent chaque année (décès). La perte vient d'une revalorisation non versée : la pension ne baisse pas, elle ne suit pas les prix cette année-là.",
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
      }, r.economie * gel.ipp.effetNet),
      bilan: {
        usagePrincipal: "actifs",
        net: r.economie * gel.ipp.effetNet,
        usages: { actifs: r.economie * gel.ipp.effetNet },
        ressources: [],
        reglages: [`Pensions gelées au-delà de ${euros(seuil)} brut par mois`, mode === "tout" ? "toute la pension de base" : "seulement la part au-dessus du seuil", "gain net reversé aux actifs en baisse de CSG"],
        details: { economie: r.economie, seuil },
      },
    });
  };

  memoriserFormulaire(form, "retraites-gel", "gel");
  surChangement(form, rendu);
  rendu();
}

function chiffre(titre, valeur, detail) {
  return h("div", { class: "chiffre" }, h("dt", {}, titre), h("dd", {}, valeur, h("span", { class: "sous" }, detail)));
}
