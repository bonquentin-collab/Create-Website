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
