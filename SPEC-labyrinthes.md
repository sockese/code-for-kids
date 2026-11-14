# Spécification — « Tortue Blocs : Labyrinthes » (extension inspirée de Blockly Games – Maze)

*Statut : développé et publié (12 niveaux, tests automatiques dans la page #test).*

## 1. Objectif pédagogique
Introduire les **conditions** (« si… sinon ») et la **boucle « répéter jusqu'à »**, notions absentes de la série actuelle (instructions, boucles, variables, fonctions). L'enfant ne dessine plus : il **guide la tortue dans un labyrinthe** jusqu'à son but, avec des blocs.

Principe repris de Blockly Games – Maze : une grille, un personnage, un but, des murs. Les premiers niveaux demandent d'avancer et tourner, puis apparaissent « répéter jusqu'à l'arrivée », puis « si chemin devant / à gauche / à droite », puis « si… sinon ». Le dernier niveau mélange tout. Les niveaux, plans de labyrinthes, graphismes et textes sont **originaux** (rien n'est copié).

## 2. Où cela se place dans l'appli
Nouvelle activité du hub (voir la spec « Agence secrète » pour la page d'accueil) : **🐢 Tortue — Labyrinthes**, à côté de **🐢 Tortue — Dessins** (le jeu actuel, inchangé). Même profil (prénom), mêmes points et rangs communs.

## 3. Le plateau
- Grille de **5×5 à 8×8** cases, dessinée sur un canevas (comme aujourd'hui), mode clair/sombre.
- Éléments : cases libres, murs, **départ** (la tortue, orientée), **arrivée** (une laitue 🥬 / une maison), et en niveau bonus des **fraises 🍓 à ramasser** en passant dessus.
- Pas de saisie au clavier : toutes les valeurs sont des **listes déroulantes** (comme les autres niveaux).

## 4. Les blocs
| Bloc | Rôle | Introduit |
|---|---|---|
| avancer (d'une case) | avance d'une case ; si un mur est devant, la tortue « cogne » et le programme s'arrête en échec | L1 |
| tourner à gauche / à droite (90°) | pivote sur place | L3 |
| répéter [2 à 10] fois | boucle déjà connue | L4 |
| **répéter jusqu'à l'arrivée** | répète tant que la tortue n'est pas sur le but | L5 |
| **si [chemin devant / à gauche / à droite]** | exécute les blocs si la case dans cette direction est libre | L7 |
| **si … sinon** | deux branches | L8 |
| manger (bonus) | ramasse la fraise de la case | L11 |
Aucun nombre à taper : les listes contiennent 2 à 10 pour les répétitions, et 3 directions pour les conditions.

## 5. Les niveaux (12 niveaux, série « L »)
| N° | Idée | Notion |
|---|---|---|
| L1 | une ligne droite, 3 cases | avancer |
| L2 | une ligne de 5 cases | plusieurs avancer |
| L3 | un coin | tourner |
| L4 | un U, trajets répétitifs | répéter n fois |
| L5 | escalier de 6 marches, nombre de blocs limité | répéter jusqu'à l'arrivée |
| L6 | long couloir de longueur « inconnue » | pourquoi « jusqu'à » est plus malin |
| L7 | un virage à gauche caché | si chemin à gauche |
| L8 | alternance mur / passage | si… sinon |
| L9 | serpent (mêmes règles à répéter) | boucle + si/sinon |
| L10 | labyrinthe en croix | règle « main gauche » |
| L11 | ramasser 3 fraises (bonus) | manger + conditions |
| L12 | grand labyrinthe final | tout |
Chaque niveau a : consigne, indice, solution (bouton adulte), nombre de blocs optimal (étoiles, +5 points), et, pour les niveaux 5 à 12, une **limite de blocs** qui oblige à utiliser les boucles et les conditions plutôt qu'une longue liste de « avancer ».

## 6. Déroulement d'un niveau
1. L'enfant assemble les blocs sous « ▶ quand on exécute » (mêmes réglages : bloc de départ en haut à gauche, tous les blocs visibles à gauche, curseur de vitesse).
2. « Exécuter » : la tortue marche case par case, le bloc en cours est surligné.
3. Issues : **arrivée atteinte** → réussite (points, étoiles, confettis) ; **mur** → la tortue cogne, message « Aïe, un mur ! » ; **programme terminé loin du but** → message d'aide ; **boucle infinie** → arrêt automatique après 1 000 pas.

## 7. Technique
- Même appli, mêmes fichiers (`js/labyrinthe.js` pour le moteur et les niveaux), mêmes outils (Blockly, localStorage, PWA hors ligne, mode clair/sombre).
- Moteur : simulation pas à pas déterministe (position, cap, cases). Les blocs sont convertis en JavaScript comme pour les dessins ; les conditions utilisent des fonctions `cheminDevant()`, `cheminGauche()`, `cheminDroite()`.
- Sauvegarde dans le profil existant (clé `labyrinthes`).

## 8. Tests
Une solution écrite en blocs par niveau ; la page `#test` vérifie qu'elle atteint le but, respecte la limite de blocs, et que des programmes volontairement faux (trop courts, qui cognent un mur) sont refusés.

## 9. Hors périmètre
Éditeur de labyrinthes par l'enfant, labyrinthes aléatoires (idées possibles pour plus tard).

## 10. Points à valider
1. Est-ce bien l'extension attendue (labyrinthes à la Blockly Games Maze) ? Sinon, l'autre piste « Blockly Games Turtle » est ce que fait déjà Tortue Blocs.
2. Une laitue 🥬 et des fraises 🍓, ou un autre décor (maison, fromage, etc.) ?
3. 12 niveaux, c'est bien ?
