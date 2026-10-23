// Section « À vous de décider » : scénarios, barème et niches, résultats mis à jour à chaque réglage.
import { evaluer } from "../moteur/modele.js";
import { scenarios } from "../moteur/scenarios.js";
import { graphiqueRecettes } from "./graphiques.js";
import { md, nombre, pct } from "./format.js";

const CHOIX = [
  { cle: "abattement", nom: "Abattement de 100 000 € par parent", options: [[0, "Supprimer"], [100_000, "Maintenir"], [200_000, "Passer à 200 000 €"]] },
  { cle: "tout", nom: "Tout imposer, sans aucune niche", aide: "Toutes les transmissions de la vie, à leur valeur réelle, plus-values comprises.", options: [[true, "Oui"], [false, "Non"]] },
  { cle: "dutreil", nom: "Pacte Dutreil (entreprises)", options: [["supprimer", "Supprimer"], ["resserrer", "Resserrer (50 %)"], ["maintenir", "Maintenir (75 %)"]] },
  { cle: "assuranceVie", nom: "Assurance-vie", options: [["bareme", "Au barème"], ["actuel", "Régime actuel"]] },
  { cle: "demembrement", nom: "Démembrement de propriété", options: [["supprimer", "Taxer l'usufruit"], ["maintenir", "Maintenir"]] },
  { cle: "plusValues", nom: "Plus-values effacées au décès", options: [["effacees", "Effacées"], ["top1", "Imposées pour le 1 % le plus riche"], ["tous", "Imposées pour tous"]] },
  { cle: "toutesTransmissions", nom: "Donations anciennes et biens non déclarés", aide: "Compter tout ce qui est reçu dans la vie, même au-delà de 15 ans.", options: [[true, "Les compter"], [false, "Non"]] },
];

