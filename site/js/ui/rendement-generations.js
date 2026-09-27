// Section « Cotiser 100 000 €, recevoir combien ? » : pensions reçues par génération pour 100 000 € cotisés
// (valeur actualisée), selon le taux d'actualisation et la prise en compte des impôts affectés aux retraites.

import { h, remplir } from "./dom.js";
import { euros } from "../engine/format.js";
import { recuPour100000 } from "../engine/rendement.js";
import { rendement } from "../params/rendement.js";
import { tableDonnees } from "./graphiques/colonnes.js";

const pct = (v, d = 1) => `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v * 100)} %`;
const ECHELLE = 200000;
const milliers = (v) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v / 1000))} 000 €`;

export function monter(racine) {
  const curseur = h("input", { type: "range", id: "rd-taux", min: 0, max: 3, step: 0.25, value: 0 });
  const sortie = h("output", { for: "rd-taux" });
  const caseImpots = h("input", { type: "checkbox", id: "rd-impots" });
  const phrase = h("p", { class: "resultat__phrase", "aria-live": "polite" });
  const zoneGen = h("div");
  const zoneProfils = h("div");
  const tableGen = h("div");

  racine.replaceChildren(
    h("h2", { class: "titre-section", id: "titre-rendement" }, "Cotiser 100 000 €, recevoir combien ?"),
    h(
      "p",
      { class: "texte" },
      "Pour chaque génération, ce que rapportent en pensions 100 000 € de cotisations retraite, en valeur d'aujourd'hui. Au-dessus de la ligne, la génération reçoit plus qu'elle n'a versé ; en dessous, moins. Le résultat dépend beaucoup du taux auquel on compare : c'est pourquoi vous pouvez le régler.",
    ),
    h(
      "div",
      { class: "rendement__reglages" },
      h(
        "div",
        { class: "champ" },
        h("label", { for: "rd-taux" }, "Comparer à un placement rapportant ", sortie),
        curseur,
        h("p", { class: "aide" }, "0 % : convention du COR, les cotisations sont revalorisées comme les salaires. Au-delà, on les compare à un placement qui rapporterait davantage chaque année (par exemple un placement financier)."),
      ),
      h(
        "label",
        { class: "case-a-cocher", for: "rd-impots" },
        caseImpots,
        h(
          "span",
          {},
          "Compter aussi les impôts qui financent les retraites",
          h("span", { class: "aide" }, "CSG, taxes, subventions de l'État : 12 % des ressources des retraites en 1987, 21 % en 2025, payés surtout par les actifs. Les retraités n'y contribuent qu'à partir de 1994 (CSG), jusqu'à 5 % des ressources."),
        ),
      ),
    ),
    phrase,
    h(
      "figure",
      { class: "graphique" },
      h("figcaption", {}, h("h3", { class: "titre-graphique" }, "Pensions reçues pour 100 000 € cotisés, selon l'année de naissance"), h("p", { class: "sous-titre" }, "Salarié non-cadre du privé à carrière complète, valeur actualisée. La ligne marque l'équilibre.")),
      legende(),
      zoneGen,
      h("details", { class: "table-donnees" }, h("summary", {}, "Voir les données en tableau"), tableGen),
    ),
    h(
      "figure",
      { class: "graphique" },
      h("figcaption", {}, h("h3", { class: "titre-graphique" }, "Pour les personnes nées en 2000 : les petits salaires et les mères reçoivent davantage"), h("p", { class: "sous-titre" }, "Même calcul selon le profil de carrière. Le système redistribue vers les bas salaires et les femmes, qui vivent plus longtemps et bénéficient de droits liés aux enfants. « Smic, cotisations payées » : seules les cotisations restant après les allègements pour bas salaires, compensés par l'impôt, sont comptées.")),
      legende(),
      zoneProfils,
    ),
    h(
      "details",
      { class: "avance" },
      h("summary", {}, "Comment c'est calculé"),
      h(
        "p",
        { class: "note" },
        "Point de départ : le taux de rendement interne (TRI) calculé par le COR pour chaque génération, c'est-à-dire le rendement annuel, au-delà de la hausse des salaires, qui égalise cotisations versées et pensions reçues. Le site place les cotisations sur la durée moyenne de carrière et les pensions sur la durée moyenne de retraite de la génération (COR), avec des pensions qui suivent les prix et décrochent des salaires de 1 % par an, puis cale le calcul pour retrouver exactement le TRI du COR. À 0 %, le résultat découle directement du TRI ; au-delà, c'est une estimation du site. ",
        "Option impôts : chaque année de carrière, l'actif paie en plus la part des pensions financée hors cotisations (12 % en 1987, niveau supposé constant avant, 18 % en 2004, 21 % en 2025, puis constant), diminuée de la part payée par les retraités ; chaque année de retraite, le retraité rend cette dernière part (0 avant 1994, 5 % à partir de 2018). Les générations anciennes ont ainsi surtout payé des cotisations ; les plus jeunes paient aussi des impôts pour les pensions de leurs aînés.",
      ),
    ),
    h(
      "p",
      { class: "note" },
      "Sources : ",
      h("a", { href: rendement.url }, `${rendement.source}, figures 3.2, 3.6, 3.7 et 3.A`),
      " ; ",
      h("a", { href: rendement.impots.url }, rendement.impots.source),
      ". Cotisations comptées parts salariale et employeur.",
    ),
  );

  const rendu = () => {
    const r = Number(curseur.value) / 100;
    sortie.textContent = r === 0 ? "autant que les salaires" : `${pct(r, 2)} de plus que les salaires par an`;
    const options = { decrochage: rendement.decrochagePension, impots: caseImpots.checked ? rendement.impots : null };
    const gens = rendement.generations.map((g) => ({ label: `Né en ${g.annee}`, valeur: recuPour100000(g, r, options) }));
    const g2000 = rendement.generations.at(-1);
    const profils = rendement.profils2000.map((p) => ({ label: p.label, valeur: recuPour100000({ ...g2000, tri: p.tri }, r, options) }));
    barresEquilibre(zoneGen, gens);
    barresEquilibre(zoneProfils, profils);
    tableDonnees(tableGen, ["Génération", "Pensions reçues pour 100 000 € cotisés", "TRI du COR"], rendement.generations.map((g, i) => [String(g.annee), euros(gens[i].valeur), pct(g.tri, 2)]));
    const premier = gens[2];
    const dernier = gens.at(-1);
    const gagnants = gens.filter((g) => g.valeur >= 100000).length;
    remplir(
      phrase,
      `Né en 1950 : ${milliers(premier.valeur)} reçus pour 100 000 € cotisés. Né en 2000 : ${milliers(dernier.valeur)}. `,
      gagnants === gens.length ? "Toutes les générations reçoivent plus qu'elles n'ont cotisé, mais de moins en moins." : gagnants === 0 ? "Avec ce réglage, aucune génération ne récupère sa mise." : `Avec ce réglage, ${gagnants} générations sur ${gens.length} récupèrent plus que leur mise : les plus anciennes.`,
    );
  };
  curseur.addEventListener("input", rendu);
  caseImpots.addEventListener("change", rendu);
  rendu();
}

function legende() {
  return h(
    "div",
    { class: "legende" },
    h("span", {}, h("i", { class: "pastille", style: { background: "var(--serie-actifs)" } }), "Reçoit plus que ses cotisations"),
    h("span", {}, h("i", { class: "pastille", style: { background: "var(--serie-tampon)" } }), "Reçoit moins"),
    h("span", {}, h("i", { class: "trait-equilibre" }), "Équilibre : 100 000 €"),
  );
}

/** Barres horizontales avec une ligne d'équilibre à 100 000 €. */
function barresEquilibre(zone, lignes) {
  const pctL = (v) => `${Math.min(100, (v / ECHELLE) * 100)}%`;
  zone.replaceChildren(
    h(
      "ul",
      { class: "barres barres--equilibre" },
      lignes.map((l) =>
        h(
          "li",
          { class: "barre", "aria-label": `${l.label} : ${milliers(l.valeur)} reçus pour 100 000 € cotisés` },
          h("span", { class: "barre__label", "aria-hidden": "true" }, l.label),
          h(
            "span",
            { class: "barre__piste", "aria-hidden": "true" },
            h("span", { class: "barre__remplissage", style: { width: pctL(l.valeur), background: l.valeur >= 100000 ? "var(--serie-actifs)" : "var(--serie-tampon)" } }),
            h("span", { class: "ligne-equilibre", style: { left: pctL(100000) } }),
          ),
          h("span", { class: "barre__valeur", "aria-hidden": "true" }, milliers(l.valeur)),
        ),
      ),
    ),
  );
}
