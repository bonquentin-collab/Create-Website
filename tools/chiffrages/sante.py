import sys
from commun import *
from verification import SANTE as VERIF, RETRAITES as VR
VS = {**index_verif(VR), **index_verif(VERIF)}
ALIAS = {"csgNorm": "taux_reduit", "assN": "ass", "assM": "ass", "repN": "rep_exonere", "repM": "rep_exonere"}

sr = P["sr"]; st = P["sante"]; csg = P["prel"]["csg"]; G = P["gel"]; N = P["ndv"]
wb = nouveau()
lisez_moi(wb, "Chiffrage de l'espace Santé", [
    ("Contenu",),
    "Leviers : CSG des pensions au taux normal alignée sur les salaires, cotisation maladie sur les pensions de base, bouclier santé ; recettes, coût, effet sur le déficit de la branche maladie, perdants et gagnants.",
    "Usagers : leviers sur les plus gros consommateurs de soins et les complémentaires (franchises et participations, ticket modérateur, ALD, dépassements d'honoraires, TSA, forfait social des contrats d'entreprise) ; qui paie (patients, primes, employeurs, médecins) et combien par âge.",
    "Effort : taux d'effort pour la santé par niveau de vie, actifs et retraités (Drees, ER 1345, tableau C), et ce qu'ajoutent la CSG et la cotisation choisies.",
    "Bouclier : groupes de ménages classés par taux d'effort en primes et restes à charge (Drees, encadré 3), découpage des tops, profil linéaire et coût du plafond choisi.",
    "Sources : références de chaque donnée.",
    ("Vérification",),
    "Avec les réglages par défaut du site, les résultats sont ceux du site. Le coût du bouclier est calculé ici en forme exacte (intégrale d'un profil linéaire) ; le site l'approche par 200 points par groupe : écart négligeable (voir la feuille Bouclier).",
    ("Limites",),
    "Coût du bouclier : revenus supposés égaux entre groupes, ce qui le majore probablement ; aucun effet de comportement. Part de chaque niveau de vie soumise à chaque taux de CSG : estimation du site d'après les seuils de CSG.",
    "Franchises : modèle log-normal par âge calé sur les franchises observées (Drees, 2023) ; il retrouve à 5 % près les chiffrages officiels (2,3 Md€ et 0,75 Md€). Les autres leviers supposent une répercussion complète sur les primes (TSA) et aucun report des médecins sur leurs tarifs (taxe sur les dépassements).",
])

# Cellules de la feuille Usagers reprises ailleurs (voir plus bas).
UT = {"recettes": "Usagers!$B$54", "patients": "Usagers!$C$54", "primes": "Usagers!$D$54", "employeurs": "Usagers!$E$54", "retraites": "Usagers!$B$57",
      "dPatA": "Usagers!$B$59", "dPatR": "Usagers!$B$60", "dPrimA": "Usagers!$B$61", "dPrimR": "Usagers!$B$62", "basePatA": "Usagers!$B$63", "basePatR": "Usagers!$B$64",
      "basePrimA": "Usagers!$B$65", "basePrimR": "Usagers!$B$66", "revA": "Usagers!$B$67", "rho": "Usagers!$B$68"}

# ---------- Leviers ----------
l = feuille(wb, "Leviers", "Faire contribuer davantage les retraités qui le peuvent, protéger ceux pour qui la santé coûte le plus", None, [62, 18, 18, 56, 60])
ent = [("csg", "Aligner la CSG des pensions au taux normal sur celle des salaires", "Oui", None, ["Oui", "Non"]),
       ("cot", "Cotisation maladie sur les pensions de base (retraités au taux médian ou normal)", 0.01, PCT1, None),
       ("bou", "Créer un bouclier santé", "Oui", None, ["Oui", "Non"]),
       ("plaf", "Plafond d'effort en primes et restes à charge (% du revenu)", 10, '0.0', None),
       ("pen", "Votre pension brute mensuelle totale (€)", 2500, EUR, None),
       ("taux", "Votre taux de CSG", "normal", None, ["exonere", "reduit", "median", "normal"])]
e = {}
for i, (k, lib, v, fmt, opts) in enumerate(ent, start=4):
    texte(l, f"A{i}", lib, wrap=True); entree(l, f"B{i}", v, fmt)
    if opts: liste(l, f"B{i}", opts)
    e[k] = f"Leviers!$B${i}"
