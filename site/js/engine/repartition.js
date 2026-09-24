// Répartition d'une enveloppe (en Md€) entre des destinations. Fonctions pures, testées.

/** Arrondit au pas des curseurs pour éviter les restes de 0,000001 Md€. */
export const arrondir = (v, pas = 0.1) => Math.round(v / pas) * pas;

/** Somme des montants d'une répartition { id: Md€ }. */
export const totalReparti = (repartition) => Object.values(repartition).reduce((t, v) => t + (Number(v) || 0), 0);

/**
 * Fixe le montant d'une destination sans dépasser l'enveloppe : si la demande excède
 * ce qui reste, elle est ramenée au reste disponible.
 */
export function fixerMontant(repartition, id, demande, enveloppe) {
  const autres = totalReparti({ ...repartition, [id]: 0 });
  const montant = Math.max(0, Math.min(Number(demande) || 0, enveloppe - autres));
  // Arrondi à l'inférieur : un montant arrondi au-dessus pourrait dépasser l'enveloppe.
  return { ...repartition, [id]: arrondir(Math.floor(montant * 10 + 1e-9) / 10) };
}

/**
 * Répartit une enveloppe selon des parts relatives { id: poids }, au pas près : chaque part est
 * arrondie à l'inférieur, puis les pas restants vont aux plus gros restes (méthode du plus fort reste).
 */
export function depuisParts(parts, enveloppe, pas = 0.1) {
  const ids = Object.keys(parts).filter((id) => parts[id] > 0);
  const somme = ids.reduce((t, id) => t + parts[id], 0);
  if (somme <= 0 || enveloppe <= 0) return {};
  const pasTotal = Math.floor(enveloppe / pas + 1e-9);
  const exacts = ids.map((id) => ({ id, v: (pasTotal * parts[id]) / somme }));
  const r = Object.fromEntries(exacts.map(({ id, v }) => [id, Math.floor(v + 1e-9)]));
  let restant = pasTotal - Object.values(r).reduce((a, b) => a + b, 0);
  for (const { id } of [...exacts].sort((a, b) => (b.v % 1) - (a.v % 1))) {
    if (restant-- <= 0) break;
    r[id] += 1;
  }
  for (const id of ids) r[id] = arrondir(r[id] * pas, pas);
  return r;
}

/** Remet une répartition à l'échelle d'une nouvelle enveloppe (changement d'année). */
export function reechelonner(repartition, ancienne, nouvelle) {
  if (ancienne <= 0) return {};
  return depuisParts(repartition, nouvelle * Math.min(1, totalReparti(repartition) / ancienne));
}

/** Effet d'un ajout sur le budget d'un service public. */
export function effetService(budget, ajout) {
  return { budget, ajout, apres: budget + ajout, hausse: budget > 0 ? ajout / budget : 0 };
}

/** Encode une répartition pour l'URL : « ecole-5.2_actifs-10 ». */
export function encoder(repartition) {
  return Object.entries(repartition)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => `${id}-${Number(v.toFixed(1))}`)
    .join("_");
}

/** Décode une répartition lue dans l'URL, en ne gardant que les destinations connues. */
export function decoder(texte, idsConnus) {
  const r = {};
  for (const morceau of String(texte || "").split("_")) {
    const [id, v] = morceau.split("-");
    const n = Number(v);
    if (idsConnus.includes(id) && Number.isFinite(n) && n > 0) r[id] = n;
  }
  return r;
}
