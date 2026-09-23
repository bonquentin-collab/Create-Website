// Ouverture : répartition du patrimoine sur 100 €.

import { h } from "./dom.js";
import { milliardsRonds } from "../engine/format.js";

export function monter(racine, { reforme }) {
  const { partPatrimoineBottom50: bas, partPatrimoineTop10: haut } = reforme.contexte;
  const groupes = [
    { part: bas, couleur: "var(--serie-actifs)", texte: "pour la moitié la moins dotée des ménages" },
    { part: 1 - bas - haut, couleur: "var(--serie-neutre)", encre: "var(--encre)", texte: "pour les 40 % suivants" },
    { part: haut, couleur: "var(--serie-tampon)", texte: "pour les 10 % les mieux dotés" },
  ];

  const barre = racine.querySelector("[data-ruban-barre]");
  barre.setAttribute("aria-hidden", "true");
  barre.replaceChildren(
    ...groupes.map((g) =>
      h("div", { class: "ruban__segment", style: { flexGrow: g.part, flexBasis: 0, background: g.couleur, color: g.encre ?? "#fff" } }, h("span", {}, `${Math.round(g.part * 100)} €`)),
    ),
  );
  racine.querySelector("[data-ruban-legende]").replaceChildren(
    ...groupes.map((g) =>
      h("li", {}, h("i", { class: "pastille", style: { background: g.couleur } }), h("span", {}, h("strong", {}, `${Math.round(g.part * 100)} €`), ` ${g.texte}`)),
    ),
  );
  racine.querySelector("[data-ruban-bas]").textContent = milliardsRonds(
    Math.round((reforme.fluxSuccessoral.totalAnnonce * bas) / 5) * 5,
  );

  // Masque un chiffre qui ne tient pas dans son segment (la légende le porte déjà).
  const verifier = () => {
    for (const seg of barre.children) {
      const span = seg.firstElementChild;
      seg.toggleAttribute("data-trop-etroit", span.scrollWidth + 16 > seg.clientWidth);
    }
  };
  verifier();
  new ResizeObserver(verifier).observe(barre);
  requestAnimationFrame(() => racine.setAttribute("data-pret", ""));
}
