import sys
from commun import *
from verification import RETRAITES as VERIF
V = index_verif(VERIF)
ALIAS = {"taux_exonere": "taux_reduit", "taux_median": "taux_reduit", "taux_normal": "taux_reduit", "rep_reduit": "rep_exonere", "rep_median": "rep_exonere", "rep_normal": "rep_exonere", "tr": "tp", "pj": "pb", "pa": "pb", "ph": "pb", "pact": "abattement", "plancher": "abattement"}
vf = lambda cle: V.get(ALIAS.get(cle, cle))

pr = P["prel"]; csg = pr["csg"]; tva = pr["tva"]; M = P["macro"]; RT = P["retraites"]; G = P["gel"]; N = P["ndv"]; RD = P["rendement"]
wb = nouveau()
lisez_moi(wb, "Chiffrage de l'espace Retraites", [
    ("Contenu",),
    "Paramètres : données communes à toutes les réformes (CSG, TVA, emploi, salaires, pensions, composition des revenus), avec leurs sources.",
    "Une feuille par réforme de Retraites › Simuler : TVA sociale, CSG des retraités, Retraites sans impôts, Gel des hautes pensions, Plafond des pensions. Chaque feuille reprend les curseurs du site (cellules jaunes).",
    "Niveaux de vie : effet de chaque réforme sur le niveau de vie médian des actifs et des retraités, et cumul des réformes choisies (Oui/Non).",
    "Rendement : pensions reçues pour 100 000 € cotisés pour une génération, calé sur le TRI du COR (calcul trimestre par trimestre).",
    "Sources : références de chaque donnée.",
    ("Vérification",),
    "Avec les réglages par défaut du site, chaque résultat est identique à celui du site (écart inférieur à 0,01 Md€ ou à 1 €).",
    ("Limites",),
    "Ordres de grandeur, sans effets de comportement. Les hypothèses du site (assiettes de CSG par taux, distribution des pensions portée à 2026, composition des revenus) sont décrites à côté de chaque valeur.",
])

# ---------- Paramètres ----------
p = feuille(wb, "Paramètres", "Paramètres communs", "Données sourcées ; modifiables (texte bleu). Détail de chaque vérification : feuille « Vérification ».", [52, 14, 18, 56, 60])
entete(p, 4, ["Paramètre", "Valeur", "Type", "Comment c'est calculé", "Source"])
PR = {}
def par(cle, lib, v, fmt, src):
    r = 5 + len(PR)
    texte(p, f"A{r}", lib, wrap=True); entree(p, f"B{r}", v, fmt, cle=False); texte(p, f"E{r}", src, wrap=True)
    colonnes_verif(p, r, vf(cle), "C", "D")
    PR[cle] = f"Paramètres!$B${r}"
par("emploi", "Personnes en emploi", M["personnesEnEmploi"]["valeur"], NB, M["personnesEnEmploi"]["source"])
par("masse", "Masse salariale brute (Md€)", M["masseSalarialeBrute"]["valeur"] / 1e9, NB1, M["masseSalarialeBrute"]["source"])
par("ratio", "Ratio salaire net / brut", M["ratioNetSurBrut"]["valeur"], PCT1, M["ratioNetSurBrut"]["source"])
par("csgAct", "Taux de CSG sur les revenus d'activité", csg["activite"]["taux"], PCT1, "Code de la sécurité sociale, art. L136-8")
par("assiette", "Assiette de la CSG d'activité (part du brut)", csg["activite"]["assiette"], PCT2, "98,25 % du salaire brut")
par("point", "Valeur d'un point de CSG sur les revenus d'activité (Md€)", csg["activite"]["valeurPoint"], NB1, csg["activite"]["source"])
for t in csg["retraites"]["taux"]:
    par("taux_" + t["id"], f"CSG des retraités : {t['label']}", t["taux"], PCT1, csg["retraites"]["source"])
for k in ["normal", "median", "reduit"]:
    par("ass_" + k, f"Assiette des pensions au taux {k} (Md€, calibrée sur les recettes de CSG)", csg["retraites"]["assiettes"][k], NB1, "Estimation du site, calibrée sur les recettes de CSG 2025 (CCSS, mai 2026)")
for k, v in csg["retraites"]["repartitionRetraites"].items():
    if k != "source": par("rep_" + k, f"Part des retraités au taux {k}", v, PCT1, csg["retraites"]["repartitionRetraites"]["source"])
par("csgNet", "Rendement net d'une hausse de CSG des retraités (après impôt sur le revenu)", csg["retraites"]["effetNet"], PCT1, "IPP, note n° 129 (2026) : environ 0,6 Md€ d'impôt perdu sur 4,8 Md€ de CSG")
par("tvaNormal", "Rendement net d'un point de TVA, taux normal (Md€)", tva["pointNet"]["normal"], NB1, tva["pointNet"]["source"])
par("tvaTous", "Rendement net d'un point de TVA, tous les taux (Md€)", tva["pointNet"]["tousTaux"], NB1, tva["pointNet"]["source"])
par("partPensions", "Part des pensions dans le revenu des ménages retraités", N["composition"]["partPensions"], PCT1, N["composition"]["source"])
par("partActivite", "Part des revenus d'activité dans le revenu des ménages actifs", N["composition"]["partActivite"], PCT1, N["composition"]["source"])
par("pensionsTotales", "Masse des pensions (Md€)", N["pensionsTotales"]["valeur"], NB1, N["pensionsTotales"]["source"])
par("depenses", "Dépenses de retraite 2025 (Md€)", RT["depenses"]["valeur"], NB1, RT["depenses"]["source"])
par("pensionMoy", "Pension moyenne nette de droit direct (€/mois)", RT["pensionMoyenneNette"]["valeur"], EUR, RT["pensionMoyenneNette"]["source"])

