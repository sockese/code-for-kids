# Spécification — « Tortue Blocs » (appli d'initiation à la programmation par blocs)

## 1. Contexte et objectif
Auguste (cycle 3, 9-11 ans) apprend les bases de la programmation avec Algoblocs, mais les séries E et suivantes sont verrouillées (abonnement établissement).
Objectif : une application **originale**, dans le même esprit pédagogique (assembler des blocs qui font dessiner une tortue), avec **tous les niveaux accessibles librement**.

**Choix de propriété intellectuelle** : aucun contenu d'Algoblocs (exercices, images, textes, code) n'est copié. Les niveaux, dessins, nom et graphismes sont créés pour ce projet. La bibliothèque open source Blockly (Apache 2.0, Google) fournit l'éditeur de blocs.

## 2. Utilisation
- Page web **locale** : dossier à ouvrir en double-cliquant sur `index.html`. Pas d'installation, pas de serveur, fonctionne hors ligne (Chrome, Edge, Firefox).
- **Pas de mot de passe** : à l'ouverture, Auguste tape son prénom (ou clique sur un prénom déjà enregistré). La progression est sauvegardée dans le navigateur, par prénom.

## 3. Écrans
1. **Accueil / Identification** : saisie du prénom, liste des profils existants.
2. **Liste des niveaux** : 6 séries (A à F), chaque niveau est une pastille (grisée = pas fait, verte = réussi, avec les étoiles). Tous les niveaux sont ouverts ; l'ordre est conseillé, pas imposé. Bandeau en haut : prénom, rang, points, barre de progression.
3. **Niveau** : à gauche la zone de blocs (Blockly, en français) ; à droite la zone de dessin avec le **dessin à reproduire** en grisé, la tortue, et les boutons Exécuter ▶, Arrêter, Recommencer, vitesse (lent/normal/rapide), grille. Consigne et bouton Indice au-dessus. Compteur de blocs « 4 / 6 ».
4. **Niveau réussi** : message, points gagnés, passage de rang éventuel, boutons « Niveau suivant » et « Retour à la liste ».
5. **Mode création libre** : zone de dessin vide, tous les blocs, sans objectif.

## 4. Moteur de dessin (la tortue)
- Zone de 600×600 pixels, tortue au départ orientée vers le haut, crayon baissé.
- Blocs de mouvement : **avancer de n**, **tourner à droite de n°**, **tourner à gauche de n°**, **lever / baisser le crayon**, **couleur du crayon** (rouge, orange, jaune, vert, bleu, violet, rose, noir).
- Le programme est converti en code JavaScript (visible dans un panneau « Voir le code » pour faire le lien blocs → code), exécuté en mémoire, puis **rejoué en animation** ; le bloc en cours est surligné.
- Sécurité : limite sur le nombre d'instructions pour éviter les boucles infinies.
- Cadrage automatique : le dessin cible est centré et agrandi pour tenir dans la zone.

## 5. Validation d'un niveau
- On compare le dessin du joueur et le dessin cible **géométriquement** (tolérance ~3 px) : peu importe la façon d'arriver au résultat. Les couleurs sont vérifiées quand le niveau l'exige.
- Contraintes pédagogiques par niveau :
  - nombre maximum de blocs (pour imposer l'usage des boucles) ;
  - blocs obligatoires (ex. variable, fonction) ;
  - boîte à outils limitée aux blocs utiles pour le niveau.
- Chaque niveau a une consigne, un indice, et une solution (réservée à l'adulte : bouton discret « Voir la solution »).

## 6. Séries de niveaux (74 niveaux, séries H « Directions » et G « Défis » ajoutées)
| Série | Thème | Blocs introduits | Niveaux |
|---|---|---|---|
| A | Instructions | avancer, tourner, couleur, crayon | 7 |
| H | Directions | aller en haut / bas / droite / gauche | 10 |
| B | Paramètres | longueurs et angles variés | 6 |
| C | Boucles | répéter | 10 |
| D | Boucles imbriquées | répéter dans répéter | 9 |
| E | Variables | créer, donner une valeur, ajouter, calculs | 14 |
| F | Fonctions | créer ses propres blocs, avec ou sans paramètre | 10 |
| G | Défis | tout combiner | 8 |

## 7. Points et rangs
- 10 points par niveau réussi la première fois, +5 si le programme tient dans le nombre de blocs optimal.
- 1 rang tous les 50 points, avec un nom (Œuf, Têtard, Tortue débutante…), barre de progression, petit son et animation de réussite (son désactivable).

## 8. Technique
- HTML + CSS + JavaScript « classique » (sans compilation), Blockly 10 copié dans `vendor/` pour le mode hors ligne.
- Sauvegarde : `localStorage` (profils, niveaux réussis, blocs en cours par niveau).
- Interface 100 % en français, gros boutons, couleurs vives, lisible sur ordinateur et tablette.

## 9. Hors périmètre (volontairement)
Comptes enseignants, gestion de classe, partage de défis en ligne, mots de passe, abonnement.

## 10. Tests
Chaque niveau possède une solution en blocs ; un script de test charge toutes les solutions, les exécute et vérifie que chacune valide son niveau.

## 11. Mode clair / sombre
Bouton en haut à droite ; suit par défaut le réglage de l'ordinateur, choix mémorisé. S'applique aussi à l'éditeur de blocs et à la zone de dessin.

## 12. Évolutions (version 2)
- **Vignettes** : chaque niveau de la liste montre le dessin à réaliser.
- **Aucune saisie de nombre** : toutes les valeurs se choisissent dans des listes adaptées au niveau (3 à 5 valeurs ; boucles de 2 à 10). Les variables sont déjà créées par le niveau.
- **Blocs « Directions »** (haut, bas, droite, gauche) et la série H qui va avec.
- Bloc « ▶ quand on exécute » toujours en haut à droite de la zone de blocs.
- **Curseur de vitesse** (5 crans) à la place de la liste.
- **Page sans défilement** : la zone de blocs et le dessin s'adaptent à la hauteur de l'écran ; message, indice et code s'affichent en superposition.
