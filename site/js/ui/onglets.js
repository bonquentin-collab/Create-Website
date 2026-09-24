// Onglets accessibles (motif ARIA « tabs ») : clic, flèches gauche/droite, Début/Fin.
// Tout bouton portant data-ouvrir-onglet="<id de l'onglet>" ouvre aussi l'onglet visé.
// Un lien de répartition partagé (#repartition=…) ouvre directement l'onglet « Salaire ou services publics ».

export function monter(racine) {
  const onglets = [...racine.querySelectorAll('[role="tab"]')];

  const activer = (onglet, { focus = false } = {}) => {
    for (const o of onglets) {
      const actif = o === onglet;
      o.setAttribute("aria-selected", String(actif));
      o.tabIndex = actif ? 0 : -1;
      document.getElementById(o.getAttribute("aria-controls")).hidden = !actif;
    }
    if (focus) onglet.focus();
  };

  for (const onglet of onglets) {
    onglet.addEventListener("click", () => activer(onglet));
    onglet.addEventListener("keydown", (e) => {
      const i = onglets.indexOf(onglet);
      const cible = {
        ArrowRight: onglets[(i + 1) % onglets.length],
        ArrowLeft: onglets[(i - 1 + onglets.length) % onglets.length],
        Home: onglets[0],
        End: onglets.at(-1),
      }[e.key];
      if (!cible) return;
      e.preventDefault();
      activer(cible, { focus: true });
    });
  }

  document.addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-ouvrir-onglet]");
    const onglet = bouton && onglets.find((o) => o.id === bouton.dataset.ouvrirOnglet);
    if (!onglet) return;
    activer(onglet, { focus: true });
    onglet.scrollIntoView({ block: "start" });
  });

  if (new URLSearchParams(location.hash.slice(1)).has("repartition")) {
    const onglet = onglets.find((o) => o.id === "onglet-repartition");
    if (onglet) {
      activer(onglet);
      requestAnimationFrame(() => racine.closest("section")?.scrollIntoView({ block: "start" }));
    }
  }
}
