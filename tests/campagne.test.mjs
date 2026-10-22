// Tests du modèle du site de campagne « L'héritage, ça se décide » : `node --test tests/`
import { test } from "node:test";
import assert from "node:assert/strict";

import { bareme, calage, evaluer, assiette } from "../campagne/js/moteur/modele.js";
import { scenarios } from "../campagne/js/moteur/scenarios.js";
import { baremes, flux, heritiers, patrimoine, piketty, plusValues } from "../campagne/js/donnees/sources.js";

const proche = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (± ${tol})`);
const reglages = (id, maj = {}) => {
  const r = scenarios[id].reglages();
  return { ...r, ...maj, niches: { ...r.niches, ...(maj.niches || {}) } };
};

test("barème : droit actuel sur 150 000 € taxables", () => {
  proche(bareme(150_000, baremes.actuel), 28_194.35, 0.01);
  assert.equal(bareme(0, baremes.actuel), 0);
  assert.equal(bareme(150_000, baremes.igs), 0);
  proche(bareme(1_000_000, baremes.igs), 600_000 * 0.05 + 200_000 * 0.15, 0.01);
});

test("données : sommes publiées", () => {
  proche(flux.valeurs.reduce((a, b) => a + b, 0), flux.total, 1); // valeurs annuelles arrondies par l'étude
  proche(patrimoine.groupes.reduce((a, g) => a + g.part, 0), 100, 0.05);
  proche(heritiers.tranches.reduce((a, t) => a + t.p, 0), 1, 1e-9);
  assert.equal(piketty.observe.length, 20);
  assert.equal(plusValues.top1.length, 16);
});

test("calage : recettes actuelles du CAE (15 Md€) et base proche du flux de l'époque", () => {
  proche(calage.recettesActuellesModele, 15.14, 0.05);
  proche(calage.fluxReference, 342, 1);
  for (const c of calage.composition) assert.ok(c.autre >= 0.2 && c.autre <= 0.5, `part non déclarée ${c.autre}`);
});

test("calage : le droit actuel reproduit 2025 (20,7 Md€ prévus au PLF 2026)", () => {
  const r = evaluer(reglages("actuel"));
  proche(r.actuelles[0], 20.7, 0.3);
  assert.ok(r.supplement.every((v) => v === 0));
  assert.equal(r.parts.egal, 1);
});

test("validation : le scénario CAE retrouve ses 9,3 Md€ à l'époque des données", () => {
  const r = evaluer(reglages("cae"));
  proche((r.supplement[0] * calage.fluxReference) / flux.valeurs[0], 9.3, 0.3);
});

test("validation : l'IGS (hors plus-values) reste proche du scénario « assiette 2, barème 4 » du CAE (12,3 Md€)", () => {
  const r = evaluer(reglages("igs", { niches: { plusValues: "effacees" } }));
  proche((r.supplement[0] * calage.fluxReference) / flux.valeurs[0], 12.3, 0.8);
});

test("IGS : plus-values du top 1 % ajoutées telles que publiées", () => {
  const a = evaluer(reglages("igs"));
  const b = evaluer(reglages("igs", { niches: { plusValues: "effacees" } }));
  proche(a.supplement[0] - b.supplement[0], plusValues.top1[0], 1e-9);
  assert.ok(a.parts.plus <= 0.06, "seuls les héritiers les mieux dotés paient plus");
});

test("niches : chaque suppression augmente l'assiette, « tout imposer » donne l'héritage entier", () => {
  const base = reglages("actuel");
  for (let i = 0; i < 14; i++) {
    assert.ok(assiette(reglages("actuel", { niches: { dutreil: "supprimer" } }), i) >= assiette(base, i));
    proche(assiette(reglages("actuel", { niches: { tout: true } }), i), calage.brut[i], 1e-6);
  }
  const r = evaluer(reglages("actuel", { niches: { tout: true } }));
  assert.ok(r.supplement[0] > evaluer(reglages("cae")).supplement[0]);
});

test("abattement : le supprimer rapporte, le doubler coûte", () => {
  assert.ok(evaluer(reglages("actuel", { abattement: 0 })).supplement[0] > 0);
  assert.ok(evaluer(reglages("actuel", { abattement: 200_000 })).supplement[0] < 0);
});

test("recettes : proportionnelles au flux successoral", () => {
  const r = evaluer(reglages("cae"));
  proche(r.supplement[15] / r.supplement[0], flux.valeurs[15] / flux.valeurs[0], 1e-9);
});
