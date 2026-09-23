// Simulateur « Mon salaire » : ce que rapporterait à un actif une part des recettes de la réforme.

import { h, remplir, lireFormulaire, surChangement, formaterALaSortie, rejouer } from "./dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../engine/format.js";
import { scenarios, trouverScenario } from "../redistribution/scenarios.js";
import { macro } from "../params/macro.js";

const MOYENNE = "moyenne";

export function monter(racine, { reforme }) {
  const form = racine.querySelector("[data-formulaire]");
  const sortie = racine.querySelector("[data-resultat]");
  const champPart = racine.querySelector("[data-champ-part]");
  const sortiePart = racine.querySelector("[data-part-sortie]");
  const { recettes } = reforme;
  let dernierScenario = null;

  formaterALaSortie(form.elements.salaire, lireMontant, nombre);

  racine.querySelector("[data-scenarios]").replaceChildren(
    ...scenarios.map((sc, i) =>
      h(
        "label",
        { class: "option" },
        h("input", { type: "radio", name: "scenario", value: sc.id, checked: i === 1 }),
        h("span", { class: "option__titre" }, sc.label),
        h("span", { class: "option__resume" }, sc.resume, sc.extension ? h("span", { class: "option__variante" }, " (variante du simulateur)") : null),
      ),
    ),
  );

  racine.querySelector("[data-annees]").replaceChildren(
    h("option", { value: MOYENNE }, `Moyenne ${recettes.annees[0]}-${recettes.annees.at(-1)}`),
    ...recettes.annees.map((a) => h("option", { value: String(a) }, String(a))),
  );

  const recettesDe = (annee) => {
    const totalAnnee = (i) => recettes.series.reduce((t, s) => t + s.valeurs[i], 0);
    if (annee === MOYENNE) return recettes.annees.reduce((t, _, i) => t + totalAnnee(i), 0) / recettes.annees.length;
    return totalAnnee(recettes.annees.indexOf(Number(annee)));
  };

  const rendu = () => {
    const f = lireFormulaire(form);
    const scenario = trouverScenario(f.scenario);
    const part = scenario.extension ? Number(f.part) / 100 : 0;
    const recettesMd = recettesDe(f.annee);
    const profil = { salaireNetMensuel: lireMontant(f.salaire) };
    const { annuel, mensuel } = scenario.calculer({ recettes: recettesMd * 1e9, part, profil, macro });

    champPart.hidden = !scenario.extension;
    sortiePart.textContent = pourcent(Number(f.part) / 100);

    const periode = f.annee === MOYENNE ? "En moyenne chaque année" : `En ${f.annee}`;
    const aActifs = recettesMd * part;
    const enveloppe = h(
      "p",
      { class: "resultat__phrase" },
      `${periode}, l'impôt rapporterait ${milliards(recettesMd)}. `,
      scenario.extension
        ? `${milliards(aActifs)} iraient aux actifs, ${milliards(recettesMd - aActifs)} à ${reforme.affectation.priorites.join(", ").replace(/, ([^,]*)$/, " et $1")}.`
        : `Tout irait à ${reforme.affectation.priorites.join(", ").replace(/, ([^,]*)$/, " et $1")}.`,
    );
    const repartition = h(
      "div",
      { class: "repartition", "aria-hidden": "true" },
      part > 0 ? h("span", { style: { flexGrow: part, background: "var(--serie-actifs)" } }) : null,
      part < 1 ? h("span", { style: { flexGrow: 1 - part, background: "var(--serie-neutre)" } }) : null,
    );

    let tampon;
    let corps;
    if (!scenario.extension) {
      tampon = h("p", { class: "tampon tampon--neutre" }, "Pas sur la fiche de paie");
      corps = [h("p", {}, scenario.description), repartition, enveloppe, h("p", { class: "resultat__detail" }, reforme.affectation.texte)];
    } else {
      const salaire = profil.salaireNetMensuel;
      tampon = h("p", { class: "tampon tampon--actifs" }, "Gain pour vous");
      corps = [
        h("p", { class: "gain" }, ecartEuros(mensuel), h("span", { class: "gain__unite" }, " par mois")),
        h(
          "p",
          { class: "resultat__phrase" },
          `Soit ${euros(annuel)} par an` + (salaire > 0 ? `, ${pourcent(mensuel / salaire)} de votre salaire net.` : "."),
        ),
        repartition,
        enveloppe,
        h("p", { class: "resultat__detail" }, `${scenario.description} Variante du simulateur : l'étude ne propose pas de reverser les recettes aux actifs.`),
      ];
    }
    remplir(sortie, tampon, ...corps);
    if (scenario.id !== dernierScenario) rejouer(tampon);
    dernierScenario = scenario.id;
  };

  surChangement(form, rendu);
  rendu();
}
