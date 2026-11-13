/* Tortue Blocs — niveaux (originaux). Chaque niveau a une solution écrite en DSL (voir blocks.js).
   Les listes de valeurs proposées aux enfants sont déduites de la solution. */
(function () {
  'use strict';
  var TB = (window.TB = window.TB || {});

  var fd = function (n) { return ['fd', n]; };
  var rt = function (n) { return ['rt', n]; };
  var lt = function (n) { return ['lt', n]; };
  var N = function (n) { return ['N', n]; };
  var S = function (n) { return ['S', n]; };
  var E = function (n) { return ['E', n]; };
  var W = function (n) { return ['W', n]; };
  var rep = function (n, body) { return ['repeat', n, body]; };
  var col = function (c) { return ['color', c]; };
  var UP = ['up'], DOWN = ['down'];
  var set = function (v, e) { return ['set', v, e]; };
  var add = function (v, e) { return ['add', v, e]; };
  var def = function (name, params, body) { return ['def', name, params, body]; };
  var call = function (name) { return ['call', name, Array.prototype.slice.call(arguments, 1)]; };

  TB.SERIES = [
    { id: 'A', name: 'Instructions', desc: 'Emboîte tes premiers blocs !' },
    { id: 'H', name: 'Directions', desc: 'Va en haut, en bas, à droite, à gauche, sans avoir à tourner !' },
    { id: 'B', name: 'Paramètres', desc: 'Change les longueurs et les angles !' },
    { id: 'C', name: 'Boucles', desc: 'Utilise « répéter » pour dessiner plus vite !' },
    { id: 'D', name: 'Boucles imbriquées', desc: 'Mets une boucle dans une autre boucle !' },
    { id: 'E', name: 'Variables', desc: 'Garde des nombres en mémoire et fais-les évoluer !' },
    { id: 'F', name: 'Fonctions', desc: 'Crée tes propres blocs !' },
    { id: 'G', name: 'Défis', desc: 'Tout ce que tu sais faire, pour des dessins magnifiques !' }
  ];

  var LOOP = { tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'] };
  var VAR = ['variables_set', 'variables_get'];
  var FUNC = ['procedures_defnoreturn', 'procedures_callnoreturn'];
  var L = [];
  function lv(o, base) { for (var k in base) if (o[k] === undefined) o[k] = base[k]; L.push(o); }
  var NOTE_FN = ' (Tu peux renommer la fonction, par exemple « carre ».)';

  /* ---------- A : Instructions ---------- */
  lv({ id: 'A1', title: 'Premier pas', tools: ['fwd'],
    text: 'Fais avancer la tortue pour tracer le trait.',
    hint: 'Prends le bloc « avancer de » et accroche-le sous « ▶ quand on exécute ». Puis choisis la longueur dans la liste.',
    sol: [fd(150)] });
  lv({ id: 'A2', title: 'Un virage', tools: ['move'],
    text: 'Trace une ligne, tourne, puis trace encore.',
    hint: 'Pour faire un coin carré, la tortue tourne de 90°.',
    sol: [fd(150), rt(90), fd(100)] });
  lv({ id: 'A3', title: 'L’escalier', tools: ['move'],
    text: 'Reproduis cet escalier.',
    hint: 'Tourne à droite, puis à gauche, en alternance.',
    sol: [fd(80), rt(90), fd(80), lt(90), fd(80), rt(90), fd(80)] });
  lv({ id: 'A4', title: 'Le carré', tools: ['move'],
    text: 'Dessine un carré.',
    hint: 'Un carré a 4 côtés égaux et 4 angles droits (90°).',
    sol: [fd(100), rt(90), fd(100), rt(90), fd(100), rt(90), fd(100), rt(90)] });
  lv({ id: 'A5', title: 'Le triangle', tools: ['move'],
    text: 'Dessine un triangle dont les trois côtés sont égaux.',
    hint: 'Dans ce triangle, la tortue tourne de 120° à chaque coin (pas 60° !).',
    sol: [fd(100), rt(120), fd(100), rt(120), fd(100), rt(120)] });
  lv({ id: 'A6', title: 'En couleurs', tools: ['move', 'color'], colors: true,
    text: 'Dessine ce chemin en changeant de couleur à chaque côté.',
    hint: 'Le bloc « couleur du crayon » se met avant le trait à colorier.',
    sol: [col('rouge'), fd(100), rt(90), col('bleu'), fd(100), rt(90), col('vert'), fd(100), rt(90), col('orange'), fd(100)] });
  lv({ id: 'A7', title: 'Pointillés', tools: ['move', 'pen'],
    text: 'Trace une ligne en pointillés : trait, trou, trait, trou, trait.',
    hint: 'Pour avancer sans tracer : « lever le crayon ». Pour tracer à nouveau : « baisser le crayon ».',
    sol: [fd(50), UP, fd(30), DOWN, fd(50), UP, fd(30), DOWN, fd(50)] });

  /* ---------- H : Directions ---------- */
  var DIRHINT = 'Ces blocs déplacent la tortue dans une direction précise, sans qu’elle ait besoin de tourner. ';
  lv({ id: 'H1', title: 'Vers le haut', tools: ['dir'],
    text: 'Fais monter la tortue pour tracer ce trait.',
    hint: DIRHINT + 'Prends « aller en haut de ».',
    sol: [N(120)] });
  lv({ id: 'H2', title: 'En L', tools: ['dir'],
    text: 'Monte, puis va vers la droite.',
    hint: 'Un bloc « aller en haut », puis un bloc « aller à droite ».',
    sol: [N(100), E(100)] });
  lv({ id: 'H3', title: 'Le carré sans tourner', tools: ['dir'],
    text: 'Dessine un carré sans jamais tourner : haut, droite, bas, gauche.',
    hint: 'Quatre blocs, quatre directions différentes, la même longueur.',
    sol: [N(100), E(100), S(100), W(100)] });
  lv({ id: 'H4', title: 'L’escalier', tools: ['dir'],
    text: 'Monte cet escalier de 3 marches.',
    hint: 'Une marche = monter, puis aller à droite.',
    sol: [N(50), E(50), N(50), E(50), N(50), E(50)] });
  lv({ id: 'H5', title: 'La croix', tools: ['dir'],
    text: 'Dessine cette croix en partant de son centre.',
    hint: 'Monte, descends deux fois plus loin, remonte au centre. Puis fais pareil de gauche à droite.',
    sol: [N(60), S(120), N(60), W(60), E(120)] });
  lv({ id: 'H6', title: 'Le rectangle', tools: ['dir'],
    text: 'Dessine ce rectangle avec les blocs de direction.',
    hint: 'Droite 150, bas 80, gauche 150, haut 80.',
    sol: [E(150), S(80), W(150), N(80)] });
  lv({ id: 'H7', title: 'La lettre E', tools: ['dir'],
    text: 'Dessine la lettre E, en partant du bas à gauche.',
    hint: 'Monte tout en haut, trace la barre du haut et reviens, descends au milieu, barre du milieu, descends en bas, barre du bas.',
    sol: [N(120), E(60), W(60), S(60), E(50), W(50), S(60), E(60)] });
  lv({ id: 'H8', title: 'Escalier en boucle', tools: ['dir', 'loop'], limit: true, require: ['controls_repeat_ext'],
    text: 'Dessine un escalier de 6 marches avec seulement 3 blocs.',
    hint: 'Répéter 6 fois : monter, aller à droite.',
    sol: [rep(6, [N(30), E(30)])] });
  lv({ id: 'H9', title: 'Les créneaux', tools: ['dir', 'loop'], limit: true, require: ['controls_repeat_ext'],
    text: 'Dessine les créneaux d’un château : monter, droite, descendre, droite… 4 fois.',
    hint: 'Dans la boucle : haut, droite, bas, droite.',
    sol: [rep(4, [N(40), E(40), S(40), E(40)])] });
  lv({ id: 'H10', title: 'Le labyrinthe', tools: ['dir'],
    text: 'Reproduis ce chemin de labyrinthe.',
    hint: 'Haut, droite, bas, droite, haut, droite, bas : fais attention aux longueurs.',
    sol: [N(100), E(50), S(60), E(50), N(60), E(50), S(100)] });

  /* ---------- B : Paramètres ---------- */
  lv({ id: 'B1', title: 'Le rectangle', tools: ['move'],
    text: 'Dessine ce rectangle (deux grands côtés, deux petits côtés).',
    hint: 'Les angles sont droits. Les côtés opposés ont la même longueur.',
    sol: [fd(180), rt(90), fd(90), rt(90), fd(180), rt(90), fd(90)] });
  lv({ id: 'B2', title: 'Triangle rectangle', tools: ['move'],
    text: 'Dessine ce triangle qui a un angle droit.',
    hint: 'Le dernier virage est de 135°. Le long côté mesure environ 141.',
    sol: [fd(100), rt(90), fd(100), rt(135), fd(141)] });
  lv({ id: 'B3', title: 'L’hexagone', tools: ['move'],
    text: 'Dessine cet hexagone (6 côtés égaux).',
    hint: 'Pour un hexagone, la tortue tourne de 60° à chaque coin.',
    sol: [fd(80), rt(60), fd(80), rt(60), fd(80), rt(60), fd(80), rt(60), fd(80), rt(60), fd(80), rt(60)] });
  lv({ id: 'B4', title: 'Zigzag', tools: ['move'],
    text: 'Reproduis ce zigzag.',
    hint: 'Tourne à droite de 45°, puis à gauche de 90°, puis à droite de 90°…',
    sol: [fd(80), rt(45), fd(80), lt(90), fd(80), rt(90), fd(80), lt(90), fd(80)] });
  lv({ id: 'B5', title: 'La maison', tools: ['move'],
    text: 'Dessine cette maison : un carré avec un toit.',
    hint: 'Le toit est un triangle avec un angle droit au sommet : côtés de 71, virage de 90° au sommet.',
    sol: [fd(100), rt(45), fd(71), rt(90), fd(71), rt(45), fd(100), rt(90), fd(100)] });
  lv({ id: 'B6', title: 'La flèche', tools: ['move'],
    text: 'Dessine cette flèche qui pointe vers le haut.',
    hint: 'Après la pointe, reviens en arrière avec un demi-tour (180°) avant de tracer la deuxième barbe.',
    sol: [fd(120), rt(135), fd(50), rt(180), fd(50), lt(90), fd(50)] });

  /* ---------- C : Boucles ---------- */
  lv({ id: 'C1', title: 'Le carré en boucle', text: 'Dessine un carré avec seulement 3 blocs grâce à « répéter ».',
    hint: 'Répéter 4 fois : avancer, tourner de 90°.', sol: [rep(4, [fd(100), rt(90)])] }, LOOP);
  lv({ id: 'C2', title: 'Le triangle en boucle', text: 'Même chose avec un triangle.',
    hint: 'Combien de fois faut-il répéter ? Et de combien tourne-t-on ?', sol: [rep(3, [fd(100), rt(120)])] }, LOOP);
  lv({ id: 'C3', title: 'Le pentagone', text: 'Dessine un pentagone (5 côtés égaux).',
    hint: 'Un tour complet = 360°. Divise par le nombre de côtés : 360 ÷ 5 = ?', sol: [rep(5, [fd(80), rt(72)])] }, LOOP);
  lv({ id: 'C4', title: 'L’hexagone en boucle', text: 'Dessine un hexagone avec une boucle.',
    hint: '360 ÷ 6 = 60.', sol: [rep(6, [fd(80), rt(60)])] }, LOOP);
  lv({ id: 'C5', title: 'L’octogone', text: 'Dessine un octogone (8 côtés égaux).',
    hint: '360 ÷ 8 = 45.', sol: [rep(8, [fd(50), rt(45)])] }, LOOP);
  lv({ id: 'C6', title: 'L’étoile', text: 'Dessine une étoile à 5 branches sans lever le crayon.',
    hint: 'Pour une étoile, la tortue tourne beaucoup plus : essaie 144°.', sol: [rep(5, [fd(150), rt(144)])] }, LOOP);
  lv({ id: 'C7', title: 'Le grand escalier', text: 'Dessine cet escalier de 5 marches.',
    hint: 'Une marche = avancer, tourner à droite, avancer, tourner à gauche. Répète-la !',
    sol: [rep(5, [fd(50), rt(90), fd(50), lt(90)])] }, LOOP);
  lv({ id: 'C8', title: 'Carré rouge', tools: ['move', 'loop', 'color'], colors: true, text: 'Dessine un carré rouge.',
    hint: 'Où faut-il mettre le bloc de couleur : dans la boucle ou avant ?',
    sol: [col('rouge'), rep(4, [fd(100), rt(90)])] }, LOOP);
  lv({ id: 'C9', title: 'Tirets en boucle', tools: ['move', 'loop', 'pen'], text: 'Trace 6 tirets alignés, séparés par des trous.',
    hint: 'Dans la boucle : avancer (trait), lever le crayon, avancer (trou), baisser le crayon.',
    sol: [rep(6, [fd(30), UP, fd(20), DOWN])] }, LOOP);
  lv({ id: 'C10', title: 'Le décagone', text: 'Dessine un décagone (10 côtés égaux) : presque un cercle !',
    hint: '360 ÷ 10 = 36.', sol: [rep(10, [fd(40), rt(36)])] }, LOOP);

  /* ---------- D : Boucles imbriquées ---------- */
  lv({ id: 'D1', title: 'Fleur de carrés', text: 'Dessine 8 carrés qui tournent autour d’un point.',
    hint: 'Une boucle dessine un carré. Une grande boucle répète « carré puis petit virage de 45° ».',
    sol: [rep(8, [rep(4, [fd(60), rt(90)]), rt(45)])] }, LOOP);
  lv({ id: 'D2', title: 'Rosace de carrés', text: 'Même idée, avec 6 carrés.',
    hint: '360 ÷ 6 = 60.', sol: [rep(6, [rep(4, [fd(60), rt(90)]), rt(60)])] }, LOOP);
  lv({ id: 'D3', title: 'Moulin de triangles', text: 'Dessine 10 triangles qui tournent.',
    hint: '360 ÷ 10 = 36.', sol: [rep(10, [rep(3, [fd(80), rt(120)]), rt(36)])] }, LOOP);
  lv({ id: 'D4', title: 'Fleur de pentagones', text: 'Dessine 5 pentagones qui tournent.',
    hint: 'Dans chaque pentagone : 5 côtés, 72°. Pour tourner ensuite : encore 72°.',
    sol: [rep(5, [rep(5, [fd(60), rt(72)]), rt(72)])] }, LOOP);
  lv({ id: 'D5', title: 'Rosace d’hexagones', text: 'Dessine 10 hexagones qui tournent.',
    hint: '360 ÷ 10 = 36.', sol: [rep(10, [rep(6, [fd(50), rt(60)]), rt(36)])] }, LOOP);
  lv({ id: 'D6', title: 'Quatre carrés', text: 'Dessine quatre carrés qui se touchent en un point, comme un grand carré coupé en 4.',
    hint: 'Après chaque carré, tourne de 90° avant de recommencer.',
    sol: [rep(4, [rep(4, [fd(80), rt(90)]), rt(90)])] }, LOOP);
  lv({ id: 'D7', title: 'Roue de triangles', text: 'Dessine 9 triangles qui tournent pour former une roue.',
    hint: '360 ÷ 9 = 40.', sol: [rep(9, [rep(3, [fd(60), rt(120)]), rt(40)])] }, LOOP);
  lv({ id: 'D8', title: 'Anneau de carrés', text: 'Dessine un anneau de 6 carrés, posés l’un après l’autre autour d’un hexagone.',
    hint: 'Après chaque carré : avancer d’un côté, puis tourner de 60°.',
    sol: [rep(6, [rep(4, [fd(50), rt(90)]), fd(50), rt(60)])] }, LOOP);
  lv({ id: 'D9', title: 'Triple boucle', text: 'Trois boucles les unes dans les autres ! Dessine 4 rosaces, chacune faite de 6 carrés.',
    hint: 'Boucle 1 (×4) : [ boucle 2 (×6) : [ boucle 3 (×4) : carré, puis tourner de 60° ], puis tourner de 90° ].',
    sol: [rep(4, [rep(6, [rep(4, [fd(40), rt(90)]), rt(60)]), rt(90)])] }, LOOP);

  /* ---------- E : Variables (les variables sont déjà créées pour l’enfant) ---------- */
  var VT = ['move', 'loop', 'var'], VM = ['move', 'loop', 'var', 'math'];
  lv({ id: 'E1', title: 'Ma première variable', tools: VT, require: VAR,
    text: 'Utilise la variable « taille » : mets-la à 100, puis dessine un carré de côté « taille ».',
    hint: 'Dans Variables : « mettre taille à… », puis glisse le bloc « taille » dans « avancer de ».',
    sol: [set('taille', 100), rep(4, [fd('taille'), rt(90)])] });
  lv({ id: 'E2', title: 'Petit hexagone', tools: VT, require: VAR,
    text: 'Dessine un petit hexagone dont le côté est donné par la variable « taille ».',
    hint: 'Mets « taille » à 50. Un seul nombre à changer pour agrandir ou rétrécir tout le dessin !',
    sol: [set('taille', 50), rep(6, [fd('taille'), rt(60)])] });
  lv({ id: 'E3', title: 'Deux carrés', tools: VT, require: VAR,
    text: 'Dessine un petit carré (côté 50), puis un grand carré (côté 100) qui part du même coin.',
    hint: 'Entre les deux carrés, change la valeur de la variable avec un nouveau bloc « mettre … à ».',
    sol: [set('taille', 50), rep(4, [fd('taille'), rt(90)]), set('taille', 100), rep(4, [fd('taille'), rt(90)])] });
  lv({ id: 'E4', title: 'Spirale carrée', tools: VT, require: VAR.concat(['math_change']),
    text: 'Dessine cette spirale : chaque côté est un peu plus long que le précédent.',
    hint: 'Commence à 10. À chaque tour : avancer de « taille », tourner de 90°, puis « ajouter 15 à taille ». Répète 10 fois.',
    sol: [set('taille', 10), rep(10, [fd('taille'), rt(90), add('taille', 15)])] });
  lv({ id: 'E5', title: 'Spirale triangulaire', tools: VT, require: VAR.concat(['math_change']),
    text: 'Même principe avec des virages de 120°.',
    hint: 'Commence à 10, ajoute 15 à chaque tour, répète 10 fois.',
    sol: [set('taille', 10), rep(10, [fd('taille'), rt(120), add('taille', 15)])] });
  lv({ id: 'E6', title: 'Polygone calculé', tools: VM, require: VAR.concat(['math_arithmetic']),
    text: 'Dessine un pentagone (côté 80) en calculant l’angle : angle = 360 ÷ nombre de côtés.',
    hint: 'Mets « cotes » à 5 et « angle » à 360 ÷ cotes. Répète « cotes » fois : avancer de 80, tourner de « angle ».',
    sol: [set('cotes', 5), set('angle', ['/', 360, 'cotes']), rep('cotes', [fd(80), rt('angle')])] });
  lv({ id: 'E7', title: 'L’heptagone', tools: VM, require: VAR.concat(['math_arithmetic']),
    text: 'Dessine un polygone à 7 côtés (côté 50). Avec ton programme, il suffit de changer un seul nombre !',
    hint: 'Garde le même programme que le niveau précédent, change juste le nombre de côtés.',
    sol: [set('cotes', 7), set('angle', ['/', 360, 'cotes']), rep('cotes', [fd(50), rt('angle')])] });
  lv({ id: 'E8', title: 'Spirale hexagonale', tools: VT, require: VAR.concat(['math_change']),
    text: 'Dessine cette spirale à 6 coins.',
    hint: 'Commence à 10, tourne de 60°, ajoute 10 à chaque tour, répète 10 fois.',
    sol: [set('taille', 10), rep(10, [fd('taille'), rt(60), add('taille', 10)])] });
  lv({ id: 'E9', title: 'Étoile calculée', tools: VM, require: VAR.concat(['math_arithmetic']),
    text: 'Dessine une étoile à 5 branches (côté 150). L’angle se calcule : 720 ÷ nombre de branches.',
    hint: '720 ÷ 5 = 144.',
    sol: [set('cotes', 5), set('angle', ['/', 720, 'cotes']), rep('cotes', [fd(150), rt('angle')])] });
  lv({ id: 'E10', title: 'Escalier qui grandit', tools: VT, require: VAR.concat(['math_change']),
    text: 'Dessine cet escalier dont les marches grandissent.',
    hint: 'Une marche : avancer, droite 90°, avancer, gauche 90°, puis ajouter 10 à la taille. Répète 8 fois à partir de 10.',
    sol: [set('taille', 10), rep(8, [fd('taille'), rt(90), fd('taille'), lt(90), add('taille', 10)])] });
  lv({ id: 'E11', title: 'Spirale d’angles', tools: VT, require: VAR.concat(['math_change']),
    text: 'Cette fois, c’est l’angle qui change à chaque pas ! Dessine cette courbe.',
    hint: 'Mets « angle » à 0. Répète 10 fois : avancer de 40, tourner de « angle », ajouter 20 à « angle ».',
    sol: [set('angle', 0), rep(10, [fd(40), rt('angle'), add('angle', 20)])] });
  lv({ id: 'E12', title: 'Roue de carrés', tools: VM, require: VAR.concat(['math_arithmetic']),
    text: 'Dessine un anneau de 6 carrés qui tournent. L’angle entre deux carrés se calcule : 360 ÷ nombre de carrés.',
    hint: 'Mets « cotes » à 6. Boucle extérieure : répéter « cotes » fois [ carré (boucle de 4), tourner de 360 ÷ cotes ].',
    sol: [set('cotes', 6), rep('cotes', [rep(4, [fd(50), rt(90)]), rt(['/', 360, 'cotes'])])] });
  lv({ id: 'E13', title: 'Carrés emboîtés', tools: VT, require: VAR.concat(['math_change']),
    text: 'Dessine 6 carrés de plus en plus grands, qui partent tous du même coin.',
    hint: 'Mets « taille » à 20. Boucle extérieure ×6 : [ carré de côté « taille », ajouter 20 à « taille » ].',
    sol: [set('taille', 20), rep(6, [rep(4, [fd('taille'), rt(90)]), add('taille', 20)])] });
  lv({ id: 'E14', title: 'Spirale de Fibonacci', tools: VM, require: VAR.concat(['math_arithmetic']),
    text: 'Chaque côté est la somme des deux précédents : 10, 10, 20, 30, 50, 80… Dessine cette spirale (8 côtés).',
    hint: 'Mets « a » et « b » à 10. Répète 8 fois : avancer de a, droite 90°, « b2 » = a + b, a = b, b = b2.',
    vars: ['a', 'b', 'b2'],
    sol: [set('a', 10), set('b', 10), rep(8, [fd('a'), rt(90), set('b2', ['+', 'a', 'b']), set('a', 'b'), set('b', 'b2')])] });

  /* ---------- F : Fonctions ---------- */
  var FT = ['move', 'loop', 'func'], FV = ['move', 'loop', 'var', 'func'], FM = ['move', 'loop', 'var', 'math', 'func'];
  lv({ id: 'F1', title: 'Ma première fonction', tools: FT, require: FUNC,
    text: 'Crée une fonction qui dessine un carré de côté 50, puis utilise-la deux fois pour dessiner deux carrés reliés.' + NOTE_FN,
    hint: 'Fonctions → « faire quelque chose ». Dessine ton carré dedans. Ensuite : appelle ta fonction, tourner à droite 90°, avancer 100, tourner à gauche 90°, appelle-la encore.',
    sol: [def('carre', [], [rep(4, [fd(50), rt(90)])]), call('carre'), rt(90), fd(100), lt(90), call('carre')] });
  lv({ id: 'F2', title: 'Une frise', tools: FT, require: FUNC.concat(['controls_repeat_ext']),
    text: 'Dessine une frise de 4 carrés avec ta fonction dans une boucle.',
    hint: 'Dans la boucle : appelle ta fonction, tourner à droite 90°, avancer 80, tourner à gauche 90°.',
    sol: [def('carre', [], [rep(4, [fd(50), rt(90)])]), rep(4, [call('carre'), rt(90), fd(80), lt(90)])] });
  lv({ id: 'F3', title: 'La maison (fonctions)', tools: FT, require: FUNC,
    text: 'Crée deux fonctions, une pour le carré et une pour le triangle, pour construire une maison avec un toit.' + NOTE_FN,
    hint: 'Le triangle se dessine en tournant à gauche (3 fois 120°). Pose-le sur le haut du carré : avancer, tourner à droite 90°, puis appelle le triangle.',
    sol: [def('carre', [], [rep(4, [fd(80), rt(90)])]), def('triangle', [], [rep(3, [fd(80), lt(120)])]),
      call('carre'), fd(80), rt(90), call('triangle')] });
  lv({ id: 'F4', title: 'Fonction avec paramètre', tools: FV, require: FUNC.concat(['variables_get']),
    text: 'Une fonction peut recevoir une valeur ! Crée une fonction « carre » avec un paramètre, puis dessine 4 carrés de tailles 30, 60, 90 et 120.',
    hint: 'Clique sur la roue dentée ⚙ du bloc de la fonction pour ajouter un paramètre (tu peux garder son nom). Utilise-le dans « avancer de ».',
    sol: [def('carre', ['taille'], [rep(4, [fd('taille'), rt(90)])]), call('carre', 30), call('carre', 60), call('carre', 90), call('carre', 120)] });
  lv({ id: 'F5', title: 'La fleur', tools: FT, require: FUNC.concat(['controls_repeat_ext']),
    text: 'Crée une fonction « petale » (deux arcs de cercle), puis répète-la 8 fois pour faire une fleur.',
    hint: 'Un pétale : répéter 2 fois [ répéter 9 fois (avancer 10, droite 10°), droite 90° ]. La fleur : répéter 8 fois [ pétale, droite 45° ].',
    sol: [def('petale', [], [rep(2, [rep(9, [fd(10), rt(10)]), rt(90)])]), rep(8, [call('petale'), rt(45)])] });
  lv({ id: 'F6', title: 'Le polygone universel', tools: FM, require: FUNC.concat(['variables_get', 'math_arithmetic']),
    text: 'Crée une fonction « polygone » avec deux paramètres (le nombre de côtés et la taille). Dessine un triangle, un carré, un pentagone et un hexagone de côté 80.',
    hint: 'Dans la fonction : répéter « cotes » fois [ avancer de « taille », tourner de 360 ÷ cotes ]. Appelle-la avec (3, 80), (4, 80), (5, 80) et (6, 80).',
    sol: [def('polygone', ['cotes', 'taille'], [rep('cotes', [fd('taille'), rt(['/', 360, 'cotes'])])]),
      call('polygone', 3, 80), call('polygone', 4, 80), call('polygone', 5, 80), call('polygone', 6, 80)] });
  lv({ id: 'F7', title: 'Pétale à taille variable', tools: FV, require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Crée une fonction « petale » avec un paramètre (la longueur d’un petit pas). Dessine une fleur de 6 pétales.',
    hint: 'petale(pas) : répéter 2 fois [ répéter 9 fois (avancer pas, droite 10°), droite 90° ]. Fleur : répéter 6 fois [ petale(10), droite 60° ].',
    sol: [def('petale', ['pas'], [rep(2, [rep(9, [fd('pas'), rt(10)]), rt(90)])]), rep(6, [call('petale', 10), rt(60)])] });
  lv({ id: 'F8', title: 'Carrés qui grandissent', tools: FV, require: FUNC.concat(['variables_get', 'math_change']),
    text: 'Utilise ta fonction « carre » (avec un paramètre) dans une boucle, avec une variable qui grandit à chaque tour.',
    hint: 'Mets « taille » à 20. Répéter 6 fois : [ carre(taille), ajouter 20 à taille ]. Glisse la variable dans l’emplacement de l’appel.',
    sol: [def('carre', ['t'], [rep(4, [fd('t'), rt(90)])]), set('taille', 20), rep(6, [call('carre', 'taille'), add('taille', 20)])] });
  lv({ id: 'F9', title: 'Rosace de pentagones', tools: FM, require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Fonction « polygone » à deux paramètres (côtés, taille). Dessine 10 pentagones de côté 50 qui tournent de 36° à chaque fois.',
    hint: 'La fonction est celle du niveau F-6. Boucle de 10 : [ polygone(5, 50), droite 36° ].',
    sol: [def('polygone', ['cotes', 'taille'], [rep('cotes', [fd('taille'), rt(['/', 360, 'cotes'])])]), rep(10, [call('polygone', 5, 50), rt(36)])] });
  lv({ id: 'F10', title: 'Le village', tools: FV, require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Une fonction peut en utiliser une autre ! Crée « carre », « triangle » puis « maison » (chacune avec un paramètre), et dessine un village de 3 maisons.',
    hint: 'maison : carre, avancer, droite 90°, triangle, droite 90°, avancer. (La tortue revient au départ, tournée vers le bas.) Dans le village : maison(60), gauche 90°, avancer 100, gauche 90°.',
    sol: [def('carre', ['t'], [rep(4, [fd('t'), rt(90)])]), def('triangle', ['t'], [rep(3, [fd('t'), lt(120)])]),
      def('maison', ['t'], [call('carre', 't'), fd('t'), rt(90), call('triangle', 't'), rt(90), fd('t')]),
      rep(3, [call('maison', 60), lt(90), fd(100), lt(90)])] });

  /* ---------- G : Défis ---------- */
  lv({ id: 'G1', title: 'Étoile à huit pointes', text: 'Dessine cette étoile à 8 pointes sans lever le crayon.',
    hint: 'Une boucle de 8 : avancer de 100, tourner de 135°.', sol: [rep(8, [fd(100), rt(135)])] }, LOOP);
  lv({ id: 'G2', title: 'Rosace de cercles', tools: FT, require: FUNC.concat(['controls_repeat_ext']),
    text: 'Crée une fonction « cercle » (10 petits pas de 12, avec un virage de 36°), puis dessine 10 cercles qui tournent de 36°.',
    hint: 'cercle : répéter 10 fois [ avancer 12, droite 36° ]. Rosace : répéter 10 fois [ cercle, droite 36° ].',
    sol: [def('cercle', [], [rep(10, [fd(12), rt(36)])]), rep(10, [call('cercle'), rt(36)])] });
  lv({ id: 'G3', title: 'Le damier', tools: FV, require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Dessine une grille de 4 × 4 carrés de côté 30, avec une fonction « carre » (à un paramètre) et deux boucles.',
    hint: 'Une ligne : répéter 4 fois [ carre(30), droite 90°, avancer 30, gauche 90° ]. Puis reviens au début : gauche 90°, avancer 120, droite 90°, avancer 30. Répète le tout 4 fois.',
    sol: [def('carre', ['taille'], [rep(4, [fd('taille'), rt(90)])]),
      rep(4, [rep(4, [call('carre', 30), rt(90), fd(30), lt(90)]), lt(90), fd(120), rt(90), fd(30)])] });
  lv({ id: 'G4', title: 'L’hélice', tools: VT, require: VAR.concat(['math_change']),
    text: 'Dessine des triangles de plus en plus grands, qui tournent un peu à chaque fois.',
    hint: 'Mets « taille » à 10. Répéter 10 fois : [ triangle (3 fois : avancer taille, droite 120°), droite 36°, ajouter 10 à taille ].',
    sol: [set('taille', 10), rep(10, [rep(3, [fd('taille'), rt(120)]), rt(36), add('taille', 10)])] });
  lv({ id: 'G5', title: 'Fleur d’hexagones', tools: FV, require: FUNC.concat(['variables_get']),
    text: 'Avec une fonction « hexagone » (un paramètre : la taille), dessine 6 hexagones de côté 50 qui tournent autour d’un même point.',
    hint: 'hexagone(taille) : répéter 6 fois [ avancer taille, droite 60° ]. Puis répéter 6 fois [ hexagone(50), droite 60° ].',
    sol: [def('hexagone', ['taille'], [rep(6, [fd('taille'), rt(60)])]), rep(6, [call('hexagone', 50), rt(60)])] });
  lv({ id: 'G6', title: 'Cercles tangents', tools: FV, require: FUNC.concat(['variables_get', 'math_change']),
    text: 'Crée une fonction « cercle » avec un paramètre (la longueur du pas : 10 pas, virage de 36°). Dessine 5 cercles de plus en plus grands qui se touchent en un point.',
    hint: 'Mets « taille » à 10. Répéter 5 fois : [ cercle(taille), ajouter 10 à taille ].',
    sol: [def('cercle', ['pas'], [rep(10, [fd('pas'), rt(36)])]), set('taille', 10), rep(5, [call('cercle', 'taille'), add('taille', 10)])] });
  lv({ id: 'G7', title: 'Carrés qui doublent', tools: FM, require: FUNC.concat(['variables_get', 'math_arithmetic']),
    text: 'Crée une fonction « carre » (avec un paramètre). Dessine 5 carrés dont le côté double à chaque fois : 10, 20, 40, 80, 160.',
    hint: 'Mets « taille » à 10. Répéter 5 fois : [ carre(taille), mettre taille à (taille × 2) ].',
    sol: [def('carre', ['t'], [rep(4, [fd('t'), rt(90)])]), set('taille', 10), rep(5, [call('carre', 'taille'), set('taille', ['*', 'taille', 2])])] });
  lv({ id: 'G8', title: 'Le grand final', tools: FM, require: FUNC.concat(['variables_set', 'math_change', 'controls_repeat_ext']),
    text: 'Le défi ultime : une spirale de pentagones qui grandissent, avec une fonction « polygone » (côtés, taille).',
    hint: 'Mets « t » à 20. Répéter 10 fois : [ polygone(5, t), droite 36°, ajouter 10 à t ].',
    sol: [def('polygone', ['cotes', 'taille'], [rep('cotes', [fd('taille'), rt(['/', 360, 'cotes'])])]),
      set('t', 20), rep(10, [call('polygone', 5, 't'), rt(36), add('t', 10)])] });

  /* ---------- Indexation ---------- */
  var seriesIndex = {};
  TB.SERIES.forEach(function (s, i) { seriesIndex[s.id] = i; });
  L.sort(function (a, b) {
    var sa = seriesIndex[a.id.charAt(0)], sb = seriesIndex[b.id.charAt(0)];
    return sa === sb ? parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10) : sa - sb;
  });
  TB.LEVELS = L;
  TB.LEVEL_BY_ID = {};
  L.forEach(function (lvl, i) {
    lvl.index = i;
    lvl.series = lvl.id.charAt(0);
    lvl.label = lvl.id.charAt(0) + '-' + lvl.id.slice(1);
    lvl.par = TB.dslCount(lvl.sol);
    lvl.opts = TB.levelOptions(lvl.sol);
    if (lvl.vars) lvl.opts.vars = lvl.vars;
    TB.LEVEL_BY_ID[lvl.id] = lvl;
  });

  /* Prépare un niveau : exécute la solution, calcule le cadrage et le dessin modèle. */
  var cache = {};
  TB.prepareLevel = function (lvl) {
    TB.useLevel(lvl);
    if (cache[lvl.id]) return cache[lvl.id];
    var ws = new Blockly.Workspace();
    var xml = TB.dslToXml(lvl.sol);
    TB.loadXml(ws, xml);
    var code = TB.generateCode(ws, false);
    ws.dispose();
    var res = TB.execute(code);
    if (res.error) throw new Error('Solution invalide pour ' + lvl.id + ' : ' + res.error + ' ' + res.detail);
    var segs = TB.segments(res.cmds);
    var map = TB.makeMap(segs);
    var ghost = document.createElement('canvas');
    ghost.width = ghost.height = TB.SIZE;
    var g = ghost.getContext('2d');
    // Dessin opaque ; la transparence est appliquée au moment de l'affichage.
    TB.drawSegments(g, segs, map, 9, lvl.colors ? 'color' : 'black');
    if (!lvl.colors) {
      g.globalCompositeOperation = 'source-in'; g.fillStyle = '#8d9bb0'; g.fillRect(0, 0, TB.SIZE, TB.SIZE);
    }
    cache[lvl.id] = { xml: xml, code: code, segs: segs, map: map, ghost: ghost, par: lvl.par };
    return cache[lvl.id];
  };
})();
