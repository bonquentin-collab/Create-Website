// Adapter for shared-management funds (ERDF, ESF+, Cohesion Fund, JTF, Interreg,
// EMFAF, AMIF, ISF, BMVI) using the Commission's Cohesion Open Data platform
// (Socrata API, dataset "2021-2027 Planned finances detailed", id hgyj-gyin).
//
// This is a *catalogue* source: it lists the 2021-2027 programmes and their
// planned EU allocation per Member State. Individual calls are published by each
// programme's managing authority; a future adapter per country/region can emit
// live opportunities (see README "Ajouter une source").

import { getJson } from '../lib/http.mjs';

const DATASET = 'https://cohesiondata.ec.europa.eu/resource/hgyj-gyin.json';

// Every amount is repeated once per categorisation dimension in this dataset;
// summing a single dimension gives the planned total exactly once.
const AMOUNT_DIMENSION = 'Intervention Field';
const FORM_DIMENSION = 'Form of Support';

const FUND_LABELS = {
  ERDF: 'FEDER',
  'ESF+': 'FSE+',
  CF: 'Fonds de cohésion',
  JTF: 'Fonds pour une transition juste',
  'Interreg Funds': 'Interreg',
  EMFAF: 'FEAMPA',
  AMIF: 'FAMI',
  ISF: 'FSI',
  BMVI: 'IGFV',
};

const OBJECTIVE_FR = {
  'Smarter Europe': 'Europe plus intelligente',
  'Greener Europe': 'Europe plus verte',
  'Connected Europe': 'Europe plus connectée',
  'Social Europe': 'Europe plus sociale',
  'Europe closer to citizens': 'Europe plus proche des citoyens',
  'JTF specific objective': 'Transition juste',
  'Technical Assistance': 'Assistance technique',
  'Interreg: Cooperation Governance': 'Interreg : gouvernance de la coopération',
  'Interreg: Safer and more secure Europe': 'Interreg : Europe plus sûre',
  'Asylum and migration': 'Asile et migration',
  'Borders and visa': 'Frontières et visas',
  Security: 'Sécurité',
};

const COUNTRY_FR = {
  AT: 'Autriche', BE: 'Belgique', BG: 'Bulgarie', CY: 'Chypre', CZ: 'Tchéquie', DE: 'Allemagne', DK: 'Danemark',
  EE: 'Estonie', EL: 'Grèce', ES: 'Espagne', FI: 'Finlande', FR: 'France', HR: 'Croatie', HU: 'Hongrie',
  IE: 'Irlande', IT: 'Italie', LT: 'Lituanie', LU: 'Luxembourg', LV: 'Lettonie', MT: 'Malte', NL: 'Pays-Bas',
  PL: 'Pologne', PT: 'Portugal', RO: 'Roumanie', SE: 'Suède', SI: 'Slovénie', SK: 'Slovaquie',
  TC: 'Coopération territoriale (Interreg)', CH: 'Suisse', NO: 'Norvège', IS: 'Islande',
};

async function soql(params) {
  const url = new URL(DATASET);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return getJson(url, {}, { timeoutMs: 120000 });
}

export const cohesionAdapter = {
  id: 'cohesion-programmes',
  label: 'Fonds de la politique de cohésion 2021-2027',
  description: 'Programmes FEDER, FSE+, Fonds de cohésion, FTJ, Interreg et fonds affaires intérieures, par État membre.',
  output: 'cohesion',
  mode: 'catalog',
  homepage: 'https://cohesiondata.ec.europa.eu/',
  async run({ log }) {
    const rows = await soql({
      $select: 'ms,ms_name_en,cci,programme_title_en,fund,sum(eu_amount) as eu,sum(total_amount) as total',
      $where: `dimension_type='${AMOUNT_DIMENSION}'`,
      $group: 'ms,ms_name_en,cci,programme_title_en,fund',
      $limit: '50000',
    });
    const forms = await soql({
      $select: 'cci,category_code,sum(eu_amount) as eu',
      $where: `dimension_type='${FORM_DIMENSION}'`,
      $group: 'cci,category_code',
      $limit: '50000',
    });
    const themes = await soql({
      $select: 'cci,policy_objective_name,sum(eu_amount) as eu',
      $where: `dimension_type='${AMOUNT_DIMENSION}'`,
      $group: 'cci,policy_objective_name',
      $limit: '50000',
    });

    // Financial-instrument share per programme (form-of-support codes 02-05).
    const fi = new Map();
    for (const r of forms) {
      const cur = fi.get(r.cci) || { fi: 0, all: 0 };
      const eu = Number(r.eu) || 0;
      cur.all += eu;
      if (['02', '03', '04', '05'].includes(r.category_code)) cur.fi += eu;
      fi.set(r.cci, cur);
    }
    const objectives = new Map();
    for (const r of themes) {
      if (!objectives.has(r.cci)) objectives.set(r.cci, []);
      objectives.get(r.cci).push([r.policy_objective_name, Number(r.eu) || 0]);
    }

    const programmes = new Map();
    for (const r of rows) {
      const p = programmes.get(r.cci) || {
        cci: r.cci,
        country: r.ms,
        countryName: COUNTRY_FR[r.ms] || r.ms_name_en,
        title: r.programme_title_en,
        funds: [],
        eu: 0,
        total: 0,
      };
      const eu = Math.round(Number(r.eu) || 0);
      const total = Math.round(Number(r.total) || 0);
      p.funds.push({ fund: FUND_LABELS[r.fund] || r.fund, eu });
      p.eu += eu;
      p.total += total;
      programmes.set(r.cci, p);
    }

    const items = [...programmes.values()]
      .filter((p) => p.eu > 0)
      .map((p) => {
        const f = fi.get(p.cci);
        const objs = (objectives.get(p.cci) || []).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        return {
          ...p,
          funds: p.funds.sort((a, b) => b.eu - a.eu),
          fiShare: f && f.all ? Math.round((f.fi / f.all) * 1000) / 1000 : 0,
          objectives: objs.slice(0, 3).map(([name]) => OBJECTIVE_FR[name] || name),
          url: `https://cohesiondata.ec.europa.eu/programmes/${p.cci}`,
        };
      })
      .sort((a, b) => a.country.localeCompare(b.country) || b.eu - a.eu);

    log(`cohesion-programmes: ${items.length} programmes, ${new Set(items.map((p) => p.country)).size} territories`);
    return { items, stats: { programmes: items.length } };
  },
};
