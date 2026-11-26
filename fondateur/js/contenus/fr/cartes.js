// Cartes ordinaires du jeu. Dans les textes, [[id|mot]] renvoie au lexique.
// Une carte : { id, qui, texte, g: { label, effet(e, rng) }, d: {…}, cond(e), poids, unique, delai, force }
import { bouger, diluer, noter, partVous } from '../../etat.js';
import { annuler, emettre, ceder, part, total } from '../../captable.js';

const k = (x) => `${Math.round(x / 1000).toLocaleString('fr-FR')} k€`;
const aInvestisseurs = (e) => e.table.some((d) => d.categorie === 'investisseur');
const ines = (e) => e.table.find((d) => d.id === 'ines');

// Départ d'Inès : avec vesting, elle rend ce qui n'est pas acquis ; sans, elle garde tout.
function departInes(e) {
  const d = ines(e);
  if (!d) return;
  e.board.fondateurs = Math.max(1, e.board.fondateurs - 1);
  e.drapeaux.inesPartie = true;
  if (e.drapeaux.vesting) {
    const acquis = e.mois < 12 ? 0 : Math.min(1, e.mois / 48);
    const rendues = d.actions * (1 - acquis);
    diluer(e, annuler(e.table, 'ines', rendues), {
      titre: 'Inès part, le vesting joue',
      texte: `Au mois ${e.mois}, Inès a acquis ${Math.round(acquis * 100)} % de ses actions. Les ${Math.round(rendues).toLocaleString('fr-FR')} autres sont annulées : la part de chacun remonte (on parle de relution).`,
    });
    bouger(e, { equipe: -10 });
  } else {
    e.drapeaux.capitalMort = true;
    noter(e, {
      type: 'clause', titre: 'Inès part avec toutes ses actions',
      texte: "Sans vesting, elle garde sa part entière sans plus travailler dans l'entreprise. Les investisseurs y voient du capital mort : vos prochaines valorisations baissent de 25 %.",
      terme: 'vesting',
    });
    bouger(e, { equipe: -15, investisseurs: -15 });
  }
}

