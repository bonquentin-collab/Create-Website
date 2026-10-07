// Santé › Simuler : recettes des leviers sur les retraités, coût d'un bouclier santé, effort avant/après.
// Fonctions pures ; montants en Md€, taux d'effort en points de pourcentage du revenu.

import { alignementCsg } from "./prelevements.js";

/**
 * Groupes disjoints de ménages classés par taux d'effort privé : D1 à D9, puis D10 découpé en 90-95 %, 95-98 %,
 * 98-99 % et top 1 % à partir des moyennes emboîtées (D10 ⊃ top 5 % ⊃ top 2 % ⊃ top 1 %).
 * @returns {{label:string, part:number, effort:number, retraitesModestes:number, retraitesAises:number}[]}
 */
export function groupesEffort({ dixiemes, tops }) {
  const groupes = dixiemes.slice(0, 9).map(([label, effort, rm, ra]) => ({ label, part: 0.1, effort, retraitesModestes: rm / 100, retraitesAises: ra / 100 }));
  const emboites = [["D10", 0.1, ...dixiemes[9].slice(1)], ...tops];
  const labels = ["90 à 95 %", "95 à 98 %", "98 à 99 %", "1 % le plus exposé"];
  for (let i = 0; i < emboites.length; i++) {
    const [, p, e, rm, ra] = emboites[i];
    const suivant = emboites[i + 1];
    const q = suivant ? suivant[1] : 0;
    const diff = (x, y) => (x * p - y * q) / (p - q);
    groupes.push({
      label: labels[i],
      part: p - q,
      effort: suivant ? diff(e, suivant[2]) : e,
      retraitesModestes: (suivant ? diff(rm, suivant[3]) : rm) / 100,
      retraitesAises: (suivant ? diff(ra, suivant[4]) : ra) / 100,
    });
  }
  return groupes;
}

/**
 * Coût d'un bouclier plafonnant primes et restes à charge à `plafond` % du revenu. Dans chaque groupe, le taux
 * d'effort varie linéairement d'un bord à l'autre, bords choisis pour conserver la moyenne de la Drees (profil
 * continu, parti de 0). Revenus supposés égaux entre groupes : le coût rapporté à la dépense totale est alors
 * (effort au-delà du plafond) / (effort moyen). Majorant probable, les ménages les plus exposés étant souvent modestes.
 */
export function coutBouclier(groupes, { plafond, moyenne, depenseTotale, menages }) {
  const PAS = 200;
  let exces = 0;
  let beneficiaires = 0;
  let retraites = 0;
  let modestes = 0;
  let gauche = 0;
  for (const g of groupes) {
    const droite = Math.max(0, 2 * g.effort - gauche);
    let e = 0;
    let b = 0;
    for (let k = 0; k < PAS; k++) {
      const x = gauche + ((droite - gauche) * (k + 0.5)) / PAS;
      if (x > plafond) {
        e += ((x - plafond) * g.part) / PAS;
        b += g.part / PAS;
      }
    }
    gauche = droite;
    exces += e;
    beneficiaires += b;
    retraites += e * (g.retraitesModestes + g.retraitesAises);
    modestes += e * g.retraitesModestes;
  }
  return {
    cout: (exces / moyenne) * depenseTotale,
    menages: beneficiaires * menages,
    partRetraites: exces > 0 ? retraites / exces : 0,
    partRetraitesModestes: exces > 0 ? modestes / exces : 0,
  };
}

/** Recettes des deux leviers sur les pensions (Md€) : alignement du taux normal de CSG, cotisation maladie de base. */
export function recettesRetraites({ csgAlignee, cotisation }, { csg, partBase }) {
  const recettesCsg = csgAlignee ? alignementCsg("normal", csg).recettes : 0;
  const { assiettes } = csg.retraites;
  const recettesCotisation = cotisation * (assiettes.median + assiettes.normal) * partBase;
  return { csg: recettesCsg, cotisation: recettesCotisation, total: recettesCsg + recettesCotisation };
}