export function monterSimulateur() {
  let courant = "igs";
  let reglages = scenarios.igs.reglages();
  const depart = document.getElementById("depart");
  const tranches = document.getElementById("tranches");
  const choix = document.getElementById("choix");

  depart.innerHTML = Object.values(scenarios).map((s) => `
    <button type="button" data-s="${s.id}" aria-pressed="false"><strong>${s.nom}</strong><span>${s.resume}</span></button>`).join("")
    + `<button type="button" data-s="perso" aria-pressed="false"><strong>Ma réforme</strong><span id="perso-aide">Partez du scénario choisi et réglez vous-même le barème et les niches.</span></button>`;
  const panneauReglages = document.getElementById("reglages");
  let base = "igs"; // dernier scénario choisi, point de départ de « Ma réforme »

  function dessinerTranches() {
    tranches.innerHTML = reglages.bareme.map((t, i) => {
      const dernier = t.jusqua === Infinity;
      return `<div class="tranche">
        <label class="sr" for="seuil-${i}">Seuil de la tranche ${i + 1}</label>
        ${dernier ? `<span>Au-delà</span>` : `<input type="number" id="seuil-${i}" min="0" step="1000" value="${t.jusqua}">`}
        <input type="range" id="taux-${i}" min="0" max="60" step="1" value="${Math.round(t.taux * 100)}" aria-label="Taux de la tranche ${i + 1}">
        <output for="taux-${i}">${Math.round(t.taux * 100)} %</output>
      </div>`;
    }).join("");
    reglages.bareme.forEach((t, i) => {
      const s = document.getElementById(`seuil-${i}`);
      if (s) s.addEventListener("change", () => { t.jusqua = Math.max(0, Number(s.value) || 0); personnaliser(); });
      const r = document.getElementById(`taux-${i}`);
      r.addEventListener("input", () => { t.taux = Number(r.value) / 100; r.nextElementSibling.textContent = `${r.value} %`; personnaliser(); });
    });
  }

  function valeur(cle) { return cle === "abattement" ? reglages.abattement : reglages.niches[cle]; }
  function dessinerChoix() {
    choix.innerHTML = CHOIX.map((c) => `<div class="choix" data-cle="${c.cle}">
      <span class="nom">${c.nom}</span>${c.aide ? `<span class="aide">${c.aide}</span>` : ""}
      <div class="segments">${c.options.map(([v, l], k) => `<button type="button" data-k="${k}" aria-pressed="${valeur(c.cle) === v}">${l}</button>`).join("")}</div>
    </div>`).join("");
    choix.querySelectorAll(".choix").forEach((bloc) => {
      const c = CHOIX.find((x) => x.cle === bloc.dataset.cle);
      bloc.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        const v = c.options[Number(b.dataset.k)][0];
        if (c.cle === "abattement") reglages.abattement = v; else reglages.niches[c.cle] = v;
        dessinerChoix(); personnaliser();
      }));
      const inactif = reglages.niches.tout && !["tout", "abattement"].includes(c.cle);
      bloc.style.opacity = inactif ? 0.45 : 1;
    });
  }

  function personnaliser() {
    courant = "perso";
    calculer();
  }

  function choisir(id) {
    courant = id;
    base = id;
    reglages = scenarios[id].reglages();
    dessinerTranches(); dessinerChoix(); calculer();
  }

  function calculer() {
    depart.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.s === courant);
    });
    const r = evaluer(reglages);
    const sup = r.supplement[0];
    document.getElementById("r-titre").textContent = sup < 0 ? "Votre réforme coûterait" : "Votre réforme rapporterait";
    document.getElementById("r-gain").innerHTML = `${md(sup)}<small>de recettes ${sup < 0 ? "en moins" : "en plus"} en 2025, puis ${md(r.supplement[15])} en 2040</small>`;
    document.getElementById("r-cumul").textContent = md(r.cumul, 0);
    document.getElementById("r-taux").textContent = pct(r.tauxMoyen, 1);
    document.getElementById("bm-gain").textContent = md(sup);
    graphiqueRecettes(document.getElementById("fig-recettes"), r);
    // Foule de 100 héritiers, du moins doté (à gauche) au mieux doté (à droite).
    const n = { plus: Math.round(100 * r.parts.plus), moins: Math.round(100 * r.parts.moins) };
    n.egal = 100 - n.plus - n.moins;
    const classes = [];
    r.parTranche.forEach((t) => { for (let k = 0; k < Math.round(t.p * 100); k++) classes.push(t.sens); });
    const foule = document.getElementById("foule");
    foule.innerHTML = classes.slice(0, 100).map((c) => `<span class="${c}"></span>`).join("");
    foule.setAttribute("aria-label", `Sur 100 héritiers : ${n.plus} paieraient plus, ${n.moins} moins, ${n.egal} autant.`);
    for (const k of ["plus", "moins", "egal"]) document.getElementById(`n-${k}`).textContent = nombre(n[k]);
    document.getElementById("perso-aide").textContent = courant === "perso"
      ? `Vos réglages, à partir du scénario « ${scenarios[base].nom} ». Modifiez-les ci-dessous.`
      : "Partez du scénario choisi et réglez vous-même le barème et les niches.";
    const nom = courant === "perso" ? "Ma réforme de l'héritage" : scenarios[courant].nom;
    document.dispatchEvent(new CustomEvent("reforme", { detail: { nom, r, reglages } }));
  }

  // « Ma réforme » : ouvre tout de suite les réglages, à partir du scénario choisi, et y amène la page.
  function maReforme() {
    courant = "perso";
    panneauReglages.open = true;
    calculer();
    const doux = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    panneauReglages.scrollIntoView({ behavior: doux, block: "start" });
    setTimeout(() => document.querySelector("#tranches input[type=range]")?.focus({ preventScroll: true }), 400);
  }
  depart.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.s === "perso") maReforme(); else choisir(b.dataset.s); }));
  document.querySelectorAll("[data-ma-reforme]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); maReforme(); }));
  choisir("igs");

  // Barre de résultat fixe sur mobile, tant que le panneau de résultats n'est pas visible.
  const barre = document.getElementById("barre-mobile");
  const panneau = document.querySelector(".resultats");
  const section = document.getElementById("decider");
  let dansSection = false, panneauVisible = false;
  const maj = () => { barre.hidden = !(dansSection && !panneauVisible); };
  new IntersectionObserver(([e]) => { dansSection = e.isIntersecting; maj(); }, { threshold: 0 }).observe(section);
  new IntersectionObserver(([e]) => { panneauVisible = e.isIntersecting; maj(); }, { threshold: 0.2 }).observe(panneau);
}
