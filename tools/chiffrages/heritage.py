import sys
from commun import *
from verification import HERITAGE as VERIF, PUB, GRAPH, CALC, HYP, LOI

C = P["chiffrage"]; E = C["scenarios"]["etude"]; A = C["scenarios"]["actualise"]
wb = nouveau()
lisez_moi(wb, "Chiffrage de l'espace Héritage", [
    ("Contenu",),
    "Hypothèses : choix du scénario (« Étude 2024 » ou « Actualisé 2026 ») et hypothèses modifiables. Une valeur saisie dans la colonne « Votre valeur » remplace celle du scénario.",
    "Modèle IGS : flux successoral, droits actuels, pilier 1 et pilier 2, année par année (2021-2040), et résultats 2025-2040. Mêmes formules que le classeur de l'étude de la Fondation Jean-Jaurès (2024) et que le site.",
    "Calcul individuel : impôt d'un héritier en ligne directe, droit actuel contre barème de l'IGS.",
    "Gain salaire : ce que rapporterait à un actif une part des recettes de l'IGS (variante du site, l'étude ne la propose pas).",
    "Sources : références de chaque donnée.",
    ("Vérification",),
    "Avec les hypothèses par défaut, chaque résultat est identique à celui du site (écart < 0,01 Md€ pour les recettes, < 1 € pour les montants individuels).",
    ("Limites",),
    "L'étude mêle euros courants et croissances réelles (PIB +1 %/an sans inflation) ; la part du top 1 % du patrimoine y passe de 24 % à 35 % en 2040 ; aucun effet de comportement (exil, optimisation, étalement du paiement).",
])

