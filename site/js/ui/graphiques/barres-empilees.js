// Barres horizontales empilées : une barre par ligne, découpée en segments (qui paie quoi). En HTML/CSS pour que
// les libellés se replient sur mobile. Survol ou focus d'un segment : infobulle native (title) et texte accessible.
// Lignes regroupables (champ `groupe`) : un intertitre est inséré à chaque changement de groupe.

import { h } from "../dom.js";

/**
 * @param {HTMLElement} zone
 * @param {{
 *   segments:{id:string, label:string, couleur:string}[],
 *   lignes:{label:string, groupe?:string, valeurs:Object<string, number>}[],
 *   format:(v:number)=>string, formatTotal?:(v:number, ligne:object)=>string, max?:number,
 *   etiquetteMin?:number,   // part minimale de la barre pour écrire la valeur dans le segment
 * }} config
 */
export function barresEmpilees(zone, config) {
  const { segments, lignes, format, formatTotal = format, etiquetteMin = 0.12 } = config;
  const total = (l) => segments.reduce((t, s) => t + (l.valeurs[s.id] ?? 0), 0);
  const max = config.max ?? Math.max(...lignes.map(total)) * 1.02;
  const elements = [];
  let groupe = null;
  for (const l of lignes) {
    if (l.groupe && l.groupe !== groupe) {
      groupe = l.groupe;
      elements.push(h("li", { class: "empile__groupe", "aria-hidden": "true" }, groupe));
    }
    const t = total(l);
    const texte = [l.groupe ? `${l.groupe}, ${l.label}` : l.label, `total ${formatTotal(t, l)}`, ...segments.map((s) => `${s.label} ${format(l.valeurs[s.id] ?? 0)}`)].join(", ");
    elements.push(
      h(
        "li",
        { class: "barre empile", "aria-label": texte },
        h("span", { class: "barre__label", "aria-hidden": "true" }, l.label),
        h(
          "span",
          { class: "empile__piste", "aria-hidden": "true", style: { width: `${(t / max) * 100}%` } },
          segments.map((s) => {
            const v = l.valeurs[s.id] ?? 0;
            if (v <= 0) return null;
            const part = v / max;
            return h(
              "span",
              { class: "empile__segment", title: `${s.label} : ${format(v)}`, style: { flexGrow: String(v), background: s.couleur } },
              part >= etiquetteMin ? h("span", { class: "empile__texte" }, format(v)) : null,
            );
          }),
        ),
        h("span", { class: "barre__valeur", "aria-hidden": "true" }, formatTotal(t, l)),
      ),
    );
  }
  zone.replaceChildren(
    h("div", { class: "legende" }, segments.map((s) => h("span", {}, h("i", { class: "pastille", style: { background: s.couleur } }), s.label))),
    h("ul", { class: "barres barres--empilees" }, elements),
  );
}
