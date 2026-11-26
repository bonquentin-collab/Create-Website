(() => {
  'use strict';

  const THEMES = {
    regulation: 'Better regulation & evaluation',
    green: 'Energy, climate & sustainability',
    digital: 'Digital economy',
    innovation: 'Research & innovation',
    industry: 'Industry & competitiveness',
    tax: 'Taxation & finance',
  };
  const YEARS = [];
  for (let y = 2009; y <= 2021; y++) YEARS.push(y);

  const items = [
    ...window.WORK.projects.map((p, i) => ({ ...p, kind: 'projects', id: 'p' + i,
      meta: [p.client, p.note].filter(Boolean).join('. ') })),
    ...window.WORK.publications.map((p, i) => ({ ...p, kind: 'publications', id: 'u' + i,
      meta: [p.authors && p.authors.replace(/\.$/, ''), p.venue].filter(Boolean).join('. ') })),
  ];
  items.forEach(it => { it.hay = (it.title + ' ' + it.meta + ' ' + (it.translation || '') + ' ' + it.year).toLowerCase(); });

  const state = { type: 'all', themes: new Set(), year: null, q: '' };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hi = (s) => {
    const t = esc(s);
    if (!state.q) return t;
    const q = state.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp('(' + esc(q) + ')', 'gi'), '<mark>$1</mark>');
  };

  const matches = (it, ignore = {}) =>
    (ignore.type || state.type === 'all' || it.kind === state.type) &&
    (ignore.themes || !state.themes.size || it.tags.some(t => state.themes.has(t))) &&
    (ignore.year || !state.year || it.year === state.year) &&
    (!state.q || it.hay.includes(state.q.toLowerCase()));

  /* Build static controls */
  const chipsEl = $('.chips');
  chipsEl.innerHTML = Object.entries(THEMES).map(([k, label]) =>
    `<button type="button" class="chip" data-theme="${k}" aria-pressed="false">${label} <span class="n"></span></button>`).join('');

  const barsEl = $('.years__bars');
  barsEl.innerHTML = YEARS.map(y =>
    `<button type="button" class="yr" data-year="${y}" aria-pressed="false"><span class="yr__stack"><span class="yr__p"></span><span class="yr__u"></span></span><span class="yr__lab">${y}</span></button>`).join('');
  const maxPerYear = Math.max(...YEARS.map(y => items.filter(i => i.year === y).length));

  /* Render */
  function render() {
    // Type counts follow the other filters
    ['all', 'projects', 'publications'].forEach(t => {
      const n = items.filter(it => matches(it, { type: true }) && (t === 'all' || it.kind === t)).length;
      $(`[data-count="${t}"]`).textContent = n;
    });
    $$('.seg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.type === state.type)));

    $$('.chip').forEach(c => {
      const k = c.dataset.theme;
      c.setAttribute('aria-pressed', String(state.themes.has(k)));
      $('.n', c).textContent = items.filter(it => matches(it, { themes: true }) && it.tags.includes(k)).length;
    });

    const h = barsEl.clientHeight - 2;
    $$('.yr').forEach(b => {
      const y = +b.dataset.year;
      const inYear = items.filter(it => it.year === y && matches(it, { year: true }));
      const p = inYear.filter(i => i.kind === 'projects').length;
      const u = inYear.length - p;
      $('.yr__p', b).style.height = (p / maxPerYear) * h + 'px';
      $('.yr__u', b).style.height = (u / maxPerYear) * h + 'px';
      b.setAttribute('aria-pressed', String(state.year === y));
      b.setAttribute('aria-label', `${y}: ${p} project${p === 1 ? '' : 's'}, ${u} publication${u === 1 ? '' : 's'}`);
      b.classList.toggle('is-dim', !!state.year && state.year !== y);
    });

    const list = items.filter(it => matches(it));
    const filtered = state.type !== 'all' || state.themes.size || state.year || state.q;
    const nP = list.filter(i => i.kind === 'projects').length, nU = list.length - nP;
    $('.status__text').textContent = list.length
      ? `Showing ${nP} project${nP === 1 ? '' : 's'} and ${nU} publication${nU === 1 ? '' : 's'}`
      : 'Nothing matches these filters';
    $('.clear').hidden = !filtered;

    const res = $('.results');
    if (!list.length) {
      res.innerHTML = `<div class="empty"><p>Try a broader search or remove a filter. The list covers selected work from 2009 to 2021.</p><button type="button" class="btn" data-act="clear">Clear filters</button></div>`;
      return;
    }
    const years = [...new Set(list.map(i => i.year))].sort((a, b) => b - a);
    res.innerHTML = years.map(y => `
      <div class="group">
        <div class="group__year">${y}</div>
        <ul class="entries">${list.filter(i => i.year === y)
          .sort((a, b) => a.kind.localeCompare(b.kind))
          .map(entry).join('')}</ul>
      </div>`).join('');
  }

  function entry(it) {
    const title = it.url
      ? `<a href="${esc(it.url)}" rel="noopener" target="_blank">${hi(it.title)}<span class="ext" aria-label="(opens in a new tab)">↗</span></a>`
      : hi(it.title);
    const tr = it.translation ? `<p class="entry__meta"><i>${hi(it.translation)}</i></p>` : '';
    return `<li class="entry ${it.kind === 'publications' ? 'entry--pub' : ''}">
      <span class="entry__kind">${it.kind === 'projects' ? 'Project' : 'Publication'}</span>
      <h3 class="entry__title">${title}</h3>${tr}
      ${it.meta ? `<p class="entry__meta">${hi(it.meta)}</p>` : ''}
      <div class="entry__tags">${it.tags.map(t => `<button type="button" class="tag" data-theme="${t}">${THEMES[t]}</button>`).join('')}</div>
    </li>`;
  }

  /* URL state, so a filtered view can be shared */
  function writeURL() {
    const p = new URLSearchParams();
    if (state.type !== 'all') p.set('type', state.type);
    if (state.themes.size) p.set('theme', [...state.themes].join(','));
    if (state.year) p.set('year', state.year);
    if (state.q) p.set('q', state.q);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }
  function readURL() {
    const p = new URLSearchParams(location.search);
    if (['projects', 'publications'].includes(p.get('type'))) state.type = p.get('type');
    (p.get('theme') || '').split(',').filter(t => THEMES[t]).forEach(t => state.themes.add(t));
    const y = +p.get('year'); if (YEARS.includes(y)) state.year = y;
    if (p.get('q')) { state.q = p.get('q'); $('.search input').value = state.q; }
  }
  const update = () => { render(); writeURL(); };

  function clearAll() {
    state.type = 'all'; state.themes.clear(); state.year = null; state.q = '';
    $('.search input').value = '';
    update();
  }

  /* Events */
  $('.seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.type = b.dataset.type; update();
  });
  $('.seg').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const btns = $$('.seg button'); const i = btns.indexOf(document.activeElement);
    const n = btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
    n.focus(); n.click();
  });
  chipsEl.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    const k = c.dataset.theme;
    state.themes.has(k) ? state.themes.delete(k) : state.themes.add(k);
    update();
  });
  barsEl.addEventListener('click', e => {
    const b = e.target.closest('.yr'); if (!b) return;
    const y = +b.dataset.year; state.year = state.year === y ? null : y; update();
  });
  let t;
  $('.search input').addEventListener('input', e => {
    clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); update(); }, 120);
  });
  $('.clear').addEventListener('click', clearAll);
  $('.results').addEventListener('click', e => {
    if (e.target.closest('[data-act="clear"]')) return clearAll();
    const tag = e.target.closest('.tag');
    if (tag) { state.themes = new Set([tag.dataset.theme]); state.year = null; update(); $('#work').scrollIntoView(); }
  });

  // Hero topics jump into the index, pre-filtered
  $$('.topic').forEach(a => a.addEventListener('click', () => {
    state.themes = new Set(a.dataset.topic.split(','));
    state.year = null; state.q = ''; state.type = 'all';
    $('.search input').value = '';
    update();
  }));

  // Copy email
  const toast = $('.toast');
  $('.copy').addEventListener('click', async e => {
    const v = e.currentTarget.dataset.copy;
    try { await navigator.clipboard.writeText(v); toast.textContent = 'Email address copied'; }
    catch { toast.textContent = v; }
    toast.classList.add('is-on'); clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('is-on'), 2200);
  });

  // Theme toggle
  const root = document.documentElement;
  try { const s = localStorage.getItem('fs-theme'); if (s) root.dataset.theme = s; } catch {}
  $('.theme').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('fs-theme', root.dataset.theme); } catch {}
  });

  // Current section in the header
  const links = $$('.bar nav a');
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(l => l.classList.toggle('is-here', l.getAttribute('href') === '#' + en.target.id && !l.classList.contains('bar__cta')));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['profile', 'work', 'contact'].forEach(id => io.observe(document.getElementById(id)));

  readURL();
  render();
  addEventListener('resize', () => requestAnimationFrame(render));
})();