texte(l, "A10", "Paramètres", gras=True)
par = [("csgAct", "Taux de CSG sur les revenus d'activité", csg["activite"]["taux"], PCT1, "Code de la sécurité sociale, art. L136-8"),
       ("csgNorm", "Taux normal de CSG sur les pensions", [t for t in csg["retraites"]["taux"] if t["id"] == "normal"][0]["taux"], PCT1, csg["retraites"]["source"]),
       ("assN", "Assiette des pensions au taux normal (Md€)", csg["retraites"]["assiettes"]["normal"], NB1, "Estimation du site, calibrée sur les recettes de CSG 2025 (CCSS, mai 2026)"),
       ("assM", "Assiette des pensions au taux médian (Md€)", csg["retraites"]["assiettes"]["median"], NB1, "Idem"),
       ("base", "Part de la pension venant des régimes de base", G["partBase"], PCT1, G["ipp"]["source"]),
       ("partP", "Part des pensions dans le revenu des retraités", N["composition"]["partPensions"], PCT1, N["composition"]["source"]),
       ("ret", "Retraités de droit direct", G["retraites"]["valeur"], NB, G["retraites"]["source"]),
       ("repN", "Part des retraités au taux normal", csg["retraites"]["repartitionRetraites"]["normal"], PCT1, csg["retraites"]["repartitionRetraites"]["source"]),
       ("repM", "Part des retraités au taux médian", csg["retraites"]["repartitionRetraites"]["median"], PCT1, csg["retraites"]["repartitionRetraites"]["source"]),
       ("def", "Solde de la branche maladie du régime général, 2026 (Md€)", sr["deficitMaladie"]["valeur"], NB1, sr["deficitMaladie"]["source"]),
       ("cotC", "Cotisation maladie existante sur les complémentaires", sr["cotisationMaladie"]["complementaires"], PCT1, sr["cotisationMaladie"]["source"])]
entete(l, 11, ["Paramètre", "Valeur", "Type", "Comment c'est calculé", "Source"])
for i, (k, lib, v, fmt, src) in enumerate(par, start=12):
    texte(l, f"A{i}", lib, wrap=True); entree(l, f"B{i}", v, fmt, cle=False); texte(l, f"E{i}", src, wrap=True)
    colonnes_verif(l, i, VS.get(ALIAS.get(k, k)), "C", "D")
    e[k] = f"Leviers!$B${i}"
r0 = 25
texte(l, f"A{r0-1}", "Résultats", gras=True)
res = [
    ("rcsg", "Recettes de la CSG alignée (Md€)", f'=IF({e["csg"]}="Oui",{e["assN"]}*({e["csgAct"]}-{e["csgNorm"]}),0)', MD2, False),
    ("rcot", "Recettes de la cotisation maladie (Md€)", f'={e["cot"]}*({e["assM"]}+{e["assN"]})*{e["base"]}', MD2, False),
    ("rtot", "Ce que les retraités versent en plus (Md€)", f"=B{r0}+B{r0+1}", MD2, True),
    ("rus", "Autres leviers : gros consommateurs et complémentaires (Md€, feuille Usagers)", f"={UT['recettes']}", MD2, False),
    ("cout", "Coût du bouclier (Md€), recalculé sur les efforts relevés par les autres leviers", f'=IF({e["bou"]}="Oui",Bouclier!$C$44,0)', MD2, True),
    ("net", "Effet net pour l'Assurance maladie (Md€)", f"=B{r0+2}+B{r0+3}-B{r0+4}", MD2, True),
    ("pdef", "Part du déficit 2026 comblée", f"=IF(B{r0+5}>0,B{r0+5}/ABS({e['def']}),0)", PCT1, False),
    ("menages", "Ménages protégés par le bouclier", f'=IF({e["bou"]}="Oui",Bouclier!$C$45,0)', NB, False),
    ("pret", "Part de l'aide pour des ménages de retraités", f'=IF({e["bou"]}="Oui",Bouclier!$C$46,0)', PCT1, False),
    ("pmod", "… dont retraités modestes", f'=IF({e["bou"]}="Oui",Bouclier!$C$47,0)', PCT1, False),
    ("perd", "Retraités qui paient plus", f'=MAX(IF({e["csg"]}="Oui",{e["repN"]},0),IF({e["cot"]}>0,{e["repN"]}+{e["repM"]},0))*{e["ret"]}', NB, False),
    ("solde", "Solde pour les retraités : versé en plus (CSG, cotisation, autres leviers), net de ce que le bouclier leur rend (Md€)", f"=B{r0+2}+{UT['retraites']}-B{r0+4}*B{r0+8}", MD2, True),
    ("perte", "Votre perte (€ brut par mois)", f'={e["pen"]}*(IF(AND({e["csg"]}="Oui",{e["taux"]}="normal"),{e["csgAct"]}-{e["csgNorm"]},0)+IF(OR({e["taux"]}="median",{e["taux"]}="normal"),{e["cot"]}*{e["base"]},0))', EUR2, True),
]
for i, (k, lib, f, fmt, cle) in enumerate(res, start=r0):
    texte(l, f"A{i}", lib, wrap=True); formule(l, f"B{i}", f, fmt, gras=cle, res=cle, lien="Bouclier" in f or "Usagers" in f)

