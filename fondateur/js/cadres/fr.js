// Cadre français. Le moteur ne manipule que des notions neutres (convertible, stockOptions…) ;
// ce fichier leur donne leur nom, leurs valeurs par défaut et les financements propres au pays.
// Pour un autre pays : copier ce fichier (de.js, es.js, eu.js…) et l'enregistrer dans cadres/index.js.

export default {
  id: 'fr',
  nom: 'France',
  langue: 'fr',
  devise: 'EUR',

  // Nom des instruments neutres utilisés par le moteur.
  instruments: {
    convertible: { court: 'BSA AIR', long: "bon de souscription d'actions par accord d'investissement rapide", equivalent: 'SAFE' },
    stockOptions: { court: 'BSPCE', long: "bons de souscription de parts de créateur d'entreprise", equivalent: 'stock-options (ESOP)' },
    warrants: { court: 'BSA', long: "bons de souscription d'actions", equivalent: 'warrants' },
    preferentielles: { court: 'actions de préférence', long: 'actions de préférence (ADP)', equivalent: 'preferred shares' },
    pacte: { court: "pacte d'associés", long: "pacte d'associés", equivalent: "shareholders' agreement" },
  },

  // Valeurs habituelles, utilisées pour générer les offres.
  usages: {
    vesting: { duree: 48, cliff: 12 },
    convertible: { decote: 0.2 },
    poolBspce: { seed: 0.1, serieA: 0.12 },
  },

  // Étapes du parcours, dans l'ordre.
  etapes: ['Pré-seed', 'Seed', 'Série A', 'Série B', 'Série C'],

  // Financements non dilutifs propres au pays (cartes dédiées).
  nonDilutif: {
    subvention: { organisme: 'Bpifrance', nom: "Bourse French Tech et aide à l'innovation", personnage: 'bpi' },
    statut: { nom: 'Jeune entreprise innovante (JEI)', effet: 'baisse des charges sociales sur la R&D' },
  },

  // Fonds et sociétés fictifs du monde du jeu.
  noms: {
    angels: 'Gérard & co',
    clubAngels: 'Club des angels de Gérard',
    fondsPropre: 'Granit Ventures',
    fondsFlatteur: 'Marc-Antoine Capital',
    corporate: 'Hexaflow Ventures',
    fondsCroissance: 'Altitude Growth',
    acheteurs: ['Hexaflow', 'Orbis Systems', 'Quadrant', 'Nordline', 'Celsius Group'],
  },
};
