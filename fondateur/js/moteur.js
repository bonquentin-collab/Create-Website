// Règles du jeu : le temps qui passe, les levées, les offres de rachat, les fins de partie.
// Indépendant de la langue : les textes viennent de `contenus` (contenus/<langue>/index.js).
import { lever, cascade, part, total, preferencesTotales } from './captable.js';
import { clamp, bouger, diluer, noter, partVous, runway, jauges, feve, ajouterFile } from './etat.js';

const copie = (x) => JSON.parse(JSON.stringify(x));
const arrondi = (x, pas) => Math.max(pas, Math.round(x / pas) * pas);

// ───────── Valorisation de marché ─────────

// Repères du marché français par étape : multiple du revenu annuel récurrent (ARR) et fourchette de pré-money.
const MULTIPLE_ARR = [0, 22, 14, 10, 8];
const FOURCHETTE = [null, [2e6, 9e6], [8e6, 40e6], [30e6, 130e6], [90e6, 400e6]];
const REPERE = [0, 4.5e6, 20e6, 60e6, 160e6];
const PART_LEVEE = [0, 0.22, 0.2, 0.18, 0.16];

export function valoMarche(e, etapeCible = Math.min(4, e.etape + 1)) {
  const traction = e.mrr * 12 * MULTIPLE_ARR[etapeCible];
  const repere = REPERE[etapeCible];
  const qualite = 0.55 + (e.jauges.produit / 100) * 0.4 + (e.jauges.equipe / 100) * 0.2 + (e.jauges.investisseurs / 100) * 0.15;
  // Moitié repère de l'étape, moitié traction réelle : une boîte sans revenus ne vaut pas zéro en Seed.
  let v = (0.5 * repere + 0.5 * traction) * qualite * e.marche;
  if (e.drapeaux.capitalMort) v *= 0.75;
  if (e.drapeaux.ia) v *= 1.15;
  if (e.drapeaux.us) v *= 1.25;
  const [min, max] = FOURCHETTE[etapeCible];
  return clamp(v, min * Math.min(1, e.marche), max);
}

// ───────── Levées ─────────

function offre(profil, e, v, etapeCible, cadre, rng) {
  const serie = cadre.etapes[etapeCible];
  const besoin = e.burn * 1.3 * 20;
  // On lève de quoi tenir deux ans, sans jamais dépasser la moitié de la pré-money.
  const base = Math.min(Math.max(v * PART_LEVEE[etapeCible], besoin), v * 0.5);
  const pool = etapeCible === 1 ? cadre.usages.poolBspce.seed : cadre.usages.poolBspce.serieA;
  const crise = e.marche < 0.8;
  const bruit = () => 0.92 + rng() * 0.16; // chaque fonds a sa propre lecture du dossier
  const o = { profil, serie, etapeCible, negociee: 0, dernierMot: false, autres: [] };
  if (profil === 'propre') {
    Object.assign(o, {
      id: `granit-${etapeCible}`, nom: cadre.noms.fondsPropre, perso: 'claire',
      montant: arrondi(base, 50_000), preMoney: arrondi(v * bruit(), 100_000),
      poolCible: pool, poolPreMoney: true, multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne',
      sieges: 1, independant: 1,
    });
  } else if (profil === 'flatteur') {
    Object.assign(o, {
      id: `ma-${etapeCible}`, nom: cadre.noms.fondsFlatteur, perso: 'marcantoine',
      montant: arrondi(base * 1.3, 50_000), preMoney: arrondi(v * (crise ? 1.25 : 1.5) * bruit(), 100_000),
      poolCible: 0.15 + (rng() < 0.5 ? 0.03 : 0), poolPreMoney: true,
      multiple: crise || rng() < 0.6 ? 2 : 1.5, participatif: true, plafond: null, antiDilution: 'ratchet',
      sieges: 2, independant: 0, autres: ['drag'],
    });
  } else if (profil === 'corporate') {
    Object.assign(o, {
      id: `corpo-${etapeCible}`, nom: cadre.noms.corporate, perso: 'corporate',
      montant: arrondi(base, 50_000), preMoney: arrondi(v * 1.2 * bruit(), 100_000),
      poolCible: pool, poolPreMoney: false, multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne',
      sieges: 1, independant: 0, autres: ['preemption'],
    });
  } else if (profil === 'angels') {
    Object.assign(o, {
      id: `angels-${etapeCible}`, nom: cadre.noms.clubAngels, perso: 'gerard',
      montant: arrondi(base * 0.35, 50_000), preMoney: arrondi(v * 0.9 * bruit(), 100_000),
      poolCible: 0, poolPreMoney: false, multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne',
      sieges: 0, independant: 0,
    });
  } else {
    Object.assign(o, {
      id: `altitude-${etapeCible}`, nom: cadre.noms.fondsCroissance, perso: 'croissance',
      montant: arrondi(base * 1.15, 100_000), preMoney: arrondi(v * 1.25 * bruit(), 100_000),
      poolCible: pool, poolPreMoney: true, multiple: 1.5, participatif: true, plafond: 3, antiDilution: 'moyenne',
      sieges: 1, independant: 0, autres: ['drag'],
    });
  }
  return o;
}