# ---------- Effort ----------
ef = feuille(wb, "Effort", "Taux d'effort pour la santé, avant et après (en % du revenu)", "Drees, ER 1345, tableau complémentaire C (Ines-Omar 2019) ; ajout de la réforme : estimation du site.", [22, 30, 11, 11, 11, 11, 13, 13, 13, 13])
entete(ef, 4, ["Niveau de vie", "Champ", "Sécurité sociale", "Primes", "Restes à charge", "Total avant", "Part exposée au taux normal", "Part exposée au taux médian ou normal", "Ajout CSG et cotisation (points)", "Ajout des autres leviers (points)"])
eff = st["effort"]; ex = sr["exposition"]
x = 5
lignes_ret = []
for i, nv in enumerate(eff["niveaux"]):
    for champ, gr in [("Actifs en emploi", eff["actifs"]), ("Retraités", eff["retraites"])]:
        texte(ef, f"A{x}", nv["label"]); texte(ef, f"B{x}", f"{champ} ({nv['aide']})", wrap=True)
        entree(ef, f"C{x}", gr["amo"][i], '0.00', cle=False); entree(ef, f"D{x}", gr["primes"][i], '0.00', cle=False); entree(ef, f"E{x}", gr["reste"][i], '0.00', cle=False)
        formule(ef, f"F{x}", f"=SUM(C{x}:E{x})", '0.00')
        if champ == "Retraités":
            entree(ef, f"G{x}", ex["tauxNormal"][i], PCT1); entree(ef, f"H{x}", ex["tauxMedianOuNormal"][i], PCT1)
            formule(ef, f"I{x}", f'=100*{e["partP"]}*(IF({e["csg"]}="Oui",{e["csgAct"]}-{e["csgNorm"]},0)*G{x}+{e["cot"]}*{e["base"]}*H{x})', '0.00')
            lignes_ret.append(x)
            formule(ef, f"J{x}", f"=E{x}*{UT['dPatR']}/{UT['basePatR']}+D{x}*{UT['dPrimR']}/{UT['basePrimR']}", '0.00', lien=True)
        else:
            formule(ef, f"I{x}", "=0", '0.00')
            formule(ef, f"J{x}", f"=E{x}*{UT['dPatA']}/{UT['basePatA']}+D{x}*{UT['dPrimA']}/{UT['basePrimA']}+100*{UT['employeurs']}/{UT['revA']}", '0.00', lien=True)
        x += 1
entete(ef, x + 1, ["Niveau de vie", "", "Actifs avant", "Retraités avant", "Retraités après", "Écart actifs − retraités avant", "Écart après", "Actifs après"])
for i, nv in enumerate(eff["niveaux"]):
    y = x + 2 + i; ra = lignes_ret[i]; aa = ra - 1
    texte(ef, f"A{y}", nv["label"])
    formule(ef, f"C{y}", f"=F{aa}", '0.00'); formule(ef, f"D{y}", f"=F{ra}", '0.00'); formule(ef, f"E{y}", f"=F{ra}+I{ra}+J{ra}", '0.00', gras=True, res=True)
    formule(ef, f"H{y}", f"=F{aa}+J{aa}", '0.00', gras=True, res=True)
    formule(ef, f"F{y}", f"=C{y}-D{y}", '0.00'); formule(ef, f"G{y}", f"=H{y}-E{y}", '0.00')
texte(ef, f"A{x+8}", "Exposition : part de la pension brute des retraités de chaque niveau de vie touchée par chaque levier, estimée d'après les seuils de CSG 2025 (taux normal vers 2 400 € de pension brute pour une personne seule, taux médian vers 1 550 €).", italique=True)

# ---------- Bouclier ----------
b = feuille(wb, "Bouclier", "Bouclier santé : coût et bénéficiaires", "Primes de complémentaire et restes à charge en % du revenu disponible après financement de l'AMO, ménages classés selon ce taux (Drees, ER 1345, encadré 3 et tableau G, 2019).", [22, 10, 12, 14, 14, 12, 12, 12, 12, 14, 14, 14, 14])
texte(b, "A4", "Données publiées", gras=True)
entete(b, 5, ["Groupe", "Part des ménages", "Taux d'effort moyen (%)", "Retraités modestes (%)", "Retraités médians à aisés (%)"])
dz = sr["effortPrive"]["dixiemes"]; tops = sr["effortPrive"]["tops"]
pub = [(d[0], 0.1, d[1], d[2], d[3]) for d in dz] + [(t[0], t[1], t[2], t[3], t[4]) for t in tops]
for i, (lab, part, eft, rm, ra) in enumerate(pub, start=6):
    texte(b, f"A{i}", lab); entree(b, f"B{i}", part, PCT1, cle=False); entree(b, f"C{i}", eft, '0.00', cle=False)
    entree(b, f"D{i}", rm, '0.00', cle=False); entree(b, f"E{i}", ra, '0.00', cle=False)
