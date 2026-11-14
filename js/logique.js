/* Labo Code — Atelier de logique : interrupteurs, portes, circuits et binaire.
   On part d'une brique « NON-ET » et on construit tout, jusqu'à un additionneur. Tout est original. */
(function () {
  'use strict';
  var App = window.App, $ = App.$, esc = App.esc;

  /* ---------- les briques (portes logiques) ---------- */
  var PARTS = {
    NAND: { name: 'NON-ET', short: 'NON-ET', n: 2, outs: ['sortie'], color: '#ef5350', sym: '⊼', f: function (a) { return [1 - (a[0] & a[1])]; },
      about: 'Allumée sauf si les deux entrées sont allumées.' },
    NOT: { name: 'NON', short: 'NON', n: 1, outs: ['sortie'], color: '#ff9800', sym: '¬', f: function (a) { return [1 - a[0]]; },
      about: 'Inverse : allumée quand l’entrée est éteinte.' },
    AND: { name: 'ET', short: 'ET', n: 2, outs: ['sortie'], color: '#42a5f5', sym: '&', f: function (a) { return [a[0] & a[1]]; },
      about: 'Allumée seulement si les deux entrées sont allumées.' },
    OR: { name: 'OU', short: 'OU', n: 2, outs: ['sortie'], color: '#66bb6a', sym: '≥1', f: function (a) { return [a[0] | a[1]]; },
      about: 'Allumée si au moins une entrée est allumée.' },
    XOR: { name: 'OU exclusif', short: 'OU-EX', n: 2, outs: ['sortie'], color: '#ab47bc', sym: '=1', f: function (a) { return [a[0] ^ a[1]]; },
      about: 'Allumée si les deux entrées sont différentes.' },
    DEMI: { name: 'Demi-additionneur', short: 'DEMI', n: 2, outs: ['somme', 'retenue'], color: '#fdd835', sym: '½+', f: function (a) { return [a[0] ^ a[1], a[0] & a[1]]; },
      about: 'Additionne deux bits : une somme et une retenue.' },
    COMPLET: { name: 'Additionneur complet', short: 'COMPLET', n: 3, outs: ['somme', 'retenue'], color: '#26a69a', sym: 'Σ', f: function (a) { var s = a[0] + a[1] + a[2]; return [s & 1, s >> 1]; },
      about: 'Additionne trois bits (avec la retenue qui arrive).' }
  };
  var ORDER = ['NAND', 'NOT', 'AND', 'OR', 'XOR', 'DEMI', 'COMPLET'];

  function IN(id, label, icon) { return { id: id, label: label || id, icon: icon || '' }; }
  var A = IN('A', 'A', '🔘'), B = IN('B', 'B', '🔘'), C = IN('C', 'C', '🔘'), S = IN('S', 'Lampe', '💡');

  /* ---------- les niveaux ---------- */
  var CHAPTERS = [
    { n: 1, icon: '🔘', name: 'Interrupteurs et lampes', desc: 'Joue avec les interrupteurs et devine ce que cache chaque boîte mystère.' },
    { n: 2, icon: '📋', name: 'Les tables de vérité', desc: 'Note ce que fait une porte pour toutes les positions des interrupteurs.' },
    { n: 3, icon: '🧱', name: 'La brique magique', desc: 'Comme avec une seule sorte de brique LEGO : avec la brique NON-ET, on peut tout construire !' },
    { n: 4, icon: '➕', name: 'Calculer en binaire', desc: 'Construis une machine qui additionne des nombres, avec des 0 et des 1.' },
    { n: 5, icon: '🏆', name: 'Défis d’inventeur', desc: 'Un coffre, une alarme, un vote : invente tes propres circuits.' }
  ];
  function ex(id, title, gate, ins, options, text, hint) {
    return { id: id, ch: 1, kind: 'explore', title: title, gate: gate, inputs: ins, outputs: [S], options: options, text: text, hint: hint };
  }
  function tb(id, title, gate, ins, text, hint) {
    return { id: id, ch: 2, kind: 'table', title: title, gate: gate, inputs: ins, outputs: [S], text: text, hint: hint };
  }
  function bd(id, ch, title, o) {
    o.id = id; o.ch = ch; o.title = title; o.kind = 'build'; return o;
  }
  var LEVELS = [
    ex('1-1', 'Boîte mystère n°1', 'NOT', [A], ['NOT', 'AND', 'OR'], 'Allume et éteins l’interrupteur. Que fait la lampe ? Trouve la porte cachée.', 'Quand l’interrupteur est allumé, la lampe est… ? Et quand il est éteint ?'),
    ex('1-2', 'Boîte mystère n°2', 'AND', [A, B], ['AND', 'OR', 'NAND'], 'Deux interrupteurs. Essaie toutes les positions !', 'La lampe ne s’allume que dans UN seul cas. Lequel ?'),
    ex('1-3', 'Boîte mystère n°3', 'OR', [A, B], ['AND', 'OR', 'XOR'], 'Encore deux interrupteurs. Quelle est la différence avec la boîte précédente ?', 'La lampe est éteinte dans un seul cas : quand les deux interrupteurs sont éteints.'),
    ex('1-4', 'Boîte mystère n°4', 'XOR', [A, B], ['OR', 'XOR', 'AND'], 'Attention, celle-ci est plus maligne !', 'Regarde ce qui se passe quand les DEUX interrupteurs sont allumés.'),
    ex('1-5', 'La brique NON-ET', 'NAND', [A, B], ['AND', 'NAND', 'OR'], 'Voici la brique magique du chapitre 3. Que fait-elle ?', 'Elle fait exactement le contraire de la porte ET.'),
    tb('2-1', 'La porte NON', 'NOT', [A], 'Complète la table : touche chaque case de la colonne « Lampe » pour la mettre à 0 ou 1.', 'NON inverse : 0 devient 1, et 1 devient 0.'),
    tb('2-2', 'La porte ET', 'AND', [A, B], 'Complète la table de la porte ET.', 'Un seul 1 dans la colonne de la lampe : quand les deux interrupteurs sont à 1.'),
    tb('2-3', 'La porte OU exclusif', 'XOR', [A, B], 'Complète la table de la porte OU exclusif.', 'La lampe est à 1 quand les deux interrupteurs sont différents.'),
    bd('3-1', 3, 'Fabrique la porte NON', {
      inputs: [A], outputs: [S], parts: ['NAND'], max: 1, f: function (v) { return [1 - v[0]]; }, unlock: 'NOT',
      text: 'Avec une seule brique NON-ET, fabrique une porte NON. Astuce : brancher les deux entrées au même endroit !',
      hint: 'Mets une brique NON-ET et branche l’interrupteur A sur ses DEUX entrées. Puis branche la lampe sur sa sortie.',
      sol: { parts: [['NAND', 'A', 'A']], outs: ['p1'] }
    }),
    bd('3-2', 3, 'Fabrique la porte ET', {
      inputs: [A, B], outputs: [S], parts: ['NAND', 'NOT'], max: 2, f: function (v) { return [v[0] & v[1]]; }, unlock: 'AND',
      text: 'Fabrique la porte ET avec la brique NON-ET et la brique NON que tu viens de créer.',
      hint: 'ET = le contraire de NON-ET. Mets d’abord NON-ET(A, B), puis un NON derrière.',
      sol: { parts: [['NAND', 'A', 'B'], ['NOT', 'p1']], outs: ['p2'] }
    }),
    bd('3-3', 3, 'Fabrique la porte OU', {
      inputs: [A, B], outputs: [S], parts: ['NAND', 'NOT'], max: 3, f: function (v) { return [v[0] | v[1]]; }, unlock: 'OR',
      text: 'Fabrique la porte OU avec seulement NON-ET et NON.',
      hint: 'Inverse d’abord A et B avec deux briques NON, puis passe-les dans une brique NON-ET.',
      sol: { parts: [['NOT', 'A'], ['NOT', 'B'], ['NAND', 'p1', 'p2']], outs: ['p3'] }
    }),
    bd('3-4', 3, 'Fabrique le OU exclusif', {
      inputs: [A, B], outputs: [S], parts: ['NAND', 'AND', 'OR'], max: 3, f: function (v) { return [v[0] ^ v[1]]; }, unlock: 'XOR',
      text: 'Le OU exclusif est allumé quand les deux interrupteurs sont différents. Fabrique-le avec NON-ET, ET et OU.',
      hint: 'XOR = (A OU B) ET (A NON-ET B). Trois briques suffisent.',
      sol: { parts: [['OR', 'A', 'B'], ['NAND', 'A', 'B'], ['AND', 'p1', 'p2']], outs: ['p3'] }
    }),
    bd('4-1', 4, 'Le demi-additionneur', {
      inputs: [A, B], outputs: [IN('S', 'Somme', '💡'), IN('R', 'Retenue', '🔦')], parts: ['AND', 'XOR'], max: 2,
      f: function (v) { return [v[0] ^ v[1], v[0] & v[1]]; }, unlock: 'DEMI',
      num: [{ label: 'A', ids: ['A'] }, { label: 'B', ids: ['B'] }, { label: 'Résultat', ids: ['R', 'S'], result: true }],
      text: 'Additionne deux bits : 1 + 1 = 10 en binaire. La somme est la lampe 💡, la retenue est la lampe 🔦.',
      hint: 'La somme est un OU exclusif de A et B. La retenue est un ET de A et B.',
      sol: { parts: [['XOR', 'A', 'B'], ['AND', 'A', 'B']], outs: ['p1', 'p2'] }
    }),
    bd('4-2', 4, 'L’additionneur complet', {
      inputs: [A, B, IN('C', 'Retenue reçue', '📥')], outputs: [IN('S', 'Somme', '💡'), IN('R', 'Retenue', '🔦')], parts: ['DEMI', 'OR'], max: 3,
      f: function (v) { var s = v[0] + v[1] + v[2]; return [s & 1, s >> 1]; }, unlock: 'COMPLET',
      num: [{ label: 'A', ids: ['A'] }, { label: 'B', ids: ['B'] }, { label: 'Retenue reçue', ids: ['C'] }, { label: 'Résultat', ids: ['R', 'S'], result: true }],
      text: 'Additionne trois bits : A, B et la retenue qui arrive de la colonne d’à côté. Utilise deux demi-additionneurs !',
      hint: 'Premier DEMI sur A et B. Deuxième DEMI sur la somme du premier et sur C. La retenue finale est un OU des deux retenues.',
      sol: { parts: [['DEMI', 'A', 'B'], ['DEMI', 'p1.0', 'C'], ['OR', 'p1.1', 'p2.1']], outs: ['p2.0', 'p3'] }
    }),
    bd('4-3', 4, 'Additionne deux nombres !', {
      inputs: [IN('A1', 'A fort', '🔘'), IN('A0', 'A faible', '🔘'), IN('B1', 'B fort', '🔘'), IN('B0', 'B faible', '🔘')],
      outputs: [IN('S2', '4', '💡'), IN('S1', '2', '💡'), IN('S0', '1', '💡')], parts: ['DEMI', 'COMPLET'], max: 2,
      f: function (v) { var s = (v[0] * 2 + v[1]) + (v[2] * 2 + v[3]); return [(s >> 2) & 1, (s >> 1) & 1, s & 1]; },
      num: [{ label: 'A', ids: ['A1', 'A0'] }, { label: 'B', ids: ['B1', 'B0'] }, { label: 'A + B', ids: ['S2', 'S1', 'S0'], result: true }],
      text: 'Le grand défi : additionne deux nombres de 2 bits (de 0 à 3). Les lampes affichent le résultat en binaire (4, 2, 1).',
      hint: 'Colonne de droite : un DEMI sur A faible et B faible. Colonne de gauche : un COMPLET sur A fort, B fort et la retenue du DEMI. La retenue du COMPLET donne la lampe « 4 ».',
      sol: { parts: [['DEMI', 'A0', 'B0'], ['COMPLET', 'A1', 'B1', 'p1.1']], outs: ['p2.1', 'p2.0', 'p1.0'] }
    }),
    bd('5-1', 5, 'Le coffre-fort', {
      inputs: [IN('A', 'A', '🔘'), IN('B', 'B', '🔘'), IN('C', 'C', '🔘')], outputs: [IN('S', 'Coffre', '🔓')], parts: ['NOT', 'AND'], max: 3,
      f: function (v) { return [v[0] & (1 - v[1]) & v[2]]; },
      text: 'Le coffre s’ouvre seulement quand A est allumé, B éteint et C allumé. Invente le circuit !',
      hint: 'Il faut inverser B avec un NON. Puis un ET entre A et le B inversé, puis un deuxième ET avec C.',
      sol: { parts: [['NOT', 'B'], ['AND', 'A', 'p1'], ['AND', 'p2', 'C']], outs: ['p3'] }
    }),
    bd('5-2', 5, 'L’alarme', {
      inputs: [IN('P', 'Porte', '🚪'), IN('F', 'Fenêtre', '🪟'), IN('K', 'Clé', '🔑')], outputs: [IN('S', 'Alarme', '🚨')], parts: ['NOT', 'AND', 'OR'], max: 3,
      f: function (v) { return [(v[0] | v[1]) & (1 - v[2])]; },
      text: 'L’alarme sonne si la porte OU la fenêtre est ouverte, sauf quand la clé est tournée (alarme coupée).',
      hint: '(Porte OU Fenêtre), ET NON Clé.',
      sol: { parts: [['OR', 'P', 'F'], ['NOT', 'K'], ['AND', 'p1', 'p2']], outs: ['p3'] }
    }),
    bd('5-3', 5, 'Le vote', {
      inputs: [IN('A', 'Arthur', '🧒'), IN('B', 'Bella', '👧'), IN('C', 'Cédric', '👦')], outputs: [IN('S', 'Adopté', '✅')], parts: ['AND', 'OR'], max: 5,
      f: function (v) { return [(v[0] & v[1]) | (v[0] & v[2]) | (v[1] & v[2])]; },
      text: 'Trois amis votent. La proposition est adoptée si au moins deux amis sont d’accord (interrupteur allumé).',
      hint: 'Trois ET : A·B, A·C et B·C. Puis des OU pour les rassembler (deux briques OU).',
      sol: { parts: [['AND', 'A', 'B'], ['AND', 'A', 'C'], ['AND', 'B', 'C'], ['OR', 'p1', 'p2'], ['OR', 'p4', 'p3']], outs: ['p5'] }
    }),
    bd('5-4', 5, 'Le sélecteur', {
      inputs: [IN('A', 'Voie A', '🅰️'), IN('B', 'Voie B', '🅱️'), IN('C', 'Choix', '🎚️')], outputs: [IN('S', 'Sortie', '💡')], parts: ['NOT', 'AND', 'OR'], max: 4,
      f: function (v) { return [v[2] ? v[1] : v[0]]; },
      text: 'Quand le choix 🎚️ est éteint, la lampe suit la voie A. Quand il est allumé, elle suit la voie B.',
      hint: '(A ET NON choix) OU (B ET choix). Quatre briques.',
      sol: { parts: [['NOT', 'C'], ['AND', 'A', 'p1'], ['AND', 'B', 'C'], ['OR', 'p2', 'p3']], outs: ['p4'] }
    })
  ];
  var BY_ID = {};
  LEVELS.forEach(function (l, i) {
    l.index = i;
    BY_ID[l.id] = l;
    if (l.kind !== 'build') { l.f = function (v) { return PARTS[l.gate].f(v); }; l.max = 1; l.parts = [l.gate]; }
  });

  /* ---------- simulation ---------- */
  function norm(s) { return /^p\d+$/.test(s) ? s + '.0' : s; }
  function newState(lv) {
    var st = { parts: [], outs: lv.outputs.map(function () { return null; }), sw: {}, table: null, seen: {}, ans: null };
    lv.inputs.forEach(function (x) { st.sw[x.id] = 0; });
    if (lv.kind !== 'build') {
      st.parts = [{ type: lv.gate, ins: lv.inputs.map(function (x) { return x.id; }) }];
      st.outs = ['p1.0'];
    }
    if (lv.kind === 'table') st.table = combos(lv.inputs.length).map(function () { return null; });
    return st;
  }
  function loadSolution(lv, st) {
    st.parts = lv.sol.parts.map(function (p) { return { type: p[0], ins: p.slice(1).map(norm) }; });
    st.outs = lv.sol.outs.map(norm);
  }
  function combos(n) { var r = []; for (var i = 0; i < (1 << n); i++) { var v = []; for (var b = n - 1; b >= 0; b--) v.push((i >> b) & 1); r.push(v); } return r; }

  function evaluate(lv, st, vals) {
    var sig = {}, complete = true;
    lv.inputs.forEach(function (x, i) { sig[x.id] = vals[i]; });
    st.parts.forEach(function (p, k) {
      if (!p.type) { complete = false; return; }
      var def = PARTS[p.type], ins = [];
      for (var i = 0; i < def.n; i++) { var s = p.ins[i]; if (!s) complete = false; ins.push(s && sig[s] ? 1 : 0); }
      def.f(ins).forEach(function (v, i) { sig['p' + (k + 1) + '.' + i] = v; });
    });
    var outs = st.outs.map(function (s) { if (!s) complete = false; return s && sig[s] ? 1 : 0; });
    return { sig: sig, outs: outs, complete: complete };
  }
  function runAll(lv, st) {
    return combos(lv.inputs.length).map(function (v) {
      var e = evaluate(lv, st, v), want = lv.f(v);
      return { ins: v, want: want, got: e.outs, ok: e.outs.join() === want.join() };
    });
  }

  /* ---------- dessin du circuit (SVG) ---------- */
  var BW = 116;
  function brickH(def) { return Math.max(70, 34 + 26 * Math.max(def.n, def.outs.length)); }
  function drawBoard(lv, st, hideGate) {
    var vals = lv.inputs.map(function (x) { return st.sw[x.id] ? 1 : 0; });
    var ev = evaluate(lv, st, vals), sig = ev.sig;
    var depth = st.parts.map(function () { return 1; });
    st.parts.forEach(function (p, k) {
      var d = 1;
      (p.ins || []).forEach(function (s) { var m = s && /^p(\d+)\./.exec(s); if (m && Number(m[1]) - 1 < k) d = Math.max(d, depth[Number(m[1]) - 1] + 1); });
      depth[k] = d;
    });
    var maxD = Math.max.apply(null, [1].concat(depth));
    var colX = function (d) { return 236 + (d - 1) * 190; };
    var colCount = {}, rows = Math.max(lv.inputs.length, lv.outputs.length);
    depth.forEach(function (d) { colCount[d] = (colCount[d] || 0) + 1; rows = Math.max(rows, colCount[d]); });
    var H = Math.max(300, rows * 110 + 40), W = colX(maxD) + BW + 165;
    var centerY = function (i, n) { return H / 2 + (i - (n - 1) / 2) * Math.min(110, (H - 40) / Math.max(1, n)); };
    var pos = {};   // signal -> {x,y} de la sortie
    var pins = [];  // entrées de briques
    var svg = '';
    // entrées (interrupteurs)
    lv.inputs.forEach(function (x, i) { pos[x.id] = { x: 118, y: centerY(i, lv.inputs.length) }; });
    // briques
    var idxInCol = {};
    var bricks = st.parts.map(function (p, k) {
      var def = p.type ? PARTS[p.type] : { n: 2, outs: ['sortie'], color: '#90a4ae', sym: '?', short: 'vide', name: 'vide' };
      var d = depth[k]; idxInCol[d] = (idxInCol[d] || 0);
      var i = idxInCol[d]++, h = brickH(def), cy = centerY(i, colCount[d]);
      var b = { k: k, p: p, def: def, x: colX(d), y: cy - h / 2, h: h, cy: cy };
      def.outs.forEach(function (o, oi) { pos['p' + (k + 1) + '.' + oi] = { x: b.x + BW, y: b.y + h * (oi + 1) / (def.outs.length + 1) }; });
      return b;
    });
    // sorties (lampes)
    var lampX = colX(maxD) + BW + 112;
    lv.outputs.forEach(function (o, i) { pos['out' + i] = { x: lampX - 34, y: centerY(i, lv.outputs.length), lx: lampX }; });
    // fils
    function wire(from, to, on) {
      if (!from) return '<circle cx="' + to.x + '" cy="' + to.y + '" r="5" class="pin free"/>';
      var dx = Math.max(30, (to.x - from.x) / 2);
      return '<path d="M' + from.x + ' ' + from.y + ' C' + (from.x + dx) + ' ' + from.y + ',' + (to.x - dx) + ' ' + to.y + ',' + to.x + ' ' + to.y + '" class="wire ' + (on ? 'on' : 'off') + '"/>';
    }
    bricks.forEach(function (b) {
      for (var i = 0; i < b.def.n; i++) {
        var s = b.p.ins && b.p.ins[i], to = { x: b.x, y: b.y + b.h * (i + 1) / (b.def.n + 1) };
        svg += wire(s ? pos[s] : null, to, s && sig[s]);
      }
    });
    st.outs.forEach(function (s, i) { var to = pos['out' + i]; svg += wire(s ? pos[s] : null, to, s && sig[s]); });
    // briques
    bricks.forEach(function (b) {
      var on = b.def.outs.some(function (o, oi) { return sig['p' + (b.k + 1) + '.' + oi]; });
      var hidden = hideGate && b.p.type;
      var color = hidden ? '#78909c' : b.def.color;
      svg += '<g class="brick" transform="translate(' + b.x + ',' + b.y + ')">' +
        '<rect class="studbase" x="8" y="-8" width="' + (BW - 16) + '" height="12" rx="4" fill="' + color + '"/>' +
        [26, 58, 90].map(function (cx) { return '<circle cx="' + cx + '" cy="-4" r="7" fill="' + color + '" class="stud"/>'; }).join('') +
        '<rect width="' + BW + '" height="' + b.h + '" rx="12" fill="' + color + '" class="body"/>' +
        '<rect width="' + BW + '" height="' + b.h + '" rx="12" class="shine"/>' +
        '<text x="' + (b.def.outs.length > 1 ? BW / 2 - 18 : BW / 2) + '" y="' + (b.h / 2 + 4) + '" text-anchor="middle" class="bsym">' + (hidden ? '?' : b.def.sym) + '</text>' +
        '<text x="' + BW / 2 + '" y="' + (b.h - 9) + '" text-anchor="middle" class="bname">' + (hidden ? 'mystère' : b.def.short) + '</text>' +
        '<text x="10" y="-12" class="bnum">' + (lv.kind === 'build' ? (b.k + 1) : '') + '</text></g>';
      for (var i = 0; i < b.def.n; i++) svg += '<circle cx="' + b.x + '" cy="' + (b.y + b.h * (i + 1) / (b.def.n + 1)) + '" r="6" class="pin ' + (b.p.ins && b.p.ins[i] && sig[b.p.ins[i]] ? 'on' : '') + '"/>';
      b.def.outs.forEach(function (o, oi) {
        var pp = pos['p' + (b.k + 1) + '.' + oi];
        svg += '<circle cx="' + pp.x + '" cy="' + pp.y + '" r="6" class="pin ' + (sig['p' + (b.k + 1) + '.' + oi] ? 'on' : '') + '"/>';
        if (b.def.outs.length > 1) svg += '<text x="' + (pp.x - 10) + '" y="' + (pp.y + 4) + '" text-anchor="end" class="olabel">' + o + '</text>';
      });
    });
    // interrupteurs
    lv.inputs.forEach(function (x, i) {
      var p = pos[x.id], on = vals[i];
      svg += '<g class="switch ' + (on ? 'on' : '') + '" data-sw="' + x.id + '" transform="translate(' + (p.x - 94) + ',' + (p.y - 28) + ')">' +
        '<rect width="94" height="56" rx="14" class="sbody"/><rect x="' + (on ? 50 : 6) + '" y="6" width="38" height="44" rx="10" class="sknob"/>' +
        '<text x="' + (on ? 25 : 69) + '" y="34" text-anchor="middle" class="sstate">' + (on ? '1' : '0') + '</text></g>' +
        '<text x="' + (p.x - 47) + '" y="' + (p.y + 48) + '" text-anchor="middle" class="ilabel" data-sw="' + x.id + '">' + esc((x.icon ? x.icon + ' ' : '') + x.label) + '</text>' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" class="pin ' + (on ? 'on' : '') + '"/>';
    });
    // lampes
    lv.outputs.forEach(function (o, i) {
      var p = pos['out' + i], on = ev.outs[i];
      svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" class="pin ' + (on ? 'on' : '') + '"/>' +
        '<g class="lamp ' + (on ? 'on' : '') + '" transform="translate(' + p.lx + ',' + p.y + ')"><circle r="30" class="halo"/><circle r="24" class="bulb"/>' +
        '<text y="9" text-anchor="middle" class="lemoji">' + (o.icon || '💡') + '</text></g>' +
        '<text x="' + p.lx + '" y="' + (p.y + 52) + '" text-anchor="middle" class="ilabel">' + esc(o.label) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="lgsvg" preserveAspectRatio="xMidYMid meet">' + svg + '</svg>';
  }

  /* ---------- état de la page ---------- */
  var cur = null;
  function dispose() { cur = null; }
  function done(p) { return p.logique.done; }
  function points(p) { var s = 0, d = p.logique && p.logique.done; if (!d) return 0; Object.keys(d).forEach(function (k) { s += d[k].pts || 0; }); return s; }
  function unlocked(p) {
    var u = { NAND: 1 };
    LEVELS.forEach(function (l) { if (l.unlock && done(p)[l.id]) u[l.unlock] = 1; });
    return u;
  }

  /* ---------- liste des niveaux ---------- */
  function viewList() {
    App.renderHeader('liste', 'logique');
    var p = App.profile(), u = unlocked(p), n = LEVELS.filter(function (l) { return done(p)[l.id]; }).length;
    var html = '<div class="agency-head card"><div><h2>💡 Atelier de logique</h2><p>Les ordinateurs sont faits de milliers de petites portes. Ici, tu fabriques les tiennes, brique par brique !</p></div>' +
      '<div class="grade"><b>' + n + ' / ' + LEVELS.length + '</b> niveaux<div class="rankbar"><i style="width:' + Math.round(n / LEVELS.length * 100) + '%"></i></div></div></div>' +
      '<section class="series card"><div class="series-head"><h2>🧱 Mes briques</h2></div><div class="mybricks">' +
      ORDER.map(function (t) {
        var d = PARTS[t], ok = u[t];
        return '<div class="mybrick ' + (ok ? '' : 'locked') + '" style="--c:' + d.color + '"><div class="mb-studs"><i></i><i></i><i></i></div><div class="mb-body"><b>' + (ok ? d.sym : '🔒') + '</b><span>' + d.short + '</span></div></div>';
      }).join('') + '</div></section>';
    CHAPTERS.forEach(function (ch) {
      var lvs = LEVELS.filter(function (l) { return l.ch === ch.n; }), d = lvs.filter(function (l) { return done(p)[l.id]; }).length;
      html += '<section class="series card"><div class="series-head"><h2>' + ch.icon + ' ' + ch.n + '. ' + esc(ch.name) + '</h2><span class="count">' + d + ' / ' + lvs.length + '</span></div><p>' + esc(ch.desc) + '</p><div class="pills">';
      lvs.forEach(function (l) {
        var r = done(p)[l.id], ico = l.kind === 'explore' ? '❓' : (l.kind === 'table' ? '📋' : (l.unlock ? PARTS[l.unlock].sym : '🔧'));
        html += '<a class="pill mpill ' + (r ? 'done' : '') + '" href="#/logique/niveau/' + l.id + '"><div class="m-ico">' + ico + '</div><b>' + l.id + '</b><small>' + esc(l.title) + '</small><span class="stars">' + (r ? (r.pts >= (l.kind === 'build' ? 15 : 10) ? '★★' : '★☆') : '') + '</span></a>';
      });
      html += '</div></section>';
    });
    $('#view').innerHTML = html;
  }

  /* ---------- page d'un niveau ---------- */
  function viewLevel(id) {
    var lv = BY_ID[id];
    if (!lv) { location.hash = '#/logique'; return; }
    App.renderHeader('niveau', 'logique');
    var next = LEVELS[lv.index + 1], prev = LEVELS[lv.index - 1];
    cur = { lv: lv, st: newState(lv), hint: false, tested: null };
    $('#view').className = 'is-level';
    $('#view').innerHTML =
      '<section class="level"><div class="level-head"><a class="btn small" href="#/logique">← Niveaux</a><span class="badge">' + lv.id + '</span><h2>' + esc(lv.title) + '</h2><span class="spacer"></span>' +
      (prev ? '<a class="btn small" href="#/logique/niveau/' + prev.id + '">◀</a>' : '') + (next ? '<a class="btn small" href="#/logique/niveau/' + next.id + '">▶</a>' : '') + '</div>' +
      '<div class="instruction">🔧 ' + esc(lv.text) + '</div><div class="m-steps" id="steps"></div>' +
      '<div class="lg-main"><div class="lg-board" id="board"></div><div class="lg-side" id="side"></div></div>' +
      '<div class="m-actions"><button class="btn go" id="check">' + (lv.kind === 'explore' ? '✅ Valider ma réponse' : '✅ Tester le circuit') + '</button><button class="btn small" id="hint">💡 Indice</button>' +
      '<button class="btn small" id="sol" title="Pour les adultes">👀 Solution</button>' + (lv.kind === 'build' ? '<button class="btn small" id="clear">🗑 Tout effacer</button>' : '') + '<span id="toast" class="lg-toast"></span></div></section>';
    render();
    var v = $('#view');
    v.addEventListener('click', onClick);
    $('#check').onclick = check;
    $('#hint').onclick = function () { cur.hint = true; toast('💡 ' + lv.hint, 'hint'); };
    $('#sol').onclick = function () {
      if (!confirm('Afficher la solution ? (Pour les adultes.)')) return;
      cur.hint = true; solve(); render();
      toast('Voici une solution. Touche « ' + (lv.kind === 'explore' ? 'Valider' : 'Tester') + ' » pour valider.', 'hint');
    };
    if ($('#clear')) $('#clear').onclick = function () { cur.st = newState(lv); cur.tested = null; render(); };
  }

  function toast(t, kind) { var m = $('#toast'); if (!m) return; m.className = 'lg-toast ' + (kind || ''); m.innerHTML = t; }

  function solve() {
    var lv = cur.lv, st = cur.st;
    if (lv.kind === 'build') loadSolution(lv, st);
    else if (lv.kind === 'explore') st.ans = lv.gate;
    else st.table = combos(lv.inputs.length).map(function (v) { return lv.f(v)[0]; });
  }

  function sources(lv, st, k) {
    var list = lv.inputs.map(function (x) { return { id: x.id, label: (x.icon ? x.icon + ' ' : '') + x.label, color: '#546e7a' }; });
    st.parts.slice(0, k).forEach(function (p, j) {
      if (!p.type) return;
      var d = PARTS[p.type];
      d.outs.forEach(function (o, oi) { list.push({ id: 'p' + (j + 1) + '.' + oi, label: d.short + ' ' + (j + 1) + (d.outs.length > 1 ? ' · ' + o : ''), color: d.color }); });
    });
    return list;
  }
  function chip(act, attrs, label, on, color) {
    return '<button class="lchip' + (on ? ' on' : '') + '" data-act="' + act + '" ' + attrs + (color ? ' style="--c:' + color + '"' : '') + '>' + label + '</button>';
  }

  function render() {
    if (!cur) return;
    var lv = cur.lv, st = cur.st;
    $('#board').innerHTML = drawBoard(lv, st, lv.kind === 'explore') + numReadout(lv, st);
    var side = '';
    if (lv.kind === 'build') {
      side += '<div class="lg-block"><h4>🧱 Briques à ta disposition</h4><div class="lg-legend">' + lv.parts.map(function (t) {
        var d = PARTS[t]; return '<span class="lchip fixed" style="--c:' + d.color + '" title="' + esc(d.about) + '">' + d.sym + ' ' + d.short + '</span>';
      }).join('') + '</div></div>';
      st.parts.forEach(function (p, k) {
        var d = p.type ? PARTS[p.type] : null;
        side += '<div class="lg-block slotc"><h4>Brique ' + (k + 1) + (k === st.parts.length - 1 ? ' <button class="lx" data-act="del" title="Retirer cette brique">✕</button>' : '') + '</h4><div class="lg-row">' +
          lv.parts.map(function (t) { return chip('part', 'data-k="' + k + '" data-v="' + t + '"', PARTS[t].sym + ' ' + PARTS[t].short, p.type === t, PARTS[t].color); }).join('') + '</div>';
        if (d) {
          var src = sources(lv, st, k);
          for (var i = 0; i < d.n; i++) {
            side += '<div class="lg-row"><span class="lg-lab">entrée ' + (i + 1) + '</span>' + src.map(function (s) { return chip('in', 'data-k="' + k + '" data-i="' + i + '" data-v="' + s.id + '"', esc(s.label), p.ins[i] === s.id, s.color); }).join('') + '</div>';
          }
        }
        side += '</div>';
      });
      if (st.parts.length < lv.max) side += '<button class="btn small lg-add" data-act="add">➕ Ajouter une brique (' + st.parts.length + ' / ' + lv.max + ')</button>';
      var all = sources(lv, st, st.parts.length);
      side += '<div class="lg-block"><h4>💡 Branche les lampes</h4>' + lv.outputs.map(function (o, i) {
        return '<div class="lg-row"><span class="lg-lab">' + esc((o.icon || '') + ' ' + o.label) + '</span>' + all.map(function (s) { return chip('out', 'data-i="' + i + '" data-v="' + s.id + '"', esc(s.label), st.outs[i] === s.id, s.color); }).join('') + '</div>';
      }).join('') + '</div>';
      if (cur.tested) side += truthTable(lv, cur.tested);
    } else if (lv.kind === 'explore') {
      side += '<div class="lg-block"><h4>🔍 Tes essais</h4>' + seenTable(lv, st) + '</div>' +
        '<div class="lg-block"><h4>Quelle porte est cachée ?</h4><div class="lg-row">' + lv.options.map(function (t) {
          return chip('ans', 'data-v="' + t + '"', PARTS[t].sym + ' ' + PARTS[t].name, st.ans === t, PARTS[t].color);
        }).join('') + '</div>' + (st.ans ? '<p class="lg-about">' + esc(PARTS[st.ans].about) + '</p>' : '') + '</div>';
    } else {
      var cs = combos(lv.inputs.length);
      side += '<div class="lg-block"><h4>📋 Table de vérité : porte ' + PARTS[lv.gate].name + '</h4><p class="lg-about">' + esc(PARTS[lv.gate].about) + '</p><table class="lg-table"><tr>' +
        lv.inputs.map(function (x) { return '<th>' + esc(x.label) + '</th>'; }).join('') + '<th>Lampe</th></tr>' + cs.map(function (v, r) {
          var cell = st.table[r], bad = cur.tested && cur.tested[r] === false;
          return '<tr>' + v.map(function (b) { return '<td>' + b + '</td>'; }).join('') + '<td><button class="cell ' + (cell === null ? '' : (cell ? 'one' : 'zero')) + (cur.tested ? (bad ? ' ko' : ' ok') : '') + '" data-act="cell" data-r="' + r + '">' + (cell === null ? '?' : cell) + '</button></td></tr>';
        }).join('') + '</table></div>';
    }
    $('#side').innerHTML = side;
    renderSteps();
  }

  function numReadout(lv, st) {
    if (!lv.num) return '';
    var vals = lv.inputs.map(function (x) { return st.sw[x.id] ? 1 : 0; });
    var ev = evaluate(lv, st, vals), val = {};
    lv.inputs.forEach(function (x, i) { val[x.id] = vals[i]; });
    lv.outputs.forEach(function (o, i) { val[o.id] = ev.outs[i]; });
    function number(ids) { return ids.reduce(function (a, id) { return a * 2 + (val[id] || 0); }, 0); }
    function bits(ids) { return ids.map(function (id) { return val[id] || 0; }).join(''); }
    var parts = lv.num.filter(function (g) { return !g.result; }), res = lv.num.filter(function (g) { return g.result; })[0];
    function item(g) { return '<span class="' + (g.result ? 'res' : '') + '">' + esc(g.label) + ' : <b>' + number(g.ids) + '</b> <em>(' + bits(g.ids) + ')</em></span>'; }
    return '<div class="lg-num">' + parts.map(item).join('<i>+</i>') + (res ? '<i>=</i>' + item(res) : '') + '</div>';
  }
  function seenTable(lv, st) {
    var keys = Object.keys(st.seen);
    if (!keys.length) return '<p class="lg-about">Touche les interrupteurs : tes essais s’écrivent ici.</p>';
    return '<table class="lg-table"><tr>' + lv.inputs.map(function (x) { return '<th>' + esc(x.label) + '</th>'; }).join('') + '<th>Lampe</th></tr>' +
      keys.sort().map(function (k) { return '<tr>' + k.split('').map(function (b) { return '<td>' + b + '</td>'; }).join('') + '<td class="' + (st.seen[k] ? 'lampon' : '') + '">' + (st.seen[k] ? '💡 1' : '0') + '</td></tr>'; }).join('') + '</table>';
  }
  function truthTable(lv, rows) {
    return '<div class="lg-block"><h4>📋 Résultat du test</h4><table class="lg-table"><tr>' + lv.inputs.map(function (x) { return '<th>' + esc(x.label) + '</th>'; }).join('') +
      lv.outputs.map(function (o) { return '<th>' + esc(o.label) + ' (attendu → obtenu)</th>'; }).join('') + '<th></th></tr>' +
      rows.map(function (r) {
        return '<tr class="' + (r.ok ? 'okrow' : 'kors') + '">' + r.ins.map(function (b) { return '<td>' + b + '</td>'; }).join('') +
          r.want.map(function (w, i) { return '<td>' + w + ' → ' + r.got[i] + '</td>'; }).join('') + '<td>' + (r.ok ? '✅' : '❌') + '</td></tr>';
      }).join('') + '</table></div>';
  }

  /* barre « étapes » : briques posées / lampes branchées, essais, cases */
  function renderSteps() {
    var el = $('#steps'); if (!el || !cur) return;
    var lv = cur.lv, st = cur.st, n, d, unit, chips = '';
    if (lv.kind === 'build') {
      n = lv.sol.parts.length; unit = 'briques à poser';
      d = Math.min(n, st.parts.filter(function (p) { return p.type; }).length);
    } else if (lv.kind === 'explore') {
      n = 1 << lv.inputs.length; unit = 'essais pour comprendre'; d = Math.min(n, Object.keys(st.seen).length);
    } else {
      n = st.table.length; unit = 'cases à remplir'; d = st.table.filter(function (c) { return c !== null; }).length;
    }
    for (var i = 0; i < n; i++) chips += '<i class="chip ' + (i < d ? 'on' : '') + '"></i>';
    el.innerHTML = '<span class="ms-title">🪜 Typiquement <b>' + n + '</b> étape' + (n > 1 ? 's' : '') + ' <em>(' + unit + ')</em></span><span class="ms-bar">' + chips + '</span><span class="ms-count">' + d + ' / ' + n + '</span>';
  }

  function onClick(e) {
    if (!cur) return;
    var lv = cur.lv, st = cur.st;
    var sw = e.target.closest('[data-sw]');
    if (sw) {
      var id = sw.getAttribute('data-sw'); st.sw[id] = st.sw[id] ? 0 : 1; App.beep([st.sw[id] ? 620 : 420]);
      var vals = lv.inputs.map(function (x) { return st.sw[x.id] ? 1 : 0; });
      st.seen[vals.join('')] = evaluate(lv, st, vals).outs[0];
      render(); return;
    }
    var t = e.target.closest('button[data-act]'); if (!t) return;
    var a = t.dataset.act, k = Number(t.dataset.k), v = t.dataset.v;
    if (a === 'part') {
      var p = st.parts[k]; p.type = v; p.ins = (p.ins || []).slice(0, PARTS[v].n);
      while (p.ins.length < PARTS[v].n) p.ins.push(null);
    } else if (a === 'in') { st.parts[k].ins[Number(t.dataset.i)] = v; }
    else if (a === 'out') { st.outs[Number(t.dataset.i)] = v; }
    else if (a === 'add') { if (st.parts.length < lv.max) st.parts.push({ type: null, ins: [] }); }
    else if (a === 'del') {
      var gone = 'p' + st.parts.length + '.';
      st.parts.pop();
      st.parts.forEach(function (q) { q.ins = q.ins.map(function (s) { return s && s.indexOf(gone) === 0 ? null : s; }); });
      st.outs = st.outs.map(function (s) { return s && s.indexOf(gone) === 0 ? null : s; });
    } else if (a === 'ans') { st.ans = v; }
    else if (a === 'cell') { var r = Number(t.dataset.r); st.table[r] = st.table[r] === null ? 0 : (st.table[r] ? 0 : 1); }
    cur.tested = null; toast('', '');
    render();
  }

  function check() {
    if (!cur) return;
    var lv = cur.lv, st = cur.st, ok = false;
    if (lv.kind === 'explore') {
      if (!st.ans) { toast('Choisis d’abord une porte dans la liste.', 'warn'); return; }
      ok = st.ans === lv.gate;
      if (!ok) { toast('❌ Pas tout à fait… Teste d’autres positions des interrupteurs et compare avec la définition de chaque porte.', 'warn'); App.beep([220]); return; }
    } else if (lv.kind === 'table') {
      if (st.table.some(function (c) { return c === null; })) { toast('Il reste des cases « ? » à remplir.', 'warn'); return; }
      var cs = combos(lv.inputs.length);
      cur.tested = cs.map(function (v, r) { return st.table[r] === lv.f(v)[0]; });
      ok = cur.tested.every(Boolean);
      if (!ok) { render(); toast('❌ Les cases rouges sont fausses. Relis la définition de la porte.', 'warn'); App.beep([220]); return; }
    } else {
      var ev = evaluate(lv, st, lv.inputs.map(function () { return 0; }));
      if (!ev.complete) { toast('Le circuit n’est pas fini : choisis une brique et branche toutes ses entrées et les lampes.', 'warn'); return; }
      var rows = runAll(lv, st); cur.tested = rows;
      ok = rows.every(function (r) { return r.ok; });
      if (!ok) { render(); toast('❌ Le circuit ne donne pas toujours le bon résultat (lignes ❌). Change ton montage !', 'warn'); App.beep([220]); return; }
    }
    succeed();
  }

  function succeed() {
    var lv = cur.lv, p = App.profile(), before = App.allPoints(p), rb = App.rankInfo(before);
    var pts = 15 - (cur.hint ? 5 : 0) - (lv.kind === 'build' ? 0 : 5), prev = done(p)[lv.id];
    if (lv.kind !== 'build') pts = 10 - (cur.hint ? 5 : 0);
    if (!prev || pts > prev.pts) done(p)[lv.id] = { pts: pts, ts: Date.now() };
    App.save();
    var after = App.allPoints(p), ra = App.rankInfo(after), gained = after - before, next = LEVELS[lv.index + 1];
    render(); App.renderHeader('niveau', 'logique');
    App.beep([523, 659, 784, 1047]); App.confetti();
    var root = $('#modal-root'), nb = lv.unlock ? PARTS[lv.unlock] : null;
    root.innerHTML = '<div class="overlay"><div class="dialog"><div class="big">💡</div><h2>Circuit réussi !</h2><div class="pts">' + (gained > 0 ? '+' + gained + ' points' : 'Déjà réussi') + '</div>' +
      (cur.hint && gained > 0 ? '<p class="small">Sans indice, tu gagnes 5 points de plus !</p>' : '') +
      (nb ? '<div class="newbrick" style="--c:' + nb.color + '"><div class="mb-studs"><i></i><i></i><i></i></div><div class="mb-body"><b>' + nb.sym + '</b><span>' + nb.short + '</span></div></div><p><b>🔓 Nouvelle brique : ' + esc(nb.name) + '</b></p>' : '') +
      '<div class="rank"><b>' + ra.name + '</b> · ' + after + ' pts<div class="rankbar"><i style="width:' + ra.pct + '%"></i></div></div>' +
      (ra.idx > rb.idx ? '<p><b>⬆ Nouveau rang : ' + ra.name + ' !</b></p>' : '') +
      '<div class="row"><button class="btn" id="m-close">Rester ici</button><a class="btn" href="#/logique" id="m-list">Niveaux</a>' +
      (next ? '<a class="btn primary" href="#/logique/niveau/' + next.id + '" id="m-next">Niveau suivant →</a>' : '') + '</div></div></div>';
    var close = function () { root.innerHTML = ''; };
    $('#m-close').onclick = close; $('#m-list').addEventListener('click', close);
    if (next) $('#m-next').addEventListener('click', close);
  }

  /* ---------- tests automatiques ---------- */
  function tests() {
    var rows = '', fails = 0;
    LEVELS.forEach(function (lv) {
      var ok = true, why = [];
      try {
        var st = newState(lv);
        if (lv.kind === 'build') {
          if (lv.sol.parts.length > lv.max) { ok = false; why.push('solution trop longue'); }
          lv.sol.parts.forEach(function (q, k) {
            if (lv.parts.indexOf(q[0]) < 0) { ok = false; why.push('brique ' + q[0] + ' non autorisée'); }
            if (q.length - 1 !== PARTS[q[0]].n) { ok = false; why.push('entrées de ' + q[0]); }
            q.slice(1).forEach(function (s) {
              var m = /^p(\d+)\./.exec(norm(s));
              if (m && Number(m[1]) - 1 >= k) { ok = false; why.push('boucle sur ' + s); }
            });
          });
          loadSolution(lv, st);
          if (!runAll(lv, st).every(function (r) { return r.ok; })) { ok = false; why.push('solution fausse'); }
          if (runAll(lv, newState(lv)).every(function (r) { return r.ok; })) { ok = false; why.push('circuit vide accepté'); }
          drawBoard(lv, st, false);
        } else if (lv.kind === 'explore') {
          if (lv.options.indexOf(lv.gate) < 0) { ok = false; why.push('bonne réponse absente'); }
          drawBoard(lv, st, true);
        } else {
          var all = combos(lv.inputs.length).map(function (v) { return lv.f(v)[0]; });
          if (all.every(function (x) { return x === all[0]; })) { ok = false; why.push('table triviale'); }
          drawBoard(lv, st, false);
        }
      } catch (e) { ok = false; why.push('ERREUR ' + e.message); }
      if (!ok) fails++;
      rows += '<tr><td>' + lv.id + '</td><td>' + esc(lv.title) + '</td><td class="' + (ok ? 'okc' : 'koc') + '">' + (ok ? 'OK' : 'ÉCHEC') + '</td><td>' + esc(ok ? lv.kind : why.join(' ; ')) + '</td></tr>';
    });
    // contrôle des portes : tables de référence
    var g = PARTS.NAND.f([1, 1])[0] === 0 && PARTS.NAND.f([0, 1])[0] === 1 && PARTS.XOR.f([1, 1])[0] === 0 && PARTS.COMPLET.f([1, 1, 1]).join() === '1,1' && PARTS.DEMI.f([1, 1]).join() === '0,1';
    if (!g) fails++;
    rows += '<tr><td>portes</td><td>tables de référence</td><td class="' + (g ? 'okc' : 'koc') + '">' + (g ? 'OK' : 'ÉCHEC') + '</td><td></td></tr>';
    return { title: 'Atelier de logique (' + LEVELS.length + ' niveaux)', rows: rows, fails: fails };
  }

  App.registerRoute(/^#\/logique$/, viewList);
  App.registerRoute(/^#\/logique\/niveau\/(\d-\d)$/, function (m) { viewLevel(m[1]); });
  App.registerDispose(dispose);
  App.registerPoints(points);
  App.registerTests(tests);
  App.registerActivity({
    id: 'logique', href: '#/logique', icon: '💡', title: 'Atelier de logique',
    desc: 'Interrupteurs, portes et circuits : construis un additionneur avec tes briques !',
    progress: function (p) { return { done: LEVELS.filter(function (l) { return p.logique.done[l.id]; }).length, total: LEVELS.length, points: points(p) }; }
  });
})();
