// Santé › Simuler : faire davantage contribuer les retraités qui le peuvent au financement de l'assurance maladie
// (CSG alignée, cotisation maladie sur les pensions de base) et protéger les ménages dont les dépenses de santé pèsent
// le plus (bouclier). Effort avant/après par niveau de vie, recettes, coût, gagnants et perdants.

import { h, remplir, surChangement, formaterALaSortie } from "./dom.js";
import { euros, ecartEuros, milliards, lireMontant, nombre } from "../engine/format.js";
import { groupesEffort, coutBouclier, recettesRetraites, effortAjouteRetraites, perteRetraiteSante } from "../engine/sante-reformes.js";
import { barresEmpilees } from "./graphiques/barres-empilees.js";
import { tableDonnees } from "./graphiques/colonnes.js";
import { sante } from "../params/sante.js";
import { santeReformes as sr } from "../params/sante-reformes.js";
import { csg } from "../params/prelevements.js";
import { gel } from "../params/gel-pensions.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";

const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const pct1 = (v) => `${virgule.format(v)} %`;
const millions = (v) => `${virgule.format(v / 1e6)} million${v >= 2e6 ? "s" : ""}`;
const HACHURE = (c) => `repeating-linear-gradient(135deg, ${c} 0 5px, color-mix(in srgb, ${c} 55%, transparent) 5px 9px)`;
const SEGMENTS_EFFORT = [
  { id: "secu", label: "Financement de la Sécurité sociale (cotisations maladie, CSG, taxes)", couleur: "var(--serie-actuel)" },
  { id: "complementaire", label: "Primes de complémentaire santé", couleur: "var(--poste-recherche)" },
  { id: "patient", label: "Restes à charge", couleur: "var(--serie-tampon)" },
  { id: "ajout", label: "Ajouté par la réforme", couleur: HACHURE("var(--poste-education)") },
];

