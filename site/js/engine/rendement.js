// Pensions reçues pour 100 € cotisés, par génération. Modèle simplifié, calé sur le taux de rendement interne du COR :
// cotisations constantes (en part du salaire moyen) pendant la carrière, pension qui décroche des salaires au rythme
// `decrochage` pendant la retraite. On cale le rapport pension/cotisation pour que le TRI du modèle soit celui du COR,
// puis on actualise au taux voulu (en plus de l'évolution des salaires).

const PAS = 0.25; // années

/** Calendrier de vie d'une génération : début de carrière, départ, fin de retraite (âges). */
export function calendrier(g) {
  const depart = 60 + g.esperanceA60 - g.dureeRetraite;
  return { debut: depart - g.dureeCarriere, depart, fin: depart + g.dureeRetraite };
}

/** Interpolation linéaire dans une table { année: valeur }, constante hors bornes. */
export function interpoler(table, annee) {
  const cles = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (annee <= cles[0]) return table[cles[0]];
  if (annee >= cles.at(-1)) return table[cles.at(-1)];
  const i = cles.findIndex((k) => k > annee);
  const [a, b] = [cles[i - 1], cles[i]];
  return table[a] + ((table[b] - table[a]) * (annee - a)) / (b - a);
}

/**
 * Multiplicateurs « avec impôts » l'année `annee` : ce que paie un actif en plus de ses cotisations (part non
 * cotisée des ressources, hors part payée par les retraités, rapportée aux cotisations), et ce que garde un
 * retraité de sa pension une fois payée sa propre part.
 */
export function multiplicateursImpots(impots, annee) {
  const ext = interpoler(impots.partHorsCotisations, annee);
  const q = interpoler(impots.partPayeeParRetraites, annee);
  return { actif: 1 + (ext - q) / (1 - ext), retraite: 1 - q };
}

function flux(g, { decrochage, impots }) {
  const c = calendrier(g);
  const cot = [];
  const pen = [];
  for (let a = c.debut + PAS / 2; a < c.depart; a += PAS) cot.push([a, impots ? multiplicateursImpots(impots, g.annee + a).actif : 1]);
  for (let a = c.depart + PAS / 2; a < c.fin; a += PAS)
    pen.push([a, (1 - decrochage) ** (a - c.depart) * (impots ? multiplicateursImpots(impots, g.annee + a).retraite : 1)]);
  return { cot, pen };
}

const valeur = (serie, r) => serie.reduce((t, [a, v]) => t + v * (1 + r) ** -a, 0);

/**
 * Pensions reçues (valeur actualisée) pour 100 000 € cotisés.
 * @param g génération { tri, dureeRetraite, esperanceA60, dureeCarriere, annee }
 * @param r taux d'actualisation en plus de l'évolution des salaires (0 = convention du COR)
 * @param options { decrochage, impots? } : `impots` (params.impots) compte aussi les impôts affectés aux retraites
 */
export function recuPour100000(g, r, { decrochage, impots = null }) {
  // Calage sur le TRI du COR, cotisations seules.
  const base = flux(g, { decrochage, impots: null });
  const k = valeur(base.cot, g.tri) / valeur(base.pen, g.tri);
  const f = impots ? flux(g, { decrochage, impots }) : base;
  return (100000 * k * valeur(f.pen, r)) / valeur(f.cot, r);
}
