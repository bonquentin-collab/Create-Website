// Barres horizontales, une par catégorie, avec un repère « avant » (point plein) et, en option, un repère
// « après réforme » (anneau). Barres ≤ 24 px d'épaisseur, bout arrondi 4 px, valeur au bout de la barre.
// Écrit en HTML/CSS plutôt qu'en SVG : les libellés longs s'y replient naturellement sur mobile.

import { h } from "../dom.js";

/**
 * @param {HTMLElement} zone
 * @param {{ lignes:{label:string, valeur:number, avant?:number, couleur:string}[], formatValeur:(v:number)=>string, max?:number }} config
 * @returns {{ definirApres:(valeurs:(number|null)[]|null)=>void }}
 */
export function barresHorizontales(zone, config) {
  let apres = null;
  const dessiner = () => {
    const { lignes, formatValeur } = config;
    const max = config.max ?? Math.max(...lignes.flatMap((l) => [l.valeur, l.avant ?? 0, ...(apres ? [apres[lignes.indexOf(l)] ?? 0] : [])])) * 1.05;
    const pct = (v) => `${(v / max) * 100}%`;
    zone.replaceChildren(
      h(
        "ul",
        { class: "barres" },
        lignes.map((l, i) => {
          const a = apres?.[i];
          const texte = [l.label, formatValeur(l.valeur), l.avant != null ? `en 1996 : ${formatValeur(l.avant)}` : null, a != null ? `avec vos réformes : ${formatValeur(a)}` : null]
            .filter(Boolean)
            .join(", ");
          return h(
            "li",
            { class: "barre", "aria-label": texte },
            h("span", { class: "barre__label", "aria-hidden": "true" }, l.label),
            h(
              "span",
              { class: "barre__piste", "aria-hidden": "true" },
              h("span", { class: "barre__remplissage", style: { width: pct(l.valeur), background: l.couleur } }),
              l.avant != null ? h("span", { class: "barre__repere barre__repere--avant", style: { left: pct(l.avant) }, title: `1996 : ${formatValeur(l.avant)}` }) : null,
              a != null ? h("span", { class: "barre__repere barre__repere--apres", style: { left: pct(a) }, title: `Avec vos réformes : ${formatValeur(a)}` }) : null,
            ),
            h("span", { class: "barre__valeur", "aria-hidden": "true" }, formatValeur(a ?? l.valeur)),
          );
        }),
      ),
    );
  };
  dessiner();
  return {
    definirApres(valeurs) {
      apres = valeurs;
      dessiner();
    },
  };
}
