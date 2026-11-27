// Dilemmes : des choix sans bonne réponse évidente, dont les conséquences arrivent plus tard (cartes « suite »).
// Règle d'écriture : l'option la plus tentante sur le moment coûte cher ensuite, et inversement.
import { bouger, diluer, noter, programmer, partVous, voixDuBoard, investi, feve } from '../../etat.js';
import { emettre, annuler, lever, total, part } from '../../captable.js';
import { decrypter, vendre, runway } from '../../moteur.js';

const k = (x) => (Math.abs(x) >= 1e6 ? `${(x / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€` : `${Math.round(x / 1000).toLocaleString('fr-FR')} k€`);
const pctTxt = (x) => `${(x * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
const suite = (carte) => ({ force: true, unique: true, ...carte });
const aInvestisseurs = (e) => e.table.some((d) => d.pref);
const prixAction = (e) => e.derniere?.prix ?? 4e6 / total(e.table);

// Part de vos actions encore « à gagner » si vous partiez aujourd'hui (vesting de 48 mois, cliff de 12).
export function nonAcquis(e) {
  if (!e.drapeaux.vesting) return 0;
  const ecoule = e.mois - (e.drapeaux.debutVesting ?? 0);
  if (ecoule < 12) return 1;
  return Math.max(0, 1 - ecoule / 48);
}

// Émet des BSA ou des actions ordinaires à un tiers, en expliquant la dilution.
function emettreA(e, id, nom, partCible, titre, texte) {
  const T = total(e.table);
  diluer(e, emettre(e.table, { id, nom, actions: (T * partCible) / (1 - partCible) }), { titre, texte });
}

export const DILEMMES = [
  // ───────── Vous, le fondateur ─────────
  {
    id: 'offre-gafam-vous', qui: 'mere', unique: true, cond: (e) => e.mois >= 14,
    texte: (e) => `« Un géant américain te propose un poste de directeur produit : 380 k€ par an, plus des actions cotées. Ton père dit que c'est le moment de devenir raisonnable. »${nonAcquis(e) > 0 ? ` Attention : ${pctTxt(nonAcquis(e))} de vos actions ne vous sont pas encore acquises.` : ''}`,
    g: { label: 'Rester, évidemment', effet: (e) => bouger(e, { equipe: 4 }) },
    h: {
      label: 'Demander un vrai salaire au board',
      effet: (e) => {
        e.burn += 9_000;
        bouger(e, aInvestisseurs(e) ? { investisseurs: -8, equipe: -3 } : { equipe: -3 });
        noter(e, { type: 'evenement', titre: 'Vous vous augmentez', texte: 'Un salaire de marché pour le fondateur : légitime, mais le board le note et l’équipe le sait.' });
      },
    },
    d: {
      label: 'Accepter et partir',
      effet: (e) => {
        const perdu = nonAcquis(e);
        const d = e.table.find((x) => x.id === 'vous');
        if (perdu > 0) {
          diluer(e, annuler(e.table, 'vous', d.actions * perdu), {
            titre: 'Votre départ : les actions non acquises sont annulées',
            texte: perdu >= 1
              ? 'Vous partez avant la fin de la première année (le cliff) : toutes vos actions sont rachetées à leur valeur nominale. Vous partez les mains vides.'
              : `Vous partez avant la fin de votre vesting : ${pctTxt(perdu)} de vos actions sont rachetées à leur valeur nominale. C'est la clause de « bad leaver ».`,
          });
        }
        vendre(e, { prix: Math.round((e.derniere?.postMoney ?? 2e6) / 1e5) * 1e5, acheteur: 'personne' }, 'depart');
      },
    },
  },
  {
    id: 'epargne-perso', qui: 'mere', force: true, unique: true, cond: (e) => runway(e) < 8,
    texte: "« Ton conseiller bancaire dit que tu peux hypothéquer l'appartement pour 200 000 €. Ou mettre tes 40 000 € d'économies. Ou laisser ta boîte se débrouiller, comme une grande. »",
    g: { label: 'Ne pas mêler mon argent', effet: (e) => bouger(e, { investisseurs: -3 }) },
    h: {
      label: 'Mettre mes 40 k€ d’économies',
      effet: (e) => {
        e.tresorerie += 40_000;
        e.notes.push({ id: `fondateur-${e.mois}`, nom: 'Vous (BSA AIR, vos économies)', montant: 40_000, decote: 0.2, plafondValo: null });
        noter(e, { type: 'clause', titre: 'Vos économies en BSA AIR', texte: 'Elles se convertiront en actions à la prochaine levée. Si la boîte meurt avant, elles sont perdues.', terme: 'bsaair' });
      },
    },
    d: {
      label: 'Hypothéquer l’appartement',
      effet: (e) => {
        e.tresorerie += 200_000;
        e.drapeaux.hypotheque = true;
        e.notes.push({ id: `fondateur-${e.mois}`, nom: 'Vous (BSA AIR, l’hypothèque)', montant: 200_000, decote: 0.2, plafondValo: null });
        bouger(e, { equipe: 6 });
        noter(e, { type: 'evenement', titre: 'Vous hypothéquez votre appartement', texte: 'Six mois de plus pour la boîte. En cas de faillite, vous perdez aussi votre logement.' });
      },
    },
  },
  {
    id: 'ceo-experimente', qui: voixDuBoard, unique: true, cond: (e) => e.etape >= 2 && feve(e) !== 'vous' && !e.drapeaux.ceoExterne,
    texte: "« Le board pense qu'il est temps d'avoir un CEO expérimenté. Vous deviendriez directeur produit, vous garderiez vos actions. Nous avons déjà un candidat, ancien d'un grand groupe. »",
    g: {
      label: 'Refuser et se battre',
      effet: (e, rng) => {
        if (feve(e) === 'investisseurs' && rng() < 0.5) {
          e.drapeaux.ceoExterne = true;
          bouger(e, { equipe: -12 });
          noter(e, { type: 'evenement', titre: 'Le board vote contre vous', texte: 'Les investisseurs ont la majorité : le nouveau CEO est nommé malgré vous.', terme: 'board' });
          programmer(e, 'ceo-externe-bilan', 5, 'Le board a nommé un CEO malgré vous');
        } else bouger(e, { investisseurs: -15, equipe: 6 });
      },
    },
    h: { label: 'Proposer un COO à la place', effet: (e) => { e.burn += 18_000; bouger(e, { investisseurs: 4 }); } },
    d: { label: 'Accepter, pour la boîte', effet: (e) => { e.drapeaux.ceoExterne = true; e.burn += 20_000; bouger(e, { investisseurs: 15, equipe: -6 }); } },
  },

  // ───────── Équipe ─────────
  {
    id: 'theo-equity', qui: 'cto', unique: true, cond: (e) => e.mois >= 8,
    texte: "« Je bosse comme un cofondateur depuis le début, pour un salaire de stagiaire. Je veux 5 % du capital, comme un associé. Sinon j'écoute les recruteurs qui m'appellent. »",
    g: { label: 'Refuser', effet: (e, rng) => { if (rng() < 0.6) { bouger(e, { produit: -22, equipe: -12 }); noter(e, { type: 'evenement', titre: 'Théo démissionne', texte: 'Le seul à connaître le code part chez un concurrent.' }); } else bouger(e, { equipe: -8 }); } },
    h: { label: '2 % en BSPCE avec vesting', effet: (e) => { emettreA(e, 'esop', 'Pool BSPCE (salariés)', 0.02, 'BSPCE pour Théo (2 %)', 'Des BSPCE sous vesting : Théo les gagne s’il reste. Tout le monde est un peu dilué.'); bouger(e, { equipe: 4 }); } },
    d: {
      label: 'Lui donner 5 %',
      effet: (e) => {
        emettreA(e, 'theo', 'Théo (associé)', 0.05, 'Théo devient associé (5 %)', 'Cinq pour cent d’actions ordinaires, émises pour lui : tous les actionnaires sont dilués d’autant.');
        bouger(e, { equipe: 10, produit: 6 });
      },
      diluteVisible: true,
    },
  },
  {
    id: 'ami-sous-performe', qui: 'ines', delai: 30, cond: (e) => e.mois >= 6 && e.table.some((d) => d.id === 'ines'),
    texte: "« Julien, ton ami d'école et notre premier salarié, ne suit plus. L'équipe compense ses erreurs et commence à râler. Il ne se doute de rien. »",
    g: { label: 'Le garder, il était là au début', effet: (e) => { bouger(e, { equipe: -8 }); programmer(e, 'julien-suite', 4, 'Vous avez gardé Julien'); } },
    h: { label: 'Lui proposer un autre poste', effet: (e) => bouger(e, { equipe: -2, produit: -2 }) },
    d: { label: 'S’en séparer', effet: (e) => { e.burn -= 4_000; bouger(e, { equipe: -6, produit: 3 }); } },
  },
  {
    id: 'harcelement', qui: 'cto', unique: true, cond: (e) => e.mois >= 10,
    texte: "« Deux personnes accusent notre meilleur commercial de harcèlement. Il fait 30 % du chiffre d'affaires. Il nie tout et menace de partir avec ses clients. »",
    g: { label: 'Le protéger, c’est sa parole contre la leur', effet: (e) => { bouger(e, { equipe: -15 }); programmer(e, 'scandale-rh', 5, 'Vous avez protégé le commercial accusé'); } },
    h: { label: 'Enquête externe, il reste en attendant', effet: (e) => { e.tresorerie -= 20_000; bouger(e, { equipe: -4 }); programmer(e, 'enquete-rh', 2, 'Vous avez lancé une enquête externe'); } },
    d: { label: 'Le suspendre immédiatement', effet: (e) => { e.mrr *= 0.82; bouger(e, { equipe: 10 }); } },
  },
  {
    id: 'promesses-bspce', qui: 'cto', unique: true, cond: (e) => e.etape >= 1,
    texte: "« Tu avais promis des BSPCE à oral aux cinq premiers salariés. Le pool ne prévoyait rien pour eux. Ils demandent quand ils signent. »",
    g: { label: '« Je n’ai rien promis »', effet: (e) => { bouger(e, { equipe: -18 }); programmer(e, 'depart-anciens', 3, 'Vous avez renié vos promesses de BSPCE'); } },
    d: { label: 'Tenir parole : 3 % de BSPCE', effet: (e) => { emettreA(e, 'esop', 'Pool BSPCE (salariés)', 0.03, 'BSPCE promis aux premiers salariés (3 %)', 'Une promesse orale tenue coûte de la dilution, mais pas de démission.'); bouger(e, { equipe: 10 }); } },
  },
  {
    id: 'salaires-marche', qui: 'cto', delai: 20, cond: (e) => e.etape >= 1,
    texte: "« Le marché s'est envolé : les grands groupes paient 20 % de plus. Toute l'équipe tech demande une augmentation de 10 %. Collectivement. »",
    g: { label: 'Refuser', effet: (e) => bouger(e, { equipe: -14, produit: -5 }) },
    h: { label: '5 % et des BSPCE', effet: (e) => { e.burn *= 1.03; bouger(e, { equipe: 4 }); } },
    d: { label: 'Accepter les 10 %', effet: (e) => { e.burn *= 1.07; bouger(e, { equipe: 9 }); } },
  },
  {
    id: 'debauchage', qui: 'cto', unique: true, cond: (e) => e.etape >= 1,
    texte: "« Le concurrent qui a levé 80 M$ propose le double de salaire à cinq de nos développeurs. Trois ont déjà passé les entretiens. »",
    g: { label: 'Laisser partir', effet: (e) => { bouger(e, { produit: -15, equipe: -8 }); e.burn -= 12_000; } },
    h: { label: 'Rétention en BSPCE (2 %)', effet: (e) => { emettreA(e, 'esop', 'Pool BSPCE (salariés)', 0.02, 'BSPCE de rétention (2 %)', 'Pour garder l’équipe, on émet des BSPCE : la dilution est le prix de la fidélité.'); bouger(e, { equipe: 6 }); } },
    d: { label: 'Aligner les salaires', effet: (e) => { e.burn += 25_000; bouger(e, { equipe: 8 }); } },
  },

  // ───────── Produit, clients, risques ─────────
  {
    id: 'pivot-b2b', qui: 'ines', unique: true, cond: (e) => e.mois >= 10 && e.mois <= 40,
    texte: "« Nos utilisateurs nous adorent mais ne paient pas assez. Les entreprises, elles, paieraient dix fois plus. On pivote vers le B2B ? Ça veut dire tout refaire pendant six mois. »",
    g: { label: 'Rester grand public', effet: (e) => bouger(e, { produit: 3 }) },
    d: { label: 'Pivoter vers les entreprises', effet: (e) => { e.mrr *= 0.6; e.croissanceBonus += 0.02; bouger(e, { produit: -10, equipe: -6 }); programmer(e, 'pivot-bilan', 6, 'Vous avez pivoté vers les entreprises'); } },
  },
  {
    id: 'v2-bugs', qui: 'cto', delai: 24, cond: (e) => e.mois >= 6,
    texte: "« La version 2 est prête à 80 %. Le salon où sont tous nos clients a lieu dans trois semaines. On lance quand même ? »",
    g: { label: 'Repousser de trois mois', effet: (e) => { e.croissanceBonus -= 0.015; bouger(e, { produit: 8, investisseurs: -4 }); } },
    d: { label: 'Lancer au salon', effet: (e) => { e.croissanceBonus += 0.04; bouger(e, { investisseurs: 5 }); programmer(e, 'v2-incidents', 2, 'Vous avez lancé la v2 inachevée'); } },
  },
  {
    id: 'rancongiciel', qui: 'cto', unique: true, cond: (e) => e.mois >= 12,
    texte: "« Tous nos serveurs sont chiffrés. Un message demande 120 000 € en bitcoins sous 48 heures. Nos sauvegardes ont trois semaines. »",
    g: { label: 'Restaurer les sauvegardes', effet: (e) => { e.mrr *= 0.88; bouger(e, { produit: -8, equipe: -6 }); } },
    h: { label: 'Porter plainte et prévenir les clients', effet: (e) => { e.mrr *= 0.92; e.tresorerie -= 30_000; bouger(e, { investisseurs: 4, equipe: -3 }); } },
    d: { label: 'Payer la rançon', effet: (e) => { e.tresorerie -= 120_000; programmer(e, 'rancon-recidive', 4, 'Vous avez payé la rançon'); } },
  },
  {
    id: 'brevet', qui: 'avocat', unique: true, cond: (e) => e.mrr > 30_000,
    texte: "« Une société qui ne fabrique rien vous accuse de violer son brevet de 2009 sur “un bouton pour valider un formulaire”. Elle propose de transiger à 150 000 €. Un procès coûterait autant, sur deux ans. »",
    g: { label: 'Se battre', effet: (e) => { e.burn += 6_000; programmer(e, 'brevet-proces', 8, 'Vous avez refusé de transiger sur le brevet'); } },
    d: { label: 'Transiger', effet: (e) => { e.tresorerie -= 150_000; bouger(e, { equipe: -2 }); } },
  },
  {
    id: 'client-faillite', qui: 'marche', delai: 30, cond: (e) => e.mrr > 20_000,
    texte: (e) => `Votre plus gros client est placé en redressement judiciaire. Il vous doit ${k(Math.max(40_000, e.mrr * 2))} de factures.`,
    g: { label: 'Déclarer la créance et attendre', effet: (e) => { e.tresorerie -= Math.max(40_000, e.mrr * 2); e.mrr *= 0.9; } },
    d: { label: 'Continuer à le servir gratuitement', effet: (e, rng) => { e.tresorerie -= Math.max(40_000, e.mrr * 2); if (rng() < 0.5) { e.mrr *= 0.97; bouger(e, { produit: 2 }); } else e.mrr *= 0.88; } },
  },
  {
    id: 'plateforme', qui: 'marche', unique: true, cond: (e) => e.mois >= 8,
    texte: "Un géant du numérique propose d'intégrer votre produit dans sa boutique d'applications, mise en avant comprise. Il prend 30 % et fixe seul les règles.",
    g: { label: 'Rester indépendant', effet: (e) => bouger(e, { investisseurs: -3 }) },
    d: { label: 'Signer', effet: (e) => { e.croissanceBonus += 0.06; e.mrr *= 0.92; e.drapeaux.dependance = true; programmer(e, 'plateforme-regles', 10, 'Vous dépendez de la plateforme d’un géant'); } },
  },
  {
    id: 'licence', qui: 'corporate', unique: true, cond: (e) => e.mois >= 12,
    texte: "« Nous aimerions une licence de votre technologie pour un usage interne : 400 000 € tout de suite. Usage interne, promis. »",
    g: { label: 'Refuser', effet: () => {} },
    d: { label: 'Signer la licence', effet: (e) => { e.tresorerie += 400_000; noter(e, { type: 'clause', titre: 'Licence de 400 k€ à Hexaflow', texte: 'De l’argent non dilutif, mais votre technologie est maintenant entre les mains d’un géant.' }); programmer(e, 'licence-copie', 9, 'Vous avez vendu une licence à Hexaflow'); } },
  },
  {
    id: 'rachat-concurrent', qui: voixDuBoard, unique: true, cond: (e) => e.etape >= 2,
    texte: "« Un petit concurrent est à court d'argent. Son équipe est bonne, ses clients aussi. On peut le racheter en cash ou en actions. »",
    g: { label: 'Laisser couler', effet: (e) => bouger(e, { investisseurs: -2 }) },
    h: { label: 'Payer en cash', effet: (e) => { e.tresorerie -= 700_000; e.mrr *= 1.25; e.burn += 35_000; programmer(e, 'integration', 4, 'Vous avez racheté un concurrent'); } },
    d: {
      label: 'Payer en actions (8 %)',
      effet: (e) => {
        emettreA(e, 'concurrent', 'Fondateurs du concurrent racheté', 0.08, 'Rachat d’un concurrent en actions (8 %)', 'Pas un euro dépensé, mais 8 % du capital pour les fondateurs rachetés. C’est une dilution comme une autre.');
        e.mrr *= 1.25; e.burn += 35_000;
        programmer(e, 'integration', 4, 'Vous avez racheté un concurrent');
      },
      diluteVisible: true,
    },
  },
  {
    id: 'client-bsa', qui: 'corporate', unique: true, cond: (e) => e.mois >= 6,
    texte: "« Nous signons un contrat de 200 k€ par an, à une condition : des BSA pour 3 % de votre capital. Nous voulons profiter de votre croissance, puisque nous y contribuons. »",
    g: { label: 'Refuser', effet: () => {} },
    d: {
      label: 'Accepter',
      effet: (e) => {
        e.mrr += 17_000;
        emettreA(e, 'client-bsa', 'Hexaflow (BSA client)', 0.03, 'BSA donnés à un client (3 %)', 'Un client devient actionnaire. S’il part, il garde ses BSA.');
        programmer(e, 'client-bsa-depart', 9, 'Vous avez donné 3 % à un client');
      },
      diluteVisible: true,
    },
  },

  // ───────── Financements, fiscalité ─────────
  {
    id: 'jei', qui: 'avocat', unique: true, cond: (e) => e.mois >= 4,
    texte: "« Le statut de Jeune entreprise innovante réduit vos charges sociales sur la R&D. On peut déclarer vos développeurs à 100 % en R&D… ce qui est généreux. Ou à 50 %, ce qui est exact. »",
    g: { label: 'Ne rien demander', effet: () => {} },
    h: { label: 'Déclarer 50 %, l’exact', effet: (e) => { e.burn *= 0.96; } },
    d: { label: 'Déclarer 100 %', effet: (e) => { e.burn *= 0.92; programmer(e, 'controle-fiscal', 14, 'Vous avez déclaré 100 % de R&D'); } },
  },
  {
    id: 'eic', qui: 'bpi', unique: true, cond: (e) => e.etape >= 1 && e.etape <= 2,
    texte: "« L'EIC Accelerator, le programme européen, peut vous donner 2,5 M€ de subvention, et son fonds peut investir à côté. Le dossier prend six mois et un consultant à 40 k€. »",
    g: { label: 'Trop lourd', effet: () => {} },
    d: { label: 'Candidater', effet: (e) => { e.tresorerie -= 40_000; bouger(e, { equipe: -4 }); programmer(e, 'eic-resultat', 6, 'Vous avez candidaté à l’EIC Accelerator'); } },
  },
  {
    id: 'pont-insiders', qui: voixDuBoard, force: true, unique: true, cond: (e) => e.etape >= 1 && runway(e) < 12 && !e.levee && e.derniere,
    texte: (e) => `« Le marché est fermé. Nous pouvons remettre de l'argent nous-mêmes, mais à la moitié du prix de la dernière levée, soit ${k(e.derniere.postMoney * 0.5)} de valorisation. Ou un BSA AIR sans plafond avec 30 % de décote. »`,
    g: { label: 'Couper 40 % des dépenses', effet: (e) => { e.burn *= 0.6; bouger(e, { equipe: -20, produit: -6 }); } },
    h: {
      label: 'BSA AIR à 30 % de décote',
      effet: (e) => {
        const montant = Math.round((e.burn * 8) / 50_000) * 50_000;
        e.notes.push({ id: `pont-insiders-${e.mois}`, nom: 'Pont des investisseurs (BSA AIR, 30 %)', montant, decote: 0.3, plafondValo: null });
        e.tresorerie += montant;
        noter(e, { type: 'clause', titre: `Pont de ${k(montant)} en BSA AIR, décote 30 %`, texte: 'Rien ne bouge aujourd’hui ; la note se convertira avec 30 % de réduction au prochain tour.', terme: 'bsaair', cachee: true });
      },
    },
    d: {
      label: 'Down round à moitié prix',
      effet: (e) => {
        const montant = Math.round((e.burn * 10) / 50_000) * 50_000;
        const c = e.derniere.conditions ?? { multiple: 1, participatif: false, plafond: null, antiDilution: 'moyenne' };
        const o = { id: `pont-${e.mois}`, nom: 'Pont des investisseurs actuels', serie: 'Pont', etapeCible: e.etape, montant, preMoney: e.derniere.postMoney * 0.5, ...c, autres: [], sieges: 0 };
        const calcul = { type: 'levee', ...JSON.parse(JSON.stringify(decrypter(e, o))) };
        const r = lever(e.table, { ...o, notes: e.notes });
        diluer(e, r.table, { titre: 'Down round à moitié prix', texte: 'Le prix par action baisse : toutes les clauses d’anti-dilution se déclenchent.', calcul });
        e.notes = [];
        e.tresorerie += montant;
        e.derniere = { ...e.derniere, prix: r.prix, postMoney: r.postMoney, mois: e.mois };
        bouger(e, { investisseurs: 6, equipe: -6 });
      },
      diluteVisible: true,
    },
  },
];