# ---------- Hypothèses ----------
ws = feuille(wb, "Hypothèses", "Hypothèses du chiffrage de l'IGS", "Choisissez le scénario en B4 ; saisissez une valeur en colonne D pour la remplacer.", [44, 14, 14, 14, 14, 52, 16, 52])
TYPES_HYP = {
    "croissancePib": (HYP, "Hypothèse de l'étude : +1 % par an après la dernière année connue."),
    "fluxCible": (PUB, "23 % du PIB en 2050 (CAE, note n° 63) ; interpolation linéaire depuis 15 % en 2021."),
    "rendementTop1": (CALC, "6,10 % de rendement moyen 2005-2014 (Garbinti et al.) − 2 % d'inflation."),
    "partPV": (CALC, "17 681 Md€ de plus-values latentes ÷ 42 861 Md€ de patrimoine du top 1 % (Saez et al.)."),
    "pfu": (LOI, "30 % en 2024 ; 31,4 % depuis 2026 (12,8 % + 18,6 %)."),
    "part0": (PUB, "15 % du PIB en 2021 (CAE, note n° 63)."),
    "annee0": (PUB, ""), "anneeCible": (PUB, ""),
    "p1_2021": (PUB, "10 Md€ en 2021 (simulation du CAE reprise par l'étude), puis comme le flux successoral."),
    "partTop1": (PUB, "24 % (World Inequality Database, 2022)."),
    "anneeRef": (PUB, ""),
    "croissanceGen": (CALC, "4,07 % − 2 % d'inflation (classeur de l'étude, Banque de France)."),
    "abattement": (PUB, "80 % de l'assiette taxée (Hannezo et al., 2022)."),
    "dmtgDeduits": (PUB, "20 % de droits déjà payés déduits (CAE, 2021)."),
}
texte(ws, "A4", "Scénario actif", gras=True)
entree(ws, "B4", "Actualisé 2026", note="Liste : Étude 2024 ou Actualisé 2026")
liste(ws, "B4", ["Étude 2024", "Actualisé 2026"])
formule(ws, "C4", '=IF(B4="Étude 2024",1,2)')
texte(ws, "D4", "← 1 = étude, 2 = actualisé", italique=True)
entete(ws, 6, ["Hypothèse", "Étude 2024", "Actualisé 2026", "Votre valeur", "Valeur retenue", "Source", "Type", "Comment c'est calculé"])
hyp = [
    ("croissancePib", "Croissance annuelle du PIB (après la dernière année connue)", E["hypotheses"]["croissancePib"], A["hypotheses"]["croissancePib"], PCT1, "Étude : +1 % par an"),
    ("fluxCible", "Flux successoral en 2050 (part du PIB)", E["hypotheses"]["fluxCible"], A["hypotheses"]["fluxCible"], PCT1, C["flux"]["source"]),
    ("rendementTop1", "Croissance annuelle du patrimoine du top 1 %", E["hypotheses"]["rendementTop1"], A["hypotheses"]["rendementTop1"], PCT2, C["pilier2"]["sources"]["rendement"]),
    ("partPV", "Part de plus-values latentes dans le patrimoine du top 1 %", E["hypotheses"]["partPV"], A["hypotheses"]["partPV"], PCT2, C["pilier2"]["sources"]["partPV"]),
    ("pfu", "Taux du PFU", E["hypotheses"]["pfu"], A["hypotheses"]["pfu"], PCT1, E["sources"]["pfu"] + " / " + A["sources"]["pfu"]),
    ("part0", "Flux successoral en 2021 (part du PIB)", C["flux"]["part0"], C["flux"]["part0"], PCT1, C["flux"]["source"]),
    ("annee0", "Année de départ du flux", C["flux"]["annee0"], C["flux"]["annee0"], "0", ""),
    ("anneeCible", "Année cible du flux", C["flux"]["anneeCible"], C["flux"]["anneeCible"], "0", ""),
    ("p1_2021", "Pilier 1 : recettes supplémentaires en 2021 (Md€)", C["pilier1"]["recettes2021"], C["pilier1"]["recettes2021"], MD, C["pilier1"]["source"]),
    ("partTop1", "Part du patrimoine détenue par le top 1 % (année de référence)", C["pilier2"]["partTop1"]["valeur"], C["pilier2"]["partTop1"]["valeur"], PCT1, C["pilier2"]["partTop1"]["source"]),
    ("anneeRef", "Année de référence du patrimoine du top 1 %", C["pilier2"]["anneeReference"], C["pilier2"]["anneeReference"], "0", ""),
    ("croissanceGen", "Croissance annuelle du patrimoine de l'ensemble des ménages (pour la part du top 1 %)", C["pilier2"]["croissanceGenerale"], C["pilier2"]["croissanceGenerale"], PCT2, "4,07 % − 2 % d'inflation (étude, Banque de France)"),
    ("abattement", "Part de l'assiette taxée après abattements", C["pilier2"]["abattement"], C["pilier2"]["abattement"], PCT1, "Hannezo et al. (2022)"),
    ("dmtgDeduits", "Réduction pour droits de succession déjà payés", C["pilier2"]["dmtgDeduits"], C["pilier2"]["dmtgDeduits"], PCT1, "CAE (2021)"),
]
H = {}
for i, (cle, lib, ve, va, fmt, src) in enumerate(hyp, start=7):
    texte(ws, f"A{i}", lib, wrap=True)
    entree(ws, f"B{i}", ve, fmt, cle=False); entree(ws, f"C{i}", va, fmt, cle=False)
    entree(ws, f"D{i}", None, fmt)
    formule(ws, f"E{i}", f'=IF(ISBLANK(D{i}),IF($C$4=1,B{i},C{i}),D{i})', fmt, gras=True)
    texte(ws, f"F{i}", src, wrap=True)
    texte(ws, f"G{i}", TYPES_HYP[cle][0], wrap=True); texte(ws, f"H{i}", TYPES_HYP[cle][1], wrap=True)
    H[cle] = f"Hypothèses!$E${i}"
r = 7 + len(hyp) + 1
texte(ws, f"A{r}", "Données connues par année (au-delà : projection)", gras=True); r += 1
entete(ws, r, ["Donnée", "Année", "Étude 2024", "Actualisé 2026", "", "Source"]); r += 1
connus = {}
def bloc(nom, cle, src_e, src_a, fmt):
    global r
    annees = sorted(set(map(int, E[cle].keys())) | set(map(int, A[cle].keys())))
    connus[cle] = {}
    for an in annees:
        texte(ws, f"A{r}", nom); entree(ws, f"B{r}", an, "0", cle=False)
        if str(an) in E[cle]: entree(ws, f"C{r}", E[cle][str(an)], fmt, cle=False)
        if str(an) in A[cle]: entree(ws, f"D{r}", A[cle][str(an)], fmt, cle=False)
        texte(ws, f"F{r}", src_e + " / " + src_a, wrap=True)
        connus[cle][an] = r; r += 1