def gainCsg(sal, pts):  # gain mensuel d'un salarié pour une baisse de CSG de pts points
    return f"({sal}/{PR['ratio']})*{PR['assiette']}*({pts}/100)"
def gainNet(pts):  # hausse du salaire net en part
    return f"({PR['assiette']}*{pts}/100/{PR['ratio']})"

def entrees(ws, lignes, debut=4):
    refs = {}
    for i, (cle, lib, v, fmt, opts) in enumerate(lignes, start=debut):
        texte(ws, f"A{i}", lib, wrap=True); entree(ws, f"B{i}", v, fmt)
        if opts: liste(ws, f"B{i}", opts)
        refs[cle] = f"$B${i}"
    return refs
def resultats(ws, lignes, debut, col="A", colv="B"):
    refs = {}
    for i, (cle, lib, f, fmt, cle_res) in enumerate(lignes, start=debut):
        texte(ws, f"{col}{i}", lib, wrap=True); formule(ws, f"{colv}{i}", f, fmt, gras=cle_res, res=cle_res)
        refs[cle] = f"${colv}${i}"
    return refs
EFFETS = {}

# ---------- TVA sociale ----------
t = feuille(wb, "TVA sociale", "TVA sociale : une hausse de TVA dont toute la recette baisse la CSG des actifs", "Perte de pouvoir d'achat par point : graphique 4 du Trésor-Éco n° 371, par cinquième de niveau de vie.", [60, 18, 4, 22, 14, 14, 50])
e = entrees(t, [("pts", "Hausse de la TVA (points)", 2, "0.0", None), ("cible", "Taux concernés", "Taux normal", None, ["Taux normal", "Tous les taux"]),
                ("rep", "Part de la hausse répercutée dans les prix", 1, PCT1, None), ("sal", "Salaire net mensuel (€)", 2100, EUR, None), ("pen", "Pension nette mensuelle (€)", 1541, EUR, None),
                ("cinq", "Votre niveau de vie (Moyenne, ou cinquième 1 = 20 % les plus modestes … 5)", "Moyenne", None, ["Moyenne", "1", "2", "3", "4", "5"])])
ppa = P["prel"]["tva"]["pertePouvoirAchatParPoint"]
entete(t, 3, ["Cinquième", "Taux normal", "Tous les taux"], col=4)
for i in range(5):
    t[f"D{4+i}"] = i + 1; t[f"D{4+i}"].font = NOIR; entree(t, f"E{4+i}", ppa["parCinquieme"]["normal"][i], '0.00%', cle=False); entree(t, f"F{4+i}", ppa["parCinquieme"]["tousTaux"][i], '0.00%', cle=False)
