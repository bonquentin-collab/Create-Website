// Tests des leviers « gros consommateurs » de la santé et du Bilan (affectation unique, effets croisés).
import { test } from "node:test";
import assert from "node:assert/strict";

import { leviersUsagers, franchisesParAge, moyennePlafonnee } from "../site/js/engine/sante-reformes.js";
import { calculerBilan, recettesAlignement, detenteur } from "../site/js/engine/bilan.js";
import { santeReformes as sr } from "../site/js/params/sante-reformes.js";
import { sante } from "../site/js/params/sante.js";
import { csg } from "../site/js/params/prelevements.js";

const proche = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const REPOS = { plafondFranchises: sr.franchises.plafondActuel, multiplicateur: 1, ticketModerateur: 0.3, ald: [], baisseDepassements: 0, taxeDepassements: 0, pointsTsa: 0, forfaitSocial: 0.08 };
const ctxU = { sr, usagers: sante.usagers, primes: sante.primes };

test("franchises : moyenne plafonnée bornée par le plafond et croissante", () => {
  assert.equal(moyennePlafonnee(1, 1, 0), 0);
  assert.ok(moyennePlafonnee(3, 1, 50) < 50);
  assert.ok(moyennePlafonnee(3, 1, 100) > moyennePlafonnee(3, 1, 50));
});

test("franchises : le modèle retrouve les deux chiffrages officiels à 5 % près", () => {
  const l = sante.usagers.lignes;
  const f = sr.franchises;
  const regles2025 = franchisesParAge(l, f, { plafond: f.plafondAvant, multiplicateur: 1 }).total;
  const doubleTout = franchisesParAge(l, f, { plafond: 2 * f.plafondAvant, multiplicateur: 2 }).total - regles2025;
  const doublePlafonds = franchisesParAge(l, f, { plafond: 2 * f.plafondAvant, multiplicateur: 1 }).total - regles2025;
  proche(doubleTout, 2.3, 0.05 * 2.3);
  proche(doublePlafonds, 0.75, 0.05 * 0.75);
});

test("leviers usagers : rien ne change au repos", () => {
  const u = leviersUsagers(REPOS, ctxU);
  proche(u.recettes, 0, 1e-9);
  proche(u.patients + u.primes + u.employeurs + u.medecins, 0, 1e-9);
});

test("leviers usagers : ticket modérateur, TSA induite, forfait social plafonné", () => {
  const u = leviersUsagers({ ...REPOS, ticketModerateur: 0.4 }, ctxU);
  const tm = u.leviers.find((l) => l.id === "ticket");
  proche(tm.recettes, 1.1, 1e-9);
  proche(tm.primes, 1.1 * 0.95, 1e-9);
  // Les primes plus chères rapportent 13,27 % de TSA.
  proche(u.leviers.find((l) => l.id === "tsa-induite").recettes, 1.1 * 0.95 * sr.tsa.taux, 1e-9);
  const fs = leviersUsagers({ ...REPOS, forfaitSocial: 0.6 }, ctxU).leviers.find((l) => l.id === "entreprise");
  proche(fs.recettes, sr.entreprise.coutNet, 1e-9);
});

test("leviers usagers : la baisse des dépassements ne rapporte rien mais allège patients et complémentaires", () => {
  const u = leviersUsagers({ ...REPOS, baisseDepassements: 0.2 }, ctxU);
  const d = u.leviers.find((l) => l.id === "depassements");
  proche(d.recettes, 0, 1e-9);
  proche(d.patients + d.primes, -0.9, 1e-9);
  proche(d.medecins, 0.9, 1e-9);
});

