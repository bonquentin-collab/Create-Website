# Classeur du site de campagne « L'héritage, ça se décide » (campagne/chiffrages/Chiffrage_Campagne.xlsx).
# Les données et le calage viennent du code du site (export Node ci-dessous) ; tous les calculs sont des formules.
import json
import os
import subprocess
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault("PARAMETRES", os.path.join(ICI, "parametres.json"))
if not os.path.exists(os.environ["PARAMETRES"]):
    json.dump({}, open(os.environ["PARAMETRES"], "w"))
from commun import *  # noqa: E402

EXPORT = r"""
const m = await import(process.argv[1] + '/campagne/js/moteur/modele.js');
const s = await import(process.argv[1] + '/campagne/js/moteur/scenarios.js');
const d = await import(process.argv[1] + '/campagne/js/donnees/sources.js');
const out = { calage: m.calage, heritiers: d.heritiers, niches: d.niches, flux: d.flux, plusValues: d.plusValues, baremes: d.baremes,
  scenarios: Object.fromEntries(Object.entries(s.scenarios).map(([k, v]) => [k, { nom: v.nom, reglages: v.reglages(), r: m.evaluer(v.reglages()) }])) };
console.log(JSON.stringify(out, (k, v) => (v === Infinity ? 1e15 : v)));
"""
RACINE = os.path.dirname(os.path.dirname(ICI))
D = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", EXPORT, RACINE]))
T = D["heritiers"]["tranches"]
NT = len(T)

wb = nouveau()
lisez_moi(wb, "Chiffrage du site « L'héritage, ça se décide »", [
    ("Contenu",),
    "Réforme : réglages modifiables (cellules jaunes) : barème sur ce que chacun reçoit dans sa vie, abattement, traitement de chaque niche.",
    "Tranches : les 14 tranches d'héritiers du CAE (2021), la composition de leurs héritages et l'impôt avant et après réforme.",
    "Calage : nombre d'héritiers et ampleur des niches, choisis pour reproduire les recettes et les coûts publiés par le CAE.",
    "Résultats : recettes de 2025 à 2040, qui suivent le flux successoral, plus les plus-values latentes.",
    ("Vérification",),
    "Avec les réglages par défaut (IGS), les résultats sont identiques à ceux du site (contrôle en bas de la feuille Résultats).",
    ("Limites",),
    "Montants par tranche lus sur les graphiques du CAE ; profils des niches supposés ; aucun effet de comportement. Voir la page Méthode du site.",
])

# ---------- Réforme ----------
ws = feuille(wb, "Réforme", "Réglages de la réforme (scénario IGS par défaut)", "Modifiez les cellules jaunes.", [46, 16, 14, 60])
R = D["scenarios"]["igs"]["reglages"]
entete(ws, 4, ["Tranche du barème", "Jusqu'à (€)", "Taux"])
for i, t in enumerate(R["bareme"]):
    texte(ws, f"A{5+i}", f"Tranche {i+1}")
    entree(ws, f"B{5+i}", t["jusqua"] if t["jusqua"] < 1e14 else 1e15, EUR)
    entree(ws, f"C{5+i}", t["taux"], PCT1)
texte(ws, "D11", "La dernière tranche n'a pas de plafond (1e15).")
texte(ws, "A13", "Abattement sur ce qui est reçu (€)"); entree(ws, "B13", R["abattement"], EUR)
N_ = R["niches"]
reg = [
    ("Tout imposer, sans niche (1 = oui)", 1 if N_["tout"] else 0, "Toutes les transmissions de la vie à leur valeur réelle ; plus-values pour tous."),
    ("Assurance-vie au barème (1 = oui)", 1 if N_["assuranceVie"] == "bareme" else 0, ""),
    ("Démembrement : usufruit taxé (1 = oui)", 1 if N_["demembrement"] == "supprimer" else 0, ""),
    ("Pacte Dutreil : part réintégrée", {"supprimer": 1, "resserrer": 1 / 3, "maintenir": 0}[N_["dutreil"]], "1 = supprimé ; 1/3 = exonération ramenée de 75 à 50 % ; 0 = maintenu."),
    ("Donations anciennes et biens non déclarés comptés (1 = oui)", 1 if N_["toutesTransmissions"] else 0, ""),
    ("Plus-values latentes : multiplicateur de la série top 1 %", {"effacees": 0, "top1": 1, "tous": 1 / D["plusValues"]["partTop1"]}[N_["plusValues"]], "0 = effacées ; 1 = top 1 % ; 2 = pour tous (hypothèse)."),
]
for k, (lib, v, note) in enumerate(reg):
    texte(ws, f"A{15+k}", lib); entree(ws, f"B{15+k}", v, NB3); texte(ws, f"D{15+k}", note)
