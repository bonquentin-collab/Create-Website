// Graphique de pente : deux colonnes (avant / après un changement de définition), une ligne par série.
// Étiquettes directes aux deux extrémités ; traits de 2 px, marqueurs cerclés de fond.

import { s } from "../dom.js";
import { redessinerSiLargeurChange } from "./colonnes.js";

/**
 * @param {HTMLElement} zone
 * @param {{ colonnes:[string,string], series:{label:string, couleur:string, valeurs:[number,number]}[], format:(v:number)=>string, label?:string }} config
 */
export function pente(zone, config) {
  const dessiner = () => {
    zone.querySelector("svg")?.remove();
    const largeur = Math.max(300, Math.min(zone.clientWidth, 640));
    const etroit = largeur < 480;
    const hauteur = 260;
    const m = { haut: 34, bas: 20, gauche: etroit ? 70 : 120, droite: etroit ? 70 : 120 };
    const toutes = config.series.flatMap((se) => se.valeurs);
    const min = Math.min(...toutes);
    const max = Math.max(...toutes);
    const marge = (max - min) * 0.25 || 0.01;
    const y = (v) => m.haut + (hauteur - m.haut - m.bas) * (1 - (v - (min - marge)) / (max - min + 2 * marge));
    const x = [m.gauche, largeur - m.droite];

    const svg = s("svg", { viewBox: `0 0 ${largeur} ${hauteur}`, role: "img", "aria-label": config.label ?? "" });
    config.colonnes.forEach((c, i) => {
      svg.append(
        s("line", { class: "axe", x1: x[i], x2: x[i], y1: m.haut - 8, y2: hauteur - m.bas }),
        s("text", { class: "etiquette", x: x[i], y: 16, "text-anchor": "middle" }, c),
      );
    });
    // Étiquettes écartées si elles se touchent, de chaque côté.
    const positions = [0, 1].map((i) => {
      const p = config.series.map((se, k) => ({ k, yy: y(se.valeurs[i]) })).sort((a, b) => a.yy - b.yy);
      for (let j = 1; j < p.length; j++) if (p[j].yy - p[j - 1].yy < 30) p[j].yy = p[j - 1].yy + 30;
      return Object.fromEntries(p.map((e) => [e.k, e.yy]));
    });
    config.series.forEach((se, k) => {
      const [a, b] = se.valeurs;
      svg.append(s("line", { x1: x[0], y1: y(a), x2: x[1], y2: y(b), style: `stroke:${se.couleur}`, "stroke-width": 2.5, "stroke-linecap": "round" }));
      for (const [i, v] of [a, b].entries()) {
        svg.append(s("circle", { cx: x[i], cy: y(v), r: 5, style: `fill:${se.couleur};stroke:var(--papier)`, "stroke-width": 2 }));
        const cote = i === 0 ? -10 : 10;
        const ancre = i === 0 ? "end" : "start";
        svg.append(
          s("text", { class: "etiquette", x: x[i] + cote, y: positions[i][k] - 2, "text-anchor": ancre }, config.format(v)),
          s("text", { x: x[i] + cote, y: positions[i][k] + 13, "text-anchor": ancre }, se.label),
        );
      }
    });
    zone.prepend(svg);
  };
  redessinerSiLargeurChange(zone, dessiner);
}
