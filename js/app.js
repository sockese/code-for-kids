/* Tortue Blocs — interface, sauvegarde, points, lecture de l'animation */
(function () {
  'use strict';
  var TB = window.TB;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var RANKS = ['Œuf', 'Têtard', 'Tortillon', 'Petite tortue', 'Tortue curieuse', 'Tortue maligne', 'Tortue habile',
    'Tortue astucieuse', 'Tortue savante', 'Tortue experte', 'Tortue maître', 'Tortue sage', 'Tortue héroïque', 'Tortue légendaire'];
  var SPEEDS = { lent: 2.5, normal: 7, rapide: 24, instantane: Infinity };
  var TOOL_ALL = ['move', 'color', 'pen', 'loop', 'var', 'math', 'func'];
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

  /* ---------- en-tête ---------- */
  function renderHeader(route) {
    var p = data.current && profile();
    var nav = p ? '<nav class="nav"><a href="#/liste" class="' + (route === 'liste' ? 'on' : '') + '">▶ Niveaux</a>' +
      '<a href="#/libre" class="' + (route === 'libre' ? 'on' : '') + '">✏️ Création libre</a></nav>' : '<nav class="nav"></nav>';
    var user = '';
    if (p) {
      var pts = totalPoints(p), r = rankInfo(pts);
      user = '<div class="user"><div class="who"><b>' + esc(data.current) + '</b><small>' + r.name + ' · ' + pts + ' pts</small></div>' +
        '<div class="rankbar" title="' + r.inRank + ' / 50 pour le rang suivant"><i style="width:' + r.pct + '%"></i></div>' +
        '<button class="btn small" id="snd" title="Son">' + (data.sound ? '🔊' : '🔇') + '</button>' +
        '<a class="btn small" href="#/connexion">Changer</a></div>';
    }
    var themeBtn = '<button class="btn small" id="thm" title="Mode clair / sombre">' + (isDark() ? '☀️ Clair' : '🌙 Sombre') + '</button>';
    $('#topbar').innerHTML = '<a class="logo" href="#/liste">🐢 <span class="a">Tortue</span> <span class="b">Blocs</span></a>' + nav + user + themeBtn;
    $('#thm').onclick = function () { data.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); route(); };
    var snd = $('#snd');
    if (snd) snd.onclick = function () { data.sound = !data.sound; save(); snd.textContent = data.sound ? '🔊' : '🔇'; beep([660]); };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- connexion ---------- */
  function viewLogin() {
    renderHeader('connexion');
    var names = Object.keys(data.profiles);
    var list = names.map(function (n) {
      return '<span class="profile"><button data-n="' + esc(n) + '">🐢 ' + esc(n) + ' · ' + totalPoints(data.profiles[n]) + ' pts</button>' +
        '<button class="x" data-del="' + esc(n) + '" title="Supprimer ce joueur">✕</button></span>';
    }).join('');
    $('#view').innerHTML = '<div class="login card"><div class="turtle">🐢</div><h1>Bienvenue !</h1>' +
      '<p>Programme la tortue avec des blocs pour dessiner des figures.<br>Comment t’appelles-tu ?</p>' +
      '<form id="f"><input id="nm" maxlength="20" placeholder="Ton prénom" autocomplete="off" autofocus><button class="btn primary" type="submit">C’est parti !</button></form>' +
      (names.length ? '<p>Ou reprends ta partie :</p><div class="profiles">' + list + '</div>' : '') + '</div>';
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var n = $('#nm').value.trim().replace(/\s+/g, ' ');
      if (!n) { $('#nm').focus(); return; }
      n = n.charAt(0).toUpperCase() + n.slice(1);
      if (!data.profiles[n]) data.profiles[n] = { done: {}, ws: {} };
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
  function login(n) { data.current = n; save(); location.hash = '#/liste'; route(); }

  /* ---------- liste des niveaux ---------- */
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
        html += '<a class="pill ' + (rec ? 'done' : '') + '" href="#/niveau/' + l.id + '">' + l.label +
          '<small>' + esc(l.title) + '</small><span class="stars">' + (rec ? (rec.blocks <= l.par ? '★★' : '★☆') : '') + '</span></a>';
      });
      html += '</div></section>';
    });
    $('#view').innerHTML = html;
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

  function viewLevel(id) {
    var lv = id === 'libre' ? null : TB.LEVEL_BY_ID[id];
    if (id !== 'libre' && !lv) { location.hash = '#/liste'; return; }
    renderHeader(lv ? 'niveau' : 'libre');
    var free = !lv;
    var prep = null;
    if (lv) {
      try { prep = TB.prepareLevel(lv); } catch (e) { $('#view').innerHTML = '<div class="card">Erreur de niveau : ' + esc(e.message) + '</div>'; return; }
    }
    var next = lv ? TB.LEVELS[lv.index + 1] : null;
    var titleHtml = lv ? '<span class="badge">' + lv.label + '</span><h2>' + esc(lv.title) + '</h2>' : '<span class="badge">✏️</span><h2>Création libre</h2>';
    $('#view').innerHTML =
      '<div class="level-head"><a class="btn small" href="#/liste">← Niveaux</a>' + titleHtml + '<span class="spacer"></span>' +
      (lv && lv.index > 0 ? '<a class="btn small" href="#/niveau/' + TB.LEVELS[lv.index - 1].id + '">◀ Précédent</a>' : '') +
      (next ? '<a class="btn small" href="#/niveau/' + next.id + '">Suivant ▶</a>' : '') + '</div>' +
      '<div class="instruction">' + (lv ? esc(lv.text) : 'Dessine ce que tu veux ! Tous les blocs sont disponibles : mouvements, couleurs, boucles, variables et fonctions.') + '</div>' +
      '<div class="level-body"><div class="ws-wrap"><div id="blockly"></div><div class="counter" id="counter"></div></div>' +
      '<div class="side"><div class="canvas-wrap"><canvas id="cv" width="600" height="600"></canvas></div>' +
      '<div class="controls"><button class="btn go" id="run">▶ Exécuter</button><button class="btn stop" id="stop" disabled>⏹ Stop</button>' +
      '<label>Vitesse <select id="speed"><option value="lent">🐢 lent</option><option value="normal" selected>normal</option><option value="rapide">🐇 rapide</option><option value="instantane">⚡ instantané</option></select></label>' +
      '<label><input type="checkbox" id="grid"> Grille</label></div>' +
      '<div class="msg" id="msg"></div>' +
      '<div class="tools2">' + (lv ? '<button class="btn small" id="hint">💡 Indice</button>' : '<button class="btn small" id="clear">🧽 Effacer le dessin</button>') +
      '<button class="btn small" id="reset">↺ Recommencer</button>' +
      (lv ? '<button class="btn small" id="sol" title="Pour les adultes">👀 Solution</button>' : '') + '</div>' +
      '<details id="codebox"><summary>Voir le code</summary><pre id="code"></pre></details></div></div>';

    var groups = lv ? lv.tools : TOOL_ALL;
    var ws = Blockly.inject('blockly', {
      toolbox: TB.buildToolbox(groups), media: 'vendor/media/', trashcan: true, sounds: false,
      zoom: { controls: true, wheel: true, startScale: 0.95, minScale: 0.5, maxScale: 1.6, scaleSpeed: 1.2 },
      theme: blocklyTheme(), grid: { spacing: 25, length: 3, colour: isDark() ? '#2b374f' : '#e3e9f1', snap: true }, renderer: 'geras'
    });
    var cv = $('#cv'), ctx = cv.getContext('2d');
    var layer = document.createElement('canvas'); layer.width = layer.height = TB.SIZE;
    cur = {
      lv: lv, free: free, prep: prep, ws: ws, cv: cv, ctx: ctx, layer: layer, lctx: layer.getContext('2d'),
      map: prep ? prep.map : { zoom: 1, cx: 0, cy: 0 },
      t: { x: 0, y: 0, a: 0 }, playing: false, raf: 0, speed: 'normal', grid: false
    };
    cur.lctx.lineCap = 'round';
    cur.onResize = function () { Blockly.svgResize(ws); };
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
    ws.addChangeListener(function (ev) {
      if (ev.isUiEvent) return;
      refreshCounter(); refreshCode();
      if (lv) {
        try { profile().ws[lv.id] = JSON.stringify(Blockly.serialization.workspaces.save(ws)); save(); } catch (e) { /* ignoré */ }
      }
    });
    setTimeout(function () { Blockly.svgResize(ws); }, 0);

    refreshCounter(); refreshCode(); resetTurtle(); draw();

    $('#run').onclick = run;
    $('#stop').onclick = function () { stopPlay(false); setMsg('Arrêté.', 'warn'); };
    $('#speed').onchange = function (e) { cur.speed = e.target.value; };
    $('#grid').onchange = function (e) { cur.grid = e.target.checked; draw(); };
    $('#reset').onclick = function () {
      if (!confirm('Supprimer tous tes blocs et recommencer ce niveau ?')) return;
      stopPlay(true); ws.clear(); TB.loadXml(ws, startXml()); clearDrawing(); setMsg('', '');
      if (lv) { delete profile().ws[lv.id]; save(); }
    };
    if (lv) {
      $('#hint').onclick = function () { setMsg('💡 ' + lv.hint, 'hint'); };
      $('#sol').onclick = function () {
        if (!confirm('Afficher la solution ? (Cela remplace tes blocs actuels.)')) return;
        stopPlay(true); ws.clear(); TB.loadXml(ws, prep.xml); clearDrawing();
        setMsg('Voici une solution possible. Clique sur Exécuter pour la voir dessiner !', 'hint');
      };
    } else {
      $('#clear').onclick = function () { stopPlay(true); clearDrawing(); };
    }
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
  function refreshCode() {
    if (!cur) return;
    try {
      var code = TB.generateCode(cur.ws, false).replace(/^var [^;]+;\n\n?/m, function (m) { return m; });
      $('#code').textContent = code.trim() || '// (aucun bloc)';
    } catch (e) { $('#code').textContent = '// (code indisponible)'; }
  }

  /* ---------- dessin ---------- */
  function resetTurtle() { cur.t = { x: 0, y: 0, a: 0 }; }
  function clearDrawing() {
    cur.lctx.clearRect(0, 0, TB.SIZE, TB.SIZE); resetTurtle();
    if (cur.ws) cur.ws.highlightBlock(null);
    draw();
  }
  function draw() {
    if (!cur) return;
    var c = cur.ctx, S = TB.SIZE;
    c.fillStyle = isDark() ? '#141b2a' : '#fff'; c.fillRect(0, 0, S, S);
    if (cur.grid) {
      c.strokeStyle = isDark() ? '#243049' : '#e6ecf4'; c.lineWidth = 1; c.beginPath();
      for (var i = 0; i <= S; i += 50) { c.moveTo(i, 0); c.lineTo(i, S); c.moveTo(0, i); c.lineTo(S, i); }
      c.stroke();
    }
    if (cur.prep) { c.globalAlpha = cur.lv.colors ? 0.5 : 0.6; c.drawImage(cur.prep.ghost, 0, 0); c.globalAlpha = 1; }
    c.drawImage(cur.layer, 0, 0);
    var p = TB.px(cur.map, cur.t.x, cur.t.y);
    c.save(); c.translate(p[0], p[1]); c.rotate(cur.t.a * Math.PI / 180);
    // petite tortue vue de dessus
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
    var budget = SPEEDS[cur.speed], map = cur.map, hlHold = cur.speed === 'lent' ? 8 : (cur.speed === 'normal' ? 2 : 0);
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
      // ligne
      var len = Math.hypot(c.x1 - c.x0, c.y1 - c.y0), lenPx = len * map.zoom;
      var remPx = lenPx * (1 - cur.prog), from = cur.prog, to, done;
      cur.t.a = c.a;
      if (budget >= remPx) { to = 1; done = true; budget -= remPx; }
      else { to = cur.prog + budget / lenPx; done = false; budget = 0; }
      if (c.pen) {
        var p0 = TB.px(map, c.x0 + (c.x1 - c.x0) * from, c.y0 + (c.y1 - c.y0) * from);
        var p1 = TB.px(map, c.x0 + (c.x1 - c.x0) * to, c.y0 + (c.y1 - c.y0) * to);
        cur.lctx.strokeStyle = (isDark() && c.col === 'noir') ? '#e8edf6' : (TB.COLORS[c.col] || '#000'); cur.lctx.lineWidth = 5;
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
    // Dessin correct : on vérifie les contraintes pédagogiques
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
    var before = totalPoints(p), rb = rankInfo(before);
    var prev = p.done[lv.id];
    if (!prev || blocks < prev.blocks) p.done[lv.id] = { blocks: blocks, ts: Date.now() };
    save();
    var after = totalPoints(p), ra = rankInfo(after), gained = after - before;
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
  function viewTest() {
    renderHeader('test');
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
        // test négatif : un trait en trop doit être refusé
        var bad = TB.execute('avancer(30);\n' + TB.generateCode(ws, false));
        var cmpBad = TB.compare(TB.segments(bad.cmds), prep.segs, prep.map, !!lv.colors);
        if (cmpBad.ok) { ok = false; status.push('trait en trop accepté !'); }
        ws.dispose();
        status.push(prep.segs.length + ' traits, zoom ' + prep.map.zoom.toFixed(2) + ', ' + n + ' blocs');
      } catch (e) { ok = false; status.push('ERREUR ' + e.message); }
      if (!ok) fails++;
      rows += '<tr><td>' + lv.label + '</td><td>' + esc(lv.title) + '</td><td class="' + (ok ? 'okc' : 'koc') + '">' + (ok ? 'OK' : 'ÉCHEC') + '</td><td>' + esc(status.join(' ; ')) + '</td></tr>';
    });
    $('#view').innerHTML = '<h2>Tests des ' + TB.LEVELS.length + ' niveaux : <span id="test-result" class="' + (fails ? 'koc' : 'okc') + '">' + (fails ? fails + ' échec(s)' : 'tout est OK') + '</span></h2>' +
      '<table class="t"><tr><th>Niveau</th><th>Titre</th><th>Résultat</th><th>Détail</th></tr>' + rows + '</table>';
  }

  /* ---------- routage ---------- */
  function route() {
    var h = location.hash || '';
    disposeCurrent();
    $('#modal-root').innerHTML = '';
    if (h === '#test') { viewTest(); return; }
    if (!data.current || !data.profiles[data.current] || h === '#/connexion') { viewLogin(); return; }
    var m;
    if ((m = h.match(/^#\/niveau\/([A-Z]\d+)$/))) viewLevel(m[1]);
    else if (h === '#/libre') viewLevel('libre');
    else viewList();
  }
  window.addEventListener('hashchange', route);
  route();
})();
