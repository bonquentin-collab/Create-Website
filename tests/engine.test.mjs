// Tests du moteur de calcul : `node --test tests/`
import { test } from "node:test";
import assert from "node:assert/strict";

import { appliquerBareme } from "../site/js/engine/bareme.js";
import { impotDroitActuel, impotBaremeVie } from "../site/js/engine/succession.js";
import { droitActuel } from "../site/js/params/droit-actuel.js";
import { macro } from "../site/js/params/macro.js";
import { igsJeanJaures } from "../site/js/reforms/igs-jean-jaures.js";
import { scenarios, trouverScenario } from "../site/js/redistribution/scenarios.js";
import { lireMontant, ecartEuros } from "../site/js/engine/format.js";
import { fixerMontant, depuisParts, reechelonner, totalReparti, effetService, encoder, decoder } from "../site/js/engine/repartition.js";
import { destinations } from "../site/js/params/budgets.js";
import { repartitions } from "../site/js/redistribution/repartitions.js";

const proche = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test("barème : montant nul ou négatif", () => {
  assert.equal(appliquerBareme(0, droitActuel.baremeLigneDirecte).impot, 0);
  assert.equal(appliquerBareme(-5, droitActuel.baremeLigneDirecte).impot, 0);
});

test("droit actuel : 100 000 € d'un parent, entièrement abattu", () => {
  assert.equal(impotDroitActuel({ montant: 100_000 }, droitActuel).impot, 0);
});

test("droit actuel : 250 000 € d'un parent", () => {
  // Part taxable 150 000 € : 403,60 + 403,70 + 573,45 + 26 813,60
  proche(impotDroitActuel({ montant: 250_000 }, droitActuel).impot, 28_194.35, 0.01);
});

test("droit actuel : deux parents doublent l'abattement", () => {
  const un = impotDroitActuel({ montant: 500_000, nbParents: 1 }, droitActuel).impot;
  const deux = impotDroitActuel({ montant: 500_000, nbParents: 2 }, droitActuel).impot;
  assert.ok(deux < un);
  proche(deux, 2 * impotDroitActuel({ montant: 250_000 }, droitActuel).impot, 0.01);
});

test("droit actuel : assurance-vie sous l'abattement de 152 500 €", () => {
  assert.equal(impotDroitActuel({ montant: 0, assuranceVie: 150_000 }, droitActuel).impot, 0);
  proche(impotDroitActuel({ montant: 0, assuranceVie: 252_500 }, droitActuel).impot, 20_000, 0.01);
});

test("IGS : rien à payer jusqu'à 200 000 €", () => {
  assert.equal(impotBaremeVie({ montant: 200_000 }, igsJeanJaures).impot, 0);
});

test("IGS : 1 000 000 € reçus", () => {
  // 600 000 × 5 % + 200 000 × 15 %
  proche(impotBaremeVie({ montant: 1_000_000 }, igsJeanJaures).impot, 60_000, 0.01);
});

test("IGS : taux marginal de 50 % au-delà de 6 M€", () => {
  const a = impotBaremeVie({ montant: 6_000_000 }, igsJeanJaures).impot;
  const b = impotBaremeVie({ montant: 6_000_100 }, igsJeanJaures).impot;
  proche(b - a, 50, 0.001);
});

test("IGS : l'assurance-vie entre dans l'assiette, le nombre de parents ne compte pas", () => {
  const r1 = impotBaremeVie({ montant: 300_000, assuranceVie: 100_000, nbParents: 1 }, igsJeanJaures);
  const r2 = impotBaremeVie({ montant: 400_000, nbParents: 2 }, igsJeanJaures);
  assert.equal(r1.impot, r2.impot);
});

test("IGS : PFU sur les plus-values latentes, plafonnées au montant hors assurance-vie", () => {
  const r = impotBaremeVie({ montant: 1_000_000, plusValuesLatentes: 5_000_000 }, igsJeanJaures);
  proche(r.postes[1].montant, 300_000, 0.01);
});

test("données de l'étude : totaux conformes aux tableaux publiés", () => {
  const [p1, p2] = igsJeanJaures.recettes.series.map((s) => s.valeurs.reduce((a, b) => a + b, 0));
  proche(p1, 240.79, 0.05);
  proche(p2, 158.84, 0.05);
  proche(p1 + p2, igsJeanJaures.recettes.totalAnnonce, 0.05);
  const flux = igsJeanJaures.fluxSuccessoral.valeurs.reduce((a, b) => a + b, 0);
  proche(flux, igsJeanJaures.fluxSuccessoral.totalAnnonce, 5);
  for (const s of igsJeanJaures.recettes.series) assert.equal(s.valeurs.length, igsJeanJaures.recettes.annees.length);
});

