#!/usr/bin/env node
// Runs every registered adapter and writes the static datasets consumed by the site:
//
//   financements-ue/data/opportunities.json   live calls (grants, cascade, external, tenders)
//   financements-ue/data/cohesion.json        2021-2027 shared-management programmes
//   financements-ue/data/instruments.json     financial-instruments catalogue
//   financements-ue/data/meta.json            per-source status, counts, timestamps, diff vs previous run
//
// Resilience rules:
//   - a failing adapter never wipes data: its previous records are kept and flagged "stale";
//   - a live adapter that suddenly returns < 20 % of its previous volume is treated as a failure.
//
// Usage: node tools/financements-ue/run.mjs [--only=sedia-grants,cohesion-programmes] [--out=financements-ue/data]

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { adapters } from './adapters/index.mjs';
import { validateOpportunity } from './lib/schema.mjs';

// Repository root (this file lives in tools/financements-ue/).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const outDir = path.resolve(root, args.out || 'financements-ue/data');
const only = args.only ? new Set(args.only.split(',')) : null;

const log = (...m) => console.log(new Date().toISOString().slice(11, 19), ...m);

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data)}\n`);
}

const DATASETS = ['opportunities', 'cohesion', 'instruments'];

async function main() {
  await mkdir(outDir, { recursive: true });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const previous = {};
  for (const name of DATASETS) previous[name] = await readJson(path.join(outDir, `${name}.json`), { items: [] });
  const prevMeta = await readJson(path.join(outDir, 'meta.json'), { sources: [] });
  const prevSource = Object.fromEntries((prevMeta.sources || []).map((s) => [s.id, s]));

  const outputs = Object.fromEntries(DATASETS.map((d) => [d, { items: [] }]));
  const sources = [];

  for (const adapter of adapters) {
    // Opportunities are shared by several adapters: keep only this adapter's records.
    const prevItems = (previous[adapter.output].items || []).filter((it) => adapter.output !== 'opportunities' || it.source === adapter.id);
    const prevCount = prevSource[adapter.id]?.count ?? prevItems.length;
    const entry = {
      id: adapter.id,
      label: adapter.label,
      description: adapter.description,
      mode: adapter.mode,
      output: adapter.output,
      homepage: adapter.homepage,
    };

    if (only && !only.has(adapter.id)) {
      outputs[adapter.output].items.push(...prevItems);
      sources.push({ ...prevSource[adapter.id], ...entry, count: prevItems.length });
      continue;
    }

    const started = Date.now();
    try {
      const { items, stats } = await adapter.run({ log, today, outputs });
      if (adapter.mode === 'live' && prevCount > 50 && items.length < prevCount * 0.2) {
        throw new Error(`suspicious drop: ${items.length} records vs ${prevCount} previously`);
      }
      let invalid = 0;
      const tagged = items
        .map((it) => (adapter.output === 'opportunities' ? { ...it, source: adapter.id } : it))
        .filter((it) => {
          if (adapter.output !== 'opportunities') return true;
          const errs = validateOpportunity(it);
          if (errs.length) invalid++;
          return errs.length === 0;
        });
      outputs[adapter.output].items.push(...tagged);
      sources.push({ ...entry, status: 'ok', updatedAt: now.toISOString(), durationMs: Date.now() - started, count: tagged.length, invalid, stats });
    } catch (err) {
      log(`!! ${adapter.id} failed: ${err.message}`);
      outputs[adapter.output].items.push(...prevItems);
      sources.push({
        ...entry,
        status: prevItems.length ? 'stale' : 'error',
        updatedAt: prevSource[adapter.id]?.updatedAt || null,
        attemptedAt: now.toISOString(),
        count: prevItems.length,
        error: String(err.message).slice(0, 300),
      });
    }
  }

  // Diff live records against the previous run, so the UI can flag what is new.
  const opp = outputs.opportunities.items;
  const prevIds = new Set((previous.opportunities.items || []).map((o) => o.id));
  const firstRun = prevIds.size === 0;
  const prevFirstSeen = Object.fromEntries((previous.opportunities.items || []).map((o) => [o.id, o.firstSeen]));
  for (const o of opp) o.firstSeen = prevFirstSeen[o.id] || (firstRun ? o.published || today : today);
  const currentIds = new Set(opp.map((o) => o.id));
  const added = firstRun ? 0 : opp.filter((o) => !prevIds.has(o.id)).length;
  const removed = firstRun ? 0 : [...prevIds].filter((id) => !currentIds.has(id)).length;

  opp.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999') || a.title.localeCompare(b.title));

  const generatedAt = now.toISOString();
  for (const name of DATASETS) {
    await writeJson(path.join(outDir, `${name}.json`), { generatedAt, count: outputs[name].items.length, items: outputs[name].items });
  }
  const meta = {
    schemaVersion: 1,
    generatedAt,
    counts: Object.fromEntries(DATASETS.map((d) => [d, outputs[d].items.length])),
    changes: { added, removed, previousRun: prevMeta.generatedAt || null },
    sources,
  };
  await writeJson(path.join(outDir, 'meta.json'), meta);
  log(`done: ${opp.length} opportunities (+${added} / -${removed}), ${outputs.cohesion.items.length} programmes, ${outputs.instruments.items.length} instruments`);
  if (sources.every((s) => s.status === 'error')) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
