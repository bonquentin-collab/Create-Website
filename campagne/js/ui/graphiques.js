// Graphiques SVG et canvas, dessinés à la main à partir des données sourcées.
// Règles (skill dataviz) : barres ≤ 24 px à extrémité arrondie de 4 px, traits de 2 px, grille discrète,
// légende dès deux séries, étiquettes sélectives, texte jamais dans la couleur des séries, survol sur chaque marque.
import { flux, piketty, patrimoine } from "../donnees/sources.js";
import { nombre, pct } from "./format.js";

const NS = "http://www.w3.org/2000/svg";
export const couleur = (nom) => getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function el(tag, attrs, parent, texte) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (texte != null) e.textContent = texte;
  if (parent) parent.appendChild(e);
  return e;
}

// Largeur de dessin = largeur réelle à l'écran (bornée), pour que le texte garde sa taille sur mobile.
const largeur = (conteneur, max) => Math.max(320, Math.min(max, Math.round(conteneur.clientWidth || max)));

function svg(conteneur, w, h, label) {
  conteneur.querySelector("svg")?.remove();
  const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label });
  conteneur.prepend(s);
  return s;
}

// Colonne arrondie en haut (4 px), carrée à la base.
function colonne(s, x, y, w, h, fill) {
  const r = Math.min(4, h, w / 2);
  const d = `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
  return el("path", { d, fill }, s);
}

function bulle(conteneur) {
  let b = conteneur.querySelector(".bulle");
  if (!b) { b = document.createElement("div"); b.className = "bulle"; b.hidden = true; conteneur.appendChild(b); }
  return {
    montrer(x, y, html) { b.innerHTML = html; b.style.left = `${x}px`; b.style.top = `${y}px`; b.hidden = false; },
    cacher() { b.hidden = true; },
  };
}
// Position en pixels dans le conteneur d'un point exprimé dans le repère du viewBox.
function versPixels(s, conteneur, x, y) {
  const r = s.getBoundingClientRect(), c = conteneur.getBoundingClientRect();
  const vb = s.viewBox.baseVal;
  return [r.left - c.left + (x / vb.width) * r.width, r.top - c.top + (y / vb.height) * r.height];
}

function tableau(conteneur, titre, entetes, lignes) {
  conteneur.querySelector(".tableau-donnees")?.remove();
  const d = document.createElement("details");
  d.className = "tableau-donnees";
  d.innerHTML = `<summary>${titre}</summary><div class="defile"><table><thead><tr>${entetes.map((e) => `<th>${e}</th>`).join("")}</tr></thead><tbody>${lignes
    .map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  conteneur.appendChild(d);
}

// Accroche : un carré par milliard transmis de 2025 à 2040, rangés par colonnes ; les 10 % les plus riches à gauche.
export function mur(canvas) {
  const W = canvas.clientWidth || 600;
  const unite = W < 640 ? 10 : 1; // sur petit écran, un carré = 10 milliards
  const total = Math.round(flux.total / unite);
  const partHaut = patrimoine.groupes.find((g) => g.id === "d10").part / 100;
  const cols = unite === 1 ? 151 : 38, lignes = Math.ceil(total / cols);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const H = Math.round((W * lignes) / cols);
  const legende = document.getElementById("unite-mur");
  if (legende) legende.textContent = unite === 1 ? "Un carré = 1 milliard d'euros" : "Un carré = 10 milliards d'euros";
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.aspectRatio = `${cols} / ${lignes}`;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const pas = W / cols, cote = Math.max(1, pas - (unite === 1 ? 1 : 2));
  const haut = Math.round(total * partHaut);
  const cEncre = couleur("--encre"), cAutre = couleur("--contexte");
  const dessiner = (n) => {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const c = Math.floor(i / lignes), l = i % lignes;
      ctx.fillStyle = i < haut ? cEncre : cAutre;
      ctx.fillRect(c * pas, l * pas, cote, cote);
    }
  };
  if (reduit()) return dessiner(total);
  const debut = performance.now(), duree = 1600;
  const pas_ = (t) => {
    const k = Math.min(1, (t - debut) / duree);
    dessiner(Math.round(total * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(pas_);
  };
  requestAnimationFrame(pas_);
}

export function graphiqueFlux(conteneur) {
  const W = largeur(conteneur, 600), H = 320, x0 = 46, x1 = W - 10, y0 = 24, y1 = 286, m = 700;
  const s = svg(conteneur, W, H, "Patrimoine transmis chaque année de 2025 à 2040, de 464 à 677 milliards d'euros");
  const Y = (v) => y1 - (v / m) * (y1 - y0);
  for (const t of [0, 200, 400, 600]) { el("line", { x1: x0, x2: x1, y1: Y(t), y2: Y(t), class: "axe" }, s); el("text", { x: x0 - 8, y: Y(t) + 4, "text-anchor": "end" }, s, nombre(t)); }
  el("text", { x: x0 - 8, y: 12, "text-anchor": "end" }, s, "Md€");
  const slot = (x1 - x0) / flux.valeurs.length, w = Math.min(24, slot - 6);
  const b = bulle(conteneur);
  flux.valeurs.forEach((v, i) => {
    const x = x0 + i * slot + (slot - w) / 2, bord = i === 0 || i === flux.valeurs.length - 1;
    const r = colonne(s, x, Y(v), w, y1 - Y(v), bord ? couleur("--serie-1") : couleur("--contexte"));
    const cible = el("rect", { x: x0 + i * slot, y: y0, width: slot, height: y1 - y0, fill: "transparent" }, s);
    const an = flux.annees[i];
    cible.addEventListener("pointerenter", () => { r.style.opacity = 0.75; const [px, py] = versPixels(s, conteneur, x + w / 2, Y(v)); b.montrer(px, py, `<b>${an}</b> : ${nombre(v)} Md€ transmis`); });
    cible.addEventListener("pointerleave", () => { r.style.opacity = 1; b.cacher(); });
    if ((W > 420 ? i % 5 === 0 : i === 0) || i === 15) el("text", { x: x + w / 2, y: y1 + 18, "text-anchor": "middle" }, s, an);
  });
  el("text", { x: x0 + slot / 2, y: Y(464) - 8, "text-anchor": "middle", class: "fort" }, s, "464");
  el("text", { x: x0 + 15.5 * slot, y: Y(677) - 8, "text-anchor": "middle", class: "fort" }, s, "677");
  tableau(conteneur, "Voir les données", ["Année", "Md€"], flux.annees.map((a, i) => [a, nombre(flux.valeurs[i])]));
  const src = conteneur.querySelector(".source") || conteneur.appendChild(Object.assign(document.createElement("p"), { className: "source" }));
  src.innerHTML = `Héritages et donations chaque année, en milliards d'euros courants. <a href="${flux.url}">Fondation Jean-Jaurès, 2024</a>, d'après le CAE ; décès : Cour des comptes, 2024 ; patrimoine : CAE, 2021.`;
}

export function graphiquePiketty(conteneur) {
  const W = largeur(conteneur, 600), H = 330, x0 = 42, x1 = W - 12, y0 = 20, y1 = 292, m = 30, a = 1820, z = 2050;
  const s = svg(conteneur, W, H, "Patrimoine hérité chaque année en pourcentage du revenu national, France, 1820-2050 : 20 à 25 % au XIXe siècle, 4 % en 1950, 15 % en 2010");
  const X = (t) => x0 + ((t - a) / (z - a)) * (x1 - x0), Y = (v) => y1 - (v / m) * (y1 - y0);
  el("rect", { x: X(1914), y: y0, width: X(1945) - X(1914), height: y1 - y0, fill: couleur("--papier-2") }, s);
  el("text", { x: (X(1914) + X(1945)) / 2, y: y0 + 14, "text-anchor": "middle" }, s, "Guerres");
  for (const t of [0, 10, 20, 30]) { el("line", { x1: x0, x2: x1, y1: Y(t), y2: Y(t), class: "axe" }, s); el("text", { x: x0 - 8, y: Y(t) + 4, "text-anchor": "end" }, s, `${t} %`); }
  for (const t of W > 420 ? [1820, 1870, 1914, 1950, 2010, 2050] : [1820, 1914, 1950, 2050]) el("text", { x: X(t), y: y1 + 18, "text-anchor": "middle" }, s, t);
  const ligne = (pts, attrs) => el("path", { d: "M" + pts.map(([t, v]) => `${X(t)},${Y(v)}`).join(" L"), fill: "none", stroke: couleur("--serie-1"), "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round", ...attrs }, s);
  ligne(piketty.observe, {});
  ligne(piketty.projection, { "stroke-dasharray": "2 6" });
  const point = (t, v, txt, ancre = "middle", dy = -14) => {
    el("circle", { cx: X(t), cy: Y(v), r: 5, fill: couleur("--serie-1"), stroke: couleur("--papier"), "stroke-width": 2 }, s);
    el("text", { x: X(t), y: Y(v) + dy, "text-anchor": ancre, class: "fort" }, s, txt);
  };
  point(1880, 24.4, "24 % en 1880");
  point(1950, 4.4, "4 % en 1950", "middle", 26);
  point(2010, 14.5, "15 % en 2010", "end");
  el("text", { x: X(2050), y: Y(16) - 12, "text-anchor": "end" }, s, "projection");
  const b = bulle(conteneur), repere = el("line", { y1: y0, y2: y1, stroke: couleur("--encre-3"), "stroke-width": 1, opacity: 0 }, s);
  const tous = [...piketty.observe, ...piketty.projection.slice(1)];
  const zone = el("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: "transparent" }, s);
  zone.addEventListener("pointermove", (e) => {
    const r = s.getBoundingClientRect(), t = a + ((e.clientX - r.left) / r.width * W - x0) / (x1 - x0) * (z - a);
    const [ta, v] = tous.reduce((p, q) => (Math.abs(q[0] - t) < Math.abs(p[0] - t) ? q : p));
    repere.setAttribute("x1", X(ta)); repere.setAttribute("x2", X(ta)); repere.setAttribute("opacity", 1);
    const [px, py] = versPixels(s, conteneur, X(ta), Y(v));
    b.montrer(px, py, `<b>${ta}</b> : ${nombre(v, 1)} % du revenu national${ta > 2010 ? " (projection)" : ""}`);
  });
  zone.addEventListener("pointerleave", () => { repere.setAttribute("opacity", 0); b.cacher(); });
  tableau(conteneur, "Voir les données", ["Année", "% du revenu national"], tous.map(([t, v]) => [t, nombre(v, 1)]));
  const src = conteneur.querySelector(".source") || conteneur.appendChild(Object.assign(document.createElement("p"), { className: "source" }));
  src.innerHTML = `Flux successoral annuel en % du revenu national, France ; pointillés : projection. <a href="${piketty.url}">Thomas Piketty, <i>Le Capital au XXI<sup>e</sup> siècle</i></a>, annexe technique.`;
}

// Gaufre : 100 cases = 100 € de patrimoine, rampe séquentielle d'une seule teinte (plus foncé = plus riche).
export function gaufre(grille, legende, source) {
  const rampe = ["#c9d6ea", "#a9bfe0", "#86a5d4", "#5f86c3", "#3b64a8", "#14284a"];
  const sombre = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  const r = sombre ? ["#2a3a58", "#34507c", "#3f67a3", "#5b8be0", "#8db0ec", "#dce7fb"] : rampe;
  const groupes = patrimoine.groupes;
  const cases = [];
  // Arrondi au plus fort reste pour tomber exactement sur 100 cases.
  const brut = groupes.map((g) => g.part), ent = brut.map(Math.floor);
  let reste = 100 - ent.reduce((a, b) => a + b, 0);
  brut.map((v, i) => [v - ent[i], i]).sort((p, q) => q[0] - p[0]).slice(0, reste).forEach(([, i]) => ent[i]++);
  for (let g = groupes.length - 1; g >= 0; g--) for (let k = 0; k < ent[g]; k++) cases.push(g);
  grille.innerHTML = cases.map((g) => `<span style="background:${r[g]}" title="${groupes[g].label}"></span>`).join("");
  legende.innerHTML = [...groupes].reverse().map((g, j) => {
    const i = groupes.length - 1 - j;
    return `<div><i style="background:${r[i]}"></i><span>${g.label}</span><b>${nombre(ent[i])} €</b></div>`;
  }).join("");
  source.innerHTML = `Sur 100 € de patrimoine net des ménages, ${patrimoine.periode}. <a href="${patrimoine.url}">BCE et Banque de France, comptes distributionnels de patrimoine</a>.`;
}

// Haltères : taux prévu par le barème et taux réellement payé, par tranche d'héritiers.
export function graphiqueTaux(conteneur, donnees) {
  const W = largeur(conteneur, 600), etroit = W < 460, rh = 46, haut = etroit ? 70 : 54, H = haut + donnees.length * rh + 30, x0 = 112, x1 = W - 16, m = 45;
  const s = svg(conteneur, W, H, "Taux d'impôt prévu par le barème et taux réellement payé, selon ce que l'héritier reçoit sur sa vie");
  const X = (v) => x0 + (v / m) * (x1 - x0);
  const c1 = couleur("--serie-1"), c2 = couleur("--serie-2");
  el("circle", { cx: x0 + 6, cy: 14, r: 6, fill: c2 }, s); el("text", { x: x0 + 18, y: 18 }, s, "Taux prévu par le barème");
  const lx = etroit ? x0 : x0 + 214, ly = etroit ? 38 : 14;
  el("circle", { cx: lx + 6, cy: ly, r: 6, fill: c1 }, s); el("text", { x: lx + 18, y: ly + 4 }, s, "Taux réellement payé");
  for (const t of [0, 10, 20, 30, 40]) { el("line", { x1: X(t), x2: X(t), y1: haut - 10, y2: H - 26, class: "axe" }, s); el("text", { x: X(t), y: H - 8, "text-anchor": "middle" }, s, `${t} %`); }
  const b = bulle(conteneur);
  donnees.forEach((d, i) => {
    const y = haut + i * rh + rh / 2;
    el("text", { x: x0 - 12, y: y - 2, "text-anchor": "end", class: "fort" }, s, d.nom);
    el("text", { x: x0 - 12, y: y + 13, "text-anchor": "end" }, s, d.montant);
    el("line", { x1: X(d.reel), x2: X(d.bareme), y1: y, y2: y, stroke: couleur("--contexte"), "stroke-width": 6, "stroke-linecap": "round" }, s);
    el("circle", { cx: X(d.bareme), cy: y, r: 7, fill: c2, stroke: couleur("--papier"), "stroke-width": 2 }, s);
    el("circle", { cx: X(d.reel), cy: y, r: 7, fill: c1, stroke: couleur("--papier"), "stroke-width": 2 }, s);
    if (i === donnees.length - 1) {
      el("text", { x: X(d.bareme), y: y - 14, "text-anchor": "middle", class: "fort" }, s, `${nombre(d.bareme)} %`);
      el("text", { x: X(d.reel), y: y - 14, "text-anchor": "middle", class: "fort" }, s, `${nombre(d.reel)} %`);
    }
    const cible = el("rect", { x: 0, y: y - rh / 2, width: W, height: rh, fill: "transparent" }, s);
    cible.addEventListener("pointerenter", () => { const [px, py] = versPixels(s, conteneur, X(d.bareme), y - 8); b.montrer(px, py, `<b>${d.nom}</b> (${d.montant})<br>barème : ${nombre(d.bareme, 1)} % · payé : ${nombre(d.reel, 1)} %`); });
    cible.addEventListener("pointerleave", () => b.cacher());
  });
  tableau(conteneur, "Voir les données", ["Héritiers", "Reçu sur la vie", "Barème", "Payé"], donnees.map((d) => [d.nom, d.montant, `${nombre(d.bareme, 1)} %`, `${nombre(d.reel, 1)} %`]));
  const src = conteneur.querySelector(".source") || conteneur.appendChild(Object.assign(document.createElement("p"), { className: "source" }));
  src.innerHTML = `Héritiers d'une même génération classés selon ce qu'ils reçoivent sur toute leur vie. Taux payé : <a href="https://www.cae-eco.fr/repenser-lheritage">CAE, note n° 69, 2021</a> (lecture du graphique 2, à 1 point près). Taux du barème : barème en ligne directe appliqué au montant moyen de la tranche, un abattement de 100&nbsp;000 € par parent.`;
}

// Recettes du simulateur : colonnes empilées (droits actuels, supplément), fond nuit.
export function graphiqueRecettes(conteneur, r) {
  const W = largeur(conteneur, 560), H = 230, x0 = 34, x1 = W - 4, y0 = 30, y1 = 202;
  const max = Math.max(...r.actuelles.map((v, i) => v + Math.max(0, r.supplement[i])), 1);
  const m = Math.ceil(max / 20) * 20;
  const s = svg(conteneur, W, H, `Recettes des droits sur les héritages chaque année de 2025 à 2040, actuelles et supplémentaires`);
  const Y = (v) => y1 - (v / m) * (y1 - y0);
  const cA = couleur("--nuit-trait"), cS = couleur("--tampon");
  el("rect", { x: x0, y: 4, width: 12, height: 12, rx: 2, fill: cA }, s); el("text", { x: x0 + 18, y: 14 }, s, "Droits actuels");
  el("rect", { x: x0 + 132, y: 4, width: 12, height: 12, rx: 2, fill: cS }, s); el("text", { x: x0 + 150, y: 14 }, s, r.supplement[0] < 0 ? "Recettes perdues" : "Recettes en plus");
  for (let t = 0; t <= m; t += m / 4) { el("line", { x1: x0, x2: x1, y1: Y(t), y2: Y(t), class: "axe" }, s); el("text", { x: x0 - 6, y: Y(t) + 4, "text-anchor": "end" }, s, nombre(t)); }
  const slot = (x1 - x0) / r.annees.length, w = Math.min(22, slot - 6);
  const b = bulle(conteneur);
  r.annees.forEach((a, i) => {
    const x = x0 + i * slot + (slot - w) / 2, act = r.actuelles[i], sup = r.supplement[i];
    const base = sup < 0 ? act + sup : act;
    el("rect", { x, y: Y(base), width: w, height: y1 - Y(base), fill: cA }, s);
    if (sup > 0) colonne(s, x, Y(act + sup), w, Y(act) - Y(act + sup) - 2, cS);
    else if (sup < 0) el("rect", { x, y: Y(act), width: w, height: Y(base) - Y(act), fill: "none", stroke: cS, "stroke-dasharray": "3 3" }, s);
    if (i % 5 === 0 || i === 15) el("text", { x: x + w / 2, y: y1 + 18, "text-anchor": "middle" }, s, a);
    const cible = el("rect", { x: x0 + i * slot, y: y0, width: slot, height: y1 - y0, fill: "transparent" }, s);
    cible.addEventListener("pointerenter", () => { const [px, py] = versPixels(s, conteneur, x + w / 2, Y(act + Math.max(0, sup))); b.montrer(px, py, `<b>${a}</b> : ${nombre(act, 1)} Md€ actuels, ${sup >= 0 ? "+" : "−"}${nombre(Math.abs(sup), 1)} Md€`); });
    cible.addEventListener("pointerleave", () => b.cacher());
  });
}

export { pct };
