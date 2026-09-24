// Répartitions proposées en un clic. Les poids sont relatifs : ils sont ramenés à l'enveloppe de l'année.
// Seule « etude » reprend l'étude de la Fondation Jean-Jaurès, qui ne fixe pas de clé entre ses trois
// priorités : on les suppose ici à parts égales.

export const repartitions = [
  {
    id: "etude",
    label: "Celle de l'étude",
    parts: { ecologie: 1, recherche: 1, ecole: 1 },
    note: "Transition écologique, recherche et éducation, à parts égales (l'étude ne fixe pas de clé de répartition).",
  },
  {
    id: "actifs",
    label: "Tout pour les salaires",
    parts: { actifs: 1 },
  },
  {
    id: "moitie",
    label: "Moitié salaires, moitié services publics",
    parts: { actifs: 3, ecole: 1, hopital: 1, ecologie: 1 },
  },
  {
    id: "vide",
    label: "Tout remettre à zéro",
    parts: {},
  },
];
