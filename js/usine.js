/* Labo Code — Usine à machines : interface (construction, lecture de la simulation, robot, atelier libre). */
(function () {
  'use strict';
  var App = window.App, TB = window.TB, EN = window.UsineEngine, LV = window.UsineLevels, $ = App.$, esc = App.esc;
  var W = EN.W, H = EN.H, CS = 80, CW = W * CS, CHT = H * CS;
  var PARTS = LV.PARTS, CH = EN.CH, CHEX = LV.COLOR_HEX;
  var SPEEDS = [0.25, 0.5, 1, 2, 4];

  /* ---------- niveau « atelier libre » ---------- */
  var FREE = {
    id: 'libre', world: 6, title: 'Atelier libre', kind: 'free', tmax: 25, goal: {}, parts: null, max: 999,
    map: ['............', '............', '............', '............', '............', '............', '............', '############'],
    text: 'Invente ta propre machine : toutes les pièces sont à toi, sans limite. Appuie sur ▶ pour la tester. Tu peux sauvegarder 3 inventions.'
  };
  var FREE_ORDER = ['ramp', 'belt', 'spring', 'bumper', 'fan', 'magnet', 'sensor', 'door', 'lamp', 'wall', 'dispenser', 'bucket'];

  /* ---------- profil ---------- */
  function done(p) { return p.usine.done; }
  function points(p) { var s = 0, d = p.usine && p.usine.done; if (!d) return 0; Object.keys(d).forEach(function (k) { s += d[k].pts || 0; }); return s; }

  /* ---------- liste des niveaux ---------- */
  function viewList() {
    App.renderHeader('liste', 'usine');
    var p = App.profile(), n = LV.LEVELS.filter(function (l) { return done(p)[l.id]; }).length;
    var html = '<div class="agency-head card"><div><h2>🏭 Usine à machines</h2><p>Construis des machines avec des briques et programme Brickbot, le robot de l’usine !</p></div>' +
      '<div class="grade"><b>' + n + ' / ' + LV.LEVELS.length + '</b> niveaux<div class="rankbar"><i style="width:' + Math.round(n / LV.LEVELS.length * 100) + '%"></i></div></div></div>';
    LV.WORLDS.forEach(function (w) {
      var lvs = LV.LEVELS.filter(function (l) { return l.world === w.n; }), d = lvs.filter(function (l) { return done(p)[l.id]; }).length;
      html += '<section class="series card"><div class="series-head"><h2>' + w.icon + ' Monde ' + w.n + ' : ' + esc(w.name) + '</h2><span class="count">' + d + ' / ' + lvs.length + '</span></div><p>' + esc(w.desc) + '</p><div class="pills">';
      lvs.forEach(function (l) {
        var r = done(p)[l.id];
        html += '<a class="pill mpill ' + (r ? 'done' : '') + '" href="#/usine/niveau/' + l.id + '"><div class="m-ico">' + w.icon + '</div><b>' + l.id + '</b><small>' + esc(l.title) + '</small><span class="stars">' + (r ? (r.pts >= 15 ? '★★' : '★☆') : '') + '</span></a>';
      });
      html += '</div></section>';
    });
    html += '<section class="series card free-card"><div class="series-head"><h2>🛠️ Atelier libre</h2></div><p>' + esc(FREE.text) + '</p><a class="btn go" href="#/usine/libre">Ouvrir l’atelier</a></section>';
    $('#view').innerHTML = html;
  }

  /* ---------- état de la page ---------- */
  var cur = null;
  function dispose() {
    if (!cur) return;
    cancelAnimationFrame(cur.raf);
    try { if (cur.ws) cur.ws.dispose(); } catch (e) { /* déjà détruit */ }
    window.removeEventListener('resize', cur.onResize);
    cur = null;
  }
  function startXml() { return '<xml xmlns="https://developers.google.com/blockly/xml"><block type="fr_start" x="20" y="20" deletable="false"></block></xml>'; }

  function allowed(lv) { return lv.kind === 'free' ? FREE_ORDER : Object.keys(lv.parts || {}); }
  function countOf(pl, k) { return pl.filter(function (q) { return q.p === k; }).length; }

  function viewLevel(id) {
    var lv = id === 'libre' ? FREE : LV.BY_ID[id];
    if (!lv) { location.hash = '#/usine'; return; }
    App.renderHeader('niveau', 'usine');
    TB.useLevel(null);
    var robot = lv.kind === 'robot', free = lv.kind === 'free';
    var p = App.profile(), next = free ? null : LV.LEVELS[lv.index + 1], prev = free ? null : LV.LEVELS[lv.index - 1];
    cur = { lv: lv, free: free, robot: robot, pl: [], tool: null, run: null, playing: false, paused: false, frame: 0, speed: 2, raf: 0, hint: false, ws: null, hlIdx: 0 };
    $('#view').className = 'is-level';
    $('#view').innerHTML =
      '<section class="level usine"><div class="level-head"><a class="btn small" href="#/usine">← Niveaux</a><span class="badge">' + (free ? '🛠️' : lv.id) + '</span><h2>' + esc(lv.title) + '</h2><span class="spacer"></span>' +
      (prev ? '<a class="btn small" href="#/usine/niveau/' + prev.id + '">◀</a>' : '') +
      (next ? '<a class="btn small" href="#/usine/niveau/' + next.id + '">▶</a>' : (!free ? '<a class="btn small" href="#/usine/libre">🛠️</a>' : '')) + '</div>' +
      '<div class="instruction">🔧 ' + esc(lv.text) + '</div><div class="m-steps" id="steps"></div>' +
      '<div class="us-main" id="usmain">' + (robot ? '<div class="ws-wrap us-left" id="usleft"><div id="blockly"></div><div class="counter" id="counter"></div></div>' : '') +
      '<div class="us-center"><div class="us-board" id="usboard"><canvas id="usc" width="' + CW + '" height="' + CHT + '"></canvas></div>' +
      '<div class="us-tray" id="tray"></div>' +
      '<div class="us-controls"><button class="btn go" id="play">▶ Lancer</button><button class="btn small" id="pause" disabled>⏸</button><button class="btn small" id="stepb" disabled title="Avancer un peu">⏭</button>' +
      '<button class="btn small" id="reset">↺</button>' +
      '<label class="speed" title="Vitesse"><span>🐢</span><input type="range" id="speed" min="0" max="4" step="1" value="2"><span>🐇</span></label>' +
      (free ? '<span class="us-slots" id="slots"></span>' : '<button class="btn small" id="hint">💡 Indice</button><button class="btn small" id="sol" title="Pour les adultes">👀 Solution</button>') +
      '<button class="btn small" id="clear">🗑 Tout enlever</button><span id="toast" class="lg-toast"></span></div></div></div></section>';

    if (robot) {
      var env = { vars: [], procs: [] }, tbDef = TB.buildToolbox(lv.tools, env);
      cur.ws = Blockly.inject('blockly', {
        toolbox: tbDef, media: 'vendor/media/', trashcan: true, sounds: false,
        zoom: { controls: true, wheel: true, startScale: TB.pickScale(tbDef), minScale: 0.5, maxScale: 2, scaleSpeed: 1.2 },
        theme: App.blocklyTheme(), grid: { spacing: 25, length: 3, colour: App.isDark() ? '#2b374f' : '#e3e9f1', snap: true }, renderer: 'geras'
      });
      TB.loadXml(cur.ws, startXml());
      cur.ws.addChangeListener(function (ev) { if (!ev.isUiEvent) { renderSteps(); } });
    }
    cur.onResize = fit;
    window.addEventListener('resize', cur.onResize);
    $('#usc').addEventListener('click', onBoardClick);
    $('#tray').addEventListener('click', onTrayClick);
    $('#play').onclick = play;
    $('#pause').onclick = function () { cur.paused = !cur.paused; $('#pause').textContent = cur.paused ? '▶' : '⏸'; if (!cur.paused && cur.playing) loop(); };
    $('#stepb').onclick = function () { if (!cur.run) return; cur.paused = true; $('#pause').textContent = '▶'; cur.frame = Math.min(cur.run.trace.length - 1, cur.frame + 8); draw(); };
    $('#reset').onclick = function () { stopRun(); draw(); toast('', ''); };
    $('#speed').oninput = function (e) { cur.speed = SPEEDS[Number(e.target.value)]; };
    $('#clear').onclick = function () { stopRun(); cur.pl = []; renderTray(); draw(); renderSteps(); };
    if (free) { renderSlots(); }
    else {
      $('#hint').onclick = function () { cur.hint = true; toast('💡 ' + lv.hint, 'hint'); };
      $('#sol').onclick = function () {
        if (!confirm('Afficher la solution ? (Pour les adultes.)')) return;
        cur.hint = true; stopRun();
        if (lv.sol) cur.pl = lv.sol.map(function (a) { return { p: a[0], x: a[1], y: a[2], r: a[3] }; });
        if (robot && lv.robotSol) { cur.ws.clear(); TB.loadXml(cur.ws, TB.dslToXml(lv.robotSol)); App.placeStartBlock(cur.ws); }
        renderTray(); draw(); renderSteps(); toast('Voici une solution. Touche ▶ Lancer pour la voir marcher.', 'hint');
      };
    }
    renderTray(); renderSteps(); fit(); setTimeout(fit, 80); setTimeout(fit, 400);
    cur.sim0 = new EN.Sim(simLevel(), cur.pl); draw();
  }

  function simLevel() {
    var lv = cur.lv;
    if (!cur.free) return lv;
    return lv;
  }
  function toast(t, kind) { var m = $('#toast'); if (!m) return; m.className = 'lg-toast ' + (kind || ''); m.innerHTML = t; }

  /* ---------- tailles ---------- */
  function fit() {
    if (!cur) return;
    document.documentElement.style.setProperty('--top', $('#topbar').offsetHeight + 'px');
    var b = $('#usboard'), c = $('#usc'); if (!b || !c) return;
    var w = b.clientWidth, h = b.clientHeight, s = Math.min(w, h * CW / CHT);
    c.style.width = Math.max(200, s) + 'px'; c.style.height = Math.max(133, s * CHT / CW) + 'px';
    if (cur.ws) { Blockly.svgResize(cur.ws); App.placeStartBlock(cur.ws); }
  }

  /* ---------- plateau de pièces ---------- */
  function renderTray() {
    if (!cur) return;
    var lv = cur.lv, keys = allowed(lv), html = '';
    keys.forEach(function (k) {
      var d = PARTS[k], left = cur.free ? null : lv.parts[k] - countOf(cur.pl, k);
      html += '<button class="us-chip' + (cur.tool === k ? ' on' : '') + (left === 0 ? ' empty' : '') + '" data-tool="' + k + '" style="--c:' + d.color + '" title="' + esc(d.about) + '"><i>' + d.icon + '</i><span>' + d.name + (left !== null ? ' ×' + left : '') + '</span></button>';
    });
    if (keys.length) html += '<button class="us-chip erase' + (cur.tool === 'erase' ? ' on' : '') + '" data-tool="erase" style="--c:#90a4ae"><i>🧽</i><span>Gomme</span></button>';
    $('#tray').innerHTML = html || '<span class="us-note">Ce niveau se joue avec les blocs de Brickbot.</span>';
  }
  function onTrayClick(e) {
    var t = e.target.closest('[data-tool]'); if (!t || !cur) return;
    var k = t.dataset.tool; cur.tool = cur.tool === k ? null : k; renderTray();
    toast(cur.tool && PARTS[cur.tool] ? '<b>' + PARTS[cur.tool].name + '</b> : ' + esc(PARTS[cur.tool].about) + ' Touche une case du plateau.' : (cur.tool === 'erase' ? 'Touche une pièce pour l’enlever.' : ''), 'hint');
  }

  /* cases occupées par le décor du niveau */
  function fixedAt(lv, x, y) {
    if (lv.map[y] && lv.map[y][x] !== '.') return true;
    var lists = [lv.doors, lv.lamps, lv.dispensers, lv.buttons, lv.fixedParts], i, j;
    for (i = 0; i < lists.length; i++) for (j = 0; lists[i] && j < lists[i].length; j++) if (lists[i][j].x === x && lists[i][j].y === y) return true;
    return false;
  }
  function onBoardClick(e) {
    if (!cur) return;
    var r = $('#usc').getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (cur.run) { stopRun(); }
    var lv = cur.lv, at = cur.pl.filter(function (q) { return q.x === x && q.y === y; })[0];
    if (cur.tool === 'erase') { if (at) { cur.pl.splice(cur.pl.indexOf(at), 1); App.beep([300]); } }
    else if (at) { at.r = (at.r + 1) % PARTS[at.p].rots; App.beep([520]); }
    else if (cur.tool && cur.tool !== 'erase') {
      if (fixedAt(lv, x, y) || (y === H - 1)) { toast('Cette case est occupée.', 'warn'); return; }
      if (!cur.free && countOf(cur.pl, cur.tool) >= lv.parts[cur.tool]) { toast('Plus de pièces de ce type !', 'warn'); return; }
      cur.pl.push({ p: cur.tool, x: x, y: y, r: 0 }); App.beep([440]);
    } else if (!cur.tool) { toast('Choisis d’abord une pièce dans la liste en dessous du plateau.', 'warn'); return; }
    renderTray(); renderSteps(); cur.sim0 = new EN.Sim(simLevel(), cur.pl); draw();
  }

  function renderSteps() {
    var el = $('#steps'); if (!el || !cur) return;
    var lv = cur.lv, chips = '', n, d, unit;
    if (cur.free) { el.style.display = 'none'; return; }
    el.style.display = '';
    if (cur.robot) { n = lv.robotSol ? TB.dslCount(lv.robotSol) : 1; d = Math.min(n, TB.countBlocks(cur.ws)); unit = 'blocs pour Brickbot' + (lv.sol ? ' + ' + lv.sol.length + ' pièces' : ''); }
    else { n = lv.sol.length; d = Math.min(n, cur.pl.length); unit = 'pièces à poser'; }
    for (var i = 0; i < n; i++) chips += '<i class="chip ' + (i < d ? 'on' : '') + '"></i>';
    el.innerHTML = '<span class="ms-title">🪜 Typiquement <b>' + n + '</b> étape' + (n > 1 ? 's' : '') + ' <em>(' + unit + ')</em></span><span class="ms-bar">' + chips + '</span><span class="ms-count">' + d + ' / ' + n + '</span>';
    var ctr = $('#counter');
    if (ctr && cur.robot) { var bl = TB.countBlocks(cur.ws); ctr.textContent = 'Blocs : ' + bl + (lv.limit ? ' / ' + (TB.dslCount(lv.robotSol) + 1) : ''); ctr.className = 'counter' + (lv.limit && bl > TB.dslCount(lv.robotSol) + 1 ? ' over' : ''); }
  }

  /* ---------- lecture de la simulation ---------- */
  function stopRun() {
    if (!cur) return;
    cancelAnimationFrame(cur.raf); cur.playing = false; cur.paused = false; cur.run = null; cur.frame = 0;
    if (cur.ws) try { cur.ws.highlightBlock(null); } catch (e) { /* ignoré */ }
    var pb = $('#pause'), sb = $('#stepb'), pl = $('#play'); if (pb) { pb.disabled = true; pb.textContent = '⏸'; } if (sb) sb.disabled = true; if (pl) pl.disabled = false;
    cur.sim0 = new EN.Sim(simLevel(), cur.pl);
  }

  function play() {
    if (!cur) return;
    var lv = cur.lv, code = null;
    stopRun(); toast('', '');
    if (cur.robot) {
      try { code = TB.generateCode(cur.ws, true); } catch (e) { toast('Impossible de lire les blocs.', 'warn'); return; }
    }
    cur.hl = [];
    var res = EN.run(lv, cur.pl, code);
    cur.run = res; cur.frame = 0; cur.playing = true; cur.paused = false; cur.hlIdx = 0;
    cur.hl = res.events.filter(function (e) { return e.type === 'hl'; });
    $('#play').disabled = true; $('#pause').disabled = false; $('#stepb').disabled = false;
    App.beep([440]);
    cur.last = performance.now(); loop();
  }
  function loop() {
    cancelAnimationFrame(cur.raf);
    cur.raf = requestAnimationFrame(function tick(now) {
      if (!cur || !cur.playing || cur.paused) return;
      var dt = Math.min(0.1, (now - cur.last) / 1000); cur.last = now;
      cur.frame += dt * 60 * cur.speed;
      var last = cur.run.trace.length - 1;
      if (cur.frame >= last) { cur.frame = last; draw(); finish(); return; }
      draw();
      cur.raf = requestAnimationFrame(tick);
    });
    cur.last = performance.now();
  }

  function finish() {
    var res = cur.run, lv = cur.lv;
    cur.playing = false;
    var pl = $('#play'); if (pl) pl.disabled = false;
    if (cur.ws) try { cur.ws.highlightBlock(null); } catch (e) { /* ignoré */ }
    if (cur.free) { toast('Machine terminée : <b>' + res.inBucket + '</b> bille(s) dans un seau, ' + res.lost + ' perdue(s). Modifie et relance !', 'hint'); App.beep([523]); return; }
    if (res.err === 'long') { toast('Le programme de Brickbot dure trop longtemps ou ne s’arrête pas.', 'warn'); App.beep([220]); return; }
    if (!res.ok) {
      var g = lv.goal, why = [];
      if (g.n) why.push('<b>' + res.inBucket + ' / ' + g.n + '</b> bille(s) au seau' + (res.lost ? ' (' + res.lost + ' perdue' + (res.lost > 1 ? 's' : '') + ')' : ''));
      if (g.lamp) why.push('la lampe ne s’est pas allumée');
      if (g.exit && !res.sim.exitReached) why.push('Brickbot n’est pas arrivé à la sortie');
      toast('Pas encore : ' + why.join(', ') + '. Change ta machine et relance !', 'warn'); App.beep([220]); return;
    }
    if (cur.robot) {
      var used = {}; cur.ws.getAllBlocks(false).forEach(function (b) { used[b.type] = true; });
      var NAMES = { controls_repeat_ext: 'répéter', rob_press: 'appuyer sur le bouton', rob_turn: 'faire demi-tour', lab_until: 'répéter jusqu’à l’arrivée', rob_ifelse: 'si… sinon' };
      var miss = (lv.require || []).filter(function (t) { return !used[t]; });
      if (miss.length) { toast('Réussi, mais ce niveau demande d’utiliser : <b>' + miss.map(function (t) { return NAMES[t] || t; }).join('</b>, <b>') + '</b>.', 'warn'); App.beep([330]); return; }
      var blocks = TB.countBlocks(cur.ws), par = TB.dslCount(lv.robotSol);
      if (lv.limit && blocks > par + 1) { toast('Réussi, mais avec ' + blocks + ' blocs : essaie avec ' + (par + 1) + ' blocs au maximum.', 'warn'); App.beep([330]); return; }
    }
    succeed();
  }

  function succeed() {
    var lv = cur.lv, p = App.profile(), before = App.allPoints(p), rb = App.rankInfo(before);
    var good = true;
    if (cur.robot) good = TB.countBlocks(cur.ws) <= TB.dslCount(lv.robotSol);
    if (lv.sol) good = good && cur.pl.length <= lv.sol.length;
    var pts = (good ? 15 : 10) - (cur.hint ? 5 : 0), prev = done(p)[lv.id];
    if (!prev || pts > prev.pts) done(p)[lv.id] = { pts: pts, ts: Date.now() };
    App.save();
    var after = App.allPoints(p), ra = App.rankInfo(after), gained = after - before, next = LV.LEVELS[lv.index + 1];
    App.renderHeader('niveau', 'usine'); App.beep([523, 659, 784, 1047]); App.confetti();
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay"><div class="dialog"><div class="big">' + (good ? '⭐⭐' : '⭐') + '</div><h2>Machine réussie !</h2><div class="pts">' + (gained > 0 ? '+' + gained + ' points' : 'Déjà réussie') + '</div>' +
      (good ? '' : '<p class="small">Avec moins de pièces ou de blocs, tu gagnes une 2ᵉ étoile et 5 points en plus !</p>') +
      '<div class="rank"><b>' + ra.name + '</b> · ' + after + ' pts<div class="rankbar"><i style="width:' + ra.pct + '%"></i></div></div>' +
      (ra.idx > rb.idx ? '<p><b>⬆ Nouveau rang : ' + ra.name + ' !</b></p>' : '') +
      '<div class="row"><button class="btn" id="m-close">Rester ici</button><a class="btn" href="#/usine" id="m-list">Niveaux</a>' +
      (next ? '<a class="btn primary" href="#/usine/niveau/' + next.id + '" id="m-next">Niveau suivant →</a>' : '<a class="btn primary" href="#/usine/libre" id="m-next">🛠️ Atelier libre</a>') + '</div></div></div>';
    var close = function () { root.innerHTML = ''; };
    $('#m-close').onclick = close; $('#m-list').addEventListener('click', close); $('#m-next').addEventListener('click', close);
  }

  /* ---------- atelier libre : sauvegardes ---------- */
  function renderSlots() {
    var el = $('#slots'), p = App.profile(); if (!el) return;
    el.innerHTML = [0, 1, 2].map(function (i) {
      var s = p.usine.free[i];
      return '<span class="slot3"><button class="btn small" data-save="' + i + '" title="Sauvegarder ici">💾 ' + (i + 1) + '</button>' +
        '<button class="btn small" data-load="' + i + '"' + (s ? '' : ' disabled') + ' title="Ouvrir">📂</button></span>';
    }).join('');
    el.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.save !== undefined) { p.usine.free[Number(b.dataset.save)] = cur.pl.map(function (q) { return { p: q.p, x: q.x, y: q.y, r: q.r }; }); App.save(); renderSlots(); toast('Invention ' + (Number(b.dataset.save) + 1) + ' sauvegardée !', 'hint'); }
      else if (b.dataset.load !== undefined) { var s = p.usine.free[Number(b.dataset.load)]; if (s) { stopRun(); cur.pl = s.map(function (q) { return { p: q.p, x: q.x, y: q.y, r: q.r }; }); renderTray(); cur.sim0 = new EN.Sim(simLevel(), cur.pl); draw(); toast('Invention ouverte.', 'hint'); } }
    };
  }

  /* ---------- dessin ---------- */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function studs(c, x, y, w, h, color, n) {
    var k, j; c.fillStyle = color; c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5;
    for (k = 0; k < n; k++) for (j = 0; j < n; j++) { c.beginPath(); c.arc(x + w * (k + 0.5) / n, y + h * (j + 0.5) / n, w / (n * 5), 0, 7); c.fill(); c.stroke(); }
  }
  function colorOf(cond) { var m = /"(rouge|bleu|vert|jaune)"/.exec(JSON.stringify(cond || {})); return m ? CHEX[m[1]] : '#9e9e9e'; }
  function drawScene(c, sim, fr, tt) {
    var dark = App.isDark(), x, y, i, cell;
    c.clearRect(0, 0, CW, CHT);
    var g = c.createLinearGradient(0, 0, 0, CHT); g.addColorStop(0, dark ? '#243a50' : '#bfe0fb'); g.addColorStop(1, dark ? '#16273a' : '#9cc9ee');
    c.fillStyle = g; c.fillRect(0, 0, CW, CHT);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { c.fillStyle = dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x * CS + CS / 2, y * CS + CS / 2, 3, 0, 7); c.fill(); }
    // pièces solides
    for (i = 0; i < W * H; i++) {
      cell = sim.cells[i]; if (!cell) continue;
      x = i % W; y = (i / W) | 0;
      var px = x * CS, py = y * CS, d = PARTS[cell.kind] || PARTS.wall;
      if (cell.kind === 'wall') {
        rr(c, px + 2, py + 2, CS - 4, CS - 4, 8); c.fillStyle = y === H - 1 ? '#4e6b52' : '#5f7d90'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; c.stroke();
        studs(c, px + 4, py + 4, CS - 8, CS - 8, y === H - 1 ? '#6a8a6e' : '#7c9bb0', 2);
      } else if (cell.kind === 'ramp') {
        var poly = EN.polyFor('ramp', cell.rot, x, y); c.beginPath(); poly.forEach(function (q, k) { if (k) c.lineTo(q.x * CS, q.y * CS); else c.moveTo(q.x * CS, q.y * CS); }); c.closePath();
        c.fillStyle = d.color; c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
        var cx = (poly[0].x + poly[1].x + poly[2].x) / 3 * CS, cy = (poly[0].y + poly[1].y + poly[2].y) / 3 * CS;
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(cx, cy, 6, 0, 7); c.fill();
      } else if (cell.kind === 'belt') {
        rr(c, px + 2, py + 12, CS - 4, CS - 24, 12); c.fillStyle = '#37474f'; c.fill(); c.save(); c.clip();
        var dir = cell.rot % 2 === 0 ? 1 : -1, off = (tt * 40 * dir) % 27;
        c.strokeStyle = '#ffd54f'; c.lineWidth = 5; c.lineCap = 'round';
        for (var k = -1; k < 5; k++) { var bx = px + k * 27 + off; c.beginPath(); c.moveTo(bx - 6 * dir, py + 26); c.lineTo(bx + 4 * dir, py + CS / 2); c.lineTo(bx - 6 * dir, py + CS - 26); c.stroke(); }
        c.restore(); rr(c, px + 2, py + 12, CS - 4, CS - 24, 12); c.strokeStyle = '#263238'; c.lineWidth = 3; c.stroke();
      } else if (cell.kind === 'spring') {
        rr(c, px + 4, py + 4, CS - 8, CS - 8, 10); c.fillStyle = '#e53935'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(px + 16, py + 22); for (var z = 0; z < 5; z++) c.lineTo(px + (z % 2 ? 16 : CS - 16), py + 22 + z * 9); c.stroke();
      } else if (cell.kind === 'bumper') {
        c.beginPath(); c.arc(px + CS / 2, py + CS / 2, CS * 0.42, 0, 7); c.fillStyle = '#8e24aa'; c.fill(); c.strokeStyle = '#ffd54f'; c.lineWidth = 5; c.stroke();
        c.beginPath(); c.arc(px + CS / 2 - 8, py + CS / 2 - 8, 9, 0, 7); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
      } else if (cell.kind === 'fan') {
        rr(c, px + 4, py + 4, CS - 8, CS - 8, 12); c.fillStyle = '#00acc1'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; c.stroke();
        c.save(); c.translate(px + CS / 2, py + CS / 2); c.rotate(tt * 12); c.fillStyle = '#e0f7fa';
        for (var b = 0; b < 3; b++) { c.rotate(Math.PI * 2 / 3); c.beginPath(); c.ellipse(0, -16, 7, 15, 0, 0, 7); c.fill(); } c.restore();
        var dd = [[0, -1], [1, 0], [0, 1], [-1, 0]][cell.rot % 4]; c.fillStyle = '#fff'; c.beginPath(); c.arc(px + CS / 2 + dd[0] * 30, py + CS / 2 + dd[1] * 30, 6, 0, 7); c.fill();
      } else if (cell.kind === 'magnet') {
        rr(c, px + 4, py + 4, CS - 8, CS - 8, 12); c.fillStyle = '#546e7a'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,.3)'; c.stroke();
        c.lineWidth = 13; c.lineCap = 'butt'; c.strokeStyle = '#d81b60'; c.beginPath(); c.arc(px + CS / 2, py + CS / 2 + 4, 17, Math.PI, 0); c.stroke();
        c.fillStyle = '#fff'; c.fillRect(px + CS / 2 - 24, py + CS / 2 + 3, 13, 12); c.fillRect(px + CS / 2 + 11, py + CS / 2 + 3, 13, 12);
      }
    }
    // boutons, seaux, distributeurs, sortie
    (sim.level.buttons || []).forEach(function (b) { rr(c, b.x * CS + 12, b.y * CS + CS - 22, CS - 24, 14, 6); c.fillStyle = CHEX[b.ch]; c.fill(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; c.stroke(); });
    if (sim.exit) { c.font = '52px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚪', sim.exit.x * CS + CS / 2, sim.exit.y * CS + CS / 2 + 3); }
    sim.buckets.forEach(function (b, bi) {
      var bx = b.x * CS, by = b.y * CS, cnt = fr ? (fr.b[bi] || 0) : 0;
      c.beginPath(); c.moveTo(bx + 8, by + 18); c.lineTo(bx + CS - 8, by + 18); c.lineTo(bx + CS - 18, by + CS - 6); c.lineTo(bx + 18, by + CS - 6); c.closePath();
      c.fillStyle = 'rgba(46,125,50,.35)'; c.fill(); c.strokeStyle = '#2e7d32'; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke();
      for (var k = 0; k < cnt && k < 6; k++) { c.beginPath(); c.arc(bx + 26 + (k % 3) * 14, by + CS - 18 - ((k / 3) | 0) * 13, 6, 0, 7); c.fillStyle = '#cfd8dc'; c.fill(); }
    });
    sim.disp.forEach(function (d) {
      var dx = d.x * CS, dy = d.y * CS;
      c.beginPath(); c.moveTo(dx + 8, dy + 8); c.lineTo(dx + CS - 8, dy + 8); c.lineTo(dx + CS - 24, dy + CS - 10); c.lineTo(dx + 24, dy + CS - 10); c.closePath();
      c.fillStyle = '#1e88e5'; c.fill(); c.strokeStyle = '#0d47a1'; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
      c.fillStyle = '#fff'; c.font = '800 24px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.ch ? '⏻' : d.n, dx + CS / 2, dy + CS / 2 - 4);
      if (d.ch) { c.fillStyle = CHEX[d.ch]; c.beginPath(); c.arc(dx + CS - 14, dy + 14, 7, 0, 7); c.fill(); }
    });
    // portes
    sim.doors.forEach(function (d, i) {
      var open = fr ? fr.d[i] : 0, dx = d.x * CS, dy = d.y * CS, col = d.color ? CHEX[d.color] : colorOf(d.cond);
      if (open) { c.setLineDash([6, 6]); c.strokeStyle = col; c.lineWidth = 3; rr(c, dx + 6, dy + 2, CS - 12, CS - 4, 6); c.stroke(); c.setLineDash([]); }
      else { rr(c, dx + 6, dy + 2, CS - 12, CS - 4, 6); c.fillStyle = '#6d4c41'; c.fill(); c.strokeStyle = col; c.lineWidth = 6; c.stroke(); c.fillStyle = col; c.fillRect(dx + CS / 2 - 4, dy + 8, 8, CS - 16); }
    });
    sim.lamps.forEach(function (l, i) {
      var on = fr ? fr.l[i] : 0, lx = l.x * CS + CS / 2, ly = l.y * CS + CS / 2;
      if (on) { c.beginPath(); c.arc(lx, ly, 36, 0, 7); c.fillStyle = 'rgba(255,235,59,.35)'; c.fill(); }
      c.beginPath(); c.arc(lx, ly, 22, 0, 7); c.fillStyle = on ? '#fff176' : '#455a64'; c.fill(); c.strokeStyle = colorOf(l.cond); c.lineWidth = 5; c.stroke();
    });
    sim.sensors.forEach(function (s, i) {
      var hit = fr ? fr.s[i] : 0, sx = s.x * CS + CS / 2, sy = s.y * CS + CS / 2;
      c.beginPath(); c.arc(sx, sy, 24, 0, 7); c.fillStyle = hit ? CHEX[s.ch] : 'rgba(255,255,255,.35)'; c.fill(); c.strokeStyle = CHEX[s.ch]; c.lineWidth = 6; c.stroke();
      c.beginPath(); c.arc(sx, sy, 6, 0, 7); c.fillStyle = '#263238'; c.fill();
    });
    // robot
    if (sim.robot) {
      var rb = fr && fr.r ? fr.r : { x: sim.robot.x, dir: sim.robot.dir, act: '' }, rx = rb.x * CS + CS / 2, ry = sim.robot.y * CS + CS / 2, bob = rb.act === 'walk' ? Math.sin(tt * 18) * 3 : 0;
      c.save(); c.translate(rx, ry + bob);
      c.fillStyle = '#37474f'; c.fillRect(-14, 14, 11, 18); c.fillRect(3, 14, 11, 18);
      rr(c, -20, -8, 40, 26, 6); c.fillStyle = '#e53935'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffca28'; c.fillRect(-26, -4, 8, 16); c.fillRect(18, -4, 8, 16);
      rr(c, -15, -34, 30, 28, 8); c.fillStyle = '#ffd54f'; c.fill(); c.stroke();
      c.fillStyle = '#263238'; c.beginPath(); c.arc(rb.dir * 5 - 5, -22, 3, 0, 7); c.arc(rb.dir * 5 + 5, -22, 3, 0, 7); c.fill();
      c.fillStyle = '#90a4ae'; c.fillRect(-2, -40, 4, 7);
      if (rb.act === 'press') { c.fillStyle = 'rgba(255,235,59,.7)'; c.beginPath(); c.arc(0, 30, 16, 0, 7); c.fill(); }
      c.restore();
    }
    // billes
    if (fr) {
      for (i = 0; i < fr.m.length; i += 2) {
        if (fr.m[i] === null) continue;
        var mx = fr.m[i] * CS, my = fr.m[i + 1] * CS, rg = c.createRadialGradient(mx - 6, my - 6, 2, mx, my, EN_R * CS);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.45, '#90caf9'); rg.addColorStop(1, '#1565c0');
        c.beginPath(); c.arc(mx, my, EN_R * CS, 0, 7); c.fillStyle = rg; c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.stroke();
      }
    }
  }
  var EN_R = 0.28;

  function draw() {
    if (!cur) return;
    var cv = $('#usc'); if (!cv) return;
    var c = cv.getContext('2d'), fr = null, sim = cur.sim0;
    if (cur.run) { sim = cur.run.sim; fr = cur.run.trace[Math.min(cur.run.trace.length - 1, Math.floor(cur.frame))]; }
    drawScene(c, sim, fr, performance.now() / 1000);
    if (cur.ws && cur.run && cur.hl) {   // surligne le bloc en cours d'exécution
      var f = Math.floor(cur.frame), idx = cur.hlIdx;
      while (idx + 1 < cur.hl.length && cur.hl[idx + 1].frame <= f) idx++;
      if (cur.hl.length && cur.hl[idx].frame <= f) { cur.hlIdx = idx; try { cur.ws.highlightBlock(cur.hl[idx].id); } catch (e) { /* ignoré */ } }
    }
  }
  /* petite animation en attente (tapis, ventilateurs) */
  setInterval(function () { if (cur && !cur.playing) draw(); }, 80);

  /* ---------- tests automatiques ---------- */
  function tests() {
    var rows = '', fails = 0;
    LV.LEVELS.forEach(function (lv) {
      var ok = true, why = [], pl = [], code = null;
      try {
        if (lv.sol) pl = lv.sol.map(function (a) { return { p: a[0], x: a[1], y: a[2], r: a[3] }; });
        pl.forEach(function (q) { if (!lv.parts[q.p]) { ok = false; why.push('pièce ' + q.p + ' non fournie'); } });
        Object.keys(lv.parts || {}).forEach(function (k) { if (countOf(pl, k) > lv.parts[k]) { ok = false; why.push('trop de ' + k); } });
        if (lv.kind === 'robot') {
          TB.useLevel(null);
          var ws = new Blockly.Workspace(); TB.loadXml(ws, TB.dslToXml(lv.robotSol)); code = TB.generateCode(ws, true);
          var used = {}; ws.getAllBlocks(false).forEach(function (b) { used[b.type] = true; });
          (lv.require || []).forEach(function (t) { if (!used[t]) { ok = false; why.push('manque ' + t); } });
          if (TB.countBlocks(ws) !== TB.dslCount(lv.robotSol)) { ok = false; why.push('nombre de blocs'); }
          ws.dispose();
        }
        var r1 = EN.run(lv, pl, code), r2 = EN.run(lv, pl, code);
        if (!r1.ok) { ok = false; why.push('solution refusée (' + r1.inBucket + ' billes' + (r1.err ? ', ' + r1.err : '') + ')'); }
        if (r1.trace.length !== r2.trace.length || JSON.stringify(r1.trace[r1.trace.length - 1]) !== JSON.stringify(r2.trace[r2.trace.length - 1])) { ok = false; why.push('simulation non déterministe'); }
        var r0 = EN.run(lv, [], lv.kind === 'robot' ? '' : null);
        if (r0.ok) { ok = false; why.push('machine vide acceptée'); }
        if (lv.kind === 'robot' && lv.sol === undefined) { /* niveaux sans pièces */ }
      } catch (e) { ok = false; why.push('ERREUR ' + e.message); }
      if (!ok) fails++;
      rows += '<tr><td>' + lv.id + '</td><td>' + esc(lv.title) + '</td><td class="' + (ok ? 'okc' : 'koc') + '">' + (ok ? 'OK' : 'ÉCHEC') + '</td><td>' + esc(ok ? lv.kind + ', ' + (pl.length) + ' pièce(s)' : why.join(' ; ')) + '</td></tr>';
    });
    return { title: 'Usine à machines (' + LV.LEVELS.length + ' niveaux)', rows: rows, fails: fails };
  }

  App.registerRoute(/^#\/usine$/, viewList);
  App.registerRoute(/^#\/usine\/niveau\/(\d-\d)$/, function (m) { viewLevel(m[1]); });
  App.registerRoute(/^#\/usine\/libre$/, function () { viewLevel('libre'); });
  App.registerDispose(dispose);
  App.registerPoints(points);
  App.registerTests(tests);
  App.registerActivity({
    id: 'usine', href: '#/usine', icon: '🏭', title: 'Usine à machines',
    desc: 'Construis des machines avec des briques et programme le robot Brickbot.',
    progress: function (p) { return { done: LV.LEVELS.filter(function (l) { return p.usine.done[l.id]; }).length, total: LV.LEVELS.length, points: points(p) }; }
  });
})();