/** Points de revenu ajoutés au taux d'effort des retraités, par niveau de vie. */
export function effortAjouteRetraites({ csgAlignee, cotisation }, { csg, partPensions, partBase, exposition }) {
  const hausseCsg = csgAlignee ? csg.activite.taux - csg.retraites.taux.find((t) => t.id === "normal").taux : 0;
  return exposition.tauxNormal.map((n, i) => 100 * partPensions * (hausseCsg * n + cotisation * partBase * exposition.tauxMedianOuNormal[i]));
}

/** Perte mensuelle d'un retraité selon sa pension brute et son taux de CSG. */
export function perteRetraiteSante(pension, tauxCsg, { csgAlignee, cotisation }, { csg, partBase }) {
  const hausseCsg = csgAlignee && tauxCsg === "normal" ? csg.activite.taux - csg.retraites.taux.find((t) => t.id === "normal").taux : 0;
  const cot = tauxCsg === "median" || tauxCsg === "normal" ? cotisation * partBase : 0;
  return pension * (hausseCsg + cot);
}

// ----- Gros consommateurs de soins et complémentaires santé -----

const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
const repartition = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

/** E[min(X, c)] pour X log-normale de paramètres (mu, sigma) : ce qu'on paie en moyenne avec un plafond c. */
export function moyennePlafonnee(mu, sigma, c) {
  if (c <= 0) return 0;
  const z = (Math.log(c) - mu) / sigma;
  return Math.exp(mu + (sigma * sigma) / 2) * repartition(z - sigma) + c * (1 - repartition(z));
}

/** Paramètre mu de chaque tranche d'âge, tel que la moyenne plafonnée retrouve les franchises observées. */
export function calerFranchises(lignes, { sigma, plafond2023 }) {
  return lignes.map((l) => {
    if (l.franchises <= 0.5) return null; // tranche exonérée (mineurs)
    let bas = -15;
    let haut = 15;
    for (let i = 0; i < 80; i++) {
      const m = (bas + haut) / 2;
      if (moyennePlafonnee(m, sigma, plafond2023) < l.franchises) bas = m;
      else haut = m;
    }
    return bas;
  });
}

/**
 * Franchises et participations forfaitaires payées par personne et par an, par tranche d'âge, pour un plafond annuel
 * total et un multiplicateur des montants unitaires (1 = montants actuels). Total en Md€.
 */
export function franchisesParAge(lignes, f, { plafond, multiplicateur }) {
  const mus = calerFranchises(lignes, f);
  const parPersonne = mus.map((mu) => (mu === null ? 0 : moyennePlafonnee(mu + Math.log(f.multiplicateur2023 * multiplicateur), f.sigma, plafond)));
  const total = lignes.reduce((t, l, i) => t + l.personnes * parPersonne[i], 0) / 1e9;
  return { parPersonne, total };
}

/** Prime mensuelle de complémentaire selon l'âge (interpolation linéaire 20 → 85 ans), pour répartir une hausse. */
const ageMilieu = (age) => {
  const n = age.match(/\d+/g).map(Number);
  return n.length > 1 ? (n[0] + n[1]) / 2 : n[0] + 5;
};
export const primeSelonAge = (age, { a20ans, a85ans }) => {
  const a = Math.min(85, Math.max(20, ageMilieu(age)));
  return a20ans + ((a85ans - a20ans) * (a - 20)) / 65;
};

/** Répartit `montant` (Md€) entre les tranches selon des poids, en euros par personne et par an. */
function parPersonne(lignes, poids, montant) {
  const somme = lignes.reduce((t, l, i) => t + l.personnes * poids[i], 0);
  return lignes.map((_, i) => (somme > 0 ? (montant * 1e9 * poids[i]) / somme : 0));
}

/**
 * Leviers sur les gros consommateurs de soins et les complémentaires. Chaque ligne : ce que gagne l'Assurance maladie
 * (`recettes`, Md€/an) et qui paie (patients directement, assurés via leurs primes, employeurs, médecins).
 * choix = { plafondFranchises (€ par an, total), multiplicateur, ticketModerateur (taux), ald: [ids],
 *           baisseDepassements (part), taxeDepassements (taux), pointsTsa, forfaitSocial (taux) }
 */
