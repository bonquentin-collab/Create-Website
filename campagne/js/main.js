// Point d'entrée du site « L'héritage, ça se décide ».
import { mur, graphiqueFlux, graphiquePiketty, gaufre, graphiqueTaux } from "./ui/graphiques.js";
import { fichesNiches, mythes, citationsTextes, donneesTaux } from "./ui/pedagogie.js";
import { monterSimulateur } from "./ui/simulateur.js";
import { monterRecettes } from "./ui/recettes.js";
import { monterPartage } from "./ui/partage.js";

const $ = (id) => document.getElementById(id);

function graphiques() {
  mur($("mur"));
  graphiqueFlux($("fig-flux"));
  graphiquePiketty($("fig-piketty"));
  gaufre($("gaufre"), $("gaufre-legende"), $("source-patrimoine"));
  graphiqueTaux($("fig-taux"), donneesTaux());
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
graphiques();
navigation();

// Redessiner quand le thème ou la largeur changent (les couleurs des graphiques viennent des jetons CSS).
let attente;
const redessiner = () => { clearTimeout(attente); attente = setTimeout(graphiques, 150); };
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", redessiner);
new MutationObserver(redessiner).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
let largeur = innerWidth;
addEventListener("resize", () => { if (innerWidth !== largeur) { largeur = innerWidth; redessiner(); } });