texte(t, "D9", "Moyenne"); formule(t, "F9", "=0.005", '0.00%'); t["F9"].font = BLEU
formule(t, "E9", "=F9*AVERAGE(E4:E8)/AVERAGE(F4:F8)", '0.00%')
texte(t, "G4", "Lu sur le graphique 4 du Trésor-Éco n° 371 (perte de pouvoir d'achat pour +1 point, répercussion totale).", wrap=True)
texte(t, "G9", "Tous taux : 0,5 % publié. Taux normal : 0,5 % × part du taux normal dans la perte totale du graphique.", wrap=True)
idx = f'MATCH({e["cinq"]},$D$4:$D$9,0)'
r = resultats(t, [
    ("rec", "Recettes (Md€)", f'={e["pts"]}*IF({e["cible"]}="Taux normal",{PR["tvaNormal"]},{PR["tvaTous"]})', MD, False),
    ("baisse", "Baisse de CSG des actifs (points)", f'=MIN({PR["csgAct"]}*100,B11/{PR["point"]})', '0.00', True),
    ("prix", "Votre perte de pouvoir d'achat (part du revenu)", f'={e["pts"]}*IF({e["cible"]}="Taux normal",INDEX($E$4:$E$9,{idx}),INDEX($F$4:$F$9,{idx}))*{e["rep"]}', PCT2, False),
    ("prixMoy", "Perte moyenne des ménages (part du revenu)", f'={e["pts"]}*IF({e["cible"]}="Taux normal",$E$9,$F$9)*{e["rep"]}', PCT2, False),
    ("gain", "Actif : gain sur la paie (€/mois)", "=" + gainCsg(e["sal"], "B12"), EUR2, False),
    ("cout", "Actif : hausse des prix (€/mois)", f'={e["sal"]}*B13', EUR2, False),
    ("solde", "Actif : solde (€/mois)", "=B15-B16", EUR2, True),
    ("ret", "Retraité : perte la première année (€/mois)", f'={e["pen"]}*B13', EUR2, True),
    ("ea", "Effet sur le niveau de vie des actifs (moyenne)", f'={PR["partActivite"]}*{gainNet("B12")}-B14', PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités (moyenne)", "=-B14", PCT2, False),
], 11)
EFFETS["TVA sociale"] = ("'TVA sociale'!B19", "'TVA sociale'!B20")

# ---------- CSG des retraités ----------
c = feuille(wb, "CSG retraités", "CSG des retraités alignée sur celle des actifs (9,2 %), recette nette reversée aux actifs", "Assiettes calées sur l'IPP (note n° 129) : 1,5 Md€ net pour le taux normal, 4,2 Md€ pour les taux médian et normal.", [60, 18, 14, 14, 14, 14])
e = entrees(c, [("portee", "Retraités concernés", "Taux normal seulement", None, ["Taux normal seulement", "Taux médian et normal"]),
                ("pen", "Votre pension brute mensuelle (€)", 1800, EUR, None), ("taux", "Votre taux de CSG actuel", "normal", None, ["exonere", "reduit", "median", "normal"]),
                ("sal", "Salaire net mensuel d'un actif (€)", 2100, EUR, None)])
entete(c, 9, ["Taux", "Taux actuel", "Assiette (Md€)", "Concerné", "Nouveau taux", "Recette (Md€)"])
ids = ["exonere", "reduit", "median", "normal"]
for i, k in enumerate(ids, start=10):
    texte(c, f"A{i}", k); formule(c, f"B{i}", f"={PR['taux_' + k]}", PCT1, lien=True)
    formule(c, f"C{i}", f"={PR['ass_' + k]}" if k != "exonere" else "=0", NB1, lien=k != "exonere")
    formule(c, f"D{i}", f'=IF(A{i}="normal",1,IF(AND(A{i}="median",{e["portee"]}="Taux médian et normal"),1,0))', "0")
    formule(c, f"E{i}", f'=IF(D{i}=1,{PR["csgAct"]},B{i})', PCT1)
    formule(c, f"F{i}", f"=D{i}*C{i}*({PR['csgAct']}-B{i})", NB3)
r = resultats(c, [
    ("rec", "Hausse de CSG (Md€)", "=SUM(F10:F13)", MD2, False),
    ("net", "Recette nette, après impôt sur le revenu perdu (Md€)", f"=B15*{PR['csgNet']}", MD2, True),
    ("baisse", "Baisse de CSG des actifs (points)", f"=B16/{PR['point']}", '0.000', False),
    ("gain", "Gain d'un actif (€/mois)", "=" + gainCsg(e["sal"], "B17"), EUR2, False),
    ("perte", "Perte de votre pension (€/mois, avant effet sur l'impôt)", f'={e["pen"]}*MAX(0,INDEX(E10:E13,MATCH({e["taux"]},A10:A13,0))-INDEX(B10:B13,MATCH({e["taux"]},A10:A13,0)))', EUR2, True),
    ("ea", "Effet sur le niveau de vie des actifs", f'={PR["partActivite"]}*{gainNet("B17")}', PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f'=-{PR["partPensions"]}*B15/{PR["pensionsTotales"]}', PCT2, False),
], 15)
EFFETS["CSG des retraités"] = ("'CSG retraités'!B20", "'CSG retraités'!B21")

# ---------- Retraites sans impôts ----------
f = feuille(wb, "Sans impôts", "Retraites financées par leurs seules ressources « logiques »", "Gardée = 1 : la ressource continue de financer les retraites. Les ressources « fixes » sont toujours gardées.", [70, 14, 10, 10, 14])
e = entrees(f, [("part", "Part du trou comblée par une baisse des pensions (le reste : hausse des cotisations)", 0.5, PCT1, None),
                ("pen", "Pension nette mensuelle (€)", 1541, EUR, None), ("sal", "Salaire net mensuel (€)", 2100, EUR, None),
                ("vers", "Argent public libéré reversé aux actifs (Md€ par an)", 0, MD, None)])
entete(f, 9, ["Ressource (COR 2026, tableau 2.2)", "Montant (Md€)", "Fixe", "Gardée (1/0)", "Retirée (Md€)"])
for i, rs in enumerate(RT["ressources"], start=10):
    texte(f, f"A{i}", rs["label"], wrap=True); entree(f, f"B{i}", rs["montant"], NB1, cle=False)
    entree(f, f"C{i}", 1 if rs.get("fixe") else 0, "0", cle=False)
    if rs.get("fixe"): formule(f, f"D{i}", "=1", "0")
    else: entree(f, f"D{i}", 1 if rs.get("logique") else 0, "0")
    formule(f, f"E{i}", f"=IF(OR(C{i}=1,D{i}=1),0,B{i})", NB1)
z = 9 + len(RT["ressources"])
r = resultats(f, [
    ("retire", "Ressources retirées : le trou à combler (Md€)", f"=SUM(E10:E{z})", MD, True),
    ("pp", "Comblé par la baisse des pensions (Md€)", f"=B{z+2}*{e['part']}", MD, False),
    ("pc", "Comblé par la hausse des cotisations (Md€)", f"=B{z+2}-B{z+3}", MD, False),
    ("bp", "Baisse des pensions", f"=B{z+3}/{PR['depenses']}", PCT2, True),
    ("hc", "Hausse des cotisations (points de salaire brut)", f"=B{z+4}/{PR['masse']}", PCT2, True),
    ("pa", "Pension après (€/mois)", f"={e['pen']}*(1-B{z+5})", EUR2, False),
    ("ps", "Perte sur le salaire (€/mois)", f"={e['sal']}/{PR['ratio']}*B{z+6}", EUR2, False),
    ("ea", "Effet sur le niveau de vie des actifs", f"={PR['partActivite']}*(-B{z+6}/{PR['ratio']}+{e['vers']}/({PR['masse']}*{PR['ratio']}))", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B{z+5}", PCT2, False),
], z + 2)
EFFETS["Retraites sans impôts"] = (f"'Sans impôts'!B{z+9}", f"'Sans impôts'!B{z+10}")

# ---------- distribution des pensions (commune Gel / Plafond) ----------
def distribution(ws, l0, seuil, facteur, sommet, profil=None):
    cols = ["De (€ 2020)", "À (€ 2020)", "Part (%)", "De (€ 2027)", "À (€ 2027)", "Contribution à la moyenne", "Part au-dessus du seuil", "Masse au-dessus", "Masse au-delà du seuil"]
    if profil: cols += ["Part de base (point moyen)", "Masse de base au-dessus", "Masse de base au-delà"]
    entete(ws, l0, cols)
    def base(m):
        j, b, a2, hh = profil
        return f"IF({m}<={j},{b},IF({m}>={a2},{hh},{b}+({hh}-{b})*({m}-{j})/({a2}-{j})))"
    tr = G["distribution2020"]["tranches"]
    for i, (de, a, pct) in enumerate(tr):
        x = l0 + 1 + i
        entree(ws, f"A{x}", de, NB, cle=False); entree(ws, f"C{x}", pct, '0.00', cle=False)
        formule(ws, f"D{x}", f"=A{x}*{facteur}", NB)
        if a is None:
            texte(ws, f"B{x}", "et plus")
            formule(ws, f"E{x}", f"={sommet}*{facteur}", NB)  # point moyen de la dernière tranche
            formule(ws, f"F{x}", f"=C{x}/100*E{x}", NB1)
            formule(ws, f"G{x}", f"=IF(E{x}>{seuil},C{x}/100,0)", '0.0000')
            formule(ws, f"H{x}", f"=IF(E{x}>{seuil},C{x}/100*E{x},0)", NB1)
            formule(ws, f"I{x}", f"=IF(E{x}>{seuil},C{x}/100*(E{x}-{seuil}),0)", NB1)
            if profil: formule(ws, f"J{x}", "=" + base(f"E{x}"), PCT1)
        else:
            entree(ws, f"B{x}", a, NB, cle=False)
            formule(ws, f"E{x}", f"=B{x}*{facteur}", NB)
            formule(ws, f"F{x}", f"=C{x}/100*(D{x}+E{x})/2", NB1)
            q = f"(C{x}/100*(E{x}-MAX(D{x},{seuil}))/(E{x}-D{x}))"
            formule(ws, f"G{x}", f"=IF(E{x}<={seuil},0,{q})", '0.0000')
            formule(ws, f"H{x}", f"=IF(E{x}<={seuil},0,{q}*(MAX(D{x},{seuil})+E{x})/2)", NB1)
            formule(ws, f"I{x}", f"=IF(E{x}<={seuil},0,{q}*(MAX(D{x},{seuil})+E{x})/2-{q}*{seuil})", NB1)
            if profil: formule(ws, f"J{x}", "=" + base(f"((MAX(D{x},{seuil})+E{x})/2)"), PCT1)
        if profil:
            formule(ws, f"K{x}", f"=H{x}*J{x}", NB1); formule(ws, f"L{x}", f"=I{x}*J{x}", NB1)
    zz = l0 + len(tr)
    tot = zz + 1
    texte(ws, f"A{tot}", "Total (par retraité, €/mois)", gras=True)
    for col in ("FGHIKL" if profil else "FGHI"):
        formule(ws, f"{col}{tot}", f"=SUM({col}{l0+1}:{col}{zz})", '0.0000' if col == "G" else NB1, gras=True)
    return tot

def ligne_param(ws, r, lib, v, fmt, cle, src):
    texte(ws, f"A{r}", lib, wrap=True); entree(ws, f"B{r}", v, fmt, cle=False)
    e_ = vf(cle)
    texte(ws, f"C{r}", e_["type"] if e_ else "", wrap=True)
    texte(ws, f"D{r}", e_["calcul"] if e_ else "", wrap=True); ws.merge_cells(f"D{r}:G{r}")
    texte(ws, f"H{r}", src, wrap=True); ws.merge_cells(f"H{r}:L{r}")
    ws.row_dimensions[r].height = 42

# ---------- Gel ----------
g = feuille(wb, "Gel", "Gel de la revalorisation des pensions de base au-delà d'un seuil", "Calé sur l'IPP (note n° 129, 2027) : distribution des pensions, part de base selon la pension, économie nette, taux d'annuité.", [58, 16, 12, 12, 12, 14, 14, 14, 14, 13, 13, 13])
e = entrees(g, [("seuil", "Seuil de pension totale brute (€/mois)", 2000, EUR, None), ("taux", "Revalorisation non versée", G["revalorisation2027"], PCT1, None),
                ("mode", "Ce qui n'est pas revalorisé", "Toute la pension", None, ["Toute la pension", "Seulement au-delà du seuil"]),
                ("futurs", "Appliquer aussi aux futurs retraités (taux d'annuité)", "Non", None, ["Oui", "Non"]),
                ("pen", "Votre pension brute mensuelle totale (€)", 2500, EUR, None), ("sal", "Salaire net d'un actif (€/mois)", 2100, EUR, None)])
PB = G["profilBase"]
pg = [("ret", "Retraités de droit direct", G["retraites"]["valeur"], NB, G["retraites"]["source"]), ("fac", "Passage des euros 2020 aux pensions 2027", G["facteur"], '0.00', "Calé sur la distribution de l'IPP 2027 (médiane 1 639 €, 35 % au-dessus de 2 000 €)"),
      ("som", "Pension moyenne de la tranche ouverte « 4 500 € et plus » (€ 2020)", G["distribution2020"]["sommet"], NB, "Estimation du site, cohérente avec la pension moyenne totale fin 2020"),
      ("net", "Économie nette / économie des régimes (finances publiques)", G["ipp"]["effetNet"], PCT1, "IPP, note n° 129 : 5,2 Md€ nets pour 6,6 Md€ d'économie directe"),
      ("sortie", "Sortie annuelle des retraités actuels (décès)", G["sortieAnnuelle"], PCT1, G["deces"]["source"]), ("an", "Horizon (années après 2026)", 10, "0", "2036"),
      ("tp", "Taux plein", G["ipp"]["tauxPlein"], PCT1, "Régime général"), ("tr", "Trimestres requis", G["ipp"]["trimestresRequis"], "0", "Générations nées à partir de 1965"),
      ("prel", "Prélèvements sur une pension au taux normal (CSG, CRDS, Casa)", G["prelevementsTauxNormal"], PCT1, "8,3 % + 0,5 % + 0,3 %"),
      ("epa", "Taux d'épargne des ménages de 70 ans ou plus", G["epargne"]["plus70"], PCT1, G["epargne"]["source"]),
      ("pj", "Part de base : pension jusqu'à laquelle elle vaut la part haute (€)", PB["jusqua"], EUR, "Profil calé sur les 4 chiffrages de l'IPP (note n° 129) ; estimation du site"),
      ("pb", "Part de base des pensions modestes", PB["base"], PCT1, "Idem"),
      ("pa", "Pension à partir de laquelle elle vaut la part basse (€)", PB["apartirDe"], EUR, "Idem"),
      ("ph", "Part de base des hautes pensions", PB["haut"], PCT1, "Idem")]
entete(g, 11, ["Paramètre", "Valeur", "Type", "Comment c'est calculé", "", "", "", "Source"])
for i, (cle, lib, v, fmt, src) in enumerate(pg, start=12):
    ligne_param(g, i, lib, v, fmt, cle, src); e[cle] = f"$B${i}"
R = 12 + len(pg) + 3
L = R + 22
tot = distribution(g, L, e["seuil"], e["fac"], e["som"], (e["pj"], e["pb"], e["pa"], e["ph"]))
bpen = f'IF({e["pen"]}<={e["pj"]},{e["pb"]},IF({e["pen"]}>={e["pa"]},{e["ph"]},{e["pb"]}+({e["ph"]}-{e["pb"]})*({e["pen"]}-{e["pj"]})/({e["pa"]}-{e["pj"]})))'
res = [
    ("part", "Part des retraités au-dessus du seuil", f"=G{tot}", PCT1, False),
    ("conc", "Retraités concernés", f"=G{tot}*{e['ret']}", NB, False),
    ("eco", "Économie des régimes, première année (Md€)", f'={e["ret"]}*12*IF({e["mode"]}="Toute la pension",K{tot},L{tot})*{e["taux"]}/1E9', MD2, True),
    ("ecoNet", "Gain net pour les finances publiques (Md€)", f"=B{R+2}*{e['net']}", MD2, True),
    ("traj", "Économie la dernière année de l'horizon (Md€)", f'=IF({e["futurs"]}="Oui",B{R+2},B{R+2}*(1-{e["sortie"]})^{e["an"]})', MD2, False),
    ("cumul", "Cumul sur l'horizon, première année comprise (Md€)", f'=IF({e["futurs"]}="Oui",B{R+2}*({e["an"]}+1),B{R+2}*(1-(1-{e["sortie"]})^({e["an"]}+1))/{e["sortie"]})', MD, False),
    ("perte", "Votre perte (€ brut par mois)", f'=IF({e["pen"]}<={e["seuil"]},0,IF({e["mode"]}="Toute la pension",{e["pen"]},{e["pen"]}-{e["seuil"]})*{bpen}*{e["taux"]})', EUR2, True),
    ("trAv", "Valeur d'un trimestre aujourd'hui (part du salaire de référence)", f"={e['tp']}/{e['tr']}", '0.000%', False),
    ("trAp", "Valeur d'un trimestre pour un futur retraité concerné", f'=IF({e["mode"]}="Toute la pension",B{R+7}*(1-{e["taux"]}),IF({e["pen"]}>{e["seuil"]},B{R+7}*(1-{e["taux"]}*({e["pen"]}-{e["seuil"]})/{e["pen"]}),"sous le seuil"))', '0.000%', False),
    ("baisse", "Baisse de CSG des actifs, financée par le gain net (points)", f"=B{R+3}/{PR['point']}", '0.000', False),
    ("gain", "Gain d'un actif (€/mois)", "=" + gainCsg(e["sal"], f"B{R+9}"), EUR2, False),
    ("pn", "Votre perte nette (€/mois)", f"=B{R+6}*(1-{e['prel']})", EUR2, False),
    ("ep", "Épargne mensuelle à cette pension (€)", f"={e['pen']}*(1-{e['prel']})*{e['epa']}", EUR, False),
    ("pe", "La perte en part de cette épargne", f"=IF(B{R+12}>0,B{R+11}/B{R+12},0)", PCT1, False),
    ("ea", "Effet sur le niveau de vie des actifs", f"={PR['partActivite']}*{gainNet(f'B{R+9}')}", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B{R+2}/{PR['pensionsTotales']}", PCT2, False),
    ("mt", "Masse totale des pensions (Md€, contrôle)", f"={e['ret']}*12*F{tot}/1E9", MD, False),
]
resultats(g, res, R)
texte(g, f"A{R-1}", "Résultats", gras=True); texte(g, f"A{L-1}", "Distribution des pensions totales brutes (Drees, EIR 2020, tableau 5), portée à 2027", gras=True)
EFFETS["Gel des hautes pensions"] = (f"Gel!B{R+14}", f"Gel!B{R+15}")

# ---------- Plafond ----------
pl = feuille(wb, "Plafond", "Plafond des pensions : aucune pension totale au-delà d'un montant choisi", None, [58, 16, 12, 12, 12, 14, 14, 14, 14])
e = entrees(pl, [("plaf", "Plafond de la pension totale brute (€/mois)", 4000, EUR, None), ("pen", "Votre pension brute mensuelle (€)", 5000, EUR, None),
                 ("vers", "Part de l'économie versée aux actifs (salaires)", 0, PCT1, None)])
e["ret"] = "Gel!$B$12"; e["fac"] = "Gel!$B$13"; e["som"] = "Gel!$B$14"
texte(pl, "A8", "Retraités, facteur 2020 → 2027, tranche ouverte et rapport net / brut : repris de la feuille Gel.", italique=True)
L = 30
tot = distribution(pl, L, e["plaf"], e["fac"], e["som"])
resultats(pl, [
    ("part", "Part des retraités au-dessus du plafond", f"=G{tot}", PCT1, False),
    ("conc", "Retraités concernés", f"=G{tot}*{e['ret']}", NB, False),
    ("eco", "Économie annuelle (Md€)", f"={e['ret']}*12*I{tot}/1E9", MD2, True),
    ("pc", "En part de l'ensemble des pensions", f"=B13/({e['ret']}*12*F{tot}/1E9)", PCT1, False),
    ("net", "Gain net pour les finances publiques (Md€)", "=B13*Gel!$B$15", MD2, False),
    ("perte", "Votre perte (€ brut par mois)", f"=MAX(0,{e['pen']}-{e['plaf']})", EUR, True),
    ("ea", "Effet sur le niveau de vie des actifs (part du gain net versée)", f"={PR['partActivite']}*(B15*{e['vers']}/({PR['masse']}*{PR['ratio']}))", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B13/{PR['pensionsTotales']}", PCT2, False),
], 11)
texte(pl, "A10", "Résultats", gras=True); texte(pl, f"A{L-1}", "Distribution des pensions (même source que la feuille Gel)", gras=True)
EFFETS["Plafond des pensions"] = ("Plafond!B17", "Plafond!B18")

# ---------- Abattement de 10 % ----------
I = P["ipp129"]["abattement"]
ab = feuille(wb, "Abattement", "Abattement de 10 % sur les pensions : supprimé ou plafond abaissé", "Recette calée sur l'IPP (note n° 129, 2027) et interpolée entre ses points ; recette reversée aux actifs en baisse de CSG.", [60, 16, 16, 50])
e = entrees(ab, [("plaf", "Plafond de l'abattement par foyer (€ par an ; 0 = suppression)", 0, EUR, None),
                 ("pens", "Pensions du foyer, montant annuel déclaré (€)", 30000, EUR, None), ("n", "Nombre de retraités dans le foyer", 1, "0", ["1", "2"]),
                 ("tmi", "Taux marginal d'imposition du foyer", 0.11, PCT1, None), ("sal", "Salaire net d'un actif (€/mois)", 2100, EUR, None)])
pa = [("taux", "Taux de l'abattement", I["taux"], PCT1, "CGI, art. 158, 5-a"), ("pact", "Plafond actuel par foyer (€, revenus 2025)", I["plafond"], EUR, "IPP, note n° 129, encadré 1"),
      ("plancher", "Plancher par pensionné (€)", I["plancher"], EUR, "Idem")]
for i, (cle, lib, v, fmt, src) in enumerate(pa, start=11):
    ligne_param(ab, i, lib, v, fmt, cle, src); e[cle] = f"$B${i}"
entete(ab, 15, ["Point chiffré par l'IPP", "Plafond (€)", "Recette nette (Md€)", "Source"])
for i, pt in enumerate(I["points"], start=16):
    texte(ab, f"A{i}", ["Suppression", "Plafond abaissé (scénario A2)", "Plafond actuel"][i - 16])
    entree(ab, f"B{i}", pt["plafond"], EUR, cle=False); entree(ab, f"C{i}", pt["recettes"], MD, cle=False); texte(ab, f"D{i}", "IPP, note n° 129, tableau 1")
x = e["plaf"]
interp = f"=IF({x}<=B16,C16,IF({x}<=B17,C16+(C17-C16)*({x}-B16)/(B17-B16),IF({x}<=B18,C17+(C18-C17)*({x}-B17)/(B18-B17),C18)))"
abat = lambda P: f"MAX(0,MIN({e['pens']},{P},MAX({e['taux']}*{e['pens']},{e['plancher']}*{e['n']})))"
resultats(ab, [
    ("rec", "Recette nette (Md€)", interp, MD2, True),
    ("avant", "Abattement du foyer aujourd'hui (€)", "=" + abat(e["pact"]), EUR, False),
    ("apres", "Abattement du foyer après réforme (€)", "=" + abat(f"MIN({x},{e['pact']})"), EUR, False),
    ("hausse", "Hausse d'impôt du foyer (€ par an, sans décote ni changement de tranche)", f"=(B22-B23)*{e['tmi']}", EUR, True),
    ("mois", "… par mois (€)", "=B24/12", EUR2, False),
    ("baisse", "Baisse de CSG des actifs (points)", f"=B21/{PR['point']}", '0.000', False),
    ("gain", "Gain d'un actif (€/mois)", "=" + gainCsg(e["sal"], "B26"), EUR2, False),
    ("ea", "Effet sur le niveau de vie des actifs", f"={PR['partActivite']}*{gainNet('B26')}", PCT2, False),
    ("er", "Effet sur le niveau de vie des retraités", f"=-{PR['partPensions']}*B21/{PR['pensionsTotales']}", PCT2, False),
], 21)
EFFETS["Abattement de 10 %"] = ("Abattement!B28", "Abattement!B29")

# ---------- Niveaux de vie ----------
n = feuille(wb, "Niveaux de vie", "Retraités et actifs : niveau de vie médian, et effet des réformes choisies", "Effets cumulés multiplicativement ; hypothèse : l'effet « actifs » s'applique aux personnes en emploi, l'effet « retraités » aux retraités.", [34, 12, 16, 16, 14, 14])
entete(n, 4, ["Réforme", "Inclure", "Effet actifs", "Effet retraités", "Facteur actifs", "Facteur retraités"])
for i, (nom, (ea, er)) in enumerate(EFFETS.items(), start=5):
    texte(n, f"A{i}", nom); entree(n, f"B{i}", "Oui"); liste(n, f"B{i}", ["Oui", "Non"])
    formule(n, f"C{i}", "=" + ea, PCT2, lien=True); formule(n, f"D{i}", "=" + er, PCT2, lien=True)
    formule(n, f"E{i}", f'=IF(B{i}="Oui",1+C{i},1)', '0.0000'); formule(n, f"F{i}", f'=IF(B{i}="Oui",1+D{i},1)', '0.0000')
z = 4 + len(EFFETS)
an = N["annees"]; k = len(an) - 1
resultats(n, [
    ("ca", "Effet cumulé, actifs", f"=PRODUCT(E5:E{z})-1", PCT2, True),
    ("cr", "Effet cumulé, retraités", f"=PRODUCT(F5:F{z})-1", PCT2, True),
], z + 2)
texte(n, f"A{z+5}", f"Niveaux de vie médians {an[-1]} (€ 2024 par an)", gras=True)
entete(n, z + 6, ["", "Avant", "Après", "Par mois avant", "Par mois après"])
texte(n, f"A{z+7}", "Personnes en emploi"); entree(n, f"B{z+7}", N["series"]["emploi"][k], EUR, cle=False)
formule(n, f"C{z+7}", f"=B{z+7}*(1+B{z+2})", EUR); formule(n, f"D{z+7}", f"=B{z+7}/12", EUR); formule(n, f"E{z+7}", f"=C{z+7}/12", EUR)
texte(n, f"A{z+8}", "Retraités"); entree(n, f"B{z+8}", N["series"]["retraites"][k], EUR, cle=False)
formule(n, f"C{z+8}", f"=B{z+8}*(1+B{z+3})", EUR); formule(n, f"D{z+8}", f"=B{z+8}/12", EUR); formule(n, f"E{z+8}", f"=C{z+8}/12", EUR)
texte(n, f"A{z+9}", "Retraités / en emploi", gras=True); formule(n, f"B{z+9}", f"=B{z+8}/B{z+7}", PCT1, gras=True, res=True); formule(n, f"C{z+9}", f"=C{z+8}/C{z+7}", PCT1, gras=True, res=True)
h0 = z + 12
texte(n, f"A{h0-1}", "Série 1996-2024 (Insee, ERFS, € constants 2024, médianes annuelles)", gras=True)
texte(n, f"A{z+10}", "Source : Insee, « Niveau de vie selon le statut d'activité », figure 1 (Insee-DGFiP-Cnaf-Cnav-CCMSA, enquêtes Revenus fiscaux et sociaux 2005-2024 ; Insee-DGI, ERFS rétropolées 1996-2004). Ruptures de série en 2010, 2012 et 2020 : valeur après rupture. Lien :", italique=True)
n[f"A{z+10}"].value = n[f"A{z+10}"].value + " " + N["url"]; n[f"A{z+10}"].hyperlink = N["url"]
entete(n, h0, ["Année", "Ensemble", "Retraités", "En emploi", "Retraités / en emploi"])
for i, a in enumerate(an):
    x = h0 + 1 + i
    entree(n, f"A{x}", a, "0", cle=False)
    entree(n, f"B{x}", N["series"]["ensemble"][i], NB, cle=False); entree(n, f"C{x}", N["series"]["retraites"][i], NB, cle=False); entree(n, f"D{x}", N["series"]["emploi"][i], NB, cle=False)
    formule(n, f"E{x}", f"=C{x}/D{x}", PCT1)

# ---------- Rendement ----------
w = feuille(wb, "Rendement", "Pensions reçues pour 100 000 € cotisés, selon la génération", "Modèle du site calé sur le TRI du COR (cas type non-cadre, carrière complète), trimestre par trimestre. Valeurs actualisées en plus de l'évolution des salaires.", [48, 14, 12, 12, 12, 12, 12, 4, 12, 12, 12, 12, 12, 12])
gens = RD["generations"]
e = entrees(w, [("gen", "Génération (année de naissance)", 1960, "0", [str(x["annee"]) for x in gens]), ("r", "Taux d'actualisation (en plus des salaires)", 0, PCT2, None),
                ("dec", "Décrochage annuel des pensions par rapport aux salaires", RD["decrochagePension"], PCT1, None), ("imp", "Compter aussi les impôts affectés aux retraites", "Non", None, ["Oui", "Non"])])
w["B4"].value = 1960
dv = DataValidation(type="list", formula1='"' + ",".join(str(x["annee"]) for x in gens) + '"'); w.add_data_validation(dv); dv.add(w["B4"])
w.data_validations.dataValidation = [d for d in w.data_validations.dataValidation if "B4" not in str(d.sqref) or d is dv]
entete(w, 10, ["Génération", "TRI (COR)", "Durée de retraite", "Espérance de vie à 60 ans", "Durée de carrière"])
for i, gg in enumerate(gens, start=11):
    entree(w, f"A{i}", gg["annee"], "0", cle=False); entree(w, f"B{i}", gg["tri"], PCT2, cle=False)
    entree(w, f"C{i}", gg["dureeRetraite"], '0.00', cle=False); entree(w, f"D{i}", gg["esperanceA60"], '0.00', cle=False); entree(w, f"E{i}", gg["dureeCarriere"], '0.00', cle=False)
gz = 10 + len(gens)
look = lambda col: f"INDEX({col}$11:{col}${gz},MATCH({e['gen']},$A$11:$A${gz},0))"
# impôts : tables d'interpolation
ih = RD["impots"]["partHorsCotisations"]; iq = RD["impots"]["partPayeeParRetraites"]
texte(w, "I9", "Part des ressources hors cotisations (COR)", gras=True)
entete(w, 10, ["Année", "Part"], col=9)
for i, (an_, v) in enumerate(sorted(ih.items(), key=lambda x: int(x[0])), start=11):
    entree(w, f"I{i}", int(an_), "0", cle=False); entree(w, f"J{i}", v, PCT2, cle=False)
iz = 10 + len(ih)
texte(w, "L9", "Part payée par les retraités", gras=True)
entete(w, 10, ["Année", "Part"], col=12)
for i, (an_, v) in enumerate(sorted(iq.items(), key=lambda x: int(x[0])), start=11):
    entree(w, f"L{i}", int(an_), "0", cle=False); entree(w, f"M{i}", v, PCT2, cle=False)
qz = 10 + len(iq)
def interp(y, kc, vc, z0, z1):
    K = f"${kc}${z0}:${kc}${z1}"; V = f"${vc}${z0}:${vc}${z1}"
    i = f"MATCH({y},{K},1)"
    return (f"IF({y}<=${kc}${z0},${vc}${z0},IF({y}>=${kc}${z1},${vc}${z1},"
            f"INDEX({V},{i})+(INDEX({V},{i}+1)-INDEX({V},{i}))*({y}-INDEX({K},{i}))/(INDEX({K},{i}+1)-INDEX({K},{i}))))")
cal = 30
resultats(w, [
    ("tri", "TRI de la génération (COR)", "=" + look("B"), PCT2, False),
    ("dep", "Âge de départ", f"=60+{look('D')}-{look('C')}", '0.00', False),
    ("deb", "Âge de début de carrière", f"=B{cal+1}-{look('E')}", '0.00', False),
    ("fin", "Âge de fin de retraite", f"=B{cal+1}+{look('C')}", '0.00', False),
    ("k", "Calage : pension / cotisation (au TRI du COR)", "=SUM(D60:D259)/SUM(I60:I259)", '0.0000', False),
    ("res", "Pensions reçues pour 100 000 € cotisés (valeur actualisée)", "=100000*B34*SUM(J60:J259)/SUM(E60:E259)", EUR, True),
], cal)
texte(w, "A29", "Calendrier et résultat", gras=True)
texte(w, "A57", "Grille trimestrielle (pas de 0,25 an ; une ligne compte si l'âge est dans la période)", gras=True)
entete(w, 59, ["Cotisation : âge", "Compte", "Mult. impôts", "Poids au TRI", "Poids actualisé", "", "Pension : âge", "Compte", "Poids au TRI", "Poids actualisé", "", "Mult. impôts"])
for j in range(200):
    x = 60 + j
    formule(w, f"A{x}", f"=$B${cal+2}+0.125+{j}*0.25", '0.000')
    formule(w, f"B{x}", f"=IF(A{x}<$B${cal+1},1,0)", "0")
    yy = f"({e['gen']}+A{x})"
    ext = interp(yy, "I", "J", 11, iz); q = interp(yy, "L", "M", 11, qz)
    formule(w, f"C{x}", f'=IF({e["imp"]}="Oui",1+(({ext})-({q}))/(1-({ext})),1)', '0.0000')
    formule(w, f"D{x}", f"=B{x}*(1+$B${cal})^(-A{x})", '0.0000')
    formule(w, f"E{x}", f"=B{x}*C{x}*(1+{e['r']})^(-A{x})", '0.0000')
    formule(w, f"G{x}", f"=$B${cal+1}+0.125+{j}*0.25", '0.000')
    formule(w, f"H{x}", f"=IF(G{x}<$B${cal+3},1,0)", "0")
    formule(w, f"I{x}", f"=H{x}*(1-{e['dec']})^(G{x}-$B${cal+1})*(1+$B${cal})^(-G{x})", '0.0000')
    yy2 = f"({e['gen']}+G{x})"
    q2 = interp(yy2, "L", "M", 11, qz)
    formule(w, f"L{x}", f'=IF({e["imp"]}="Oui",1-({q2}),1)', '0.0000')
    formule(w, f"J{x}", f"=H{x}*(1-{e['dec']})^(G{x}-$B${cal+1})*L{x}*(1+{e['r']})^(-G{x})", '0.0000')

sources(wb, [
    ("Financement et dépenses des retraites", RT["depenses"]["source"], RT["depenses"]["url"]),
    ("CSG, barème des retraités", csg["retraites"]["source"], csg["retraites"]["url"]),
    ("Recettes de CSG d'activité", csg["activite"]["source"], csg["activite"]["url"]),
    ("TVA : rendement et effet sur les prix", tva["pointNet"]["source"], tva["pointNet"]["url"]),
    ("Distribution des pensions", G["distribution2020"]["source"], G["distribution2020"]["url"]),
    ("Retraités", G["retraites"]["source"], G["retraites"]["url"]),
    ("Sous-indexation, taux d'annuité", G["ipp"]["source"], G["ipp"]["url"]),
    ("Calage CSG, gel, abattement", P["ipp129"]["source"], P["ipp129"]["url"]),
    ("Décès", G["deces"]["source"], G["deces"]["url"]),
    ("Épargne des ménages", G["epargne"]["source"], G["epargne"]["url"]),
    ("Niveaux de vie", N["source"], N["url"]),
    ("Composition des revenus", N["composition"]["source"], None),
    ("Rendement par génération", RD["source"], RD["url"]),
    ("Impôts affectés aux retraites", RD["impots"]["source"], RD["impots"]["url"]),
    ("Emploi, salaires", M["personnesEnEmploi"]["source"] + " ; " + M["masseSalarialeBrute"]["source"], M["masseSalarialeBrute"]["url"]),
])
verification(wb, VERIF)
police_partout(wb)
wb.move_sheet("Lisez-moi", offset=-len(wb.sheetnames))
wb.save(sys.argv[1])
