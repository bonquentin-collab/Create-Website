// Santé › Simuler : qui doit payer davantage pour l'Assurance maladie ? Les retraités qui le peuvent (CSG alignée,
// cotisation maladie sur les pensions de base), les plus gros consommateurs de soins (franchises, ticket modérateur,
// ALD), les médecins qui pratiquent des dépassements, les complémentaires santé (TSA, contrats d'entreprise) ; et qui
// protéger (bouclier). Effort ajouté par âge, par niveau de vie et par niveau de dépense ; mesure enregistrée pour le
// Bilan, avec l'affectation unique de la CSG des retraités.

import { h, remplir, surChangement, formaterALaSortie } from "./dom.js";
import { ecartEuros, euros, milliards, lireMontant, nombre } from "../engine/format.js";
import { groupesEffort, coutBouclier, recettesRetraites, effortAjouteRetraites, perteRetraiteSante, leviersUsagers, effortAjouteUsagers } from "../engine/sante-reformes.js";
import { recettesAlignement } from "../engine/bilan.js";
import { barresEmpilees } from "./graphiques/barres-empilees.js";
import { tableDonnees } from "./graphiques/colonnes.js";
import { sante } from "../params/sante.js";
import { santeReformes as sr } from "../params/sante-reformes.js";
import { csg } from "../params/prelevements.js";
import { gel } from "../params/gel-pensions.js";
import { macro } from "../params/macro.js";
import { niveauDeVie } from "../params/niveau-de-vie.js";
import { enregistrerMesure, memoriserFormulaire, lireBilan, estRetenue } from "./etat-bilan.js";
import { avisRessource } from "./avis-ressource.js";

const virgule = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct0 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });
const pct1 = (v) => `${virgule.format(v)} %`;
const pts = (v) => `${v >= 0 ? "+" : "−"}${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v))} pt`;
const signeMd = (v) => `${v >= 0 ? "+" : "−"}${milliards(Math.abs(v))}`;
const millions = (v) => `${virgule.format(v / 1e6)} million${v >= 2e6 ? "s" : ""}`;
const HACHURE = (c) => `repeating-linear-gradient(135deg, ${c} 0 5px, color-mix(in srgb, ${c} 55%, transparent) 5px 9px)`;
const SEGMENTS_EFFORT = [
  { id: "secu", label: "Financement de la Sécurité sociale (cotisations maladie, CSG, taxes)", couleur: "var(--serie-actuel)" },
  { id: "complementaire", label: "Primes de complémentaire santé", couleur: "var(--poste-recherche)" },
  { id: "patient", label: "Restes à charge", couleur: "var(--serie-tampon)" },
  { id: "ajout", label: "Ajouté par la réforme", couleur: HACHURE("var(--poste-education)") },
];
const SEGMENTS_AGE = [
  { id: "patients", label: "Payé directement par les patients", couleur: "var(--serie-tampon)" },
  { id: "primes", label: "Payé via les primes de complémentaire", couleur: "var(--poste-recherche)" },
  { id: "employeurs", label: "Payé via les salaires (contrats d'entreprise)", couleur: "var(--serie-actuel)" },
];
const MULTIPLICATEURS = [
  { valeur: "1", label: "Montants actuels (1 € par boîte, 2 € par consultation)" },
  { valeur: "1.5", label: "Montants relevés de moitié (1,50 €, 3 €)" },
  { valeur: "2", label: "Montants doublés (2 €, 4 €), comme au PLFSS 2026" },
];
// Part de chaque levier payée directement par les patients et via les primes (le reste : employeurs, médecins).
const CANAUX = {
  franchises: [1, 0],
  ticket: [sr.sansComplementaire, 1 - sr.sansComplementaire],
  ald: [sr.sansComplementaire, 1 - sr.sansComplementaire],
  depassements: [1 - sr.depassements.partComplementaires, sr.depassements.partComplementaires],
  tsa: [0, 1],
  "tsa-induite": [0, 1],
  entreprise: [0, 0],
};

