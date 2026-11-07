// Graphiques SVG dessinés à la main à partir des données sourcées.
// Règles (skill dataviz) : barres ≤ 24 px à extrémité arrondie de 4 px, traits de 2 px, grille discrète,
// légende dès deux séries, étiquettes sélectives, survol sur chaque marque, données consultables en tableau.
import { flux, patrimoine, retourHeritage } from "../donnees/sources.js";
import { nombre } from "./format.js";

const NS = "http://www.w3.org/2000/svg";
export const couleur = (nom) => getComputedStyle(document.documentElement).getPropertyValue(nom).trim();

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
    montrer(x, y, html) {
      b.innerHTML = html; b.style.top = `${y}px`; b.hidden = false;
      const w = b.offsetWidth, c = conteneur.clientWidth;
      b.style.left = `${Math.min(Math.max(x, w / 2 + 4), c - w / 2 - 4)}px`;
    },
    cacher() { b.hidden = true; },
  };
}

// Position en pixels dans le conteneur d'un point exprimé dans le repère du viewBox.
function versPixels(s, conteneur, x, y) {
  const r = s.getBoundingClientRect(), c = conteneur.getBoundingClientRect();
  const vb = s.viewBox.baseVal;
  return [r.left - c.left + ((x - vb.x) / vb.width) * r.width, r.top - c.top + ((y - vb.y) / vb.height) * r.height];
}

