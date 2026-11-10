// Editorial catalogue of EU financial instruments (loans, guarantees, equity).
// These are not "calls": they are distributed through intermediaries, so the
// source of truth is a reviewed JSON file. A live adapter (e.g. EIF intermediary
// lists per country) can replace or enrich it later without touching the site.

import { readFile } from 'node:fs/promises';

export const instrumentsAdapter = {
  id: 'instruments-catalog',
  label: 'Instruments financiers (InvestEU, BEI, FEI, EIC)',
  description: 'Catalogue relu des prêts, garanties et fonds propres européens accessibles via des intermédiaires.',
  output: 'instruments',
  mode: 'catalog',
  homepage: 'https://investeu.europa.eu/index_en',
  async run({ log, outputs }) {
    const file = new URL('../catalog/instruments.json', import.meta.url);
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    // Enrich with figures computed from other sources when available.
    const cohesion = outputs.cohesion?.items || [];
    const cohesionFiTotal = Math.round(cohesion.reduce((s, p) => s + p.eu * (p.fiShare || 0), 0));
    const items = catalog.items.map((it) =>
      it.computed === 'cohesionFiTotal' && cohesionFiTotal ? { ...it, amount: cohesionFiTotal, amountLabel: 'Montant UE programmé sous forme d’instruments financiers' } : it,
    );
    log(`instruments-catalog: ${items.length} instruments (reviewed ${catalog.reviewed})`);
    return { items, stats: { instruments: items.length, reviewed: catalog.reviewed } };
  },
};
