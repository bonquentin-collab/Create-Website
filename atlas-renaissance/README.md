# Atlas de la Renaissance peinte

Carte interactive de 41 œuvres de la Renaissance (Italie et Nord), avec frise chronologique, dont 37 tableaux
« expliqués » à explorer sur leur reproduction : zones détourées, lampe d'exploration, « qui est qui », calques
d'analyse (composition, lumière, regards et gestes), jeu, trois niveaux de lecture (Découverte, Approfondi,
Expert) et dossier technique par œuvre. Chaque paragraphe cite ses sources.

En ligne : https://bonquentin-collab.github.io/Create-Website/atlas-renaissance/

## Fichiers

- `index.html` : page autonome (HTML, CSS et JavaScript dans un seul fichier). Seules dépendances externes :
  d3 7.9.0 (cdnjs) et les polices EB Garamond et Source Sans 3 (Google Fonts).
- `img/` : reproductions redimensionnées. Pour chaque tableau, `<id>.jpg` (pleine définition),
  `<id>_s.jpg` (vignette) et `<id>_b.jpg` (version floutée et désaturée servant de fond).

La progression, le niveau de lecture choisi et les scores du jeu sont gardés dans le navigateur de chaque visiteur
(`localStorage`), rien n'est envoyé ailleurs.

## Crédits des reproductions

Fichiers issus de Wikimedia Commons (copies publiques retrouvées sur GitHub), redimensionnés.

