// Courbes sur axe horizontal logarithmique, avec réticule au survol et marqueur « vous êtes ici ».
// Spécifications : traits de 2 px, marqueurs ≥ 8 px cerclés de 2 px de fond, grille en filet.

import { s } from "../dom.js";
import { creerInfobulle } from "./infobulle.js";
import { redessinerSiLargeurChange } from "./colonnes.js";

/**
 * @param {HTMLElement} zone
 * @param {{
 *   xMin:number, xMax:number, yMax:number, yPas:number,
 *   graduationsX:number[],
 *   series: {id:string, label:string, couleur:string, f:(x:number)=>number}[],
 *   formatX:(x:number)=>string, formatY:(y:number)=>string, formatXLong?:(x:number)=>string,
 *   label?:string,
 * }} config
 * @returns {{ marquer:(x:number|null)=>void, redessiner:()=>void }}
 */
export function courbesLog(zone, config) {
  const infobulle = creerInfobulle(zone);
  let marqueurX = null;
  let geo = null;

  const dessiner = () => {
    zone.querySelector("svg")?.remove();
    const { xMin, xMax, yMax, yPas, series, formatX, formatY, formatXLong = formatX } = config;
    const largeur = Math.max(300, zone.clientWidth);
    const hauteur = largeur < 520 ? 240 : 300;
    const m = { haut: 16, droite: largeur < 520 ? 16 : 112, bas: 30, gauche: 44 };
    const lp = largeur - m.gauche - m.droite;
    const hp = hauteur - m.haut - m.bas;
    const lx = (x) => Math.log10(x);
    const x = (v) => m.gauche + ((lx(v) - lx(xMin)) / (lx(xMax) - lx(xMin))) * lp;
    const xInv = (px) => 10 ** (lx(xMin) + ((px - m.gauche) / lp) * (lx(xMax) - lx(xMin)));
    const y = (v) => m.haut + hp - (v / yMax) * hp;
    geo = { x, y, m, lp, hp };

    const svg = s("svg", { viewBox: `0 0 ${largeur} ${hauteur}`, role: "img", "aria-label": config.label ?? "" });

    for (let v = 0; v <= yMax + 1e-9; v += yPas) {
      svg.append(
        s("line", { class: v === 0 ? "axe" : "grille", x1: m.gauche, x2: m.gauche + lp, y1: y(v), y2: y(v) }),
        s("text", { x: m.gauche - 8, y: y(v) + 4, "text-anchor": "end" }, formatY(v)),
      );
    }
    const graduations = largeur < 520 ? config.graduationsX.filter((_, i) => i % 2 === 0) : config.graduationsX;
    for (const g of graduations) {
      svg.append(s("text", { x: x(g), y: hauteur - 8, "text-anchor": "middle" }, formatX(g)));
    }

    const N = 160;
    const echantillons = Array.from({ length: N + 1 }, (_, i) => 10 ** (lx(xMin) + (i / N) * (lx(xMax) - lx(xMin))));
    for (const se of series) {
      const d = echantillons.map((v, i) => `${i ? "L" : "M"}${x(v).toFixed(1)},${y(se.f(v)).toFixed(1)}`).join("");
      svg.append(s("path", { d, fill: "none", style: `stroke:${se.couleur}`, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    }

    // Étiquettes directes en bout de courbe (grand écran), écartées si elles se touchent.
    if (largeur >= 520) {
      const bouts = series.map((se) => ({ se, yy: y(se.f(xMax)) })).sort((a, b) => a.yy - b.yy);
      for (let i = 1; i < bouts.length; i++) if (bouts[i].yy - bouts[i - 1].yy < 16) bouts[i].yy = bouts[i - 1].yy + 16;
      for (const { se, yy } of bouts) svg.append(s("text", { class: "etiquette", x: m.gauche + lp + 8, y: yy + 4 }, se.label));
    }

    const groupeMarqueur = s("g", { "data-marqueur": "" });
    svg.append(groupeMarqueur);

    const curseur = s("line", { class: "curseur", y1: m.haut, y2: m.haut + hp, visibility: "hidden" });
    svg.append(curseur);
    const cible = s("rect", { class: "cible", x: m.gauche, y: m.haut, width: lp, height: hp, tabindex: 0, "aria-label": "Explorer la courbe avec les flèches gauche et droite" });
    svg.append(cible);

    const montrer = (px) => {
      const v = xInv(Math.min(m.gauche + lp, Math.max(m.gauche, px)));
      curseur.setAttribute("x1", x(v));
      curseur.setAttribute("x2", x(v));
      curseur.setAttribute("visibility", "visible");
      const lignes = series.map((se) => ({ couleur: se.couleur, label: se.label, valeur: formatY(se.f(v)) }));
      infobulle.afficher(x(v), y(Math.max(...series.map((se) => se.f(v)))), formatXLong(v), lignes);
    };
    const cacher = () => {
      curseur.setAttribute("visibility", "hidden");
      infobulle.masquer();
    };
    let pxClavier = m.gauche + lp / 2;
    cible.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect();
      montrer(((e.clientX - r.left) / r.width) * largeur);
    });
    cible.addEventListener("pointerleave", cacher);
    cible.addEventListener("focus", () => montrer(pxClavier));
    cible.addEventListener("blur", cacher);
    cible.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      pxClavier = Math.min(m.gauche + lp, Math.max(m.gauche, pxClavier + (e.key === "ArrowRight" ? 1 : -1) * lp / 24));
      montrer(pxClavier);
    });

    zone.prepend(svg);
    dessinerMarqueur();
  };

  function dessinerMarqueur() {
    const g = zone.querySelector("[data-marqueur]");
    if (!g || !geo) return;
    g.replaceChildren();
    if (marqueurX == null || marqueurX < config.xMin || marqueurX > config.xMax) return;
    const { x, y, m, hp } = geo;
    g.append(s("line", { class: "curseur", x1: x(marqueurX), x2: x(marqueurX), y1: m.haut, y2: m.haut + hp }));
    for (const se of config.series) {
      g.append(s("circle", { cx: x(marqueurX), cy: y(se.f(marqueurX)), r: 5, style: `fill:${se.couleur};stroke:var(--papier-case)`, "stroke-width": 2 }));
    }
    g.append(s("text", { class: "etiquette", x: x(marqueurX) + 6, y: m.haut + 10 }, "Vous"));
  }

  redessinerSiLargeurChange(zone, dessiner);
  return {
    redessiner: dessiner,
    marquer(v) {
      marqueurX = v;
      dessinerMarqueur();
    },
  };
}
