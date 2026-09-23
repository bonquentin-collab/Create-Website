// Petits utilitaires DOM partagés par les modules d'interface.

/** Crée un élément : h("p", { class: "note" }, "texte", autreNoeud) */
export function h(tag, attrs = {}, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const e of enfants.flat()) if (e != null && e !== false) el.append(e);
  return el;
}

const SVG = "http://www.w3.org/2000/svg";
export function s(tag, attrs = {}, ...enfants) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const e of enfants.flat()) if (e != null) el.append(e);
  return el;
}

/** Lit les champs nommés d'un formulaire sous forme d'objet. */
export function lireFormulaire(form) {
  return Object.fromEntries(new FormData(form).entries());
}

/** Appelle `rendu` à chaque saisie, avec un léger délai pour les champs texte. */
export function surChangement(form, rendu) {
  let minuterie;
  form.addEventListener("input", (e) => {
    clearTimeout(minuterie);
    const delai = e.target.type === "text" || e.target.inputMode ? 120 : 0;
    minuterie = setTimeout(rendu, delai);
  });
  form.addEventListener("change", rendu);
  form.addEventListener("submit", (e) => e.preventDefault());
}

/** Reformate un champ monétaire à la sortie : « 300000 » devient « 300 000 ». */
export function formaterALaSortie(input, lire, formater) {
  input.addEventListener("blur", () => {
    const v = lire(input.value);
    input.value = v ? formater(v) : "0";
  });
}

/** Rejoue une animation CSS déclenchée par un attribut. */
export function rejouer(el, attr = "data-frappe") {
  el.removeAttribute(attr);
  void el.offsetWidth;
  el.setAttribute(attr, "");
}

/** Remplace le contenu d'un élément en ignorant les enfants absents (null, false). */
export function remplir(el, ...enfants) {
  el.replaceChildren(...enfants.flat().filter((e) => e != null && e !== false));
}
