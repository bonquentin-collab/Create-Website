// Méthode, sources et limites de la page retraites, générées à partir des paramètres sourcés.

import { h } from "./dom.js";
import { retraites } from "../params/retraites.js";
import { tva, csg } from "../params/prelevements.js";

const lien = (texte, url) => (url ? h("a", { href: url }, texte) : texte);

export function monter(racine) {
  racine.replaceChildren(
    h(
      "div",
      {},
      h("h3", {}, "D'où viennent les chiffres"),
      h(
        "ul",
        { class: "sources" },
        h("li", {}, "Financement des retraites 2025 : ", lien(retraites.depenses.source, retraites.depenses.url), "."),
        h("li", {}, "Rendement de la TVA : ", lien(tva.pointNet.source, tva.pointNet.url), "."),
        h("li", {}, "Recettes de CSG 2025 : ", lien("Commission des comptes de la Sécurité sociale, mai 2026", csg.activite.url), "."),
        h("li", {}, "Taux et seuils de CSG sur les pensions : ", lien(csg.retraites.source, csg.retraites.url), "."),
        h("li", {}, "Pensions : DREES, « Les retraités et les retraites », édition 2025 (données fin 2023)."),
      ),
    ),
    h(
      "div",
      {},
      h("h3", {}, "Ce que calcule le simulateur"),
      h(
        "p",
        {},
        "Des effets « statiques » : on applique un taux à une assiette, sans tenir compte des réactions (prix, salaires, emploi, départs à la retraite). Les baisses de pension sont uniformes. Les hausses de cotisation portent sur les 1 108 Md€ de salaires bruts versés en 2024 (Insee) et pèsent, à terme, sur les salariés.",
      ),
      h(
        "p",
        {},
        "La CSG des retraités, le gel des pensions et l'abattement de 10 % sont calés sur la microsimulation de l'IPP (note n° 129, 2026) : voir plus bas. La part « cotisation normale » de l'État employeur est une estimation du simulateur (43 %, ratio du CAE pour 2023 appliqué à 2025).",
      ),
    ),
    h(
      "div",
      {},
      h("h3", {}, "Limites et débats"),
      h(
        "p",
        {},
        "Classer la contribution de l'État pour ses fonctionnaires en « cotisation » ou en « subvention » est un choix : le COR, la Cour des comptes et le CAE ne concluent pas à un déficit caché, Fipeco et la Fondapol si. Le simulateur laisse ce choix à l'utilisateur.",
      ),
      h("p", {}, "Certains chiffres de la DREES et de la Cour des comptes proviennent de sources qui les citent, leurs sites n'étant pas accessibles lors de la collecte ; ils seront vérifiés à la source."),
    ),
  );
}