test("redistribution : scénario de l'étude sans gain direct", () => {
  assert.equal(trouverScenario("etude").calculer({ recettes: 25e9, part: 1, profil: {}, macro }).annuel, 0);
});

test("redistribution : part à 1 par défaut", () => {
  proche(trouverScenario("dividende").calculer({ recettes: 30.4e9, macro }).annuel, 1000, 0.01);
});

test("redistribution : dividende égal", () => {
  const r = trouverScenario("dividende").calculer({ recettes: 30.4e9, part: 1, profil: {}, macro });
  proche(r.annuel, 1000, 0.01);
});

test("redistribution : cotisations proportionnelles, somme conforme à l'enveloppe", () => {
  const profil = { salaireNetMensuel: (macro.masseSalarialeBrute.valeur * macro.ratioNetSurBrut.valeur) / 12 };
  const r = trouverScenario("cotisations").calculer({ recettes: 10e9, part: 0.5, profil, macro });
  proche(r.annuel, 5e9, 1);
});

test("redistribution : chaque scénario a un identifiant unique", () => {
  assert.equal(new Set(scenarios.map((s) => s.id)).size, scenarios.length);
});

test("format : saisie à la française", () => {
  assert.equal(lireMontant("250 000"), 250_000);
  assert.equal(lireMontant("1 500,5 €"), 1500.5);
  assert.equal(lireMontant("abc"), 0);
  assert.equal(ecartEuros(-350).replace(/\s/g, " "), "− 350 €");
});

test("répartition : un curseur ne peut pas dépasser ce qui reste", () => {
  let r = fixerMontant({}, "ecole", 15, 20);
  r = fixerMontant(r, "hopital", 10, 20);
  assert.equal(r.hopital, 5);
  proche(totalReparti(r), 20, 1e-9);
  assert.ok(totalReparti(fixerMontant({}, "ecole", 99, 24.98)) <= 24.98);
  r = fixerMontant(r, "ecole", -3, 20);
  assert.equal(r.ecole, 0);
});

test("répartition : parts relatives ramenées à l'enveloppe, sans la dépasser", () => {
  const r = depuisParts({ ecologie: 1, recherche: 1, ecole: 1 }, 24.98);
  assert.ok(totalReparti(r) <= 24.98 + 1e-9);
  proche(totalReparti(r), 24.9, 1e-9);
  assert.deepEqual(Object.values(r).sort(), [8.3, 8.3, 8.3]);
  proche(totalReparti(depuisParts({ ecologie: 1, recherche: 1, ecole: 1 }, 25)), 25, 1e-9);
  assert.deepEqual(depuisParts({}, 25), {});
});

test("répartition : changement d'année proportionnel", () => {
  const r = reechelonner({ ecole: 10, actifs: 5 }, 20, 40);
  proche(r.ecole, 20, 0.11);
  proche(r.actifs, 10, 0.11);
});

test("répartition : effet sur le budget d'un service", () => {
  const e = effetService(12.5, 2.5);
  proche(e.hausse, 0.2, 1e-9);
  assert.equal(e.apres, 15);
});

test("répartition : lien de partage aller-retour, destinations inconnues ignorées", () => {
  const ids = destinations.map((d) => d.id);
  const r = { ecole: 5.2, actifs: 10, justice: 0 };
  assert.deepEqual(decoder(encoder(r), ids), { ecole: 5.2, actifs: 10 });
  assert.equal(encoder({ ecologie: 5.300000000000001 }), "ecologie-5.3");
  assert.deepEqual(decoder("pirate-9_ecole-abc_hopital-3", ids), { hopital: 3 });
});

test("budgets : chaque service a un budget positif et une source", () => {
  for (const d of destinations.filter((d) => d.type === "service")) {
    assert.ok(d.budget > 0, d.id);
    assert.ok(d.source && d.url, d.id);
  }
  assert.equal(new Set(destinations.map((d) => d.id)).size, destinations.length);
});

test("répartitions toutes faites : ne visent que des destinations connues", () => {
  const ids = new Set(destinations.map((d) => d.id));
  for (const m of repartitions) for (const id of Object.keys(m.parts)) assert.ok(ids.has(id), `${m.id} → ${id}`);
});

