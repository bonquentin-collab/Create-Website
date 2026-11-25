// Moteur de table de capitalisation : levées, pool BSPCE, anti-dilution, BSA AIR et cascade de sortie.
// Aucune dépendance au DOM : testé par tests/fondateur.test.mjs.

const copie = (x) => JSON.parse(JSON.stringify(x));

export function creerTable(detenteurs) {
  return detenteurs.map((d) => ({ pref: null, categorie: 'fondateur', ...d }));
}

export const total = (table) => table.reduce((s, d) => s + d.actions, 0);

export function part(table, id) {
  const t = total(table);
  const d = table.find((x) => x.id === id);
  return d && t ? d.actions / t : 0;
}

export function partCategorie(table, categorie) {
  const t = total(table);
  return t ? table.filter((d) => d.categorie === categorie).reduce((s, d) => s + d.actions, 0) / t : 0;
}

// Actions à créer AVANT la levée pour que le pool représente `cible` du capital APRÈS la levée
// (le « option pool shuffle » : seuls les actionnaires existants en paient le coût).
export function poolPreMoney({ actionsExistantes, poolExistant, cible, montant, preMoney }) {
  const k = 1 + montant / preMoney;
  return Math.max(0, (cible * actionsExistantes * k - poolExistant) / (1 - cible * k));
}

function trouverPool(t) {
  let esop = t.find((d) => d.id === 'esop');
  if (!esop) {
    esop = { id: 'esop', nom: 'Pool BSPCE (salariés)', categorie: 'esop', actions: 0, pref: null };
    t.push(esop);
  }
  return esop;
}

/**
 * Tour de financement en actions de préférence.
 * o : { id, nom, serie, montant, preMoney, poolCible, poolPreMoney, multiple, participatif, plafond, antiDilution, notes }
 * notes : BSA AIR / SAFE en attente [{ id, nom, montant, decote, plafondValo }] convertis à ce tour.
 * participants : tour à plusieurs fonds [{ id, nom, montant }], tous au même prix et aux mêmes conditions
 *   que le chef de file ; par défaut, le seul fonds décrit par `o`. `o.montant` est alors le total du tour.
 */
