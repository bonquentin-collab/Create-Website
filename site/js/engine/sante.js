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
