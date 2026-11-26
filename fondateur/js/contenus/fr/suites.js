// Cartes de conséquences : elles ne sortent jamais au hasard. Un choix les programme (table LIENS ci-dessous),
// ou une levée signée (moteur.signerOffre), et elles reviennent quelques mois plus tard.
// L'interface rappelle alors le choix d'origine (« Suite de votre choix : … »).
import { bouger, diluer, noter, programmer } from '../../etat.js';
import { annuler, total } from '../../captable.js';

const k = (x) => `${Math.round(x / 1000).toLocaleString('fr-FR')} k€`;
const suite = (carte) => ({ force: true, unique: true, ...carte });

export const CARTES_SUITES = [
  // ───────── Après une levée, selon le fonds ─────────
  suite({
    id: 'apres-levee-flatteur', qui: 'marcantoine',
    texte: "« Petit point hebdo ! J'ai besoin du reporting chaque lundi, d'un accès au Slack, et j'aimerais que mon neveu fasse son stage chez vous. Il est très motivé. »",
    g: { label: 'Le reporting, rien de plus', effet: (e) => bouger(e, { investisseurs: -10 }) },
    h: { label: 'Le reporting et le Slack', effet: (e) => bouger(e, { equipe: -4, investisseurs: -2 }) },
    d: { label: 'Tout, neveu compris', effet: (e) => { e.burn += 1_500; bouger(e, { equipe: -8, investisseurs: 8 }); } },
  }),
  suite({
    id: 'apres-levee-corporate', qui: 'corporate',
    texte: "« Bonne nouvelle : notre groupe veut que vous priorisiez nos besoins internes sur votre feuille de route. Et un concurrent à nous vous a contactés ? Nous serions… déçus. »",
    g: { label: 'Notre feuille de route d’abord', effet: (e) => bouger(e, { investisseurs: -8, produit: 4 }) },
    d: { label: 'Prioriser le groupe', effet: (e) => { e.mrr += 8_000; bouger(e, { produit: -10 }); e.drapeaux.captif = true; } },
  }),
  suite({
    id: 'apres-levee-propre', qui: 'claire',
    texte: "« Je vous présente trois clients de mon portefeuille et une DRH qui a recruté chez trois licornes. Pas d'obligation, je préviens juste : je regarde vos chiffres chaque mois. »",
    g: { label: 'On se débrouille seuls', effet: (e) => bouger(e, { investisseurs: -4 }) },
    d: { label: 'Accepter les présentations', effet: (e) => { e.mrr *= 1.06; bouger(e, { equipe: 6, investisseurs: 4 }); } },
  }),
  suite({
    id: 'apres-levee-croissance', qui: 'croissance',
    texte: "« Notre modèle suppose que vous triplez en dix-huit mois. Je vous ai préparé un plan de recrutement de 40 personnes. Ce n'est qu'une suggestion, évidemment. »",
    g: { label: 'Croissance raisonnable', effet: (e) => bouger(e, { investisseurs: -10, equipe: 4 }) },
    h: { label: 'Recruter 15 personnes', effet: (e) => { e.burn += 45_000; e.croissanceBonus += 0.03; } },
    d: { label: 'Suivre le plan', effet: (e) => { e.burn += 110_000; e.croissanceBonus += 0.06; bouger(e, { equipe: -8, investisseurs: 10 }); } },
  }),
  suite({
    id: 'apres-levee-angels', qui: 'gerard',
    texte: "« Je fais un dîner de business angels jeudi. Venez pitcher, ils ont tous un neveu à placer, mais aussi des contacts dans la grande distribution. »",
    g: { label: 'Pas le temps', effet: () => {} },
    d: { label: 'Y aller', effet: (e) => { e.mrr *= 1.04; bouger(e, { produit: -2, investisseurs: 4 }); } },
  }),

  // ───────── Le pacte entre fondateurs ─────────
  suite({
    id: 're-vesting', qui: 'claire',
    texte: "« Vous n'avez pas de [[vesting|vesting]] entre fondateurs ? Pour nous, c'est une condition : vos actions sont remises sous vesting sur quatre ans, à partir d'aujourd'hui. »",
    g: { label: 'Refuser', effet: (e) => { e.drapeaux.sansVesting = true; bouger(e, { investisseurs: -15 }); noter(e, { type: 'clause', titre: 'Refus du re-vesting', texte: 'Les fonds n’aiment pas les fondateurs qui peuvent partir avec tout : votre crédibilité en prend un coup.', terme: 'vesting' }); } },
    h: { label: 'Négocier deux ans', effet: (e) => { e.drapeaux.vesting = true; bouger(e, { investisseurs: 3 }); noter(e, { type: 'clause', titre: 'Re-vesting sur deux ans', texte: 'Vos actions ne vous sont de nouveau acquises qu’au fil de deux années de travail.', terme: 'vesting' }); } },
    d: { label: 'Accepter quatre ans', effet: (e) => { e.drapeaux.vesting = true; bouger(e, { investisseurs: 8 }); noter(e, { type: 'clause', titre: 'Re-vesting sur quatre ans', texte: 'Ce que vous croyiez posséder redevient « à gagner » : si vous partez dans deux ans, vous perdez la moitié de vos actions.', terme: 'vesting' }); } },
  }),
  suite({
    id: 'racheter-ines', qui: 'avocat', cond: (e) => e.table.some((d) => d.id === 'ines'),
    texte: (e) => `« Inès détient toujours sa part sans travailler chez vous. Les fonds demandent que la société rachète ses actions. Elle accepte pour ${k(Math.max(50_000, (e.derniere?.prix ?? 1) * 0.3 * (e.table.find((d) => d.id === 'ines')?.actions ?? 0)))}, payés par la trésorerie. »`,
    g: { label: 'Garder Inès au capital', effet: (e) => bouger(e, { investisseurs: -8 }) },
    d: {
      label: 'Racheter ses actions',
      effet: (e) => {
        const d = e.table.find((x) => x.id === 'ines');
        const prix = Math.max(50_000, (e.derniere?.prix ?? 1) * 0.3 * d.actions);
        e.tresorerie -= prix;
        e.drapeaux.capitalMort = false;
        diluer(e, annuler(e.table, 'ines', d.actions), { titre: 'Rachat des actions d’Inès', texte: `La société rachète et annule les actions d’Inès pour ${k(prix)}. Tout le monde remonte : c’est une relution, payée en trésorerie.` });
        bouger(e, { investisseurs: 8 });
      },
    },
  }),
  suite({
    id: 'mi-temps-ines', qui: 'ines', cond: (e) => e.table.some((d) => d.id === 'ines') && !e.drapeaux.inesPartie,
    texte: "« Six mois à mi-temps… J'ai l'impression d'être une invitée dans ma propre boîte. Soit je reviens à plein temps, soit je pars vraiment. »",
    g: { label: 'Qu’elle parte', effet: (e) => { e.drapeaux.inesPartie = true; e.board.fondateurs = Math.max(1, e.board.fondateurs - 1); e.drapeaux.capitalMort = !e.drapeaux.vesting; bouger(e, { equipe: -8 }); } },
    d: { label: 'Le plein temps, enfin', effet: (e) => { e.burn += 2_000; bouger(e, { equipe: 8, produit: 4 }); } },
  }),
  suite({
    id: 'holding-crowdfunding', qui: 'avocat',
    texte: "« Vos 600 actionnaires du crowdfunding doivent signer chaque décision importante. Les fonds exigent qu'on les regroupe dans une holding. Comptez 25 k€ de frais… et beaucoup de courriels. »",
    g: { label: 'Laisser comme ça', effet: (e) => bouger(e, { investisseurs: -10 }) },
    d: { label: 'Créer la holding', effet: (e) => { e.tresorerie -= 25_000; bouger(e, { investisseurs: 6, equipe: -2 }); } },
  }),

  // ───────── Produit et clients ─────────
  suite({
    id: 'ia-preuve', qui: 'corporate', cond: (e) => e.drapeaux.ia,
    texte: "« Votre site dit “AI-powered”. Notre direction des achats aimerait voir l'IA en démonstration mardi. Elle est où, exactement ? »",
    g: { label: 'Avouer : c’est du marketing', effet: (e) => { e.drapeaux.ia = false; e.mrr *= 0.95; bouger(e, { investisseurs: -6 }); } },
    h: { label: 'Bricoler une démo', effet: (e) => bouger(e, { equipe: -10, produit: -4 }) },
    d: { label: 'Construire une vraie IA', effet: (e) => { e.burn += 15_000; bouger(e, { produit: 10, equipe: -4 }); } },
  }),
  suite({
    id: 'grand-compte-exigeant', qui: 'corporate',
    texte: "« Pour renouveler, il nous faut trois nouvelles fonctionnalités avant la fin du trimestre. Et nos paiements passent à 150 jours, nouvelle politique groupe. »",
    g: { label: 'Le laisser partir', effet: (e) => { e.mrr = Math.max(0, e.mrr - 25_000); bouger(e, { produit: 6, investisseurs: -5 }); } },
    h: { label: 'Une fonctionnalité sur trois', effet: (e, rng) => { if (rng() < 0.5) { e.mrr = Math.max(0, e.mrr - 12_000); } bouger(e, { produit: -4 }); } },
    d: { label: 'Tout accepter', effet: (e) => { e.tresorerie -= 60_000; bouger(e, { produit: -10, equipe: -8 }); } },
  }),
  suite({
    id: 'cac-explose', qui: 'cto',
    texte: "« Le coût pour acquérir un client a doublé en trois mois : tout le monde enchérit sur les mêmes mots-clés. Chaque nouveau client nous coûte plus qu'il ne rapporte la première année. »",
    g: { label: 'Couper la pub', effet: (e) => { e.burn = Math.max(10_000, e.burn - 12_000); e.croissanceBonus -= 0.02; } },
    d: { label: 'Continuer, la croissance d’abord', effet: (e) => { e.burn += 6_000; bouger(e, { investisseurs: 4 }); } },
  }),
  suite({
    id: 'freemium-serveurs', qui: 'cto',
    texte: "« 40 000 utilisateurs gratuits, 300 payants. La facture des serveurs vient de tripler et le support croule sous les questions de gens qui ne paieront jamais. »",
    g: { label: 'Limiter l’offre gratuite', effet: (e) => { e.croissanceBonus -= 0.015; bouger(e, { equipe: 4 }); } },
    h: { label: 'Faire payer le support', effet: (e) => { e.mrr *= 1.04; bouger(e, { produit: -3 }); } },
    d: { label: 'Assumer, c’est notre acquisition', effet: (e) => { e.burn += 8_000; bouger(e, { equipe: -6 }); } },
  }),
  suite({
    id: 'prix-churn', qui: 'marche',
    texte: "Après la hausse de prix, les petits clients partent un par un. Les gros restent et ne disent rien. Pour l'instant.",
    g: { label: 'Une offre « starter » moins chère', effet: (e) => { e.mrr *= 1.03; bouger(e, { produit: -3 }); } },
    d: { label: 'Assumer le repositionnement', effet: (e) => { e.mrr *= 0.96; bouger(e, { produit: 5, investisseurs: 3 }); } },
  }),
  suite({
    id: 'scandale-demi', qui: 'avocat', cond: (e) => !e.vus.scandale,
    texte: "« Un ancien stagiaire menace de parler de la faille que vous avez corrigée discrètement. Il ne veut “rien”, juste une recommandation LinkedIn… et 20 000 €. »",
    g: { label: 'Refuser et tout révéler', effet: (e) => { e.mrr *= 0.92; bouger(e, { investisseurs: -5, equipe: 5 }); } },
    d: { label: 'Payer', effet: (e) => { e.tresorerie -= 20_000; programmer(e, 'scandale', 6, 'Vous avez payé pour cacher la faille'); } },
  }),

  // ───────── Équipe ─────────
  suite({
    id: 'remote-isolement', qui: 'cto',
    texte: "« Depuis le full remote, plus personne ne se parle en dehors des réunions. Deux développeurs juniors se sentent perdus et pensent à partir. »",
    g: { label: 'Un séminaire par trimestre', effet: (e) => { e.tresorerie -= 15_000; bouger(e, { equipe: 8 }); } },
    h: { label: 'Un bureau deux jours par semaine', effet: (e) => { e.burn += 2_500; bouger(e, { equipe: 5 }); } },
    d: { label: 'C’est la vie du remote', effet: (e) => bouger(e, { equipe: -10, produit: -4 }) },
  }),
  suite({
    id: 'glassdoor', qui: 'cto',
    texte: "« Les avis Glassdoor après les licenciements sont terribles : “management toxique”, “promesses non tenues”. Trois candidats ont décliné cette semaine. »",
    g: { label: 'Répondre publiquement', effet: (e) => bouger(e, { equipe: 4, investisseurs: -2 }) },
    d: { label: 'Augmenter les salaires d’embauche', effet: (e) => { e.burn += 6_000; bouger(e, { equipe: 6 }); } },
  }),
  suite({
    id: 'vp-sales-bilan', qui: 'claire',
    texte: (e) => e.drapeaux.vpPerf
      ? "« Votre VP Sales a dépassé ses objectifs de 40 %. Elle demande à passer COO, avec 1 % de BSPCE en plus. »"
      : "« Votre VP Sales n'a fait que 40 % de ses objectifs en six mois. Elle accuse le produit, le produit l'accuse elle. »",
    g: { label: (e) => (e.drapeaux.vpPerf ? 'Non, elle reste VP' : 'S’en séparer'), effet: (e) => { if (e.drapeaux.vpPerf) bouger(e, { equipe: -6 }); else { e.burn -= 15_000; e.croissanceBonus -= 0.02; bouger(e, { equipe: -4 }); } } },
    d: {
      label: (e) => (e.drapeaux.vpPerf ? 'La nommer COO' : 'Lui laisser six mois'),
      effet: (e) => {
        if (e.drapeaux.vpPerf) {
          const T = total(e.table);
          diluer(e, e.table.map((x) => (x.id === 'esop' ? { ...x, actions: x.actions + T * 0.01 } : x)), { titre: 'BSPCE de la nouvelle COO (+1 %)', texte: 'Ses nouveaux BSPCE s’ajoutent au pool : tout le monde est un peu dilué.' });
          bouger(e, { equipe: 8 }); e.croissanceBonus += 0.02;
        } else bouger(e, { investisseurs: -5 });
      },
    },
  }),
  suite({
    id: 'malaise', qui: 'mere',
    texte: "« Ton médecin m'a appelée. Enfin, il t'a appelé, mais c'est moi qui ai répondu. Il dit que si tu continues à ce rythme, tu vas faire un malaise. »",
    g: { label: 'Un mois de vraies vacances', effet: (e) => bouger(e, { equipe: 10, produit: -6, investisseurs: -4 }) },
    d: { label: 'Après la prochaine levée', effet: (e, rng) => { if (rng() < 0.4) { bouger(e, { equipe: -20, produit: -10 }); noter(e, { type: 'evenement', titre: 'Malaise en plein comité', texte: 'Trois semaines d’arrêt. L’équipe a tenu sans vous, mais elle s’en souviendra.' }); } } },
  }),
  suite({
    id: 'talents-partent', qui: 'cto',
    texte: "« Sans recharge du pool BSPCE, je ne peux rien proposer aux seniors. Notre lead data part chez un concurrent qui lui offre 0,5 % du capital. »",
    g: { label: 'Tant pis', effet: (e) => bouger(e, { produit: -8, equipe: -6 }) },
    d: { label: 'Contre-offre en salaire', effet: (e) => { e.burn += 3_000; bouger(e, { equipe: 3 }); } },
  }),
  suite({
    id: 'secondaire-equipe', qui: 'cto',
    texte: "« L'équipe a appris que tu as vendu une partie de tes actions. Certains se demandent si tu crois encore au projet. Et pourquoi eux ne peuvent pas vendre leurs BSPCE. »",
    g: { label: 'Expliquer en réunion', effet: (e) => bouger(e, { equipe: 3 }) },
    d: { label: 'Ouvrir un rachat de BSPCE pour l’équipe', effet: (e) => { e.tresorerie -= 80_000; bouger(e, { equipe: 12 }); } },
  }),

  // ───────── Expansion et financement ─────────
  suite({
    id: 'berlin-bilan', qui: 'claire',
    texte: (e) => (e.croissanceBonus > 0.02
      ? "« Berlin décolle : trois grands comptes signés. Votre country manager veut ouvrir Munich. »"
      : "« Berlin ne décolle pas. Votre country manager allemand a démissionné et le bureau coûte 22 k€ par mois. »"),
    g: { label: (e) => (e.croissanceBonus > 0.02 ? 'Consolider Berlin' : 'Fermer Berlin'), effet: (e) => { if (e.croissanceBonus <= 0.02) { e.burn = Math.max(10_000, e.burn - 22_000); bouger(e, { investisseurs: -6 }); } else bouger(e, { produit: 3 }); } },
    d: { label: (e) => (e.croissanceBonus > 0.02 ? 'Ouvrir Munich' : 'Recruter un nouveau manager'), effet: (e) => { e.burn += 15_000; e.croissanceBonus += 0.02; } },
  }),
  suite({
    id: 'usa-flip', qui: 'avocat', cond: (e) => e.drapeaux.us,
    texte: "« Petit détail du passage au Delaware : vos BSPCE français ne valent plus rien, il faut des stock-options américaines, moins avantageuses fiscalement pour l'équipe. Et 120 k€ de frais d'avocats. Des deux côtés de l'Atlantique. »",
    g: { label: 'Faire le minimum', effet: (e) => { e.tresorerie -= 40_000; bouger(e, { equipe: -12 }); } },
    d: { label: 'Tout faire proprement', effet: (e) => { e.tresorerie -= 120_000; bouger(e, { equipe: -3, investisseurs: 5 }); } },
  }),
  suite({
    id: 'hugues-espion', qui: 'cto', cond: (e) => e.board.investisseurs >= 2,
    texte: "« Hugues, le CFO, envoie nos chiffres à Marc-Antoine avant même qu'on les voie. Hier, Marc-Antoine m'a félicité pour un contrat que je n'avais pas encore signé. »",
    g: { label: 'Recadrer Hugues', effet: (e) => bouger(e, { investisseurs: -8, equipe: 4 }) },
    d: { label: 'Laisser faire', effet: (e) => bouger(e, { equipe: -8, investisseurs: 4 }) },
  }),
  suite({
    id: 'exclusivite-piege', qui: 'corporate', cond: (e) => e.drapeaux.exclusivite,
    texte: "« Un grand client veut vous acheter directement, sans passer par nous. Rappel amical : notre exclusivité court encore deux ans. Nous prendrons nos 30 %. »",
    g: { label: 'Racheter l’exclusivité', effet: (e) => { e.tresorerie -= 150_000; e.drapeaux.exclusivite = false; } },
    d: { label: 'Respecter le contrat', effet: (e) => { e.mrr += 7_000; bouger(e, { investisseurs: -3 }); } },
  }),
  suite({
    id: 'covenant', qui: 'claire', cond: (e) => e.dette && e.mrr < e.burn * 0.6,
    texte: "« La banque a regardé vos chiffres : vous ne respectez plus les covenants du prêt, le ratio revenus sur dépenses est sous le seuil. Elle peut exiger le remboursement immédiat. »",
    g: { label: 'Rembourser maintenant', effet: (e) => { e.tresorerie -= e.dette.mensualite * e.dette.restant; e.dette = null; } },
    h: { label: 'Négocier un délai (BSA en plus)', effet: (e) => { const T = total(e.table); diluer(e, e.table.map((x) => (x.id === 'banque' ? { ...x, actions: x.actions + T * 0.01 } : x)), { titre: 'BSA supplémentaires pour la banque (+1 %)', texte: 'Le délai se paie en capital : la banque reçoit 1 % de plus.' }); } },
    d: { label: 'Couper le burn de 25 %', effet: (e) => { e.burn *= 0.75; bouger(e, { equipe: -15 }); } },
  }),
  suite({
    id: 'bpi-remboursement', qui: 'bpi',
    texte: "« Bonjour ! Comme prévu, la première échéance de l'avance remboursable arrive : 75 k€. Le dossier de 40 pages pour le report fait, lui, 60 pages. »",
    g: { label: 'Demander un report', effet: (e) => bouger(e, { equipe: -5 }) },
    d: { label: 'Rembourser', effet: (e) => { e.tresorerie -= 75_000; } },
  }),
  suite({
    id: 'ratchet-reveil', qui: 'marcantoine', cond: (e) => e.drapeaux.ratchet,
    texte: "« Avec la crise, ta prochaine levée se fera sûrement plus bas que la nôtre. Je te rappelle amicalement notre clause de [[ratchet|ratchet total]] : on sera repositionnés au nouveau prix. C'est dans le contrat, tu l'as signé. »",
    g: { label: 'Lui demander d’y renoncer', effet: (e, rng) => { if (rng() < 0.3) { e.drapeaux.ratchet = false; e.table = e.table.map((x) => (x.pref?.antiDilution === 'ratchet' ? { ...x, pref: { ...x.pref, antiDilution: 'moyenne' } } : x)); noter(e, { type: 'clause', titre: 'Ratchet abandonné', texte: 'Marc-Antoine passe à une moyenne pondérée, en échange d’un siège d’observateur.', terme: 'antidilution' }); } else bouger(e, { investisseurs: -5 }); } },
    d: { label: 'Prendre note', effet: (e) => noter(e, { type: 'clause', titre: 'Le ratchet se rapproche', texte: 'Au prochain tour plus bas, Marc-Antoine recevra gratuitement des actions, payées par vous.', terme: 'ratchet', cachee: true }) },
  }),
];