# lignes : D1..D9 = 6..14 ; D10 = 15 ; top5 = 16 ; top2 = 17 ; top1 = 18
texte(b, "A21", "Groupes disjoints et profil linéaire (bords choisis pour conserver la moyenne de chaque groupe ; efforts relevés de la hausse des primes et restes à charge due aux autres leviers, feuille Usagers)", gras=True)
entete(b, 22, ["Groupe", "Part", "Effort moyen", "Retraités modestes", "Retraités médians à aisés", "Bord gauche", "Bord droit", "Bas", "Haut", "Effort au-delà du plafond", "Ménages bénéficiaires (part)"])
labels = [d[0] for d in dz[:9]] + ["90 à 95 %", "95 à 98 %", "98 à 99 %", "1 % le plus exposé"]
plaf = e["plaf"]
for i, lab in enumerate(labels):
    y = 23 + i
    texte(b, f"A{y}", lab)
    if i < 9:
        s = 6 + i
        formule(b, f"B{y}", f"=B{s}", PCT1); formule(b, f"C{y}", f"=C{s}*(1+{UT['rho']})", '0.00'); formule(b, f"D{y}", f"=D{s}/100", PCT1); formule(b, f"E{y}", f"=E{s}/100", PCT1)
    elif i < 12:
        s, t = 15 + (i - 9), 16 + (i - 9)
        formule(b, f"B{y}", f"=B{s}-B{t}", PCT1)
        for col, dv in [("C", f"*(1+{UT['rho']})"), ("D", "/100"), ("E", "/100")]:
            formule(b, f"{col}{y}", f"=({col}{s}*B{s}-{col}{t}*B{t})/(B{s}-B{t}){dv}", '0.00' if col == "C" else PCT1)
    else:
        formule(b, f"B{y}", "=B18", PCT1); formule(b, f"C{y}", f"=C18*(1+{UT['rho']})", '0.00'); formule(b, f"D{y}", "=D18/100", PCT1); formule(b, f"E{y}", "=E18/100", PCT1)
    formule(b, f"F{y}", "=0" if i == 0 else f"=G{y-1}", '0.00')
    formule(b, f"G{y}", f"=MAX(0,2*C{y}-F{y})", '0.00')
    formule(b, f"H{y}", f"=MIN(F{y},G{y})", '0.00'); formule(b, f"I{y}", f"=MAX(F{y},G{y})", '0.00')
    formule(b, f"J{y}", f"=IF(I{y}<={plaf},0,IF(H{y}>={plaf},B{y}*((F{y}+G{y})/2-{plaf}),B{y}*(I{y}-{plaf})/(I{y}-H{y})*(I{y}-{plaf})/2))", '0.0000')
    formule(b, f"K{y}", f"=IF(I{y}<={plaf},0,IF(H{y}>={plaf},B{y},B{y}*(I{y}-{plaf})/(I{y}-H{y})))", '0.0000')
z = 22 + len(labels)
texte(b, f"A{z+1}", "Total", gras=True)
formule(b, f"B{z+1}", f"=SUM(B23:B{z})", PCT1); formule(b, f"C{z+1}", f"=SUMPRODUCT(B23:B{z},C23:C{z})", '0.00')
formule(b, f"J{z+1}", f"=SUM(J23:J{z})", '0.0000', gras=True); formule(b, f"K{z+1}", f"=SUM(K23:K{z})", '0.0000', gras=True)
P0 = z + 3
texte(b, f"A{P0}", "Paramètres et résultats", gras=True)
pb = [("Taux d'effort moyen publié, ensemble (%)", sr["effortPrive"]["moyenne"], '0.00', "Drees, encadré 3"),
      ("Primes et restes à charge moyens par ménage, 2019 (€)", sr["effortPrive"]["depenseMoyenneMenage"], EUR, "Drees, tableau A : 1 021 € + 387 €"),
      ("Ménages (champ de l'enquête)", sr["menages"]["valeur"], NB, sr["menages"]["source"] + " ; 2,2 personnes par ménage"),
      ("Évolution 2019 → 2024 des dépenses payées par les complémentaires et les ménages", sr["evolution2019_2024"], '0.000', "Drees, comptes de la santé : 44,3 Md€ en 2019, 52,5 Md€ en 2024")]
CALC_PB = ["Moyenne publiée des taux d'effort des dix dixièmes.", "1 021 € de primes + 387 € de restes à charge.", "63,4 millions de personnes ÷ 2,2 personnes par ménage.", "(32,52 + 19,96) ÷ (26,74 + 17,52) Md€."]
for i, (lib, v, fmt, src) in enumerate(pb, start=P0 + 1):
    texte(b, f"A{i}", lib); b.merge_cells(f"A{i}:B{i}"); entree(b, f"C{i}", v, fmt, cle=False); texte(b, f"D{i}", src)
    texte(b, f"I{i}", CALC_PB[i - P0 - 1], italique=True)
