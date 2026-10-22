// Modèle macro des droits sur les héritages, calé sur le Conseil d'analyse économique (2021).
// Calcul pur, sans DOM : testé dans tests/campagne.test.mjs et reproduit par le classeur Chiffrage_Campagne.xlsx.
//
// Principe. Une génération d'héritiers est découpée en 14 tranches selon ce qu'elle reçoit sur toute la vie (CAE).
// Pour chaque tranche, l'héritage économique se partage entre une part déclarée et taxée, des parts exonérées
// (assurance-vie, démembrement, pacte Dutreil) et une part qui échappe au fisc (donations anciennes, biens non déclarés).
// On calcule l'impôt d'une réforme et celui du droit actuel avec le même moteur ; le supplément de recettes est leur
// différence, ce qui neutralise les approximations communes aux deux. Les recettes suivent ensuite le flux successoral.

import { heritiers, niches, baremes, flux, plusValues } from "../donnees/sources.js";

export function bareme(montant, tranches) {
  let impot = 0;
  let bas = 0;
  for (const { jusqua, taux } of tranches) {
    if (montant > bas) impot += (Math.min(montant, jusqua) - bas) * taux;
    bas = jusqua;
    if (montant <= bas) break;
  }
  return impot;
}

const T = heritiers.tranches;
const poids = T.map((t) => t.p);
const brut = T.map((t) => t.a / (1 - t.tauxEco));
const partDeclaree = T.map((t) => (t.tauxDeclare ? t.tauxEco / t.tauxDeclare : heritiers.partDeclareeSansDroits));
const impotObserve = brut.map((b, i) => b * T[i].tauxEco);

// Nombre d'héritiers par an (équivalent génération) : recettes actuelles du CAE / impôt moyen observé.
const N = (heritiers.recettesActuelles * 1e9) / poids.reduce((s, p, i) => s + p * impotObserve[i], 0);
// Base économique du modèle à l'époque des données du CAE (Md€) : sert à suivre le flux successoral.
const fluxReference = (N * poids.reduce((s, p, i) => s + p * brut[i], 0)) / 1e9;

// Droit actuel dans le moteur : barème en ligne directe sur la part déclarée, un abattement de 100 000 €.
const impotActuel = (base) => bareme(Math.max(0, base - 100_000), baremes.actuel);
const recettes = (bases, fonction) => (N * poids.reduce((s, p, i) => s + p * fonction(bases[i]), 0)) / 1e9;
const basesDeclarees = brut.map((b, i) => b * partDeclaree[i]);
const recettesActuellesModele = recettes(basesDeclarees, impotActuel);

// Calage : échelle de chaque profil de niche telle que son intégration au barème actuel coûte ce qu'estime le CAE.
function caler(profil, cible, fraction = 1) {
  let bas = 0;
  let haut = 5;
  for (let k = 0; k < 60; k++) {
    const m = (bas + haut) / 2;
    const bases = basesDeclarees.map((d, i) => d + brut[i] * profil[i] * m * fraction);
    if (recettes(bases, impotActuel) - recettesActuellesModele < cible) bas = m;
    else haut = m;
  }
  return (bas + haut) / 2;
}
const echelles = {
  assuranceVie: caler(niches.profils.assuranceVie, niches.cibles.assuranceVie),
  demembrement: caler(niches.profils.demembrement, niches.cibles.demembrement),
  dutreil: caler(niches.profils.dutreil, niches.cibles.dutreilResserre, 1 / 3),
};
const composition = T.map((_, i) => {
  const av = niches.profils.assuranceVie[i] * echelles.assuranceVie;
  const dem = niches.profils.demembrement[i] * echelles.demembrement;
  const dut = niches.profils.dutreil[i] * echelles.dutreil;
  return { declaree: partDeclaree[i], assuranceVie: av, demembrement: dem, dutreil: dut, autre: 1 - partDeclaree[i] - av - dem - dut };
});

export const calage = { N, fluxReference, recettesActuellesModele, echelles, composition, brut };

// Part de chaque niche réintégrée dans l'assiette selon le réglage.
const PART = {
  dutreil: { supprimer: 1, resserrer: 1 / 3, maintenir: 0 }, // exonération 75 % ; resserrée à 50 %
  assuranceVie: { bareme: 1, actuel: 0 },
  demembrement: { supprimer: 1, maintenir: 0 },
};

export function assiette(reglages, i) {
  const c = composition[i];
  const n = reglages.niches;
  if (n.tout) return brut[i];
  const parts = c.declaree
    + c.assuranceVie * PART.assuranceVie[n.assuranceVie]
    + c.demembrement * PART.demembrement[n.demembrement]
    + c.dutreil * PART.dutreil[n.dutreil]
    + (n.toutesTransmissions ? c.autre : 0);
  return brut[i] * parts;
}

export function impotReforme(reglages, i) {
  return bareme(Math.max(0, assiette(reglages, i) - reglages.abattement), reglages.bareme);
}

const PV = { effacees: 0, top1: 1, tous: 1 / plusValues.partTop1 };

// Évalue une réforme sur 2025-2040 : recettes actuelles, supplément, et qui paierait plus ou moins.
export function evaluer(reglages) {
  const impots = T.map((_, i) => impotReforme(reglages, i));
  const supplementReference = recettes(T.map((_, i) => i), (i) => impots[i]) - recettesActuellesModele;
  const facteurs = flux.valeurs.map((f) => f / fluxReference);
  const actuelles = facteurs.map((k) => recettesActuellesModele * k);
  const pv = plusValues.top1.map((v) => v * PV[reglages.niches.tout ? "tous" : reglages.niches.plusValues]);
  const supplement = facteurs.map((k, t) => supplementReference * k + pv[t]);
  const parTranche = T.map((t, i) => {
    const avant = impotActuel(basesDeclarees[i]);
    const apres = impots[i];
    const ecart = apres - avant;
    const sens = brut[i] === 0 ? "egal" : ecart > 0.001 * brut[i] ? "plus" : ecart < -0.001 * brut[i] ? "moins" : "egal";
    return { id: t.id, p: t.p, montant: brut[i], tauxAvant: brut[i] ? avant / brut[i] : 0, tauxApres: brut[i] ? apres / brut[i] : 0, sens };
  });
  const part = (s) => parTranche.filter((x) => x.sens === s).reduce((a, x) => a + x.p, 0);
  return {
    annees: flux.annees,
    actuelles,
    supplement,
    cumul: supplement.reduce((a, b) => a + b, 0),
    parTranche,
    parts: { plus: part("plus"), moins: part("moins"), egal: part("egal") },
    tauxMoyen: (actuelles[0] + supplement[0]) / flux.valeurs[0],
  };
}