export function monter(racine) {
  const caseCsg = h("input", { type: "checkbox", id: "s-csg", name: "csg", checked: true });
  const curseurCot = h("input", { type: "range", id: "s-cot", name: "cotisation", min: 0, max: 3, step: 0.1, value: 1 });
  const sortieCot = h("output", { for: "s-cot" });
  const caseBouclier = h("input", { type: "checkbox", id: "s-bouclier", name: "bouclier", checked: true });
  const curseurPlafond = h("input", { type: "range", id: "s-plafond", name: "plafond", min: 5, max: 20, step: 1, value: 10 });
  const sortiePlafond = h("output", { for: "s-plafond" });
  const champPension = h("input", { id: "s-pension", name: "pension", inputmode: "decimal", autocomplete: "off", value: "2 500" });
  const choixTaux = h(
    "select",
    { id: "s-taux", name: "taux" },
    csg.retraites.taux.map((t) => h("option", { value: t.id, selected: t.id === "normal" }, t.label)),
  );
  const normal = csg.retraites.taux.find((t) => t.id === "normal").taux;

  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    h(
      "div",
      { class: "champ" },
      h(
        "label",
        { class: "case-a-cocher" },
        caseCsg,
        h("span", {}, `Aligner la CSG des pensions au taux normal sur celle des salaires (${pct1(normal * 100)} → ${pct1(csg.activite.taux * 100)})`, h("span", { class: "aide" }, "Pour les retraités au taux normal seulement : les petites et moyennes pensions gardent leurs taux réduits.")),
      ),
    ),
    h(
      "div",
      { class: "champ" },
      h("label", { for: "s-cot" }, "Cotisation maladie sur les pensions de base : ", sortieCot),
      curseurCot,
      h(
        "p",
        { class: "aide" },
        `Elle existe déjà à ${pct1(sr.cotisationMaladie.complementaires * 100)} sur les retraites complémentaires, pour les retraités au taux médian ou normal de CSG. Jusqu'en 1998, les pensions de base en supportaient une aussi. Même règle ici : les retraités exonérés ou au taux réduit ne paient rien.`,
      ),
    ),
    h(
      "div",
      { class: "champ" },
      h(
        "label",
        { class: "case-a-cocher" },
        caseBouclier,
        h("span", {}, "Créer un bouclier santé", h("span", { class: "aide" }, "L'Assurance maladie prend en charge les primes de complémentaire et restes à charge au-delà d'une part du revenu.")),
      ),
      h("label", { for: "s-plafond" }, "Plafond d'effort : ", sortiePlafond, " du revenu"),
      curseurPlafond,
    ),
    h("div", { class: "champ" }, h("label", { for: "s-pension" }, "Votre pension brute mensuelle totale"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
    h("div", { class: "champ" }, h("label", { for: "s-taux" }, "Votre taux de CSG"), choixTaux),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite" });
  const zoneEffort = h("div");
  const phraseEffort = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const tableEffort = h("div");
  const zoneBouclier = h("div");
  const phraseBouclier = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const tableBouclier = h("div");

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h(
        "p",
        {},
        "Les retraités consomment une grande part des soins, mais contribuent moins que les actifs au financement de l'Assurance maladie : leur CSG est plus faible et ils ne paient pas de cotisation maladie sur leur pension de base. En revanche, primes de complémentaire et restes à charge pèsent lourd pour les plus âgés et les plus modestes. Ce simulateur combine les deux idées : faire contribuer davantage les retraités qui le peuvent, et protéger ceux pour qui la santé coûte le plus.",
      ),
    ),
    h("div", { class: "simulateur" }, form, resultat),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Taux d'effort pour la santé, avant et après"),
        h("p", { class: "sous-titre" }, `Part du revenu consacrée à la santé selon le niveau de vie, ${sante.effort.annee}, et ce qu'ajouteraient la CSG et la cotisation choisies (hachures).`),
      ),
      zoneEffort,
      phraseEffort,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableEffort),
      h(
        "p",
        { class: "note" },
        "Source : ",
        h("a", { href: sante.effort.url }, sante.effort.source),
        ". Ajout de la réforme : estimation du site (pensions = 78 % du revenu des retraités, COR ; pension de base = deux tiers de la pension, IPP ; part des retraités de chaque niveau de vie soumise à chaque taux estimée d'après les seuils de CSG). Le bouclier n'est pas reporté ici, faute de données croisées : voir le graphique suivant.",
      ),
    ),
    h(
      "figure",
      { class: "graphique" },
      h(
        "figcaption",
        {},
        h("h3", { class: "titre-graphique" }, "Le bouclier : ce que les ménages les plus exposés cessent de payer"),
        h("p", { class: "sous-titre" }, `Primes de complémentaire et restes à charge en part du revenu, ménages classés du moins au plus exposé, ${sr.effortPrive.annee}.`),
      ),
      zoneBouclier,
      phraseBouclier,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableBouclier),
      h("p", { class: "note" }, "Source : ", h("a", { href: sr.effortPrive.url }, sr.effortPrive.source), ". Moyennes de chaque groupe ; les groupes du haut sont découpés à partir des moyennes emboîtées publiées (top 10 %, 5 %, 2 %, 1 %)."),
    ),
  );
  formaterALaSortie(champPension, lireMontant, nombre);

  const groupes = groupesEffort(sr.effortPrive);
  const depenseTotale = (sr.effortPrive.depenseMoyenneMenage * sr.menages.valeur * sr.evolution2019_2024) / 1e9;
  const ctx = { csg, partBase: gel.partBase, partPensions: niveauDeVie.composition.partPensions, exposition: sr.exposition };
  const rep = csg.retraites.repartitionRetraites;
  const retraites = gel.retraites.valeur;

  const rendu = () => {
    const leviers = { csgAlignee: caseCsg.checked, cotisation: Number(curseurCot.value) / 100 };
    const bouclierActif = caseBouclier.checked;
    const plafond = Number(curseurPlafond.value);
    curseurPlafond.disabled = !bouclierActif;
    sortieCot.textContent = pct1(leviers.cotisation * 100);
    sortiePlafond.textContent = pct1(plafond);

    const r = recettesRetraites(leviers, ctx);
    const b = bouclierActif ? coutBouclier(groupes, { plafond, moyenne: sr.effortPrive.moyenne, depenseTotale, menages: sr.menages.valeur }) : { cout: 0, menages: 0, partRetraites: 0, partRetraitesModestes: 0 };
    const net = r.total - b.cout;
    const deficit = sr.deficitMaladie.valeur;
    const perdantsCsg = leviers.csgAlignee ? rep.normal * retraites : 0;
    const perdantsCot = leviers.cotisation > 0 ? (rep.median + rep.normal) * retraites : 0;
    const pension = lireMontant(champPension.value);
    const perte = perteRetraiteSante(pension, choixTaux.value, leviers, ctx);
    // Solde pour l'ensemble des retraités : ce qu'ils versent en plus, moins la part du bouclier qui leur revient.
    const soldeRetraites = r.total - b.cout * b.partRetraites;

    remplir(
      resultat,
      h("p", { class: `tampon ${net >= 0 ? "tampon--actifs" : "tampon--neutre"}` }, `${net >= 0 ? "+" : "−"}${milliards(Math.abs(net))} par an`),
      h(
        "p",
        { class: "resultat__phrase" },
        `Les retraités verseraient ${milliards(r.total)} de plus à l'Assurance maladie (${milliards(r.csg)} de CSG, ${milliards(r.cotisation)} de cotisation).${bouclierActif ? ` Le bouclier coûterait environ ${milliards(b.cout)} et protégerait ${millions(b.menages)} de ménages.` : ""} ${net >= 0 ? `Le déficit de la branche maladie (${milliards(Math.abs(deficit))} en 2026) serait réduit de ${pct0.format(net / Math.abs(deficit))}.` : `Le déficit de la branche maladie (${milliards(Math.abs(deficit))} en 2026) se creuserait.`}`,
      ),
      h(
        "dl",
        { class: "comparatif" },
        h("div", {}, h("dt", {}, "Votre pension"), h("dd", {}, perte > 0 ? ecartEuros(-perte) : "0 €", h("span", { class: "sous" }, perte > 0 ? `brut par mois (${ecartEuros(-perte * 12)} par an)` : "votre taux de CSG n'est pas concerné"))),
        h("div", {}, h("dt", {}, "Retraités qui paient plus"), h("dd", {}, millions(Math.max(perdantsCsg, perdantsCot)), h("span", { class: "sous" }, "ceux au taux médian ou normal de CSG"))),
        bouclierActif
          ? h("div", {}, h("dt", {}, "Ménages protégés"), h("dd", {}, millions(b.menages), h("span", { class: "sous" }, `dont ${pct0.format(b.partRetraites)} de l'aide pour des ménages de retraités, ${pct0.format(b.partRetraitesModestes)} pour des retraités modestes`)))
          : null,
        h("div", {}, h("dt", {}, "Solde pour les retraités"), h("dd", {}, `${soldeRetraites >= 0 ? "−" : "+"}${milliards(Math.abs(soldeRetraites))}`, h("span", { class: "sous" }, soldeRetraites >= 0 ? "versé en plus, net de ce que le bouclier leur rend" : "reçu en plus : le bouclier leur rend davantage"))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        `Estimation du site. Recettes : assiettes de CSG des pensions calées sur l'IPP, note n° 129 (taux normal ${milliards(csg.retraites.assiettes.normal)}, médian ${milliards(csg.retraites.assiettes.median)}), pension de base = deux tiers (IPP). Bouclier : répartition de la Drees (2019) portée à ${milliards(depenseTotale)} de primes et restes à charge, revenus supposés égaux entre groupes, ce qui majore probablement le coût ; sans effet sur les comportements (prix des complémentaires, consommation de soins). Retraités concernés : répartition des retraités du régime général par taux de CSG (Cnav, 2024).`,
      ),
    );

    // Effort avant/après : les leviers n'augmentent que l'effort des retraités.
    const ajout = effortAjouteRetraites(leviers, ctx);
    const { effort } = sante;
    const lignes = effort.niveaux.flatMap((n, i) => [
      { label: "Actifs en emploi", groupe: `${n.label} (${n.aide})`, valeurs: { secu: effort.actifs.amo[i], complementaire: effort.actifs.primes[i], patient: effort.actifs.reste[i] } },
      { label: "Retraités", groupe: `${n.label} (${n.aide})`, valeurs: { secu: effort.retraites.amo[i], complementaire: effort.retraites.primes[i], patient: effort.retraites.reste[i], ajout: ajout[i] } },
    ]);
    barresEmpilees(zoneEffort, { segments: SEGMENTS_EFFORT, lignes, format: pct1, max: 19, etiquetteMin: 0.2 });
    const ecartAvant = effort.actifs.total[4] - effort.retraites.total[4];
    const ecartApres = ecartAvant - ajout[4];
    phraseEffort.textContent = `Chez les très aisés, les actifs consacrent ${pct1(effort.actifs.total[4])} de leur revenu à la santé, les retraités ${pct1(effort.retraites.total[4])}. Après réforme : ${pct1(effort.retraites.total[4] + ajout[4])} pour les retraités, soit un écart ramené de ${virgule.format(ecartAvant)} à ${virgule.format(ecartApres)} point${Math.abs(ecartApres) >= 2 ? "s" : ""}. Les retraités très modestes ne paient rien de plus.`;
    tableDonnees(
      tableEffort,
      ["Niveau de vie", "Actifs en emploi", "Retraités avant", "Retraités après"],
      effort.niveaux.map((n, i) => [n.label, pct1(effort.actifs.total[i]), pct1(effort.retraites.total[i]), pct1(effort.retraites.total[i] + ajout[i])]),
    );

    // Bouclier : effort privé par groupe, part au-delà du plafond prise en charge.
    const lignesB = groupes.map((g) => {
      const pris = bouclierActif ? Math.max(0, g.effort - plafond) : 0;
      return { label: g.label, valeurs: { paye: g.effort - pris, pris } };
    });
    barresEmpilees(zoneBouclier, {
      segments: [
        { id: "paye", label: "Reste payé par le ménage (primes et restes à charge)", couleur: "var(--serie-tampon)" },
        { id: "pris", label: "Pris en charge par le bouclier", couleur: HACHURE("var(--serie-actifs)") },
      ],
      lignes: lignesB,
      format: pct1,
      max: 28,
      etiquetteMin: 0.12,
    });
    const top = groupes.at(-1);
    phraseBouclier.textContent = bouclierActif
      ? `Pour le 1 % de ménages le plus exposé, primes et restes à charge atteignent en moyenne ${pct1(top.effort)} du revenu ; le bouclier les ramènerait à ${pct1(Math.min(top.effort, plafond))}. Plus de la moitié de ces ménages sont des retraités modestes.`
      : "Sans bouclier : pour le 1 % de ménages le plus exposé, primes et restes à charge atteignent en moyenne 27 % du revenu. Plus de la moitié de ces ménages sont des retraités modestes.";
    tableDonnees(
      tableBouclier,
      ["Ménages (du moins au plus exposé)", "Effort avant", "Effort après", "Dont retraités modestes"],
      groupes.map((g) => [g.label, pct1(g.effort), pct1(bouclierActif ? Math.min(g.effort, plafond) : g.effort), pct0.format(g.retraitesModestes)]),
    );
  };

  surChangement(form, rendu);
  rendu();
}