TOUT, AV, DEM, DUT, AUT, PV = (f"Réforme!$B${15+k}" for k in range(6))
ABAT = "Réforme!$B$13"

# ---------- Calage ----------
cs = feuille(wb, "Calage", "Calage sur le CAE", "Valeurs calculées par le site ; les contrôles recalculent les cibles.", [52, 16, 60])
C = D["calage"]
texte(cs, "A4", "Recettes actuelles du CAE (Md€)"); entree(cs, "B4", D["heritiers"]["recettesActuelles"], NB1)
texte(cs, "A5", "Nombre d'héritiers par an (formule)"); formule(cs, "B5", f"=B4*1e9/SUMPRODUCT(Tranches!$B$6:$B${5+NT},Tranches!$F$6:$F${5+NT})", NB)
texte(cs, "A6", "Base économique du modèle (Md€)"); formule(cs, "B6", f"=B5*SUMPRODUCT(Tranches!$B$6:$B${5+NT},Tranches!$D$6:$D${5+NT})/1e9", NB1)
texte(cs, "A7", "Part déclarée quand aucun droit n'est payé"); entree(cs, "B7", D["heritiers"]["partDeclareeSansDroits"], PCT1)
texte(cs, "A9", "Échelle du profil assurance-vie"); entree(cs, "B9", C["echelles"]["assuranceVie"], NB3, note="Calée par le site pour un coût de 5 Md€ (CAE)")
texte(cs, "A10", "Échelle du profil démembrement"); entree(cs, "B10", C["echelles"]["demembrement"], NB3, note="Calée pour 2,8 Md€ (CAE)")
texte(cs, "A11", "Échelle du profil Dutreil"); entree(cs, "B11", C["echelles"]["dutreil"], NB3, note="Calée pour 1,4 Md€ (Dutreil 75 → 50 %, CAE)")
texte(cs, "A12", "Abattement du droit actuel (€)"); entree(cs, "B12", 100000, EUR)

# ---------- Tranches ----------
ts = feuille(wb, "Tranches", "Héritiers par tranche et impôt", "Une ligne par tranche de ce qui est reçu sur la vie (CAE, 2021).", [12, 8, 12, 14, 9, 13, 9, 9, 9, 9, 9, 14, 14, 13, 13])
entete(ts, 5, ["Tranche", "Poids", "Net reçu (€)", "Brut économique (€)", "Taux payé (CAE)", "Impôt observé (€)", "Part déclarée",
               "Assurance-vie", "Démembrement", "Dutreil", "Autre", "Base droit actuel (€)", "Base réforme (€)", "Impôt actuel (€)", "Impôt réforme (€)"])
BA = D["baremes"]["actuel"]
# Barème actuel en dur (colonnes R:X) et barème de la réforme (Réforme!B5:C11) : impôt par tranches successives.
def impot(base, seuils, taux, ligne):
    termes = []
    for k in range(7):
        bas = "0" if k == 0 else seuils(k - 1)
        termes.append(f"MAX(0,MIN({base},{seuils(k)})-{bas})*{taux(k)}")
    return "=" + "+".join(termes)
texte(ts, "Q4", "Barème actuel");
for k, t in enumerate(BA):
    entree(ts, f"R{5+k}", t["jusqua"] if t["jusqua"] < 1e14 else 1e15, EUR, cle=False); entree(ts, f"S{5+k}", t["taux"], PCT1, cle=False)