export function leviersUsagers(choix, { sr, usagers, primes }) {
  const { lignes } = usagers;
  const f = sr.franchises;
  const zero = lignes.map(() => 0);
  const res = [];

  // Franchises : les complémentaires « responsables » n'ont pas le droit de les rembourser, le patient paie.
  const avant = franchisesParAge(lignes, f, { plafond: f.plafondActuel, multiplicateur: 1 });
  const apres = franchisesParAge(lignes, f, { plafond: choix.plafondFranchises, multiplicateur: choix.multiplicateur });
  const dFr = apres.total - avant.total;
  res.push({ id: "franchises", label: "Franchises et participations forfaitaires", recettes: dFr, patients: dFr, primes: 0, employeurs: 0, medecins: 0, parAge: apres.parPersonne.map((v, i) => v - avant.parPersonne[i]) });

  // Ticket modérateur des consultations : pris en charge par les complémentaires (contrats responsables), sauf pour
  // les 5 % sans complémentaire ; réparti selon le ticket modérateur payé à chaque âge.
  const sansOc = sr.sansComplementaire;
  const poidsTm = lignes.map((l) => l.ticketModerateur);
  const tm = Math.max(0, (choix.ticketModerateur - sr.ticketModerateur.tauxActuel) * 100 * sr.ticketModerateur.rendementParPoint);
  res.push({ id: "ticket", label: "Ticket modérateur des consultations", recettes: tm, patients: tm * sansOc, primes: tm * (1 - sansOc), employeurs: 0, medecins: 0, parAge: parPersonne(lignes, poidsTm, tm) });

  // ALD : mêmes canaux, répartis selon le remboursement de l'Assurance maladie (les ALD pèsent surtout aux âges élevés).
  const ald = sr.ald.mesures.filter((m) => choix.ald.includes(m.id)).reduce((t, m) => t + m.valeur, 0);
  res.push({ id: "ald", label: "Affections de longue durée", recettes: ald, patients: ald * sansOc, primes: ald * (1 - sansOc), employeurs: 0, medecins: 0, parAge: parPersonne(lignes, lignes.map((l) => l.amo), ald) });

  // Dépassements : la baisse est perdue par les médecins et rendue aux patients et complémentaires ; la taxe porte
  // sur ce qui reste, supposée payée par les médecins (sans report sur les tarifs).
  const d = sr.depassements;
  const baisse = choix.baisseDepassements * d.total;
  const taxe = choix.taxeDepassements * (d.total - baisse);
  const poidsD = lignes.map((l) => l.depassements);
  res.push({
    id: "depassements",
    label: "Dépassements d'honoraires",
    recettes: taxe,
    patients: -baisse * (1 - d.partComplementaires),
    primes: -baisse * d.partComplementaires,
    employeurs: 0,
    medecins: baisse + taxe,
    parAge: parPersonne(lignes, poidsD, -baisse),
  });

  // Complémentaires : TSA (répercutée sur les primes) et forfait social des contrats d'entreprise (payé par
  // l'employeur, qui le reporte à terme sur les salaires).
  const poidsPrimes = lignes.map((l) => primeSelonAge(l.age, primes));
  const pointTsa = sr.tsa.recettes2025 / (sr.tsa.taux * 100);
  const tsa = choix.pointsTsa * pointTsa;
  res.push({ id: "tsa", label: "Taxe sur les complémentaires (TSA)", recettes: tsa, patients: 0, primes: tsa, employeurs: 0, medecins: 0, parAge: parPersonne(lignes, poidsPrimes, tsa) });

  const e = sr.entreprise;
  const fs = Math.min(e.coutNet, Math.max(0, (choix.forfaitSocial - e.forfaitSocial) * e.assiette));
  const actifs = lignes.map((l) => (/^(21|31|41|51)/.test(l.age) ? 1 : 0));
  res.push({ id: "entreprise", label: "Contrats d'entreprise (forfait social)", recettes: fs, patients: 0, primes: 0, employeurs: fs, medecins: 0, parAge: parPersonne(lignes, actifs, fs) });

  // Effet croisé : les primes payées en plus (ou en moins) sont elles-mêmes taxées par la TSA.
  const primesHorsTsa = res.reduce((t, r) => t + (r.id === "tsa" ? 0 : r.primes), 0);
  const tsaInduite = primesHorsTsa * (sr.tsa.taux + choix.pointsTsa / 100);
  res.push({ id: "tsa-induite", label: "TSA sur la variation des primes", recettes: tsaInduite, patients: 0, primes: tsaInduite, employeurs: 0, medecins: 0, parAge: parPersonne(lignes, poidsPrimes, tsaInduite), induit: true });

  const somme = (cle) => res.reduce((t, r) => t + r[cle], 0);
  return {
    leviers: res,
    recettes: somme("recettes"),
    patients: somme("patients"),
    primes: somme("primes"),
    employeurs: somme("employeurs"),
    medecins: somme("medecins"),
    parAge: res.reduce((acc, r) => acc.map((v, i) => v + r.parAge[i]), zero),
  };
}

