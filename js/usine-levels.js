/* Labo Code — Usine à machines : pièces et niveaux (sans DOM, utilisable sous Node pour les tests). */
(function (root) {
  'use strict';

  /* Pièces proposées à l'enfant (r = nombre de positions : on touche la pièce posée pour la tourner). */
  var PARTS = {
    ramp:   { name: 'Rampe', icon: '◣', rots: 4, color: '#ffb300', about: 'La bille glisse dessus. Touche-la pour la tourner.' },
    belt:   { name: 'Tapis', icon: '▶', rots: 2, color: '#455a64', about: 'Pousse la bille vers la droite ou la gauche.' },
    spring: { name: 'Ressort', icon: '⤴', rots: 1, color: '#e53935', about: 'Fait rebondir la bille très haut.' },
    bumper: { name: 'Pare-chocs', icon: '●', rots: 1, color: '#8e24aa', about: 'Renvoie la bille dans l’autre sens.' },
    fan:    { name: 'Ventilateur', icon: '✺', rots: 4, color: '#00acc1', about: 'Souffle sur la bille. Touche-le pour changer la direction.' },
    magnet: { name: 'Aimant', icon: '🧲', rots: 1, color: '#d81b60', about: 'Attire les billes qui passent près de lui.' },
    sensor: { name: 'Capteur', icon: '◉', rots: 4, color: '#43a047', about: 'Se déclenche quand une bille passe. Touche-le pour changer de couleur.' },
    wall:   { name: 'Brique', icon: '▪', rots: 1, color: '#78909c', about: 'Un mur solide.' },
    door:   { name: 'Porte', icon: '▥', rots: 4, color: '#6d4c41', about: 'S’ouvre quand un capteur de la même couleur s’est déclenché.' },
    lamp:   { name: 'Lampe', icon: '💡', rots: 4, color: '#fdd835', about: 'S’allume quand un capteur de la même couleur s’est déclenché.' },
    dispenser: { name: 'Distributeur', icon: '⛲', rots: 1, color: '#1e88e5', about: 'Lâche des billes.' },
    bucket: { name: 'Seau', icon: '🪣', rots: 1, color: '#2e7d32', about: 'Attrape les billes.' }
  };
  var COLORS = ['rouge', 'bleu', 'vert', 'jaune'];
  var COLOR_HEX = { rouge: '#e53935', bleu: '#1e88e5', vert: '#43a047', jaune: '#fdd835' };

  var WORLDS = [
    { n: 1, icon: '🧱', name: 'L’atelier', desc: 'Pose des rampes pour guider la bille jusqu’au seau.' },
    { n: 2, icon: '⚙️', name: 'Les mécanismes', desc: 'Tapis, ressorts, ventilateurs, aimants : chaque pièce a son pouvoir.' },
    { n: 3, icon: '🚪', name: 'Capteurs et portes', desc: 'Un capteur ouvre une porte, un minuteur la ferme…' },
    { n: 4, icon: '💡', name: 'La logique', desc: 'ET, OU : combien de capteurs faut-il pour allumer la lampe ?' },
    { n: 5, icon: '🤖', name: 'Le robot', desc: 'Programme Brickbot pour qu’il appuie sur les boutons et sorte de l’usine.' }
  ];

  var EMPTY = '............';
  function rows(o) { // o : {y: 'chaîne'} ; les lignes non données sont vides ; la ligne 7 est le sol par défaut
    var r = []; for (var y = 0; y < 8; y++) r.push(o[y] !== undefined ? o[y] : (y === 7 ? '############' : EMPTY)); return r;
  }
  function L(id, world, title, o) { o.id = id; o.world = world; o.title = title; return o; }

  var LEVELS = [
    /* ---------- monde 1 : rampes ---------- */
    L('1-1', 1, 'Première rampe', {
      sol: [['ramp', 1, 4, 0]],
      map: rows({ 1: '.o..........', 6: '.........U..' }), parts: { ramp: 1 }, goal: { n: 1 },
      text: 'Pose une rampe pour que la bille roule jusqu’au seau. Touche une pièce, puis une case du plateau.',
      hint: 'Mets la rampe tout en bas, juste sous le distributeur : la bille glissera puis roulera vers le seau.'
    }),
    L('1-2', 1, 'Le toboggan', {
      sol: [['ramp', 1, 2, 0]],
      map: rows({ 0: '.o..........', 3: '.#####......', 6: '.........U..' }), parts: { ramp: 2 }, goal: { n: 1 },
      text: 'La bille tombe sur une étagère. Aide-la à repartir vers le seau.',
      hint: 'Une rampe qui descend vers la droite, au bout de la chute.'
    }),
    L('1-3', 1, 'Le fossé', {
      sol: [['ramp', 1, 2, 0], ['ramp', 3, 6, 0]],
      map: rows({ 1: '.o..........', 6: '.........U..', 7: '#####..#####' }), parts: { ramp: 3 }, goal: { n: 1 },
      text: 'Un trou dans le sol ! La bille doit sauter par-dessus.',
      hint: 'Une rampe qui monte vers la droite, juste avant le trou, lance la bille en l’air.'
    }),
    L('1-4', 1, 'Par-dessus le mur', {
      sol: [['ramp', 5, 1, 0]],
      map: rows({ 0: '.....o......', 2: '......#.....', 3: '......#.....', 4: '......#.....', 5: '......#.....', 6: '.........U..' }), parts: { ramp: 2 }, goal: { n: 1 },
      text: 'Un grand mur se dresse entre la bille et le seau.',
      hint: 'La bille doit rouler sur le dessus du mur : fais-la partir vers la droite dès le début de sa chute.'
    }),
    L('1-5', 1, 'Zigzag', {
      sol: [['ramp', 10, 3, 0], ['ramp', 1, 0, 0], ['ramp', 10, 6, 1]],
      map: rows({ 0: '.o..........', 2: '########....', 4: '....########', 6: '.U..........' }), parts: { ramp: 3 }, goal: { n: 1 },
      text: 'Deux étagères en zigzag. Le seau est tout en bas à gauche.',
      hint: 'Pousse la bille vers la droite sur la première étagère, puis vers la gauche sur la deuxième.'
    }),

    /* ---------- monde 2 : mécanismes ---------- */
    L('2-1', 2, 'Tapis roulants', {
      sol: [['belt', 1, 2, 0], ['belt', 2, 2, 0], ['belt', 3, 2, 0]],
      map: rows({ 0: '.o..........', 3: '.####.......', 6: '.........U..' }), parts: { belt: 4 }, goal: { n: 1 },
      text: 'Utilise des tapis roulants pour emmener la bille hors de l’étagère.',
      hint: 'Pose les tapis sur l’étagère, tous dans le même sens, vers la droite.'
    }),
    L('2-2', 2, 'Le trampoline', {
      sol: [['ramp', 1, 4, 0], ['spring', 3, 6, 0]],
      map: rows({ 1: '.o..........', 2: '..........U.', 3: '.........###' }), parts: { spring: 1, ramp: 2 }, goal: { n: 1 },
      text: 'Le seau est sur une plate-forme en hauteur. Fais rebondir la bille !',
      hint: 'Le ressort lance la bille vers le haut. Une rampe peut lui donner de l’élan vers la droite.'
    }),
    L('2-3', 2, 'Le ventilateur', {
      sol: [['fan', 0, 1, 1], ['ramp', 2, 2, 3]],
      map: rows({ 1: '.o..........', 2: '.........U..', 3: '........####' }), parts: { fan: 1, ramp: 2 }, goal: { n: 1 },
      text: 'Le ventilateur souffle sur la bille et la fait monter.',
      hint: 'Place le ventilateur sous le bord de la plate-forme, soufflant vers le haut, et fais rouler la bille jusqu’à lui.'
    }),
    L('2-4', 2, 'L’aimant', {
      sol: [['magnet', 6, 0, 0]],
      map: rows({ 0: '....o.......', 3: '......#.....', 4: '......#.....', 5: '......#.....', 6: '......#..U..' }), parts: { magnet: 1, ramp: 1 }, goal: { n: 1 },
      text: 'Un mur sépare la bille du seau. Un aimant attire la bille quand elle passe tout près : utilise-le pour la faire passer de l’autre côté.',
      hint: 'Place l’aimant de l’autre côté du mur, assez haut : la bille tombera en étant attirée vers lui, puis par-dessus le mur.'
    }),
    L('2-5', 2, 'Pare-chocs', {
      sol: [['ramp', 1, 1, 1], ['bumper', 0, 6, 0]],
      map: rows({ 0: '.o..........', 3: '....#.......', 4: '....#.......', 5: '....#.......', 6: '....#....U..' }), parts: { bumper: 2, ramp: 2 }, goal: { n: 1 },
      text: 'Les pare-chocs renvoient la bille dans tous les sens. Utilise-les pour passer le mur.',
      hint: 'Un pare-chocs au-dessus du mur renvoie la bille vers la droite.'
    }),

    /* ---------- monde 3 : capteurs et portes ---------- */
    L('3-1', 3, 'Le capteur', {
      sol: [['ramp', 1, 1, 0], ['sensor', 4, 6, 0]],
      map: rows({ 0: '......#.....', 1: '.o....#.....', 2: '......#.....', 3: '......#.....', 4: '......#.....', 6: '.........U..' }),
      doors: [{ x: 6, y: 5, cond: { any: ['rouge'] } }, { x: 6, y: 6, cond: { any: ['rouge'] } }], parts: { ramp: 1, sensor: 1 }, goal: { n: 1 },
      text: 'Une porte bloque le passage. Un capteur rouge, sur le chemin de la bille, doit l’ouvrir.',
      hint: 'Mets une rampe pour envoyer la bille vers la porte, et le capteur rouge sur son chemin, avant la porte.'
    }),
    L('3-2', 3, 'Deux couleurs', {
      sol: [['ramp', 1, 4, 1], ['sensor', 5, 6, 0], ['sensor', 2, 6, 1]],
      map: rows({ 0: '......#.#...', 1: '.o....#.#...', 2: '......#.#...', 3: '......#.#...', 4: '......#.#...', 6: '...........U' }),
      doors: [{ x: 6, y: 5, cond: { any: ['rouge'] } }, { x: 6, y: 6, cond: { any: ['rouge'] } }, { x: 8, y: 5, cond: { any: ['bleu'] } }, { x: 8, y: 6, cond: { any: ['bleu'] } }],
      parts: { ramp: 1, sensor: 2 }, goal: { n: 1 },
      text: 'Deux portes, deux couleurs. Touche un capteur posé pour changer sa couleur.',
      hint: 'Un capteur rouge avant la porte rouge, un capteur bleu avant la porte bleue.'
    }),
    L('3-3', 3, 'Le minuteur', {
      sol: [['ramp', 1, 4, 1]],
      map: rows({ 0: '......#.....', 1: '.o....#.....', 2: '......#.....', 3: '......#.....', 4: '......#.....', 6: '.........U..' }),
      doors: [{ x: 6, y: 5, cond: { at: [2.4, 4.2] } }, { x: 6, y: 6, cond: { at: [2.4, 4.2] } }], parts: { ramp: 3, belt: 2 }, goal: { n: 1 }, tmax: 20,
      text: 'La porte ne s’ouvre qu’entre 2 et 4 secondes après le départ. Arrive pile à l’heure !',
      hint: 'Allonge le trajet de la bille avec des rampes qui font des détours, ou ralentis-la avec un tapis à contre-sens.'
    }),
    L('3-4', 3, 'La lampe', {
      sol: [['sensor', 1, 2, 0]],
      map: rows({ 0: '.o..........', 3: '.####.......', 5: '.........###' }), lamps: [{ x: 10, y: 4, cond: { any: ['rouge'] } }], parts: { ramp: 2, sensor: 1 }, goal: { lamp: true },
      text: 'Allume la lampe en faisant passer la bille par un capteur rouge.',
      hint: 'Le capteur se pose sur le chemin de la bille. Une rampe l’aide à tomber au bon endroit.'
    }),
    L('3-5', 3, 'Réaction en chaîne', {
      sol: [['ramp', 1, 2, 0], ['ramp', 10, 5, 1], ['sensor', 7, 6, 2]],
      map: rows({ 0: '.o..........', 1: '............', 3: '...#####....', 5: '............', 6: '.........U..' }),
      dispensers: [{ x: 10, y: 0, n: 1, ch: 'vert' }], parts: { ramp: 3, sensor: 1 }, goal: { n: 2 },
      text: 'Le deuxième distributeur ne se déclenche que quand un capteur vert reçoit la première bille. Les deux billes doivent finir dans le seau.',
      hint: 'Le capteur doit être vert (touche-le pour changer sa couleur). Puis pense à la deuxième bille, à droite.'
    }),

    /* ---------- monde 4 : logique ---------- */
    L('4-1', 4, 'La porte ET', {
      sol: [['sensor', 9, 5, 0], ['sensor', 9, 4, 1]],
      map: rows({ 0: '.o.......o..', 1: '.....#......', 2: '.....#......', 3: '.....#......', 4: '.....#......', 5: '.....#......', 6: '.....#......' }),
      lamps: [{ x: 5, y: 0, cond: { all: ['rouge', 'bleu'] } }], parts: { ramp: 2, sensor: 2 }, goal: { lamp: true },
      text: 'La lampe ne s’allume que si le capteur rouge ET le capteur bleu ont reçu une bille. Une bille de chaque côté !',
      hint: 'Un capteur rouge à gauche, un capteur bleu à droite, chacun sur le chemin de sa bille.'
    }),
    L('4-2', 4, 'La porte OU', {
      sol: [['sensor', 9, 6, 0]],
      map: rows({ 0: '.o.......o..', 1: '.....#......', 2: '.....#......', 3: '.###.#......', 4: '.....#......', 5: '.....#......', 6: '.....#......' }),
      lamps: [{ x: 5, y: 0, cond: { any: ['rouge', 'bleu'] } }], parts: { ramp: 1, sensor: 1 }, goal: { lamp: true },
      text: 'Cette fois, la lampe s’allume si le capteur rouge OU le capteur bleu s’est déclenché. Tu n’as qu’un capteur : choisis le côté le plus simple !',
      hint: 'Un seul capteur suffit, mais lequel des deux côtés est le plus facile à atteindre ?'
    }),
    L('4-3', 4, 'Trois capteurs', {
      sol: [['sensor', 1, 6, 1], ['sensor', 1, 2, 0], ['sensor', 9, 4, 2]],
      map: rows({ 0: '.o.......o..', 1: '.....#......', 2: '.....#......', 3: '.....#......', 4: '.....#......', 5: '.....#......', 6: '.....#......' }),
      dispensers: [{ x: 1, y: 0, n: 2, every: 1.5 }],
      lamps: [{ x: 5, y: 0, cond: { all: ['rouge', 'bleu', 'vert'] } }], parts: { ramp: 2, sensor: 3 }, goal: { lamp: true },
      text: 'Trois couleurs à allumer : rouge ET bleu ET vert. Le distributeur de gauche lâche deux billes.',
      hint: 'La première bille peut passer par un capteur, la deuxième par un autre, avec une rampe qui change de chemin.'
    }),
    L('4-4', 4, 'ET puis OU', {
      sol: [['sensor', 1, 3, 2]],
      map: rows({ 0: '.o.......o..', 1: '.....#......', 2: '.....#......', 3: '.....#......', 4: '.....#......', 5: '.....#......', 6: '.....#......' }),
      lamps: [{ x: 5, y: 0, cond: { or: [{ all: ['rouge', 'bleu'] }, { any: ['vert'] }] } }], parts: { ramp: 1, sensor: 2 }, goal: { lamp: true },
      text: 'La lampe s’allume si (rouge ET bleu) OU si vert. Avec deux capteurs seulement, quelle est la meilleure idée ?',
      hint: 'Un capteur vert tout seul suffit ! Il n’est pas obligé d’utiliser les deux billes.'
    }),

    /* ---------- monde 5 : le robot (voir usine.js pour les blocs) ---------- */
    L('5-1', 5, 'Premiers pas', {
      robotSol: [['LF'], ['LF'], ['LF'], ['LF'], ['LF'], ['LF']],
      map: rows({ 6: '......X.....' }), robot: { x: 0, y: 6, dir: 1 }, goal: { exit: true }, parts: {}, kind: 'robot', tools: ['rmove'],
      text: 'Brickbot doit atteindre la sortie 🚪. Assemble ses instructions : avancer, avancer…',
      hint: 'Il y a 6 cases à parcourir : 6 fois « avancer ».'
    }),
    L('5-2', 5, 'Répéter', {
      robotSol: [['repeat', 10, [['LF']]]],
      map: rows({ 6: '..........X.' }), robot: { x: 0, y: 6, dir: 1 }, goal: { exit: true }, parts: {}, kind: 'robot', tools: ['rmove', 'lrep'], limit: true, require: ['controls_repeat_ext'],
      text: 'La sortie est loin ! Utilise « répéter » pour ne pas écrire 10 fois « avancer ».',
      hint: 'Répéter 10 fois : avancer.'
    }),
    L('5-3', 5, 'Le bouton', {
      robotSol: [['repeat', 3, [['LF']]], ['RP'], ['repeat', 6, [['LF']]]],
      map: rows({ 6: '.........X..' }), robot: { x: 0, y: 6, dir: 1 }, buttons: [{ x: 3, y: 6, ch: 'rouge' }], goal: { exit: true }, parts: {}, kind: 'robot',
      doors: [{ x: 6, y: 6, cond: { any: ['rouge'] } }, { x: 6, y: 5, cond: { any: ['rouge'] } }, { x: 6, y: 4, cond: { any: ['rouge'] } }, { x: 6, y: 3, cond: { any: ['rouge'] } }],
      tools: ['rmove', 'lrep', 'rpress'], limit: true, require: ['controls_repeat_ext', 'rob_press'],
      text: 'Une porte ferme le couloir. Le bouton rouge au sol l’ouvre : place Brickbot dessus et appuie !',
      hint: 'Avancer 3 fois, appuyer, puis avancer 6 fois (avec « répéter » c’est plus court).'
    }),
    L('5-4', 5, 'Demi-tour', {
      robotSol: [['repeat', 4, [['LF']]], ['RP'], ['RT'], ['repeat', 7, [['LF']]]],
      map: rows({ 6: '.X......X...' }), robot: { x: 4, y: 6, dir: 1 }, buttons: [{ x: 8, y: 6, ch: 'bleu' }], goal: { exit: true }, parts: {}, kind: 'robot',
      doors: [{ x: 3, y: 6, cond: { any: ['bleu'] } }, { x: 3, y: 5, cond: { any: ['bleu'] } }, { x: 3, y: 4, cond: { any: ['bleu'] } }, { x: 3, y: 3, cond: { any: ['bleu'] } }],
      tools: ['rmove', 'lrep', 'rpress', 'rturn'], limit: true, require: ['controls_repeat_ext', 'rob_press', 'rob_turn'],
      text: 'Le bouton est à droite, la sortie à gauche derrière la porte. Il faudra faire demi-tour !',
      hint: 'Avancer 4 fois, appuyer, demi-tour, avancer 7 fois. (« Faire demi-tour » est dans les blocs.)'
    }),
    L('5-5', 5, 'Si… sinon', {
      robotSol: [['until', [['rifelse', 'devant', [['LF']], [['RP']]]]]],
      map: rows({ 6: '...........X' }), robot: { x: 0, y: 6, dir: 1 }, buttons: [{ x: 5, y: 6, ch: 'rouge' }], goal: { exit: true }, parts: {}, kind: 'robot',
      doors: [{ x: 6, y: 6, cond: { any: ['rouge'] } }, { x: 6, y: 5, cond: { any: ['rouge'] } }, { x: 6, y: 4, cond: { any: ['rouge'] } }, { x: 6, y: 3, cond: { any: ['rouge'] } }],
      tools: ['rmove', 'luntil', 'rpress', 'rif'], limit: true, require: ['lab_until', 'rob_ifelse', 'rob_press'],
      text: 'Brickbot ne voit pas la porte à l’avance. Avec « si chemin devant… sinon appuyer », il se débrouille tout seul !',
      hint: 'Répéter jusqu’à l’arrivée : si chemin devant → avancer, sinon → appuyer.'
    }),
    L('5-6', 5, 'L’usine complète', {
      robotSol: [['repeat', 3, [['LF']]], ['RP'], ['repeat', 2, [['LF']]]],
      sol: [['ramp', 5, 1, 1], ['ramp', 11, 4, 1]],
      map: rows({ 6: '.X.......U..', 3: '...#........' }), robot: { x: 6, y: 6, dir: -1 }, buttons: [{ x: 3, y: 6, ch: 'vert' }],
      dispensers: [{ x: 5, y: 0, n: 1, ch: 'vert' }], goal: { n: 1, exit: true }, kind: 'robot', parts: { ramp: 2 }, tools: ['rmove', 'lrep', 'rpress'], tmax: 40,
      text: 'Le bouton vert lance une bille depuis le distributeur. Guide-la jusqu’au seau avec des rampes, puis fais sortir Brickbot !',
      hint: 'Programme : avancer 3 fois, appuyer, puis avancer jusqu’à la sortie. Pose les rampes pour que la bille atteigne le seau.'
    }),

    /* ---------- monde 5 (suite) : tous les blocs de Brickbot ---------- */
    L('5-7', 5, 'Tant que', {
      robotSol: [['while', 'devant', [['LF']]], ['RP']],
      map: rows({ 6: '..........#.' }), robot: { x: 0, y: 6, dir: 1 }, buttons: [{ x: 9, y: 6, ch: 'rouge' }], lamps: [{ x: 9, y: 4, cond: { any: ['rouge'] } }],
      goal: { lamp: true }, parts: {}, kind: 'robot', tools: ['rmove', 'lwhile', 'rpress'], limit: true, require: ['lab_while', 'rob_press'],
      text: 'Brickbot ne sait pas combien de cases il y a jusqu’au mur. Avec « répéter tant que chemin devant », il avance tout seul, puis appuie sur le bouton pour allumer la lampe.',
      hint: 'Répéter tant que chemin devant : avancer. Puis appuyer sur le bouton.'
    }),
    L('5-8', 5, 'Bouton ici ?', {
      robotSol: [['repeat', 10, [['rif', 'bouton', [['RP']]], ['LF']]]],
      map: rows({ 6: '..........X.' }), robot: { x: 0, y: 6, dir: 1 }, buttons: [{ x: 2, y: 6, ch: 'rouge' }, { x: 5, y: 6, ch: 'bleu' }, { x: 7, y: 6, ch: 'vert' }],
      doors: [3, 4, 5, 6].map(function (y) { return { x: 9, y: y, cond: { all: ['rouge', 'bleu', 'vert'] } }; }),
      goal: { exit: true }, parts: {}, kind: 'robot', tools: ['rmove', 'lrep', 'rpress', 'rif'], limit: true, require: ['controls_repeat_ext', 'rob_if', 'rob_press'],
      text: 'Trois boutons de couleurs différentes ouvrent la grande porte. Brickbot doit appuyer sur chacun en passant dessus, sans se tromper de case !',
      hint: 'Répéter 10 fois : [ si bouton ici → appuyer ], puis avancer.'
    }),
    L('5-9', 5, 'Aller-retour', {
      robotSol: [['while', 'devant', [['LF']]], ['RP'], ['RT'], ['while', 'devant', [['LF']]], ['RP']],
      map: rows({ 6: '#..........#' }), robot: { x: 5, y: 6, dir: 1 }, buttons: [{ x: 10, y: 6, ch: 'bleu' }, { x: 1, y: 6, ch: 'rouge' }], lamps: [{ x: 5, y: 4, cond: { all: ['rouge', 'bleu'] } }],
      goal: { lamp: true }, parts: {}, kind: 'robot', tools: ['rmove', 'rturn', 'rpress', 'lwhile'], limit: true, require: ['lab_while', 'rob_turn', 'rob_press'],
      text: 'Un bouton à chaque bout du couloir : la lampe ne s’allume que si les deux sont enfoncés (ET) !',
      hint: 'Aller jusqu’au mur de droite (tant que chemin devant), appuyer, demi-tour, aller jusqu’au mur de gauche, appuyer.'
    }),
    L('5-10', 5, 'Patience', {
      robotSol: [['repeat', 2, [['LF']]], ['repeat', 3, [['RW']]], ['repeat', 4, [['LF']]]],
      map: rows({ 6: '......X.....' }), robot: { x: 0, y: 6, dir: 1 }, tmax: 30,
      doors: [3, 4, 5, 6].map(function (y) { return { x: 3, y: y, cond: { at: [3.5, 60] } }; }),
      goal: { exit: true }, parts: {}, kind: 'robot', tools: ['rmove', 'lrep', 'rwait'], limit: true, require: ['controls_repeat_ext', 'rob_wait'],
      text: 'La porte ne s’ouvre que 3,5 secondes après le départ. Brickbot doit savoir attendre !',
      hint: 'Avancer 2 fois (il arrive devant la porte), attendre 3 secondes, puis avancer 4 fois.'
    }),
    L('5-11', 5, 'Une porte, un bouton', {
      robotSol: [['until', [['rif', 'bouton', [['RP']]], ['rif', 'devant', [['LF']]]]]],
      map: rows({ 6: '..........X.' }), robot: { x: 0, y: 6, dir: 1 },
      buttons: [{ x: 2, y: 6, ch: 'rouge' }, { x: 5, y: 6, ch: 'bleu' }, { x: 8, y: 6, ch: 'vert' }],
      doors: [3, 4, 5, 6].map(function (y) { return { x: 3, y: y, cond: { any: ['rouge'] } }; })
        .concat([3, 4, 5, 6].map(function (y) { return { x: 6, y: y, cond: { any: ['bleu'] } }; }))
        .concat([3, 4, 5, 6].map(function (y) { return { x: 9, y: y, cond: { any: ['vert'] } }; })),
      goal: { exit: true }, parts: {}, kind: 'robot', tools: ['rmove', 'luntil', 'rpress', 'rif'], limit: true, require: ['lab_until', 'rob_if', 'rob_press'],
      text: 'Trois portes, trois boutons : un programme unique doit marcher quelle que soit la distance !',
      hint: 'Répéter jusqu’à l’arrivée : [ si bouton ici → appuyer ], [ si chemin devant → avancer ].'
    }),
    L('5-12', 5, 'Attends la bille', {
      robotSol: [['repeat', 2, [['LF']]], ['RP'], ['repeat', 3, [['RW']]], ['repeat', 3, [['LF']]]],
      sol: [['ramp', 8, 2, 0], ['sensor', 9, 6, 1]],
      map: rows({ 3: '........#...', 6: '.X..........' }), robot: { x: 6, y: 6, dir: -1 }, buttons: [{ x: 4, y: 6, ch: 'rouge' }],
      dispensers: [{ x: 8, y: 0, n: 1, ch: 'rouge' }], tmax: 40,
      doors: [3, 4, 5, 6].map(function (y) { return { x: 2, y: y, cond: { any: ['bleu'] } }; }),
      goal: { exit: true }, parts: { ramp: 2, sensor: 1 }, kind: 'robot', tools: ['rmove', 'lrep', 'rpress', 'rwait'], tmax: 40,
      text: 'Le bouton rouge lâche une bille. Un capteur bleu, touché par la bille, ouvre la porte de la sortie. Construis le chemin de la bille et programme Brickbot (il devra attendre !).',
      hint: 'Rampe sur le mur à droite pour envoyer la bille vers le sol, capteur bleu sur son chemin. Brickbot : avancer 2 fois, appuyer, attendre 3 secondes, avancer 3 fois.'
    })
  ];

  var BY_ID = {};
  LEVELS.forEach(function (l, i) { l.index = i; BY_ID[l.id] = l; if (!l.kind) l.kind = 'build'; l.max = Object.keys(l.parts || {}).reduce(function (a, k) { return a + l.parts[k]; }, 0); });

  var API = { PARTS: PARTS, COLORS: COLORS, COLOR_HEX: COLOR_HEX, WORLDS: WORLDS, LEVELS: LEVELS, BY_ID: BY_ID };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.UsineLevels = API;
})(typeof window !== 'undefined' ? window : this);
