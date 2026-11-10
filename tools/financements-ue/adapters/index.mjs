// Source registry. Each adapter implements:
//
//   {
//     id:          unique, stable string (used as the "source" of every record)
//     label:       human label shown on the "Sources" page
//     description: one sentence
//     output:      'opportunities' | 'cohesion' | 'instruments'  (dataset it feeds)
//     mode:        'live' (polled, records come and go) | 'catalog' (reference data)
//     homepage:    URL of the upstream source
//     run(ctx):    async ({ log, today, outputs }) => { items, stats }
//   }
//
// Adapters run in order; later ones can read earlier outputs via ctx.outputs.
// To add a source (a national grant portal, a regional ERDF call feed, TED…),
// write a new adapter that emits records of the shape documented in
// lib/schema.mjs (tools/financements-ue/lib/schema.mjs) and append it here. Nothing else needs to change.

import { sediaAdapter } from './sedia.mjs';
import { cohesionAdapter } from './cohesion.mjs';
import { instrumentsAdapter } from './instruments.mjs';

export const adapters = [
  sediaAdapter({
    id: 'sedia-grants',
    label: 'Subventions en gestion directe',
    description: 'Topics ouverts et à venir du portail Funding & Tenders : Horizon Europe, Digital Europe, LIFE, CEF, Erasmus+, EU4Health…',
    types: [1],
  }),
  sediaAdapter({
    id: 'sedia-cascade',
    label: 'Financement en cascade',
    description: 'Appels lancés par des projets financés par l’UE qui redistribuent des fonds à des tiers (souvent des PME).',
    types: [8],
  }),
  sediaAdapter({
    id: 'sedia-external',
    label: 'Action extérieure',
    description: 'Appels à propositions de l’UE hors de ses frontières (voisinage, élargissement, partenariats internationaux).',
    types: [2],
  }),
  sediaAdapter({
    id: 'sedia-tenders',
    label: 'Marchés publics des institutions',
    description: 'Appels d’offres de la Commission, des agences et des autres institutions de l’UE.',
    types: [0],
  }),
  cohesionAdapter,
  instrumentsAdapter,
];
