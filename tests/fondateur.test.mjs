// Tests du jeu « Dilution » : moteur de cap table et parties simulées.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { creerTable, lever, cascade, part, total, preferencesTotales } from '../fondateur/js/captable.js';
import { nouvellePartie, partVous } from '../fondateur/js/etat.js';
import { piocher, jouer, decrypter, options, agirLevee, composerTour, genererOffres, valoMarche } from '../fondateur/js/moteur.js';
import { contenus } from '../fondateur/js/contenus/fr/index.js';
import { LEXIQUE } from '../fondateur/js/contenus/fr/lexique.js';

const proche = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const fondateurs = () => creerTable([
  { id: 'vous', nom: 'Vous', actions: 600_000 },
  { id: 'ines', nom: 'Inès', actions: 400_000 },
]);
const base = { id: 'fonds', nom: 'Fonds', serie: 'Seed', multiple: 1 };

test('levée simple : 2 M€ sur 8 M€ pré-money donnent 20 % au fonds', () => {
  const r = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6 });
  proche(part(r.table, 'fonds'), 0.2);
  proche(part(r.table, 'vous'), 0.48);
  proche(r.postMoney, 10e6, 1e-3);
});

test('pool BSPCE créé avant la levée : il pèse exactement la cible et seuls les anciens le paient', () => {
  const r = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, poolCible: 0.1, poolPreMoney: true });
  proche(part(r.table, 'esop'), 0.1);
  proche(part(r.table, 'fonds'), 0.2);
  assert.ok(r.preMoneyEffective < 8e6);
  proche(r.preMoneyEffective, 8e6 - r.ajoutPool * r.prix, 1e-3);
});

test('pool créé après la levée : il dilue aussi le nouveau fonds', () => {
  const r = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, poolCible: 0.1, poolPreMoney: false });
  proche(part(r.table, 'esop'), 0.1);
  proche(part(r.table, 'fonds'), 0.18);
});

test('BSA AIR : conversion au plafond quand il est plus bas que le prix décoté', () => {
  const notes = [{ id: 'angels', nom: 'Angels', montant: 200_000, decote: 0.2, plafondValo: 2e6 }];
  const r = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, notes });
  proche(r.conversions[0].prix, 2); // 2 M€ / 1 000 000 actions
  proche(r.conversions[0].actions, 100_000);
});

test('BSA AIR : conversion à la décote quand le plafond est plus haut', () => {
  const notes = [{ id: 'angels', nom: 'Angels', montant: 200_000, decote: 0.2, plafondValo: 20e6 }];
  const r = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, notes });
  proche(r.conversions[0].prix, 8 * 0.8);
});

test('pool BSPCE avec BSA AIR : la cible est tenue après conversion', () => {
  const notes = [{ id: 'angels', nom: 'Angels', montant: 200_000, decote: 0.2, plafondValo: 2e6 }];
  const r = lever(fondateurs(), { ...base, montant: 3e6, preMoney: 12e6, poolCible: 0.15, poolPreMoney: true, notes });
  proche(part(r.table, 'esop'), 0.15, 1e-6);
});

test('down round : le ratchet donne plus d’actions que la moyenne pondérée', () => {
  const t = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, antiDilution: 'ratchet' }).table;
  const t2 = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, antiDilution: 'moyenne' }).table;
  const bas = { id: 'b', nom: 'B', serie: 'A', montant: 1e6, preMoney: 4e6, multiple: 1 };
  const r1 = lever(t, bas);
  const r2 = lever(t2, bas);
  assert.equal(r1.ajustements.length, 1);
  assert.ok(r1.ajustements[0].actionsAjoutees > r2.ajustements[0].actionsAjoutees);
  proche(r1.table.find((d) => d.id === 'fonds').pref.prixConv, r1.prix);
  assert.ok(part(r1.table, 'vous') < part(r2.table, 'vous'));
});

test('cascade 1x non participative : préférence à petit prix, conversion à gros prix', () => {
  const t = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6 }).table;
  const petit = cascade(t, 5e6).find((d) => d.id === 'fonds');
  assert.equal(petit.mode, 'préférence');
  proche(petit.montant, 2e6, 1e-3);
  const gros = cascade(t, 50e6).find((d) => d.id === 'fonds');
  assert.equal(gros.mode, 'conversion');
  proche(gros.montant, 10e6, 1e-3);
});

