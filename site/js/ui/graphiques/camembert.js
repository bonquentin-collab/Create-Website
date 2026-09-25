// Deux camemberts (anneaux) « aujourd'hui → avec vos choix », reliés par une flèche qui résume ce qui change.
// L'aire du second anneau suit le total des dépenses ; les parts modifiées se détachent et sont cerclées d'encre.
// La légende est une vraie table (poste, avant, après, écart) : elle sert aussi de données jumelles.

import { h, s } from "../dom.js";
import { milliards, milliardsRonds } from "../../engine/format.js";
import { totalPostes } from "../../engine/depenses.js";

const pct = new Intl.NumberFormat("fr-FR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ecartMd = (v) => (Math.abs(v) < 0.05 ? "=" : `${v > 0 ? "+" : "−"}${milliards(Math.abs(v))}`);
const DUREE = 450;
const calme = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {HTMLElement} racine
 * @param {{ postes:{id:string,label:string,detail:string,montant:number}[], titre:string, sousTitre:string, options?:Node, notes:Node[] }} config
 * @returns {{ maj:(lignes:{id:string,avant:number,apres:number,ecart:number}[], hors?:{label:string,montant:number}|null)=>void }}
 */
export function camembertAvantApres(racine, config) {
  let infos, avant, totalAvant;
  const lirePostes = (postes) => {
    infos = new Map(postes.map((p) => [p.id, p]));
    avant = postes.map((p) => ({ id: p.id, valeur: p.montant }));
    totalAvant = totalPostes(postes, "montant");
  };
  lirePostes(config.postes);

  const svgAvant = h("div", { class: "anneau" });
  const svgApres = h("div", { class: "anneau" });
  const fleche = h("div", { class: "fleche-choix", "aria-live": "polite" });
  const corpsTable = h("tbody");
  const hors = h("p", { class: "camembert__hors", hidden: true });

  racine.replaceChildren(
    h(
      "figure",
      { class: "graphique camembert" },
      h("figcaption", {}, h("h3", { class: "titre-graphique" }, config.titre), h("p", { class: "sous-titre" }, config.sousTitre)),
      config.options ?? null,
      h(
        "div",
        { class: "camembert__scene" },
        h("div", { class: "camembert__cote" }, h("p", { class: "camembert__quand" }, "Aujourd'hui"), svgAvant),
        fleche,
        h("div", { class: "camembert__cote camembert__cote--apres" }, h("p", { class: "camembert__quand" }, "Avec vos choix"), svgApres),
      ),
      hors,
      h(
        "table",
        { class: "legende-postes" },
        h(
          "thead",
          {},
          h("tr", {}, h("th", { scope: "col" }, "Poste"), h("th", { scope: "col" }, "Aujourd'hui"), h("th", { scope: "col" }, "Avec vos choix"), h("th", { scope: "col" }, "Écart")),
        ),
        corpsTable,
      ),
      ...(config.notes ?? []),
    ),
  );
  dessinerAnneau(svgAvant, avant, { total: totalAvant, echelle: 1, infos, modifies: new Set() });

  let affiche = avant; // valeurs actuellement dessinées dans l'anneau « après », pour l'animation
  let animation = 0;

  return {
    /** Change la définition des postes (et donc l'anneau « aujourd'hui ») ; appeler maj ensuite. */
    definirPostes(postes) {
      lirePostes(postes);
      cancelAnimationFrame(animation);
      affiche = avant;
      dessinerAnneau(svgAvant, avant, { total: totalAvant, echelle: 1, infos, modifies: new Set() });
    },
    maj(lignes, horsDepenses = null) {
      const cible = lignes.map((l) => ({ id: l.id, valeur: Math.max(0, l.apres) }));
      const totalApres = totalPostes(cible, "valeur");
      const modifies = new Set(lignes.filter((l) => Math.abs(l.ecart) >= 0.05).map((l) => l.id));
      const echelle = Math.sqrt(totalApres / totalAvant);

      cancelAnimationFrame(animation);
      const depart = affiche;
      const t0 = performance.now();
      const image = (t) => {
        const k = calme() ? 1 : Math.min(1, (t - t0) / DUREE);
        const e = 1 - (1 - k) ** 3;
        affiche = cible.map((c, i) => ({ id: c.id, valeur: depart[i].valeur + (c.valeur - depart[i].valeur) * e }));
        const total = totalPostes(affiche, "valeur");
        dessinerAnneau(svgApres, affiche, { total, echelle: Math.sqrt(total / totalAvant), infos, modifies });
        if (k < 1) animation = requestAnimationFrame(image);
      };
      animation = requestAnimationFrame(image);

      // Flèche : les plus gros mouvements, puis le total.
      const mouvements = lignes.filter((l) => modifies.has(l.id)).sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));
      const ecartTotal = totalApres - totalAvant;
      fleche.replaceChildren(
        h(
          "div",
          { class: "fleche-choix__corps" },
          mouvements.length
            ? [
                h(
                  "ul",
                  {},
                  mouvements.slice(0, 4).map((l) =>
                    h(
                      "li",
                      { class: l.ecart > 0 ? "hausse" : "baisse" },
                      h("span", { class: "pastille", style: `background:var(--poste-${l.id})` }),
                      h("span", {}, infos.get(l.id).label),
                      h("strong", {}, ecartMd(l.ecart)),
                    ),
                  ),
                ),
                h("p", { class: "fleche-choix__total" }, `Total : ${ecartMd(ecartTotal)}`),
              ]
            : h("p", { class: "fleche-choix__vide" }, "Faites vos choix : les parts bougeront ici."),
        ),
        h("span", { class: "fleche-choix__pointe", "aria-hidden": "true" }),
      );
      svgApres.dataset.echelle = echelle.toFixed(3);

      if (horsDepenses && horsDepenses.montant >= 0.05) {
        hors.hidden = false;
        hors.replaceChildren(h("span", { class: "pastille pastille--actifs" }), `${milliards(horsDepenses.montant)} ${horsDepenses.label}`);
      } else hors.hidden = true;

      corpsTable.replaceChildren(
        ...lignes.map((l) =>
          h(
            "tr",
            { class: modifies.has(l.id) ? "modifie" : false },
            h(
              "th",
              { scope: "row" },
              h("span", { class: "pastille", style: `background:var(--poste-${l.id})` }),
              h("span", {}, infos.get(l.id).label, h("span", { class: "legende-postes__detail" }, infos.get(l.id).detail)),
            ),
            h("td", {}, milliardsRonds(l.avant), h("span", { class: "part" }, pct.format(l.avant / totalAvant))),
            h("td", {}, milliardsRonds(l.apres), h("span", { class: "part" }, pct.format(l.apres / totalApres))),
            h("td", { class: `ecart ${l.ecart > 0.049 ? "ecart--hausse" : l.ecart < -0.049 ? "ecart--baisse" : ""}` }, ecartMd(l.ecart)),
          ),
        ),
        h(
          "tr",
          { class: "total" },
          h("th", { scope: "row" }, "Total"),
          h("td", {}, milliardsRonds(totalAvant)),
          h("td", {}, milliardsRonds(totalApres)),
          h("td", { class: "ecart" }, ecartMd(ecartTotal)),
        ),
      );
    },
  };
}

