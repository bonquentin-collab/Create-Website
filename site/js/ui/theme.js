// Bascule clair / sombre. Le choix est mémorisé dans le navigateur quand c'est possible.

const CLE = "theme";

export function monter(bouton) {
  const racine = document.documentElement;
  try {
    const memo = localStorage.getItem(CLE);
    if (memo) racine.dataset.theme = memo;
  } catch {}

  const sombreActif = () =>
    racine.dataset.theme ? racine.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const etiqueter = () => bouton.setAttribute("aria-label", sombreActif() ? "Passer en thème clair" : "Passer en thème sombre");

  bouton.addEventListener("click", () => {
    racine.dataset.theme = sombreActif() ? "light" : "dark";
    try {
      localStorage.setItem(CLE, racine.dataset.theme);
    } catch {}
    etiqueter();
  });
  etiqueter();
}
