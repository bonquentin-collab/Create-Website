// Infobulle partagée par les graphiques : positionnée dans la zone, jamais seule source d'une valeur
// (chaque graphique a aussi sa table de données).

import { h } from "../dom.js";

export function creerInfobulle(zone) {
  const el = h("div", { class: "infobulle", role: "status", hidden: true });
  zone.append(el);
  return {
    afficher(x, y, titre, lignes) {
      el.replaceChildren(
        h("strong", {}, titre),
        ...lignes.map(({ couleur, label, valeur }) =>
          h(
            "div",
            { class: "ligne" },
            h("span", {}, couleur ? h("i", { class: "pastille", style: { background: couleur } }) : null, label),
            h("b", {}, valeur),
          ),
        ),
      );
      el.hidden = false;
      const largeur = zone.clientWidth;
      const l = el.offsetWidth;
      const gauche = x + 14 + l > largeur ? x - 14 - l : x + 14;
      el.style.left = `${Math.max(0, gauche)}px`;
      el.style.top = `${Math.max(0, y - el.offsetHeight / 2)}px`;
    },
    masquer() {
      el.hidden = true;
    },
  };
}
