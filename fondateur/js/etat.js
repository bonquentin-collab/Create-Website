// État d'une partie et petits outils utilisés par les règles et par les cartes.
import { creerTable, part, total } from './captable.js';

export const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));

export function nouvellePartie() {
  return {
    mois: 0,
    tresorerie: 140_000,
    burn: 22_000,
    mrr: 3_000,
    croissanceBonus: 0,
    marche: 1,
    jauges: { equipe: 60, produit: 45, investisseurs: 55 },
    etape: 0,
    table: creerTable([
      { id: 'vous', nom: 'Vous', categorie: 'fondateur', actions: 600_000 },
      { id: 'ines', nom: 'Inès, cofondatrice', categorie: 'fondateur', actions: 400_000 },
    ]),
    notes: [],
    dette: null,
    board: { fondateurs: 2, investisseurs: 0, independants: 0 },
    drapeaux: {},
    vus: {},
    file: [],
    journal: [],
    historique: [{ mois: 0, part: 0.6 }],
    levee: null,
    derniere: null,
    moisDerniereLevee: 0,
    encaisse: 0,
    fin: null,
  };
}

export const partVous = (e) => part(e.table, 'vous');

export function runway(e) {
  const net = e.burn + (e.dette?.mensualite ?? 0) - e.mrr;
  return net > 0 ? Math.max(0, e.tresorerie) / net : 99;
}

// Les quatre jauges affichées, de 0 à 100. La trésorerie se lit en mois de runway (18 mois = plein).
export function jauges(e) {
  return {
    tresorerie: e.tresorerie < 0 ? 0 : clamp((runway(e) / 18) * 100),
    equipe: e.jauges.equipe,
    produit: e.jauges.produit,
    investisseurs: e.jauges.investisseurs,
  };
}

export function bouger(e, deltas) {
  for (const [k, v] of Object.entries(deltas)) e.jauges[k] = clamp(e.jauges[k] + v);
}

// Qui a la fève : vous gardez le contrôle tant que les investisseurs n'ont pas plus de sièges que les fondateurs.
export function feve(e) {
  const { fondateurs, investisseurs, independants } = e.board;
  if (investisseurs > fondateurs + independants) return 'investisseurs';
  if (investisseurs > fondateurs) return 'investisseurs';
  if (investisseurs === fondateurs && independants > 0) return 'partage';
  return 'vous';
}

export function noter(e, entree) {
  e.journal.push({ mois: e.mois, ...entree });
}

// Remplace la table et garde la trace de la variation de votre part, avec son explication.
export function diluer(e, table, { titre, texte, calcul = null, cachee = false }) {
  const avant = partVous(e);
  e.table = table;
  const apres = partVous(e);
  noter(e, { type: 'dilution', titre, texte, avant, apres, calcul, cachee });
  return { avant, apres };
}

export const ajouterFile = (e, carte, enTete = false) => (enTete ? e.file.unshift(carte) : e.file.push(carte));

export const actionsTotales = (e) => total(e.table);