test('cascade participative : préférence plus part du reste ; plafond respecté', () => {
  const t = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, multiple: 2, participatif: true }).table;
  const f = cascade(t, 20e6).find((d) => d.id === 'fonds');
  proche(f.montant, 4e6 + 0.2 * 16e6, 1e-3);
  const tc = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, multiple: 1, participatif: true, plafond: 2 }).table;
  const fc = cascade(tc, 15e6).find((d) => d.id === 'fonds');
  assert.ok(fc.montant <= 4e6 + 1e-3);
});

test('cascade : la somme des montants égale le prix de vente', () => {
  let t = lever(fondateurs(), { ...base, montant: 2e6, preMoney: 8e6, multiple: 2, participatif: true, poolCible: 0.1, poolPreMoney: true }).table;
  t = lever(t, { id: 'a', nom: 'A', serie: 'A', montant: 6e6, preMoney: 20e6, multiple: 1 }).table;
  for (const prix of [0, 1e6, 7e6, 30e6, 200e6]) {
    proche(cascade(t, prix).reduce((s, d) => s + d.montant, 0), prix, 1e-2);
  }
  proche(preferencesTotales(t), 2 * 2e6 + 6e6);
});

test('décryptage : la part annoncée par règle de trois est plus haute que la part réelle avec pool et BSA AIR', () => {
  const e = nouvellePartie();
  e.notes.push({ id: 'angels', nom: 'Angels', montant: 200_000, decote: 0.2, plafondValo: 2e6 });
  const o = { ...base, montant: 3e6, preMoney: 12e6, poolCible: 0.15, poolPreMoney: true, multiple: 2, participatif: true, antiDilution: 'ratchet' };
  const d = decrypter(e, o);
  assert.ok(d.apres < d.partNaive);
  assert.ok(d.scenarios[0].reel < d.scenarios[0].naif);
  assert.equal(partVous(e), 0.6); // décrypter ne modifie pas la partie
});

