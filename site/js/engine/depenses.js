// Dépenses publiques par poste, avant et après les choix de l'utilisateur.

/**
 * @param {{id:string, montant:number, pensions:number}[]} postes  montants actuels (Md€)
 * @param {Object<string, number>} ajouts        Md€ ajoutés par poste
 * @param {number} [baissePensions=0]            baisse uniforme des pensions (0,1 = −10 %)
 * @returns {{id:string, avant:number, apres:number, ecart:number}[]}
 */
export function appliquerChoix(postes, ajouts = {}, baissePensions = 0) {
  return postes.map((p) => {
    const apres = p.montant - p.pensions * baissePensions + (ajouts[p.id] ?? 0);
    return { id: p.id, avant: p.montant, apres, ecart: apres - p.montant };
  });
}

/** Regroupe une répartition { destination: Md€ } par poste de dépense ; ce qui n'en a pas est ignoré. */
export function ajoutsParPoste(repartition, destinations) {
  const ajouts = {};
  for (const d of destinations) {
    const m = repartition[d.id] ?? 0;
    if (d.poste && m > 0) ajouts[d.poste] = (ajouts[d.poste] ?? 0) + m;
  }
  return ajouts;
}

export const totalPostes = (lignes, cle) => lignes.reduce((t, l) => t + l[cle], 0);