function tableau(conteneur, titre, entetes, lignes) {
  conteneur.querySelector(".tableau-donnees")?.remove();
  const d = document.createElement("details");
  d.className = "tableau-donnees";
  d.innerHTML = `<summary>${titre}</summary><div class="defile"><table><thead><tr>${entetes.map((e) => `<th>${e}</th>`).join("")}</tr></thead><tbody>${lignes
    .map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  conteneur.appendChild(d);
}

function source(conteneur, html) {
  const p = conteneur.querySelector(".source") || conteneur.appendChild(Object.assign(document.createElement("p"), { className: "source" }));
  p.innerHTML = html;
}

// Accroche : 500 carrés pour tout le patrimoine des ménages ; la bascule montre la part des 10 % les plus riches
// ou des 50 % les moins riches (WID).
export function carreaux(grille, legende) {
  const { wid } = patrimoine;
  const vues = {
    d10: { nom: "Patrimoine des 10 % les plus riches", part: wid.top10,
      note: (p) => `En France, les 10 % les plus riches détiennent ${nombre(p)} % du patrimoine (World Inequality Database, ${wid.annee}).` },
    b50: { nom: "Patrimoine des 50 % les moins riches", part: wid.bas50,
      note: (p) => `En France, les 50 % les moins riches détiennent ${nombre(p, 1)} % du patrimoine (World Inequality Database, ${wid.annee}).` },
  };
  grille.innerHTML = Array.from({ length: 500 }, (_, i) => `<span style="--i:${i}"></span>`).join("");
  const cases = [...grille.children];
  const afficher = (id) => {
    const v = vues[id];
    const n = Math.round((500 * v.part) / 100);
    cases.forEach((c, i) => { c.dataset.groupe = (id === "b50" ? i >= 500 - n : i < n) ? "haut" : "bas"; });
    document.getElementById("carreaux-nom").textContent = v.nom;
    document.getElementById("carreaux-note").textContent = v.note(v.part);
    grille.setAttribute("aria-label", `500 carrés pour tout le patrimoine des ménages : ${n} pour ${v.nom.replace("Patrimoine des ", "les ")}, ${500 - n} pour le reste de la population.`);
    document.querySelectorAll(".bascule button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vue === id)));
  };
  document.querySelectorAll(".bascule button").forEach((b) => b.addEventListener("click", () => afficher(b.dataset.vue)));
  afficher("d10");
  const estomper = (g) => cases.forEach((c) => c.classList.toggle("estompe", !!g && c.dataset.groupe !== g));
  for (const zone of [grille, legende]) {
    zone.addEventListener("pointerover", (e) => { const g = e.target.closest("[data-groupe]")?.dataset.groupe; if (g) estomper(g); });
    zone.addEventListener("pointerleave", () => estomper(null));
  }
  requestAnimationFrame(() => grille.classList.add("anime"));
}

// Part de la population et part du patrimoine (WID) : le 1 %, les 9 % suivants, les 90 % restants.
export function pyramide(conteneur) {
  const { wid } = patrimoine;
  const groupes = [
    { label: "Le 1 % le plus riche", pop: 1, part: wid.top1, couleur: "#170B3B", clair: false },
    { label: "Les 9 % suivants", pop: 9, part: wid.top10 - wid.top1, couleur: "#3F1FA8", clair: false },
    { label: "Les 90 % restants", pop: 90, part: 100 - wid.top10, couleur: "#C9BEE8", clair: true },
  ];
  const haut = 70, bas = 510, H = bas - haut, xPop = 200, xPat = 510, l = 110, ecart = 2;
  conteneur.innerHTML = "";
  const s = svg(conteneur, 680, 566, groupes.map((g) => `${g.label} : ${g.part} % du patrimoine`).join(" ; "));
  s.setAttribute("viewBox", "40 18 600 545");
  let p = haut, w = haut;
  const blocs = groupes.map((g) => {
    const b = { g, p0: p, p1: p + (H * g.pop) / 100, w0: w, w1: w + (H * g.part) / 100 };
    p = b.p1; w = b.w1;
    return b;
  });
  const encre = couleur("--encre");
  const info = bulle(conteneur);
  const fleche = el("marker", { id: "fleche-top1", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, el("defs", {}, s));
  el("path", { d: "M2 1L8 5L2 9", fill: "none", stroke: encre, "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, fleche);
  const titre = (x, t) => el("text", { x, y: 54, "text-anchor": "middle", class: "fort", style: "font-size:20px" }, s, t);
  titre(xPop + l / 2, "Population"); titre(xPat + l / 2, "Patrimoine");
  const axe = (y, t) => el("text", { x: 90, y, "text-anchor": "middle", style: "font-size:15px" }, s, t);
  axe(38, "Les plus"); axe(56, "riches"); axe(532, "Les plus"); axe(550, "modestes");
  el("line", { x1: 90, y1: 508, x2: 90, y2: 74, stroke: encre, "stroke-width": 2, "marker-end": "url(#fleche-top1)" }, s);
  const milieu = (xPop + l + xPat) / 2;
  const resserre = (a, b) => { const d = Math.min(ecart / 2, Math.max(0, (b - a - 3) / 2)); return [a + d, b - d]; };
  const formes = blocs.map((b) => {
    const g = el("g", { class: "groupe-pyr", tabindex: 0, role: "img", "aria-label": `${b.g.label} : ${b.g.pop} % de la population, ${b.g.part} % du patrimoine` }, s);
    const [p0, p1] = resserre(b.p0, b.p1), [w0, w1] = resserre(b.w0, b.w1);
    el("path", { d: `M${xPop + l} ${p0} C${milieu} ${p0},${milieu} ${w0},${xPat} ${w0} L${xPat} ${w1} C${milieu} ${w1},${milieu} ${p1},${xPop + l} ${p1} Z`,
      fill: b.g.couleur, opacity: b.g.clair ? 0.45 : 0.3 }, g);
    el("rect", { x: xPop, y: p0, width: l, height: Math.max(3, p1 - p0), fill: b.g.couleur }, g);
    el("rect", { x: xPat, y: w0, width: l, height: w1 - w0, fill: b.g.couleur }, g);
    const texte = b.g.clair ? encre : "#fff";
    if (p1 - p0 < 24) el("text", { x: xPop - 10, y: (p0 + p1) / 2 + 6, "text-anchor": "end", class: "fort", style: "font-size:17px" }, g, `${b.g.pop} %`);
    else el("text", { x: xPop + l / 2, y: (p0 + p1) / 2 + 7, "text-anchor": "middle", style: `fill:${texte};font-size:19px;font-weight:500` }, g, `${b.g.pop} %`);
    el("text", { x: xPat + l / 2, y: (w0 + w1) / 2 + 7, "text-anchor": "middle", style: `fill:${texte};font-size:19px;font-weight:500` }, g, `${b.g.part} %`);
    const entrer = () => {
      formes.forEach((f) => { f.style.opacity = f === g ? 1 : 0.25; });
      const [x, y] = versPixels(s, conteneur, milieu, (p0 + p1 + w0 + w1) / 4);
      info.montrer(x, y, `<b>${b.g.label}</b><br>${b.g.pop} % de la population · ${b.g.part} % du patrimoine`);
    };
    const sortir = () => { formes.forEach((f) => { f.style.opacity = 1; }); info.cacher(); };
    g.addEventListener("pointerenter", entrer); g.addEventListener("focus", entrer);
    g.addEventListener("pointerleave", sortir); g.addEventListener("blur", sortir);
    return g;
  });
}

// Bulle « Montant annuel transmis » : patrimoine transmis chaque année de 2026 à 2040.
export function graphiqueFlux(conteneur) {
  const W = largeur(conteneur, 600), H = 320, g = 46, d = W - 10, h = 24, b = 286, max = 700;
  const v = flux.valeurs, n = v.length;
  const s = svg(conteneur, W, H, `Patrimoine transmis chaque année de ${flux.annees[0]} à ${flux.annees[n - 1]}, de ${v[0]} à ${v[n - 1]} milliards d'euros`);
  const y = (x) => b - (x / max) * (b - h);
  for (const t of [0, 200, 400, 600]) {
    el("line", { x1: g, x2: d, y1: y(t), y2: y(t), class: t ? "axe" : "axe base" }, s);
    el("text", { x: g - 8, y: y(t) + 4, "text-anchor": "end" }, s, nombre(t));
  }
  el("text", { x: g - 8, y: 12, "text-anchor": "end" }, s, "Md€");
  const pas = (d - g) / n, bw = Math.min(24, pas - 6), info = bulle(conteneur);
  v.forEach((val, i) => {
    const x = g + i * pas + (pas - bw) / 2;
    const extreme = i === 0 || i === n - 1;
    const barre = colonne(s, x, y(val), bw, b - y(val), couleur(extreme ? "--serie-1" : "--contexte"));
    const zone = el("rect", { x: g + i * pas, y: h, width: pas, height: b - h, fill: "transparent" }, s);
    const an = flux.annees[i];
    zone.addEventListener("pointerenter", () => {
      barre.style.opacity = 0.75;
      const [px, py] = versPixels(s, conteneur, x + bw / 2, y(val));
      info.montrer(px, py, `<b>${an}</b> : ${nombre(val)} Md€ transmis`);
    });
    zone.addEventListener("pointerleave", () => { barre.style.opacity = 1; info.cacher(); });
    if ((W > 420 && (i + 1) % 5 === 0) || extreme) el("text", { x: x + bw / 2, y: b + 18, "text-anchor": "middle" }, s, an);
  });
  el("text", { x: g + pas / 2, y: y(v[0]) - 8, "text-anchor": "middle", class: "fort" }, s, nombre(v[0]));
  el("text", { x: g + (n - 0.5) * pas, y: y(v[n - 1]) - 8, "text-anchor": "middle", class: "fort" }, s, nombre(v[n - 1]));
  tableau(conteneur, "Voir les données", ["Année", "Md€"], flux.annees.map((a, i) => [a, nombre(v[i])]));
  source(conteneur, `Héritages et donations chaque année, en milliards d'euros. <a href="${flux.url}">Fondation Jean-Jaurès (2024)</a>, d'après Piketty (2011) et Dherbécourt (2017).`);
}