export const SUITES_DILEMMES = [
  suite({
    id: 'ceo-externe-bilan', qui: voixDuBoard,
    texte: "« Votre nouveau CEO a restructuré l'équipe commerciale et coupé deux projets à vous. Les chiffres sont meilleurs. L'équipe, elle, demande ce que vous faites encore là. »",
    g: { label: 'Partir et garder mes actions', effet: (e) => vendre(e, { prix: Math.round((e.derniere?.postMoney ?? 2e6) / 1e5) * 1e5, acheteur: 'personne' }, 'depart') },
    d: { label: 'Rester et travailler avec lui', effet: (e) => { e.mrr *= 1.1; bouger(e, { equipe: -6, investisseurs: 8 }); } },
  }),
  suite({
    id: 'julien-suite', qui: 'ines',
    texte: "« Deux développeurs seniors ont démissionné : ils disent qu'ils en ont assez de refaire le travail de Julien. Et Julien, lui, demande une augmentation. »",
    g: { label: 'Le garder encore', effet: (e) => bouger(e, { equipe: -15, produit: -8 }) },
    d: { label: 'S’en séparer, enfin', effet: (e) => bouger(e, { equipe: 4 }) },
  }),
  suite({
    id: 'scandale-rh', qui: 'marche',
    texte: "Une enquête de presse paraît : « Dans cette start-up, le harcèlement couvert par la direction ». Le témoignage des deux salariées est accablant. Vos investisseurs sont cités.",
    g: { label: 'Licencier le commercial maintenant', effet: (e) => { e.mrr *= 0.8; bouger(e, { investisseurs: -20, equipe: -10 }); } },
    d: { label: 'Démentir', effet: (e) => { e.mrr *= 0.75; bouger(e, { investisseurs: -30, equipe: -25 }); } },
  }),
  suite({
    id: 'enquete-rh', qui: 'avocat',
    texte: "« Le rapport d'enquête est clair : les faits sont établis. Le commercial doit partir. Ses clients aussi, probablement. »",
    g: { label: 'Le garder quand même', effet: (e) => { bouger(e, { equipe: -25 }); programmer(e, 'scandale-rh', 3, 'Vous avez gardé le commercial malgré l’enquête'); } },
    d: { label: 'Le licencier', effet: (e) => { e.mrr *= 0.85; bouger(e, { equipe: 12, investisseurs: 4 }); } },
  }),
  suite({
    id: 'depart-anciens', qui: 'cto',
    texte: "« Trois des cinq premiers salariés partent ensemble. Ils montent leur boîte, sur le même marché. Avec ce qu'ils savent de notre produit. »",
    g: { label: 'Menacer de poursuites', effet: (e) => { e.tresorerie -= 30_000; bouger(e, { equipe: -6 }); } },
    d: { label: 'Leur souhaiter bonne chance', effet: (e) => { e.croissanceBonus -= 0.02; bouger(e, { produit: -8 }); } },
  }),
  suite({
    id: 'pivot-bilan', qui: 'ines',
    texte: (e) => (e.jauges.produit > 45
      ? "« Le pivot marche : les entreprises signent et paient. On a perdu nos fans, mais on a trouvé des clients. »"
      : "« Le pivot patine : les entreprises veulent des fonctionnalités qu'on n'a pas, et nos anciens utilisateurs sont partis. »"),
    g: { label: (e) => (e.jauges.produit > 45 ? 'Accélérer sur le B2B' : 'Revenir au grand public'), effet: (e) => { if (e.jauges.produit > 45) { e.croissanceBonus += 0.04; e.burn += 10_000; } else { e.mrr *= 0.8; bouger(e, { equipe: -10 }); } } },
    d: { label: (e) => (e.jauges.produit > 45 ? 'Consolider' : 'Persister'), effet: (e) => { if (e.jauges.produit > 45) bouger(e, { produit: 5 }); else { e.croissanceBonus += 0.01; bouger(e, { produit: 6, investisseurs: -6 }); } } },
  }),
  suite({
    id: 'v2-incidents', qui: 'cto',
    texte: "« La v2 plante tous les jours. Les clients du salon nous inondent de tickets, et deux grands comptes menacent de résilier. »",
    g: { label: 'Tout arrêter pour corriger', effet: (e) => { e.croissanceBonus -= 0.03; bouger(e, { produit: 8, equipe: -6 }); } },
    d: { label: 'Corriger au fil de l’eau', effet: (e) => { e.mrr *= 0.88; bouger(e, { produit: -10, equipe: -8 }); } },
  }),
  suite({
    id: 'rancon-recidive', qui: 'cto',
    texte: "« Ils sont revenus. Même groupe, même faille : quand on paie, on est sur la liste des clients fiables. Ils demandent le double. »",
    g: { label: 'Restaurer, cette fois', effet: (e) => { e.mrr *= 0.85; bouger(e, { produit: -10, investisseurs: -6 }); } },
    d: { label: 'Payer encore', effet: (e) => { e.tresorerie -= 240_000; bouger(e, { investisseurs: -10, equipe: -6 }); } },
  }),
  suite({
    id: 'brevet-proces', qui: 'avocat',
    texte: (e) => `« Jugement rendu. ${e.mois % 2 === 0 ? 'Nous avons gagné : le brevet est annulé, et l’autre partie paie une partie de nos frais.' : 'Nous avons perdu en première instance : 350 000 € de dommages, ou un appel à 80 000 € de plus.'} »`,
    g: { label: (e) => (e.mois % 2 === 0 ? 'Savourer' : 'Faire appel'), effet: (e) => { e.burn -= 6_000; if (e.mois % 2 === 0) { e.tresorerie += 60_000; bouger(e, { equipe: 5 }); } else { e.tresorerie -= 80_000; programmer(e, 'brevet-appel', 6, 'Vous avez fait appel'); } } },
    d: { label: (e) => (e.mois % 2 === 0 ? 'Communiquer sur la victoire' : 'Payer les 350 k€'), effet: (e) => { e.burn -= 6_000; if (e.mois % 2 === 0) bouger(e, { investisseurs: 6 }); else e.tresorerie -= 350_000; } },
  }),
  suite({
    id: 'brevet-appel', qui: 'avocat',
    texte: "« L'appel est gagné : la cour juge le brevet trivial. Vous ne devez rien. Ma facture, en revanche… »",
    g: { label: 'Payer l’avocat', effet: (e) => { e.tresorerie -= 30_000; bouger(e, { investisseurs: 5 }); } },
    d: { label: 'Négocier la facture', effet: (e) => { e.tresorerie -= 15_000; } },
  }),
  suite({
    id: 'plateforme-regles', qui: 'marche', cond: (e) => e.drapeaux.dependance,
    texte: "La plateforme change ses règles du jour au lendemain : vos produits sont déréférencés au profit de sa propre application, lancée la semaine dernière. Elle vous ressemble beaucoup.",
    g: { label: 'Reconstruire nos canaux', effet: (e) => { e.mrr *= 0.65; e.burn += 10_000; e.drapeaux.dependance = false; bouger(e, { investisseurs: -10 }); } },
    d: { label: 'Saisir l’Autorité de la concurrence', effet: (e) => { e.mrr *= 0.6; e.tresorerie -= 50_000; bouger(e, { investisseurs: -6, equipe: 4 }); } },
  }),
  suite({
    id: 'licence-copie', qui: 'marche',
    texte: "Hexaflow lance un produit concurrent du vôtre, « développé en interne ». Il ressemble trait pour trait à votre technologie, licence comprise.",
    g: { label: 'Attaquer pour violation de la licence', effet: (e) => { e.tresorerie -= 60_000; bouger(e, { produit: 4 }); } },
    d: { label: 'Se différencier', effet: (e) => { e.mrr *= 0.85; bouger(e, { produit: 8 }); } },
  }),
  suite({
    id: 'integration', qui: 'ines',
    texte: "« Les deux équipes ne se supportent pas : deux façons de coder, deux cultures, deux machines à café. Leurs meilleurs développeurs veulent partir. »",
    g: { label: 'Imposer notre façon de faire', effet: (e) => { e.mrr *= 0.9; bouger(e, { equipe: -10 }); } },
    d: { label: 'Un séminaire et des primes d’intégration', effet: (e) => { e.tresorerie -= 60_000; bouger(e, { equipe: 6, produit: 4 }); } },
  }),
  suite({
    id: 'client-bsa-depart', qui: 'corporate',
    texte: "« Nous ne renouvelons pas le contrat : changement de stratégie groupe. Nous gardons évidemment nos BSA, c'était dans l'accord. »",
    g: { label: 'Leur proposer de racheter les BSA', effet: (e) => { e.mrr = Math.max(0, e.mrr - 17_000); e.tresorerie -= 120_000; diluer(e, annuler(e.table, 'client-bsa', Infinity), { titre: 'Rachat des BSA du client', texte: 'Vous rachetez les BSA du client : relution, payée en trésorerie.' }); } },
    d: { label: 'Les laisser au capital', effet: (e) => { e.mrr = Math.max(0, e.mrr - 17_000); bouger(e, { investisseurs: -4 }); } },
  }),
  suite({
    id: 'controle-fiscal', qui: 'avocat',
    texte: "« L'administration fiscale contrôle votre statut de Jeune entreprise innovante. Vos développeurs passaient visiblement 100 % de leur temps en R&D… y compris le support client. »",
    g: { label: 'Contester', effet: (e, rng) => { e.tresorerie -= 25_000; if (rng() < 0.4) noter(e, { type: 'evenement', titre: 'Contrôle classé', texte: 'Le contrôleur se contente d’un redressement symbolique.' }); else { e.tresorerie -= 180_000; bouger(e, { investisseurs: -10 }); } } },
    d: { label: 'Payer le redressement', effet: (e) => { e.tresorerie -= 150_000; e.burn /= 0.92; bouger(e, { investisseurs: -5 }); } },
  }),
  suite({
    id: 'eic-resultat', qui: 'bpi',
    texte: (e) => (e.jauges.produit >= 50
      ? "« Félicitations : l'EIC vous accorde 2,5 M€ de subvention ! Son fonds propose aussi d'investir 3 M€, en actions ordinaires, sans siège. »"
      : "« Le jury EIC salue votre dossier… et le refuse. Note : 11,5 sur 15, il fallait 13. Vous pouvez recandidater dans un an. »"),
    g: { label: (e) => (e.jauges.produit >= 50 ? 'La subvention seule' : 'Tant pis'), effet: (e) => { if (e.jauges.produit >= 50) { e.tresorerie += 2.5e6; noter(e, { type: 'clause', titre: 'Subvention EIC de 2,5 M€', texte: 'Le financement non dilutif le plus important d’Europe pour une start-up.' }); } else bouger(e, { equipe: -3 }); } },
    d: {
      label: (e) => (e.jauges.produit >= 50 ? 'Subvention et investissement' : 'Recandidater plus tard'),
      effet: (e) => {
        if (e.jauges.produit < 50) return;
        e.tresorerie += 5.5e6;
        const T = total(e.table);
        const prix = (e.derniere?.prix ?? prixAction(e)) * 1.1;
        diluer(e, emettre(e.table, { id: 'eic-fonds', nom: 'Fonds EIC (actions ordinaires)', actions: 3e6 / prix }), { titre: 'Le fonds EIC investit 3 M€', texte: `Des actions ordinaires, sans préférence de liquidation, à ${prix.toFixed(2)} € l’action : la dilution la plus « propre » possible.` });
        noter(e, { type: 'clause', titre: 'Subvention EIC de 2,5 M€', texte: 'Le financement non dilutif le plus important d’Europe pour une start-up.' });
        void T;
      },
    },
  }),
];

// Liens supplémentaires vers des suites déjà existantes : [carte, option, suite, délai, rappel]
export const LIENS_DILEMMES = [
  ['crise', 0, 'pont-insiders', 3, 'La crise a fermé le marché'],
  ['crise', 1, 'pont-insiders', 3, 'La crise a fermé le marché'],
  ['crise', 2, 'pont-insiders', 3, 'La crise a fermé le marché'],
];
