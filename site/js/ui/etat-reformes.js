// Registre partagé des réformes de la page retraites. Chaque onglet y publie l'effet de ses réglages
// sur le niveau de vie d'un actif et d'un retraité (en part du revenu disponible, ex. −0,012 = −1,2 %).
// Le graphique « niveaux de vie » écoute ces publications et cumule les réformes cochées.

const reformes = new Map();
const EVENEMENT = "reformes:maj";

/**
 * @param {string} id
 * @param {{ label:string, actifs:number, retraites:number, detail?:string }} effet
 */
export function publier(id, effet) {
  reformes.set(id, { id, ...effet });
  document.dispatchEvent(new CustomEvent(EVENEMENT, { detail: { id } }));
}

export const lireReformes = () => [...reformes.values()];

export function surMaj(rappel) {
  document.addEventListener(EVENEMENT, rappel);
}
