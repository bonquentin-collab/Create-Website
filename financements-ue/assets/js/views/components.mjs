// Shared UI pieces: filter panel, deadline strip, result rows.

import { html, raw, idToSlug } from '../lib/dom.mjs';
import { config } from '../config.mjs';
import {
  KIND_LABELS, KIND_HELP, STATUS_LABELS, formatDay, formatEur, formatCountdown, daysUntil, todayIso,
  weekStart, addDays, parseDay, formatMonthShort, formatInt,
} from '../lib/format.mjs';
import { facetCounts, matches } from '../lib/filter.mjs';

// ---------------------------------------------------------------------------
// Filter panel. Rendered once per page; counts are refreshed in place so
// keyboard focus is never lost while filtering.

export function renderFilters(items, f) {
  const kinds = facetCounts(items, f, 'kind');
  const status = facetCounts(items, f, 'status');
  const programmes = [...new Set(items.map((o) => o.programme))].sort((a, b) => a.localeCompare(b, 'fr'));
  const progCounts = facetCounts(items, f, 'programme');
  return html`
    <details class="filters-wrap" open>
    <summary class="filters-summary">Filtres</summary>
    <form class="filters" id="filters" aria-label="Filtres" onsubmit="return false">
      <h2>Filtres <button type="button" class="linklike" data-reset>Tout effacer</button></h2>
      <fieldset>
        <legend>Nature</legend>
        ${Object.keys(KIND_LABELS).map((k) => html`
          <label class="check" title="${KIND_HELP[k]}">
            <input type="checkbox" name="kinds" value="${k}" ${raw(f.kinds.includes(k) ? 'checked' : '')}>
            ${KIND_LABELS[k]} <span class="count" data-count="kind:${k}">${formatInt(kinds.get(k) || 0)}</span>
          </label>`)}
      </fieldset>
      <fieldset>
        <legend>Statut</legend>
        ${Object.keys(STATUS_LABELS).map((s) => html`
          <label class="check">
            <input type="checkbox" name="status" value="${s}" ${raw(f.status.includes(s) ? 'checked' : '')}>
            ${STATUS_LABELS[s]} <span class="count" data-count="status:${s}">${formatInt(status.get(s) || 0)}</span>
          </label>`)}
      </fieldset>
      <div>
        <label class="field-label" for="f-programme">Programme</label>
        <select class="select" id="f-programme" name="programme">
          <option value="">Tous les programmes</option>
          ${programmes.map((p) => html`<option value="${p}" ${raw(f.programme === p ? 'selected' : '')} data-prog="${p}">${p} (${progCounts.get(p) || 0})</option>`)}
        </select>
      </div>
      <div>
        <label class="field-label" for="f-closing">Date de clôture</label>
        <select class="select" id="f-closing" name="closing">
          ${[['', 'Toutes les dates'], ['7', 'Dans les 7 jours'], ['30', 'Dans les 30 jours'], ['90', 'Dans les 3 mois'], ['180', 'Dans les 6 mois']].map(
            ([v, l]) => html`<option value="${v}" ${raw(f.closing === v ? 'selected' : '')}>${l}</option>`,
          )}
        </select>
      </div>
      <div>
        <label class="field-label" for="f-budget">Budget minimum</label>
        <select class="select" id="f-budget" name="budgetMin">
          ${[['', 'Indifférent'], ['100000', '100 k€ et plus'], ['1000000', '1 M€ et plus'], ['5000000', '5 M€ et plus'], ['20000000', '20 M€ et plus']].map(
            ([v, l]) => html`<option value="${v}" ${raw(f.budgetMin === v ? 'selected' : '')}>${l}</option>`,
          )}
        </select>
      </div>
    </form>
    </details>`;
}

export function bindFilters(root, getFilters, onChange) {
  const form = root.querySelector('#filters');
  if (!form) return;
  // Collapsed by default on small screens so results come first.
  if (window.matchMedia('(max-width: 900px)').matches) form.closest('details')?.removeAttribute('open');
  form.addEventListener('change', (e) => {
    const t = e.target;
    const f = { ...getFilters() };
    if (t.name === 'kinds' || t.name === 'status') {
      f[t.name] = [...form.querySelectorAll(`input[name="${t.name}"]:checked`)].map((i) => i.value);
    } else if (t.name) {
      f[t.name] = t.value;
    }
    onChange(f);
  });
  form.querySelector('[data-reset]')?.addEventListener('click', () => {
    const f = getFilters();
    onChange({ ...f, kinds: [], status: [], programme: '', closing: '', week: '', budgetMin: '', q: '' });
  });
}

