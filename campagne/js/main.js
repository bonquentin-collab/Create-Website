// Point d'entrée du site « L'héritage, ça se décide ».
import { mur, graphiqueFlux, graphiquePiketty, gaufre, graphiqueTaux } from "./ui/graphiques.js";
import { fichesNiches, mythes, citationsTextes, donneesTaux } from "./ui/pedagogie.js";
import { monterSimulateur } from "./ui/simulateur.js";
import { monterRecettes } from "./ui/recettes.js";
import { monterPartage } from "./ui/partage.js";

const $ = (id) => document.getElementById(id);

// Graphiques de chaque bulle, dessinés quand son panneau est visible (ils prennent la largeur réelle).
const DESSINS = {
  "p-transmission": () => graphiqueFlux($("fig-flux")),
  "p-retour": () => graphiquePiketty($("fig-piketty")),
  "p-concentration": () => gaufre($("gaufre"), $("gaufre-legende"), $("source-patrimoine")),
  "p-impot": () => graphiqueTaux($("fig-taux"), donneesTaux()),
};

function graphiques() {
  mur($("mur"));
  document.querySelectorAll(".panneau:not([hidden])").forEach((p) => DESSINS[p.id]?.());
}

// Bulles : un clic ouvre son panneau et referme l'autre ; un second clic sur la même bulle la referme.
function bulles() {
  const boutons = [...document.querySelectorAll(".bulle-fait")];
  const ouvrir = (b) => {
    const deja = b.getAttribute("aria-selected") === "true";
    boutons.forEach((x) => { x.setAttribute("aria-selected", "false"); $(x.dataset.panneau).hidden = true; });
    if (deja) return;
    b.setAttribute("aria-selected", "true");
    const p = $(b.dataset.panneau);
    p.hidden = false;
    DESSINS[p.id]?.();
    if (p.getBoundingClientRect().top > innerHeight * 0.8) p.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  boutons.forEach((b, i) => {
    b.addEventListener("click", () => ouvrir(b));
    b.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); boutons[(i + k + boutons.length) % boutons.length].focus(); }
    });
  });
}

function navigation() {
  const liens = [...document.querySelectorAll(".nav a")];
  const sections = liens.map((a) => document.querySelector(a.getAttribute("href")));
  const barre = $("progression");
  const maj = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    barre.style.width = `${h > 0 ? (100 * scrollY) / h : 0}%`;
    let actif = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) actif = i; });
    liens.forEach((a, i) => a.setAttribute("aria-current", i === actif));
  };
  addEventListener("scroll", maj, { passive: true });
  maj();
}

fichesNiches($("niches"));
mythes($("mythes"));
citationsTextes();
monterRecettes();
monterPartage();
monterSimulateur();
bulles();
graphiques();
navigation();

// Redessiner quand le thème ou la largeur changent (les couleurs des graphiques viennent des jetons CSS).
let attente;
const redessiner = () => { clearTimeout(attente); attente = setTimeout(graphiques, 150); };
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", redessiner);
new MutationObserver(redessiner).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
let largeur = innerWidth;
addEventListener("resize", () => { if (innerWidth !== largeur) { largeur = innerWidth; redessiner(); } });
