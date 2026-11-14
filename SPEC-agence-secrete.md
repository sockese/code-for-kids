# Spécification — Nouvelle page d'accueil + « Agence de messages secrets » (binaire et cryptographie)

*Statut : développé et publié (12 niveaux, tests automatiques dans la page #test).*

## 1. Objectifs
1. Une **nouvelle page d'accueil** qui devient un portail : on se connecte une fois (prénom), puis on choisit une **activité**.
2. Un **nouveau jeu** : l'**Agence de messages secrets**. L'enfant est un agent secret qui accomplit des missions : décoder et coder des messages avec des codes de plus en plus malins, du simple code à symboles jusqu'au **binaire**. Ludique (histoire, grades, insignes) et éducatif (comprendre le codage de l'information et le chiffrement).

Inspirations : les activités de **CS Unplugged** (messages secrets, binaire, cartes recto-verso) et le scénario « Les messages secrets » du Loria. Il n'existe pas, à ma connaissance, de vrai jeu français d'ordinateur de ce type : tout le contenu et l'histoire sont **originaux**.

## 2. Page d'accueil et connexion
1. **Écran d'arrivée** : titre de l'appli (nom à choisir, par ex. « **Labo Code** »), tortue et agent en illustration, bouton « Commencer ».
2. **Connexion** : liste des joueurs existants (un clic) ou nouveau prénom (clavier). Choix d'un **avatar** parmi 8 emojis (liste, pas de saisie). Toujours **sans mot de passe**.
3. **Hub « Mes activités »** : grandes cartes illustrées, avec la progression de chaque activité :
   - 🐢 **Tortue — Dessins** (jeu actuel, 75 niveaux)
   - 🐢 **Tortue — Labyrinthes** (extension, voir `SPEC-labyrinthes.md`)
   - 🕵️ **Agence secrète** (nouveau)
   - Bandeau : prénom, avatar, **points totaux** et rang global, boutons son / clair-sombre / changer de joueur.
4. Les adresses existantes (`#/liste`, `#/niveau/C3`…) continuent de fonctionner : la progression d'Auguste est **conservée**.

## 3. L'Agence secrète — principe
- **Histoire** : la « Centrale » envoie des missions. Chaque mission = un message à décoder, un message à coder, ou une énigme à résoudre. Un petit dialogue d'agent (2-3 phrases) introduit chaque série.
- **Progression** : 6 séries, environ **40 missions**, toutes ouvertes. Grades (**Recrue, Agent, Agent spécial, Agent secret, Chef de la Centrale**) selon les points. **Insignes** à collecter par série.
- **Outils d'agent** : chaque série débloque un outil réutilisable (roue de César, table binaire, alphabet morse…), consultable pendant les missions.
- **Messages** : tirés dans un bon stock de phrases adaptées aux enfants (~80, en français), avec des variantes aléatoires, pour rejouer sans retrouver toujours les mêmes.
- **Réponses** : saisie avec un **clavier à l'écran A–Z** conçu pour la tablette (pas de clavier système), ou choix dans une liste. Majuscules, accents et espaces ne comptent pas dans la vérification.
- **Aides** : indice, outil, solution (adulte).

## 4. Les séries de missions
| Série | Thème | Contenu |
|---|---|---|
| 1. Codes à symboles | Premiers codes | Table symbole ↔ lettre (emojis, formes). Décoder, puis coder. Comprendre qu'un code est une **table de conversion**. |
| 2. Chiffre de César | Décalage | Roue de César interactive (disque à tourner). Décoder avec la clé donnée, coder avec sa clé, puis **casser** un code sans la clé (essayer les décalages, repérer le mot qui a du sens). |
| 3. Le binaire | Compter avec 0 et 1 | **Cartes recto-verso** (1, 2, 4, 8, 16) à retourner pour fabriquer un nombre. Convertir nombre ↔ binaire. |
| 4. Texte en binaire | Les lettres deviennent des nombres | Lettre → numéro (A=1…) → binaire sur 5 chiffres. Décoder un mot écrit en 0 et 1, puis coder son prénom. |
| 5. Autres codes | Variété | Morse (avec sons), code miroir/inversé, code à clé secrète, code à grille. |
| 6. Opérations spéciales | Mélanges | Messages doublement codés (César puis binaire), cryptanalyse simple (fréquence des lettres), **bit de parité** pour détecter une erreur de transmission. |

Chaque série suit le même rythme : **1 découverte guidée → 3 à 4 missions → 1 mission « boss »**.

## 5. Mode « Message pour un ami » (sans serveur, sans compte)
- L'enfant écrit un message, choisit un code et une clé, et obtient un **message codé** à copier.
- Il le transmet à un ami (SMS, mail, papier) ; l'ami le colle dans « Décoder un message » et le résout avec ses outils.
- Aucun envoi sur Internet : tout reste sur l'appareil. Aucun contenu libre n'est stocké ailleurs.

## 6. Points, récompenses, ludique
- Points : 10 par mission réussie du premier coup, 5 si avec indice, 15 pour une mission « boss ». Pas de pénalité : on peut recommencer.
- Chaque mission réussie ajoute une **page à un « dossier secret »** (collection de messages décodés qui racontent une petite histoire).
- Sons simples (réussite, erreur, morse), animation de tampon « CONFIDENTIEL ».

## 7. Technique
- Même appli, même dépôt, même PWA (hors ligne, installable sur la tablette Android).
- Réorganisation du code : `js/core/` (profil, stockage, thème, en-tête, routage), `js/tortue/` (existant), `js/agence/` (nouveau). Un seul stockage : le profil existant est enrichi (`agence`, `avatar`) sans rien perdre.
- Pas de bibliothèque extérieure pour l'Agence : HTML/CSS/JavaScript simple, canevas ou SVG pour la roue et les cartes, WebAudio pour le morse.
- Interface en français, grands boutons, lisible sur tablette, mode clair et sombre, pas de défilement de page.

## 8. Tests
Une page de test automatique : pour chaque type de mission, génération de messages, vérification que codage puis décodage redonne le message d'origine (César, binaire, morse, parité…), et que les réponses fausses sont refusées.

## 9. Plan de réalisation (si vous validez)
1. **Étape 1** : refonte du portail (accueil, connexion avec avatar, hub) + déplacement du code existant, sans régression.
2. **Étape 2** : Tortue — Labyrinthes.
3. **Étape 3** : Agence secrète, série par série (1-2 d'abord, à tester ensemble, puis les autres).
4. Publication à chaque étape sur le même site.

## 10. Points à valider
1. Nom de l'appli : « **Labo Code** » vous va ? et de l'agence : « Agence Z » ?
2. Avatars emoji : oui ? (sinon, pas d'avatar)
3. Échange de messages par **copier-coller** (aucun serveur) : suffisant ?
4. Les 6 séries et ~40 missions : trop, pas assez ?
5. Le morse avec sons : souhaité ?