/** Sync the panel with a new filter state (checkbox states and live counts). */
export function syncFilters(root, items, f) {
  const form = root.querySelector('#filters');
  if (!form) return;
  for (const i of form.querySelectorAll('input[type=checkbox]')) i.checked = f[i.name].includes(i.value);
  for (const s of form.querySelectorAll('select')) if (s.value !== f[s.name]) s.value = f[s.name];
  const kinds = facetCounts(items, f, 'kind');
  const status = facetCounts(items, f, 'status');
  const progs = facetCounts(items, f, 'programme');
  for (const el of form.querySelectorAll('[data-count]')) {
    const [k, v] = el.dataset.count.split(':');
    el.textContent = formatInt((k === 'kind' ? kinds : status).get(v) || 0);
  }
  for (const o of form.querySelectorAll('option[data-prog]')) o.textContent = `${o.dataset.prog} (${progs.get(o.dataset.prog) || 0})`;
}

// ---------------------------------------------------------------------------
// Active-filter chips

export function renderChips(f) {
  const chips = [];
  if (f.q) chips.push(['q', `« ${f.q} »`]);
  for (const k of f.kinds) chips.push([`kinds:${k}`, KIND_LABELS[k]]);
  for (const s of f.status) chips.push([`status:${s}`, STATUS_LABELS[s]]);
  if (f.programme) chips.push(['programme', f.programme]);
  if (f.closing) chips.push(['closing', `Clôture sous ${f.closing} jours`]);
  if (f.week) chips.push(['week', `Semaine du ${formatDay(f.week)}`]);
  if (f.budgetMin) chips.push(['budgetMin', `Budget ≥ ${formatEur(Number(f.budgetMin))}`]);
  if (!chips.length) return '';
  return html`<div class="chips" aria-label="Filtres actifs">${chips.map(
    ([key, label]) => html`<button type="button" class="chip" data-chip="${key}" aria-label="Retirer le filtre ${label}">${label} <span aria-hidden="true">×</span></button>`,
  )}</div>`;
}

export function removeChip(f, key) {
  const [k, v] = key.split(':');
  if (v) return { ...f, [k]: f[k].filter((x) => x !== v) };
  return { ...f, [k]: '' };
}

// ---------------------------------------------------------------------------
// Deadline strip — the next 26 weeks of closing dates.

const WEEKS = 26;

export function stripData(items, f, today = todayIso()) {
  const start = weekStart(today);
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ start: addDays(start, i * 7), count: 0 }));
  const end = addDays(start, WEEKS * 7 - 1);
  for (const o of items) {
    if (!o.deadline || o.deadline < today || o.deadline > end) continue;
    if (!matches(o, f, today, { ignore: ['week', 'closing'] })) continue;
    const idx = Math.floor((parseDay(o.deadline) - parseDay(start)) / (7 * 86400000));
    if (weeks[idx]) weeks[idx].count++;
  }
  return weeks;
}

