/* Tortue Blocs — niveaux (originaux). Chaque niveau a une solution écrite en DSL (voir blocks.js). */
(function () {
  'use strict';
  var TB = (window.TB = window.TB || {});

  var fd = function (n) { return ['fd', n]; };
  var rt = function (n) { return ['rt', n]; };
  var lt = function (n) { return ['lt', n]; };
  var rep = function (n, body) { return ['repeat', n, body]; };
  var col = function (c) { return ['color', c]; };
  var UP = ['up'], DOWN = ['down'];
  var set = function (v, e) { return ['set', v, e]; };
  var add = function (v, e) { return ['add', v, e]; };
  var def = function (name, params, body) { return ['def', name, params, body]; };
  var call = function (name) { return ['call', name, Array.prototype.slice.call(arguments, 1)]; };

  TB.SERIES = [
    { id: 'A', name: 'Instructions', desc: 'Emboîte tes premiers blocs !' },
    { id: 'B', name: 'Paramètres', desc: 'Change les longueurs et les angles !' },
    { id: 'C', name: 'Boucles', desc: 'Utilise « répéter » pour dessiner plus vite !' },
    { id: 'D', name: 'Boucles imbriquées', desc: 'Mets une boucle dans une autre boucle !' },
    { id: 'E', name: 'Variables', desc: 'Garde des nombres en mémoire et fais-les évoluer !' },
    { id: 'F', name: 'Fonctions', desc: 'Crée tes propres blocs !' }
  ];

  /* limit : le nombre de blocs est limité (solution + 1). require : blocs obligatoires. colors : la couleur compte. */
  var L = [
    /* ---------- A : Instructions ---------- */
    { id: 'A1', title: 'Premier pas', tools: ['fwd'],
      text: 'Fais avancer la tortue pour tracer le trait.',
      hint: 'Prends le bloc « avancer de » et accroche-le sous « ▶ quand on exécute ». Puis règle le nombre.',
      sol: [fd(150)] },
    { id: 'A2', title: 'Un virage', tools: ['move'],
      text: 'Trace une ligne, tourne, puis trace encore.',
      hint: 'Pour faire un coin carré, la tortue tourne de 90°.',
      sol: [fd(150), rt(90), fd(100)] },
    { id: 'A3', title: 'L’escalier', tools: ['move'],
      text: 'Reproduis cet escalier.',
      hint: 'Tourne à droite, puis à gauche, en alternance.',
      sol: [fd(70), rt(90), fd(70), lt(90), fd(70), rt(90), fd(70)] },
    { id: 'A4', title: 'Le carré', tools: ['move'],
      text: 'Dessine un carré.',
      hint: 'Un carré a 4 côtés égaux et 4 angles droits (90°).',
      sol: [fd(120), rt(90), fd(120), rt(90), fd(120), rt(90), fd(120), rt(90)] },
    { id: 'A5', title: 'Le triangle', tools: ['move'],
      text: 'Dessine un triangle dont les trois côtés sont égaux.',
      hint: 'Dans ce triangle, la tortue tourne de 120° à chaque coin (pas 60° !).',
      sol: [fd(130), rt(120), fd(130), rt(120), fd(130), rt(120)] },
    { id: 'A6', title: 'En couleurs', tools: ['move', 'color'], colors: true,
      text: 'Dessine ce chemin en changeant de couleur à chaque côté.',
      hint: 'Le bloc « couleur du crayon » se met avant le trait à colorier.',
      sol: [col('rouge'), fd(100), rt(90), col('bleu'), fd(100), rt(90), col('vert'), fd(100), rt(90), col('orange'), fd(100)] },
    { id: 'A7', title: 'Pointillés', tools: ['move', 'pen'],
      text: 'Trace une ligne en pointillés : trait, trou, trait, trou, trait.',
      hint: 'Pour avancer sans tracer : « lever le crayon ». Pour tracer à nouveau : « baisser le crayon ».',
      sol: [fd(50), UP, fd(30), DOWN, fd(50), UP, fd(30), DOWN, fd(50)] },

    /* ---------- B : Paramètres ---------- */
    { id: 'B1', title: 'Le rectangle', tools: ['move'],
      text: 'Dessine ce rectangle (deux grands côtés, deux petits côtés).',
      hint: 'Les angles sont droits. Les côtés opposés ont la même longueur.',
      sol: [fd(180), rt(90), fd(90), rt(90), fd(180), rt(90), fd(90)] },
    { id: 'B2', title: 'Triangle rectangle', tools: ['move'],
      text: 'Dessine ce triangle qui a un angle droit.',
      hint: 'Le dernier virage est de 135°. La longueur du long côté est d’environ 141.',
      sol: [fd(100), rt(90), fd(100), rt(135), fd(141)] },
    { id: 'B3', title: 'L’hexagone', tools: ['move'],
      text: 'Dessine cet hexagone (6 côtés égaux).',
      hint: 'Pour un hexagone, la tortue tourne de 60° à chaque coin.',
      sol: [fd(80), rt(60), fd(80), rt(60), fd(80), rt(60), fd(80), rt(60), fd(80), rt(60), fd(80), rt(60)] },
    { id: 'B4', title: 'Zigzag', tools: ['move'],
      text: 'Reproduis ce zigzag.',
      hint: 'Tourne à droite de 45°, puis à gauche de 90°, puis à droite de 90°…',
      sol: [fd(80), rt(45), fd(80), lt(90), fd(80), rt(90), fd(80), lt(90), fd(80)] },
    { id: 'B5', title: 'La maison', tools: ['move'],
      text: 'Dessine cette maison : un carré avec un toit.',
      hint: 'Le toit est un triangle avec un angle droit au sommet : côtés de 71, virage de 90° au sommet.',
      sol: [fd(100), rt(45), fd(71), rt(90), fd(71), rt(45), fd(100), rt(90), fd(100)] },
    { id: 'B6', title: 'La flèche', tools: ['move'],
      text: 'Dessine cette flèche qui pointe vers le haut.',
      hint: 'Après la pointe, reviens en arrière avec un demi-tour (180°) avant de tracer la deuxième barbe.',
      sol: [fd(130), rt(135), fd(50), rt(180), fd(50), lt(90), fd(50)] },

    /* ---------- C : Boucles ---------- */
    { id: 'C1', title: 'Le carré en boucle', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine un carré avec seulement 3 blocs grâce à « répéter ».',
      hint: 'Répéter 4 fois : avancer, tourner de 90°.',
      sol: [rep(4, [fd(120), rt(90)])] },
    { id: 'C2', title: 'Le triangle en boucle', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Même chose avec un triangle.',
      hint: 'Combien de fois faut-il répéter ? Et de combien tourne-t-on ?',
      sol: [rep(3, [fd(130), rt(120)])] },
    { id: 'C3', title: 'Le pentagone', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine un pentagone (5 côtés égaux).',
      hint: 'Un tour complet = 360°. Divise par le nombre de côtés : 360 ÷ 5 = ?',
      sol: [rep(5, [fd(90), rt(72)])] },
    { id: 'C4', title: 'L’hexagone en boucle', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine un hexagone avec une boucle.',
      hint: '360 ÷ 6 = 60.',
      sol: [rep(6, [fd(80), rt(60)])] },
    { id: 'C5', title: 'L’octogone', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine un octogone (8 côtés égaux).',
      hint: '360 ÷ 8 = 45.',
      sol: [rep(8, [fd(60), rt(45)])] },
    { id: 'C6', title: 'L’étoile', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine une étoile à 5 branches sans lever le crayon.',
      hint: 'Pour une étoile, la tortue tourne beaucoup plus : essaie 144°.',
      sol: [rep(5, [fd(170), rt(144)])] },
    { id: 'C7', title: 'Le grand escalier', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine cet escalier de 5 marches.',
      hint: 'Une marche = avancer, tourner à droite, avancer, tourner à gauche. Répète-la !',
      sol: [rep(5, [fd(40), rt(90), fd(40), lt(90)])] },
    { id: 'C8', title: 'Carré rouge', tools: ['move', 'loop', 'color'], limit: true, colors: true, require: ['controls_repeat_ext'],
      text: 'Dessine un carré rouge.',
      hint: 'Où faut-il mettre le bloc de couleur : dans la boucle ou avant ?',
      sol: [col('rouge'), rep(4, [fd(120), rt(90)])] },
    { id: 'C9', title: 'Tirets en boucle', tools: ['move', 'loop', 'pen'], limit: true, require: ['controls_repeat_ext'],
      text: 'Trace 6 tirets alignés, séparés par des trous.',
      hint: 'Dans la boucle : avancer (trait), lever le crayon, avancer (trou), baisser le crayon.',
      sol: [rep(6, [fd(30), UP, fd(20), DOWN])] },
    { id: 'C10', title: 'Presque un cercle', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine un cercle en faisant plein de tout petits pas.',
      hint: '36 pas de 10°… 36 × 10 = 360 !',
      sol: [rep(36, [fd(10), rt(10)])] },

    /* ---------- D : Boucles imbriquées ---------- */
    { id: 'D1', title: 'Fleur de carrés', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine 8 carrés qui tournent autour d’un point.',
      hint: 'Une boucle dessine un carré. Une grande boucle répète « carré puis petit virage de 45° ».',
      sol: [rep(8, [rep(4, [fd(70), rt(90)]), rt(45)])] },
    { id: 'D2', title: 'Rosace de carrés', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Même idée, avec 6 carrés.',
      hint: '360 ÷ 6 = 60.',
      sol: [rep(6, [rep(4, [fd(70), rt(90)]), rt(60)])] },
    { id: 'D3', title: 'Moulin de triangles', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine 12 triangles qui tournent.',
      hint: '360 ÷ 12 = 30.',
      sol: [rep(12, [rep(3, [fd(80), rt(120)]), rt(30)])] },
    { id: 'D4', title: 'Fleur de pentagones', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine 5 pentagones qui tournent.',
      hint: 'Dans chaque pentagone : 5 côtés, 72°. Pour tourner ensuite : encore 72°.',
      sol: [rep(5, [rep(5, [fd(60), rt(72)]), rt(72)])] },
    { id: 'D5', title: 'Rosace d’hexagones', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine 10 hexagones qui tournent.',
      hint: '360 ÷ 10 = 36.',
      sol: [rep(10, [rep(6, [fd(50), rt(60)]), rt(36)])] },
    { id: 'D6', title: 'Quatre carrés', tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'],
      text: 'Dessine quatre carrés qui se touchent en un point, comme un grand carré coupé en 4.',
      hint: 'Après chaque carré, tourne de 90° avant de recommencer.',
      sol: [rep(4, [rep(4, [fd(80), rt(90)]), rt(90)])] },

    /* ---------- E : Variables ---------- */
    { id: 'E1', title: 'Ma première variable', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get'],
      text: 'Crée une variable « taille » qui vaut 100, puis dessine un carré de côté « taille ».',
      hint: 'Variables → « Créer une variable… ». Utilise « mettre taille à 100 », puis glisse le bloc « taille » dans « avancer de ».',
      sol: [set('taille', 100), rep(4, [fd('taille'), rt(90)])] },
    { id: 'E2', title: 'Petit hexagone', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get'],
      text: 'Dessine un petit hexagone dont le côté est donné par une variable.',
      hint: 'Mets la variable à 50. Un seul nombre à changer pour agrandir ou rétrécir tout le dessin !',
      sol: [set('taille', 50), rep(6, [fd('taille'), rt(60)])] },
    { id: 'E3', title: 'Deux carrés', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get'],
      text: 'Dessine un petit carré (côté 50), puis un grand carré (côté 120) qui part du même coin.',
      hint: 'Entre les deux carrés, change la valeur de la variable avec un nouveau bloc « mettre … à ».',
      sol: [set('taille', 50), rep(4, [fd('taille'), rt(90)]), set('taille', 120), rep(4, [fd('taille'), rt(90)])] },
    { id: 'E4', title: 'Spirale carrée', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get', 'math_change'],
      text: 'Dessine cette spirale : chaque côté est un peu plus long que le précédent.',
      hint: 'Commence à 10. À chaque tour : avancer de « taille », tourner de 90°, puis « ajouter 10 à taille ». Répète 15 fois.',
      sol: [set('taille', 10), rep(15, [fd('taille'), rt(90), add('taille', 10)])] },
    { id: 'E5', title: 'Spirale triangulaire', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get', 'math_change'],
      text: 'Même principe avec des virages de 120°.',
      hint: 'Commence à 10, ajoute 8 à chaque tour, répète 20 fois.',
      sol: [set('taille', 10), rep(20, [fd('taille'), rt(120), add('taille', 8)])] },
    { id: 'E6', title: 'Polygone calculé', tools: ['move', 'loop', 'var', 'math'], require: ['variables_set', 'variables_get', 'math_arithmetic'],
      text: 'Dessine un pentagone (côté 80) en calculant l’angle : angle = 360 ÷ nombre de côtés.',
      hint: 'Crée « cotes » = 5 et « angle » = 360 ÷ cotes. Répète « cotes » fois : avancer de 80, tourner de « angle ».',
      sol: [set('cotes', 5), set('angle', ['/', 360, 'cotes']), rep('cotes', [fd(80), rt('angle')])] },
    { id: 'E7', title: 'L’heptagone', tools: ['move', 'loop', 'var', 'math'], require: ['variables_set', 'variables_get', 'math_arithmetic'],
      text: 'Dessine un polygone à 7 côtés (côté 70). Avec ton programme, il suffit de changer un seul nombre !',
      hint: 'Garde le même programme que le niveau précédent, change juste le nombre de côtés.',
      sol: [set('cotes', 7), set('angle', ['/', 360, 'cotes']), rep('cotes', [fd(70), rt('angle')])] },
    { id: 'E8', title: 'Spirale hexagonale', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get', 'math_change'],
      text: 'Dessine cette spirale à 6 coins.',
      hint: 'Commence à 5, tourne de 60°, ajoute 6 à chaque tour, répète 25 fois.',
      sol: [set('taille', 5), rep(25, [fd('taille'), rt(60), add('taille', 6)])] },
    { id: 'E9', title: 'Étoile calculée', tools: ['move', 'loop', 'var', 'math'], require: ['variables_set', 'variables_get', 'math_arithmetic'],
      text: 'Dessine une étoile à 5 branches (côté 150). L’angle se calcule : 720 ÷ nombre de branches.',
      hint: '720 ÷ 5 = 144.',
      sol: [set('branches', 5), set('angle', ['/', 720, 'branches']), rep('branches', [fd(150), rt('angle')])] },
    { id: 'E10', title: 'Escalier qui grandit', tools: ['move', 'loop', 'var'], require: ['variables_set', 'variables_get', 'math_change'],
      text: 'Dessine cet escalier dont les marches grandissent.',
      hint: 'Une marche : avancer, droite 90°, avancer, gauche 90°, puis ajouter 10 à la taille. Répète 8 fois à partir de 10.',
      sol: [set('taille', 10), rep(8, [fd('taille'), rt(90), fd('taille'), lt(90), add('taille', 10)])] },

    /* ---------- F : Fonctions ---------- */
    { id: 'F1', title: 'Ma première fonction', tools: ['move', 'loop', 'func'], require: ['procedures_defnoreturn', 'procedures_callnoreturn'],
      text: 'Crée une fonction « carre » qui dessine un carré de côté 60, puis utilise-la deux fois pour dessiner deux carrés reliés.',
      hint: 'Fonctions → « faire quelque chose ». Renomme-la « carre ». Dessine ton carré dedans. Ensuite : carre, tourner à droite 90°, avancer 100, tourner à gauche 90°, carre.',
      sol: [def('carre', [], [rep(4, [fd(60), rt(90)])]), call('carre'), rt(90), fd(100), lt(90), call('carre')] },
    { id: 'F2', title: 'Une frise', tools: ['move', 'loop', 'func'], require: ['procedures_defnoreturn', 'procedures_callnoreturn', 'controls_repeat_ext'],
      text: 'Dessine une frise de 4 carrés avec ta fonction « carre » dans une boucle.',
      hint: 'Dans la boucle : carre, tourner à droite 90°, avancer 80, tourner à gauche 90°.',
      sol: [def('carre', [], [rep(4, [fd(50), rt(90)])]), rep(4, [call('carre'), rt(90), fd(80), lt(90)])] },
    { id: 'F3', title: 'La maison (fonctions)', tools: ['move', 'loop', 'func'], require: ['procedures_defnoreturn', 'procedures_callnoreturn'],
      text: 'Crée deux fonctions, « carre » et « triangle », pour construire une maison avec un toit.',
      hint: 'Le triangle se dessine en tournant à gauche (3 fois 120°). Pose-le sur le haut du carré : avancer, tourner à droite 90°, puis triangle.',
      sol: [def('carre', [], [rep(4, [fd(80), rt(90)])]), def('triangle', [], [rep(3, [fd(80), lt(120)])]),
        call('carre'), fd(80), rt(90), call('triangle')] },
    { id: 'F4', title: 'Fonction avec paramètre', tools: ['move', 'loop', 'var', 'func'], require: ['procedures_defnoreturn', 'procedures_callnoreturn', 'variables_get'],
      text: 'Une fonction peut recevoir une valeur ! Crée « carre » avec un paramètre « taille », puis dessine 4 carrés de tailles 30, 60, 90 et 120.',
      hint: 'Clique sur la roue dentée ⚙ du bloc de la fonction pour ajouter un paramètre « taille ». Utilise-le dans « avancer de ».',
      sol: [def('carre', ['taille'], [rep(4, [fd('taille'), rt(90)])]), call('carre', 30), call('carre', 60), call('carre', 90), call('carre', 120)] },
    { id: 'F5', title: 'La fleur', tools: ['move', 'loop', 'func'], require: ['procedures_defnoreturn', 'procedures_callnoreturn', 'controls_repeat_ext'],
      text: 'Crée la fonction « petale » (deux arcs de cercle), puis répète-la 8 fois pour faire une fleur.',
      hint: 'Un pétale : répéter 2 fois [ répéter 9 fois (avancer 10, droite 10°), puis droite 90° ]. La fleur : répéter 8 fois [ petale, droite 45° ].',
      sol: [def('petale', [], [rep(2, [rep(9, [fd(10), rt(10)]), rt(90)])]), rep(8, [call('petale'), rt(45)])] },
    { id: 'F6', title: 'Le polygone universel', tools: ['move', 'loop', 'var', 'math', 'func'], require: ['procedures_defnoreturn', 'procedures_callnoreturn', 'variables_get', 'math_arithmetic'],
      text: 'Crée la fonction « polygone » avec deux paramètres : « cotes » et « taille ». Utilise-la pour dessiner un triangle, un carré, un pentagone et un hexagone de côté 80.',
      hint: 'Dans la fonction : répéter « cotes » fois [ avancer de « taille », tourner de 360 ÷ cotes ]. Appelle polygone(3, 80), polygone(4, 80), polygone(5, 80) et polygone(6, 80).',
      sol: [def('polygone', ['cotes', 'taille'], [rep('cotes', [fd('taille'), rt(['/', 360, 'cotes'])])]),
        call('polygone', 3, 80), call('polygone', 4, 80), call('polygone', 5, 80), call('polygone', 6, 80)] }
  ];

  /* ---------- Niveaux supplémentaires, de plus en plus difficiles ---------- */
  var LOOP = { tools: ['move', 'loop'], limit: true, require: ['controls_repeat_ext'] };
  function lv(o, base) { for (var k in base) o[k] = base[k]; L.push(o); }
  var VAR = ['variables_set', 'variables_get'];
  var FUNC = ['procedures_defnoreturn', 'procedures_callnoreturn'];

  lv({ id: 'D7', title: 'Roue de triangles', text: 'Dessine 18 triangles qui tournent pour former une roue.',
    hint: '360 ÷ 18 = 20.', sol: [rep(18, [rep(3, [fd(60), rt(120)]), rt(20)])] }, LOOP);
  lv({ id: 'D8', title: 'Anneau de carrés', text: 'Dessine un anneau de 6 carrés, posés l’un après l’autre autour d’un hexagone.',
    hint: 'Après chaque carré : avancer d’un côté, puis tourner de 60°.', sol: [rep(6, [rep(4, [fd(50), rt(90)]), fd(50), rt(60)])] }, LOOP);
  lv({ id: 'D9', title: 'Triple boucle', text: 'Trois boucles les unes dans les autres ! Dessine 4 rosaces, chacune faite de 6 carrés.',
    hint: 'Boucle 1 (×4) : [ boucle 2 (×6) : [ boucle 3 (×4) : carré, puis tourner de 60° ], puis tourner de 90° ].',
    sol: [rep(4, [rep(6, [rep(4, [fd(40), rt(90)]), rt(60)]), rt(90)])] }, LOOP);

  lv({ id: 'E11', title: 'Spirale d’angles', tools: ['move', 'loop', 'var'], require: VAR.concat(['math_change']),
    text: 'Cette fois, c’est l’angle qui change à chaque pas ! Dessine cette courbe.',
    hint: 'Variable « angle » à 0. Répète 24 fois : avancer de 40, tourner de « angle », ajouter 15 à « angle ».',
    sol: [set('angle', 0), rep(24, [fd(40), rt('angle'), add('angle', 15)])] });
  lv({ id: 'E12', title: 'Roue de carrés', tools: ['move', 'loop', 'var', 'math'], require: VAR.concat(['math_arithmetic']),
    text: 'Dessine un anneau de 6 carrés qui tournent. L’angle entre deux carrés se calcule : 360 ÷ nombre de carrés.',
    hint: 'Variable « cotes » à 6. Boucle extérieure : répéter « cotes » fois [ carré (boucle de 4), tourner de 360 ÷ cotes ].',
    sol: [set('cotes', 6), rep('cotes', [rep(4, [fd(60), rt(90)]), rt(['/', 360, 'cotes'])])] });
  lv({ id: 'E13', title: 'Carrés emboîtés', tools: ['move', 'loop', 'var'], require: VAR.concat(['math_change']),
    text: 'Dessine 6 carrés de plus en plus grands, qui partent tous du même coin.',
    hint: 'Variable « taille » à 20. Boucle extérieure ×6 : [ carré de côté « taille », ajouter 20 à « taille » ].',
    sol: [set('taille', 20), rep(6, [rep(4, [fd('taille'), rt(90)]), add('taille', 20)])] });
  lv({ id: 'E14', title: 'Spirale de Fibonacci', tools: ['move', 'loop', 'var', 'math'], require: VAR.concat(['math_arithmetic']),
    text: 'Chaque côté est la somme des deux précédents : 10, 10, 20, 30, 50, 80… Dessine cette spirale (8 côtés).',
    hint: 'Variables « a » et « b » à 10. Répète 8 fois : avancer de a, droite 90°, « suivant » = a + b, a = b, b = suivant.',
    sol: [set('a', 10), set('b', 10), rep(8, [fd('a'), rt(90), set('suivant', ['+', 'a', 'b']), set('a', 'b'), set('b', 'suivant')])] });

  lv({ id: 'F7', title: 'Pétale à taille variable', tools: ['move', 'loop', 'var', 'func'], require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Crée une fonction « petale » avec un paramètre « pas » (la longueur d’un petit pas). Dessine une fleur de 6 pétales.',
    hint: 'petale(pas) : répéter 2 fois [ répéter 9 fois (avancer pas, droite 10°), droite 90° ]. Fleur : répéter 6 fois [ petale(10), droite 60° ].',
    sol: [def('petale', ['pas'], [rep(2, [rep(9, [fd('pas'), rt(10)]), rt(90)])]), rep(6, [call('petale', 10), rt(60)])] });
  lv({ id: 'F8', title: 'Carrés qui grandissent', tools: ['move', 'loop', 'var', 'func'], require: FUNC.concat(['variables_get', 'math_change']),
    text: 'Utilise ta fonction « carre(taille) » dans une boucle, avec une variable qui grandit à chaque tour.',
    hint: 'Variable « t » à 20. Répéter 6 fois : [ carre(t), ajouter 20 à t ]. Tu peux glisser la variable dans l’emplacement de l’appel.',
    sol: [def('carre', ['taille'], [rep(4, [fd('taille'), rt(90)])]), set('t', 20), rep(6, [call('carre', 't'), add('t', 20)])] });
  lv({ id: 'F9', title: 'Rosace de pentagones', tools: ['move', 'loop', 'var', 'math', 'func'], require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Fonction « polygone(cotes, taille) ». Dessine 12 pentagones de côté 50 qui tournent de 30° à chaque fois.',
    hint: 'La fonction est celle du niveau F-6. Boucle de 12 : [ polygone(5, 50), droite 30° ].',
    sol: [def('polygone', ['cotes', 'taille'], [rep('cotes', [fd('taille'), rt(['/', 360, 'cotes'])])]), rep(12, [call('polygone', 5, 50), rt(30)])] });
  lv({ id: 'F10', title: 'Le village', tools: ['move', 'loop', 'var', 'func'], require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Une fonction peut en utiliser une autre ! Crée « carre(t) », « triangle(t) » puis « maison(t) », et dessine un village de 3 maisons.',
    hint: 'maison(t) : carre(t), avancer t, droite 90°, triangle(t), droite 90°, avancer t. (La tortue revient au point de départ, tournée vers le bas.) Dans le village : maison(60), gauche 90°, avancer 100, gauche 90.',
    sol: [def('carre', ['t'], [rep(4, [fd('t'), rt(90)])]), def('triangle', ['t'], [rep(3, [fd('t'), lt(120)])]),
      def('maison', ['t'], [call('carre', 't'), fd('t'), rt(90), call('triangle', 't'), rt(90), fd('t')]),
      rep(3, [call('maison', 60), lt(90), fd(100), lt(90)])] });

  lv({ id: 'G1', title: 'Étoile à douze pointes', text: 'Dessine cette étoile à 12 pointes sans lever le crayon.',
    hint: 'Une boucle de 12 : avancer de 100, tourner de 150°.', sol: [rep(12, [fd(100), rt(150)])] }, LOOP);
  lv({ id: 'G2', title: 'Rosace de cercles', tools: ['move', 'loop', 'func'], require: FUNC.concat(['controls_repeat_ext']),
    text: 'Crée la fonction « cercle » (36 petits pas de 5, avec un virage de 10°), puis dessine 12 cercles qui tournent.',
    hint: 'cercle : répéter 36 fois [ avancer 5, droite 10° ]. Rosace : répéter 12 fois [ cercle, droite 30° ].',
    sol: [def('cercle', [], [rep(36, [fd(5), rt(10)])]), rep(12, [call('cercle'), rt(30)])] });
  lv({ id: 'G3', title: 'Le damier', tools: ['move', 'loop', 'var', 'func'], require: FUNC.concat(['variables_get', 'controls_repeat_ext']),
    text: 'Dessine une grille de 4 × 4 carrés de côté 30, avec une fonction « carre(taille) » et deux boucles.',
    hint: 'Une ligne : répéter 4 fois [ carre(30), droite 90°, avancer 30, gauche 90° ]. Puis reviens au début : gauche 90°, avancer 120, droite 90°, avancer 30. Répète le tout 4 fois.',
    sol: [def('carre', ['taille'], [rep(4, [fd('taille'), rt(90)])]),
      rep(4, [rep(4, [call('carre', 30), rt(90), fd(30), lt(90)]), lt(90), fd(120), rt(90), fd(30)])] });
  lv({ id: 'G4', title: 'L’hélice', tools: ['move', 'loop', 'var'], require: VAR.concat(['math_change']),
    text: 'Dessine des triangles de plus en plus grands, qui tournent un peu à chaque fois.',
    hint: 'Variable « taille » à 10. Répéter 15 fois : [ triangle (3 fois : avancer taille, droite 120°), droite 24°, ajouter 5 à taille ].',
    sol: [set('taille', 10), rep(15, [rep(3, [fd('taille'), rt(120)]), rt(24), add('taille', 5)])] });
  lv({ id: 'G5', title: 'Fleur d’hexagones', tools: ['move', 'loop', 'var', 'math', 'func'], require: FUNC.concat(['variables_get']),
    text: 'Avec une fonction « hexagone(taille) », dessine 6 hexagones de côté 40 qui tournent autour d’un même point.',
    hint: 'hexagone(taille) : répéter 6 fois [ avancer taille, droite 60° ]. Puis répéter 6 fois [ hexagone(40), droite 60° ].',
    sol: [def('hexagone', ['taille'], [rep(6, [fd('taille'), rt(60)])]), rep(6, [call('hexagone', 40), rt(60)])] });
  lv({ id: 'G6', title: 'Cercles tangents', tools: ['move', 'loop', 'var', 'func'], require: FUNC.concat(['variables_get', 'math_change']),
    text: 'Crée « cercle(pas) » : 36 pas de longueur « pas », virage de 10°. Dessine 5 cercles de plus en plus grands qui se touchent en un point.',
    hint: 'Variable « p » à 3. Répéter 5 fois : [ cercle(p), ajouter 3 à p ].',
    sol: [def('cercle', ['pas'], [rep(36, [fd('pas'), rt(10)])]), set('p', 3), rep(5, [call('cercle', 'p'), add('p', 3)])] });
  lv({ id: 'G7', title: 'Le moulin à vent', tools: ['move', 'loop', 'var', 'math', 'func'], require: FUNC.concat(['variables_get', 'math_arithmetic']),
    text: 'Crée « pale(t) » : un triangle rectangle de côtés t, t et t × 1,414. Dessine un moulin à 4 pales de taille 80.',
    hint: 'pale(t) : avancer t, droite 90°, avancer t, droite 135°, avancer (t × 1,414), droite 135°. Moulin : répéter 4 fois [ pale(80), droite 90° ].',
    sol: [def('pale', ['t'], [fd('t'), rt(90), fd('t'), rt(135), fd(['*', 't', 1.414]), rt(135)]), rep(4, [call('pale', 80), rt(90)])] });
  lv({ id: 'G8', title: 'Le grand final', tools: ['move', 'loop', 'var', 'math', 'func'], require: FUNC.concat(['variables_set', 'math_change', 'controls_repeat_ext']),
    text: 'Le défi ultime : une spirale de pentagones qui grandissent, avec une fonction « polygone(cotes, taille) ».',
    hint: 'Variable « t » à 20. Répéter 10 fois : [ polygone(5, t), droite 36°, ajouter 8 à t ].',
    sol: [def('polygone', ['cotes', 'taille'], [rep('cotes', [fd('taille'), rt(['/', 360, 'cotes'])])]),
      set('t', 20), rep(10, [call('polygone', 5, 't'), rt(36), add('t', 8)])] });

  TB.SERIES.push({ id: 'G', name: 'Défis', desc: 'Tout ce que tu sais faire, pour des dessins magnifiques !' });
  /* Tri par série puis par numéro (les niveaux ajoutés se rangent à leur place). */
  L.sort(function (a, b) {
    return a.id.charAt(0) === b.id.charAt(0) ? parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10) : (a.id < b.id ? -1 : 1);
  });

  TB.LEVELS = L;
  TB.LEVEL_BY_ID = {};
  L.forEach(function (lv, i) {
    lv.index = i;
    lv.series = lv.id.charAt(0);
    lv.label = lv.id.charAt(0) + '-' + lv.id.slice(1);
    lv.par = TB.dslCount(lv.sol);
    TB.LEVEL_BY_ID[lv.id] = lv;
  });

  /* Prépare un niveau : exécute la solution, calcule le cadrage et le dessin modèle. */
  var cache = {};
  TB.prepareLevel = function (lv) {
    if (cache[lv.id]) return cache[lv.id];
    var ws = new Blockly.Workspace();
    var xml = TB.dslToXml(lv.sol);
    TB.loadXml(ws, xml);
    var code = TB.generateCode(ws, false);
    ws.dispose();
    var res = TB.execute(code);
    if (res.error) throw new Error('Solution invalide pour ' + lv.id + ' : ' + res.error + ' ' + res.detail);
    var segs = TB.segments(res.cmds);
    var map = TB.makeMap(segs);
    var ghost = document.createElement('canvas');
    ghost.width = ghost.height = TB.SIZE;
    var g = ghost.getContext('2d');
    // Dessin opaque ; la transparence est appliquée au moment de l'affichage.
    TB.drawSegments(g, segs, map, 9, lv.colors ? 'color' : 'black');
    // Le mode « black » dessine en noir : on repeint en gris pour les niveaux sans couleur.
    if (!lv.colors) {
      g.globalCompositeOperation = 'source-in'; g.fillStyle = '#8d9bb0'; g.fillRect(0, 0, TB.SIZE, TB.SIZE);
    }
    cache[lv.id] = { xml: xml, code: code, segs: segs, map: map, ghost: ghost, par: lv.par };
    return cache[lv.id];
  };
})();
