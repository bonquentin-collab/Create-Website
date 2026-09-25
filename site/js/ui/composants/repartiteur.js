// Répartiteur réutilisable : répartir une enveloppe (Md€/an) entre le salaire net des actifs et des services
// publics comparés à leur budget actuel. Construit tout son HTML dans `racine`.
// Utilisé pour les recettes de l'IGS (page héritage) et pour l'argent public libéré (page retraites).
//
//   const outil = creerRepartiteur(racine, {
//     prefixe: "r",                 // préfixe des id HTML, unique par page
//     cleLien: "repartition",       // clé du lien de partage dans l'adresse (#repartition=…)
//     enveloppes: [{ valeur, libelle, montant, periode }] ou null,
//     etiquetteEnveloppe: "Recettes de l'année",
//     phrase: (enveloppe, choix) => "En 2030, l'impôt rapporterait 22,5 Md€.",
//     noteActifs: "Variante du simulateur : …",
//   });
//   outil.definirEnveloppe(12.3);   // quand l'enveloppe vient d'un autre simulateur

import { h, remplir, surChangement, formaterALaSortie, rejouer } from "../dom.js";
import { euros, ecartEuros, milliards, pourcent, lireMontant, nombre } from "../../engine/format.js";
import { fixerMontant, depuisParts, reechelonner, totalReparti, effetService, encoder, decoder } from "../../engine/repartition.js";
import { destinations } from "../../params/budgets.js";
import { repartitions } from "../../redistribution/repartitions.js";
import { scenarios, trouverScenario } from "../../redistribution/scenarios.js";
import { macro } from "../../params/macro.js";
import { depenses, construirePostes } from "../../params/depenses.js";
import { appliquerChoix, ajoutsParPoste } from "../../engine/depenses.js";
import { camembertAvantApres } from "../graphiques/camembert.js";

const PAS = 0.1;
const arrondiPas = (v) => Math.round(v / PAS) * PAS;
// Façons de verser la part des actifs (le scénario « etude » n'en est pas une).
const versements = scenarios.filter((s) => s.extension);

