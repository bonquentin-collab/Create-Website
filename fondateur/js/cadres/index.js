// Registre des cadres nationaux. Ajouter ici un nouveau cadre (et son dossier contenus/<langue>/).
import fr from './fr.js';

export const CADRES = { fr };
export const CADRE_PAR_DEFAUT = 'fr';
export const cadre = (id) => CADRES[id] ?? CADRES[CADRE_PAR_DEFAUT];