P = D["niches"]["profils"]
for i, t in enumerate(T):
    r = 6 + i
    texte(ts, f"A{r}", t["id"]); entree(ts, f"B{r}", t["p"], PCT1, cle=False); entree(ts, f"C{r}", t["a"], EUR, cle=False)
    entree(ts, f"E{r}", t["tauxEco"], PCT1, cle=False)
    formule(ts, f"D{r}", f"=C{r}/(1-E{r})", EUR); formule(ts, f"F{r}", f"=D{r}*E{r}", EUR)
    formule(ts, f"G{r}", f"={t['tauxEco']}/{t['tauxDeclare']}" if t["tauxDeclare"] else "=Calage!$B$7", PCT1)
    formule(ts, f"H{r}", f"={P['assuranceVie'][i]}*Calage!$B$9", PCT1)
    formule(ts, f"I{r}", f"={P['demembrement'][i]}*Calage!$B$10", PCT1)
    formule(ts, f"J{r}", f"={P['dutreil'][i]}*Calage!$B$11", PCT1)
    formule(ts, f"K{r}", f"=1-G{r}-H{r}-I{r}-J{r}", PCT1)
    formule(ts, f"L{r}", f"=D{r}*G{r}", EUR)
    formule(ts, f"M{r}", f"=IF({TOUT}=1,D{r},D{r}*(G{r}+H{r}*{AV}+I{r}*{DEM}+J{r}*{DUT}+K{r}*{AUT}))", EUR)
    formule(ts, f"N{r}", impot(f"MAX(0,L{r}-Calage!$B$12)", lambda k: f"$R${5+k}", lambda k: f"$S${5+k}", r), EUR)
    formule(ts, f"O{r}", impot(f"MAX(0,M{r}-{ABAT})", lambda k: f"Réforme!$B${5+k}", lambda k: f"Réforme!$C${5+k}", r), EUR)

# ---------- Résultats ----------
rs = feuille(wb, "Résultats", "Recettes de 2025 à 2040 (Md€ courants)", None, [10, 14, 14, 14, 14, 14])
texte(rs, "A3", "Recettes actuelles du modèle, époque CAE (Md€)"); formule(rs, "D3", f"=Calage!$B$5*SUMPRODUCT(Tranches!$B$6:$B${5+NT},Tranches!$N$6:$N${5+NT})/1e9", MD2)
texte(rs, "A4", "Recettes de la réforme, époque CAE (Md€)"); formule(rs, "D4", f"=Calage!$B$5*SUMPRODUCT(Tranches!$B$6:$B${5+NT},Tranches!$O$6:$O${5+NT})/1e9", MD2)
entete(rs, 6, ["Année", "Flux (Md€)", "Droits actuels", "Supplément barème", "Plus-values", "Supplément total"])
for k, (a, f) in enumerate(zip(D["flux"]["annees"], D["flux"]["valeurs"])):
    r = 7 + k
    entree(rs, f"A{r}", a, "0", cle=False); entree(rs, f"B{r}", f, NB, cle=False)
    formule(rs, f"C{r}", f"=$D$3*B{r}/Calage!$B$6", MD)
    formule(rs, f"D{r}", f"=($D$4-$D$3)*B{r}/Calage!$B$6", MD)
    entree(rs, f"G{r}", D["plusValues"]["top1"][k], NB1, cle=False)
    formule(rs, f"E{r}", f"=G{r}*IF({TOUT}=1,{1/D['plusValues']['partTop1']},{PV})", MD)
    formule(rs, f"F{r}", f"=D{r}+E{r}", MD, gras=True)
texte(rs, "G6", "Plus-values top 1 % (FJJ)")
texte(rs, "A24", "Total 2025-2040", gras=True); formule(rs, "F24", "=SUM(F7:F22)", MD, gras=True)
sc = D["scenarios"]["igs"]["r"]
texte(rs, "A26", "Contrôle : supplément 2025 du site (IGS)"); entree(rs, "F26", round(sc["supplement"][0], 4), MD2, cle=False)
texte(rs, "A27", "Écart classeur − site (doit être nul)"); formule(rs, "F27", "=ROUND(F7-F26,2)", MD2)

sources(wb, [
    ("Tranches d'héritiers, taux payés, recettes et coûts des niches", "CAE, « Repenser l'héritage », note n° 69 et Focus n° 77, 2021", "https://www.cae-eco.fr/repenser-lheritage"),
    ("Flux successoral 2025-2040, plus-values latentes du top 1 %, barème de l'IGS", "Fondation Jean-Jaurès, novembre 2024, tableaux 1, 6 et 8", "https://www.jean-jaures.org/publication/face-a-la-grande-transmission-limpot-sur-les-grandes-successions/"),
    ("Barème actuel en ligne directe", "Code général des impôts, art. 777 et 779", "https://www.legifrance.gouv.fr/"),
])
police_partout(wb)
wb.save(sys.argv[1])
print("ok", sys.argv[1])
