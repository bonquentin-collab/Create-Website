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