rb = [("Primes et restes à charge, 2024 (Md€)", f"=C{P0+2}*C{P0+3}*C{P0+4}/1E9", MD),
      ("Bouclier : coût (Md€)", f"=J{z+1}/C{P0+1}*C{P0+5}", MD2),
      ("Bouclier : ménages bénéficiaires", f"=K{z+1}*C{P0+3}", NB),
      ("Part de l'aide pour des ménages de retraités", f"=IF(J{z+1}>0,SUMPRODUCT(J23:J{z},D23:D{z}+E23:E{z})/J{z+1},0)", PCT1),
      ("… dont retraités modestes", f"=IF(J{z+1}>0,SUMPRODUCT(J23:J{z},D23:D{z})/J{z+1},0)", PCT1)]
for i, (lib, f, fmt) in enumerate(rb, start=P0 + 5):
    texte(b, f"A{i}", lib); b.merge_cells(f"A{i}:B{i}"); formule(b, f"C{i}", f, fmt, gras=i > P0 + 5, res=i > P0 + 5)
texte(b, f"A{P0+12}", "Avec les autres leviers, efforts et dépense totale sont relevés du même facteur (1 + ρ) : le rapport effort ÷ moyenne × dépense totale reste juste.", italique=True)
texte(b, f"A{P0+11}", "Coût = (effort au-delà du plafond) ÷ (effort moyen) × dépense totale, en supposant des revenus égaux entre groupes (majorant probable : les ménages les plus exposés sont souvent modestes). Profil linéaire dans chaque groupe, intégré exactement ; le site l'approche par 200 points par groupe.", italique=True)

# ---------- Usagers ----------
import math
u = feuille(wb, "Usagers", "Les plus gros consommateurs de soins et les complémentaires santé", "Franchises, ticket modérateur, ALD, dépassements d'honoraires, TSA, forfait social des contrats d'entreprise : ce que gagne l'Assurance maladie et qui paie.", [44, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14])
VU = index_verif(VERIF)
fr = sr["franchises"]
ent_u = [("Plafond annuel des franchises et participations (€, total)", fr["plafondActuel"], EUR, None),
         ("Multiplicateur des montants unitaires (1 = actuels)", 1, '0.0', None),
         ("Ticket modérateur des consultations", sr["ticketModerateur"]["tauxActuel"], PCT1, None),
         ("ALD : cures thermales remboursées comme pour tous", "Non", None, ["Oui", "Non"]),
         ("ALD : suppression des ALD « non exonérantes »", "Non", None, ["Oui", "Non"]),
         ("Plafonnement des dépassements : baisse", 0, PCT1, None),
         ("Taxe sur les dépassements restants", 0, PCT1, None),
         ("Variation de la TSA (points)", 0, '0.0', None),
         ("Forfait social des contrats d'entreprise", sr["entreprise"]["forfaitSocial"], PCT1, None)]
texte(u, "A3", "Vos réglages", gras=True)
for i, (lib, v, fmt, opts) in enumerate(ent_u, start=4):
    texte(u, f"A{i}", lib, wrap=True); entree(u, f"B{i}", v, fmt)
    if opts: liste(u, f"B{i}", opts)
par_u = [("sigma", "Dispersion du modèle de franchises", fr["sigma"], '0.00'),
         ("fr_obs", "Multiplicateur des montants 2023 → 2024 (doublement de 2024)", fr["multiplicateur2023"], '0'),
         ("fr_obs", "Plafond total en 2023 (€)", fr["plafond2023"], EUR),
         ("franchises", "Plafond total actuel (€)", fr["plafondActuel"], EUR),
         ("tm", "Ticket modérateur actuel des consultations", sr["ticketModerateur"]["tauxActuel"], PCT1),
         ("tm", "Rendement d'un point de ticket modérateur (Md€)", sr["ticketModerateur"]["rendementParPoint"], MD2),
         ("ald", "ALD : cures thermales (Md€)", sr["ald"]["mesures"][0]["valeur"], MD2),
         ("ald", "ALD : ALD non exonérantes (Md€)", sr["ald"]["mesures"][1]["valeur"], MD2),
         ("dep", "Dépassements d'honoraires 2024 (Md€)", sr["depassements"]["total"], MD2),
         ("dep", "Part des dépassements remboursée par les complémentaires", sr["depassements"]["partComplementaires"], PCT1),
         ("sansOc", "Part de la population sans complémentaire", sr["sansComplementaire"], PCT1),
         ("tsa", "Taux de TSA", sr["tsa"]["taux"], PCT2),
         ("tsa", "Recettes de TSA 2025 (Md€)", sr["tsa"]["recettes2025"], MD2),
         ("entreprise", "Contrats d'entreprise : assiette exemptée (Md€)", sr["entreprise"]["assiette"], MD),
         ("entreprise", "Contrats d'entreprise : manque à gagner net (Md€)", sr["entreprise"]["coutNet"], MD),
         ("entreprise", "Forfait social actuel", sr["entreprise"]["forfaitSocial"], PCT1),
         ("primesAge", "Prime mensuelle à 20 ans (€)", st["primes"]["a20ans"], EUR),
         ("primesAge", "Prime mensuelle à 85 ans (€)", st["primes"]["a85ans"], EUR)]
