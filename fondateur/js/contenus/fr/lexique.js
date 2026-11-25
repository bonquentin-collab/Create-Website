// Lexique : une phrase simple, un exemple chiffré, le piège. Dans les cartes, [[id|texte]] renvoie ici.

export const LEXIQUE = [
  {
    id: 'vesting', terme: 'Vesting',
    definition: "Vos actions vous sont acquises petit à petit, et non le jour de la création. Si vous partez avant la fin, vous rendez ce qui n'est pas encore acquis.",
    exemple: "4 ans avec 1 an de cliff : vous partez au mois 20, vous gardez 20/48 de vos actions. Le reste est annulé ou racheté pour presque rien.",
    piege: "Sans vesting, une associée qui part au bout de six mois garde tout. Les investisseurs appellent ça du « capital mort » et baissent leur offre.",
    frise: true,
  },
  {
    id: 'cliff', terme: 'Cliff',
    definition: "La période du début pendant laquelle rien n'est acquis. À la fin du cliff, toute la part correspondante tombe d'un coup.",
    exemple: "Cliff de 12 mois : départ au mois 11, vous ne gardez rien ; au mois 12, vous gardez 25 %.",
    piege: "Le cliff protège l'équipe contre un départ précoce, mais c'est aussi le moment où un fondateur est le plus facile à pousser dehors.",
  },
  {
    id: 'leaver', terme: 'Good leaver, bad leaver',
    definition: "Les clauses du pacte qui fixent à quel prix un associé qui part doit revendre ses actions, selon qu'il part « bien » (maladie, licenciement sans faute) ou « mal » (démission, faute).",
    exemple: "Bad leaver : rachat à la valeur nominale, quelques centimes par action. Good leaver : rachat à la valeur de marché.",
    piege: "Lisez la définition du « bad leaver » : certains pactes y mettent la simple démission, même après cinq ans de travail.",
  },
  {
    id: 'premoney', terme: 'Valorisation pré-money',
    definition: "Ce que vaut l'entreprise juste avant que l'argent des investisseurs n'arrive.",
    exemple: "Pré-money 8 M€ et levée de 2 M€ : la post-money vaut 10 M€ et les investisseurs détiennent 2 / 10 = 20 %.",
    piege: "Une pré-money qui « inclut » un nouveau pool BSPCE vaut moins qu'elle n'en a l'air : voir « Option pool shuffle ».",
  },
  {
    id: 'postmoney', terme: 'Valorisation post-money',
    definition: "Pré-money + argent levé. C'est la valeur de l'entreprise juste après la levée.",
    exemple: "Part de l'investisseur = montant ÷ post-money. 3 M€ sur 15 M€ post-money = 20 %.",
    piege: "Comparer deux offres sur la pré-money seule ne suffit pas : la dilution dépend du montant, du pool et des convertibles.",
  },
  {
    id: 'dilution', terme: 'Dilution',
    definition: "Votre pourcentage baisse quand de nouvelles actions sont créées pour d'autres. Vous gardez le même nombre d'actions, mais d'un gâteau plus grand.",
    exemple: "1 000 actions sur 1 000 = 100 %. On en crée 250 pour un investisseur : 1 000 sur 1 250 = 80 %.",
    piege: "La dilution n'est pas mauvaise en soi : 20 % d'une entreprise qui vaut 100 M€ valent plus que 100 % d'une entreprise morte. Ce qui compte, c'est le prix.",
  },
  {
    id: 'bspce', terme: 'BSPCE et pool',
    definition: "Des bons qui permettent aux salariés d'acheter plus tard des actions au prix d'aujourd'hui. Le « pool » est la réserve de BSPCE prévue pour les futurs recrutements.",
    exemple: "Pool de 10 % : 10 % du capital est mis de côté pour l'équipe, ce qui dilue tous les actionnaires… ou seulement les anciens, selon le moment où il est créé.",
    piege: "Un pool plus gros que vos besoins de recrutement, c'est de la dilution pour rien.",
  },
  {
    id: 'shuffle', terme: 'Option pool shuffle',
    definition: "L'investisseur exige que le pool BSPCE soit créé avant sa levée, dans la pré-money. Les fondateurs paient seuls la dilution du pool.",
    exemple: "Pré-money annoncée 12 M€, pool de 15 % créé avant : la pré-money réelle des fondateurs tombe autour de 9,6 M€.",
    piege: "C'est la façon la plus discrète de baisser une valorisation tout en affichant un gros chiffre.",
  },
  {
    id: 'bsaair', terme: 'BSA AIR',
    definition: "De l'argent versé aujourd'hui, transformé en actions à la prochaine levée, au prix le plus bas entre le prix du tour décoté et le plafond de valorisation. C'est l'équivalent français du SAFE.",
    exemple: "200 k€, décote 20 %, plafond 2 M€. La Seed se fait à 9,60 € par action : décoté, 7,68 € ; plafond, 2 €. Le BSA AIR se convertit à 2 €, soit 100 000 actions.",
    piege: "Il ne change rien à votre part le jour où vous le signez. Il la fait chuter à la levée suivante, quand plus personne ne s'en souvient.",
  },
  {
    id: 'plafond', terme: 'Plafond de valorisation (value cap)',
    definition: "La valorisation maximale à laquelle un BSA AIR ou un SAFE se convertit, même si la levée suivante se fait bien plus haut.",
    exemple: "Plafond 2 M€, Seed à 12 M€ : les business angels convertissent comme si l'entreprise valait 2 M€, six fois moins cher que le nouveau fonds.",
    piege: "Plus votre entreprise réussit avant la conversion, plus le plafond vous coûte cher.",
  },
  {
    id: 'decote', terme: 'Décote',
    definition: "La réduction sur le prix du tour dont bénéficie un BSA AIR, pour récompenser le risque pris tôt.",
    exemple: "Décote de 20 % : si le tour se fait à 10 € par action, le BSA AIR se convertit à 8 €.",
    piege: "Décote et plafond se cumulent rarement ; c'est le plus favorable à l'investisseur qui s'applique.",
  },
  {
    id: 'preference', terme: 'Préférence de liquidation',
    definition: "À la vente, l'investisseur récupère d'abord sa mise (ou un multiple), avant que les autres ne touchent quoi que ce soit.",
    exemple: "1x non participative sur 3 M€ : à la vente, l'investisseur choisit entre récupérer 3 M€ ou convertir et prendre sa part en pourcentage.",
    piege: "Le pourcentage affiché ne dit rien des préférences empilées au-dessus de vos actions.",
  },
  {
    id: 'participative', terme: 'Préférence participative',
    definition: "L'investisseur récupère sa préférence ET prend encore sa part de ce qui reste. On l'appelle aussi « double dip ».",
    exemple: "2x participative sur 3 M€, vente à 20 M€ : il prend 6 M€, puis ~19 % des 14 M€ restants. Les fondateurs se partagent ce qui reste.",
    piege: "C'est la clause qui fait le plus d'écart entre ce que vous croyez toucher et ce que vous touchez. Visez au minimum un plafond (cap) de 2x ou 3x.",
  },
  {
    id: 'antidilution', terme: 'Anti-dilution',
    definition: "Si une levée future se fait à un prix plus bas (down round), l'investisseur reçoit des actions en plus pour compenser. Ce sont les autres, vous d'abord, qui paient.",
    exemple: "Moyenne pondérée : son prix est recalculé en mélangeant l'ancien et le nouveau prix. Ratchet total : son prix est ramené au nouveau prix, comme s'il avait investi aujourd'hui.",
    piege: "Elle dort tant que tout va bien. Elle se réveille pendant une crise, au pire moment pour vous.",
  },
  {
    id: 'ratchet', terme: 'Ratchet total',
    definition: "La forme d'anti-dilution la plus dure : en cas de baisse de prix, l'investisseur est entièrement repositionné au nouveau prix.",
    exemple: "Investi à 10 € par action, nouveau tour à 5 € : il reçoit deux fois plus d'actions, sans remettre un euro.",
    piege: "Combinée à un down round, elle peut faire passer un fondateur de 30 % à 15 % en une signature.",
  },
  {
    id: 'moyenne', terme: 'Moyenne pondérée (large)',
    definition: "La forme d'anti-dilution standard : le prix de l'investisseur baisse en proportion de l'importance du nouveau tour.",
    exemple: "P2 = P1 × (A + B) / (A + C). A : actions existantes ; B : actions que l'argent levé aurait achetées à l'ancien prix ; C : actions réellement émises.",
    piege: "Elle reste plus douce qu'un ratchet, mais elle vous dilue tout de même en cas de down round.",
  },
  {
    id: 'downround', terme: 'Down round',
    definition: "Une levée à un prix par action plus bas que la précédente.",
    exemple: "Série A à 15 € par action, Série B à 9 € pendant une crise : c'est un down round, et toutes les clauses anti-dilution se déclenchent.",
    piege: "Mieux vaut parfois lever moins, plus tôt, que d'attendre la crise.",
  },
  {
    id: 'board', terme: 'Board (conseil d\'administration)',
    definition: "L'organe qui contrôle la direction de l'entreprise. Il peut révoquer le PDG, y compris un fondateur.",
    exemple: "2 fondateurs, 2 investisseurs, 1 indépendant : l'indépendant fait la majorité.",
    piege: "Vous pouvez détenir 40 % du capital et perdre le contrôle du board. Dans le jeu, la fève indique qui l'a.",
  },
  {
    id: 'drag', terme: 'Drag-along (sortie forcée)',
    definition: "Si une majorité d'actionnaires veut vendre, elle peut obliger tous les autres à vendre aux mêmes conditions.",
    exemple: "Drag-along à 50 % des actions de préférence : si les fonds veulent vendre, vous vendez.",
    piege: "Avec des préférences élevées, les fonds peuvent forcer une vente où ils récupèrent leur mise et vous presque rien.",
  },
  {
    id: 'preemption', terme: 'Droit de préemption',
    definition: "Un actionnaire peut racheter en priorité des actions mises en vente, ou bloquer la vente de l'entreprise à un concurrent.",
    exemple: "Un fonds corporate qui détient un droit de préemption sur la vente : les autres acheteurs savent qu'il peut surenchérir… et ne viennent pas.",
    piege: "Ce qu'un corporate offre en valorisation, il le reprend souvent en liberté de sortie.",
  },
  {
    id: 'prorata', terme: 'Droit au pro-rata',
    definition: "Le droit d'un investisseur à remettre de l'argent aux levées suivantes pour garder son pourcentage.",
    exemple: "Un fonds à 20 % peut prendre 20 % de la levée suivante.",
    piege: "Utile pour montrer le soutien des investisseurs, mais il réduit la place pour de nouveaux fonds.",
  },
  {
    id: 'venturedebt', terme: 'Venture debt',
    definition: "Un prêt accordé à une startup qui a déjà levé des fonds. Il ne dilue presque pas, mais il faut le rembourser.",
    exemple: "1 M€ sur 36 mois, avec des BSA donnant 1 % du capital à la banque.",
    piege: "Si les « covenants » (conditions du prêt) ne sont pas respectés, la banque peut exiger le remboursement immédiat.",
  },
  {
    id: 'secondaire', terme: 'Vente secondaire',
    definition: "Vous vendez une partie de vos propres actions à un investisseur. L'argent va dans votre poche, pas dans l'entreprise.",
    exemple: "Vous vendez 5 % de vos actions à 80 % du prix de la dernière levée.",
    piege: "C'est la seule façon de toucher de l'argent avant la vente. Certains fonds y voient un manque de conviction.",
  },
  {
    id: 'runway', terme: 'Runway, burn et MRR',
    definition: "Le runway : le nombre de mois avant de manquer d'argent. Le burn : ce que l'entreprise dépense par mois. Le MRR : le revenu récurrent mensuel.",
    exemple: "500 k€ en banque, burn de 60 k€, MRR de 10 k€ : 500 ÷ (60 − 10) = 10 mois de runway.",
    piege: "On commence une levée avec au moins 6 mois de runway : elle prend souvent 4 à 6 mois.",
  },
  {
    id: 'cascade', terme: 'Cascade de liquidation (waterfall)',
    definition: "L'ordre dans lequel le prix de vente est distribué : d'abord les préférences, puis le reste entre tous les actionnaires.",
    exemple: "Vente à 20 M€ avec 8 M€ de préférences : 8 M€ aux investisseurs, puis 12 M€ partagés selon les pourcentages (et selon que chaque investisseur convertit ou non).",
    piege: "C'est elle, et non votre pourcentage, qui dit ce que vous toucherez.",
  },
];

export const terme = (id) => LEXIQUE.find((t) => t.id === id);