export function genererOffres(e, cadre, rng) {
  const etapeCible = Math.min(4, e.etape + 1);
  const v = valoMarche(e, etapeCible);
  const profils = etapeCible === 1 ? ['propre', 'flatteur', 'corporate', 'angels'] : ['propre', 'flatteur', 'croissance', 'corporate'];
  // En crise, les fonds sérieux se font rares.
  const retenus = e.marche < 0.8 ? profils.filter((p) => p !== 'propre' || rng() < 0.4) : profils;
  return retenus.map((p) => offre(p, e, v, etapeCible, cadre, rng));
}

export function doitLever(e) {
  if (e.levee || e.fin || e.etape >= 4 || e.mois < 6) return false;
  // Pas de nouvelle levée moins de 9 mois après la précédente, sauf urgence.
  if (e.etape > 0 && e.mois - e.moisDerniereLevee < 9 && runway(e) >= 3) return false;
  if (e.mois - (e.drapeaux.moisEchecLevee ?? -99) < 6) return false;
  const r = runway(e);
  if (e.drapeaux.leverVite) { e.drapeaux.leverVite = false; return true; }
  return r < 7 || (e.mois - e.moisDerniereLevee >= 18 && r < 18);
}

function ouvrirLevee(e, cadre, rng) {
  e.levee = { etapeCible: Math.min(4, e.etape + 1), debut: e.mois, offres: genererOffres(e, cadre, rng), messages: [], semaines: 0 };
  ajouterFile(e, { special: 'levee' });
}

// Un suiveur accepte le prix du chef de file s'il ne dépasse pas sa propre offre de plus de 15 %.
export const SEUIL_SUIVEUR = 1.15;

/**
 * Compose un tour à partir des offres choisies. La première est le chef de file : elle fixe la valorisation
 * et les conditions. Les autres suivent au même prix avec un ticket réduit (60 % de leur offre), ou se retirent.
 */
export function composerTour(e, ids) {
  const offres = ids.map((id) => e.levee.offres.find((o) => o.id === id)).filter(Boolean);
  if (!offres.length) return null;
  const [chef, ...autres] = offres;
  const suiveurs = [];
  const refus = [];
  for (const o of autres) {
    if (chef.preMoney <= o.preMoney * SEUIL_SUIVEUR) suiveurs.push({ id: o.id, nom: o.nom, montant: arrondi(o.montant * 0.6, 50_000), offre: o });
    else refus.push(o);
  }
  const participants = [{ id: chef.id, nom: chef.nom, montant: chef.montant }, ...suiveurs.map(({ id, nom, montant }) => ({ id, nom, montant }))];
  const tour = {
    ...copie(chef),
    montant: participants.reduce((t, p) => t + p.montant, 0),
    participants,
    sieges: chef.sieges + suiveurs.filter((s) => s.offre.sieges > 0).length,
  };
  return { tour, chef, suiveurs, refus };
}

// Ce que le tour ferait à la table, sans rien changer à la partie.
export function simulerOffre(e, o) {
  return lever(e.table, { ...o, notes: e.notes });
}