export function renderStrip(items, f, { entering = false } = {}) {
  const today = todayIso();
  const weeks = stripData(items, f, today);
  const max = Math.max(4, ...weeks.map((w) => w.count));
  const niceMax = Math.ceil(max / 10) * 10; // even split keeps the mid gridline an integer
  const W = 1000, H = 150, top = 14, bottom = 26, left = 30;
  const plotH = H - top - bottom;
  const colW = (W - left) / WEEKS;
  const barW = Math.max(4, colW - 6);
  const total = weeks.reduce((s, w) => s + w.count, 0);
  const y = (v) => top + plotH - (v / niceMax) * plotH;
  const todayX = left + ((parseDay(today) - parseDay(weeks[0].start)) / (7 * 86400000)) * colW;

  const gridVals = [niceMax / 2, niceMax];
  let lastMonth = -1;
  const monthLabels = [];
  weeks.forEach((w, i) => {
    // Label a week with the month its Sunday falls in, once per month.
    const m = parseDay(addDays(w.start, 6)).getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push({ x: left + i * colW + 2, label: formatMonthShort(parseDay(addDays(w.start, 6))) });
      lastMonth = m;
    }
  });

  const bars = weeks.map((w, i) => {
    const x = left + i * colW + (colW - barW) / 2;
    const h = w.count ? Math.max(3, (w.count / niceMax) * plotH) : 0;
    const yTop = top + plotH - h;
    const r = Math.min(4, h, barW / 2);
    const path = h
      ? `M${x},${top + plotH}V${yTop + r}Q${x},${yTop} ${x + r},${yTop}H${x + barW - r}Q${x + barW},${yTop} ${x + barW},${yTop + r}V${top + plotH}Z`
      : '';
    const selected = f.week === w.start;
    const cls = ['bar', selected ? 'is-active' : f.week ? 'is-dim' : ''].join(' ');
    const label = `Semaine du ${formatDay(w.start)} : ${w.count} clôture${w.count > 1 ? 's' : ''}`;
    return `<g><rect class="bar-hit" x="${left + i * colW}" y="${top}" width="${colW}" height="${plotH}" tabindex="0" role="button" aria-pressed="${selected}" aria-label="${label}" data-week="${w.start}" data-tip="${label}"></rect>${path ? `<path class="${cls}" style="--i:${i}" d="${path}"></path>` : ''}</g>`;
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Nombre de clôtures par semaine sur les 26 prochaines semaines">
    ${gridVals.map((v) => `<line class="grid" x1="${left}" x2="${W}" y1="${y(v)}" y2="${y(v)}"></line><text class="axis" x="${left - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    <line class="baseline" x1="${left}" x2="${W}" y1="${top + plotH}" y2="${top + plotH}"></line>
    ${bars.join('')}
    <line class="today" x1="${todayX}" x2="${todayX}" y1="${top - 6}" y2="${top + plotH}"></line>
    <text class="today-label" x="${todayX + 4}" y="${top - 2}">aujourd’hui</text>
    ${monthLabels.map((m) => `<text class="axis" x="${m.x}" y="${H - 6}">${m.label}</text>`).join('')}
  </svg>`;

  const sel = f.week
    ? html`Semaine du <strong>${formatDay(f.week)}</strong> sélectionnée. <button type="button" class="linklike" data-clear-week>Voir toutes les semaines</button>`
    : 'Cliquez sur une semaine pour afficher ses clôtures.';

  return html`
    <section class="strip ${raw(entering ? 'is-entering' : '')}" id="strip" aria-labelledby="strip-title">
      <div class="strip__head">
        <h2 id="strip-title">${formatInt(total)} clôtures dans les 26 prochaines semaines</h2>
        <p>Selon les filtres actifs, hors appels sans date limite publiée</p>
      </div>
      <div class="strip__chart">${raw(svg)}<div class="tip" hidden></div></div>
      <p class="strip__selection">${sel}</p>
    </section>`;
}

export function bindStrip(root, getFilters, onChange) {
  const strip = root.querySelector('#strip');
  if (!strip) return;
  const tip = strip.querySelector('.tip');
  const chart = strip.querySelector('.strip__chart');
  const toggle = (week) => {
    const f = getFilters();
    onChange({ ...f, week: f.week === week ? '' : week, closing: '' });
  };
  strip.addEventListener('click', (e) => {
    const hit = e.target.closest('[data-week]');
    if (hit) toggle(hit.dataset.week);
    if (e.target.closest('[data-clear-week]')) onChange({ ...getFilters(), week: '' });
  });
  strip.addEventListener('keydown', (e) => {
    const hit = e.target.closest('[data-week]');
    if (hit && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggle(hit.dataset.week);
    }
  });
  const show = (el) => {
    const r = el.getBoundingClientRect();
    const c = chart.getBoundingClientRect();
    tip.textContent = el.dataset.tip;
    tip.style.left = `${r.left - c.left + r.width / 2}px`;
    tip.style.top = `${Math.max(12, el.nextElementSibling ? el.nextElementSibling.getBoundingClientRect().top - c.top : r.bottom - c.top - 20)}px`;
    tip.hidden = false;
  };
  strip.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('[data-week]');
    if (hit) show(hit);
  });
  strip.addEventListener('focusin', (e) => {
    const hit = e.target.closest('[data-week]');
    if (hit) show(hit);
  });
  strip.addEventListener('pointerleave', () => (tip.hidden = true));
  strip.addEventListener('focusout', () => (tip.hidden = true));
}

// ---------------------------------------------------------------------------
// Result row

export function isNew(o, today = todayIso()) {
  return o.firstSeen && daysUntil(o.firstSeen, today) >= -config.NEW_DAYS;
}

export function statusPill(o) {
  return html`<span class="status status--${o.status}">${STATUS_LABELS[o.status]}</span>`;
}

export function renderRow(o, today = todayIso()) {
  const days = daysUntil(o.deadline, today);
  const urgent = days !== null && days <= config.URGENT_DAYS;
  const meta = [o.programme, o.ref, o.kind === 'tender' || o.kind === 'cascade' ? o.authority : null].filter(Boolean);
  return html`
    <li class="row">
      <div>
        <div class="row__meta" style="margin:0 0 6px">
          ${statusPill(o)}
          <span class="kind">${KIND_LABELS[o.kind]}</span>
          ${isNew(o, today) ? html`<span class="status status--new">Nouveau</span>` : ''}
          ${o.notice ? html`<span>${o.notice}</span>` : ''}
        </div>
        <h3 class="row__title"><a href="#/opportunite/${idToSlug(o.id)}">${o.title}</a></h3>
        <div class="row__meta">${meta.map((m) => html`<span>${m}</span>`)}</div>
        ${o.summary ? html`<p class="row__summary">${o.summary}</p>` : ''}
      </div>
      <div class="row__side">
        ${o.deadline
          ? html`<span class="row__date">${formatDay(o.deadline)}</span><span class="row__left ${raw(urgent ? 'is-urgent' : '')}">${formatCountdown(days)}</span>`
          : o.status === 'forthcoming' && o.opens
            ? html`<span class="row__date">Ouverture</span><span class="row__left">${formatDay(o.opens)}</span>`
            : html`<span class="row__left">Date limite non publiée</span>`}
        <span class="row__budget">${o.budget ? `${o.kind === 'tender' ? 'Valeur estimée' : 'Budget'} ${formatEur(o.budget)}` : ''}</span>
      </div>
    </li>`;
}