function dessinerAnneau(zone, valeurs, { total, echelle, infos, modifies }) {
  const T = 240;
  const c = T / 2;
  const rMax = 104;
  const r = rMax * Math.min(1.08, echelle); // aire proportionnelle au total, bornée pour rester dans le cadre
  const epaisseur = r * 0.42;
  const ri = r - epaisseur;
  const svg = s("svg", {
    viewBox: `0 0 ${T} ${T}`,
    role: "img",
    "aria-label": `Dépenses publiques : ${milliardsRonds(total)}. ${valeurs.map((v) => `${infos.get(v.id).label} ${pct.format(v.valeur / total)}`).join(", ")}.`,
  });
  let angle = -Math.PI / 2;
  for (const v of valeurs) {
    const a = (v.valeur / total) * Math.PI * 2;
    if (a <= 0) continue;
    const milieu = angle + a / 2;
    const decale = modifies.has(v.id) ? 7 : 0;
    const dx = Math.cos(milieu) * decale;
    const dy = Math.sin(milieu) * decale;
    const g = s("g", { transform: `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`, class: modifies.has(v.id) ? "part-modifiee" : null });
    g.append(
      s("path", { d: secteur(c, c, r, ri, angle, angle + a), style: `fill:var(--poste-${v.id})` }),
      s("title", {}, `${infos.get(v.id).label} : ${milliards(v.valeur)} (${pct.format(v.valeur / total)})`),
    );
    // Pourcentage écrit dans l'anneau quand la part est assez large.
    if (a > 0.32) {
      const rm = (r + ri) / 2;
      g.append(
        s(
          "text",
          { x: (c + Math.cos(milieu) * rm).toFixed(1), y: (c + Math.sin(milieu) * rm + 4).toFixed(1), "text-anchor": "middle", class: "anneau__part" },
          `${Math.round((v.valeur / total) * 100)} %`,
        ),
      );
    }
    svg.append(g);
    angle += a;
  }
  svg.append(
    s("text", { x: c, y: c - 2, "text-anchor": "middle", class: "anneau__total" }, milliardsRonds(total)),
    s("text", { x: c, y: c + 16, "text-anchor": "middle", class: "anneau__legende" }, "par an"),
  );
  zone.replaceChildren(svg);
}

function secteur(cx, cy, r, ri, a0, a1) {
  // Un tour complet ne se dessine pas avec un seul arc : on le coupe en deux.
  if (a1 - a0 >= Math.PI * 2 - 1e-6) return secteur(cx, cy, r, ri, a0, a0 + Math.PI) + secteur(cx, cy, r, ri, a0 + Math.PI, a1);
  const p = (rr, a) => `${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`;
  const grand = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r, a0)}A${r},${r} 0 ${grand} 1 ${p(r, a1)}L${p(ri, a1)}A${ri},${ri} 0 ${grand} 0 ${p(ri, a0)}Z`;
}
