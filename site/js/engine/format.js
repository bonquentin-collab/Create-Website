// Mise en forme des nombres à la française.

const euros0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const nombre0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nombre1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct1 = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

export const euros = (v) => euros0.format(Math.round(v));
export const nombre = (v) => nombre0.format(v);
export const milliards = (v) => `${nombre1.format(v)} Md€`;
export const milliardsRonds = (v) => `${nombre0.format(v)} Md€`;
export const pourcent = (v) => pct1.format(v);

/** Écart signé, « + 1 200 € » ou « − 350 € » (vrai signe moins). */
export function ecartEuros(v) {
  const r = Math.round(v);
  if (r === 0) return "0 €";
  return `${r > 0 ? "+" : "−"} ${euros0.format(Math.abs(r))}`;
}

/** Lit un champ saisi à la française (espaces, virgule décimale). */
export function lireMontant(texte) {
  const propre = String(texte).replace(/[\s  €]/g, "").replace(",", ".");
  const v = Number(propre);
  return Number.isFinite(v) && v > 0 ? v : 0;
}
