// Icônes des jauges, dessinées au trait (currentColor).
const svg = (d) => `<svg class="icone" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONES = {
  tresorerie: svg('<ellipse cx="16" cy="8" rx="10" ry="4"/><path d="M6 8v6c0 2.2 4.5 4 10 4s10-1.8 10-4V8"/><path d="M6 14v6c0 2.2 4.5 4 10 4s10-1.8 10-4v-6"/><path d="M6 20v4c0 2.2 4.5 4 10 4s10-1.8 10-4v-4"/>'),
  equipe: svg('<circle cx="11" cy="11" r="4"/><circle cx="22" cy="12" r="3.3"/><path d="M3 26c0-5 3.6-8 8-8s8 3 8 8"/><path d="M19 19.5c1-.6 2-.9 3-.9 3.6 0 6.5 2.6 6.5 7"/>'),
  produit: svg('<path d="M16 3l11 6v14l-11 6-11-6V9z"/><path d="M5 9l11 6 11-6M16 15v14"/>'),
  investisseurs: svg('<rect x="4" y="10" width="24" height="16" rx="3"/><path d="M12 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M4 17h24"/>'),
};