export function lever(table, o) {
  const t = copie(table);
  const esop = trouverPool(t);
  const S = total(t);
  const cible = o.poolCible ?? 0;
  let ajoutPool = 0;
  let prix;
  if (o.poolPreMoney && cible > 0) {
    ajoutPool = poolPreMoney({ actionsExistantes: S, poolExistant: esop.actions, cible, montant: o.montant, preMoney: o.preMoney });
    // Les BSA AIR convertis s'ajoutent au capital après la levée : on ajuste le pool par point fixe
    // pour qu'il pèse bien `cible` une fois tout converti.
    if (o.notes?.length) {
      for (let i = 0; i < 40; i++) {
        const p = o.preMoney / (S + ajoutPool);
        const actionsNotes = o.notes.reduce((s, n) => s + n.montant / Math.min(p * (1 - (n.decote ?? 0)), n.plafondValo ? n.plafondValo / S : Infinity), 0);
        const T = S + ajoutPool + o.montant / p + actionsNotes;
        ajoutPool = Math.max(0, cible * T - esop.actions);
      }
    }
    esop.actions += ajoutPool;
    prix = o.preMoney / (S + ajoutPool);
  } else {
    prix = o.preMoney / S;
  }
  const nouvelles = o.montant / prix;

  // Anti-dilution des préférentiels existants si le prix baisse (down round).
  const ajustements = [];
  for (const d of t) {
    if (!d.pref || d.pref.prixConv <= prix || d.pref.antiDilution === 'aucune') continue;
    const avant = d.actions;
    let nouveauPrix;
    if (d.pref.antiDilution === 'ratchet') nouveauPrix = prix;
    else {
      // Moyenne pondérée large : P2 = P1 × (A + B) / (A + C)
      const A = S;
      const B = o.montant / d.pref.prixConv;
      const C = nouvelles;
      nouveauPrix = (d.pref.prixConv * (A + B)) / (A + C);
    }
    d.pref.prixConv = nouveauPrix;
    d.actions = d.pref.investi / nouveauPrix;
    ajustements.push({ id: d.id, nom: d.nom, actionsAjoutees: d.actions - avant, mode: d.pref.antiDilution });
  }

  // Conversion des BSA AIR : au plus bas entre le prix décoté et le prix plafond.
  const conversions = [];
  for (const n of o.notes ?? []) {
    const prixPlafond = n.plafondValo ? n.plafondValo / S : Infinity;
    const pc = Math.min(prix * (1 - (n.decote ?? 0)), prixPlafond);
    const actions = n.montant / pc;
    t.push({
      id: n.id, nom: n.nom, categorie: 'investisseur', actions,
      pref: { serie: o.serie, investi: n.montant, prixOrig: pc, prixConv: pc, multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne' },
    });
    conversions.push({ id: n.id, nom: n.nom, prix: pc, actions });
  }

  const participants = o.participants ?? [{ id: o.id, nom: o.nom, montant: o.montant }];
  for (const pa of participants) {
    t.push({
      id: pa.id, nom: pa.nom, categorie: 'investisseur', actions: pa.montant / prix,
      pref: {
        serie: o.serie, investi: pa.montant, prixOrig: prix, prixConv: prix,
        multiple: o.multiple ?? 1, participatif: !!o.participatif, plafond: o.plafond ?? null,
        antiDilution: o.antiDilution ?? 'moyenne',
      },
    });
  }

  // Pool créé après la levée : il dilue tout le monde, nouveaux investisseurs compris.
  if (!o.poolPreMoney && cible > 0) {
    const T = total(t);
    ajoutPool = Math.max(0, (cible * T - esop.actions) / (1 - cible));
    esop.actions += ajoutPool;
  }

  return {
    table: t, prix, nouvellesActions: nouvelles, ajoutPool, ajustements, conversions,
    postMoney: prix * total(t),
    preMoneyEffective: o.poolPreMoney ? o.preMoney - ajoutPool * prix : o.preMoney,
  };
}

// Émet de nouvelles actions ordinaires (crowdfunding, BSA d'une banque…) au prix donné.
export function emettre(table, { id, nom, categorie = 'investisseur', actions }) {
  const t = copie(table);
  const d = t.find((x) => x.id === id);
  if (d) d.actions += actions;
  else t.push({ id, nom, categorie, actions, pref: null });
  return t;
}

// Annule des actions (vesting : le cofondateur qui part rend la part non acquise).
export function annuler(table, id, actions) {
  const t = copie(table);
  const d = t.find((x) => x.id === id);
  if (d) d.actions = Math.max(0, d.actions - actions);
  return t.filter((x) => x.actions > 0 || x.id === 'esop');
}

// Cède des actions d'un détenteur à un autre (secondaire). Les actions cédées restent ordinaires.
export function ceder(table, de, vers, nomVers, actions) {
  const t = copie(table);
  const src = t.find((x) => x.id === de);
  const n = Math.min(actions, src.actions);
  src.actions -= n;
  const dst = t.find((x) => x.id === vers);
  if (dst) dst.actions += n;
  else t.push({ id: vers, nom: nomVers, categorie: 'investisseur', actions: n, pref: null });
  return t;
}

// Répartition pour un choix donné de conversion des préférentiels (pari passu entre séries).
function repartir(table, prix, convertit) {
  const res = Object.fromEntries(table.map((d) => [d.id, 0]));
  const prefs = table.filter((d) => d.pref && !convertit[d.id]);
  const du = prefs.reduce((s, d) => s + d.pref.investi * d.pref.multiple, 0);
  const paye = Math.min(prix, du);
  for (const d of prefs) res[d.id] = du ? (paye * d.pref.investi * d.pref.multiple) / du : 0;
  let reste = prix - paye;

  let pool = table.filter((d) => !d.pref || convertit[d.id] || d.pref.participatif);
  // Participation plafonnée : on sert d'abord ceux qui atteignent leur plafond.
  for (;;) {
    const P = pool.reduce((s, d) => s + d.actions, 0);
    if (!P || reste <= 0) break;
    const plafonnes = pool.filter((d) => d.pref && !convertit[d.id] && d.pref.plafond
      && res[d.id] + (reste * d.actions) / P > d.pref.plafond * d.pref.investi);
    if (!plafonnes.length) {
      for (const d of pool) res[d.id] += (reste * d.actions) / P;
      reste = 0;
      break;
    }
    for (const d of plafonnes) {
      const ajout = Math.max(0, d.pref.plafond * d.pref.investi - res[d.id]);
      res[d.id] += ajout;
      reste -= ajout;
    }
    pool = pool.filter((d) => !plafonnes.includes(d));
  }
  return res;
}

/**
 * Cascade de liquidation (« waterfall ») pour un prix de vente donné.
 * Chaque préférentiel choisit entre sa préférence et la conversion en ordinaires, au mieux de ses intérêts.
 * Renvoie [{ id, nom, categorie, montant, mode, pct }].
 */
export function cascade(table, prix) {
  const prefs = table.filter((d) => d.pref);
  const convertit = Object.fromEntries(prefs.map((d) => [d.id, false]));
  for (let tour = 0; tour < 20; tour++) {
    let change = false;
    for (const d of prefs) {
      const garde = repartir(table, prix, { ...convertit, [d.id]: false })[d.id];
      const conv = repartir(table, prix, { ...convertit, [d.id]: true })[d.id];
      const veut = conv > garde + 1e-6;
      if (veut !== convertit[d.id]) { convertit[d.id] = veut; change = true; }
    }
    if (!change) break;
  }
  const res = repartir(table, prix, convertit);
  const t = total(table);
  return table.map((d) => ({
    id: d.id, nom: d.nom, categorie: d.categorie, montant: res[d.id],
    pct: t ? d.actions / t : 0,
    mode: !d.pref ? 'ordinaire' : convertit[d.id] ? 'conversion' : d.pref.participatif ? 'préférence + participation' : 'préférence',
  }));
}

export const preferencesTotales = (table) =>
  table.filter((d) => d.pref).reduce((s, d) => s + d.pref.investi * d.pref.multiple, 0);
