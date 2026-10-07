// Bilan de toutes les mesures retenues (Héritage, Retraites, Santé) : affectation unique des recettes, effets
// croisés entre mesures (bouclage principal), solde par usage et effet cumulé sur les niveaux de vie.
// Fonctions pures, testées. Montants en Md€ par an ; effets sur les niveaux de vie en part du revenu disponible.
//
// Une mesure enregistrée (voir ui/etat-bilan.js) porte :
//   { id, espace, label, lien, reglages:[texte], net, usages:{ actifs, services, maladie }, ressources:[…],
//     effet:{ actifs, retraites }, details:{…} }
// `net` est le gain pour les finances publiques calculé par sa page, seule ; `usages` dit où va cet argent.

/** La mesure est-elle retenue ? Par défaut, oui si l'utilisateur l'a réglée. */
export const estRetenue = (etat, id) => etat.retenues?.[id] ?? Boolean(etat.touchees?.[id]);

/**
 * Qui détient une ressource parmi les mesures retenues : celle désignée par `affectations`, sinon la première
 * enregistrée. Renvoie aussi les mesures en concurrence.
 */
export function detenteur(etat, ressource) {
  const candidates = Object.values(etat.mesures)
    .filter((m) => m.ressources?.includes(ressource) && estRetenue(etat, m.id))
    .sort((a, b) => (a.premiereFois ?? a.majLe) - (b.premiereFois ?? b.majLe));
  const choisi = candidates.find((m) => m.id === etat.affectations?.[ressource]) ?? candidates[0] ?? null;
  return { detenteur: choisi?.id ?? null, candidates: candidates.map((m) => m.id) };
}

import { effetCsgRetraites } from "./niveau-de-vie.js";

export const USAGES = [
  { id: "actifs", label: "Baisse de CSG ou hausse du salaire net des actifs" },
  { id: "services", label: "Services publics" },
  { id: "maladie", label: "Réduction du déficit de l'Assurance maladie" },
  { id: "autres", label: "Autres comptes publics (effets croisés)" },
];

const somme = (xs) => xs.reduce((t, x) => t + x, 0);

/**
 * Recettes brutes d'un alignement de la CSG des pensions sur un taux cible (celui des actifs, éventuellement abaissé
 * par la TVA sociale), sur des assiettes éventuellement réduites par d'autres mesures. Jamais négatives : si la
 * cible passe sous le taux d'un retraité, son taux ne baisse pas.
 */
export function recettesAlignement({ normal, median }, cible, csg) {
  const taux = (id) => csg.retraites.taux.find((t) => t.id === id).taux;
  return {
    normal: normal * Math.max(0, cible - taux("normal")),
    median: median * Math.max(0, cible - taux("median")),
  };
}

/**
 * Calcule le bilan. `etat` vient de lireBilan() ; `ctx` = { csg, pensionsTotales, composition, masseNette,
 * ratioNetSurBrut, effetNetCsg (part de la CSG gardée après impôt sur le revenu, IPP) }.
 */
