// Règles du jeu : le temps qui passe, les levées, les offres de rachat, les fins de partie.
// Indépendant de la langue : les textes viennent de `contenus` (contenus/<langue>/index.js).
import { lever, cascade, part, total, preferencesTotales } from './captable.js';
import { clamp, bouger, diluer, noter, partVous, runway, jauges, feve, ajouterFile } from './etat.js';

const copie = (x) => JSON.parse(JSON.stringify(x));
const arrondi = (x, pas) => Math.max(pas, Math.round(x / pas) * pas);

// ───────── Valorisation de marché ─────────

const MULTIPLE_ARR = [0, 22, 14, 10, 8];
const PLANCHER = [0, 3e6, 12e6, 40e6, 100e6];
const PART_LEVEE = [0, 0.22, 0.2, 0.18, 0.16];

export function valoMarche(e, etapeCible = Math.min(4, e.etape + 1)) {
  const arr = e.mrr * 12;
  const mult = MULTIPLE_ARR[etapeCible];
  const plancher = PLANCHER[etapeCible];
  const traction = arr * mult;
  const qualite = 0.5 + (e.jauges.produit / 100) * 0.45 + (e.jauges.equipe / 100) * 0.25 + (e.jauges.investisseurs / 100) * 0.15;
  const base = 0.55 * traction + 0.45 * plancher * Math.min(1.4, traction / plancher + 0.35);
  let v = base * qualite * e.marche;
  if (e.drapeaux.capitalMort) v *= 0.75;
  if (e.drapeaux.ia) v *= 1.15;
  if (e.drapeaux.us) v *= 1.25;
  return v;
}

// ───────── Levées ─────────

function offre(profil, e, v, etapeCible, cadre, rng) {
  const serie = cadre.etapes[etapeCible];
  const besoin = e.burn * 1.3 * 20;
  // On lève de quoi tenir deux ans, sans jamais dépasser la moitié de la pré-money.
  const base = Math.min(Math.max(v * PART_LEVEE[etapeCible], besoin), v * 0.5);
  const pool = etapeCible === 1 ? cadre.usages.poolBspce.seed : cadre.usages.poolBspce.serieA;
  const crise = e.marche < 0.8;
  const o = { profil, serie, etapeCible, negociee: false, autres: [] };
  if (profil === 'propre') {
    Object.assign(o, {
      id: `granit-${etapeCible}`, nom: cadre.noms.fondsPropre, perso: 'claire',
      montant: arrondi(base, 50_000), preMoney: arrondi(v, 100_000),
      poolCible: pool, poolPreMoney: true, multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne',
      sieges: 1, independant: 1,
    });
  } else if (profil === 'flatteur') {
    Object.assign(o, {
      id: `ma-${etapeCible}`, nom: cadre.noms.fondsFlatteur, perso: 'marcantoine',
      montant: arrondi(base * 1.3, 50_000), preMoney: arrondi(v * (crise ? 1.25 : 1.5), 100_000),
      poolCible: 0.15 + (rng() < 0.5 ? 0.03 : 0), poolPreMoney: true,
      multiple: crise || rng() < 0.6 ? 2 : 1.5, participatif: true, plafond: null, antiDilution: 'ratchet',
      sieges: 2, independant: 0, autres: ['drag'],
    });
  } else if (profil === 'corporate') {
    Object.assign(o, {
      id: `corpo-${etapeCible}`, nom: cadre.noms.corporate, perso: 'corporate',
      montant: arrondi(base, 50_000), preMoney: arrondi(v * 1.2, 100_000),
      poolCible: pool, poolPreMoney: false, multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne',
      sieges: 1, independant: 0, autres: ['preemption'],
    });
  } else {
    Object.assign(o, {
      id: `altitude-${etapeCible}`, nom: cadre.noms.fondsCroissance, perso: 'croissance',
      montant: arrondi(base * 1.15, 100_000), preMoney: arrondi(v * 1.25, 100_000),
      poolCible: pool, poolPreMoney: true, multiple: 1.5, participatif: true, plafond: 3, antiDilution: 'moyenne',
      sieges: 1, independant: 0, autres: ['drag'],
    });
  }
  return o;
}

export function genererOffres(e, cadre, rng) {
  const etapeCible = Math.min(4, e.etape + 1);
  const v = valoMarche(e, etapeCible);
  const profils = ['propre', 'flatteur', etapeCible === 1 ? 'corporate' : 'croissance'];
  // Mélange : l'offre flatteuse n'arrive pas toujours en premier.
  for (let i = profils.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [profils[i], profils[j]] = [profils[j], profils[i]];
  }
  // En crise, les fonds sérieux se font rares.
  const retenus = e.marche < 0.8 ? profils.filter((p) => p !== 'propre').concat(rng() < 0.4 ? ['propre'] : []) : profils;
  return retenus.map((p) => offre(p, e, v, etapeCible, cadre, rng));
}