bloc("PIB (Md€)", "pib", E["sources"]["pib"], A["sources"]["pib"], NB1)
bloc("Droits de succession et donations actuels (Md€)", "dmtg", E["sources"]["dmtg"], A["sources"]["dmtg"], NB1)
bloc("Patrimoine net des ménages (Md€)", "patrimoine", E["sources"]["patrimoine"], A["sources"]["patrimoine"], NB1)
r += 1
texte(ws, f"A{r}", "Mortalité du top 1 % (Insee 2021 et rapport du CPO sur les assujettis à l'ISF)", gras=True); r += 1
mort = {}
for i, m in enumerate(C["pilier2"]["mortalite"]):
    an = 2025 + i
    texte(ws, f"A{r}", "Taux de mortalité"); entree(ws, f"B{r}", an, "0", cle=False); entree(ws, f"C{r}", m, PCT2)
    mort[an] = r; r += 1

# ---------- Modèle IGS ----------
m = feuille(wb, "Modèle IGS", "Modèle de chiffrage de l'IGS, année par année", "Md€. Formules du classeur de l'étude ; données connues lues dans « Hypothèses » selon le scénario actif.",
            [8, 11, 11, 12, 11, 11, 12, 11, 12, 13, 13, 11, 12, 12, 12])
entete(m, 13, ["Année", "PIB", "Part du PIB transmise", "Flux successoral", "DMTG actuels", "Pilier 1", "Patrimoine des ménages", "Patrimoine du top 1 %", "Part du top 1 %", "Mortalité", "Assiette plus-values", "Pilier 2", "Recettes IGS (P1+P2)", "DMTG avec réforme"])
L0 = 14
lig = {}
def connu(cle, an):
    rr = connus[cle].get(an)
    if rr is None: return None
    return f'IF(Hypothèses!$C$4=1,Hypothèses!$C${rr},Hypothèses!$D${rr})'