// Quel choix programme quelle suite : [carte, option (g, h, d ou index), suite, délai en mois, rappel affiché].
export const LIENS = [
  ['pivot-ia', 'd', 'ia-preuve', 5, 'Vous êtes devenu « AI-first »'],
  ['client-grand-compte', 'd', 'grand-compte-exigeant', 4, 'Vous avez signé le grand compte'],
  ['pub', 2, 'cac-explose', 3, 'Vous avez doublé le budget publicitaire'],
  ['freemium', 'd', 'freemium-serveurs', 4, 'Vous avez lancé une offre gratuite'],
  ['prix', 'd', 'prix-churn', 3, 'Vous avez augmenté vos prix de 30 %'],
  ['fuite', 'g', 'scandale-demi', 3, 'Vous avez corrigé la faille discrètement'],
  ['teletravail', 'd', 'remote-isolement', 6, 'Vous êtes passés en full remote'],
  ['couper-burn', 'd', 'glassdoor', 2, 'Vous avez licencié 20 % de l’équipe'],
  ['crise', 0, 'glassdoor', 3, 'Vous avez coupé le burn pendant la crise'],
  ['crise', 1, 'ratchet-reveil', 1, 'Vous avez signé un ratchet total'],
  ['crise', 0, 'ratchet-reveil', 1, 'Vous avez signé un ratchet total'],
  ['crise', 2, 'ratchet-reveil', 1, 'Vous avez signé un ratchet total'],
  ['vp-sales', 'd', 'vp-sales-bilan', 6, 'Vous avez embauché la VP Sales'],
  ['burnout', 'd', 'malaise', 4, 'Vous avez décidé de tenir'],
  ['pool-refresh', 'g', 'talents-partent', 3, 'Vous avez refusé de recharger le pool BSPCE'],
  ['secondaire', 'd', 'secondaire-equipe', 2, 'Vous avez vendu 10 % de vos actions'],
  ['secondaire', 'h', 'secondaire-equipe', 2, 'Vous avez vendu 5 % de vos actions'],
  ['allemagne', 'd', 'berlin-bilan', 5, 'Vous avez ouvert Berlin'],
  ['usa', 'd', 'usa-flip', 2, 'Vous avez créé une holding au Delaware'],
  ['cfo', 'd', 'hugues-espion', 4, 'Vous avez accepté Hugues comme CFO'],
  ['distributeur', 'd', 'exclusivite-piege', 7, 'Vous avez signé l’exclusivité européenne'],
  ['venture-debt', 'd', 'covenant', 8, 'Vous avez signé la venture debt'],
  ['venture-debt', 'h', 'covenant', 8, 'Vous avez signé la venture debt'],
  ['bpi', 'd', 'bpi-remboursement', 18, 'Vous avez pris l’aide Bpifrance'],
  ['ines-part', 'h', 'mi-temps-ines', 6, 'Inès est passée à mi-temps'],
];

// Branche les liens sur les cartes : l'effet d'origine est conservé, la suite est programmée en plus.
export function brancherSuites(cartes) {
  for (const [id, cle, suiteId, delai, cause] of LIENS) {
    const carte = cartes.find((c) => c.id === id);
    if (!carte) continue;
    const option = typeof cle === 'number' ? carte.options?.[cle] : carte[cle];
    if (!option) continue;
    const effet = option.effet;
    option.effet = (e, rng) => { effet?.(e, rng); programmer(e, suiteId, delai, cause); };
  }
  return [...cartes, ...CARTES_SUITES];
}
