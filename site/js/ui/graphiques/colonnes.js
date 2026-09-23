// Colonnes empilées, une par catégorie (année). Spécifications : colonnes ≤ 24 px, bout arrondi 4 px,
// 2 px d'écart entre segments, grille en filet, étiquette directe sur la dernière colonne seulement.

import { s, h } from "../dom.js";
import { creerInfobulle } from "./infobulle.js";

/**
 * @param {HTMLElement} zone
 * @param {{
 *   categories: (string|number)[],
 *   series: {id:string, label:string, couleur:string, valeurs:number[]}[],
 *   formatValeur: (v:number)=>string,
 *   formatAxe?: (v:number)=>string,
 * }} config
 */
export function colonnesEmpilees(zone, config) {
  const infobulle = creerInfobulle(zone);
  const dessiner = () => {
    zone.querySelector("svg")?.remove();
    const { categories, series, formatValeur, formatAxe = formatValeur } = config;
    const largeur = Math.max(300, zone.clientWidth);
    const hauteur = largeur < 520 ? 240 : 300;
    const m = { haut: 24, droite: 52, bas: 28, gauche: 40 };
    const lp = largeur - m.gauche - m.droite;
    const hp = hauteur - m.haut - m.bas;

    const totaux = categories.map((_, i) => series.reduce((t, se) => t + se.valeurs[i], 0));
    const pas = pasRond(Math.max(...totaux) / 4);
    const max = Math.ceil(Math.max(...totaux) / pas) * pas;
    const y = (v) => m.haut + hp - (v / max) * hp;
    const bande = lp / categories.length;
    const epaisseur = Math.min(24, bande * 0.62);
    const xCentre = (i) => m.gauche + bande * i + bande / 2;

    const svg = s("svg", { viewBox: `0 0 ${largeur} ${hauteur}`, role: "img", "aria-label": config.label ?? "" });

    for (let v = 0; v <= max + 1e-9; v += pas) {
      svg.append(
        s("line", { class: v === 0 ? "axe" : "grille", x1: m.gauche, x2: largeur - m.droite, y1: y(v), y2: y(v) }),
        s("text", { x: m.gauche - 8, y: y(v) + 4, "text-anchor": "end" }, formatAxe(v)),
      );
    }

    const tousLes = largeur < 520 ? 5 : 3;
    categories.forEach((c, i) => {
      if (i % tousLes === 0 || i === categories.length - 1) {
        svg.append(s("text", { x: xCentre(i), y: hauteur - 8, "text-anchor": "middle" }, String(c)));
      }
      let base = 0;
      const derniere = series.length - 1;
      series.forEach((se, k) => {
        const v = se.valeurs[i];
        const y0 = y(base);
        const y1 = y(base + v);
        const hSeg = Math.max(0, y0 - y1 - (k > 0 ? 2 : 0));
        const haut = y0 - (k > 0 ? 2 : 0) - hSeg;
        svg.append(
          k === derniere
            ? s("path", { d: colonneArrondie(xCentre(i) - epaisseur / 2, haut, epaisseur, hSeg, 4), style: `fill:${se.couleur}` })
            : s("rect", { x: xCentre(i) - epaisseur / 2, y: haut, width: epaisseur, height: hSeg, style: `fill:${se.couleur}` }),
        );
        base += v;
      });
    });

    const iDernier = categories.length - 1;
    svg.append(
      s("text", { class: "etiquette", x: xCentre(iDernier) + epaisseur / 2 + 6, y: y(totaux[iDernier]) + 4 }, formatValeur(totaux[iDernier])),
    );

    // Cibles de survol et de focus, plus larges que les colonnes.
    categories.forEach((c, i) => {
      const lignes = series.map((se) => ({ couleur: se.couleur, label: se.label, valeur: formatValeur(se.valeurs[i]) }));
      lignes.push({ label: "Total", valeur: formatValeur(totaux[i]) });
      const cible = s("rect", {
        class: "cible",
        x: m.gauche + bande * i,
        y: m.haut,
        width: bande,
        height: hp,
        tabindex: 0,
        "aria-label": `${c} : ${lignes.map((l) => `${l.label} ${l.valeur}`).join(", ")}`,
      });
      const montrer = () => infobulle.afficher(xCentre(i), y(totaux[i]), String(c), lignes);
      cible.addEventListener("pointerenter", montrer);
      cible.addEventListener("focus", montrer);
      cible.addEventListener("pointerleave", infobulle.masquer);
      cible.addEventListener("blur", infobulle.masquer);
      svg.append(cible);
    });

    zone.prepend(svg);
  };

  redessinerSiLargeurChange(zone, dessiner);
}

function colonneArrondie(x, y, l, hauteur, r) {
  const rr = Math.min(r, hauteur, l / 2);
  return `M${x},${y + hauteur}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + l - rr}Q${x + l},${y} ${x + l},${y + rr}V${y + hauteur}Z`;
}

/** Dessine, puis redessine seulement quand la largeur de la zone change. */
export function redessinerSiLargeurChange(zone, dessiner) {
  let largeur = zone.clientWidth;
  dessiner();
  new ResizeObserver(() => {
    if (zone.clientWidth === largeur) return;
    largeur = zone.clientWidth;
    dessiner();
  }).observe(zone);
}

export function pasRond(brut) {
  const p = 10 ** Math.floor(Math.log10(brut));
  const n = brut / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Table de données jumelle d'un graphique. */
export function tableDonnees(conteneur, entetes, lignes) {
  conteneur.replaceChildren(
    h(
      "table",
      {},
      h("thead", {}, h("tr", {}, entetes.map((e) => h("th", { scope: "col" }, e)))),
      h("tbody", {}, lignes.map((l) => h("tr", {}, l.map((c, i) => (i === 0 ? h("th", { scope: "row" }, c) : h("td", {}, c)))))),
    ),
  );
}
