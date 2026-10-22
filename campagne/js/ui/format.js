// Nombres à la française.
export const nombre = (x, d = 0) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
export const md = (x, d = 1) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${nombre(Math.abs(x), d)} Md€`;
export const pct = (x, d = 0) => `${nombre(100 * x, d)} %`;
export const euros = (x) => `${nombre(Math.round(x))} €`;
