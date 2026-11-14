# Spécification — « Usine à machines » (physique + robot programmé, style briques LEGO)

*Statut : développé et publié (v10) : 25 niveaux + atelier libre. Simulation à pas fixe, déterministe ; plateau 12 × 8 ; robot sur la ligne du sol.*

## 1. Objectif
Une nouvelle activité du hub : **🏭 Usine à machines**. L'enfant construit des machines avec des pièces façon briques LEGO pour atteindre un but (une bille dans un seau, une porte à ouvrir, un robot à faire sortir). Les deux idées retenues sont réunies :
- **Physique** : billes, rampes, tapis, ressorts, ventilateurs, aimants.
- **Robot programmé** : un petit robot-LEGO « Brickbot » qui suit un programme en blocs (comme dans Tortue Blocs et Labyrinthes) et agit sur la machine.

Ce que l'enfant apprend : cause et effet, découpage en étapes, conditions (« si le capteur voit la bille »), boucles, logique (portes ET / OU de l'Atelier de logique).

Contenu et graphismes **originaux** ; aucun élément copié d'un jeu existant (Contraption Maker, Crazy Machines, etc. ne sont qu'une source d'inspiration pour le principe).

## 2. Écrans
1. **Liste des niveaux** : 5 mondes, 25 niveaux, puis l'**Atelier libre** tout à la fin. Étoiles, points, rangs communs avec le reste de l'appli.
2. **Niveau** : consigne et but en haut, plateau au centre, plateau de pièces à droite (ou en bas sur petit écran), boutons ▶ Lancer, ⏸ Pause, ⏭ Pas à pas, ↺ Recommencer, 💡 Indice, 👀 Solution (adulte), curseur de vitesse (comme les autres jeux).
3. **Réussite** : confettis, étoiles, points, nouvelle pièce débloquée.
4. **Atelier libre** : toutes les pièces, aucun but, 3 emplacements de sauvegarde pour ses inventions (mémorisées sur la tablette).

## 3. Le plateau et la construction
- Plateau en **grille de 12 × 8 cases** avec des tenons (studs) visibles, fond de plaque LEGO.
- **Construction au toucher**, sans glisser-déposer difficile : on touche une pièce dans le plateau de pièces, puis une case de la grille pour la poser. Toucher une pièce posée la **tourne**, un appui long (ou le bouton 🗑) l'**enlève**.
- **Nombre de pièces limité** par niveau, avec la liste des pièces disponibles (3 à 4 types au début, jusqu'à 10 à la fin).
- Les pièces fixes du niveau (distributeur de billes, murs, seau, porte, interrupteur) sont grisées : on ne peut pas les déplacer.

## 4. Les pièces
| Famille | Pièces |
|---|---|
| Mouvement | rampe (4 sens), tapis roulant (gauche / droite), ressort-trampoline, pare-chocs |
| Forces | ventilateur, aimant |
| Contrôle | capteur de passage, interrupteur à bille, minuteur, levier |
| Logique | porte ET, porte OU, porte NON (reprises de l'Atelier de logique) |
| Cibles | seau, porte à ouvrir, lampe à allumer |
| Robot | Brickbot (départ, sortie), bouton, caisse à pousser |

## 5. Le moteur (simulation)
- Simulation **déterministe** par pas de temps fixe (même résultat à chaque lancement : pas de « ça marche une fois sur deux »).
- Billes : gravité, glissement sur les rampes à 45°, rebonds contre les murs, poussée du ventilateur, attraction de l'aimant, vitesse du tapis. Règles simples et lisibles plutôt que de la physique réaliste instable.
- Robot : exécute le programme **une instruction à la fois**, sur la même horloge que les billes. Blocs disponibles : avancer, tourner à gauche / droite, appuyer sur le bouton, pousser, « si capteur… », « si porte ouverte… », « répéter », « répéter jusqu'à la sortie ».
- Aucune bibliothèque extérieure : moteur maison en JavaScript, léger pour la tablette, fonctionne hors ligne.

## 6. Les 25 niveaux
| Monde | Niveaux | Contenu |
|---|---|---|
| 1. L'atelier | 5 | poser des rampes pour guider une bille jusqu'au seau |
| 2. Les mécanismes | 5 | tapis, ressorts, ventilateurs, aimants ; plusieurs billes |
| 3. Capteurs et portes | 5 | un capteur ouvre une porte, un interrupteur libère une bille, un minuteur |
| 4. La logique | 4 | deux capteurs en ET / OU pour ouvrir la porte finale |
| 5. Le robot | 6 | Brickbot au programme : bouton, caisse, conditions, boucles, puis un niveau final qui mélange robot et machine |
| **Atelier libre** | — | toutes les pièces, sans but, avec sauvegarde |
Chaque niveau a : consigne, but, indice, solution, nombre de pièces optimal (2ᵉ étoile), limite de pièces.

## 7. Technique
- Même appli, mêmes fichiers (`js/usine.js` + `css/usine.css`), mêmes outils (profil, points, thème clair / sombre, PWA hors ligne). Blocs du robot via Blockly, comme les Labyrinthes.
- Sauvegarde : niveaux réussis et inventions de l'atelier libre dans le profil.
- Page de test `#test` : pour chaque niveau, une solution écrite doit réussir dans un nombre de pas donné ; un plateau vide ou une mauvaise construction doit échouer ; les simulations doivent être identiques à chaque exécution.

## 8. Plan de réalisation (si vous validez)
1. **Étape 1** : moteur, plateau, construction, mondes 1 et 2 (10 niveaux), à tester ensemble sur tablette.
2. **Étape 2** : capteurs, portes, logique (mondes 3 et 4, 9 niveaux).
3. **Étape 3** : le robot programmé (monde 5, 6 niveaux).
4. **Étape 4** : Atelier libre et sauvegardes.
Publication sur le même site à chaque étape.

## 9. Points à garder en tête
- La fluidité sur la tablette sera vérifiée en conditions réelles : je prévois un mode « pas à pas » et un curseur de vitesse.
- Si la physique des billes s'avère trop capricieuse, je simplifie les règles plutôt que d'ajouter des cas particuliers.
