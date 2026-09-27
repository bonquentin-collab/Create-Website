// Santé : financement estimé par âge et concentration des dépenses. Fonctions pures.

/** Euros par UC et par an versés pour la santé publique, pour chaque tranche d'âge. */
export function financementSanteParAge({ revenuAvantTransferts, taux, partSante }) {
  return revenuAvantTransferts.map((r, i) => (r * taux.reduce((t, ligne) => t + ligne[i], 0) * partSante) / 100);
}

/** Part des personnes et part de la dépense totale des tranches retenues par `filtre`. */
export function concentration(lignes, filtre) {
  const tot = (ls, cle) => ls.reduce((t, l) => t + l.personnes * (cle ? l[cle] : 1), 0);
  const choisies = lignes.filter(filtre);
  return { partPersonnes: tot(choisies) / tot(lignes), partDepense: tot(choisies, "depense") / tot(lignes, "depense"), totalDepense: tot(lignes, "depense") };
}

/**
 * Qui paie la dépense de santé d'une personne, par tranche d'âge : Sécurité sociale (AMO + C2S), complémentaire
 * santé, patient. Le reste à charge final (après complémentaire) vient d'une autre source et d'une autre année :
 * il est plafonné au reste à charge après AMO. Les tranches sans reste final connu sont omises.
 * @returns {{age:string, secu:number, complementaire:number, patient:number, total:number}[]}
 */
export function quiPaieParAge(lignes, tranchesResteFinal) {
  const reste = new Map(tranchesResteFinal.flatMap((t) => t.couvre.map((age) => [age, t.valeur])));
  return lignes
    .filter((l) => reste.has(l.age))
    .map((l) => {
      const apresAmo = l.ticketModerateur + l.depassements + l.franchises;
      const patient = Math.min(reste.get(l.age), apresAmo);
      const secu = l.amo + l.c2s;
      return { age: l.age, secu, complementaire: apresAmo - patient, patient, total: secu + apresAmo };
    });
}