export const CARTES = [
  // ───────── Le tout début ─────────
  {
    id: 'pacte-vesting', qui: 'ines', force: true, unique: true, sansTemps: false,
    texte: "« Avant d'aller voir des investisseurs, je propose qu'on mette nos actions sous [[vesting|vesting]] : 4 ans, avec 1 an de [[cliff|cliff]]. Si l'un de nous part tôt, il rend ce qui n'est pas acquis. Ce n'est pas que je doute de toi. Enfin, un peu de moi. »",
    g: { label: 'On se fait confiance', effet: (e) => { e.drapeaux.vesting = false; bouger(e, { equipe: 5 }); noter(e, { type: 'clause', titre: 'Pas de vesting', texte: "Vos actions et celles d'Inès vous sont acquises dès aujourd'hui. Si l'une de vous part, elle garde tout.", terme: 'vesting' }); } },
    d: { label: 'Signer le vesting', effet: (e) => { e.drapeaux.vesting = true; bouger(e, { investisseurs: 8 }); noter(e, { type: 'clause', titre: 'Vesting de 4 ans, cliff de 1 an', texte: 'Vos actions vous sont acquises au fil du temps. Les investisseurs adorent : ça protège la boîte si un fondateur part.', terme: 'vesting' }); } },
  },
  {
    id: 'bsa-air', qui: 'gerard', force: true, unique: true,
    texte: "« J'ai revendu ma boîte en 2014, alors je sais reconnaître un bon coup. Je mets 200 k€ avec mes amis, en [[bsaair|BSA AIR]] : [[decote|décote]] de 20 %, [[plafond|plafond de valorisation]] à 2 M€. Ça ne vous dilue pas aujourd'hui, c'est ça qui est beau. »",
    g: {
      label: 'Négocier un plafond à 4 M€',
      effet: (e, rng) => {
        if (rng() < 0.5) {
          e.notes.push({ id: 'angels', nom: 'Gérard & co (BSA AIR)', montant: 150_000, decote: 0.2, plafondValo: 4e6 });
          e.tresorerie += 150_000;
          noter(e, { type: 'clause', titre: 'BSA AIR de 150 k€, plafond 4 M€', texte: "Gérard accepte un plafond plus haut mais met moins. Votre part ne bouge pas aujourd'hui : le BSA AIR se convertira à la prochaine levée.", terme: 'bsaair', cachee: true });
        } else {
          bouger(e, { investisseurs: -5 });
          noter(e, { type: 'evenement', titre: 'Gérard part jouer au golf', texte: "Il trouve votre contre-proposition « très 2021 ». Pas d'argent, mais pas de dilution non plus." });
        }
      },
    },
    h: { label: 'Refuser : pas d’angels pour l’instant', effet: (e) => { bouger(e, { investisseurs: -3, equipe: 3 }); noter(e, { type: 'evenement', titre: 'Pas de BSA AIR', texte: 'Vous gardez 60 %, mais avec très peu de trésorerie : la Seed arrivera vite.' }); } },
    d: {
      label: 'Signer à 2 M€ de plafond',
      effet: (e) => {
        e.notes.push({ id: 'angels', nom: 'Gérard & co (BSA AIR)', montant: 200_000, decote: 0.2, plafondValo: 2e6 });
        e.tresorerie += 200_000;
        bouger(e, { investisseurs: 5 });
        noter(e, { type: 'clause', titre: 'BSA AIR de 200 k€, plafond 2 M€', texte: "Votre part reste à 60 % aujourd'hui. Mais à la prochaine levée, Gérard convertira comme si l'entreprise valait au plus 2 M€.", terme: 'bsaair', cachee: true });
      },
    },
  },

  // ───────── Équipe ─────────
  {
    id: 'ines-part', qui: 'ines', unique: true, poids: 0.8,
    cond: (e) => e.mois >= 9 && e.mois <= 40 && !!ines(e) && !e.drapeaux.inesPartie,
    texte: "« J'ai reçu une offre d'un grand groupe. Un vrai salaire, des tickets resto, une mutuelle. Je crois que j'ai besoin de dormir. Je pars. »",
    g: { label: 'La laisser partir', effet: (e) => departInes(e) },
    h: { label: 'Lui proposer un temps partiel', effet: (e, rng) => { if (rng() < 0.7) { e.burn -= 2_000; bouger(e, { equipe: -4, produit: -4 }); noter(e, { type: 'evenement', titre: 'Inès passe à mi-temps', texte: 'Elle garde ses actions et son vesting continue. Les investisseurs n’adorent pas une cofondatrice à mi-temps.' }); bouger(e, { investisseurs: -5 }); } else departInes(e); } },
    d: {
      label: 'La retenir : salaire et BSPCE',
      effet: (e, rng) => {
        if (rng() < 0.55) { e.burn += 5_000; bouger(e, { equipe: 10 }); noter(e, { type: 'evenement', titre: 'Inès reste', texte: "Elle reste, avec un salaire décent. Le burn augmente de 5 k€ par mois." }); }
        else departInes(e);
      },
    },
  },
  {
    id: 'vp-sales', qui: 'cto', cond: (e) => e.etape >= 1, unique: true,
    texte: "« J'ai rencontré une VP Sales incroyable. Elle a doublé le chiffre d'affaires de sa dernière boîte. Elle veut 180 k€ par an et 2 % en [[bspce|BSPCE]]. »",
    g: { label: 'Trop cher', effet: (e) => bouger(e, { equipe: -5 }) },
    h: { label: 'Un profil junior, sans BSPCE', effet: (e) => { e.burn += 6_000; e.croissanceBonus += 0.02; } },
    d: {
      label: "L'embaucher",
      effet: (e) => {
        e.burn += 15_000;
        e.croissanceBonus += 0.05;
        const pool = e.table.find((d) => d.id === 'esop');
        const besoin = total(e.table) * 0.02;
        if (!pool || pool.actions < besoin) {
          diluer(e, emettre(e.table, { id: 'esop', nom: 'Pool BSPCE (salariés)', categorie: 'esop', actions: besoin }), {
            titre: 'BSPCE hors pool pour la VP Sales',
            texte: "Le pool BSPCE ne suffisait pas : on a créé 2 % de BSPCE en plus. Tout le monde est dilué, vous compris.",
          });
        } else noter(e, { type: 'evenement', titre: 'La VP Sales arrive', texte: 'Ses BSPCE sont pris dans le pool existant : pas de nouvelle dilution, le pool avait été payé avant.' });
      },
    },
  },
  {
    id: 'dev-gafam', qui: 'cto', delai: 14,
    texte: "« Ta meilleure développeuse a une offre d'un géant américain : +40 % de salaire et un toboggan dans les bureaux. »",
    g: { label: 'On ne peut pas suivre', effet: (e) => bouger(e, { equipe: -14, produit: -10 }) },
    h: { label: 'Augmentation de 15 %', effet: (e) => { e.burn += 1_500; bouger(e, { equipe: 3 }); } },
    d: { label: 'Contre-offre en BSPCE', effet: (e) => { e.burn += 2_000; bouger(e, { equipe: 8 }); } },
  },
  {
    id: 'burnout', qui: 'mere', delai: 16,
    texte: "« Tu as une petite mine. Tu dors combien d'heures ? Ton cousin, lui, est chez EDF et il a des RTT. »",
    g: { label: 'Prendre deux semaines', effet: (e) => bouger(e, { equipe: 8, produit: -4 }) },
    d: { label: "Je tiendrai", effet: (e) => bouger(e, { equipe: -10, produit: 4 }) },
  },
  {
    id: 'teletravail', qui: 'cto', unique: true,
    texte: "« L'équipe veut passer en full remote. On économiserait le loyer, mais les réunions sur Zoom à 14 personnes… »",
    g: { label: 'Tout le monde au bureau', effet: (e) => bouger(e, { equipe: -10 }) },
    d: { label: 'Full remote', effet: (e) => { e.burn = Math.max(5_000, e.burn - 4_000); bouger(e, { equipe: 10, produit: -4 }); } },
  },
  {
    id: 'pool-refresh', qui: 'claire', unique: true, cond: (e) => e.etape >= 2,
    texte: "« Pour recruter les profils seniors du plan, il faut recharger le [[bspce|pool BSPCE]] de 5 %. Maintenant, avant la prochaine levée. »",
    g: { label: 'Refuser', effet: (e) => bouger(e, { equipe: -10, investisseurs: -8 }) },
    h: { label: 'Recharger de 2 % seulement', effet: (e) => { const T = total(e.table); diluer(e, emettre(e.table, { id: 'esop', nom: 'Pool BSPCE (salariés)', categorie: 'esop', actions: T * 0.02 / 0.98 }), { titre: 'Recharge du pool BSPCE (+2 %)', texte: 'Un compromis : moins de dilution, mais moins de marge pour recruter.' }); bouger(e, { equipe: 4, investisseurs: -2 }); } },
    d: {
      label: 'Recharger le pool',
      effet: (e) => {
        const T = total(e.table);
        diluer(e, emettre(e.table, { id: 'esop', nom: 'Pool BSPCE (salariés)', categorie: 'esop', actions: T * 0.05 / 0.95 }), {
          titre: 'Recharge du pool BSPCE (+5 %)',
          texte: "Les nouvelles actions du pool diluent tous les actionnaires existants. Fait juste avant une levée, c'est vous, et non le nouveau fonds, qui en payez le prix.",
        });
        bouger(e, { equipe: 10, investisseurs: 5 });
      },
    },
  },

  // ───────── Produit ─────────
  {
    id: 'dette-technique', qui: 'cto', delai: 14,
    texte: "« Le code ressemble à un plat de spaghetti que quelqu'un aurait renversé. Il me faut trois mois pour tout refaire. »",
    options: [
      { label: 'Plus tard, on livre', effet: (e) => { bouger(e, { produit: -10, equipe: -5 }); e.croissanceBonus += 0.01; } },
      { label: 'Refondre le cœur seulement', effet: (e) => { bouger(e, { produit: 7 }); e.croissanceBonus -= 0.008; } },
      { label: 'Trois mois de refonte', effet: (e) => { bouger(e, { produit: 16, equipe: 5 }); e.croissanceBonus -= 0.02; } },
    ],
  },
  {
    id: 'pivot-ia', qui: 'marcantoine', unique: true,
    texte: "« Entre nous : tout le monde fait de l'IA. Ajoute “AI-powered” sur ton site et je te garantis +15 % de valo. Le produit, on verra après. »",
    g: { label: 'On reste honnêtes', effet: (e) => bouger(e, { produit: 5, investisseurs: -6 }) },
    d: { label: '« AI-first »', effet: (e) => { e.drapeaux.ia = true; bouger(e, { investisseurs: 10, produit: -10, equipe: -5 }); } },
  },
  {
    id: 'fuite', qui: 'avocat', unique: true, cond: (e) => e.mois >= 6,
    texte: "« Une faille a exposé les adresses e-mail de vos clients. Le règlement européen vous donne 72 heures pour prévenir la CNIL. Je facture la consultation 450 € de l'heure, au fait. »",
    g: {
      label: 'Corriger discrètement',
      effet: (e, rng) => { if (rng() < 0.5) e.file.push({ id: 'scandale' }); else bouger(e, { produit: 2 }); },
    },
    d: { label: 'Prévenir la CNIL et les clients', effet: (e) => { e.tresorerie -= 15_000; e.mrr *= 0.96; bouger(e, { equipe: -3, investisseurs: 6 }); } },
  },
  {
    id: 'scandale', qui: 'marche', force: true, unique: true,
    texte: "Un journaliste révèle la fuite que vous aviez cachée. Les clients résilient, la CNIL ouvre une enquête, et Marc-Antoine fait semblant de ne pas vous connaître.",
    g: { label: 'Faire son mea culpa', effet: (e) => { e.mrr *= 0.7; bouger(e, { investisseurs: -20, equipe: -10 }); } },
    d: { label: 'Accuser un stagiaire', effet: (e) => { e.mrr *= 0.75; bouger(e, { investisseurs: -15, equipe: -25 }); } },
  },
  {
    id: 'client-grand-compte', qui: 'corporate', delai: 18,
    texte: "« Notre groupe veut signer 300 k€ par an. Il nous faut juste six fonctionnalités sur mesure, et nous payons à 120 jours, comme toujours. »",
    g: { label: 'Rester sur notre produit', effet: (e) => bouger(e, { produit: 4 }) },
    h: { label: 'Signer sans sur-mesure, prix réduit', effet: (e, rng) => { if (rng() < 0.5) { e.mrr += 12_000; bouger(e, { produit: -3 }); } else bouger(e, { investisseurs: -2 }); } },
    d: { label: 'Signer le grand compte', effet: (e) => { e.mrr += 25_000; e.tresorerie -= 75_000; bouger(e, { produit: -12, equipe: -6 }); } },
  },

  // ───────── Traction ─────────
  {
    id: 'pub', qui: 'cto', delai: 10,
    texte: "« Si on double le budget d'acquisition payante, les courbes montent. Le coût par client aussi, mais les courbes montent. »",
    options: [
      { label: 'Croissance organique', effet: (e) => bouger(e, { investisseurs: -3 }) },
      { label: 'Tester un seul canal', effet: (e) => { e.burn += 4_000; e.croissanceBonus += 0.015; } },
      { label: 'Doubler le budget', effet: (e) => { e.burn += 12_000; e.croissanceBonus += 0.045; } },
    ],
  },
  {
    id: 'prix', qui: 'claire', delai: 14, cond: aInvestisseurs,
    texte: "« Vos prix sont trop bas. Augmentez-les de 30 %. Les bons clients resteront. »",
    g: { label: 'Ne pas toucher aux prix', effet: (e) => bouger(e, { investisseurs: -4 }) },
    h: { label: 'Augmenter pour les nouveaux clients', effet: (e) => { e.mrr *= 1.06; } },
    d: { label: 'Augmenter de 30 %', effet: (e, rng) => { if (rng() < 0.6) e.mrr *= 1.2; else { e.mrr *= 0.9; bouger(e, { produit: -5 }); } } },
  },
  {
    id: 'freemium', qui: 'cto', unique: true,
    texte: "« Et si on lançait une offre gratuite ? Plus d'utilisateurs, plus de bouche-à-oreille. Plus de serveurs aussi. »",
    g: { label: 'Rester payant', effet: () => {} },
    d: { label: 'Lancer le freemium', effet: (e) => { e.mrr *= 0.92; e.burn += 3_000; e.croissanceBonus += 0.035; } },
  },
  {
    id: 'viral', qui: 'marche', delai: 20,
    texte: "Un article sur vous fait le tour de LinkedIn. Les inscriptions explosent et le support croule sous les tickets.",
    g: { label: "L'équipe absorbe", effet: (e) => { e.mrr *= 1.12; bouger(e, { equipe: -10 }); } },
    d: { label: 'Recruter du support', effet: (e) => { e.mrr *= 1.15; e.burn += 5_000; bouger(e, { equipe: 5 }); } },
  },
  {
    id: 'churn', qui: 'marche', delai: 12, cond: (e) => e.mois >= 8,
    texte: 'Votre troisième plus gros client résilie. Il trouve un concurrent « plus simple ».',
    g: { label: 'Comprendre pourquoi', effet: (e) => { e.mrr *= 0.92; bouger(e, { produit: 8 }); } },
    d: { label: 'Remises pour les autres', effet: (e) => { e.mrr *= 0.88; bouger(e, { investisseurs: 2 }); } },
  },

  // ───────── Marché ─────────
  {
    id: 'crise', qui: 'marche', delai: 30, cond: (e) => e.mois >= 14 && e.marche > 0.85, poids: 0.8,
    texte: "Les taux montent, les fonds gèlent leurs investissements et les valorisations s'effondrent de 40 %. Sur LinkedIn, tout le monde parle soudain de « rentabilité ».",
    options: [
      { label: 'Couper le burn de 30 %', effet: (e) => { e.marche *= 0.6; e.burn *= 0.7; bouger(e, { equipe: -15 }); e.croissanceBonus -= 0.02; } },
      { label: 'Garder le cap', effet: (e) => { e.marche *= 0.6; bouger(e, { investisseurs: -10 }); } },
      { label: 'Passer à quatre jours payés quatre', effet: (e) => { e.marche *= 0.6; e.burn *= 0.85; bouger(e, { equipe: -5, produit: -6 }); } },
    ],
  },
  {
    id: 'bulle', qui: 'marche', delai: 30, cond: (e) => e.mois >= 6 && e.marche < 1.2, poids: 0.6,
    texte: "Le marché s'emballe : les fonds se battent pour les deals et signent en 48 heures. Votre stagiaire reçoit des messages d'investisseurs.",
    g: { label: 'Rester frugal', effet: (e) => { e.marche *= 1.4; bouger(e, { equipe: 4, investisseurs: -4 }); } },
    h: { label: 'Lever vite tant que c’est cher', effet: (e) => { e.marche *= 1.4; e.drapeaux.leverVite = true; bouger(e, { investisseurs: 5 }); } },
    d: { label: 'Recruter dix personnes', effet: (e) => { e.marche *= 1.4; e.burn += 30_000; e.croissanceBonus += 0.04; } },
  },
  {
    id: 'concurrent', qui: 'marche', delai: 24,
    texte: 'Un concurrent américain lève 80 M$. Son PDG explique sur un podcast que votre marché « est déjà gagné ».',
    options: [
      { label: 'Se concentrer sur une niche', effet: (e) => { bouger(e, { produit: 10, investisseurs: -5 }); e.croissanceBonus -= 0.01; } },
      { label: 'Ignorer et continuer', effet: (e) => bouger(e, { investisseurs: -3, equipe: 2 }) },
      { label: 'Accélérer', effet: (e) => { e.burn += 18_000; e.croissanceBonus += 0.03; } },
    ],
  },
  {
    id: 'reglementation', qui: 'avocat', unique: true, cond: (e) => e.mois >= 12,
    texte: "« Bruxelles prépare un nouveau règlement sur votre secteur. On peut s'y préparer maintenant ou attendre de voir. Les deux options sont facturables. »",
    g: { label: 'Attendre', effet: (e, rng) => { if (rng() < 0.4) { e.tresorerie -= 60_000; bouger(e, { investisseurs: -8 }); } } },
    d: { label: 'Se mettre en conformité', effet: (e) => { e.burn += 6_000; bouger(e, { produit: 5, investisseurs: 5 }); } },
  },

  // ───────── Expansion ─────────
  {
    id: 'allemagne', qui: 'claire', unique: true, cond: (e) => e.etape >= 1,
    texte: "« L'Allemagne, c'est le plus gros marché d'Europe. Ouvrez Berlin. Prévoyez juste quelqu'un qui parle allemand. »",
    g: { label: 'Pas maintenant', effet: (e) => bouger(e, { produit: 4, investisseurs: -4 }) },
    h: { label: 'Passer par un partenaire local', effet: (e) => { e.burn += 6_000; e.croissanceBonus += 0.02; e.mrr *= 0.98; } },
    d: { label: 'Ouvrir Berlin', effet: (e, rng) => { e.burn += 22_000; if (rng() < 0.6) e.croissanceBonus += 0.05; else bouger(e, { equipe: -10 }); } },
  },
  {
    id: 'usa', qui: 'marcantoine', unique: true, cond: (e) => e.etape >= 2,
    texte: "« Les vraies valos, c'est aux States. On crée une holding au Delaware, tu déménages à New York, et on parle de Série B à 100 M$. »",
    g: { label: "Rester en Europe", effet: (e) => bouger(e, { investisseurs: -12 }) },
    h: { label: 'Envoyer un commercial à New York', effet: (e, rng) => { e.burn += 18_000; if (rng() < 0.5) e.croissanceBonus += 0.025; bouger(e, { investisseurs: 3 }); } },
    d: { label: 'Partir à New York', effet: (e) => { e.drapeaux.us = true; e.burn += 55_000; e.croissanceBonus += 0.05; bouger(e, { equipe: -10 }); e.tresorerie -= 80_000; } },
  },
  {
    id: 'distributeur', qui: 'corporate', unique: true, cond: (e) => e.mois >= 10,
    texte: "« Nous distribuons votre produit dans toute l'Europe, en exclusivité, contre 30 % de commission. Signez et vous n'avez plus besoin de commerciaux. »",
    g: { label: 'Garder notre liberté', effet: () => {} },
    d: { label: "Signer l'exclusivité", effet: (e) => { e.croissanceBonus += 0.05; e.mrr *= 0.9; e.drapeaux.exclusivite = true; bouger(e, { investisseurs: -5 }); } },
  },

  // ───────── Board et financement ─────────
  {
    id: 'couper-burn', qui: 'claire', delai: 12, cond: (e) => aInvestisseurs(e) && e.burn > e.mrr * 1.5,
    texte: "« Votre burn n'est pas soutenable. Le board vous demande de le réduire de 25 %. Ce n'est pas une suggestion. »",
    g: { label: 'Refuser', effet: (e) => bouger(e, { investisseurs: -15 }) },
    h: { label: 'Contre-proposer 10 % de baisse', effet: (e) => { e.burn *= 0.9; bouger(e, { equipe: -6, investisseurs: -3 }); } },
    d: { label: "Licencier 20 % de l'équipe", effet: (e) => { e.burn *= 0.75; bouger(e, { equipe: -18, investisseurs: 10 }); e.croissanceBonus -= 0.02; } },
  },
  {
    id: 'cfo', qui: 'marcantoine', unique: true, cond: (e) => e.board.investisseurs >= 2,
    texte: "« Je te présente Hugues, un CFO de mon réseau. Brillant. Il commence lundi, j'ai déjà prévenu ton équipe. »",
    g: { label: 'Je choisis mon CFO', effet: (e) => bouger(e, { investisseurs: -12 }) },
    h: { label: 'Hugues, mais à temps partagé', effet: (e) => { e.burn += 6_000; bouger(e, { investisseurs: 4 }); } },
    d: { label: 'Bienvenue, Hugues', effet: (e) => { e.burn += 14_000; bouger(e, { investisseurs: 10, equipe: -6 }); } },
  },
  {
    id: 'bpi', qui: 'bpi', unique: true, cond: (e) => e.mois >= 2,
    texte: "« Bonjour ! Votre projet est éligible à une aide à l'innovation : 150 k€, moitié subvention, moitié avance remboursable. Il y a juste un dossier de 40 pages. »",
    g: { label: 'Pas le temps', effet: () => {} },
    d: { label: 'Remplir le dossier', effet: (e) => { e.tresorerie += 150_000; bouger(e, { equipe: -4 }); noter(e, { type: 'clause', titre: 'Aide Bpifrance de 150 k€', texte: "De l'argent non dilutif : il ne coûte aucune part du capital. Toujours à prendre avant de lever.", }); } },
  },
  {
    id: 'venture-debt', qui: 'claire', unique: true, cond: (e) => e.etape >= 1 && e.derniere,
    texte: (e) => `« Une banque peut vous prêter ${k(Math.min(2e6, e.derniere.montant * 0.4))} en [[venturedebt|venture debt]], sur 36 mois, avec des BSA lui donnant 1 % du capital. Presque pas de dilution. »`,
    g: { label: 'Pas de dette', effet: () => {} },
    h: { label: 'Un prêt deux fois plus petit', effet: (e) => { const montant = Math.min(1e6, e.derniere.montant * 0.2); e.tresorerie += montant; e.dette = { montant, mensualite: (montant * 1.12) / 36, restant: 36 }; noter(e, { type: 'clause', titre: `Venture debt de ${k(montant)}`, texte: 'Sans BSA cette fois : la banque se contente des intérêts sur un petit montant.', terme: 'venturedebt' }); } },
    d: {
      label: 'Signer le prêt',
      effet: (e) => {
        const montant = Math.min(2e6, e.derniere.montant * 0.4);
        e.tresorerie += montant;
        e.dette = { montant, mensualite: (montant * 1.12) / 36, restant: 36 };
        const T = total(e.table);
        diluer(e, emettre(e.table, { id: 'banque', nom: 'Banque (BSA)', categorie: 'investisseur', actions: (T * 0.01) / 0.99 }), {
          titre: 'BSA de la banque (1 %)',
          texte: `La banque reçoit des BSA pour 1 % du capital. Le reste est un prêt : ${k((montant * 1.12) / 36)} à rembourser chaque mois pendant 36 mois.`,
        });
      },
    },
  },
  {
    id: 'secondaire', qui: 'croissance', unique: true, cond: (e) => e.etape >= 2 && e.derniere,
    texte: (e) => `« Je vous rachète 10 % de vos actions à 80 % du prix de la dernière levée. Soit ${k(e.table.find((d) => d.id === 'vous').actions * 0.1 * e.derniere.prix * 0.8)} pour vous, pas pour la boîte. Pour souffler un peu. »`,
    g: { label: 'Tout garder', effet: () => {} },
    d: {
      label: 'Vendre 10 % de mes actions',
      effet: (e) => {
        const n = e.table.find((d) => d.id === 'vous').actions * 0.1;
        e.encaisse += n * e.derniere.prix * 0.8;
        diluer(e, ceder(e.table, 'vous', 'secondaire', 'Altitude (secondaire)', n), {
          titre: 'Vente secondaire de 10 % de vos actions',
          texte: "Ce n'est pas une dilution : vous avez vendu. L'argent est dans votre poche et vous restera quoi qu'il arrive.",
        });
        bouger(e, { investisseurs: -4, equipe: 4 });
      },
      diluteVisible: true,
    },
  },
  {
    id: 'crowdfunding', qui: 'cto', unique: true, cond: (e) => e.etape <= 1 && e.mois >= 4,
    texte: "« On pourrait lever 300 k€ en crowdfunding auprès de nos utilisateurs, à 4 M€ de valorisation. Six cents nouveaux actionnaires qui nous adorent ! »",
    g: { label: 'Non merci', effet: () => {} },
    d: {
      label: 'Lancer la campagne',
      effet: (e) => {
        const T = total(e.table);
        const prix = 4e6 / T;
        e.tresorerie += 300_000;
        diluer(e, emettre(e.table, { id: 'foule', nom: 'Crowdfunding (600 actionnaires)', categorie: 'investisseur', actions: 300_000 / prix }), {
          titre: 'Crowdfunding : 300 k€ à 4 M€',
          texte: `300 000 € ÷ ${prix.toFixed(2)} € par action = ${Math.round(300_000 / prix).toLocaleString('fr-FR')} actions nouvelles. Les fonds n'aiment pas les tables avec 600 lignes.`,
        });
        bouger(e, { produit: 5, investisseurs: -10 });
      },
      diluteVisible: true,
    },
  },
];

export const ROLES = {
  ines: { nom: 'Inès', role: 'votre cofondatrice' },
  marcantoine: { nom: 'Marc-Antoine', role: 'associé chez Marc-Antoine Capital, « mais appelle-moi Marco »' },
  claire: { nom: 'Claire', role: 'associée chez Granit Ventures, lit les annexes' },
  gerard: { nom: 'Gérard', role: 'business angel, a revendu sa boîte en 2014' },
  avocat: { nom: 'Maître Jean-Pierre', role: "votre avocat, facturé à l'heure" },
  bpi: { nom: 'Nadia', role: 'chargée d’affaires Bpifrance' },
  mere: { nom: 'Maman', role: 'au téléphone, comme chaque dimanche' },
  cto: { nom: 'Théo', role: 'votre CTO' },
  corporate: { nom: 'Sophie', role: "directrice de l'innovation chez Hexaflow" },
  croissance: { nom: 'Bertrand', role: 'associé chez Altitude Growth' },
  marche: { nom: 'Le marché', role: 'imprévisible, comme toujours' },
};

export { partVous, part };