export function signerOffre(e, o) {
  const r = simulerOffre(e, o);
  // La fiche de calcul gardée au journal est exactement celle du bouton « Décrypter ».
  const calcul = { type: 'levee', ...copie(decrypter(e, o)) };
  const avec = o.participants?.length > 1 ? ` menée par ${o.nom}, avec ${o.participants.slice(1).map((p) => p.nom).join(' et ')}` : ` avec ${o.nom}`;
  diluer(e, r.table, { titre: `Levée ${o.serie}${avec}`, texte: '', calcul });
  e.notes = [];
  e.tresorerie += o.montant;
  e.board.investisseurs += o.sieges;
  e.board.independants += o.independant ?? 0;
  e.etape = o.etapeCible;
  e.derniere = { prix: r.prix, postMoney: r.postMoney, mois: e.mois, montant: o.montant };
  e.moisDerniereLevee = e.mois;
  for (const a of o.autres) e.drapeaux[a] = true;
  if (o.participatif) e.drapeaux.participatif = true;
  if (o.antiDilution === 'ratchet') e.drapeaux.ratchet = true;
  e.levee = null;
  bouger(e, { investisseurs: 15, equipe: 5 });
  // Le business plan promis aux investisseurs : on recrute.
  e.burn *= 1.3;
  e.croissanceBonus += 0.03;
  ajouterFile(e, { special: 'bilanLevee', calcul }, true);
  return r;
}

// Négocier une offre prend un mois. Issue : meilleure offre, dernier mot, ou retrait du fonds.
export function negocier(e, id, rng) {
  const o = e.levee.offres.find((x) => x.id === id);
  const t = rng();
  let issue;
  if (o.dernierMot || t >= 0.8 + 0.05 * o.negociee) {
    issue = o.dernierMot ? 'retrait' : t < 0.95 ? 'pareil' : 'retrait';
  } else issue = t < 0.45 ? 'mieux' : 'pareil';
  if (issue === 'mieux') {
    if (o.participatif && !o.plafond) o.plafond = 3;
    else if (o.participatif) { o.participatif = false; o.plafond = null; }
    else if (o.antiDilution === 'ratchet') o.antiDilution = 'moyenne';
    else if (o.multiple > 1) o.multiple = 1;
    else if (o.poolPreMoney && o.poolCible > 0.1) o.poolCible = 0.1;
    else o.preMoney = arrondi(o.preMoney * 1.1, 100_000);
    o.negociee += 1;
  } else if (issue === 'pareil') o.dernierMot = true;
  else e.levee.offres = e.levee.offres.filter((x) => x.id !== id);
  const duree = 1 + Math.floor(rng() * 3);
  e.levee.messages.push({ id, nom: o.nom, perso: o.perso, issue, semaines: duree });
  return { issue, duree };
}

// Les actions possibles pendant une levée. Négocier prend une à trois semaines : le mois ne passe qu'une fois
// quatre semaines écoulées. Écarter une offre ne prend pas de temps. Signer ou tout refuser fait passer le mois.
export function agirLevee(e, action, rng) {
  let passe = true;
  if (action.type === 'signer') {
    const c = composerTour(e, action.ids);
    for (const o of c.refus) noter(e, { type: 'evenement', titre: `${o.nom} ne suit pas`, texte: `Le chef de file valorise l'entreprise ${Math.round((c.chef.preMoney / o.preMoney - 1) * 100)} % au-dessus de son offre : trop cher pour ${o.nom}.` });
    signerOffre(e, c.tour);
  } else if (action.type === 'negocier') {
    const { duree } = negocier(e, action.id, rng);
    e.levee.semaines += duree;
    passe = e.levee.semaines >= 4;
    if (passe) e.levee.semaines -= 4;
  } else if (action.type === 'ecarter') {
    const o = e.levee.offres.find((x) => x.id === action.id);
    e.levee.offres = e.levee.offres.filter((x) => x.id !== action.id);
    e.levee.messages.push({ id: action.id, nom: o.nom, perso: o.perso, issue: 'ecartee', semaines: 0 });
    passe = false;
  } else if (action.type === 'refuser') {
    e.levee.offres = [];
  }
  if (!e.fin && passe) passerMois(e);
  verifierFin(e);
  if (e.levee && !e.fin) ajouterFile(e, { special: e.levee.offres.length ? 'levee' : 'echecLevee' }, true);
}

// ───────── Offres de rachat ─────────

export function genererSortie(e, cadre, rng, { acquihire = false } = {}) {
  const prefs = preferencesTotales(e.table);
  let prix;
  if (acquihire) prix = Math.max(500_000, prefs * (0.35 + rng() * 0.3));
  else {
    const ref = Math.max(e.derniere?.postMoney ?? 0, valoMarche(e, Math.max(1, e.etape)));
    prix = ref * (0.55 + rng() * 1.5) * e.marche;
    if (e.drapeaux.preemption) prix *= 0.75;
  }
  prix = arrondi(prix, 100_000);
  const acheteur = cadre.noms.acheteurs[Math.floor(rng() * cadre.noms.acheteurs.length)];
  return { prix, acheteur, acquihire };
}