// Bulle « Le retour de l'héritage » : part du patrimoine hérité, 1890-2020.
export function graphiqueHeritage(conteneur) {
  const W0 = largeur(conteneur, 600), W = Math.min(W0, 480), H = 360, g = 42, d = W - 14, h = 20, b = 322, min = 20, max = 80;
  const a0 = 1890, a1 = 2020;
  const pts = retourHeritage.serie.map(([a, v]) => [a, 100 * v]);
  const s = svg(conteneur, W, H, "Part du patrimoine hérité dans le patrimoine total, France, 1890-2020 : 78 % en 1910, 34 % en 1970, 60 % en 2020");
  s.style.maxWidth = `${W}px`;
  const x = (a) => g + ((a - a0) / (a1 - a0)) * (d - g);
  const y = (v) => b - ((v - min) / (max - min)) * (b - h);
  el("rect", { x: x(1914), y: h, width: x(1945) - x(1914), height: b - h, fill: couleur("--papier-2") }, s);
  el("text", { x: (x(1914) + x(1945)) / 2, y: b - 10, "text-anchor": "middle" }, s, "Guerres");
  for (const t of [20, 40, 60, 80]) {
    el("line", { x1: g, x2: d, y1: y(t), y2: y(t), class: t > min ? "axe" : "axe base" }, s);
    el("text", { x: g - 8, y: y(t) + 4, "text-anchor": "end" }, s, `${t} %`);
  }
  for (const a of W > 420 ? [1890, 1910, 1930, 1950, 1970, 1990, 2010] : [1890, 1950, 2010]) el("text", { x: x(a), y: b + 18, "text-anchor": "middle" }, s, a);
  el("path", { d: "M" + pts.map(([a, v]) => `${x(a)},${y(v)}`).join(" L"), fill: "none", stroke: couleur("--serie-1"), "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }, s);
  const repere = (a, v, t, ancre = "middle", dy = -14) => {
    el("circle", { cx: x(a), cy: y(v), r: 6, fill: couleur("--serie-1"), stroke: couleur("--encre"), "stroke-width": 2.5 }, s);
    el("text", { x: x(a), y: y(v) + dy, "text-anchor": ancre, class: "fort" }, s, t);
  };
  repere(1910, 78, "78 % en 1910"); repere(1970, 34, "34 % en 1970", "middle", 26); repere(2020, 60, "60 % en 2020", "end");
  const info = bulle(conteneur);
  const trait = el("line", { y1: h, y2: b, stroke: couleur("--vert"), "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, s);
  const zone = el("rect", { x: g, y: h, width: d - g, height: b - h, fill: "transparent" }, s);
  zone.addEventListener("pointermove", (e) => {
    const r = s.getBoundingClientRect();
    const a = a0 + ((((e.clientX - r.left) / r.width) * W - g) / (d - g)) * (a1 - a0);
    const [pa, pv] = pts.reduce((m, p) => (Math.abs(p[0] - a) < Math.abs(m[0] - a) ? p : m));
    trait.setAttribute("x1", x(pa)); trait.setAttribute("x2", x(pa)); trait.setAttribute("opacity", 0.6);
    const [px, py] = versPixels(s, conteneur, x(pa), y(pv));
    info.montrer(px, py, `<b>${pa}</b> : ${nombre(pv)} % du patrimoine est hérité`);
  });
  zone.addEventListener("pointerleave", () => { trait.setAttribute("opacity", 0); info.cacher(); });
  tableau(conteneur, "Voir les données", ["Année", "Part héritée du patrimoine"], pts.map(([a, v]) => [a, `${nombre(v)} %`]));
  source(conteneur, `Part du patrimoine hérité dans le patrimoine total, France (définition simplifiée, borne basse). <a href="${retourHeritage.url}">Alvaredo, Garbinti et Piketty (2017)</a>, <i>Economica</i>, figure 3 ; 2020 : Conseil d'analyse économique (2021).`);
}

// Bulle « La faible taxation de l'héritage » : taux théorique (droits / héritage déclaré) et taux effectivement payé
// (droits / tout ce qui est reçu), par tranche d'héritiers (CAE).
export function graphiqueTaux(conteneur, donnees) {
  const W = largeur(conteneur, 600), etroit = W < 520, H = etroit ? 440 : 400;
  const g = 44, d = W - 28, h = etroit ? 96 : 44, b = H - (etroit ? 84 : 52), max = 33;
  const s = svg(conteneur, W, H, "Taux théorique et taux effectivement payé, par tranche d'héritiers : l'écart se creuse jusqu'à 31 % contre 10 % pour les 0,1 % qui héritent le plus");
  const n = donnees.length, pas = (d - g) / n;
  const x = (i) => g + pas * (i + 0.5);
  const y = (v) => b - (v / max) * (b - h);
  const rouge = "#ED174C", serie = couleur("--serie-1");
  const marqueur = el("marker", { id: "fleche-taux", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: "auto" }, el("defs", {}, s));
  el("path", { d: "M0,0 L10,5 L0,10 z", fill: rouge }, marqueur);
  const legende = [
    [(lx) => el("circle", { cx: lx + 6, cy: 0, r: 6, fill: "#fff", stroke: serie, "stroke-width": 3 }), "Taux théorique"],
    [(lx) => el("circle", { cx: lx + 6, cy: 0, r: 6, fill: serie }), "Taux effectivement payé"],
    [(lx) => el("rect", { x: lx, y: -6, width: 14, height: 12, rx: 3, fill: rouge, opacity: 0.2 }), "Perte pour les finances publiques"],
  ];
  let lx = g, ly = 16;
  legende.forEach(([marque, texte], k) => {
    if (etroit && k > 0) { lx = g; ly = 16 + 22 * k; }
    const grp = el("g", { transform: `translate(0 ${ly})` }, s);
    grp.appendChild(marque(lx));
    el("text", { x: lx + 20, y: 4 }, grp, texte);
    lx += 32 + texte.length * 6.6;
  });
  for (const t of [0, 10, 20, 30]) {
    el("line", { x1: g, x2: d, y1: y(t), y2: y(t), class: t ? "axe" : "axe base" }, s);
    el("text", { x: g - 8, y: y(t) + 4, "text-anchor": "end" }, s, `${t} %`);
  }
  const hautP = donnees.map((t, i) => `${x(i)},${y(t.declare)}`);
  const basP = donnees.map((t, i) => `${x(i)},${y(t.reel)}`).reverse();
  el("polygon", { points: [...hautP, ...basP].join(" "), fill: rouge, opacity: 0.18 }, s);
  donnees.forEach((t, i) => {
    if (t.declare - t.reel > 2) el("line", { x1: x(i), x2: x(i), y1: y(t.declare) + 10, y2: y(t.reel) - 11, stroke: rouge, "stroke-width": 2.5, "marker-end": "url(#fleche-taux)" }, s);
  });
  const info = bulle(conteneur);
  donnees.forEach((t, i) => {
    el("circle", { cx: x(i), cy: y(t.reel), r: 8, fill: serie }, s);
    el("circle", { cx: x(i), cy: y(t.declare), r: 8, fill: "#fff", stroke: serie, "stroke-width": 3 }, s);
    const [l1, l2] = t.nom.startsWith("Top ") ? ["Top", t.nom.slice(4)] : ["80 %", "du bas"];
    if (etroit) el("text", { x: x(i) + 4, y: b + 16, "text-anchor": "end", class: "fort", style: "font-size:11.5px", transform: `rotate(-45 ${x(i) + 4} ${b + 16})` }, s, t.nom);
    else { el("text", { x: x(i), y: b + 20, "text-anchor": "middle", class: "fort" }, s, l1); el("text", { x: x(i), y: b + 36, "text-anchor": "middle", class: "fort" }, s, l2); }
    if (i === n - 1) {
      el("text", { x: x(i) + 12, y: y(t.declare) - 12, "text-anchor": "end", class: "fort", style: "font-size:15px" }, s, `${nombre(t.declare)} %`);
      el("text", { x: x(i) + 12, y: y(t.reel) + 28, "text-anchor": "end", class: "fort", style: "font-size:15px" }, s, `${nombre(t.reel)} %`);
    }
    const zone = el("rect", { x: x(i) - pas / 2, y: h, width: pas, height: b - h, fill: "transparent" }, s);
    zone.addEventListener("pointerenter", () => {
      const [px, py] = versPixels(s, conteneur, x(i), y(t.declare) - 10);
      info.montrer(px, py, `<b>${t.nom}</b><br>taux théorique : ${nombre(t.declare, 1)} % · payé : ${nombre(t.reel, 1)} %`);
    });
    zone.addEventListener("pointerleave", () => info.cacher());
  });
  tableau(conteneur, "Voir les données", ["Héritiers", "Taux théorique", "Taux effectivement payé"], donnees.map((t) => [t.nom, `${nombre(t.declare, 1)} %`, `${nombre(t.reel, 1)} %`]));
  source(conteneur, `Héritiers d'une même génération classés selon ce qu'ils reçoivent sur toute leur vie. Taux théorique : droits rapportés à l'héritage déclaré au fisc ; taux effectivement payé : droits rapportés à tout ce qui est reçu. <a href="https://www.cae-eco.fr/repenser-lheritage">CAE, note n° 69, 2021</a> (lecture du graphique 2, à 1 point près). L'écart en rouge correspond aux biens que les niches font sortir de la déclaration.`);
}

// Panneau de résultats : recettes des droits chaque année, actuelles et supplémentaires.
export function graphiqueRecettes(conteneur, r) {
  const W = largeur(conteneur, 560), H = 250, g = 34, d = W - 4, h = 30, b = 222;
  const haut = Math.max(...r.actuelles.map((a, i) => a + Math.max(0, r.supplement[i])), 1);
  const max = Math.ceil(haut / 20) * 20;
  const n = r.annees.length;
  const s = svg(conteneur, W, H, `Recettes des droits sur les héritages chaque année de ${r.annees[0]} à ${r.annees[n - 1]}, actuelles et supplémentaires`);
  const y = (v) => b - (v / max) * (b - h);
  const gris = couleur("--contexte"), indigo = couleur("--indigo");
  el("rect", { x: g, y: 4, width: 12, height: 12, rx: 2, fill: gris }, s);
  el("text", { x: g + 18, y: 14 }, s, "Droits actuels");
  el("rect", { x: g + 132, y: 4, width: 12, height: 12, rx: 2, fill: indigo }, s);
  el("text", { x: g + 150, y: 14 }, s, r.supplement[0] < 0 ? "Recettes perdues" : "Recettes en plus");
  for (let t = 0; t <= max; t += max / 4) {
    el("line", { x1: g, x2: d, y1: y(t), y2: y(t), class: t ? "axe" : "axe base" }, s);
    el("text", { x: g - 6, y: y(t) + 4, "text-anchor": "end" }, s, nombre(t));
  }
  const pas = (d - g) / n, bw = Math.min(22, pas - 6), info = bulle(conteneur);
  r.annees.forEach((an, i) => {
    const x = g + i * pas + (pas - bw) / 2;
    const a = r.actuelles[i], sup = r.supplement[i], base = sup < 0 ? a + sup : a;
    el("rect", { x, y: y(base), width: bw, height: b - y(base), fill: gris }, s);
    if (sup > 0) colonne(s, x, y(a + sup), bw, y(a) - y(a + sup) - 2, indigo);
    else if (sup < 0) el("rect", { x, y: y(a), width: bw, height: y(base) - y(a), fill: "none", stroke: indigo, "stroke-width": 2, "stroke-dasharray": "3 3" }, s);
    if (i === 0 || (i + 1) % 5 === 0) el("text", { x: x + bw / 2, y: b + 18, "text-anchor": "middle" }, s, an);
    const zone = el("rect", { x: g + i * pas, y: h, width: pas, height: b - h, fill: "transparent" }, s);
    zone.addEventListener("pointerenter", () => {
      const [px, py] = versPixels(s, conteneur, x + bw / 2, y(a + Math.max(0, sup)));
      info.montrer(px, py, `<b>${an}</b> : ${nombre(a, 1)} Md€ actuels, ${sup >= 0 ? "+" : "−"}${nombre(Math.abs(sup), 1)} Md€`);
    });
    zone.addEventListener("pointerleave", () => info.cacher());
  });
}