texte(u, "A14", "Paramètres", gras=True)
entete(u, 15, ["Paramètre", "Valeur", "Type", "Comment c'est calculé"])
for i, (k, lib, v, fmt) in enumerate(par_u, start=16):
    texte(u, f"A{i}", lib, wrap=True); entree(u, f"B{i}", v, fmt, cle=False)
    colonnes_verif(u, i, VU.get(k), "C", "D")
# B16 sigma, B17 mult2023, B18 plafond2023, B19 plafond actuel, B20 TM actuel, B21 TM/pt, B22 cures, B23 nonexo, B24 dep, B25 partOC,
# B26 sansOC, B27 TSA taux, B28 TSA recettes, B29 assiette entr., B30 coût net, B31 FS actuel, B32 prime 20, B33 prime 85

# Calage du modèle de franchises par âge (fait par le site, vérifié ici : colonne F = colonne C).
def emin(mu, sg, c):
    z = (math.log(c) - mu) / sg
    Phi = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))
    return math.exp(mu + sg * sg / 2) * Phi(z - sg) + c * (1 - Phi(z))
def caler(obs):
    if obs <= 0.5: return None
    lo, hi = -15, 15
    for _ in range(80):
        m = (lo + hi) / 2
        if emin(m, fr["sigma"], fr["plafond2023"]) < obs: lo = m
        else: hi = m
    return lo
A0 = 36
entete(u, A0 - 1, ["Âge", "Personnes", "Franchises observées 2023 (€)", "Âge milieu", "Paramètre mu (calé)", "Contrôle : modèle 2023 (€)", "Franchises avant (€)", "Franchises après (€)", "Δ franchises (€/pers.)", "Ticket modérateur (€)", "Remboursement AMO (€)", "Dépassements (€)", "Prime mensuelle (€)", "Actif (21-60 ans)", "Ticket mod. (€/pers.)", "ALD (€/pers.)", "Dépassements (€/pers.)", "Primes : TSA (€/pers.)", "Contrats d'entreprise (€/pers.)", "Patients (€/pers.)", "Via les primes (€/pers.)"])
ln = st["usagers"]["lignes"]
def emin_xl(mu, c, mult="1"):
    m = f"({mu}+LN($B$17*{mult}))"
    z = f"((LN({c})-{m})/$B$16)"
    return f"EXP({m}+$B$16^2/2)*_xlfn.NORM.S.DIST({z}-$B$16,TRUE)+{c}*(1-_xlfn.NORM.S.DIST({z},TRUE))"
for i, lg in enumerate(ln):
    y = A0 + i
    nums = [int(n) for n in __import__("re").findall(r"\d+", lg["age"])]
    milieu = (nums[0] + nums[1]) / 2 if len(nums) > 1 else nums[0] + 5
    mu = caler(lg["franchises"])
    texte(u, f"A{y}", lg["age"]); entree(u, f"B{y}", lg["personnes"], NB, cle=False); entree(u, f"C{y}", lg["franchises"], EUR2, cle=False)
    entree(u, f"D{y}", milieu, '0.0', cle=False)
    if mu is None:
        texte(u, f"E{y}", "exonérés")
        for col in "FGHI": formule(u, f"{col}{y}", "=0", EUR2)
    else:
        entree(u, f"E{y}", round(mu, 6), '0.0000', cle=False)
        formule(u, f"F{y}", "=" + emin_xl(f"E{y}", "$B$18", "0.5"), EUR2)
        formule(u, f"G{y}", "=" + emin_xl(f"E{y}", "$B$19"), EUR2)
        formule(u, f"H{y}", "=" + emin_xl(f"E{y}", "$B$4", "$B$5"), EUR2)
        formule(u, f"I{y}", f"=H{y}-G{y}", EUR2)
    entree(u, f"J{y}", lg["ticketModerateur"], EUR, cle=False); entree(u, f"K{y}", lg["amo"], EUR, cle=False); entree(u, f"L{y}", lg["depassements"], EUR, cle=False)
    formule(u, f"M{y}", f"=$B$32+($B$33-$B$32)*(MIN(85,MAX(20,D{y}))-20)/65", EUR2)
    entree(u, f"N{y}", 1 if lg["age"][:2] in ("21", "31", "41", "51") else 0, '0', cle=False)