// ----- Bilan -----
const ctxB = { csg, pensionsTotales: 400, composition: { partPensions: 0.778, partActivite: 0.841 }, masseNette: 865, ratioNetSurBrut: 0.78, effetNetCsg: csg.retraites.effetNet };
const brutNormal = recettesAlignement(csg.retraites.assiettes, csg.activite.taux, csg).normal;
const mesureCsg = (net = brutNormal * ctxB.effetNetCsg) => ({ espace: "retraites", label: "CSG", net, usages: { actifs: net }, usagePrincipal: "actifs", ressources: ["csg-pensions-normal"], effet: { actifs: 0.002, retraites: -0.003 }, details: { portee: "normal" }, premiereFois: 1 });
const mesureSante = (recettesCsg = brutNormal) => ({ espace: "sante", label: "Santé", net: recettesCsg, usages: { maladie: recettesCsg }, usagePrincipal: "maladie", ressources: ["csg-pensions-normal"], effet: { actifs: 0, retraites: -0.004 }, details: { csgAlignee: true, csgCochee: true, recettesCsg, recettesCotisation: 0 }, premiereFois: 2 });
const mesureTva = (baisseCsg) => ({ espace: "retraites", label: "TVA", net: baisseCsg * 12, usages: { actifs: baisseCsg * 12 }, ressources: ["tva"], effet: { actifs: 0.003, retraites: -0.003 }, details: { baisseCsg, pertePrixMoyenne: 0.003 }, premiereFois: 3 });
const etat = (ms, affectations = {}) => ({ mesures: Object.fromEntries(Object.entries(ms).map(([id, m]) => [id, { id, ...m }])), affectations, retenues: Object.fromEntries(Object.keys(ms).map((id) => [id, true])), touchees: {} });

test("bilan : l'alignement de la CSG des retraités ne sert qu'une fois", () => {
  const e = etat({ csg: mesureCsg(), sante: mesureSante() });
  assert.equal(detenteur(e, "csg-pensions-normal").detenteur, "csg"); // la première réglée
  const b = calculerBilan(e, ctxB);
  assert.equal(b.conflits.length, 1);
  proche(b.totaux.actifs, brutNormal * ctxB.effetNetCsg, 1e-9);
  proche(b.totaux.maladie, 0, 1e-9);
  // Réaffectée à la santé : la CSG des actifs ne baisse plus.
  const b2 = calculerBilan(etat({ csg: mesureCsg(), sante: mesureSante() }, { "csg-pensions-normal": "sante" }), ctxB);
  proche(b2.totaux.actifs, 0, 1e-9);
  proche(b2.totaux.maladie, brutNormal, 1e-9);
});

test("bilan : la TVA sociale abaisse la cible de l'alignement, jusqu'à l'annuler", () => {
  const petite = calculerBilan(etat({ sante: mesureSante(), tva: mesureTva(0.5) }), ctxB);
  proche(petite.totaux.maladie, csg.retraites.assiettes.normal * 0.004, 1e-9); // 9,2 − 0,5 − 8,3 = 0,4 point
  const grande = calculerBilan(etat({ sante: mesureSante(), tva: mesureTva(1) }), ctxB);
  proche(grande.totaux.maladie, 0, 1e-9);
  assert.ok(grande.effets.some((e) => e.id === "cible-csg"));
});

test("bilan : retour d'impôt sur la baisse de CSG des actifs, revalorisation des pensions après TVA", () => {
  const b = calculerBilan(etat({ tva: mesureTva(1) }), ctxB);
  const ir = b.effets.find((e) => e.id === "ir-actifs");
  proche(ir.montant, 12 * (1 - ctxB.effetNetCsg), 1e-9);
  proche(b.effets.find((e) => e.id === "revalorisation").montant, -0.003 * 400, 1e-9);
  proche(b.total, 12 + ir.montant - 1.2, 1e-9);
});

test("bilan : un gel des pensions réduit l'assiette de la CSG alignée", () => {
  const gel = { espace: "retraites", label: "Gel", net: 2, usages: { actifs: 2 }, ressources: [], effet: { actifs: 0, retraites: 0 }, details: { economie: 19.05 }, premiereFois: 0 };
  const b = calculerBilan(etat({ sante: mesureSante(), gel }), ctxB);
  proche(b.totaux.maladie, brutNormal * 0.9, 1e-9);
});