export function monter(racine) {
  // ----- Champs -----
  const caseCsg = h("input", { type: "checkbox", id: "s-csg", name: "csg", checked: true });
  const avisCsg = h("div", { class: "avis", hidden: true, "aria-live": "polite" });
  const curseurCot = h("input", { type: "range", id: "s-cot", name: "cotisation", min: 0, max: 3, step: 0.1, value: 1 });
  const sortieCot = h("output", { for: "s-cot" });

  const curseurFr = h("input", { type: "range", id: "s-franchises", name: "franchises", min: 100, max: 300, step: 10, value: sr.franchises.plafondActuel });
  const sortieFr = h("output", { for: "s-franchises" });
  const choixMult = h("select", { id: "s-mult", name: "multiplicateur" }, MULTIPLICATEURS.map((m) => h("option", { value: m.valeur }, m.label)));
  const curseurTm = h("input", { type: "range", id: "s-tm", name: "ticket", min: 30, max: 50, step: 5, value: 30 });
  const sortieTm = h("output", { for: "s-tm" });
  const casesAld = sr.ald.mesures.map((m) => h("input", { type: "checkbox", name: "ald", value: m.id }));
  const curseurBaisseD = h("input", { type: "range", id: "s-dep-baisse", name: "depBaisse", min: 0, max: 50, step: 5, value: 0 });
  const sortieBaisseD = h("output", { for: "s-dep-baisse" });
  const curseurTaxeD = h("input", { type: "range", id: "s-dep-taxe", name: "depTaxe", min: 0, max: 30, step: 5, value: 0 });
  const sortieTaxeD = h("output", { for: "s-dep-taxe" });

  const curseurTsa = h("input", { type: "range", id: "s-tsa", name: "tsa", min: -3, max: 3, step: 0.5, value: 0 });
  const sortieTsa = h("output", { for: "s-tsa" });
  const curseurFs = h("input", { type: "range", id: "s-fs", name: "forfaitSocial", min: 8, max: 30, step: 1, value: 8 });
  const sortieFs = h("output", { for: "s-fs" });

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

  const groupe = (titre, aide, ...champs) => h("fieldset", { class: "groupe-leviers" }, h("legend", {}, titre), aide ? h("p", { class: "aide" }, aide) : null, ...champs);
  const curseurChamp = (id, libelle, sortie, curseur, aide) => h("div", { class: "champ" }, h("label", { for: id }, libelle, sortie), curseur, aide ? h("p", { class: "aide" }, aide) : null);

  const form = h(
    "form",
    { class: "formulaire", novalidate: true },
    groupe(
      "1. Les retraités qui le peuvent",
      null,
      h(
        "div",
        { class: "champ" },
        h(
          "label",
          { class: "case-a-cocher" },
          caseCsg,
          h("span", {}, `Aligner la CSG des pensions au taux normal sur celle des salaires (${pct1(normal * 100)} → ${pct1(csg.activite.taux * 100)})`, h("span", { class: "aide" }, "Pour les retraités au taux normal seulement : les petites et moyennes pensions gardent leurs taux réduits.")),
        ),
        avisCsg,
      ),
      curseurChamp(
        "s-cot",
        "Cotisation maladie sur les pensions de base : ",
        sortieCot,
        curseurCot,
        `Elle existe déjà à ${pct1(sr.cotisationMaladie.complementaires * 100)} sur les retraites complémentaires, pour les retraités au taux médian ou normal de CSG. Jusqu'en 1998, les pensions de base en supportaient une aussi. Les retraités exonérés ou au taux réduit ne paient rien.`,
      ),
    ),
    groupe(
      "2. Les plus gros consommateurs de soins",
      "Ces leviers font payer davantage ceux qui se soignent le plus. Les franchises sont payées par le patient lui-même ; ticket modérateur et ALD passent surtout par les complémentaires, donc par les primes de tous.",
      curseurChamp(
        "s-franchises",
        "Plafond annuel des franchises et participations forfaitaires : ",
        sortieFr,
        curseurFr,
        `${euros(sr.franchises.plafondActuel)} par an et par personne depuis le 1er octobre 2026 (70 € de franchises, 70 € de participations ; 100 € avant). Mineurs, bénéficiaires de la C2S et femmes enceintes exonérés.`,
      ),
      h("div", { class: "champ" }, h("label", { for: "s-mult" }, "Montant par boîte, acte ou consultation"), choixMult),
      curseurChamp("s-tm", "Ticket modérateur des consultations : ", sortieTm, curseurTm, "Part du tarif non remboursée par l'Assurance maladie, aujourd'hui 30 %. Patients en ALD, femmes enceintes et C2S exonérés."),
      h(
        "fieldset",
        { class: "champ" },
        h("legend", {}, "Affections de longue durée (ALD)"),
        h("div", { class: "choix choix--colonne" }, sr.ald.mesures.map((m, i) => h("label", { class: "case-a-cocher" }, casesAld[i], h("span", {}, `${m.libelle} (${milliards(m.valeur)})`)))),
        h("p", { class: "aide" }, "Pistes du PLFSS 2026, abandonnées au Parlement. Les soins liés à l'ALD restent remboursés à 100 %."),
      ),
      curseurChamp("s-dep-baisse", "Plafonner les dépassements d'honoraires : ", sortieBaisseD, curseurBaisseD, `${milliards(sr.depassements.total)} de dépassements en 2024. La baisse profite aux patients et aux complémentaires, elle est prise sur le revenu des médecins (proposition de la mission Rousset-Monnet, 2025).`),
      curseurChamp("s-dep-taxe", "Taxer les dépassements restants : ", sortieTaxeD, curseurTaxeD, "Taxe payée par les médecins sur les dépassements qu'ils facturent (hypothèse : pas de report sur les tarifs)."),
    ),
    groupe(
      "3. Les complémentaires santé",
      null,
      curseurChamp("s-tsa", "Taxe de solidarité additionnelle (TSA) : ", sortieTsa, curseurTsa, `${pct1(sr.tsa.taux * 100)} des primes aujourd'hui, ${milliards(sr.tsa.recettes2025)} en 2025. Supposée répercutée entièrement sur les primes.`),
      curseurChamp("s-fs", "Forfait social sur les contrats d'entreprise : ", sortieFs, curseurFs, `Les contributions des employeurs aux contrats santé et prévoyance (${milliards(sr.entreprise.assiette)}) échappent aux cotisations et ne paient que 8 % de forfait social : ${milliards(sr.entreprise.coutNet)} de manque à gagner net en 2026. Payé par l'employeur, reporté à terme sur les salaires.`),
    ),
    groupe(
      "4. Protéger ceux pour qui la santé coûte le plus",
      null,
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
    ),
    groupe(
      "Votre cas",
      null,
      h("div", { class: "champ" }, h("label", { for: "s-pension" }, "Votre pension brute mensuelle totale"), h("div", { class: "case" }, champPension, h("span", { "aria-hidden": "true" }, "€"))),
      h("div", { class: "champ" }, h("label", { for: "s-taux" }, "Votre taux de CSG"), choixTaux),
    ),
  );
  const resultat = h("div", { class: "resultat", "aria-live": "polite" });
  const zoneQuiPaie = h("div");
  const zoneAge = h("div");
  const phraseAge = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const tableAge = h("div");
  const zoneEffort = h("div");
  const phraseEffort = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const tableEffort = h("div");
  const zoneBouclier = h("div");
  const phraseBouclier = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const tableBouclier = h("div");

  const figure = (titre, sousTitre, ...contenu) => h("figure", { class: "graphique" }, h("figcaption", {}, h("h3", { class: "titre-graphique" }, titre), h("p", { class: "sous-titre" }, sousTitre)), ...contenu);

  racine.replaceChildren(
    h(
      "div",
      { class: "texte" },
      h(
        "p",
        {},
        "L'Assurance maladie perd près de 14 milliards d'euros par an. Qui doit faire l'effort ? Les retraités, qui consomment beaucoup de soins mais cotisent moins que les actifs ? Ceux qui se soignent le plus, au risque de pénaliser les malades ? Les médecins qui pratiquent des dépassements, les complémentaires, les entreprises ? Réglez chaque levier : le simulateur montre ce qu'il rapporte et qui le paie, selon l'âge, le niveau de vie et le niveau de dépenses de santé. Vos choix sont repris dans le ",
        h("a", { href: "bilan.html" }, "Bilan"),
        ", qui les additionne avec ceux des autres espaces sans compter deux fois la même recette.",
      ),
    ),
    h("div", { class: "simulateur" }, form, resultat),
    h("section", { class: "graphique" }, h("h3", { class: "titre-graphique" }, "Qui paie quoi, en plus ou en moins"), zoneQuiPaie),
    figure(
      "Par âge : ce que chaque personne paie en plus",
      "Euros par personne et par an, selon l'âge, pour les leviers 2 et 3 (hors CSG et cotisation des retraités, comptées plus bas).",
      zoneAge,
      phraseAge,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableAge),
      h(
        "p",
        { class: "note" },
        "Sources : ",
        h("a", { href: sante.usagers.url }, sante.usagers.source),
        " ; ",
        h("a", { href: sr.franchises.url }, sr.franchises.source),
        ". Estimation du site : franchises selon un modèle calé par âge (voir Méthode) ; ticket modérateur réparti selon le ticket modérateur payé à chaque âge, ALD selon le remboursement de l'Assurance maladie, dépassements selon les dépassements payés, hausses de primes selon la prime moyenne de chaque âge.",
      ),
    ),
    figure(
      "Par niveau de vie : taux d'effort pour la santé, avant et après",
      `Part du revenu consacrée à la santé, ${sante.effort.annee}, et ce qu'ajoutent les leviers choisis (hachures).`,
      zoneEffort,
      phraseEffort,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableEffort),
      h(
        "p",
        { class: "note" },
        "Source : ",
        h("a", { href: sante.effort.url }, sante.effort.source),
        ". Ajout : estimation du site. CSG et cotisation : pensions = 78 % du revenu des retraités (COR), pension de base = deux tiers de la pension (IPP). Autres leviers : ajoutés en proportion des restes à charge et des primes de chaque groupe, avec la part des retraités tirée de la répartition par âge. Le bouclier n'est pas reporté ici, faute de données croisées : voir le graphique suivant.",
      ),
    ),
    figure(
      "Par niveau de dépense : ce que les ménages les plus exposés paient, et ce que le bouclier leur rend",
      `Primes de complémentaire et restes à charge en part du revenu, ménages classés du moins au plus exposé, ${sr.effortPrive.annee}.`,
      zoneBouclier,
      phraseBouclier,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableBouclier),
      h("p", { class: "note" }, "Source : ", h("a", { href: sr.effortPrive.url }, sr.effortPrive.source), ". Moyennes de chaque groupe ; les groupes du haut sont découpés à partir des moyennes emboîtées publiées (top 10 %, 5 %, 2 %, 1 %). Les leviers 2 et 3 y sont ajoutés en proportion de l'effort de chaque groupe (estimation du site)."),
    ),
  );
  formaterALaSortie(champPension, lireMontant, nombre);

  const groupes = groupesEffort(sr.effortPrive);
  const depenseTotale = (sr.effortPrive.depenseMoyenneMenage * sr.menages.valeur * sr.evolution2019_2024) / 1e9;
  const ctx = { csg, partBase: gel.partBase, partPensions: niveauDeVie.composition.partPensions, exposition: sr.exposition };
  const rep = csg.retraites.repartitionRetraites;
  const retraites = gel.retraites.valeur;
  const resteTotal = sante.financeurs.lignes.find((l) => l.id === "menages").valeur;
  const primesTotal = sr.tsa.recettes2025 / sr.tsa.taux;
  const masseNette = (macro.masseSalarialeBrute.valeur / 1e9) * macro.ratioNetSurBrut.valeur;
  const revenuActifs = masseNette / niveauDeVie.composition.partActivite;
  const revenuRetraites = niveauDeVie.pensionsTotales.valeur / niveauDeVie.composition.partPensions;
  const ages = sante.usagers.lignes;
  const estRetraite = ages.map((l) => Boolean(l.retraite));

  const csgGardee = avisRessource(avisCsg, {
    ressource: "csg-pensions-normal",
    moi: "sante",
    quoi: "L'alignement de la CSG des pensions au taux normal",
    ailleurs: { csg: { texte: "dans Retraites › CSG des retraités, il baisse la CSG des actifs", lien: "retraites-simuler.html#onglet=csg" } },
    actif: () => caseCsg.checked,
    surChange: () => rendu(),
  });

  const rendu = () => {
    const csgCoche = caseCsg.checked;
    const csgTenue = csgCoche && csgGardee.tient();
    const leviers = { csgAlignee: csgTenue, cotisation: Number(curseurCot.value) / 100 };
    const choix = {
      plafondFranchises: Number(curseurFr.value),
      multiplicateur: Number(choixMult.value),
      ticketModerateur: Number(curseurTm.value) / 100,
      ald: casesAld.filter((c) => c.checked).map((c) => c.value),
      baisseDepassements: Number(curseurBaisseD.value) / 100,
      taxeDepassements: Number(curseurTaxeD.value) / 100,
      pointsTsa: Number(curseurTsa.value),
      forfaitSocial: Number(curseurFs.value) / 100,
    };
    const bouclierActif = caseBouclier.checked;
    const plafond = Number(curseurPlafond.value);
    curseurPlafond.disabled = !bouclierActif;
    sortieCot.textContent = pct1(leviers.cotisation * 100);
    sortieFr.textContent = euros(choix.plafondFranchises);
    sortieTm.textContent = pct1(choix.ticketModerateur * 100);
    sortieBaisseD.textContent = choix.baisseDepassements > 0 ? `−${pct0.format(choix.baisseDepassements)}` : "non";
    sortieTaxeD.textContent = choix.taxeDepassements > 0 ? pct0.format(choix.taxeDepassements) : "non";
    sortieTsa.textContent = `${pct1(sr.tsa.taux * 100 + choix.pointsTsa)} (${choix.pointsTsa >= 0 ? "+" : "−"}${virgule.format(Math.abs(choix.pointsTsa))} pt)`;
    sortieFs.textContent = pct1(choix.forfaitSocial * 100);
    sortiePlafond.textContent = pct1(plafond);

    const r = recettesRetraites(leviers, ctx);
    const u = leviersUsagers(choix, { sr, usagers: sante.usagers, primes: sante.primes });
    const prive = u.patients + u.primes; // ce que les ménages paient en plus, directement ou via leurs primes
    const rho = prive / depenseTotale;
    const optionsB = (k) => ({ plafond, moyenne: sr.effortPrive.moyenne * k, depenseTotale: depenseTotale * k, menages: sr.menages.valeur });
    const groupesApres = groupes.map((g) => ({ ...g, effort: g.effort * (1 + rho) }));
    const vide = { cout: 0, menages: 0, partRetraites: 0, partRetraitesModestes: 0 };
    const b0 = bouclierActif ? coutBouclier(groupes, optionsB(1)) : vide;
    const b = bouclierActif ? coutBouclier(groupesApres, optionsB(1 + rho)) : vide;
    const surcout = b.cout - b0.cout;
    const net = r.total + u.recettes - b.cout;
    const deficit = sr.deficitMaladie.valeur;
    const perdantsCsg = leviers.csgAlignee ? rep.normal * retraites : 0;
    const perdantsCot = leviers.cotisation > 0 ? (rep.median + rep.normal) * retraites : 0;
    const pension = lireMontant(champPension.value);
    const perte = perteRetraiteSante(pension, choixTaux.value, leviers, ctx);

    // Ce que paient retraités et actifs (Md€), pour les niveaux de vie et le Bilan.
    const partRetAge = (canal) =>
      u.leviers.reduce((t, l) => {
        const [pp, pm] = CANAUX[l.id] ?? [0, 0];
        const part = canal === "patients" ? pp : pm;
        return t + l.parAge.reduce((s, v, i) => s + (estRetraite[i] ? (v * part * ages[i].personnes) / 1e9 : 0), 0);
      }, 0);
    const usagersRetraites = partRetAge("patients") + partRetAge("primes");
    const usagersActifs = prive - usagersRetraites + u.employeurs;
    const payeRetraites = r.total + usagersRetraites - b.cout * b.partRetraites;
    const payeActifs = usagersActifs - b.cout * (1 - b.partRetraites);

    // Avec la TVA sociale retenue dans le Bilan, l'alignement viserait un taux plus bas.
    const etatBilan = lireBilan();
    const tva = estRetenue(etatBilan, "tva") ? etatBilan.mesures.tva?.details : null;
    const avecTva = tva && csgTenue ? recettesAlignement(csg.retraites.assiettes, csg.activite.taux - tva.baisseCsg / 100, csg).normal : null;

    remplir(
      resultat,
      h("p", { class: `tampon ${net >= 0 ? "tampon--actifs" : "tampon--neutre"}` }, `${net >= 0 ? "+" : "−"}${milliards(Math.abs(net))} par an`),
      h(
        "p",
        { class: "resultat__phrase" },
        `Pour l'Assurance maladie : ${milliards(r.total)} versés en plus par les retraités, ${signeMd(u.recettes)} par les autres leviers${bouclierActif ? `, moins ${milliards(b.cout)} pour le bouclier` : ""}. ${net >= 0 ? `Le déficit de la branche maladie (${milliards(Math.abs(deficit))} en 2026) serait réduit de ${pct0.format(net / Math.abs(deficit))}.` : `Le déficit de la branche maladie (${milliards(Math.abs(deficit))} en 2026) se creuserait.`}`,
      ),
      csgCoche && !csgTenue ? h("p", { class: "resultat__detail" }, "La CSG des retraités n'est pas comptée ici : elle sert déjà à baisser la CSG des actifs (voir l'avis dans le formulaire).") : null,
      avecTva !== null
        ? h("p", { class: "resultat__detail" }, `Attention, effet croisé : la TVA sociale réglée dans Retraites baisse la CSG des actifs à ${pct1((csg.activite.taux - tva.baisseCsg / 100) * 100)}. Aligner les retraités sur ce taux ne rapporterait plus que ${milliards(avecTva)} au lieu de ${milliards(r.csg)}. Le `, h("a", { href: "bilan.html" }, "Bilan"), " en tient compte.")
        : null,
      h(
        "dl",
        { class: "comparatif" },
        h("div", {}, h("dt", {}, "Votre pension"), h("dd", {}, perte > 0 ? ecartEuros(-perte) : "0 €", h("span", { class: "sous" }, perte > 0 ? `brut par mois (${ecartEuros(-perte * 12)} par an)` : "votre taux de CSG n'est pas concerné"))),
        h("div", {}, h("dt", {}, "Retraités qui paient plus"), h("dd", {}, millions(Math.max(perdantsCsg, perdantsCot)), h("span", { class: "sous" }, "ceux au taux médian ou normal de CSG"))),
        bouclierActif
          ? h("div", {}, h("dt", {}, "Ménages protégés"), h("dd", {}, millions(b.menages), h("span", { class: "sous" }, `dont ${pct0.format(b.partRetraites)} de l'aide pour des ménages de retraités${surcout > 0.01 ? ` ; le bouclier coûte ${milliards(surcout)} de plus à cause des autres leviers` : ""}`)))
          : null,
        h("div", {}, h("dt", {}, "Solde pour les retraités"), h("dd", {}, `${payeRetraites >= 0 ? "−" : "+"}${milliards(Math.abs(payeRetraites))}`, h("span", { class: "sous" }, payeRetraites >= 0 ? "versé en plus, net de ce que le bouclier leur rend" : "reçu en plus : le bouclier leur rend davantage"))),
      ),
      h(
        "p",
        { class: "resultat__detail" },
        `Estimation du site, sans effet sur les comportements (consommation de soins, prix des complémentaires, tarifs des médecins). Recettes de CSG calées sur l'IPP (note n° 129) ; franchises calées sur les chiffrages officiels (${sr.franchises.controles.map((c) => milliards(c.valeur)).join(" et ")}) ; bouclier d'après la Drees (2019), porté à ${milliards(depenseTotale)} de primes et restes à charge. Déjà décidé, et donc hors de ce calcul : le relèvement du ticket modérateur de 2027 (environ ${milliards(sr.ticketModerateur.decrets2027.valeur)} transférés aux complémentaires) et la contribution exceptionnelle des complémentaires en 2026 (${milliards(sr.tsa.exceptionnelle2026)}).`,
      ),
    );

    // ----- Qui paie quoi -----
    const lignesQui = [
      ["Retraités (CSG et cotisation)", r.total, "retenu sur la pension"],
      ["Patients, directement", u.patients, "franchises, part non remboursée"],
      ["Assurés, via leurs primes", u.primes, "ticket modérateur et ALD transférés, TSA"],
      ["Employeurs, puis salariés", u.employeurs, "forfait social des contrats d'entreprise"],
      ["Médecins", u.medecins, "dépassements plafonnés ou taxés"],
      ["Bouclier : rendu aux plus exposés", -b.cout, "pris en charge par l'Assurance maladie"],
    ];
    remplir(
      zoneQuiPaie,
      h(
        "div",
        { class: "defilement" },
        h(
        "table",
        { class: "table-qui-paie" },
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Qui"), h("th", { scope: "col" }, "Par an"), h("th", { scope: "col" }, "Comment"))),
        h(
          "tbody",
          {},
          lignesQui.map(([qui, v, comment]) => h("tr", {}, h("th", { scope: "row" }, qui), h("td", {}, Math.abs(v) < 0.005 ? "0" : signeMd(v)), h("td", {}, comment))),
        ),
        h("tfoot", {}, h("tr", {}, h("th", { scope: "row" }, "Gain pour l'Assurance maladie"), h("td", {}, signeMd(net)), h("td", {}, choix.baisseDepassements > 0 ? "la baisse des dépassements ne lui rapporte rien : elle allège patients et complémentaires" : ""))),
        ),
      ),
    );

    // ----- Par âge -----
    const parCanal = (canal) =>
      ages.map((_, i) =>
        u.leviers.reduce((t, l) => {
          const [pp, pm] = CANAUX[l.id] ?? [0, 0];
          const part = canal === "patients" ? pp : canal === "primes" ? pm : l.id === "entreprise" ? 1 : 0;
          return t + l.parAge[i] * part;
        }, 0),
      );
    const canaux = { patients: parCanal("patients"), primes: parCanal("primes"), employeurs: parCanal("employeurs") };
    const positif = (i) => ({ patients: Math.max(0, canaux.patients[i]), primes: Math.max(0, canaux.primes[i]), employeurs: Math.max(0, canaux.employeurs[i]) });
    barresEmpilees(zoneAge, {
      segments: SEGMENTS_AGE,
      lignes: ages.map((l, i) => ({ label: l.age, valeurs: positif(i) })),
      format: (v) => euros(v),
      max: Math.max(20, ...ages.map((_, i) => Object.values(positif(i)).reduce((t, v) => t + v, 0))) * 1.05,
      etiquetteMin: 0.15,
    });
    const total = ages.map((_, i) => canaux.patients[i] + canaux.primes[i] + canaux.employeurs[i]);
    const fr = u.leviers.find((l) => l.id === "franchises");
    phraseAge.textContent =
      Math.abs(u.recettes) < 0.005 && u.medecins === 0
        ? "Aucun levier réglé pour l'instant : déplacez les curseurs des groupes 2 et 3."
        : `Une personne de 80 ans ou plus paierait ${ecartEuros(total.at(-1))} par an, une de 31 à 40 ans ${ecartEuros(total[3])}.${Math.abs(fr.recettes) > 0.005 ? ` Les franchises pèsent d'abord sur les plus âgés et les malades chroniques : ${ecartEuros(fr.parAge.at(-1))} par an après 80 ans, contre ${ecartEuros(fr.parAge[3])} entre 31 et 40 ans.` : ""}${choix.baisseDepassements > 0 ? " La baisse des dépassements, elle, allège la facture (non représentée quand elle l'emporte)." : ""}`;
    tableDonnees(
      tableAge,
      ["Âge", "Patients", "Via les primes", "Via les salaires", "Total"],
      ages.map((l, i) => [l.age, euros(canaux.patients[i]), euros(canaux.primes[i]), euros(canaux.employeurs[i]), euros(total[i])]),
    );

    // ----- Par niveau de vie -----
    const ajoutRet = effortAjouteRetraites(leviers, ctx);
    const ajoutU = effortAjouteUsagers(u, { usagers: sante.usagers, effort: sante.effort, resteTotal, primesTotal, revenuActifs });
    const { effort } = sante;
    const ajoutA = ajoutU.actifs;
    const ajoutR = ajoutRet.map((v, i) => v + ajoutU.retraites[i]);
    const lignes = effort.niveaux.flatMap((n, i) => [
      { label: "Actifs en emploi", groupe: `${n.label} (${n.aide})`, valeurs: { secu: effort.actifs.amo[i], complementaire: effort.actifs.primes[i], patient: effort.actifs.reste[i], ajout: Math.max(0, ajoutA[i]) } },
      { label: "Retraités", groupe: `${n.label} (${n.aide})`, valeurs: { secu: effort.retraites.amo[i], complementaire: effort.retraites.primes[i], patient: effort.retraites.reste[i], ajout: Math.max(0, ajoutR[i]) } },
    ]);
    barresEmpilees(zoneEffort, { segments: SEGMENTS_EFFORT, lignes, format: pct1, max: 20, etiquetteMin: 0.2 });
    const ecartAvant = effort.actifs.total[4] - effort.retraites.total[4];
    const ecartApres = effort.actifs.total[4] + ajoutA[4] - (effort.retraites.total[4] + ajoutR[4]);
    phraseEffort.textContent = `Chez les très aisés, les actifs consacrent ${pct1(effort.actifs.total[4])} de leur revenu à la santé, les retraités ${pct1(effort.retraites.total[4])}. Après réforme : ${pct1(effort.actifs.total[4] + ajoutA[4])} et ${pct1(effort.retraites.total[4] + ajoutR[4])}, un écart de ${virgule.format(ecartApres)} point${Math.abs(ecartApres) >= 2 ? "s" : ""} (${virgule.format(ecartAvant)} avant). Chez les très modestes, les retraités paieraient ${pts(ajoutR[0])} de leur revenu, les actifs ${pts(ajoutA[0])}.`;
    tableDonnees(
      tableEffort,
      ["Niveau de vie", "Actifs avant", "Actifs après", "Retraités avant", "Retraités après"],
      effort.niveaux.map((n, i) => [n.label, pct1(effort.actifs.total[i]), pct1(effort.actifs.total[i] + ajoutA[i]), pct1(effort.retraites.total[i]), pct1(effort.retraites.total[i] + ajoutR[i])]),
    );

    // ----- Par niveau de dépense -----
    const lignesB = groupes.map((g, i) => {
      const apres = groupesApres[i].effort;
      const pris = bouclierActif ? Math.max(0, apres - plafond) : 0;
      const ajout = Math.max(0, apres - g.effort);
      return { label: g.label, valeurs: { paye: Math.min(g.effort, apres - pris), ajout: Math.max(0, ajout - pris), pris } };
    });
    barresEmpilees(zoneBouclier, {
      segments: [
        { id: "paye", label: "Payé par le ménage (primes et restes à charge)", couleur: "var(--serie-tampon)" },
        { id: "ajout", label: "Ajouté par les leviers 2 et 3", couleur: HACHURE("var(--poste-education)") },
        { id: "pris", label: "Pris en charge par le bouclier", couleur: HACHURE("var(--serie-actifs)") },
      ],
      lignes: lignesB,
      format: pct1,
      max: 30,
      etiquetteMin: 0.12,
    });
    const top = groupesApres.at(-1);
    phraseBouclier.textContent = `Pour le 1 % de ménages le plus exposé, primes et restes à charge atteignent en moyenne ${pct1(groupes.at(-1).effort)} du revenu${rho > 0.001 ? `, ${pct1(top.effort)} avec vos leviers` : ""}${bouclierActif ? ` ; le bouclier les ramènerait à ${pct1(Math.min(top.effort, plafond))}` : ""}. Plus de la moitié de ces ménages sont des retraités modestes : sans bouclier, ce sont eux que franchises et ticket modérateur toucheraient le plus.`;
    tableDonnees(
      tableBouclier,
      ["Ménages (du moins au plus exposé)", "Effort aujourd'hui", "Avec les leviers", "Après bouclier", "Dont retraités modestes"],
      groupes.map((g, i) => [g.label, pct1(g.effort), pct1(groupesApres[i].effort), pct1(bouclierActif ? Math.min(groupesApres[i].effort, plafond) : groupesApres[i].effort), pct0.format(g.retraitesModestes)]),
    );

    // ----- Bilan -----
    const reglages = [
      csgCoche ? `CSG des pensions au taux normal alignée sur 9,2 %${csgTenue ? "" : " (recette déjà utilisée ailleurs)"}` : null,
      leviers.cotisation > 0 ? `cotisation maladie de ${pct1(leviers.cotisation * 100)} sur les pensions de base` : null,
      choix.plafondFranchises !== sr.franchises.plafondActuel || choix.multiplicateur !== 1 ? `franchises : plafond ${euros(choix.plafondFranchises)}, montants ×${virgule.format(choix.multiplicateur)}` : null,
      choix.ticketModerateur > sr.ticketModerateur.tauxActuel ? `ticket modérateur des consultations à ${pct1(choix.ticketModerateur * 100)}` : null,
      choix.ald.length ? `ALD : ${sr.ald.mesures.filter((m) => choix.ald.includes(m.id)).map((m) => m.libelle.toLowerCase()).join(" ; ")}` : null,
      choix.baisseDepassements > 0 ? `dépassements plafonnés (−${pct0.format(choix.baisseDepassements)})` : null,
      choix.taxeDepassements > 0 ? `dépassements taxés à ${pct0.format(choix.taxeDepassements)}` : null,
      choix.pointsTsa !== 0 ? `TSA à ${pct1(sr.tsa.taux * 100 + choix.pointsTsa)}` : null,
      choix.forfaitSocial > sr.entreprise.forfaitSocial ? `forfait social des contrats d'entreprise à ${pct1(choix.forfaitSocial * 100)}` : null,
      bouclierActif ? `bouclier santé à ${pct1(plafond)} du revenu (${milliards(b.cout)})` : null,
    ].filter(Boolean);
    enregistrerMesure("sante", {
      espace: "sante",
      label: "Santé : financement de l'Assurance maladie",
      lien: "sante-simuler.html",
      net,
      usages: { maladie: net },
      usagePrincipal: "maladie",
      ressources: csgCoche ? ["csg-pensions-normal"] : [],
      reglages,
      effet: { actifs: -payeActifs / revenuActifs, retraites: -payeRetraites / revenuRetraites },
      details: {
        csgAlignee: csgTenue,
        csgCochee: csgCoche,
        recettesCsg: r.csg,
        recettesCotisation: r.cotisation,
        coutBouclier: b.cout,
        surcoutBouclier: surcout,
        tsaInduite: u.leviers.find((l) => l.id === "tsa-induite").recettes,
        usagers: { recettes: u.recettes, patients: u.patients, primes: u.primes, employeurs: u.employeurs, medecins: u.medecins },
      },
    });
  };

  memoriserFormulaire(form, "sante-simuler", "sante");
  csgGardee.maj();
  surChangement(form, () => {
    csgGardee.maj();
    rendu();
  });
  rendu();
}