for k, an in enumerate(range(2021, 2041)):
    x = L0 + k; lig[an] = x
    entree(m, f"A{x}", an, "0", cle=False); m[f"A{x}"].font = NOIR
    # PIB
    kc = connu("pib", an)
    prev = f"B{x-1}"
    if an == 2021: f = f"={kc}"
    else: f = f'=IF(ISNUMBER({kc}),{kc},{prev}*(1+{H["croissancePib"]}))' if kc and an > 2021 else f'={prev}*(1+{H["croissancePib"]})'
    # une valeur absente renvoie 0 avec IF(...,C,D) sur cellule vide : on teste <>""
    if kc and an > 2021:
        rr = connus["pib"][an]
        f = f'=IF(Hypothèses!$C$4=1,IF(ISBLANK(Hypothèses!$C${rr}),{prev}*(1+{H["croissancePib"]}),Hypothèses!$C${rr}),IF(ISBLANK(Hypothèses!$D${rr}),{prev}*(1+{H["croissancePib"]}),Hypothèses!$D${rr}))'
    formule(m, f"B{x}", f, NB1)
    formule(m, f"C{x}", f'={H["part0"]}+({H["fluxCible"]}-{H["part0"]})*(A{x}-{H["annee0"]})/({H["anneeCible"]}-{H["annee0"]})', PCT2)
    formule(m, f"D{x}", f"=B{x}*C{x}", NB1)
    # DMTG
    rr = connus["dmtg"].get(an)
    grow = f"E{x-1}*D{x}/D{x-1}"
    if rr and an == 2021:
        f = f'=IF(Hypothèses!$C$4=1,Hypothèses!$C${rr},Hypothèses!$D${rr})'
    elif rr:
        f = f'=IF(Hypothèses!$C$4=1,IF(ISBLANK(Hypothèses!$C${rr}),{grow},Hypothèses!$C${rr}),IF(ISBLANK(Hypothèses!$D${rr}),{grow},Hypothèses!$D${rr}))'
    else:
        f = "=" + grow
    formule(m, f"E{x}", f, NB1)
    # Patrimoine général (à partir de 2022)
    if an >= 2022:
        rr = connus["patrimoine"].get(an)
        grow = f'G{x-1}*(1+{H["croissanceGen"]})'
        if an == 2022:
            f = f'=IF(Hypothèses!$C$4=1,Hypothèses!$C${rr},Hypothèses!$D${rr})'
        elif rr:
            f = f'=IF(Hypothèses!$C$4=1,IF(ISBLANK(Hypothèses!$C${rr}),{grow},Hypothèses!$C${rr}),IF(ISBLANK(Hypothèses!$D${rr}),{grow},Hypothèses!$D${rr}))'
        else:
            f = "=" + grow
        formule(m, f"G{x}", f, NB1)
        formule(m, f"H{x}", f'={H["partTop1"]}*$G${lig[2022] if 2022 in lig else x}*(1+{H["rendementTop1"]})^(A{x}-{H["anneeRef"]})', NB1)
        formule(m, f"I{x}", f"=H{x}/G{x}", PCT1)
    if an >= 2025:
        formule(m, f"F{x}", f'={H["p1_2021"]}*D{x}/$D${L0}', NB3)
        formule(m, f"J{x}", f"=Hypothèses!$C${mort[an]}", PCT2, lien=True)
        formule(m, f"K{x}", f'=H{x}*J{x}*{H["partPV"]}', NB1)
        formule(m, f"L{x}", f'=K{x}*{H["pfu"]}*{H["abattement"]}*(1-{H["dmtgDeduits"]})', NB3)
        formule(m, f"M{x}", f"=F{x}+L{x}", NB3, gras=True)
        formule(m, f"N{x}", f"=E{x}+M{x}", NB1)
a, z = lig[2025], lig[2040]
texte(m, "A4", "Résultats 2025-2040", gras=True)
res = [
    ("Scénario actif", "=Hypothèses!B4", None),
    ("Recettes supplémentaires en 2025", f"=M{a}", MD2),
    ("Cumul 2025-2040", f"=SUM(M{a}:M{z})", MD),
    ("dont pilier 1", f"=SUM(F{a}:F{z})", MD), ("dont pilier 2", f"=SUM(L{a}:L{z})", MD),
    ("Moyenne annuelle", f"=AVERAGE(M{a}:M{z})", MD2),
    ("Flux successoral cumulé 2025-2040", f"=SUM(D{a}:D{z})", '#,##0" Md€"'),
    ("Taux effectif 2025 : aujourd'hui → avec la réforme", f'=TEXT(E{a}/D{a},"0.0%")&" → "&TEXT(N{a}/D{a},"0.0%")', None),
]
for i, (lib, f, fmt) in enumerate(res, start=5):
    texte(m, f"A{i}", lib); m.merge_cells(f"A{i}:C{i}")
    formule(m, f"D{i}", f, fmt, gras=True, res=True); m.merge_cells(f"D{i}:E{i}")
formule(m, "G5", "Part du top 1 % en 2040"); formule(m, "J5", f"=I{z}", PCT1, gras=True, res=True)
m["G5"].font = NOIR
m.freeze_panes = "B14"

# ---------- Calcul individuel ----------
c = feuille(wb, "Calcul individuel", "Impôt d'un héritier en ligne directe : droit actuel et IGS", "Saisissez la situation en jaune. Barèmes 2024 (CGI art. 777, 779, 990 I) et barème de l'étude (CAE 2021).", [46, 16, 16, 12, 16, 4, 40, 16])
lignes = [("Patrimoine reçu, hors assurance-vie (€)", 300000, EUR), ("Dont assurance-vie reçue, primes versées avant 70 ans (€)", 0, EUR),
          ("Nombre de parents dont on hérite (1 ou 2)", 2, "0"), ("Plus-values latentes comprises dans le patrimoine (€)", 0, EUR)]
