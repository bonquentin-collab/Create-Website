// Ouverture de la page retraites : d'où viennent 100 € de retraite.

import { h } from "./dom.js";
import { retraites } from "../params/retraites.js";
import { totalRessources } from "../engine/retraites.js";

const ENCRE_SOMBRE = new Set(["transferts", "autres"]);

export function monter(racine) {
  const total = totalRessources(retraites.ressources);
  const groupes = retraites.groupes.map((g) => ({
    ...g,
    part: totalRessources(retraites.ressources.filter((r) => r.groupe === g.id)) / total,
  }));
  // Parts entières qui somment à 100 (méthode du plus fort reste).
  const entiers = groupes.map((g) => Math.floor(g.part * 100));
  let reste = 100 - entiers.reduce((a, b) => a + b, 0);
  [...groupes.keys()].sort((a, b) => (groupes[b].part * 100) % 1 - (groupes[a].part * 100) % 1).forEach((i) => {
    if (reste-- > 0) entiers[i] += 1;
  });

  const barre = racine.querySelector("[data-ruban-barre]");
  barre.setAttribute("aria-hidden", "true");
  barre.replaceChildren(
    ...groupes.map((g, i) =>
      h(
        "div",
        { class: "ruban__segment", style: { flexGrow: g.part, flexBasis: 0, background: g.couleur, color: ENCRE_SOMBRE.has(g.id) ? "var(--encre)" : "#fff" } },
        h("span", {}, `${entiers[i]} €`),
      ),
    ),
  );
  racine.querySelector("[data-ruban-legende]").replaceChildren(
    ...groupes.map((g, i) => h("li", {}, h("i", { class: "pastille", style: { background: g.couleur } }), h("span", {}, h("strong", {}, `${entiers[i]} €`), ` ${g.legende}`))),
  );

  const verifier = () => {
    for (const seg of barre.children) seg.toggleAttribute("data-trop-etroit", seg.firstElementChild.scrollWidth + 16 > seg.clientWidth);
  };
  verifier();
  new ResizeObserver(verifier).observe(barre);
  requestAnimationFrame(() => racine.setAttribute("data-pret", ""));
}
