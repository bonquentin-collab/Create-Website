// Tiny DOM helpers. All dynamic text goes through esc() — upstream data is untrusted.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Tagged template that escapes interpolations unless wrapped with raw(). */
export function html(strings, ...values) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) out += render(values[i]);
  });
  return new Raw(out);
}
class Raw {
  constructor(v) { this.v = v; }
  toString() { return this.v; }
}
export const raw = (v) => new Raw(v);
function render(v) {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Raw) return v.v;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function toast(message, ms = 5000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), ms);
}

/** Encode an opportunity id for use in a hash route. */
export const idToSlug = (id) => encodeURIComponent(id);
export const slugToId = (slug) => decodeURIComponent(slug);