for i, (lib, v, fmt) in enumerate(lignes, start=4):
    texte(c, f"A{i}", lib); entree(c, f"B{i}", v, fmt)
D = P["droit"]
entree(c, "B9", D["abattementEnfant"], EUR, cle=False); texte(c, "A9", "Abattement par enfant et par parent (€)")
entree(c, "B10", D["assuranceVie"]["abattement"], EUR, cle=False); texte(c, "A10", "Abattement assurance-vie par bénéficiaire et par assuré (€)")
entree(c, "B11", P["igs"]["pfu"], PCT1, cle=False); texte(c, "A11", "PFU sur les plus-values latentes (IGS, taux de l'étude)")
def bareme(r0, titre, tranches):
    texte(c, f"A{r0}", titre, gras=True)
    entete(c, r0 + 1, ["Tranche de", "à", "Taux"])
    bas = 0
    for i, t in enumerate(tranches):
        x = r0 + 2 + i
        entree(c, f"A{x}", bas, EUR, cle=False)
        haut = INF if t["jusqua"] == "Infinity" else t["jusqua"]
        entree(c, f"B{x}", haut, EUR, cle=False); entree(c, f"C{x}", t["taux"], PCT2, cle=False)
        bas = haut
    return r0 + 2, r0 + 1 + len(tranches)
b1 = bareme(13, "Barème en ligne directe (droit actuel)", D["baremeLigneDirecte"])
b2 = bareme(b1[1] + 2, "Assurance-vie, art. 990 I (droit actuel)", D["assuranceVie"]["bareme"])
b3 = bareme(b2[1] + 2, "Barème de l'IGS, sur toutes les sommes reçues dans la vie", P["igs"]["bareme"])
def impot(base_expr, b):
    lo, hi = b
    return f"SUMPRODUCT((({base_expr})>A{lo}:A{hi})*(IF(({base_expr})<B{lo}:B{hi},({base_expr}),B{lo}:B{hi})-A{lo}:A{hi})*C{lo}:C{hi})"
def impot2(cell, b):
    lo, hi = b
    # max(0, min(base, haut) - bas) * taux, base = cell
    return f"SUMPRODUCT((({cell}>A{lo}:A{hi})*1)*((({cell}<B{lo}:B{hi})*{cell})+(({cell}>=B{lo}:B{hi})*B{lo}:B{hi})-A{lo}:A{hi})*C{lo}:C{hi})"
texte(c, "G3", "Calcul", gras=True)
calc = [
    ("Part reçue de chaque parent (€)", "=B4/B6", EUR),
    ("Base taxable par parent (€)", "=MAX(0,H4-B9)", EUR),
    ("Droits de succession, total (€)", f"={impot2('H5', b1)}*B6", EUR),
    ("Assurance-vie reçue de chaque parent (€)", "=B5/B6", EUR),
    ("Base taxable assurance-vie par parent (€)", "=MAX(0,H7-B10)", EUR),
    ("Prélèvement assurance-vie, total (€)", f"={impot2('H8', b2)}*B6", EUR),
    ("Droit actuel : impôt total (€)", "=H6+H9", EUR),
    ("Somme reçue (€)", "=B4+B5", EUR),
    ("IGS : impôt sur les sommes reçues (€)", f"={impot2('H11', b3)}", EUR),
    ("IGS : PFU sur les plus-values latentes (€)", "=MIN(B7,B4)*B11", EUR),
    ("IGS : impôt total (€)", "=H12+H13", EUR),
    ("Écart IGS − droit actuel (€)", "=H14-H10", EUR),
    ("Taux moyen, droit actuel", "=IF(H11>0,H10/H11,0)", PCT1),
    ("Taux moyen, IGS", "=IF(H11>0,H14/H11,0)", PCT1),
]
for i, (lib, f, fmt) in enumerate(calc, start=4):
    texte(c, f"G{i}", lib); formule(c, f"H{i}", f, fmt, gras=lib.startswith(("Droit actuel : impôt", "IGS : impôt total", "Écart")), res=lib.startswith(("Droit actuel : impôt", "IGS : impôt total", "Écart")))