export function doitLever(e) {
  if (e.levee || e.fin || e.etape >= 4 || e.mois < 6) return false;
  // Pas de nouvelle levée moins de 9 mois après la précédente, sauf urgence.
  if (e.etape > 0 && e.mois - e.moisDerniereLevee < 9 && runway(e) >= 3) return false;
  if (e.mois - (e.drapeaux.moisEchecLevee ?? -99) < 6) return false;
  const r = runway(e);
  return r < 7 || (e.mois - e.moisDerniereLevee >= 18 && r < 18);
}

function ouvrirLevee(e, cadre, rng) {
  const offres = genererOffres(e, cadre, rng);
  e.levee = { etapeCible: Math.min(4, e.etape + 1), debut: e.mois };
  ajouterFile(e, { special: 'annonceLevee', levee: true });
  for (const o of offres) ajouterFile(e, { special: 'offre', offre: o, levee: true });
  ajouterFile(e, { special: 'echecLevee', levee: true });
}

// Ce que l'offre ferait à la table, sans rien changer à la partie.
export function simulerOffre(e, o) {
  return lever(e.table, { ...o, notes: e.notes });
}

export function signerOffre(e, o) {
  const r = simulerOffre(e, o);
  // La fiche de calcul gardée au journal est exactement celle du bouton « Décrypter ».
  const calcul = { type: 'levee', ...copie(decrypter(e, o)) };
  diluer(e, r.table, { titre: `Levée ${o.serie} avec ${o.nom}`, texte: '', calcul });
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
  e.file = e.file.filter((c) => !c.levee);
  bouger(e, { investisseurs: 15, equipe: 5 });
  // Le business plan promis aux investisseurs : on recrute.
  e.burn *= 1.3;
  e.croissanceBonus += 0.03;
  ajouterFile(e, { special: 'bilanLevee', calcul }, true);
  return r;
}

// Négocier : meilleure offre, offre à prendre ou à laisser, ou retrait du fonds.
export function negocier(e, o, rng) {
  const t = rng();
  const nouvelle = copie(o);
  nouvelle.negociee = true;
  if (t < 0.45) {
    if (o.participatif && !o.plafond) nouvelle.plafond = 3;
    else if (o.participatif) { nouvelle.participatif = false; nouvelle.plafond = null; }
    else if (o.antiDilution === 'ratchet') nouvelle.antiDilution = 'moyenne';
    else if (o.multiple > 1) nouvelle.multiple = 1;
    else if (o.poolPreMoney && o.poolCible > 0.1) nouvelle.poolCible = 0.1;
    else nouvelle.preMoney = arrondi(o.preMoney * 1.1, 100_000);
    ajouterFile(e, { special: 'offre', offre: nouvelle, levee: true, issue: 'mieux' }, true);
    return 'mieux';
  }
  if (t < 0.8) {
    ajouterFile(e, { special: 'offre', offre: nouvelle, levee: true, issue: 'pareil' }, true);
    return 'pareil';
  }
  ajouterFile(e, { special: 'retrait', offre: o, levee: true }, true);
  return 'retrait';
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

// Applique un choix puis fait passer un mois (sauf pour les cartes d'information).
export function jouer(e, carte, cote, rng) {
  if (carte.id) e.vus[carte.id] = e.mois;
  const choix = cote === 'gauche' ? carte.g : carte.d;
  choix.effet?.(e, rng);
  if (!e.fin && !carte.sansTemps) passerMois(e);
  verifierFin(e);
  return e;
}

// Aperçu façon « points au-dessus des jauges » : quelles jauges bougent, pas dans quel sens.
// La part du fondateur n'apparaît que pour la dilution visible (l'argent du nouvel investisseur).
export function apercu(e, carte, cote) {
  const avant = jauges(e);
  const f = copie(e);
  const choix = cote === 'gauche' ? carte.g : carte.d;
  let seed = 7;
  const rngFixe = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  try { choix.effet?.(f, rngFixe); } catch { return {}; }
  const apres = jauges(f);
  const res = {};
  for (const k of Object.keys(avant)) {
    const d = Math.abs(apres[k] - avant[k]);
    if (d >= 1) res[k] = d >= 10 ? 2 : 1;
  }
  if (carte.diluteVisible?.(cote)) res.part = 2;
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
    const inv = c.find((d) => d.id === o.id);
    return { prix: p, naif: v.pct * p, reel: v.montant, investisseur: inv.montant, modeInvestisseur: inv.mode };
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
    partInvestisseur: part(r.table, o.id),
    scenarios,
  };
}

export { jauges, runway, partVous, feve };