// ---------- Retraites ----------
import { retraites } from "../site/js/params/retraites.js";
import { totalRessources, ressourcesRetirees, comblerTrou, pensionApres, perteSalaire } from "../site/js/engine/retraites.js";

test("retraites : les ressources 2025 bouclent sur les dépenses, à l'arrondi près", () => {
  proche(totalRessources(retraites.ressources), retraites.depenses.valeur, 0.3);
  assert.equal(new Set(retraites.ressources.map((r) => r.id)).size, retraites.ressources.length);
  const groupes = new Set(retraites.groupes.map((g) => g.id));
  for (const r of retraites.ressources) assert.ok(groupes.has(r.groupe), r.id);
});

test("retraites : près d'un tiers des ressources ne sont pas des cotisations (COR 2026)", () => {
  const horsCotisations = retraites.ressources.filter((r) => ["etat", "impots", "transferts"].includes(r.groupe));
  const part = totalRessources(horsCotisations) / (totalRessources(retraites.ressources) - 7.0);
  proche(part, 0.332, 0.005);
});

test("retraites : les ressources fixes ne sont jamais retirées", () => {
  const { retire } = ressourcesRetirees(retraites.ressources, []);
  const nonFixes = totalRessources(retraites.ressources.filter((r) => !r.fixe));
  proche(retire, nonFixes, 1e-9);
  assert.equal(ressourcesRetirees(retraites.ressources, retraites.ressources.map((r) => r.id)).retire, 0);
});

test("retraites : combler le trou entre pensions et cotisations", () => {
  const c = comblerTrou(40, 0.25, 400, 1000);
  proche(c.parPensions, 10, 1e-9);
  proche(c.baissePensions, 0.025, 1e-9);
  proche(c.hausseCotisations, 0.03, 1e-9);
  assert.equal(comblerTrou(40, 2, 400, 1000).parCotisations, 0);
  proche(pensionApres(1500, 0.1), 1350, 1e-9);
  proche(perteSalaire(1560, 0.01, 0.78), 20, 1e-9);
});

// ---------- TVA sociale et CSG ----------
import { tva, csg } from "../site/js/params/prelevements.js";
import { tvaSociale, gainBaisseCsg, tauxCsgRetraite, alignementCsg, perteRetraite } from "../site/js/engine/prelevements.js";

test("TVA sociale : 1 point de taux normal finance 0,6 point de CSG des actifs", () => {
  const r = tvaSociale(1, "normal", 1, tva, csg);
  proche(r.recettes, 7.5, 1e-9);
  proche(r.baisseCsg, 0.625, 1e-3);
  proche(r.pertePrix, 0.005 * 8.9 / 13.7, 1e-9);
  assert.equal(tvaSociale(0, "tousTaux", 1, tva, csg).recettes, 0);
});

test("TVA sociale : la baisse de CSG ne peut pas dépasser 9,2 points", () => {
  assert.ok(tvaSociale(200, "tousTaux", 1, tva, csg).baisseCsg <= 9.2 + 1e-9);
});

test("TVA sociale : gain d'un salarié", () => {
  // 2 340 € net ≈ 3 000 € brut ; 1 point de CSG sur 98,25 % du brut = 29,475 €
  proche(gainBaisseCsg(2340, 1, csg, 0.78), 29.475, 1e-6);
});

test("CSG retraités : taux selon le revenu fiscal de référence (seuils 2025)", () => {
  const b = csg.retraites.taux;
  assert.equal(tauxCsgRetraite(12000, b).id, "exonere");
  assert.equal(tauxCsgRetraite(16000, b).id, "reduit");
  assert.equal(tauxCsgRetraite(20000, b).id, "median");
  assert.equal(tauxCsgRetraite(40000, b).id, "normal");
});

test("CSG retraités : alignement sur 9,2 %", () => {
  proche(alignementCsg("normal", csg).recettes, 2.0, 0.05);
  proche(alignementCsg("tous", csg).recettes, 5.8, 0.1);
  const a = alignementCsg("normal", csg);
  assert.equal(a.nouveauTaux("median"), 0.066);
  assert.equal(alignementCsg("tous", csg).nouveauTaux("exonere"), 0);
  proche(perteRetraite(2000, 0.083, 0.092), 18, 1e-9);
  assert.equal(perteRetraite(2000, 0.092, 0.083), 0);
});
