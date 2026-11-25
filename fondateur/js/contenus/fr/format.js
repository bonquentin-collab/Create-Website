// Mise en forme des nombres en français.
const nf = (d) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function euros(x) {
  const a = Math.abs(x);
  if (a >= 1e6) return `${nf(a >= 1e8 ? 0 : 1).format(x / 1e6)} M€`;
  if (a >= 1e4) return `${nf(0).format(x / 1e3)} k€`;
  return `${nf(0).format(x)} €`;
}
export const eurosPrecis = (x, d = 2) => `${nf(d).format(x)} €`;
export const pct = (x, d = 1) => `${nf(d).format(x * 100)} %`;
export const nombre = (x) => nf(0).format(x);
export const mois = (x) => (x >= 99 ? 'illimité' : `${nf(0).format(Math.floor(x))} mois`);