test('le lexique couvre tous les termes cités dans les cartes', () => {
  const ids = new Set(LEXIQUE.map((t) => t.id));
  const e = nouvellePartie();
  for (const c of contenus.cartes) {
    const texte = typeof c.texte === 'function' ? '' : c.texte;
    for (const [, id] of texte.matchAll(/\[\[([a-z]+)\|/g)) assert.ok(ids.has(id), `${c.id} cite ${id}`);
  }
  assert.ok(e);
});

test('300 parties jouées au hasard : aucune erreur, chaque partie se termine', () => {
  for (let i = 0; i < 300; i++) {
    let s = 1000 + i;
    const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const e = nouvellePartie();
    contenus.debut(e);
    let coups = 0;
    while (!e.fin && coups < 800) {
      const c = piocher(e, contenus, rng);
      assert.ok(c, `partie ${i} : plus de carte au mois ${e.mois}`);
      if (c.type === 'levee') {
        const ids = e.levee.offres.map((o) => o.id);
        const t = rng();
        if (t < 0.15) agirLevee(e, { type: 'negocier', id: ids[Math.floor(rng() * ids.length)] }, rng);
        else if (t < 0.2) agirLevee(e, { type: 'refuser' }, rng);
        else agirLevee(e, { type: 'signer', ids: ids.slice(0, 1 + Math.floor(rng() * ids.length)) }, rng);
      } else jouer(e, c, Math.floor(rng() * options(c).length), rng);
      coups++;
    }
    assert.ok(e.fin, `partie ${i} sans fin`);
    const somme = e.fin.cascade.reduce((t, d) => t + d.montant, 0);
    proche(somme, e.fin.prix, 1);
    assert.ok(total(e.table) > 0);
  }
});

test('levée à plusieurs fonds : le chef de file fixe le prix, un suiveur trop éloigné se retire', () => {
  const e = nouvellePartie();
  e.mrr = 20_000;
  e.levee = { etapeCible: 1, offres: [
    { ...base, id: 'chef', nom: 'Chef', etapeCible: 1, montant: 2e6, preMoney: 10e6, sieges: 1, independant: 0, autres: [] },
    { ...base, id: 'proche', nom: 'Proche', etapeCible: 1, montant: 1e6, preMoney: 9e6, sieges: 0, independant: 0, autres: [] },
    { ...base, id: 'loin', nom: 'Loin', etapeCible: 1, montant: 1e6, preMoney: 6e6, sieges: 1, independant: 0, autres: [] },
  ], messages: [] };
  const c = composerTour(e, ['chef', 'proche', 'loin']);
  assert.deepEqual(c.suiveurs.map((x) => x.id), ['proche']);
  assert.deepEqual(c.refus.map((x) => x.id), ['loin']);
  proche(c.tour.montant, 2e6 + 0.6e6);
  agirLevee(e, { type: 'signer', ids: ['chef', 'proche', 'loin'] }, () => 0.5);
  const prixChef = e.table.find((d) => d.id === 'chef').pref.prixOrig;
  proche(e.table.find((d) => d.id === 'proche').pref.prixOrig, prixChef);
  assert.ok(!e.table.some((d) => d.id === 'loin'));
  assert.equal(e.etape, 1);
});

test('valorisations dans les fourchettes du marché pour chaque étape', () => {
  const e = nouvellePartie();
  for (const [etape, min, max] of [[1, 2e6, 9e6], [2, 8e6, 40e6], [3, 30e6, 130e6], [4, 90e6, 400e6]]) {
    for (const mrr of [0, 10e3, 100e3, 1e6]) {
      e.mrr = mrr;
      const v = valoMarche(e, etape);
      assert.ok(v >= min && v <= max, `étape ${etape}, MRR ${mrr} : ${v}`);
    }
  }
  e.etape = 0;
  assert.ok(genererOffres(e, contenus.cadre, Math.random).length >= 3);
});

test('conséquences : chaque lien pointe vers une carte, une option et une suite qui existent', async () => {
  const { LIENS, CARTES_SUITES } = await import('../fondateur/js/contenus/fr/suites.js');
  const ids = new Set(contenus.cartes.map((c) => c.id));
  for (const [id, cle, suite] of LIENS) {
    assert.ok(ids.has(id), `carte ${id}`);
    const c = contenus.cartes.find((x) => x.id === id);
    assert.ok(typeof cle === 'number' ? c.options?.[cle] : c[cle], `option ${cle} de ${id}`);
    assert.ok(CARTES_SUITES.some((x) => x.id === suite), `suite ${suite}`);
  }
  for (const s of CARTES_SUITES) assert.ok(s.force, `${s.id} ne doit jamais sortir au hasard`);
});

test('conséquences : un choix programme sa suite, qui revient avec le rappel du choix', () => {
  const e = nouvellePartie();
  e.file = [];
  const pub = contenus.cartes.find((c) => c.id === 'pub');
  jouer(e, pub, 2, () => 0.5);
  assert.equal(e.suites[0].id, 'cac-explose');
  let vue = null;
  for (let i = 0; i < 6 && !vue; i++) {
    const c = piocher(e, contenus, () => 0.99);
    if (c.id === 'cac-explose') vue = c;
    else jouer(e, c, 0, () => 0.5);
  }
  assert.ok(vue, 'la suite est revenue');
  assert.match(vue.cause, /budget publicitaire/);
});

test('cohérence : toute carte programmée par programmer(…) existe, et toute suite a un rappel', async () => {
  const { readFileSync } = await import('node:fs');
  const ids = new Set(contenus.cartes.map((c) => c.id));
  for (const f of ['cartes', 'suites', 'dilemmes', 'index']) {
    const src = readFileSync(new URL(`../fondateur/js/contenus/fr/${f}.js`, import.meta.url), 'utf8');
    for (const [, id, cause] of src.matchAll(/programmer\((?:e|et), '([a-z0-9-]+)', \d+(?:, '([^']*)')?/g)) {
      assert.ok(ids.has(id), `${f}.js programme « ${id} », qui n'existe pas`);
      assert.ok(cause, `${f}.js programme « ${id} » sans rappel du choix d'origine`);
    }
  }
  const src = readFileSync(new URL('../fondateur/js/moteur.js', import.meta.url), 'utf8');
  for (const [, id] of src.matchAll(/programmer\(e, '([a-z0-9-]+)'/g)) assert.ok(ids.has(id), `moteur.js programme « ${id} »`);
});