export function vendre(e, s, contexte = 'vente') {
  const c = cascade(e.table, s.prix);
  const vous = c.find((d) => d.id === 'vous');
  e.fin = {
    type: contexte, prix: s.prix, acheteur: s.acheteur, cascade: c,
    naif: vous.pct * s.prix, reel: vous.montant + e.encaisse, encaisse: e.encaisse,
    preferences: preferencesTotales(e.table),
  };
}

// ───────── Le temps qui passe ─────────

export function passerMois(e) {
  e.mois += 1;
  // Croissance mensuelle : portée par le produit et l'équipe, freinée par la taille (plus dur de doubler à 1 M€ de MRR).
  const elan = 0.015 + (e.jauges.produit / 100) * 0.11 + (e.jauges.equipe / 100) * 0.04 + e.croissanceBonus;
  const croissance = clamp(elan * (0.7 + 0.3 * e.marche) / (1 + e.mrr / 250_000), -0.12, 0.25);
  e.mrr = Math.max(0, e.mrr * (1 + croissance));
  const mensualite = e.dette?.mensualite ?? 0;
  e.tresorerie += e.mrr - e.burn - mensualite;
  if (e.dette) { e.dette.restant -= 1; if (e.dette.restant <= 0) e.dette = null; }
  // Une startup embauche à mesure qu'elle grandit : les dépenses suivent le chiffre d'affaires.
  e.burn += Math.max(0, e.mrr * 1.3 + 15_000 - e.burn) * 0.08;
  e.jauges.produit = clamp(e.jauges.produit - 0.15);
  e.jauges.equipe = clamp(e.jauges.equipe + (55 - e.jauges.equipe) * 0.05);
  e.jauges.investisseurs = clamp(e.jauges.investisseurs + (55 - e.jauges.investisseurs) * 0.04);
  e.croissanceBonus *= 0.85;
  e.marche += (1 - e.marche) * 0.04;
  e.historique.push({ mois: e.mois, part: partVous(e) });
}

export function verifierFin(e) {
  if (e.fin) return e.fin;
  const g = jauges(e);
  if (e.tresorerie < 0) e.fin = { type: 'faillite' };
  else if (g.equipe <= 0) e.fin = { type: 'equipe' };
  else if (g.produit <= 0) e.fin = { type: 'produit' };
  else if (g.investisseurs <= 0) {
    if (feve(e) === 'investisseurs' || feve(e) === 'partage') e.fin = { type: 'revoque' };
    else {
      e.jauges.investisseurs = 8;
      noter(e, { type: 'evenement', titre: 'Vos investisseurs veulent votre tête', texte: 'Ils ne peuvent rien faire : les fondateurs gardent la majorité du board. Gardez la fève.' });
    }
  }
  if (e.fin && !e.fin.cascade) {
    // Sans vente, les actions ne valent rien : on garde la table pour l'écran de fin.
    e.fin.cascade = cascade(e.table, 0);
    e.fin.naif = 0;
    e.fin.reel = e.encaisse;
    e.fin.encaisse = e.encaisse;
    e.fin.prix = 0;
    e.fin.preferences = preferencesTotales(e.table);
  }
  return e.fin;
}

// ───────── Pioche ─────────

export function piocher(e, contenus, rng) {
  if (e.fin) return null;
  if (e.levee && !e.file.length) ajouterFile(e, { special: e.levee.offres.length ? 'levee' : 'echecLevee' });
  if (!e.file.length && doitLever(e)) ouvrirLevee(e, contenus.cadre, rng);
  if (!e.file.length && e.mois >= 108) ajouterFile(e, { special: 'liquidite' });
  if (!e.file.length && e.etape >= 1 && runway(e) < 3 && !e.vus.acquihire && !e.levee) {
    e.vus.acquihire = true;
    ajouterFile(e, { special: 'sortie', sortie: genererSortie(e, contenus.cadre, rng, { acquihire: true }) });
  }
  if (!e.file.length && !e.levee && e.mois >= 24 && (e.etape >= 2 || e.mois >= 40) && rng() < 0.045) {
    ajouterFile(e, { special: 'sortie', sortie: genererSortie(e, contenus.cadre, rng) });
  }
  while (e.file.length) {
    const c = e.file.shift();
    const carte = c.special ? contenus.special(c, e) : contenus.cartes.find((x) => x.id === c.id);
    if (carte && (!carte.cond || carte.cond(e))) return carte;
  }
  const eligibles = contenus.cartes.filter((c) => !c.force && (!c.unique || !e.vus[c.id])
    && (e.mois - (e.vus[c.id] ?? -99) >= (c.delai ?? 8)) && (!c.cond || c.cond(e)));
  const poidsTotal = eligibles.reduce((s, c) => s + (c.poids ?? 1), 0);
  let t = rng() * poidsTotal;
  for (const c of eligibles) {
    t -= c.poids ?? 1;
    if (t <= 0) return c;
  }
  if (eligibles.length) return eligibles[0];
  // Pioche épuisée : on reprend la carte répétable vue il y a le plus longtemps.
  const repetables = contenus.cartes.filter((c) => !c.force && !c.unique && (!c.cond || c.cond(e)));
  repetables.sort((a, b) => (e.vus[a.id] ?? -99) - (e.vus[b.id] ?? -99));
  return repetables[0] ?? null;
}