export function calculerBilan(etat, ctx) {
  const { csg } = ctx;
  const toutes = Object.values(etat.mesures);
  const retenues = toutes.filter((m) => estRetenue(etat, m.id));
  const par = Object.fromEntries(retenues.map((m) => [m.id, m]));

  // 1. Affectation unique : chaque ressource va à une seule mesure.
  const ressources = [...new Set(retenues.flatMap((m) => m.ressources ?? []))];
  const conflits = [];
  const perdues = {}; // id mesure → ressources qu'elle n'a pas
  for (const r of ressources) {
    const { detenteur: d, candidates } = detenteur(etat, r);
    if (candidates.length > 1) conflits.push({ ressource: r, detenteur: d, candidates });
    for (const c of candidates) if (c !== d) (perdues[c] ??= []).push(r);
  }

  // 2. Effets croisés.
  const tva = par.tva?.details;
  const baisseCsgTva = tva ? tva.baisseCsg / 100 : 0;
  const cible = csg.activite.taux - baisseCsgTva;
  const effets = [];

  // Pensions réduites par d'autres mesures : moins d'assiette pour la CSG et la cotisation maladie des retraités.
  const ecoHautes = (par.gel?.details.economie ?? 0) + (par.plafond?.details.economie ?? 0);
  const baisseUniforme = par.financement?.details.baissePensions ?? 0;
  const { assiettes } = csg.retraites;
  const assiettesApres = {
    normal: Math.max(0, assiettes.normal * (1 - baisseUniforme) - ecoHautes),
    median: assiettes.median * (1 - baisseUniforme),
  };
  const facteurAssiette = { normal: assiettesApres.normal / assiettes.normal, median: assiettesApres.median / assiettes.median };

  // Recettes de CSG des pensions, recalculées pour chaque mesure qui aligne la CSG.
  const ajustements = {}; // id → variation de ses recettes (Md€)
  const avant = recettesAlignement(assiettes, csg.activite.taux, csg);
  const apres = recettesAlignement(assiettesApres, cible, csg);
  const tient = (id, r) => !(perdues[id] ?? []).includes(r);
  if (par.csg) {
    const median = par.csg.details.portee === "median-normal";
    const brut = (tient("csg", "csg-pensions-normal") ? apres.normal : 0) + (median && tient("csg", "csg-pensions-median") ? apres.median : 0);
    ajustements.csg = brut * ctx.effetNetCsg - par.csg.net;
  }
  // La page Santé compte la CSG brute : elle va entière à l'Assurance maladie ; l'impôt sur le revenu perdu par
  // l'État est compté à part (effet croisé).
  let santeCsg = null;
  let irSante = 0;
  const s0 = par.sante?.details;
  if (s0?.csgCochee ?? s0?.csgAlignee) {
    santeCsg = { avant: s0.recettesCsg, apres: tient("sante", "csg-pensions-normal") ? apres.normal : 0 };
    ajustements.sante = santeCsg.apres - santeCsg.avant;
    irSante = santeCsg.apres * (1 - ctx.effetNetCsg);
  }
  if (s0?.recettesCotisation) {
    const facteur = (assiettesApres.normal + assiettesApres.median) / (assiettes.normal + assiettes.median);
    ajustements.sante = (ajustements.sante ?? 0) + s0.recettesCotisation * (facteur - 1);
  }
  if (santeCsg && !tient("sante", "csg-pensions-normal")) {
    effets.push({ id: "csg-ailleurs", titre: "La CSG des retraités sert déjà ailleurs", texte: "Vous avez affecté l'alignement de la CSG des pensions au taux normal à la baisse de CSG des actifs (Retraites). Il ne peut pas aussi financer l'Assurance maladie : la mesure Santé est comptée sans lui." });
  }
  if (par.csg && (perdues.csg ?? []).length) {
    effets.push({ id: "csg-sante", titre: "La CSG des retraités sert déjà la santé", texte: "Vous avez affecté l'alignement de la CSG des pensions au taux normal à l'Assurance maladie (Santé). Il ne peut pas aussi baisser la CSG des actifs : la mesure Retraites ne garde que ce qui reste (taux médian, s'il est choisi)." });
  }
  if (irSante > 0.05) {
    effets.push({ id: "ir-sante", titre: "La CSG des retraités en plus fait baisser leur impôt sur le revenu", texte: `Une partie de la CSG est déductible : les ${fmt(santeCsg.apres)} Md€ versés à l'Assurance maladie font perdre environ ${fmt(irSante)} Md€ d'impôt sur le revenu à l'État (IPP, 12,5 %).`, montant: -irSante });
  }

  if (tva && (par.csg || par.sante?.details.csgCochee)) {
    effets.push({
      id: "cible-csg",
      titre: "La TVA sociale abaisse le taux visé par l'alignement de la CSG des retraités",
      texte: `La TVA sociale baisse la CSG des actifs de ${fmt(tva.baisseCsg)} point : leur taux passe à ${fmt(cible * 100)} %. Aligner les retraités « sur les actifs » ne les porte donc plus qu'à ce taux${cible <= csg.retraites.taux.find((t) => t.id === "normal").taux ? ", qui n'est plus au-dessus du taux normal des pensions (8,3 %) : l'alignement ne rapporte plus rien" : ""}. Les baisses de CSG financées par les retraités eux-mêmes ne sont pas prises en compte, sinon la mesure se réduirait d'elle-même.`,
    });
  }
  if ((ecoHautes > 0 || baisseUniforme > 0) && (par.csg || par.sante?.details.csgCochee || par.sante?.details.recettesCotisation)) {
    effets.push({
      id: "assiette-pensions",
      titre: "Des pensions plus faibles rapportent moins de CSG et de cotisation",
      texte: `Le gel, le plafond ou la baisse des pensions retirent ${fmt(ecoHautes + baisseUniforme * assiettes.normal + baisseUniforme * assiettes.median)} Md€ de pensions soumises à la CSG au taux médian ou normal. Les mesures qui relèvent ces prélèvements rapportent d'autant moins (calcul : assiette réduite, les économies du gel et du plafond portant sur les pensions au taux normal).`,
    });
  }

  // 3. Recettes de chaque mesure après affectation et effets croisés, et leur usage.
  const lignes = retenues.map((m) => {
    const neutre = (perdues[m.id] ?? []).length > 0 && m.id !== "csg" && m.id !== "sante";
    const net = neutre ? 0 : m.net + (ajustements[m.id] ?? 0);
    // Usages au prorata de ceux de la page ; si la page ne comptait rien (recette alors affectée ailleurs), tout
    // va à l'usage principal de la mesure.
    const k = m.net !== 0 ? net / m.net : 0;
    const usages = Object.fromEntries(USAGES.map((u) => [u.id, m.net !== 0 ? (m.usages?.[u.id] ?? 0) * k : u.id === (m.usagePrincipal ?? "autres") ? net : 0]));
    return { mesure: m, net, k, usages, perdues: perdues[m.id] ?? [] };
  });

  // Baisse de CSG des actifs : la CSG en partie déductible, l'impôt sur le revenu remonte (miroir de l'IPP).
  const versesActifs = somme(lignes.map((l) => l.usages.actifs));
  const retourIr = versesActifs > 0 ? versesActifs * (1 - ctx.effetNetCsg) : 0;
  if (retourIr > 0.05) {
    effets.push({
      id: "ir-actifs",
      titre: "Une CSG plus basse fait remonter l'impôt sur le revenu",
      texte: `Une partie de la CSG est déductible du revenu imposable. Rendre ${fmt(versesActifs)} Md€ aux actifs (TVA sociale comprise), supposés versés en baisse de CSG, augmente leur impôt d'environ ${fmt(retourIr)} Md€ (même proportion que celle de l'IPP pour les retraités, 12,5 %) : l'État en récupère une partie, le gain des actifs est un peu plus faible.`,
      montant: retourIr,
    });
  }

  // TVA sociale : hausse des prix, revalorisation des pensions l'année suivante.
  let revalorisation = 0;
  if (tva) {
    revalorisation = (tva.pertePrixMoyenne ?? 0) * ctx.pensionsTotales;
    effets.push({
      id: "revalorisation",
      titre: "La hausse des prix est rendue aux retraités l'année suivante",
      texte: `La TVA relève les prix d'environ ${fmtPct(tva.pertePrixMoyenne)} du revenu. Les pensions étant revalorisées sur l'inflation, les caisses de retraite versent environ ${fmt(revalorisation)} Md€ de plus dès la deuxième année : la perte des retraités s'efface, mais il faut la financer. C'est un minimum : l'indice des prix monte un peu plus que la perte de pouvoir d'achat moyenne.`,
      montant: -revalorisation,
    });
  }

  // Effets internes à la page Santé, rappelés ici.
  const s = par.sante?.details;
  if (s?.tsaInduite) {
    effets.push({ id: "tsa-induite", titre: "Les hausses de primes rapportent de la TSA", texte: `Transférer des dépenses aux complémentaires fait monter les primes, elles-mêmes taxées : environ ${fmt(s.tsaInduite)} Md€ de TSA en plus, déjà comptés dans la mesure Santé.` });
  }
  if (s?.surcoutBouclier > 0.01) {
    effets.push({ id: "bouclier", titre: "Le bouclier rend une partie de l'effort demandé aux gros consommateurs", texte: `Franchises, ticket modérateur ou TSA font monter l'effort des ménages les plus exposés ; au-delà du plafond, le bouclier le prend en charge. Son coût augmente d'environ ${fmt(s.surcoutBouclier)} Md€, déjà compté dans la mesure Santé.` });
  }

  // Plafond de la baisse de CSG des actifs.
  // `versesActifs` comprend déjà la TVA sociale (ses recettes sont rendues en baisse de CSG).
  const baisseTotale = versesActifs / csg.activite.valeurPoint;
  if (baisseTotale > csg.activite.taux * 100) {
    effets.push({ id: "csg-nulle", titre: "La CSG des actifs ne peut pas descendre sous zéro", texte: `Vos mesures baisseraient la CSG des actifs de ${fmt(baisseTotale)} points, plus que son taux (9,2 %). Le surplus devrait être rendu autrement (salaire net, cotisations).` });
  }

  // 4. Solde par usage.
  const totaux = Object.fromEntries(USAGES.map((u) => [u.id, somme(lignes.map((l) => l.usages[u.id]))]));
  totaux.autres += retourIr - revalorisation - irSante;

  // 5. Niveaux de vie : effets des pages, mis à l'échelle des recettes recalculées ; baisse de CSG des actifs
  // amputée du retour d'impôt.
  const effetsNv = lignes.map((l) => {
    const e = l.mesure.effet ?? { actifs: 0, retraites: 0 };
    if (l.mesure.id === "sante") {
      // Ce que la Santé prend en plus ou en moins aux retraités par la CSG et la cotisation.
      return { id: "sante", label: l.mesure.label, actifs: e.actifs, retraites: e.retraites - (ctx.composition.partPensions * (ajustements.sante ?? 0)) / ctx.pensionsTotales };
    }
    if (l.mesure.id === "csg") {
      // Recalculé ici : la page a pu compter la recette comme affectée ailleurs.
      return { id: "csg", label: l.mesure.label, ...effetCsgRetraites(l.net / ctx.effetNetCsg, ctx, l.net) };
    }
    return { id: l.mesure.id, label: l.mesure.label, actifs: e.actifs * echelleActifs(l), retraites: e.retraites * echelleRetraites(l) };
  });
  if (retourIr > 0) effetsNv.push({ id: "ir-actifs", label: "Retour d'impôt sur le revenu", actifs: (-retourIr / ctx.masseNette) * ctx.composition.partActivite, retraites: 0 });
  const cumul = effetsNv.reduce((acc, e) => ({ actifs: (1 + acc.actifs) * (1 + e.actifs) - 1, retraites: (1 + acc.retraites) * (1 + e.retraites) - 1 }), { actifs: 0, retraites: 0 });

  return {
    retenues: retenues.map((m) => m.id),
    conflits,
    effets,
    lignes,
    totaux,
    total: somme(Object.values(totaux)),
    cible,
    santeCsg,
    niveauxDeVie: { effets: effetsNv, cumul, apresRevalorisation: tva ? { ...cumul, retraites: (1 + cumul.retraites) * (1 + (tva.pertePrixMoyenne ?? 0)) - 1 } : null },
  };
}

// Une mesure dont les recettes baissent rend moins aux actifs ; ce qu'elle prend aux retraités ne change que pour
// les mesures de CSG (moins d'assiette, taux visé plus bas).
function echelleActifs(l) {
  return l.mesure.effet?.actifs > 0 ? l.k : l.k === 0 ? 0 : 1;
}
function echelleRetraites(l) {
  return ["csg"].includes(l.mesure.id) || l.k === 0 ? l.k : 1;
}

const fmt = (v) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v);
const fmtPct = (v) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format((v ?? 0) * 100)} %`;