A1 = A0 + len(ln) - 1
rng = lambda c: f"${c}${A0}:${c}${A1}"
# Leviers (lignes 46 à 54)
L0 = 46
entete(u, L0 - 1, ["Levier", "Recettes Assurance maladie (Md€)", "Patients (Md€)", "Via les primes (Md€)", "Employeurs (Md€)", "Médecins (Md€)"])
lv = [
    ("Franchises et participations forfaitaires", f"=SUMPRODUCT({rng('B')},{rng('I')})/1E9", "=B{r}", "=0", "=0", "=0"),
    ("Ticket modérateur des consultations", "=MAX(0,($B$6-$B$20)*100*$B$21)", "=B{r}*$B$26", "=B{r}*(1-$B$26)", "=0", "=0"),
    ("Affections de longue durée", '=IF($B$7="Oui",$B$22,0)+IF($B$8="Oui",$B$23,0)', "=B{r}*$B$26", "=B{r}*(1-$B$26)", "=0", "=0"),
    ("Dépassements d'honoraires (baisse, puis taxe)", "=$B$10*($B$24-$B$9*$B$24)", "=-$B$9*$B$24*(1-$B$25)", "=-$B$9*$B$24*$B$25", "=0", "=$B$9*$B$24+B{r}"),
    ("TSA", "=$B$11*$B$28/($B$27*100)", "=0", "=B{r}", "=0", "=0"),
    ("Contrats d'entreprise (forfait social)", "=MIN($B$30,MAX(0,($B$12-$B$31)*$B$29))", "=0", "=0", "=B{r}", "=0"),
    ("TSA sur la variation des primes (effet croisé)", f"=(D{L0+1}+D{L0+2}+D{L0+3}+D{L0+5})*($B$27+$B$11/100)", "=0", "=B{r}", "=0", "=0"),
]
for i, (lib, *fs) in enumerate(lv):
    r = L0 + i
    texte(u, f"A{r}", lib, wrap=True)
    for col, f in zip("BCDEF", fs): formule(u, f"{col}{r}", f.format(r=r), MD2)
r = L0 + len(lv)  # 53
r = 54
texte(u, f"A{r}", "Total", gras=True)
for col in "BCDEF": formule(u, f"{col}{r}", f"=SUM({col}{L0}:{col}{L0+len(lv)-1})", MD2, gras=True, res=col == "B")
# Par âge (colonnes O à U)
for i in range(len(ln)):
    y = A0 + i
    formule(u, f"O{y}", f"=IF(SUMPRODUCT({rng('B')},{rng('J')})>0,B{L0+1}*1E9*J{y}/SUMPRODUCT({rng('B')},{rng('J')}),0)", EUR2)
    formule(u, f"P{y}", f"=IF(SUMPRODUCT({rng('B')},{rng('K')})>0,B{L0+2}*1E9*K{y}/SUMPRODUCT({rng('B')},{rng('K')}),0)", EUR2)
    formule(u, f"Q{y}", f"=-$B$9*$B$24*1E9*L{y}/SUMPRODUCT({rng('B')},{rng('L')})", EUR2)
    formule(u, f"R{y}", f"=(B{L0+4}+B{L0+6})*1E9*M{y}/SUMPRODUCT({rng('B')},{rng('M')})", EUR2)
    formule(u, f"S{y}", f"=B{L0+5}*1E9*N{y}/SUMPRODUCT({rng('B')},{rng('N')})", EUR2)
    formule(u, f"T{y}", f"=I{y}+(O{y}+P{y})*$B$26+Q{y}*(1-$B$25)", EUR2, gras=True)
    formule(u, f"U{y}", f"=(O{y}+P{y})*(1-$B$26)+Q{y}*$B$25+R{y}", EUR2, gras=True)