/**
 * Points de revenu ajoutés à l'effort santé des actifs et des retraités, par niveau de vie. Les sommes payées par
 * les patients s'ajoutent en proportion des restes à charge de chaque groupe, celles payées via les primes en
 * proportion des primes ; la part des retraités est celle des 61 ans ou plus dans la répartition par âge.
 * Forfait social : réparti uniformément sur les revenus des actifs.
 */
export function effortAjouteUsagers(u, { usagers, effort, resteTotal, primesTotal, revenuActifs }) {
  const { lignes } = usagers;
  const estRetraite = lignes.map((l) => Boolean(l.retraite));
  const part = (poids) => {
    const tot = lignes.reduce((t, l, i) => t + l.personnes * poids[i], 0);
    return lignes.reduce((t, l, i) => t + (estRetraite[i] ? l.personnes * poids[i] : 0), 0) / tot;
  };
  const poidsReste = lignes.map((l) => l.ticketModerateur + l.depassements + l.franchises);
  const partRetReste = part(poidsReste);
  // Part des retraités dans les sommes de chaque canal, d'après la répartition par âge des leviers.
  const partCanal = (cle) => {
    let tot = 0;
    let ret = 0;
    for (const r of u.leviers) {
      if (!r[cle]) continue;
      const t = r.parAge.reduce((s, v, i) => s + v * lignes[i].personnes, 0);
      const re = r.parAge.reduce((s, v, i) => s + (estRetraite[i] ? v * lignes[i].personnes : 0), 0);
      const k = t !== 0 ? r[cle] / t : 0;
      tot += t * k;
      ret += re * k;
    }
    return tot !== 0 ? ret / tot : partRetReste;
  };
  const prRet = partCanal("patients");
  const pmRet = partCanal("primes");
  const partRetPrimes = part(lignes.map((l) => (l.age.startsWith("0") ? 0 : 1)));
  const calc = (statut, i) => {
    const ret = statut === "retraites";
    const e = effort[statut];
    const dPat = u.patients * (ret ? prRet : 1 - prRet);
    const basePat = resteTotal * (ret ? partRetReste : 1 - partRetReste);
    const dPrim = u.primes * (ret ? pmRet : 1 - pmRet);
    const basePrim = primesTotal * (ret ? partRetPrimes : 1 - partRetPrimes);
    const emp = ret ? 0 : (100 * u.employeurs) / revenuActifs;
    return (e.reste[i] * dPat) / basePat + (e.primes[i] * dPrim) / basePrim + emp;
  };
  return {
    actifs: effort.actifs.reste.map((_, i) => calc("actifs", i)),
    retraites: effort.retraites.reste.map((_, i) => calc("retraites", i)),
  };
}