export function creerRepartiteur(racine, options) {
  const {
    prefixe = "r",
    cleLien = "repartition",
    enveloppes = null,
    etiquetteEnveloppe = "Enveloppe",
    phrase = (enveloppe) => `Enveloppe à répartir : ${milliards(enveloppe)} par an.`,
    noteActifs = "",
    modeles = repartitions,
    salaireInitial = "2 100",
    surChangement: signaler = null, // appelé avec la répartition { id: Md€ } à chaque changement
    titreDepenses = "Où va l'argent public, avant et après vos choix",
  } = options;
  const id = (suffixe) => `${prefixe}-${suffixe}`;

  // ----- Structure -----
  const selectEnveloppe = enveloppes ? h("select", { id: id("enveloppe") }) : null;
  const zoneModeles = h("div", { class: "modeles", role: "group", "aria-labelledby": id("modeles"), "data-modeles": true });
  const formPostes = h("form", { class: "postes", novalidate: true });
  const bilan = h("div", { "aria-live": "polite", "data-bilan": true });
  const champSalaire = h("input", { id: id("salaire"), name: "salaire", inputmode: "decimal", autocomplete: "off", value: salaireInitial });
  const modesVersement = h("div", { class: "choix choix--colonne" });
  const sortieGain = h("div", { "aria-live": "polite", "data-gain-salaire": true });
  const blocSalaire = h(
    "div",
    { class: "votre-salaire", hidden: true },
    h("div", { class: "champ" }, h("label", { for: id("salaire") }, "Votre salaire net mensuel"), h("div", { class: "case" }, champSalaire, h("span", { "aria-hidden": "true" }, "€"))),
    h("fieldset", { class: "champ" }, h("legend", {}, "Comment verser la part des actifs ?"), modesVersement),
    sortieGain,
  );
  const boutonPartage = h("button", { type: "button", class: "bouton", "data-partager": true }, "Copier le lien de ma répartition");
  const messagePartage = h("p", { class: "aide", "aria-live": "polite" });
  const zoneDepenses = h("div", { class: "depenses-choix" });

  racine.replaceChildren(
    h(
      "div",
      { class: "repartition__barre-outils" },
      selectEnveloppe ? h("div", { class: "champ" }, h("label", { for: id("enveloppe") }, etiquetteEnveloppe), selectEnveloppe) : null,
      h("div", { class: "champ" }, h("p", { class: "etiquette-champ", id: id("modeles") }, "Partir d'une répartition toute faite"), zoneModeles),
    ),
    h(
      "div",
      { class: "simulateur simulateur--repartition" },
      formPostes,
      h("div", { class: "resultat" }, bilan, h("div", { class: "partage" }, boutonPartage, messagePartage)),
    ),
    zoneDepenses,
  );

  // ----- État -----
  const lu = lireLien(cleLien);
  let choix = enveloppes ? (enveloppes.find((e) => e.valeur === lu.choix) ?? enveloppes[0]).valeur : null;
  let enveloppe = enveloppes ? arrondiPas(enveloppes.find((e) => e.valeur === choix).montant) : 0;
  let repartition = lu.repartition
    ? depuisParts(lu.repartition, Math.min(enveloppe, totalReparti(lu.repartition)))
    : depuisParts(modeles[0].parts, enveloppe);
  let mode = versements[0].id;
  let baissePensions = 0; // fournie par la page retraites quand les pensions baissent
  let postesDepenses = depenses.postes;
  const casePensions = h("input", { type: "checkbox", id: id("pensions-services"), checked: true });
  const camembert = camembertAvantApres(zoneDepenses, {
    postes: postesDepenses,
    options: h(
      "div",
      { class: "camembert__options" },
      h(
        "label",
        { class: "case-a-cocher", for: id("pensions-services") },
        casePensions,
        h(
          "span",
          {},
          "Compter les pensions des anciens enseignants et des militaires dans leur administration",
          h("span", { class: "aide" }, "Cochée : 26 Md€ vont à l'éducation et 11 Md€ à la défense. Décochée : toutes les pensions restent dans « Retraites », comme dans la comptabilité publique."),
        ),
      ),
    ),
    titre: titreDepenses,
    sousTitre: `Dépenses de l'État, des collectivités et de la Sécurité sociale en ${depenses.annee}, par grande fonction.`,
    notes: [
      h(
        "p",
        { class: "note" },
        "Sources : ",
        h("a", { href: depenses.url }, depenses.source),
        " ; ",
        h("a", { href: depenses.jaune.url }, depenses.jaune.source),
        ". Retraites : 433 Md€ de pensions (retraite et réversion) au total, dont 26 Md€ rattachés à l'éducation et 11 Md€ à la défense quand la case est cochée ; le COR compte 422 Md€ sur un périmètre un peu différent. Les anciens agents de l'Éducation nationale représentant environ la moitié des pensionnés civils de l'État, la moitié des pensions civiles (26 Md€) est rattachée à l'éducation : c'est une estimation. L'école, la recherche et l'université abondent l'éducation ; l'hôpital, la santé ; l'écologie et le logement, « tout le reste ».",
      ),
    ],
  });
  casePensions.addEventListener("change", () => {
    postesDepenses = construirePostes({ pensionsDansServices: casePensions.checked });
    camembert.definirPostes(postesDepenses);
    rendu();
  });
  let partsEnAttente = lu.repartition; // pour une enveloppe fournie plus tard par definirEnveloppe

  if (selectEnveloppe) {
    selectEnveloppe.replaceChildren(...enveloppes.map((e) => h("option", { value: e.valeur }, e.libelle)));
    selectEnveloppe.value = choix;
  }
  zoneModeles.replaceChildren(
    ...modeles.map((m) => h("button", { type: "button", class: "puce", "data-modele": m.id, title: m.note ?? false }, m.label)),
  );
  modesVersement.replaceChildren(
    ...versements.map((sc) => h("label", {}, h("input", { type: "radio", name: id("mode"), value: sc.id, checked: sc.id === mode }), sc.label)),
  );
  formaterALaSortie(champSalaire, lireMontant, nombre);

  // Une ligne par destination : curseur, montant, effet sur le budget.
  const lignes = new Map();
  formPostes.replaceChildren(
    ...destinations.map((d) => {
      const idLigne = id(d.id);
      const curseur = h("input", { type: "range", id: idLigne, name: d.id, min: 0, step: PAS, "aria-describedby": `${idLigne}-effet` });
      const sortie = h("output", { for: idLigne, class: "poste__montant" });
      const effet = h("p", { class: "poste__effet", id: `${idLigne}-effet` });
      const jauge =
        d.type === "service"
          ? h("div", { class: "jauge", "aria-hidden": "true" }, h("span", { class: "jauge__actuel" }), h("span", { class: "jauge__ajout" }))
          : null;
      const el = h(
        "div",
        { class: `poste${d.type === "actifs" ? " poste--actifs" : ""}` },
        h("div", { class: "poste__tete" }, h("label", { for: idLigne }, d.label), sortie),
        h("p", { class: "poste__resume" }, d.resume),
        curseur,
        jauge,
        effet,
      );
      lignes.set(d.id, { d, curseur, sortie, effet, jauge, el });
      return el;
    }),
  );
  lignes.get("actifs")?.el.append(blocSalaire);
  const resteFlottant = h("p", { class: "reste-flottant", "aria-hidden": "true" });
  formPostes.append(resteFlottant);

  // Échelle commune des jauges : le plus gros budget plus l'enveloppe entière.
  const echelle = () => Math.max(...destinations.filter((d) => d.type === "service").map((d) => d.budget)) + enveloppe;
  const parActif = (md) => trouverScenario("dividende").calculer({ recettes: md * 1e9, macro }).mensuel;

  const rendu = ({ frapper = false } = {}) => {
    const total = totalReparti(repartition);
    const reste = Math.max(0, enveloppe - total);
    const max = echelle();

    for (const { d, curseur, sortie, effet, jauge } of lignes.values()) {
      const montant = repartition[d.id] ?? 0;
      curseur.max = enveloppe.toFixed(1);
      curseur.value = montant;
      curseur.disabled = enveloppe <= 0;
      sortie.textContent = milliards(montant);
      if (d.type === "service") {
        jauge.firstChild.style.width = `${(d.budget / max) * 100}%`;
        jauge.lastChild.style.width = `${(montant / max) * 100}%`;
        effet.textContent =
          montant > 0
            ? `Budget actuel ${milliards(d.budget)}, soit +${pourcent(effetService(d.budget, montant).hausse)} avec votre choix.`
            : `Budget actuel ${milliards(d.budget)}.`;
      } else {
        effet.textContent = montant > 0 ? `Soit ${ecartEuros(parActif(montant))} par mois pour chaque actif, en moyenne.` : "Rien pour l'instant.";
      }
    }

    const complet = enveloppe > 0 && reste < PAS - 1e-9;
    const tampon = h(
      "p",
      { class: `tampon ${complet ? "tampon--actifs" : "tampon--neutre"}` },
      enveloppe <= 0 ? "Rien à répartir" : complet ? "Tout est réparti" : `Reste ${milliards(reste)}`,
    );
    const choisis = destinations.filter((d) => (repartition[d.id] ?? 0) > 0);
    remplir(
      bilan,
      tampon,
      h("p", { class: "resultat__phrase" }, `${phrase(enveloppe, choix)} Vous en avez réparti ${milliards(total)}.`),
      choisis.length
        ? h(
            "ul",
            { class: "bilan" },
            choisis.map((d) => {
              const m = repartition[d.id];
              const detail =
                d.type === "service" ? `+${pourcent(effetService(d.budget, m).hausse)} de budget` : `${ecartEuros(parActif(m))} par mois et par actif`;
              return h("li", {}, h("span", {}, d.label), h("span", { class: "bilan__valeur" }, `${milliards(m)}, ${detail}`));
            }),
          )
        : h("p", { class: "resultat__detail" }, enveloppe > 0 ? "Déplacez un curseur ou choisissez une répartition toute faite." : "Aucune somme n'est libérée avec ces réglages."),
      !complet && enveloppe > 0 ? h("p", { class: "resultat__detail" }, "La somme non répartie n'est affectée à rien dans ce simulateur.") : null,
    );
    if (frapper) rejouer(tampon);
    resteFlottant.textContent = complet ? `Tout est réparti : ${milliards(enveloppe)}` : `Reste ${milliards(reste)} à répartir sur ${milliards(enveloppe)}`;
    resteFlottant.classList.toggle("reste-flottant--complet", complet);

    const partActifs = repartition.actifs ?? 0;
    blocSalaire.hidden = partActifs <= 0;
    if (partActifs > 0) {
      const scenario = trouverScenario(mode);
      const salaire = lireMontant(champSalaire.value);
      const { mensuel, annuel } = scenario.calculer({ recettes: partActifs * 1e9, profil: { salaireNetMensuel: salaire }, macro });
      remplir(
        sortieGain,
        h("p", { class: "gain" }, ecartEuros(mensuel), h("span", { class: "gain__unite" }, " par mois pour vous")),
        h("p", { class: "resultat__phrase" }, `Soit ${euros(annuel)} par an` + (salaire > 0 ? `, ${pourcent(mensuel / salaire)} de votre salaire net.` : ".")),
        h("p", { class: "resultat__detail" }, `${scenario.description} ${noteActifs}`.trim()),
      );
    }
    camembert.maj(appliquerChoix(postesDepenses, ajoutsParPoste(repartition, destinations), baissePensions), {
      label: "vont au salaire net des actifs : ce n'est pas une dépense publique, elle n'est pas dans l'anneau.",
      montant: repartition.actifs ?? 0,
    });
    signaler?.({ ...repartition });
  };

  const etatComplet = () => enveloppe - totalReparti(repartition) < PAS - 1e-9;

  formPostes.addEventListener("input", (e) => {
    const idPoste = e.target.name;
    if (!lignes.has(idPoste)) return;
    const avant = etatComplet();
    repartition = fixerMontant(repartition, idPoste, Number(e.target.value), enveloppe);
    rendu({ frapper: avant !== etatComplet() });
  });
  formPostes.addEventListener("submit", (e) => e.preventDefault());

  zoneModeles.addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-modele]");
    if (!bouton) return;
    repartition = depuisParts(modeles.find((m) => m.id === bouton.dataset.modele).parts, enveloppe);
    rendu({ frapper: true });
  });

  selectEnveloppe?.addEventListener("change", () => {
    choix = selectEnveloppe.value;
    changerEnveloppe(enveloppes.find((e) => e.valeur === choix).montant);
  });

  surChangement(blocSalaire, () => {
    mode = blocSalaire.querySelector(`input[name="${id("mode")}"]:checked`)?.value ?? mode;
    rendu();
  });

  boutonPartage.addEventListener("click", async () => {
    const url = new URL(location.href);
    const params = new URLSearchParams(location.hash.slice(1));
    params.set(cleLien, encoder(repartition));
    if (choix != null) params.set(`${cleLien}-choix`, choix);
    url.hash = params.toString();
    try {
      await navigator.clipboard.writeText(url.href);
      messagePartage.textContent = "Lien copié. Toute personne qui l'ouvre verra votre répartition.";
    } catch {
      messagePartage.textContent = url.href;
    }
    history.replaceState(null, "", url.hash);
  });

  function changerEnveloppe(montant) {
    const nouvelle = arrondiPas(Math.max(0, montant));
    if (partsEnAttente) {
      repartition = depuisParts(partsEnAttente, Math.min(nouvelle, totalReparti(partsEnAttente)));
      partsEnAttente = null;
    } else if (enveloppe > 0) {
      repartition = reechelonner(repartition, enveloppe, nouvelle);
    } else {
      repartition = depuisParts(modeles[0].parts, nouvelle);
    }
    enveloppe = nouvelle;
    rendu();
  }

  rendu();
  if (enveloppes) partsEnAttente = null;
  return {
    definirEnveloppe: changerEnveloppe,
    lireRepartition: () => ({ ...repartition }),
    /** Baisse uniforme des pensions (0,1 = −10 %), à appeler avant definirEnveloppe. */
    definirBaissePensions(taux) {
      baissePensions = taux;
    },
  };
}

/** Lit une répartition partagée : #repartition=ecole-5_actifs-10&repartition-choix=2030 */
function lireLien(cle) {
  const params = new URLSearchParams(location.hash.slice(1));
  const texte = params.get(cle);
  const repartition = texte ? decoder(texte, destinations.map((d) => d.id)) : null;
  // Compatibilité avec les premiers liens partagés (#repartition=…&annee=2030).
  const choix = params.get(`${cle}-choix`) ?? (cle === "repartition" ? params.get("annee") : null);
  return { repartition: repartition && totalReparti(repartition) > 0 ? repartition : null, choix };
}
