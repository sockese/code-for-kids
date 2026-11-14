/* Tortue Blocs — interface, sauvegarde, points, lecture de l'animation */
(function () {
  'use strict';
  var TB = window.TB;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var RANKS = ['Œuf', 'Poussin', 'Apprenti', 'Curieux', 'Malin', 'Habile', 'Astucieux', 'Savant', 'Expert', 'Maître', 'Sage', 'Héros', 'Génie', 'Légende'];
  // Curseur de vitesse : 1 (très lent) à 5 (instantané), en pixels par image.
  var SPEEDS = [1.5, 4.5, 11, 32, Infinity];
  var SPEED_NAMES = ['très lent', 'lent', 'normal', 'rapide', 'instantané'];
  var TOOL_ALL = ['move', 'dir', 'color', 'pen', 'loop', 'var', 'math', 'func'];
  var BLOCK_LABELS = {
    controls_repeat_ext: 'répéter', variables_set: 'mettre … à', variables_get: 'une variable (le bloc avec son nom)',
    math_change: 'ajouter … à', math_arithmetic: 'un calcul (+ − × ÷)', procedures_defnoreturn: 'une fonction (définition)',
    procedures_callnoreturn: 'l’appel de ta fonction'
  };

  /* ---------- sauvegarde ---------- */
  var data = { profiles: {}, current: null, sound: true };
  try {
    var raw = localStorage.getItem('tortueblocs.v1');
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch (e) { /* stockage indisponible : on travaille en mémoire */ }
  if (data.theme !== 'dark' && data.theme !== 'light') {
    data.theme = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function applyTheme() { document.documentElement.setAttribute('data-theme', data.theme); }
  applyTheme();
  function isDark() { return data.theme === 'dark'; }
  function blocklyTheme() {
    if (!isDark()) return Blockly.Themes.Classic;
    try {
      return Blockly.Theme.defineTheme('tbdark', {
        base: Blockly.Themes.Classic,
        componentStyles: {
          workspaceBackgroundColour: '#1b2335', toolboxBackgroundColour: '#26324b', toolboxForegroundColour: '#e8edf6',
          flyoutBackgroundColour: '#2c3850', flyoutForegroundColour: '#e8edf6', flyoutOpacity: 1,
          scrollbarColour: '#6b7b96', scrollbarOpacity: 0.6, insertionMarkerColour: '#ffffff', insertionMarkerOpacity: 0.3
        }
      });
    } catch (e) { return Blockly.Themes.Classic; }
  }
  function save() { try { localStorage.setItem('tortueblocs.v1', JSON.stringify(data)); } catch (e) { /* ignoré */ } }
  function profile() { return data.profiles[data.current]; }

  function levelPoints(lv, rec) { return rec ? 10 + (rec.blocks <= lv.par ? 5 : 0) : 0; }
  function totalPoints(p) {
    var sum = 0;
    TB.LEVELS.forEach(function (lv) { sum += levelPoints(lv, p.done[lv.id]); });
    return sum;
  }
  function rankInfo(points) {
    var idx = Math.min(RANKS.length - 1, Math.floor(points / 50));
    var inRank = idx === RANKS.length - 1 ? 50 : points % 50;
    return { idx: idx, name: RANKS[idx], inRank: inRank, pct: Math.round(inRank / 50 * 100) };
  }

  /* ---------- sons ---------- */
  var audio = null;
  function beep(freqs) {
    if (!data.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      freqs.forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.3);
        o.connect(g); g.connect(audio.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.32);
      });
    } catch (e) { /* pas de son */ }
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- profils ---------- */
  var AVATARS = ['🐢', '🦊', '🐱', '🐶', '🦉', '🐙', '🦄', '🤖'];
  function newProfile(avatar) { var p = { done: {}, ws: {}, avatar: avatar }; ensureProfile(p); return p; }
  function ensureProfile(p) {
    p.done = p.done || {}; p.ws = p.ws || {}; p.avatar = p.avatar || AVATARS[0];
    p.laby = p.laby || {}; p.laby.done = p.laby.done || {}; p.laby.ws = p.laby.ws || {};
    p.agence = p.agence || {}; p.agence.done = p.agence.done || {};
  }
  Object.keys(data.profiles).forEach(function (n) { ensureProfile(data.profiles[n]); });

  /* Points : tous les modules s'enregistrent ici, le total sert au rang global. */
  var pointFns = [], routes = [], disposers = [], activities = [], testFns = [];
  function allPoints(p) { var s = totalPoints(p); pointFns.forEach(function (f) { s += f(p); }); return s; }

  /* ---------- en-tête ---------- */
  var NAVS = {
    tortue: [['#/liste', '▶ Niveaux', 'liste'], ['#/libre', '✏️ Création libre', 'libre']],
    laby: [['#/labyrinthes', '▶ Niveaux', 'laby']],
    agence: [['#/agence', '🕵️ Missions', 'missions'], ['#/agence/message', '✉️ Courrier', 'message'], ['#/agence/dossier', '📁 Dossier', 'dossier']]
  };
  function renderHeader(route, activity) {
    if (!activity) activity = (route === 'liste' || route === 'niveau' || route === 'libre') ? 'tortue' : '';
    var p = data.current && profile();
    var nav = '<nav class="nav">';
    if (p) {
      nav += '<a href="#/accueil" class="' + (!activity ? 'on' : '') + '">🏠 Activités</a>';
      (NAVS[activity] || []).forEach(function (n) { nav += '<a href="' + n[0] + '" class="' + (route === n[2] ? 'on' : '') + '">' + n[1] + '</a>'; });
    }
    nav += '</nav>';
    var user = '';
    if (p) {
      var pts = allPoints(p), r = rankInfo(pts);
      user = '<div class="user"><div class="who"><b>' + p.avatar + ' ' + esc(data.current) + '</b><small>' + r.name + ' · ' + pts + ' pts</small></div>' +
        '<div class="rankbar" title="' + r.inRank + ' / 50 pour le rang suivant"><i style="width:' + r.pct + '%"></i></div>' +
        '<button class="btn small" id="snd" title="Son">' + (data.sound ? '🔊' : '🔇') + '</button>' +
        '<a class="btn small" href="#/connexion">Changer</a></div>';
    }
    var themeBtn = '<button class="btn small" id="thm" title="Mode clair / sombre">' + (isDark() ? '☀️ Clair' : '🌙 Sombre') + '</button>';
    $('#topbar').innerHTML = '<a class="logo" href="#/accueil">🧪 <span class="a">Labo</span> <span class="b">Code</span></a>' + nav + user + themeBtn;
    $('#thm').onclick = function () { data.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); route(); };
    var snd = $('#snd');
    if (snd) snd.onclick = function () { data.sound = !data.sound; save(); snd.textContent = data.sound ? '🔊' : '🔇'; beep([660]); };
  }

  /* ---------- écran d'arrivée ---------- */
  function viewWelcome() {
    renderHeader('bienvenue');
    $('#view').innerHTML = '<div class="welcome"><div class="hero-emoji">🐢 🕵️ 🧪</div><h1>Labo <span>Code</span></h1>' +
      '<p>Apprends à programmer, résous des labyrinthes et décode des messages secrets en jouant !</p>' +
      '<a class="btn go big" href="#/connexion">▶ Commencer</a></div>';
  }

  /* ---------- connexion ---------- */
  function viewLogin() {
    renderHeader('connexion');
    var names = Object.keys(data.profiles), chosen = AVATARS[0];
    var list = names.map(function (n) {
      var pr = data.profiles[n];
      return '<span class="profile"><button data-n="' + esc(n) + '">' + pr.avatar + ' ' + esc(n) + ' · ' + allPoints(pr) + ' pts</button>' +
        '<button class="x" data-del="' + esc(n) + '" title="Supprimer ce joueur">✕</button></span>';
    }).join('');
    $('#view').innerHTML = '<div class="login card"><h1>Qui joue ?</h1>' +
      (names.length ? '<p>Reprends ta partie :</p><div class="profiles">' + list + '</div><p>Ou crée un nouveau joueur :</p>' : '<p>Comment t’appelles-tu ?</p>') +
      '<form id="f"><input id="nm" maxlength="20" placeholder="Ton prénom" autocomplete="off"><button class="btn primary" type="submit">C’est parti !</button></form>' +
      '<p class="small">Choisis ton avatar :</p><div class="avatars" id="avs">' +
      AVATARS.map(function (a, i) { return '<button type="button" class="avatar' + (i === 0 ? ' on' : '') + '" data-a="' + a + '">' + a + '</button>'; }).join('') + '</div></div>';
    document.querySelectorAll('#avs .avatar').forEach(function (b) {
      b.onclick = function () {
        chosen = b.dataset.a;
        document.querySelectorAll('#avs .avatar').forEach(function (x) { x.classList.toggle('on', x === b); });
      };
    });
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var n = $('#nm').value.trim().replace(/\s+/g, ' ');
      if (!n) { $('#nm').focus(); return; }
      n = n.charAt(0).toUpperCase() + n.slice(1);
      if (!data.profiles[n]) data.profiles[n] = newProfile(chosen);
      login(n);
    };
    document.querySelectorAll('.profile button[data-n]').forEach(function (b) { b.onclick = function () { login(b.dataset.n); }; });
    document.querySelectorAll('.profile button[data-del]').forEach(function (b) {
      b.onclick = function () {
        var n = b.dataset.del;
        if (confirm('Supprimer le joueur « ' + n + ' » et toute sa progression ?')) { delete data.profiles[n]; if (data.current === n) data.current = null; save(); viewLogin(); }
      };
    });
  }
  function login(n) { data.current = n; ensureProfile(data.profiles[n]); save(); location.hash = '#/accueil'; route(); }

  /* ---------- hub : les activités ---------- */
  function viewHub() {
    renderHeader('hub');
    var p = profile();
    var cards = activities.map(function (a) {
      var pr = a.progress(p), pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
      return '<a class="activity" href="' + a.href + '"><div class="act-icon">' + a.icon + '</div><h2>' + a.title + '</h2><p>' + a.desc + '</p>' +
        '<div class="act-prog"><div class="rankbar"><i style="width:' + pct + '%"></i></div><span>' + pr.done + ' / ' + pr.total + ' · ' + pr.points + ' pts</span></div></a>';
    }).join('');
    $('#view').innerHTML = '<div class="hub"><h1>Bonjour ' + p.avatar + ' ' + esc(data.current) + ' !</h1><p>Choisis une activité :</p>' +
      '<div class="activities">' + cards + '</div><p><button class="btn small" id="avbtn">Changer d’avatar</button></p></div>';
    $('#avbtn').onclick = function () {
      var root = $('#modal-root');
      root.innerHTML = '<div class="overlay"><div class="dialog"><h2>Mon avatar</h2><div class="avatars">' +
        AVATARS.map(function (a) { return '<button class="avatar' + (a === p.avatar ? ' on' : '') + '" data-a="' + a + '">' + a + '</button>'; }).join('') + '</div></div></div>';
      root.querySelectorAll('.avatar').forEach(function (b) {
        b.onclick = function () { p.avatar = b.dataset.a; save(); root.innerHTML = ''; viewHub(); };
      });
    };
  }

  /* Couleur du trait pour les niveaux où la couleur n'est pas demandée : elle change d'un niveau à l'autre. */
  var INKS = ['#1e88e5', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00bfa5', '#ec407a', '#ff7043'];
  function levelInk(lv) {
    if (!lv) return TB.COLORS.bleu;
    var c = INKS[lv.index % INKS.length];
    return c;
  }

  /* ---------- liste des niveaux (avec vignettes) ---------- */
  function drawThumb(c) {
    var lv = TB.LEVEL_BY_ID[c.dataset.id];
    var prep = TB.prepareLevel(lv);
    var big = document.createElement('canvas'); big.width = big.height = TB.SIZE;
    var g = big.getContext('2d');
    TB.drawSegments(g, prep.segs, prep.map, 20, lv.colors ? 'color' : 'black');
    if (!lv.colors) { g.globalCompositeOperation = 'source-in'; g.fillStyle = levelInk(lv); g.fillRect(0, 0, TB.SIZE, TB.SIZE); }
    var t = c.getContext('2d');
    t.clearRect(0, 0, c.width, c.height);
    t.drawImage(big, 0, 0, c.width, c.height);
  }
  function viewList() {
    renderHeader('liste');
    var p = profile(), html = '';
    TB.SERIES.forEach(function (s) {
      var lvs = TB.LEVELS.filter(function (l) { return l.series === s.id; });
      var done = lvs.filter(function (l) { return p.done[l.id]; }).length;
      html += '<section class="series card"><div class="series-head"><h2>Série ' + s.id + ' : ' + s.name + '</h2><span class="count">' + done + ' / ' + lvs.length + '</span></div>' +
        '<p>' + s.desc + '</p><div class="pills">';
      lvs.forEach(function (l) {
        var rec = p.done[l.id];
        html += '<a class="pill ' + (rec ? 'done' : '') + '" href="#/niveau/' + l.id + '"><canvas class="thumb" width="104" height="104" data-id="' + l.id + '"></canvas>' +
          '<b>' + l.label + '</b><small>' + esc(l.title) + '</small><span class="stars">' + (rec ? (rec.blocks <= l.par ? '★★' : '★☆') : '') + '</span></a>';
      });
      html += '</div></section>';
    });
    $('#view').innerHTML = html;
    var cvs = Array.prototype.slice.call(document.querySelectorAll('canvas.thumb')), i = 0;
    (function next() {
      var t0 = performance.now();
      while (i < cvs.length && performance.now() - t0 < 14) {
        if (!cvs[i].isConnected) return;
        try { drawThumb(cvs[i]); } catch (e) { /* vignette ignorée */ }
        i++;
      }
      if (i < cvs.length) setTimeout(next, 0);
    })();
  }

  /* ---------- état du niveau ouvert ---------- */
  var cur = null;

  function disposeCurrent() {
    if (!cur) return;
    stopPlay(true);
    try { cur.ws.dispose(); } catch (e) { /* déjà détruit */ }
    window.removeEventListener('resize', cur.onResize);
    cur = null;
  }

  function startXml() { return '<xml xmlns="https://developers.google.com/blockly/xml"><block type="fr_start" x="20" y="20" deletable="false"></block></xml>'; }

  /* Le bloc de départ reste toujours en haut à gauche de la zone de blocs (à droite du menu des blocs). */
  function placeStartBlock(ws) {
    var s = ws.getTopBlocks(false).filter(function (b) { return b.type === 'fr_start'; })[0];
    if (!s) return;
    var m = ws.getMetrics(), sc = ws.scale || 1;
    var targetX = m.viewLeft / sc + 16 / sc, targetY = m.viewTop / sc + 14 / sc;
    var xy = s.getRelativeToSurfaceXY();
    if (Math.abs(xy.x - targetX) > 1 || Math.abs(xy.y - targetY) > 1) s.moveBy(targetX - xy.x, targetY - xy.y);
  }
  function placeStart() { if (cur) placeStartBlock(cur.ws); }

  /* Boîte à outils plate, remise à jour quand l'enfant crée une fonction ou un paramètre. */
  function toolboxEnv() {
    var ws = cur.ws, vars = [];
    (TB.opts.vars || []).forEach(function (n) { if (vars.indexOf(n) < 0) vars.push(n); });
    ws.getAllVariables().forEach(function (v) { if (vars.indexOf(v.name) < 0) vars.push(v.name); });
    var procs = Blockly.Procedures.allProcedures(ws)[0].map(function (p) { return [p[0], p[1]]; });
    return { vars: vars, procs: procs };
  }
  function refreshToolbox(force) {
    if (!cur) return;
    var env = toolboxEnv(), sig = JSON.stringify(env);
    if (!force && sig === cur.toolSig) return;
    cur.toolSig = sig;
    cur.ws.updateToolbox(TB.buildToolbox(cur.groups, env));
    setTimeout(function () { if (cur) { Blockly.svgResize(cur.ws); placeStart(); } }, 0);
  }

  /* Adapte la page à la taille de l'écran : jamais de défilement de la page (#lbody, #side, #cvw). */
  function layoutLevel(ws) {
    document.documentElement.style.setProperty('--top', $('#topbar').offsetHeight + 'px');
    var body = $('#lbody'), side = $('#side');
    if (!body || !side) return;
    var W = body.clientWidth, H = body.clientHeight, cvw = $('#cvw'), cv;
    var landscape = W >= 640 && W >= H * 1.1;
    function apply(size) {
      side.style.width = size + 'px';
      cvw.style.width = size + 'px'; cvw.style.height = size + 'px';
    }
    if (landscape) {
      body.classList.remove('stack');
      cv = Math.max(200, Math.min(H - 100, W * 0.5, 640));
      body.style.gridTemplateColumns = 'minmax(0,1fr) ' + cv + 'px';
      body.style.gridTemplateRows = '100%';
      apply(cv);
      // si les boutons passent sur deux lignes, on réduit le dessin pour que tout tienne
      var over = side.scrollHeight - H;
      if (over > 0) { cv = Math.max(180, cv - over); body.style.gridTemplateColumns = 'minmax(0,1fr) ' + cv + 'px'; apply(cv); }
    } else {
      body.classList.add('stack');
      cv = Math.max(180, Math.min(W, H * 0.48 - 90));
      body.style.gridTemplateColumns = 'minmax(0,1fr)';
      body.style.gridTemplateRows = 'minmax(0,1fr) auto';
      apply(cv);
    }
    if (ws) { Blockly.svgResize(ws); placeStartBlock(ws); }
  }
  function fitLayout() { if (cur) layoutLevel(cur.ws); }

  function viewLevel(id) {
    var lv = id === 'libre' ? null : TB.LEVEL_BY_ID[id];
    if (id !== 'libre' && !lv) { location.hash = '#/liste'; return; }
    renderHeader(lv ? 'niveau' : 'libre');
    var free = !lv, prep = null;
    TB.useLevel(lv);
    if (lv) {
      try { prep = TB.prepareLevel(lv); } catch (e) { $('#view').innerHTML = '<div class="card">Erreur de niveau : ' + esc(e.message) + '</div>'; return; }
    }
    var next = lv ? TB.LEVELS[lv.index + 1] : null, prev = lv && lv.index > 0 ? TB.LEVELS[lv.index - 1] : null;
    $('#view').className = 'is-level';
    $('#view').innerHTML =
      '<section class="level"><div class="level-head"><a class="btn small" href="#/liste">← Niveaux</a>' +
      (lv ? '<span class="badge">' + lv.label + '</span><h2>' + esc(lv.title) + '</h2>' : '<span class="badge">✏️</span><h2>Création libre</h2>') +
      '<span class="spacer"></span>' +
      (prev ? '<a class="btn small" href="#/niveau/' + prev.id + '">◀</a>' : '') +
      (next ? '<a class="btn small" href="#/niveau/' + next.id + '">▶</a>' : '') + '</div>' +
      '<div class="instruction">' + (lv ? esc(lv.text) : 'Dessine ce que tu veux ! Tous les blocs sont disponibles.') + '</div>' +
      '<div class="level-body" id="lbody"><div class="ws-wrap"><div id="blockly"></div><div class="counter" id="counter"></div></div>' +
      '<div class="side" id="side"><div class="canvas-wrap" id="cvw"><canvas id="cv" width="600" height="600"></canvas><div class="msg" id="msg"></div></div>' +
      '<div class="controls"><button class="btn go" id="run">▶ Exécuter</button><button class="btn stop" id="stop" disabled>⏹</button>' +
      '<label class="speed" title="Vitesse"><span>🐢</span><input type="range" id="speed" min="1" max="5" step="1" value="3"><span>🐇</span></label>' +
      '<label class="chk"><input type="checkbox" id="grid" checked> Grille</label></div>' +
      '<div class="tools2">' + (lv ? '<button class="btn small" id="hint">💡 Indice</button>' : '<button class="btn small" id="clear">🧽 Effacer</button>') +
      '<button class="btn small" id="reset">↺ Recommencer</button>' +
      (lv ? '<button class="btn small" id="sol" title="Pour les adultes">👀 Solution</button>' : '') +
      '<button class="btn small" id="codebtn">{ } Code</button></div></div></div></section>';

    var groups = lv ? lv.tools : TOOL_ALL;
    var firstEnv = { vars: (lv ? lv.opts.vars : TB.FREE_OPTS.vars), procs: [] };
    var ws = Blockly.inject('blockly', {
      toolbox: TB.buildToolbox(groups, firstEnv), media: 'vendor/media/', trashcan: true, sounds: false,
      zoom: { controls: true, wheel: true, startScale: 0.8, minScale: 0.5, maxScale: 1.6, scaleSpeed: 1.2 },
      theme: blocklyTheme(), grid: { spacing: 25, length: 3, colour: isDark() ? '#2b374f' : '#e3e9f1', snap: true }, renderer: 'geras'
    });
    var cv = $('#cv'), ctx = cv.getContext('2d');
    var layer = document.createElement('canvas'); layer.width = layer.height = TB.SIZE;
    cur = {
      lv: lv, free: free, prep: prep, ws: ws, cv: cv, ctx: ctx, layer: layer, lctx: layer.getContext('2d'),
      map: prep ? prep.map : { zoom: 1, cx: 0, cy: 0 },
      t: { x: 0, y: 0, a: 0 }, playing: false, raf: 0, speed: 3, grid: true, solved: false, groups: groups, toolSig: '', ghosts: {}
    };
    cur.lctx.lineCap = 'round';
    cur.onResize = fitLayout;
    window.addEventListener('resize', cur.onResize);

    // Chargement : blocs sauvegardés ou départ vide
    var saved = lv && profile().ws[lv.id];
    var loaded = false;
    if (saved) {
      try { Blockly.serialization.workspaces.load(JSON.parse(saved), ws); loaded = true; } catch (e) { ws.clear(); }
    }
    if (!loaded || !ws.getTopBlocks(false).some(function (b) { return b.type === 'fr_start'; })) {
      if (loaded) ws.clear();
      TB.loadXml(ws, startXml());
    }
    ensureVariables();
    refreshToolbox(true);
    ws.addChangeListener(function (ev) {
      if (ev.isUiEvent) return;
      refreshCounter();
      if (!ws.isDragging || !ws.isDragging()) refreshToolbox(false);
      if (lv) {
        try { profile().ws[lv.id] = JSON.stringify(Blockly.serialization.workspaces.save(ws)); save(); } catch (e) { /* ignoré */ }
      }
    });
    fitLayout();
    setTimeout(fitLayout, 60);
    setTimeout(fitLayout, 400);

    refreshCounter(); resetTurtle(); draw();

    $('#run').onclick = run;
    $('#stop').onclick = function () { stopPlay(false); setMsg('Arrêté.', 'warn'); };
    $('#speed').oninput = function (e) { cur.speed = Number(e.target.value); $('#speed').title = 'Vitesse : ' + SPEED_NAMES[cur.speed - 1]; };
    $('#grid').onchange = function (e) { cur.grid = e.target.checked; draw(); };
    $('#msg').onclick = function () { setMsg('', ''); };
    $('#codebtn').onclick = showCode;
    $('#reset').onclick = function () {
      if (!confirm('Supprimer tous tes blocs et recommencer ce niveau ?')) return;
      cur.solved = false; stopPlay(true); ws.clear(); TB.loadXml(ws, startXml()); ensureVariables(); clearDrawing(); setMsg('', ''); refreshToolbox(true); placeStart();
      if (lv) { delete profile().ws[lv.id]; save(); }
    };
    if (lv) {
      $('#hint').onclick = function () { setMsg('💡 ' + lv.hint, 'hint'); };
      $('#sol').onclick = function () {
        if (!confirm('Afficher la solution ? (Cela remplace tes blocs actuels.)')) return;
        stopPlay(true); ws.clear(); TB.loadXml(ws, prep.xml); ensureVariables(); clearDrawing(); refreshToolbox(true); placeStart();
        setMsg('Voici une solution possible. Clique sur Exécuter pour la voir dessiner !', 'hint');
      };
    } else {
      $('#clear').onclick = function () { stopPlay(true); clearDrawing(); };
    }
  }

  /* Les variables du niveau sont déjà créées : l'enfant n'a rien à taper. */
  function ensureVariables() {
    if (!cur) return;
    (TB.opts.vars || []).forEach(function (n) { if (!cur.ws.getVariable(n)) cur.ws.createVariable(n); });
  }

  function showCode() {
    var code = '';
    try { code = TB.generateCode(cur.ws, false).trim(); } catch (e) { code = '// (code indisponible)'; }
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay"><div class="dialog code"><h2>Le code de ton programme</h2><pre>' + esc(code || '// (aucun bloc)') +
      '</pre><div class="row"><button class="btn primary" id="m-close">Fermer</button></div></div></div>';
    $('#m-close').onclick = function () { root.innerHTML = ''; };
  }

  function setMsg(text, kind) {
    var m = $('#msg'); if (!m) return;
    m.className = 'msg' + (text ? ' show ' + kind : '');
    m.innerHTML = text;
  }
  function refreshCounter() {
    if (!cur) return;
    var n = TB.countBlocks(cur.ws), el = $('#counter');
    if (!el) return;
    if (cur.lv && cur.lv.limit) {
      var max = cur.prep.par + 1;
      el.textContent = 'Blocs : ' + n + ' / ' + max; el.className = 'counter' + (n > max ? ' over' : '');
    } else { el.textContent = 'Blocs : ' + n; el.className = 'counter'; }
  }

  /* ---------- dessin ---------- */
  function resetTurtle() { cur.t = { x: 0, y: 0, a: 0 }; }
  function clearDrawing() {
    cur.lctx.clearRect(0, 0, TB.SIZE, TB.SIZE); resetTurtle();
    if (cur.ws) cur.ws.highlightBlock(null);
    draw();
  }
  /* Modèle : couleur légère tant que le dessin n'est pas réussi, plus foncée ensuite. */
  function ghostImage() {
    var key = (isDark() ? 'd' : 'l') + (cur.solved ? 's' : 'u');
    if (cur.ghosts[key]) return cur.ghosts[key];
    var mask = cur.prep.mask;
    if (cur.lv.colors) { cur.ghosts[key] = mask; return mask; }
    var c = document.createElement('canvas'); c.width = c.height = TB.SIZE;
    var g = c.getContext('2d');
    g.drawImage(mask, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = isDark() ? (cur.solved ? '#9cc2f5' : '#4a5a78') : (cur.solved ? '#2d4a82' : '#b4c3dc');
    g.fillRect(0, 0, TB.SIZE, TB.SIZE);
    cur.ghosts[key] = c;
    return c;
  }

  /* Grille : un carreau = 100 unités du dessin, alignée sur le modèle (la tortue part d'un nœud de la grille). */
  function drawGrid(c) {
    var S = TB.SIZE, map = cur.map, z = map.zoom;
    var k0 = Math.floor((map.cx - S / 2 / z) / 100), k1 = Math.ceil((map.cx + S / 2 / z) / 100);
    var j0 = Math.floor((map.cy - S / 2 / z) / 100), j1 = Math.ceil((map.cy + S / 2 / z) / 100);
    var normal = isDark() ? '#26324b' : '#e3e9f3', axis = isDark() ? '#3a4a6c' : '#c9d4e6';
    c.lineWidth = 1;
    for (var k = k0; k <= k1; k++) {
      var x = Math.round(TB.px(map, k * 100, 0)[0]) + 0.5;
      c.strokeStyle = k === 0 ? axis : normal; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, S); c.stroke();
    }
    for (var j = j0; j <= j1; j++) {
      var y = Math.round(TB.px(map, 0, j * 100)[1]) + 0.5;
      c.strokeStyle = j === 0 ? axis : normal; c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke();
    }
  }

  function draw() {
    if (!cur) return;
    var c = cur.ctx, S = TB.SIZE;
    c.fillStyle = isDark() ? '#141b2a' : '#fff'; c.fillRect(0, 0, S, S);
    if (cur.grid) drawGrid(c);
    if (cur.prep) {
      c.globalAlpha = cur.lv.colors ? (cur.solved ? 0.95 : 0.4) : 1;
      c.drawImage(ghostImage(), 0, 0); c.globalAlpha = 1;
    }
    c.drawImage(cur.layer, 0, 0);
    var p = TB.px(cur.map, cur.t.x, cur.t.y);
    drawTurtleSprite(c, p[0], p[1], cur.t.a, 1);
  }
  /* Petite tortue vue de dessus, tête vers le haut (angle = 0), k = échelle. */
  function drawTurtleSprite(c, x, y, angle, k) {
    c.save(); c.translate(x, y); c.rotate(angle * Math.PI / 180); c.scale(k, k);
    c.fillStyle = '#2e7d32'; c.strokeStyle = '#1b5e20'; c.lineWidth = 2;
    [[-10, -8], [10, -8], [-10, 9], [10, 9]].forEach(function (l) { c.beginPath(); c.arc(l[0], l[1], 4.5, 0, 7); c.fill(); c.stroke(); });
    c.beginPath(); c.arc(0, -15, 6, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#4caf50'; c.beginPath(); c.ellipse(0, 0, 12, 15, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#81c784'; c.beginPath(); c.ellipse(0, 0, 6, 8, 0, 0, 7); c.fill();
    c.restore();
  }

  /* ---------- exécution et animation ---------- */
  function run() {
    if (!cur) return;
    stopPlay(true);
    cur.solved = false;
    clearDrawing();
    setMsg('', '');
    var code;
    try { code = TB.generateCode(cur.ws, true); } catch (e) { setMsg('Oups, impossible de lire tes blocs : ' + esc(e.message), 'err'); return; }
    var res = TB.execute(code);
    cur.result = res;
    cur.cmds = res.cmds; cur.i = 0; cur.prog = 0; cur.hold = 0; cur.playing = true;
    $('#run').disabled = true; $('#stop').disabled = false;
    beep([440]);
    frame();
  }

  function stopPlay(silent) {
    if (!cur) return;
    cancelAnimationFrame(cur.raf);
    cur.playing = false;
    var r = $('#run'), s = $('#stop');
    if (r) r.disabled = false;
    if (s) s.disabled = true;
    try { cur.ws.highlightBlock(null); } catch (e) { /* ignoré */ }
    if (!silent) draw();
  }

  function frame() {
    if (!cur || !cur.playing) return;
    var budget = SPEEDS[cur.speed - 1], map = cur.map, hlHold = cur.speed <= 1 ? 8 : (cur.speed === 2 ? 4 : (cur.speed === 3 ? 1 : 0));
    while (cur.i < cur.cmds.length) {
      if (cur.hold > 0) { cur.hold--; break; }
      var c = cur.cmds[cur.i];
      if (c.t === 'hl') {
        cur.ws.highlightBlock(c.id); cur.i++;
        if (hlHold && budget !== Infinity) { cur.hold = hlHold; }
        continue;
      }
      if (budget <= 0) break;
      if (c.t === 'turn') {
        cur.t.a = c.a; cur.i++;
        if (budget !== Infinity) budget -= 6;
        continue;
      }
      var len = Math.hypot(c.x1 - c.x0, c.y1 - c.y0), lenPx = len * map.zoom;
      var remPx = lenPx * (1 - cur.prog), from = cur.prog, to, done;
      cur.t.a = c.a;
      if (budget >= remPx) { to = 1; done = true; budget -= remPx; }
      else { to = cur.prog + budget / lenPx; done = false; budget = 0; }
      if (c.pen) {
        var p0 = TB.px(map, c.x0 + (c.x1 - c.x0) * from, c.y0 + (c.y1 - c.y0) * from);
        var p1 = TB.px(map, c.x0 + (c.x1 - c.x0) * to, c.y0 + (c.y1 - c.y0) * to);
        cur.lctx.strokeStyle = (cur.lv && !cur.lv.colors) ? levelInk(cur.lv) : ((isDark() && c.col === 'noir') ? '#e8edf6' : (TB.COLORS[c.col] || '#000')); cur.lctx.lineWidth = 5;
        cur.lctx.beginPath(); cur.lctx.moveTo(p0[0], p0[1]); cur.lctx.lineTo(p1[0], p1[1]); cur.lctx.stroke();
      }
      cur.t.x = c.x0 + (c.x1 - c.x0) * to; cur.t.y = c.y0 + (c.y1 - c.y0) * to;
      if (done) { cur.i++; cur.prog = 0; } else { cur.prog = to; break; }
    }
    draw();
    if (cur.i >= cur.cmds.length) { finishRun(); return; }
    cur.raf = requestAnimationFrame(frame);
  }

  function finishRun() {
    var res = cur.result;
    stopPlay(false);
    if (res.error) {
      var m = {
        valeur: 'Un bloc a reçu une valeur qui n’est pas un nombre. Ta variable a-t-elle bien reçu une valeur avant d’être utilisée ?',
        long: 'Ton programme est trop long ou ne s’arrête jamais. Vérifie tes nombres de répétitions.',
        autre: 'Il y a un souci dans ton programme.'
      };
      setMsg('⚠️ ' + m[res.error], 'err'); beep([220]); return;
    }
    if (cur.free) { setMsg('Joli dessin ! Change tes blocs et réessaie.', 'ok'); return; }
    evaluate(res);
  }

  /* ---------- validation ---------- */
  function evaluate(res) {
    var lv = cur.lv, prep = cur.prep, ws = cur.ws;
    var segs = TB.segments(res.cmds);
    var cmp = TB.compare(segs, prep.segs, prep.map, !!lv.colors);
    var orphans = ws.getTopBlocks(false).filter(function (b) {
      return ['fr_start', 'procedures_defnoreturn', 'procedures_defreturn'].indexOf(b.type) < 0;
    }).length;
    var orphanNote = orphans ? '<br>👉 Certains blocs ne sont pas accrochés à « ▶ quand on exécute » : ils ne sont pas utilisés.' : '';

    if (cmp.empty) { setMsg('Ton programme n’a rien dessiné. Accroche des blocs sous « ▶ quand on exécute ».' + orphanNote, 'warn'); beep([220]); return; }
    if (!cmp.ok) {
      var why;
      if (cmp.wrongColor && !cmp.extra && !cmp.missing) why = 'La forme est bonne, mais les couleurs ne sont pas les bonnes.';
      else if (cmp.extra && cmp.missing) why = 'Pas encore ! Il y a des traits en trop et des traits qui manquent. Compare avec le modèle gris.';
      else if (cmp.extra) why = 'Presque ! Tu as dessiné des traits qui ne sont pas dans le modèle.';
      else why = 'Presque ! Il manque encore une partie du modèle gris.';
      setMsg(why + ' Utilise 💡 Indice si tu as besoin d’aide.' + orphanNote, 'warn'); beep([220]); return;
    }
    cur.solved = true; draw();
    var used = {};
    ws.getAllBlocks(false).forEach(function (b) { used[b.type] = true; });
    var missing = (lv.require || []).filter(function (t) { return !used[t]; });
    if (missing.length) {
      setMsg('Le dessin est bon ! Mais ce niveau demande d’utiliser : <b>' + missing.map(function (t) { return BLOCK_LABELS[t] || t; }).join('</b>, <b>') + '</b>.', 'warn');
      beep([330]); return;
    }
    var blocks = TB.countBlocks(ws);
    if (lv.limit && blocks > prep.par + 1) {
      setMsg('Le dessin est bon, mais tu as utilisé ' + blocks + ' blocs. Essaie avec ' + (prep.par + 1) + ' blocs maximum (indice : une boucle !).', 'warn');
      beep([330]); return;
    }
    succeed(blocks);
  }

  function succeed(blocks) {
    var lv = cur.lv, p = profile();
    var before = allPoints(p), rb = rankInfo(before);
    var prev = p.done[lv.id];
    if (!prev || blocks < prev.blocks) p.done[lv.id] = { blocks: blocks, ts: Date.now() };
    save();
    var after = allPoints(p), ra = rankInfo(after), gained = after - before;
    renderHeader('niveau');
    beep([523, 659, 784, 1047]);
    confetti();
    setMsg('✅ Bravo, niveau réussi !', 'ok');
    var next = TB.LEVELS[lv.index + 1];
    var stars = blocks <= lv.par ? '⭐⭐' : '⭐';
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay"><div class="dialog"><div class="big">' + stars + '</div><h2>Niveau terminé !</h2>' +
      '<div class="pts">' + (gained > 0 ? '+' + gained + ' points' : 'Déjà réussi') + '</div>' +
      (blocks <= lv.par ? '' : '<p>Astuce : avec ' + lv.par + ' blocs, tu gagnes une 2ᵉ étoile et 5 points en plus !</p>') +
      '<div class="rank"><b>' + ra.name + '</b> · ' + after + ' pts<div class="rankbar"><i style="width:' + ra.pct + '%"></i></div></div>' +
      (ra.idx > rb.idx ? '<p><b>⬆ Nouveau rang : ' + ra.name + ' !</b></p>' : '') +
      '<div class="row"><button class="btn" id="m-close">Rester ici</button><a class="btn" href="#/liste" id="m-list">Liste</a>' +
      (next ? '<a class="btn primary" href="#/niveau/' + next.id + '" id="m-next">Niveau suivant →</a>' : '') + '</div></div></div>';
    var close = function () { root.innerHTML = ''; };
    $('#m-close').onclick = close;
    $('#m-list').addEventListener('click', close);
    if (next) $('#m-next').addEventListener('click', close);
  }

  function confetti() {
    var em = ['🎉', '⭐', '✨', '🐢', '🎈'];
    for (var i = 0; i < 28; i++) {
      var d = document.createElement('div');
      d.className = 'confetti'; d.textContent = em[i % em.length];
      d.style.left = Math.random() * 100 + 'vw'; d.style.animationDelay = Math.random() * 0.8 + 's';
      document.body.appendChild(d);
      setTimeout((function (x) { return function () { x.remove(); }; })(d), 3500);
    }
  }

  /* ---------- page de test (#test) ---------- */
  function tortueTests() {
    var rows = '', fails = 0;
    TB.LEVELS.forEach(function (lv) {
      var status = [], ok = true;
      try {
        var prep = TB.prepareLevel(lv);
        var ws = new Blockly.Workspace();
        TB.loadXml(ws, prep.xml);
        var code = TB.generateCode(ws, true);
        var res = TB.execute(code);
        var cmp = TB.compare(TB.segments(res.cmds), prep.segs, prep.map, !!lv.colors);
        if (!cmp.ok) { ok = false; status.push('solution refusée'); }
        var n = TB.countBlocks(ws);
        if (n !== lv.par) { ok = false; status.push('blocs ' + n + ' ≠ par ' + lv.par); }
        var used = {}; ws.getAllBlocks(false).forEach(function (b) { used[b.type] = true; });
        (lv.require || []).forEach(function (t) { if (!used[t]) { ok = false; status.push('manque ' + t); } });
        // Chaque nombre de la solution doit exister dans les listes proposées
        ws.getAllBlocks(false).forEach(function (b) {
          if (b.type.indexOf('fr_num_') === 0) {
            var kind = b.type.slice(7), v = Number(b.getFieldValue('V'));
            if (lv.opts[kind].indexOf(v) < 0) { ok = false; status.push('valeur ' + v + ' absente de la liste ' + kind); }
          }
        });
        if (lv.opts.ang.length > 6 || lv.opts.val.length > 6) status.push('liste longue');
        // test négatif : un trait en trop doit être refusé
        var bad = TB.execute('avancer(30);\n' + TB.generateCode(ws, false));
        var cmpBad = TB.compare(TB.segments(bad.cmds), prep.segs, prep.map, !!lv.colors);
        if (cmpBad.ok) { ok = false; status.push('trait en trop accepté !'); }
        ws.dispose();
        status.push(prep.segs.length + ' traits, zoom ' + prep.map.zoom.toFixed(2) + ', ' + n + ' blocs, longueurs ' + lv.opts.len.join('/') + ', angles ' + lv.opts.ang.join('/'));
      } catch (e) { ok = false; status.push('ERREUR ' + e.message); }
      if (!ok) fails++;
      rows += '<tr><td>' + lv.label + '</td><td>' + esc(lv.title) + '</td><td class="' + (ok ? 'okc' : 'koc') + '">' + (ok ? 'OK' : 'ÉCHEC') + '</td><td>' + esc(status.join(' ; ')) + '</td></tr>';
    });
    return { title: 'Tortue — Dessins (' + TB.LEVELS.length + ' niveaux)', rows: rows, fails: fails };
  }

  function viewTest() {
    renderHeader('test');
    var sections = [tortueTests()].concat(testFns.map(function (f) { return f(); }));
    var fails = sections.reduce(function (n, x) { return n + x.fails; }, 0);
    $('#view').innerHTML = '<h2>Tests : <span id="test-result" class="' + (fails ? 'koc' : 'okc') + '">' + (fails ? fails + ' échec(s)' : 'tout est OK') + '</span></h2>' +
      sections.map(function (x) {
        return '<h3>' + x.title + ' — ' + (x.fails ? '<span class="koc">' + x.fails + ' échec(s)</span>' : '<span class="okc">OK</span>') + '</h3>' +
          '<table class="t"><tr><th>Élément</th><th>Titre</th><th>Résultat</th><th>Détail</th></tr>' + x.rows + '</table>';
      }).join('');
  }

  /* ---------- routage ---------- */
  function route() {
    var h = location.hash || '';
    disposeCurrent();
    disposers.forEach(function (f) { try { f(); } catch (e) { /* ignoré */ } });
    $('#view').className = '';
    $('#modal-root').innerHTML = '';
    if (h === '#test') { viewTest(); return; }
    var logged = data.current && data.profiles[data.current];
    if (h === '#/connexion') { viewLogin(); return; }
    if (!logged) { if (h === '' || h === '#/' || h === '#/bienvenue') viewWelcome(); else viewLogin(); return; }
    var m;
    if (h === '' || h === '#/' || h === '#/accueil') { viewHub(); return; }
    if ((m = h.match(/^#\/niveau\/([A-Z]\d+)$/))) { viewLevel(m[1]); return; }
    if (h === '#/libre') { viewLevel('libre'); return; }
    if (h === '#/liste') { viewList(); return; }
    for (var i = 0; i < routes.length; i++) {
      if ((m = h.match(routes[i][0]))) { routes[i][1](m); return; }
    }
    viewHub();
  }

  activities.push({
    id: 'tortue', href: '#/liste', icon: '🐢', title: 'Tortue — Dessins',
    desc: 'Dessine des figures en assemblant des blocs.',
    progress: function (p) { return { done: Object.keys(p.done).filter(function (id) { return TB.LEVEL_BY_ID[id]; }).length, total: TB.LEVELS.length, points: totalPoints(p) }; }
  });

  /* API pour les autres activités (labyrinthes, agence secrète). */
  window.App = {
    $: $, data: data, save: save, profile: profile, esc: esc, beep: beep, confetti: confetti, isDark: isDark, blocklyTheme: blocklyTheme,
    renderHeader: renderHeader, route: route, rankInfo: rankInfo, allPoints: allPoints, AVATARS: AVATARS,
    placeStartBlock: placeStartBlock, layoutLevel: layoutLevel, drawTurtleSprite: drawTurtleSprite,
    SPEEDS: SPEEDS, SPEED_NAMES: SPEED_NAMES,
    registerPoints: function (f) { pointFns.push(f); },
    registerRoute: function (re, fn) { routes.push([re, fn]); },
    registerDispose: function (f) { disposers.push(f); },
    registerActivity: function (a) { activities.push(a); },
    registerTests: function (f) { testFns.push(f); },
    start: function () { window.addEventListener('hashchange', route); route(); }
  };
})();
