// Courbes temporelles (axe horizontal en années), avec réticule au survol et au clavier, étiquettes en bout
// de ligne, repères de rupture de série et, en option, une colonne « après réforme » à droite de la dernière
// année : un marqueur creux par série, relié au dernier point par un trait fin.
// Spécifications : traits de 2 px, marqueurs ≥ 8 px cerclés de 2 px de fond, grille en filet, un seul axe.

import { s } from "../dom.js";
import { creerInfobulle } from "./infobulle.js";
import { redessinerSiLargeurChange, pasRond } from "./colonnes.js";

/**
 * @param {HTMLElement} zone
 * @param {{
 *   annees:number[],
 *   series:{id:string, label:string, couleur:string, valeurs:number[], discret?:boolean}[],
 *   formatY:(v:number)=>string, formatAxe?:(v:number)=>string,
 *   ruptures?:number[], libelleApres?:string, label?:string,
 * }} config
 * @returns {{ definirApres:(valeurs:Object<string,number>|null)=>void }}
 */
export function lignesTemporelles(zone, config) {
  const infobulle = creerInfobulle(zone);
  let apres = null;

  const dessiner = () => {
    zone.querySelector("svg")?.remove();
    const { annees, series, formatY, formatAxe = formatY, ruptures = [], libelleApres = "Après" } = config;
    const largeur = Math.max(300, zone.clientWidth);
    const etroit = largeur < 560;
    const hauteur = etroit ? 260 : 320;
    const m = { haut: 20, droite: etroit ? 20 : 150, bas: 30, gauche: 52 };
    const colonneApres = apres ? (etroit ? 44 : 70) : 0;
    const lp = largeur - m.gauche - m.droite - colonneApres;
    const hp = hauteur - m.haut - m.bas;

    const toutes = series.flatMap((se) => se.valeurs).concat(apres ? Object.values(apres) : []);
    const brutMin = Math.min(...toutes);
    const brutMax = Math.max(...toutes);
    const pas = pasRond((brutMax - brutMin) / 4 || 1);
    const yMin = Math.floor(brutMin / pas) * pas;
    const yMax = Math.ceil(brutMax / pas) * pas;
    const x = (a) => m.gauche + ((a - annees[0]) / (annees.at(-1) - annees[0])) * lp;
    const xApres = m.gauche + lp + colonneApres * 0.75;
    const y = (v) => m.haut + hp - ((v - yMin) / (yMax - yMin)) * hp;

    const svg = s("svg", { viewBox: `0 0 ${largeur} ${hauteur}`, role: "img", "aria-label": config.label ?? "" });

    for (let v = yMin; v <= yMax + 1e-9; v += pas) {
      svg.append(
        s("line", { class: "grille", x1: m.gauche, x2: m.gauche + lp + colonneApres, y1: y(v), y2: y(v) }),
        s("text", { x: m.gauche - 8, y: y(v) + 4, "text-anchor": "end" }, formatAxe(v)),
      );
    }
    const pasAnnees = etroit ? 7 : 4;
    // Sur petit écran, la colonne « après » prend la place de l'étiquette de la dernière année.
    const derniereVisible = !(apres && etroit);
    for (const a of annees.filter((a, i) => i % pasAnnees === 0 || (a === annees.at(-1) && derniereVisible))) {
      svg.append(s("text", { x: x(a), y: hauteur - 8, "text-anchor": "middle" }, String(a)));
    }
    for (const r of ruptures) {
      svg.append(s("line", { class: "rupture", x1: x(r), x2: x(r), y1: hauteur - m.bas, y2: hauteur - m.bas + 5 }));
    }
    if (apres) {
      svg.append(
        s("line", { class: "axe", x1: m.gauche + lp + colonneApres * 0.4, x2: m.gauche + lp + colonneApres * 0.4, y1: m.haut, y2: m.haut + hp }),
        s("text", { class: "etiquette", x: xApres, y: hauteur - 8, "text-anchor": "middle" }, libelleApres),
      );
    }

    for (const se of series) {
      const d = se.valeurs.map((v, i) => `${i ? "L" : "M"}${x(annees[i]).toFixed(1)},${y(v).toFixed(1)}`).join("");
      svg.append(s("path", { d, fill: "none", style: `stroke:${se.couleur}`, "stroke-width": se.discret ? 1.5 : 2, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: se.discret ? 0.8 : 1 }));
      const dernier = se.valeurs.at(-1);
      svg.append(s("circle", { cx: x(annees.at(-1)), cy: y(dernier), r: 4, style: `fill:${se.couleur};stroke:var(--papier)`, "stroke-width": 2 }));
      if (apres && apres[se.id] != null) {
        svg.append(
          s("line", { x1: x(annees.at(-1)), y1: y(dernier), x2: xApres, y2: y(apres[se.id]), style: `stroke:${se.couleur}`, "stroke-width": 1, opacity: 0.7 }),
          s("circle", { cx: xApres, cy: y(apres[se.id]), r: 5, style: `fill:var(--papier);stroke:${se.couleur}`, "stroke-width": 2.5 }),
        );
      }
    }

    // Étiquettes directes à droite (grand écran), écartées si elles se touchent.
    if (!etroit) {
      const xEtiquette = m.gauche + lp + colonneApres + 10;
      const bouts = series
        .map((se) => ({ se, yy: y(apres?.[se.id] ?? se.valeurs.at(-1)) }))
        .sort((a, b) => a.yy - b.yy);
      for (let i = 1; i < bouts.length; i++) if (bouts[i].yy - bouts[i - 1].yy < 16) bouts[i].yy = bouts[i - 1].yy + 16;
      for (const { se, yy } of bouts) svg.append(s("text", { class: se.discret ? "" : "etiquette", x: xEtiquette, y: yy + 4 }, se.label));
    }

    // Réticule : survol et flèches gauche/droite.
    const curseur = s("line", { class: "curseur", y1: m.haut, y2: m.haut + hp, visibility: "hidden" });
    const cible = s("rect", { class: "cible", x: m.gauche, y: m.haut, width: lp + colonneApres, height: hp, tabindex: 0, "aria-label": "Explorer les années avec les flèches gauche et droite" });
    svg.append(curseur, cible);
    let index = annees.length - 1;
    const montrer = (i, versApres = false) => {
      const px = versApres ? xApres : x(annees[i]);
      curseur.setAttribute("x1", px);
      curseur.setAttribute("x2", px);
      curseur.setAttribute("visibility", "visible");
      const lignes = series.map((se) => ({ couleur: se.couleur, label: se.label, valeur: formatY(versApres ? apres[se.id] ?? se.valeurs.at(-1) : se.valeurs[i]) }));
      const hautPoint = Math.min(...series.map((se) => y(versApres ? apres[se.id] ?? se.valeurs.at(-1) : se.valeurs[i])));
      infobulle.afficher(px, hautPoint, versApres ? libelleApres : String(annees[i]), lignes);
    };
    const cacher = () => {
      curseur.setAttribute("visibility", "hidden");
      infobulle.masquer();
    };
    cible.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * largeur;
      if (apres && px > m.gauche + lp + colonneApres * 0.4) return montrer(0, true);
      const a = annees[0] + ((px - m.gauche) / lp) * (annees.at(-1) - annees[0]);
      montrer(Math.max(0, Math.min(annees.length - 1, Math.round(a - annees[0]))));
    });
    cible.addEventListener("pointerleave", cacher);
    cible.addEventListener("focus", () => montrer(index));
    cible.addEventListener("blur", cacher);
    cible.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const max = annees.length - (apres ? 0 : 1);
      index = Math.max(0, Math.min(max, index + (e.key === "ArrowRight" ? 1 : -1)));
      index === annees.length ? montrer(0, true) : montrer(index);
    });

    zone.prepend(svg);
  };

  redessinerSiLargeurChange(zone, dessiner);
  return {
    definirApres(valeurs) {
      apres = valeurs;
      dessiner();
    },
  };
}
