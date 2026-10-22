// Scénarios prédéfinis du simulateur. Chaque scénario est un jeu complet de réglages.
import { baremes } from "../donnees/sources.js";

const copie = (b) => b.map((t) => ({ ...t }));

export const scenarios = {
  actuel: {
    id: "actuel",
    nom: "Situation actuelle",
    resume: "Le droit en vigueur : barème de 5 à 45 % après un abattement de 100 000 € par parent, niches inchangées.",
    source: "Code général des impôts, art. 777 et 779",
    reglages: () => ({
      bareme: copie(baremes.actuel),
      abattement: 100_000,
      niches: { tout: false, dutreil: "maintenir", assuranceVie: "actuel", demembrement: "maintenir", plusValues: "effacees", toutesTransmissions: false },
    }),
  },
  cae: {
    id: "cae",
    nom: "Scénario du CAE",
    resume: "Conseil d'analyse économique (2021), « assiette 1, barème 1 » : barème actuel, mais assurance-vie au barème, usufruit taxé au décès et pacte Dutreil ramené de 75 à 50 %.",
    source: "CAE, note n° 69 et Focus n° 77, décembre 2021",
    reglages: () => ({
      bareme: copie(baremes.actuel),
      abattement: 100_000,
      niches: { tout: false, dutreil: "resserrer", assuranceVie: "bareme", demembrement: "supprimer", plusValues: "effacees", toutesTransmissions: false },
    }),
  },
  igs: {
    id: "igs",
    nom: "Impôt sur les grandes successions",
    resume: "Fondation Jean-Jaurès (2024) : un barème de 0 à 50 % sur tout ce qu'on reçoit dans sa vie, rien à payer jusqu'à 200 000 €, assurance-vie au barème, démembrement supprimé, Dutreil resserré, plus-values du 1 % le plus riche imposées.",
    source: "Fondation Jean-Jaurès, novembre 2024",
    reglages: () => ({
      bareme: copie(baremes.igs),
      abattement: 0,
      niches: { tout: false, dutreil: "resserrer", assuranceVie: "bareme", demembrement: "supprimer", plusValues: "top1", toutesTransmissions: true },
    }),
  },
};