R0, R1 = A0 + 6, A1  # 61-70 ans et plus : âges de la retraite
ret = lambda c: f"${c}${R0}:${c}${R1}"
texte(u, "A56", "Pour les niveaux de vie (feuille Effort) et le solde des retraités", gras=True)
pr = [
    (57, "Payé par les retraités (61 ans ou plus), patients et primes (Md€)", f"=SUMPRODUCT({ret('B')},{ret('T')})/1E9+SUMPRODUCT({ret('B')},{ret('U')})/1E9"),
    (59, "Patients : payé par les actifs (Md€)", f"=C54-B60"),
    (60, "Patients : payé par les retraités (Md€)", f"=IF(SUMPRODUCT({rng('B')},{rng('T')})<>0,C54*SUMPRODUCT({ret('B')},{ret('T')})/SUMPRODUCT({rng('B')},{rng('T')}),C54*B70)"),
    (61, "Primes : payé par les actifs (Md€)", f"=D54-B62"),
    (62, "Primes : payé par les retraités (Md€)", f"=IF(SUMPRODUCT({rng('B')},{rng('U')})<>0,D54*SUMPRODUCT({ret('B')},{ret('U')})/SUMPRODUCT({rng('B')},{rng('U')}),D54*B71)"),
    (63, "Restes à charge des actifs (Md€)", f"={st['financeurs']['lignes'][2]['valeur']}*(1-B70)"),
    (64, "Restes à charge des retraités (Md€)", f"={st['financeurs']['lignes'][2]['valeur']}*B70"),
    (65, "Primes des actifs (Md€)", "=$B$28/$B$27*(1-B71)"),
    (66, "Primes des retraités (Md€)", "=$B$28/$B$27*B71"),
    (67, "Revenu disponible des actifs (Md€)", f"={P['macro']['masseSalarialeBrute']['valeur']/1e9}*{P['macro']['ratioNetSurBrut']['valeur']}/{N['composition']['partActivite']}"),
    (68, "ρ : hausse relative des primes et restes à charge (bouclier)", "=(C54+D54)/Bouclier!$C$43"),
    (70, "Part des retraités dans les restes à charge (pondération par âge)", f"=SUMPRODUCT({ret('B')},{ret('J')}+{ret('L')}+{ret('C')})/SUMPRODUCT({rng('B')},{rng('J')}+{rng('L')}+{rng('C')})"),
    (71, "Part des retraités parmi les assurés de plus de 10 ans", f"=SUM({ret('B')})/(SUM({rng('B')})-B{A0})"),
]
for rr, lib, f in pr:
    texte(u, f"A{rr}", lib, wrap=True); formule(u, f"B{rr}", f, NB3 if rr >= 68 else MD2, lien="Bouclier" in f)
texte(u, "A73", "Contrôle du modèle de franchises : la colonne F (modèle avec les règles de 2023) doit retrouver la colonne C (franchises observées). Points de contrôle officiels : doubler montants et plafonds (100 € + 100 €) par rapport aux règles de 2025 rapporte 2,3 Md€ (CCSS, mai 2026) ; doubler les seuls plafonds environ 0,75 Md€ (gouvernement, juillet 2026).", italique=True)
texte(u, "A74", "Franchises et participations payées avec les règles actuelles, selon le modèle (Md€) :")
formule(u, "B74", "=SUMPRODUCT(" + rng('B') + ",G" + str(A0) + ":G" + str(A1) + ")/1E9", MD2)
texte(u, "A75", "Rappel : avec le plafond actuel (140 €), colonne G. Les points de contrôle se vérifient en mettant 100 puis 200 € et le multiplicateur 1 ou 2 dans les réglages.", italique=True)

sources(wb, [
    ("Taux d'effort, bouclier", sr["effortPrive"]["source"], sr["effortPrive"]["url"]),
    ("Taux d'effort par niveau de vie", eff["source"], eff["url"]),
    ("Déficit de la branche maladie", sr["deficitMaladie"]["source"], sr["deficitMaladie"]["url"]),
    ("Cotisation maladie sur les complémentaires", sr["cotisationMaladie"]["source"], sr["cotisationMaladie"]["url"]),
    ("Ménages", sr["menages"]["source"], sr["menages"]["url"]),
    ("CSG des retraités", csg["retraites"]["source"], csg["retraites"]["url"]),
    ("Part des pensions de base", G["ipp"]["source"], G["ipp"]["url"]),
    ("Composition des revenus", N["composition"]["source"], None),
    ("Franchises et participations", fr["source"], fr["url"]),
    ("Dépenses et restes à charge par âge", st["usagers"]["source"], st["usagers"]["url"]),
    ("Ticket modérateur des consultations", sr["ticketModerateur"]["source"], sr["ticketModerateur"]["url"]),
    ("Hausses du ticket modérateur de 2027", sr["ticketModerateur"]["decrets2027"]["source"], sr["ticketModerateur"]["decrets2027"]["url"]),
    ("ALD", sr["ald"]["source"], sr["ald"]["url"]),
    ("Dépassements d'honoraires", sr["depassements"]["source"], sr["depassements"]["url"]),
    ("TSA", sr["tsa"]["source"], sr["tsa"]["url"]),
    ("Contrats d'entreprise", sr["entreprise"]["source"], sr["entreprise"]["url"]),
    ("Primes par âge", st["primes"]["source"], st["primes"]["url"]),
])
verification(wb, VERIF)
police_partout(wb)
wb.move_sheet("Lisez-moi", offset=-len(wb.sheetnames))
wb.save(sys.argv[1])
