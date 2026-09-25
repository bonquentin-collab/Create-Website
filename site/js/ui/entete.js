// En-tête commun à toutes les pages : marque, interrupteur « Héritage | Retraites », sous-navigation
// « Comprendre · Simuler · Méthode » de l'espace courant, bouton de thème.
// La page se décrit sur <body data-espace="heritage|retraites|accueil" data-page="comprendre|simuler|methode">.
// Redirige aussi les anciens liens (ancres des pages d'avant la séparation) vers leur nouvelle page.

import { h } from "./dom.js";
import { monter as monterTheme } from "./theme.js";

export const ESPACES = {
  heritage: {
    label: "Héritage",
    pages: { comprendre: "heritage.html", simuler: "heritage-simuler.html", methode: "heritage-methode.html" },
  },
  retraites: {
    label: "Retraites",
    pages: { comprendre: "retraites.html", simuler: "retraites-simuler.html", methode: "retraites-methode.html" },
  },
};
const PAGES = { comprendre: "Comprendre", simuler: "Simuler", methode: "Méthode" };

// Anciennes ancres → nouvelle page (l'ancre et les réglages partagés dans l'adresse sont conservés).
const REDIRECTIONS = {
  "accueil/": { reforme: "heritage.html", heritage: "heritage-simuler.html", salaire: "heritage-simuler.html", repartition: "heritage-simuler.html", depenses: "heritage-simuler.html", methode: "heritage-methode.html" },
  "retraites/comprendre": { simulateur: "retraites-simuler.html", liberation: "retraites-simuler.html", gel: "retraites-simuler.html", depenses: "retraites-simuler.html", methode: "retraites-methode.html" },
};

export function monter(racine) {
  const { espace = "accueil", page = "" } = document.body.dataset;
  if (rediriger(`${espace}/${page}`)) return;

  const bouton = h(
    "button",
    { class: "bouton-theme", type: "button", "aria-label": "Changer de thème" },
    svgTheme(),
  );
  const interrupteur = h(
    "nav",
    { class: "espaces", "aria-label": "Espaces du site" },
    Object.entries(ESPACES).map(([id, e]) =>
      h("a", { class: "espaces__lien", href: e.pages.comprendre, "aria-current": id === espace ? "true" : false }, e.label),
    ),
  );
  const sousNav =
    espace in ESPACES
      ? h(
          "nav",
          { class: "sous-nav", "aria-label": `Pages ${ESPACES[espace].label}` },
          h(
            "div",
            { class: "sous-nav__interieur" },
            Object.entries(PAGES).map(([id, label]) =>
              h("a", { class: `sous-nav__lien sous-nav__lien--${id}`, href: ESPACES[espace].pages[id], "aria-current": id === page ? "page" : false }, label),
            ),
          ),
        )
      : null;

  racine.replaceChildren(
    ...[h("div", { class: "entete__interieur" }, h("a", { class: "marque", href: "index.html" }, "La grande transmission"), interrupteur, bouton), sousNav].filter(Boolean),
  );
  monterTheme(bouton);
}

function rediriger(cle) {
  const table = REDIRECTIONS[cle];
  if (!table || !location.hash) return false;
  const brut = location.hash.slice(1);
  const cles = [brut, ...new URLSearchParams(brut).keys()];
  const cible = cles.map((c) => table[c]).find(Boolean);
  if (!cible) return false;
  location.replace(`${cible}${location.hash}`);
  return true;
}

function svgTheme() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>';
  return svg;
}