// Les options d'une carte : `options` si la carte en a plusieurs, sinon gauche / droite.
// Avec trois options : gauche, haut (l'option intermédiaire), droite.
export const options = (carte) => carte.options ?? (carte.info ? [carte.d] : carte.h ? [carte.g, carte.h, carte.d] : [carte.g, carte.d]);

// Applique un choix (index de l'option) puis fait passer un mois (sauf pour les cartes d'information).
export function jouer(e, carte, index, rng) {
  if (carte.id) e.vus[carte.id] = e.mois;
  options(carte)[index]?.effet?.(e, rng);
  if (!e.fin && !carte.sansTemps) passerMois(e);
  verifierFin(e);
  return e;
}

// Aperçu façon « points au-dessus des jauges » : quelles jauges bougent, pas dans quel sens.
// La part du fondateur n'apparaît que pour la dilution visible (l'argent du nouvel investisseur).
export function apercu(e, carte, index) {
  const avant = jauges(e);
  const f = copie(e);
  const choix = options(carte)[index];
  let seed = 7;
  const rngFixe = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  try { choix?.effet?.(f, rngFixe); } catch { return {}; }
  const apres = jauges(f);
  const res = {};
  for (const k of Object.keys(avant)) {
    const d = Math.abs(apres[k] - avant[k]);
    if (d >= 1) res[k] = d >= 10 ? 2 : 1;
  }
  if (choix?.diluteVisible) res.part = 2;
  // Pour le mode prof : toute la dilution, y compris celle qui ne se verra que plus tard.
  res.partReelle = partVous(f) - partVous(e);
  res.differee = f.notes.length > e.notes.length;
  return res;
}

// ───────── Décryptage pédagogique d'une offre ─────────

export function decrypter(e, o) {
  const r = simulerOffre(e, o);
  const avant = partVous(e);
  const apres = part(r.table, 'vous');
  const partNaive = avant * (o.preMoney / (o.preMoney + o.montant));
  const post = o.preMoney + o.montant;
  const S = total(e.table);
  const prixVente = [0.5, 1.25, 4].map((m) => arrondi(post * m, 100_000));
  const scenarios = prixVente.map((p) => {
    const c = cascade(r.table, p);
    const v = c.find((d) => d.id === 'vous');
    const ids = (o.participants ?? [o]).map((x) => x.id);
    const inv = c.filter((d) => ids.includes(d.id));
    return { prix: p, naif: v.pct * p, reel: v.montant, investisseur: inv.reduce((t, d) => t + d.montant, 0), modeInvestisseur: inv[0].mode };
  });
  return {
    offre: o, avant, apres, partNaive, actionsAvant: S,
    prix: r.prix, postMoney: r.postMoney, postAnnonce: post,
    preMoneyEffective: r.preMoneyEffective, ajoutPool: r.ajoutPool, valeurPool: r.ajoutPool * r.prix,
    conversions: r.conversions.map((c) => {
      const n = e.notes.find((x) => x.id === c.id);
      return { ...c, montant: n.montant, decote: n.decote, plafondValo: n.plafondValo, prixDecote: r.prix * (1 - n.decote), prixPlafond: n.plafondValo ? n.plafondValo / S : null };
    }),
    ajustements: r.ajustements,
    partInvestisseur: (o.participants ?? [o]).reduce((t, x) => t + part(r.table, x.id), 0),
    scenarios,
  };
}

export { jauges, runway, partVous, feve };
