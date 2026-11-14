/* Labo Code — Tortue : Labyrinthes (conditions « si… sinon » et boucle « jusqu'à l'arrivée »).
   Principe inspiré de Blockly Games – Maze ; plans, niveaux et textes originaux. */
(function () {
  'use strict';
  var App = window.App, TB = window.TB, $ = App.$, esc = App.esc;
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];   // 0 = haut, 1 = droite, 2 = bas, 3 = gauche
  var SIZE = 600;
  var LAB_SPEEDS = [0.03, 0.07, 0.16, 0.5, Infinity];   // cases par image

  /* Solutions écrites avec le DSL de blocks.js : LF avancer, LL/LR tourner, LE manger, until, if, ifelse, repeat. */
  var LF = ['LF'], LL = ['LL'], LR = ['LR'], LE = ['LE'];
  var rep = function (n, b) { return ['repeat', n, b]; };
  var until = function (b) { return ['until', b]; };
  var si = function (c, b) { return ['if', c, b]; };
  var sinon = function (c, a, b) { return ['ifelse', c, a, b]; };
  var tant = function (c, b) { return ['while', c, b]; };
  var siFraise = function (b) { return ['ifb', b]; };
  var MAIN_GAUCHE = until([sinon('gauche', [LL, LF], [sinon('devant', [LF], [LR])])]);

  var LEVELS = [   // (réordonné plus bas)
    { id: 'L1', title: 'Tout droit', tools: ['lmove'], rows: ['##G##', '##.##', '##.##', '##S##'], start: [2, 3], dir: 0,
      text: 'Aide la tortue à rejoindre la laitue : elle doit avancer tout droit.',
      hint: 'Prends le bloc « avancer » et mets-en trois, l’un sous l’autre.', sol: [LF, LF, LF] },
    { id: 'L2', title: 'Un long couloir', tools: ['lmove'], rows: ['#######', 'S.....G', '#######'], start: [0, 1], dir: 1,
      text: 'Le chemin est plus long cette fois.',
      hint: 'Il faut avancer 6 fois. (Plus tard, tu trouveras plus malin !)', sol: [LF, LF, LF, LF, LF, LF] },
    { id: 'L3', title: 'Un virage', tools: ['lmove'], rows: ['####G', '####.', '####.', 'S....'], start: [0, 3], dir: 1,
      text: 'La tortue regarde vers la droite. Le chemin tourne !',
      hint: 'Avance 4 fois, tourne à gauche, puis avance 3 fois.', sol: [LF, LF, LF, LF, LL, LF, LF, LF] },
    { id: 'L4', title: 'L’escalier', tools: ['lmove', 'lrep'], limit: true, require: ['controls_repeat_ext'],
      rows: ['###.G', '##..#', '#..##', '..###', 'S####'], start: [0, 4], dir: 0,
      text: 'Monte l’escalier avec seulement 5 blocs !',
      hint: 'Une marche : avancer, tourner à droite, avancer, tourner à gauche. Répète-la 4 fois.', sol: [rep(4, [LF, LR, LF, LL])] },
    { id: 'L5', title: 'Jusqu’à l’arrivée', tools: ['lmove', 'luntil'], limit: true, require: ['lab_until'],
      rows: ['######.G', '#####..#', '####..##', '###..###', '##..####', '#..#####', '..######', 'S#######'], start: [0, 7], dir: 0,
      text: 'Un grand escalier : on ne veut pas compter les marches ! Utilise « répéter jusqu’à l’arrivée ».',
      hint: 'Dans la boucle : avancer, tourner à droite, avancer, tourner à gauche. La boucle s’arrête toute seule.', sol: [until([LF, LR, LF, LL])] },
    { id: 'L6', title: 'Le couloir sans fin', tools: ['lmove', 'luntil'], limit: true, require: ['lab_until'],
      rows: ['##########', 'S........G', '##########'], start: [0, 1], dir: 1,
      text: 'Un très long couloir. Pas besoin de compter : « répéter jusqu’à l’arrivée » suffit !',
      hint: 'Un seul bloc dans la boucle : avancer.', sol: [until([LF])] },
    { id: 'L7', title: 'Si on peut tourner', tools: ['lmove', 'luntil', 'lif'], limit: true, require: ['lab_until', 'lab_if'],
      rows: ['.....', '.###.', '.###.', '.###.', '..G#S'], start: [4, 4], dir: 0,
      text: 'Un nouveau bloc : « si chemin à gauche ». La tortue tourne à gauche seulement si elle le peut.',
      hint: 'Répéter jusqu’à l’arrivée : [ si chemin à gauche → tourner à gauche ], puis avancer.', sol: [until([si('gauche', [LL]), LF])] },
    { id: 'L8', title: 'Si… sinon', tools: ['lmove', 'luntil', 'lif'], limit: true, require: ['lab_until', 'lab_ifelse'],
      rows: ['.......', '.#####.', '.#...#.', '.#.#.#.', '.#G#.#.', '.###.#.', '.....#S'], start: [6, 6], dir: 0,
      text: 'Un escargot ! Dans « si… sinon » : si on peut avancer on avance, sinon on tourne.',
      hint: 'Répéter jusqu’à l’arrivée : si chemin devant → avancer, sinon → tourner à gauche.', sol: [until([sinon('devant', [LF], [LL])])] },
    { id: 'L9', title: 'Le serpent', tools: ['lmove', 'luntil', 'lif'], limit: true, require: ['lab_until', 'lab_ifelse'],
      rows: ['......G', '.######', '.......', '######.', 'S......'], start: [0, 4], dir: 1,
      text: 'Le serpent tourne parfois à gauche, parfois à droite !',
      hint: 'Si chemin devant → avancer. Sinon : si chemin à gauche → tourner à gauche, sinon → tourner à droite.',
      sol: [until([sinon('devant', [LF], [sinon('gauche', [LL], [LR])])])] },
    { id: 'L10', title: 'La main gauche', tools: ['lmove', 'luntil', 'lif'], limit: true, require: ['lab_until', 'lab_ifelse'],
      rows: ['S....#.', '####.#.', 'G..#...', '##.###.', '.....#.', '.#####.', '.......'], start: [0, 0], dir: 1,
      text: 'Un vrai labyrinthe ! Astuce : garde toujours la main gauche sur le mur.',
      hint: 'Si chemin à gauche → tourner à gauche et avancer. Sinon : si chemin devant → avancer, sinon → tourner à droite.', sol: [MAIN_GAUCHE] },
    { id: 'L11', title: 'Les fraises', tools: ['lmove', 'lrep', 'leat'], limit: true, require: ['controls_repeat_ext', 'lab_eat'],
      rows: ['########', 'S.b.b.bG', '########'], start: [0, 1], dir: 1,
      text: 'Mange les 3 fraises 🍓 avant d’arriver à la laitue !',
      hint: 'Répéter 3 fois : avancer, avancer, manger. Puis avancer une dernière fois.', sol: [rep(3, [LF, LF, LE]), LF] },
    { id: 'L12', title: 'Le grand labyrinthe', tools: ['lmove', 'luntil', 'lif', 'leat'], limit: true, require: ['lab_until', 'lab_ifelse', 'lab_eat'],
      rows: ['S....#G..', '####.###.', '...#.b.#.', '##.###.#.', '...#...#.', '.#.#.###.', '.#.#.#..b', '.###.#b#.', '.......#.'], start: [0, 0], dir: 1,
      text: 'Un grand labyrinthe : trois fraises 🍓 cachées, puis la laitue.',
      hint: 'La main gauche passe partout ! Mets « manger » en premier dans la boucle, puis la règle de la main gauche.',
      sol: [until([LE, sinon('gauche', [LL, LF], [sinon('devant', [LF], [LR])])])] },

    /* ---------- niveaux ajoutés (v5) : tant que, fraise ici, main droite, départ au centre… ---------- */
    { id: 'L13', title: 'Deux virages', tools: ['lmove'], rows: ['##G##', '##.##', '...##', '.####', 'S####'], start: [0, 4], dir: 0,
      text: 'Le chemin tourne deux fois : à droite, puis à gauche.',
      hint: 'Avance 2 fois, tourne à droite, avance 2 fois, tourne à gauche, avance 2 fois.', sol: [LF, LF, LR, LF, LF, LL, LF, LF] },
    { id: 'L14', title: 'Le U', tools: ['lmove', 'lrep'], limit: true, require: ['controls_repeat_ext'],
      rows: ['####', '....', '.##.', '.##.', 'S##G'], start: [0, 4], dir: 0,
      text: 'Fais le tour en U avec seulement 6 blocs : mets un « répéter » dans un « répéter » !',
      hint: 'Répéter 2 fois : [ répéter 3 fois (avancer), tourner à droite ]. Puis encore 3 fois avancer.', sol: [rep(2, [rep(3, [LF]), LR]), rep(3, [LF])] },
    { id: 'L15', title: 'Jusqu’au mur', tools: ['lmove', 'lwhile'], limit: true, require: ['lab_while'],
      rows: ['######G', '######.', '######.', '######.', 'S......'], start: [0, 4], dir: 1,
      text: 'Nouveau bloc : « répéter tant que chemin devant ». La tortue avance tant qu’elle le peut !',
      hint: 'Répéter tant que chemin devant : avancer. Puis tourne à gauche et recommence.', sol: [tant('devant', [LF]), LL, tant('devant', [LF])] },
    { id: 'L16', title: 'Les couloirs', tools: ['lmove', 'luntil', 'lwhile', 'lif'], limit: true, require: ['lab_until', 'lab_while', 'lab_ifelse'],
      rows: ['#######G', '#######.', '#######.', '####....', '####.###', '####.###', 'S....###'], start: [0, 6], dir: 1,
      text: 'Des couloirs de longueurs différentes, avec des virages à gauche et à droite.',
      hint: 'Répéter jusqu’à l’arrivée : [ répéter tant que chemin devant (avancer), puis si chemin à gauche → tourner à gauche, sinon → tourner à droite ].',
      sol: [until([tant('devant', [LF]), sinon('gauche', [LL], [LR])])] },
    { id: 'L17', title: 'Fraise au passage', tools: ['lmove', 'luntil', 'lberry', 'leat'], limit: true, require: ['lab_until', 'lab_ifberry', 'lab_eat'],
      rows: ['##########', 'S.b..b.b.G', '##########'], start: [0, 1], dir: 1,
      text: 'Nouveau bloc : « si fraise ici ». Des fraises 🍓 traînent sur le chemin : mange-les sans les compter !',
      hint: 'Répéter jusqu’à l’arrivée : [ si fraise ici → manger ], puis avancer.', sol: [until([siFraise([LE]), LF])] },
    { id: 'L18', title: 'La main droite', tools: ['lmove', 'luntil', 'lif'], limit: true, require: ['lab_until', 'lab_ifelse'],
      rows: ['S#...#G', '.#.#.#.', '.#.#.#.', '.#.#.#.', '...#.#.', '####.#.', '.......'], start: [0, 0], dir: 2,
      text: 'Cette fois, garde la main droite sur le mur !',
      hint: 'Si chemin à droite → tourner à droite et avancer. Sinon : si chemin devant → avancer, sinon → tourner à gauche.',
      sol: [until([sinon('droite', [LR, LF], [sinon('devant', [LF], [LL])])])] },
    { id: 'L19', title: 'Fraises et main gauche', tools: ['lmove', 'luntil', 'lif', 'lberry', 'leat'], limit: true, require: ['lab_until', 'lab_ifelse', 'lab_ifberry'],
      rows: ['S#...b.', '.#####.', '...b...', '######.', '.....#.', '.###.#.', '..G#..b'], start: [0, 0], dir: 2,
      text: 'Trois fraises 🍓 sont cachées. Mange-les en suivant le mur avec la main gauche !',
      hint: 'Dans la boucle : si fraise ici → manger. Puis la règle de la main gauche.',
      sol: [until([siFraise([LE]), sinon('gauche', [LL, LF], [sinon('devant', [LF], [LR])])])] },
    { id: 'L20', title: 'Départ au centre', tools: ['lmove', 'luntil', 'lif'], limit: true, require: ['lab_until', 'lab_ifelse'],
      rows: ['.#...#...', '.#.#.#.#.', '.#.#.#.#.', '.#.#.#.#.', '...#S#.#G', '####.#.##', '.#...#...', '.#.#####.', '.........'], start: [4, 4], dir: 2,
      text: 'La tortue part du milieu du labyrinthe ! La main gauche fonctionne aussi d’ici.',
      hint: 'Même programme que pour la main gauche : où que tu partes, la règle marche.', sol: [MAIN_GAUCHE] },
    { id: 'L21', title: 'Le très grand labyrinthe', tools: ['lmove', 'luntil', 'lif', 'leat'], limit: true, require: ['lab_until', 'lab_ifelse', 'lab_eat'],
      rows: ['S#...#G....', '.#.#.#####.', '.#.#.#.....', '.#.#.#.####', '...#.#.#...', '####.#b#.#.', '.#...#...#.', '.#.###.###.', '.#b..#...#.', '.###.#####.', '.b.......b.'], start: [0, 0], dir: 2,
      text: 'Le plus grand labyrinthe : quatre fraises 🍓 et un très long chemin. Tu as tout ce qu’il faut !',
      hint: 'Dans la boucle : manger, puis la règle de la main gauche. Patience, la tortue a beaucoup à marcher.',
      sol: [until([LE, sinon('gauche', [LL, LF], [sinon('devant', [LF], [LR])])])] }
  ];
  /* Ordre de jeu, du plus simple au plus difficile (les anciens identifiants gardent leur progression). */
  var ORDER = ['L1', 'L2', 'L3', 'L13', 'L4', 'L14', 'L5', 'L6', 'L15', 'L16', 'L7', 'L8', 'L9', 'L10', 'L18', 'L11', 'L17', 'L19', 'L12', 'L20', 'L21'];
  var ALL = {};
  LEVELS.forEach(function (l) { ALL[l.id] = l; });
  LEVELS = ORDER.map(function (id) { return ALL[id]; });
  var BY_ID = {};
  LEVELS.forEach(function (lv, i) {
    lv.index = i; lv.label = 'L-' + (i + 1); lv.par = TB.dslCount(lv.sol);
    lv.h = lv.rows.length; lv.w = lv.rows[0].length; lv.berries = []; lv.goal = null;
    lv.rows.forEach(function (r, y) {
      for (var x = 0; x < r.length; x++) {
        if (r[x] === 'G') lv.goal = [x, y];
        if (r[x] === 'b') lv.berries.push([x, y]);
      }
    });
    BY_ID[lv.id] = lv;
  });

  function free(lv, x, y) { return x >= 0 && y >= 0 && x < lv.w && y < lv.h && lv.rows[y][x] !== '#'; }

  /* ---------- moteur : exécute le code généré et enregistre les étapes ---------- */
  function simulate(lv, code) {
    var x = lv.start[0], y = lv.start[1], d = lv.dir, steps = 0, eaten = {}, cmds = [];
    function key(a, b) { return a + ',' + b; }
    function atGoal() { return x === lv.goal[0] && y === lv.goal[1] && Object.keys(eaten).length >= lv.berries.length; }
    function tick() { if (++steps > 1000) throw 'long'; }
    function move() {
      var nx = x + DX[d], ny = y + DY[d];
      if (!free(lv, nx, ny)) { cmds.push({ t: 'bump', x: x, y: y, d: d }); throw 'mur'; }
      cmds.push({ t: 'move', fx: x, fy: y, x: nx, y: ny, d: d }); x = nx; y = ny; tick();
      if (atGoal()) throw 'goal';
    }
    var api = {
      avancerCase: move,
      tournerGauche: function () { cmds.push({ t: 'turn', from: d, d: (d + 3) % 4 }); d = (d + 3) % 4; tick(); },
      tournerDroite: function () { cmds.push({ t: 'turn', from: d, d: (d + 1) % 4 }); d = (d + 1) % 4; tick(); },
      manger: function () {
        for (var i = 0; i < lv.berries.length; i++) {
          if (lv.berries[i][0] === x && lv.berries[i][1] === y && !eaten[key(x, y)]) { eaten[key(x, y)] = 1; cmds.push({ t: 'eat', x: x, y: y }); }
        }
      },
      chemin: function (c) {
        var dd = c === 'devant' ? d : (c === 'gauche' ? (d + 3) % 4 : (d + 1) % 4);
        return free(lv, x + DX[dd], y + DY[dd]);
      },
      arrivee: atGoal,
      surFraise: function () {
        for (var i = 0; i < lv.berries.length; i++) if (lv.berries[i][0] === x && lv.berries[i][1] === y && !eaten[key(x, y)]) return true;
        return false;
      },
      highlightBlock: function (id) { cmds.push({ t: 'hl', id: id }); }
    };
    var outcome = 'fin';
    try {
      new Function('avancerCase', 'tournerGauche', 'tournerDroite', 'manger', 'chemin', 'arrivee', 'surFraise', 'highlightBlock', 'loopBudget', code)(
        api.avancerCase, api.tournerGauche, api.tournerDroite, api.manger, api.chemin, api.arrivee, api.surFraise, api.highlightBlock, 5000);
    } catch (e) {
      if (e === 'goal') outcome = 'goal';
      else if (e === 'mur') outcome = 'mur';
      else outcome = 'long';
      if (typeof e !== 'string' && !(e instanceof RangeError)) outcome = 'autre';
    }
    if (outcome === 'fin' && x === lv.goal[0] && y === lv.goal[1]) outcome = 'fraises';
    return { cmds: cmds, outcome: outcome, steps: steps, eaten: eaten };
  }

  /* ---------- dessin du plateau ---------- */
  function drawBoard(c, lv, size, st) {
    var cell = size / Math.max(lv.w, lv.h), ox = (size - cell * lv.w) / 2, oy = (size - cell * lv.h) / 2;
    var dark = App.isDark();
    c.clearRect(0, 0, size, size);
    c.fillStyle = dark ? '#16241d' : '#c4e3b8'; c.fillRect(0, 0, size, size);
    for (var y = 0; y < lv.h; y++) {
      for (var x = 0; x < lv.w; x++) {
        if (lv.rows[y][x] === '#') continue;
        c.fillStyle = dark ? '#6a7c72' : '#f6e8c6';
        c.fillRect(ox + x * cell + 0.5, oy + y * cell + 0.5, cell - 1, cell - 1);
      }
    }
    function emoji(ch, x, y, k) {
      c.font = Math.round(cell * k) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch, ox + (x + 0.5) * cell, oy + (y + 0.55) * cell);
    }
    emoji('🥬', lv.goal[0], lv.goal[1], 0.7);
    lv.berries.forEach(function (b) { if (!(st && st.eaten && st.eaten[b[0] + ',' + b[1]])) emoji('🍓', b[0], b[1], 0.55); });
    if (st && st.turtle) {
      var t = st.turtle;
      App.drawTurtleSprite(c, ox + (t.x + 0.5) * cell, oy + (t.y + 0.5) * cell, t.a, cell * 0.8 / 34);
    }
  }
  function startState(lv) { return { turtle: { x: lv.start[0], y: lv.start[1], a: lv.dir * 90 }, eaten: {} }; }

  /* ---------- liste des niveaux ---------- */
  function done(p) { return p.laby.done; }
  function points(p) {
    var s = 0;
    LEVELS.forEach(function (lv) { var r = p.laby && p.laby.done[lv.id]; if (r) s += 10 + (r.blocks <= lv.par ? 5 : 0); });
    return s;
  }
  function viewList() {
    App.renderHeader('laby', 'laby');
    var p = App.profile(), n = LEVELS.filter(function (l) { return done(p)[l.id]; }).length;
    var html = '<section class="series card"><div class="series-head"><h2>Série L : Labyrinthes</h2><span class="count">' + n + ' / ' + LEVELS.length + '</span></div>' +
      '<p>Guide la tortue jusqu’à la laitue 🥬 : avancer et tourner, répéter « jusqu’à l’arrivée » ou « tant que », les « si… sinon », les fraises 🍓, puis de grands labyrinthes.</p><div class="pills">';
    LEVELS.forEach(function (l) {
      var rec = done(p)[l.id];
      html += '<a class="pill ' + (rec ? 'done' : '') + '" href="#/labyrinthe/' + l.id + '"><canvas class="thumb" width="104" height="104" data-id="' + l.id + '"></canvas>' +
        '<b>' + l.label + '</b><small>' + esc(l.title) + '</small><span class="stars">' + (rec ? (rec.blocks <= l.par ? '★★' : '★☆') : '') + '</span></a>';
    });
    $('#view').innerHTML = html + '</div></section>';
    document.querySelectorAll('canvas.thumb').forEach(function (c) { drawBoard(c.getContext('2d'), BY_ID[c.dataset.id], 104, { turtle: { x: BY_ID[c.dataset.id].start[0], y: BY_ID[c.dataset.id].start[1], a: BY_ID[c.dataset.id].dir * 90 }, eaten: {} }); });
  }

  /* ---------- page d'un niveau ---------- */
  var cur = null;
  function dispose() {
    if (!cur) return;
    cancelAnimationFrame(cur.raf);
    try { cur.ws.dispose(); } catch (e) { /* déjà détruit */ }
    window.removeEventListener('resize', cur.onResize);
    cur = null;
  }
  function startXml() { return '<xml xmlns="https://developers.google.com/blockly/xml"><block type="fr_start" x="20" y="20" deletable="false"></block></xml>'; }
  function setMsg(text, kind) { var m = $('#msg'); if (!m) return; m.className = 'msg' + (text ? ' show ' + kind : ''); m.innerHTML = text; }
  function refreshCounter() {
    if (!cur) return;
    var n = TB.countBlocks(cur.ws), el = $('#counter');
    if (!el) return;
    var max = cur.lv.par + 1;
    if (cur.lv.limit) { el.textContent = 'Blocs : ' + n + ' / ' + max; el.className = 'counter' + (n > max ? ' over' : ''); }
    else { el.textContent = 'Blocs : ' + n; el.className = 'counter'; }
  }

  function viewLevel(id) {
    var lv = BY_ID[id];
    if (!lv) { location.hash = '#/labyrinthes'; return; }
    App.renderHeader('laby', 'laby');
    TB.useLevel(null);
    var p = App.profile(), next = LEVELS[lv.index + 1], prev = LEVELS[lv.index - 1];
    $('#view').className = 'is-level';
    $('#view').innerHTML =
      '<section class="level"><div class="level-head"><a class="btn small" href="#/labyrinthes">← Niveaux</a><span class="badge">' + lv.label + '</span><h2>' + esc(lv.title) + '</h2><span class="spacer"></span>' +
      (prev ? '<a class="btn small" href="#/labyrinthe/' + prev.id + '">◀</a>' : '') + (next ? '<a class="btn small" href="#/labyrinthe/' + next.id + '">▶</a>' : '') + '</div>' +
      '<div class="instruction">' + esc(lv.text) + '</div>' +
      '<div class="level-body" id="lbody"><div class="ws-wrap"><div id="blockly"></div><div class="counter" id="counter"></div></div>' +
      '<div class="side" id="side"><div class="canvas-wrap" id="cvw"><canvas id="cv" width="600" height="600"></canvas><div class="msg" id="msg"></div></div>' +
      '<div class="controls"><button class="btn go" id="run">▶ Exécuter</button><button class="btn stop" id="stop" disabled>⏹</button>' +
      '<label class="speed" title="Vitesse"><span>🐢</span><input type="range" id="speed" min="1" max="5" step="1" value="3"><span>🐇</span></label></div>' +
      '<div class="tools2"><button class="btn small" id="hint">💡 Indice</button><button class="btn small" id="reset">↺ Recommencer</button>' +
      '<button class="btn small" id="sol" title="Pour les adultes">👀 Solution</button><button class="btn small" id="codebtn">{ } Code</button></div></div></div></section>';

    var ws = Blockly.inject('blockly', {
      toolbox: TB.buildToolbox(lv.tools, { vars: [], procs: [] }), media: 'vendor/media/', trashcan: true, sounds: false,
      zoom: { controls: true, wheel: true, startScale: 0.8, minScale: 0.5, maxScale: 1.6, scaleSpeed: 1.2 },
      theme: App.blocklyTheme(), grid: { spacing: 25, length: 3, colour: App.isDark() ? '#2b374f' : '#e3e9f1', snap: true }, renderer: 'geras'
    });
    var cv = $('#cv');
    cur = { lv: lv, ws: ws, cv: cv, ctx: cv.getContext('2d'), st: startState(lv), speed: 3, playing: false, raf: 0 };
    cur.onResize = function () { App.layoutLevel(ws); };
    window.addEventListener('resize', cur.onResize);

    var saved = p.laby.ws[lv.id], loaded = false;
    if (saved) { try { Blockly.serialization.workspaces.load(JSON.parse(saved), ws); loaded = true; } catch (e) { ws.clear(); } }
    if (!loaded || !ws.getTopBlocks(false).some(function (b) { return b.type === 'fr_start'; })) { if (loaded) ws.clear(); TB.loadXml(ws, startXml()); }
    ws.addChangeListener(function (ev) {
      if (ev.isUiEvent) return;
      refreshCounter();
      try { p.laby.ws[lv.id] = JSON.stringify(Blockly.serialization.workspaces.save(ws)); App.save(); } catch (e) { /* ignoré */ }
    });
    App.layoutLevel(ws); setTimeout(cur.onResize, 60); setTimeout(cur.onResize, 400);
    refreshCounter(); redraw();

    $('#run').onclick = run;
    $('#stop').onclick = function () { stopPlay(); setMsg('Arrêté.', 'warn'); };
    $('#speed').oninput = function (e) { cur.speed = Number(e.target.value); };
    $('#msg').onclick = function () { setMsg('', ''); };
    $('#hint').onclick = function () { setMsg('💡 ' + lv.hint, 'hint'); };
    $('#codebtn').onclick = function () {
      var code = ''; try { code = TB.generateCode(ws, false).trim(); } catch (e) { code = '// (code indisponible)'; }
      var root = $('#modal-root');
      root.innerHTML = '<div class="overlay"><div class="dialog code"><h2>Le code de ton programme</h2><pre>' + esc(code || '// (aucun bloc)') + '</pre><div class="row"><button class="btn primary" id="m-close">Fermer</button></div></div></div>';
      $('#m-close').onclick = function () { root.innerHTML = ''; };
    };
    $('#reset').onclick = function () {
      if (!confirm('Supprimer tous tes blocs et recommencer ce niveau ?')) return;
      stopPlay(); ws.clear(); TB.loadXml(ws, startXml()); setMsg('', ''); cur.st = startState(lv); redraw(); App.layoutLevel(ws);
      delete p.laby.ws[lv.id]; App.save();
    };
    $('#sol').onclick = function () {
      if (!confirm('Afficher la solution ? (Cela remplace tes blocs actuels.)')) return;
      stopPlay(); ws.clear(); TB.loadXml(ws, TB.dslToXml(lv.sol)); cur.st = startState(lv); redraw(); App.layoutLevel(ws);
      setMsg('Voici une solution possible. Clique sur Exécuter pour la voir marcher !', 'hint');
    };
  }

  function redraw() { if (cur) drawBoard(cur.ctx, cur.lv, SIZE, cur.st); }
  function stopPlay() {
    if (!cur) return;
    cancelAnimationFrame(cur.raf); cur.playing = false;
    var r = $('#run'), s = $('#stop'); if (r) r.disabled = false; if (s) s.disabled = true;
    try { cur.ws.highlightBlock(null); } catch (e) { /* ignoré */ }
  }

  function run() {
    if (!cur) return;
    stopPlay(); setMsg('', '');
    cur.st = startState(cur.lv); redraw();
    var code;
    try { code = TB.generateCode(cur.ws, true); } catch (e) { setMsg('Oups, impossible de lire tes blocs.', 'err'); return; }
    cur.result = simulate(cur.lv, code);
    cur.i = 0; cur.prog = 0; cur.hold = 0; cur.playing = true;
    $('#run').disabled = true; $('#stop').disabled = false;
    App.beep([440]);
    frame();
  }

  var COST = { move: 1, turn: 0.45, eat: 0.35, bump: 0.5 };
  function frame() {
    if (!cur || !cur.playing) return;
    var budget = LAB_SPEEDS[cur.speed - 1], hlHold = cur.speed <= 1 ? 8 : (cur.speed === 2 ? 4 : (cur.speed === 3 ? 1 : 0));
    var cmds = cur.result.cmds, st = cur.st, t = st.turtle;
    while (cur.i < cmds.length) {
      if (cur.hold > 0) { cur.hold--; break; }
      var c = cmds[cur.i];
      if (c.t === 'hl') { cur.ws.highlightBlock(c.id); cur.i++; if (hlHold && budget !== Infinity) cur.hold = hlHold; continue; }
      if (budget <= 0) break;
      var need = COST[c.t] * (1 - cur.prog), spend = Math.min(budget, need);
      cur.prog = budget === Infinity ? 1 : Math.min(1, cur.prog + spend / COST[c.t]);
      if (budget !== Infinity) budget -= spend;
      var q = cur.prog;
      if (c.t === 'move') { t.x = c.fx + (c.x - c.fx) * q; t.y = c.fy + (c.y - c.fy) * q; t.a = c.d * 90; }
      else if (c.t === 'turn') {
        var delta = (c.d - c.from + 4) % 4; if (delta === 3) delta = -1;
        t.a = c.from * 90 + delta * 90 * q;
      } else if (c.t === 'bump') { t.x = c.x + DX[c.d] * 0.2 * Math.sin(q * Math.PI); t.y = c.y + DY[c.d] * 0.2 * Math.sin(q * Math.PI); }
      if (q >= 1) {
        if (c.t === 'move') { t.x = c.x; t.y = c.y; }
        if (c.t === 'turn') t.a = c.d * 90;
        if (c.t === 'bump') { t.x = c.x; t.y = c.y; }
        if (c.t === 'eat') { st.eaten[c.x + ',' + c.y] = 1; App.beep([880]); }
        cur.i++; cur.prog = 0;
      } else break;
    }
    redraw();
    if (cur.i >= cmds.length) { finish(); return; }
    cur.raf = requestAnimationFrame(frame);
  }

  function finish() {
    var res = cur.result, lv = cur.lv, ws = cur.ws;
    stopPlay();
    var orphans = ws.getTopBlocks(false).filter(function (b) { return b.type !== 'fr_start'; }).length;
    var note = orphans ? '<br>👉 Certains blocs ne sont pas accrochés à « ▶ quand on exécute ».' : '';
    if (res.outcome === 'mur') { setMsg('Aïe ! La tortue s’est cognée contre un mur 🧱. Regarde bien le chemin.' + note, 'warn'); App.beep([200]); return; }
    if (res.outcome === 'long') { setMsg('Ton programme tourne en rond ou dure trop longtemps. Vérifie tes boucles.', 'err'); App.beep([200]); return; }
    if (res.outcome === 'autre') { setMsg('Il y a un souci dans ton programme.', 'err'); return; }
    if (res.outcome === 'fraises') { setMsg('Tu es arrivé, mais il reste des fraises 🍓 ! Il faut les manger avant.', 'warn'); App.beep([330]); return; }
    if (res.outcome === 'fin') { setMsg('Le programme est fini, mais la tortue n’est pas arrivée. Il manque des blocs !' + note, 'warn'); App.beep([220]); return; }
    var used = {}; ws.getAllBlocks(false).forEach(function (b) { used[b.type] = true; });
    var missing = (lv.require || []).filter(function (t) { return !used[t]; });
    var NAMES = { controls_repeat_ext: 'répéter', lab_until: 'répéter jusqu’à l’arrivée', lab_if: 'si chemin', lab_ifelse: 'si… sinon', lab_eat: 'manger', lab_while: 'répéter tant que chemin', lab_ifberry: 'si fraise ici' };
    if (missing.length) { setMsg('Arrivé ! Mais ce niveau demande d’utiliser : <b>' + missing.map(function (t) { return NAMES[t] || t; }).join('</b>, <b>') + '</b>.', 'warn'); App.beep([330]); return; }
    var blocks = TB.countBlocks(ws);
    if (lv.limit && blocks > lv.par + 1) { setMsg('Arrivé ! Mais tu as utilisé ' + blocks + ' blocs. Essaie avec ' + (lv.par + 1) + ' blocs maximum.', 'warn'); App.beep([330]); return; }
    succeed(blocks);
  }

  function succeed(blocks) {
    var lv = cur.lv, p = App.profile(), before = App.allPoints(p), rb = App.rankInfo(before);
    var prev = p.laby.done[lv.id];
    if (!prev || blocks < prev.blocks) p.laby.done[lv.id] = { blocks: blocks, ts: Date.now() };
    App.save();
    var after = App.allPoints(p), ra = App.rankInfo(after), gained = after - before, next = LEVELS[lv.index + 1];
    App.renderHeader('laby', 'laby');
    App.beep([523, 659, 784, 1047]); App.confetti();
    setMsg('✅ Bravo, la tortue est arrivée !', 'ok');
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay"><div class="dialog"><div class="big">' + (blocks <= lv.par ? '⭐⭐' : '⭐') + '</div><h2>Niveau terminé !</h2>' +
      '<div class="pts">' + (gained > 0 ? '+' + gained + ' points' : 'Déjà réussi') + '</div>' +
      (blocks <= lv.par ? '' : '<p>Astuce : avec ' + lv.par + ' blocs, tu gagnes une 2ᵉ étoile et 5 points en plus !</p>') +
      '<div class="rank"><b>' + ra.name + '</b> · ' + after + ' pts<div class="rankbar"><i style="width:' + ra.pct + '%"></i></div></div>' +
      (ra.idx > rb.idx ? '<p><b>⬆ Nouveau rang : ' + ra.name + ' !</b></p>' : '') +
      '<div class="row"><button class="btn" id="m-close">Rester ici</button><a class="btn" href="#/labyrinthes" id="m-list">Liste</a>' +
      (next ? '<a class="btn primary" href="#/labyrinthe/' + next.id + '" id="m-next">Niveau suivant →</a>' : '') + '</div></div></div>';
    var close = function () { root.innerHTML = ''; };
    $('#m-close').onclick = close; $('#m-list').addEventListener('click', close);
    if (next) $('#m-next').addEventListener('click', close);
  }

  /* ---------- tests automatiques ---------- */
  function tests() {
    var rows = '', fails = 0;
    LEVELS.forEach(function (lv) {
      var status = [], ok = true;
      try {
        TB.useLevel(null);
        var ws = new Blockly.Workspace();
        TB.loadXml(ws, TB.dslToXml(lv.sol));
        var code = TB.generateCode(ws, true), res = simulate(lv, code);
        if (res.outcome !== 'goal') { ok = false; status.push('solution : ' + res.outcome); }
        var n = TB.countBlocks(ws);
        if (n !== lv.par) { ok = false; status.push('blocs ' + n + ' ≠ ' + lv.par); }
        var used = {}; ws.getAllBlocks(false).forEach(function (b) { used[b.type] = true; });
        (lv.require || []).forEach(function (t) { if (!used[t]) { ok = false; status.push('manque ' + t); } });
        // programmes faux : vide, ou un seul pas
        if (simulate(lv, '').outcome === 'goal') { ok = false; status.push('programme vide accepté'); }
        if (simulate(lv, 'avancerCase();').outcome === 'goal') { ok = false; status.push('un pas suffit ?!'); }
        // le programme « tout droit ×10 » ne doit pas gagner sauf L1-L2, L6
        var blind = simulate(lv, 'for (var i=0;i<10;i++) avancerCase();').outcome;
        if (blind === 'goal' && ['L1', 'L2', 'L6'].indexOf(lv.id) < 0) { ok = false; status.push('tout droit suffit'); }
        ws.dispose();
        status.push(res.steps + ' pas, ' + n + ' blocs, plateau ' + lv.w + '×' + lv.h);
      } catch (e) { ok = false; status.push('ERREUR ' + e.message); }
      if (!ok) fails++;
      rows += '<tr><td>' + lv.label + '</td><td>' + esc(lv.title) + '</td><td class="' + (ok ? 'okc' : 'koc') + '">' + (ok ? 'OK' : 'ÉCHEC') + '</td><td>' + esc(status.join(' ; ')) + '</td></tr>';
    });
    return { title: 'Tortue — Labyrinthes (' + LEVELS.length + ' niveaux)', rows: rows, fails: fails };
  }

  App.registerRoute(/^#\/labyrinthes$/, viewList);
  App.registerRoute(/^#\/labyrinthe\/(L\d+)$/, function (m) { viewLevel(m[1]); });
  App.registerDispose(dispose);
  App.registerPoints(points);
  App.registerTests(tests);
  App.registerActivity({
    id: 'laby', href: '#/labyrinthes', icon: '🧭', title: 'Tortue — Labyrinthes',
    desc: 'Guide la tortue jusqu’à la laitue avec des boucles et des « si… sinon ».',
    progress: function (p) { return { done: LEVELS.filter(function (l) { return p.laby.done[l.id]; }).length, total: LEVELS.length, points: points(p) }; }
  });
})();