| Fichier | Œuvre | Fichier d'origine | Statut |
| --- | --- | --- | --- |
| `agneau` | Jan van Eyck, *L'Agneau mystique* | « Lamgods open » | domaine public |
| `ambassadeurs` | Hans Holbein le Jeune, *Les Ambassadeurs* | « Hans Holbein the Younger - The Ambassadors - Google Art Project » | domaine public |
| `amour` | Titien, *Amour sacré et Amour profane* | « Tiziano - Amor Sacro y Amor Profano (Galería Borghese, Roma, 1514) » | domaine public |
| `anges` | Pieter Bruegel l'Ancien, *La Chute des anges rebelles* | « Pieter Bruegel the Elder - The Fall of the Rebel Angels - Google Art Project » (identification probable) | domaine public |
| `annonciation` | Léonard de Vinci, *L'Annonciation* | « Annunciation (Leonardo) (cropped) » | domaine public |
| `arnolfini` | Jan van Eyck, *Les Époux Arnolfini* | « Van Eyck - Arnolfini Portrait » | domaine public |
| `assomption` | Titien, *L'Assomption de la Vierge* | « Tizian 041 » | domaine public |
| `bacchus` | Titien, *Bacchus et Ariane* | « Titian Bacchus and Ariadne » | domaine public |
| `cana` | Véronèse, *Les Noces de Cana* | « Les Noces de Cana - Paolo Veronese - Musée du Louvre Peintures INV 142 ; MR 384 » | domaine public |
| `castiglione` | Raphaël, *Portrait de Baldassare Castiglione* | « Baldassare Castiglione, by Raffaello Sanzio, from C2RMF retouched » | domaine public |
| `cene` | Léonard de Vinci, *La Cène* | « The Last Supper - Leonardo Da Vinci - High Resolution 32x16 » | domaine public |
| `chambre` | Mantegna, *La Chambre des Époux* | « Andrea Mantegna - Camera picta, la corte 01 » | domaine public |
| `chasseurs` | Pieter Bruegel l'Ancien, *Chasseurs dans la neige* | « Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project » | domaine public |
| `delices` | Jérôme Bosch, *Le Jardin des délices* | « The Garden of Earthly Delights by Bosch High Resolution » | domaine public |
| `descente` | Rogier van der Weyden, *La Descente de croix* | « Weyden-descendimiento-prado-Ca-1435 » | domaine public |
| `doni` | Michel-Ange, *Tondo Doni (La Sainte Famille)* | « Tondo Doni, por Miguel Ángel » | domaine public |
| `durer` | Albrecht Dürer, *Autoportrait de 1500* | « Albrecht Dürer - 1500 self-portrait (High resolution and detail) » | domaine public |
| `ecole` | Raphaël, *L'École d'Athènes* | « Raphael School of Athens » | domaine public |
| `flagellation` | Piero della Francesca, *La Flagellation du Christ* | « Piero, flagellazione » | domaine public |
| `galatee` | Raphaël, *Le Triomphe de Galatée* | « Galatea Raphael » | domaine public |
| `hermine` | Léonard de Vinci, *La Dame à l'hermine* | « The Lady with an Ermine » | domaine public |
| `joconde` | Léonard de Vinci, *La Joconde* | « Mona Lisa, by Leonardo da Vinci, from C2RMF retouched » | domaine public |
| `jugement` | Michel-Ange, *Le Jugement dernier* | « Last Judgement (Michelangelo) » | domaine public |
| `lamentation` | Mantegna, *La Lamentation sur le Christ mort* | « Lamentación sobre Cristo muerto, por Andrea Mantegna » | domaine public |
| `madone` | Raphaël, *La Madone Sixtine* | « RAFAEL - Madonna Sixtina (Gemäldegalerie Alter Meister, Dresden, 1513-14) » | domaine public |
| `mariage` | Raphaël, *Le Mariage de la Vierge* | « Raffaello - Spozalizio - Web Gallery of Art » | domaine public |
| `printemps` | Botticelli, *Le Printemps* | « Botticelli-primavera » | domaine public |
| `rochers` | Léonard de Vinci, *La Vierge aux rochers* | « Leonardo Da Vinci - Vergine delle Rocce (Louvre) » | domaine public |
| `sainteanne` | Léonard de Vinci, *La Vierge, l'Enfant Jésus et sainte Anne* | « Sainte Anne Leonard » | domaine public |
| `sixtine` | Michel-Ange, *La voûte de la chapelle Sixtine* | [« CAPPELLA SISTINA Ceiling »](https://commons.wikimedia.org/wiki/File:CAPPELLA_SISTINA_Ceiling.jpg) | photographie sous CC BY-SA 3.0, auteur indiqué sur la page du fichier |
| `tempete` | Giorgione, *La Tempête* | « Giorgione - Das Gewitter » | domaine public |
| `tombeau` | Michel-Ange, *La Mise au tombeau* | « Entombment Michelangelo » | domaine public |
| `transfiguration` | Raphaël, *La Transfiguration* | [« Transfigurazione (Raffaello) September 2015-1a »](https://commons.wikimedia.org/wiki/File:Transfigurazione_(Raffaello)_September_2015-1a.jpg) | photographie sous CC BY-SA 4.0, auteur indiqué sur la page du fichier |
| `tribut` | Masaccio, *Le Paiement du tribut* | « The Tribute Money by Masaccio » | domaine public |
| `trinite` | Masaccio, *La Trinité* | « Masaccio, Holy Trinity, 1425-28, Santa Maria Novella, Florence » | domaine public |
| `urbin` | Titien, *La Vénus d'Urbin* | « Tiziano - Venere di Urbino - Google Art Project » | domaine public |
| `venus` | Botticelli, *La Naissance de Vénus* | « Sandro Botticelli - La nascita di Venere - Google Art Project - edited » | domaine public |

Les licences des deux photographies sous CC BY-SA ont été relevées dans des métadonnées tierces : à vérifier sur
les pages Commons liées. Les versions redimensionnées, vignettes et fonds floutés de ces deux fichiers restent
sous la même licence. Pour *La Chute des anges rebelles*, la copie utilisée ne portait pas de métadonnées : le
fichier Commons d'origine est identifié par ses proportions et son aspect.

Quatre œuvres de la carte n'ont pas de fiche détaillée, faute d'une reproduction libre de droits accessible : la
*Crucifixion* du Tintoret, l'*Annonciation* de Fra Angelico (San Marco), l'*Assomption* du Corrège (coupole de
Parme) et le *Retable d'Issenheim* (la seule photographie trouvée, une vue de l'installation au musée, n'avait
ni auteur ni licence identifiables).

## Méthode

Les zones ont été tracées à la main, puis affinées par un détourage automatique (Segment Anything, ViT-B) et
contrôlées à l'œil : elles restent indicatives. Deux reproductions sont partielles, et les fiches le signalent : la *Trinité* de
Masaccio sans le squelette peint sous l'autel, la *Chambre des Époux* réduite au mur de la Cour. Les repères et les calques sont posés à la main d'après les textes
cités. Le détail des sources et des limites figure dans la section « Méthode et limites » de la page.