texte(c, "G19", "Hypothèses : héritage en ligne directe, sans donation antérieure ; chaque parent transmet la moitié quand on hérite des deux.", italique=True)

# ---------- Gain salaire ----------
g = feuille(wb, "Gain salaire", "Ce que rapporterait à un actif une part des recettes de l'IGS", "Variante du site : l'étude affecte les recettes à l'investissement public, pas aux ménages.", [52, 18, 60])
M = P["macro"]
ent = [("Année (« Moyenne » ou 2025 à 2040)", "Moyenne", None), ("Part des recettes versée aux actifs", 0.5, PCT1), ("Votre salaire net mensuel (€)", 2100, EUR)]
for i, (lib, v, fmt) in enumerate(ent, start=4):
    texte(g, f"A{i}", lib); entree(g, f"B{i}", v, fmt)
liste(g, "B4", ["Moyenne"] + [str(x) for x in range(2025, 2041)])
par = [("Personnes en emploi", M["personnesEnEmploi"]["valeur"], NB, M["personnesEnEmploi"]["source"]),
       ("Masse salariale brute (€)", M["masseSalarialeBrute"]["valeur"], '#,##0', M["masseSalarialeBrute"]["source"]),
       ("Ratio salaire net / brut", M["ratioNetSurBrut"]["valeur"], PCT1, M["ratioNetSurBrut"]["source"])]
for i, (lib, v, fmt, src) in enumerate(par, start=8):
    texte(g, f"A{i}", lib); entree(g, f"B{i}", v, fmt, cle=False); texte(g, f"C{i}", src, wrap=True)
calc = [
    ("Recettes de l'IGS cette année-là (Md€)", f"=IF(B4=\"Moyenne\",'Modèle IGS'!D10,INDEX('Modèle IGS'!M{a}:M{z},MATCH(VALUE(B4),'Modèle IGS'!A{a}:A{z},0)))", MD2),
    ("Versé aux actifs (Md€)", "=B12*B5", MD2),
    ("Un montant égal pour chaque actif : gain mensuel (€)", "=B13*1E9/B8/12", EUR2),
    ("Une baisse des cotisations salariales : gain mensuel (€)", "=B13*1E9*(B6*12/B10)/B9/12", EUR2),
]
for i, (lib, f, fmt) in enumerate(calc, start=12):
    texte(g, f"A{i}", lib); formule(g, f"B{i}", f, fmt, gras=i >= 14, res=i >= 14, lien=i == 12)

sources(wb, [
    ("Étude et classeur de chiffrage", "Fondation Jean-Jaurès, « Face à la grande transmission, l'impôt sur les grandes successions » (Ouizille, Iberrakene, Julien-Vauzelle), novembre 2024", P["igs"]["source"]["url"]),
    ("Flux successoral", C["flux"]["source"], None),
    ("PIB 2025", A["sources"]["pib"], A["sources"]["pibUrl"]),
    ("Droits de succession et donations 2024-2026", A["sources"]["dmtg"], A["sources"]["dmtgUrl"]),
    ("Patrimoine des ménages 2024", A["sources"]["patrimoine"], A["sources"]["patrimoineUrl"]),
    ("PFU 2026", A["sources"]["pfu"], None),
    ("Part du top 1 %", C["pilier2"]["partTop1"]["source"], None),
    ("Croissance du patrimoine du top 1 %", C["pilier2"]["sources"]["rendement"], None),
    ("Plus-values latentes", C["pilier2"]["sources"]["partPV"], None),
    ("Barèmes du droit actuel", D["source"] + " (montants 2024)", None),
    ("Emploi, salaires", M["personnesEnEmploi"]["source"] + " ; " + M["masseSalarialeBrute"]["source"], M["masseSalarialeBrute"]["url"]),
])
verification(wb, VERIF)
police_partout(wb)
wb.move_sheet("Lisez-moi", offset=-len(wb.sheetnames))
wb.save(sys.argv[1])
