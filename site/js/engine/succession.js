// Calcul de l'impôt dû par un héritier en ligne directe, sous le droit actuel et sous une réforme.
// Fonctions pures : aucune dépendance au DOM, testées dans tests/engine.test.mjs.

import { appliquerBareme } from "./bareme.js";

/**
 * @typedef {Object} SituationHeritier
 * @property {number} montant            Patrimoine reçu hors assurance-vie (€)
 * @property {number} [assuranceVie]     Capitaux d'assurance-vie reçus (€), primes versées avant 70 ans
 * @property {1|2}    [nbParents]        Nombre de parents dont on hérite (1 ou 2)
 * @property {number} [plusValuesLatentes] Plus-values latentes comprises dans le montant (€)
 */

/**
 * @typedef {Object} ResultatImpot
 * @property {number} impot       Impôt total (€)
 * @property {number} recu        Montant brut reçu (€)
 * @property {number} net         Montant net d'impôt (€)
 * @property {number} tauxMoyen   impot / recu
 * @property {{label:string, montant:number}[]} postes  Décomposition de l'impôt
 */

function normaliser(s) {
  return {
    montant: Math.max(0, Number(s.montant) || 0),
    assuranceVie: Math.max(0, Number(s.assuranceVie) || 0),
    nbParents: s.nbParents === 2 ? 2 : 1,
    plusValuesLatentes: Math.max(0, Number(s.plusValuesLatentes) || 0),
  };
}

function resultat(recu, postes) {
  const impot = postes.reduce((t, p) => t + p.montant, 0);
  return { impot, recu, net: recu - impot, tauxMoyen: recu > 0 ? impot / recu : 0, postes };
}

/**
 * Droit actuel : chaque parent transmet sa part, avec son propre abattement de 100 000 €.
 * L'assurance-vie suit un régime séparé (art. 990 I). Les plus-values latentes sont effacées.
 */
export function impotDroitActuel(situation, params) {
  const s = normaliser(situation);
  const part = s.montant / s.nbParents;
  const partAV = s.assuranceVie / s.nbParents;

  const droits = appliquerBareme(part - params.abattementEnfant, params.baremeLigneDirecte).impot * s.nbParents;
  const av = appliquerBareme(partAV - params.assuranceVie.abattement, params.assuranceVie.bareme).impot * s.nbParents;

  return resultat(s.montant + s.assuranceVie, [
    { label: "Droits de succession", montant: droits },
    { label: "Prélèvement sur l'assurance-vie", montant: av },
  ]);
}

/**
 * Réforme à barème unique sur la vie entière : tout ce qui est reçu entre dans une seule assiette,
 * quel que soit le nombre de parents, et les plus-values latentes supportent le PFU.
 */
export function impotBaremeVie(situation, reforme) {
  const s = normaliser(situation);
  const recu = s.montant + s.assuranceVie;
  const droits = appliquerBareme(recu, reforme.bareme).impot;
  const pv = Math.min(s.plusValuesLatentes, s.montant) * (reforme.pfu ?? 0);

  return resultat(recu, [
    { label: "Impôt sur les sommes reçues", montant: droits },
    { label: "Prélèvement forfaitaire (PFU) sur les plus-values latentes", montant: pv },
  ]);
}

/** Compare deux régimes pour une même situation. */
export function comparer(situation, calculAvant, calculApres) {
  const avant = calculAvant(situation);
  const apres = calculApres(situation);
  return { avant, apres, ecart: apres.impot - avant.impot };
}
