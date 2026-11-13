/* Tortue Blocs — blocs, générateur de code, boîte à outils, DSL des solutions.
   Aucune saisie au clavier pour les nombres : tout passe par des listes déroulantes
   dont le contenu dépend du niveau (TB.opts). */
(function () {
  'use strict';
  var TB = (window.TB = window.TB || {});
  // Selon la version de Blockly, le générateur est Blockly.JavaScript ou Blockly.JavaScript.javascriptGenerator.
  var G = Blockly.JavaScript.javascriptGenerator || Blockly.JavaScript;
  var ORDER_NONE = G.ORDER_NONE !== undefined ? G.ORDER_NONE : 99;
  var ORDER_ATOMIC = G.ORDER_ATOMIC !== undefined ? G.ORDER_ATOMIC : 0;

  var ALL_COLORS = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose', 'noir'];

  /* Listes proposées par défaut (mode création libre). */
  TB.FREE_OPTS = {
    len: [10, 20, 30, 50, 80, 100, 150, 200],
    ang: [30, 45, 60, 72, 90, 120, 135, 144, 150, 180],
    cnt: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    val: [1, 2, 3, 5, 10, 20, 50, 100, 360],
    col: ALL_COLORS.slice(),
    vars: ['taille', 'angle', 'cotes', 'a', 'b']
  };
  TB.opts = TB.FREE_OPTS;
  TB.useLevel = function (lv) { TB.opts = lv ? lv.opts : TB.FREE_OPTS; };

  function dropdownFrom(kind) {
    return new Blockly.FieldDropdown(function () {
      var l = TB.opts[kind] && TB.opts[kind].length ? TB.opts[kind] : TB.FREE_OPTS[kind];
      return l.map(function (v) { return [String(v), String(v)]; });
    });
  }

  /* ---------- Blocs « nombre » (listes) ---------- */
  ['len', 'ang', 'cnt', 'val'].forEach(function (kind) {
    Blockly.Blocks['fr_num_' + kind] = {
      init: function () {
        this.appendDummyInput().appendField(dropdownFrom(kind), 'V');
        this.setOutput(true, 'Number');
        this.setColour(230);
      }
    };
    G.forBlock['fr_num_' + kind] = function (b) { return [String(Number(b.getFieldValue('V'))), ORDER_ATOMIC]; };
  });

  /* ---------- Blocs de mouvement ---------- */
  var MOVES = [
    ['fr_forward', 'avancer de %1', 210, 'avancer', 'Fait avancer la tortue.'],
    ['fr_right', 'tourner à droite de %1 °', 210, 'droite', 'Fait pivoter la tortue vers la droite.'],
    ['fr_left', 'tourner à gauche de %1 °', 210, 'gauche', 'Fait pivoter la tortue vers la gauche.'],
    ['fr_up', 'aller en haut de %1', 160, 'allerHaut', 'La tortue monte, sans avoir besoin de tourner.'],
    ['fr_down', 'aller en bas de %1', 160, 'allerBas', 'La tortue descend, sans avoir besoin de tourner.'],
    ['fr_east', 'aller à droite de %1', 160, 'allerDroite', 'La tortue va vers la droite, sans avoir besoin de tourner.'],
    ['fr_west', 'aller à gauche de %1', 160, 'allerGauche', 'La tortue va vers la gauche, sans avoir besoin de tourner.']
  ];
  Blockly.defineBlocksWithJsonArray(MOVES.map(function (m) {
    return {
      type: m[0], message0: m[1], args0: [{ type: 'input_value', name: 'N', check: 'Number' }],
      previousStatement: null, nextStatement: null, colour: m[2], tooltip: m[4]
    };
  }));
  MOVES.forEach(function (m) {
    G.forBlock[m[0]] = function (block, gen) {
      var v = gen.valueToCode(block, 'N', ORDER_NONE) || '0';
      return m[3] + '(' + v + ');\n';
    };
  });

  /* ---------- Crayon ---------- */
  Blockly.Blocks['fr_color'] = {
    init: function () {
      this.appendDummyInput().appendField('couleur du crayon').appendField(new Blockly.FieldDropdown(function () {
        var l = TB.opts.col && TB.opts.col.length ? TB.opts.col : ALL_COLORS;
        return l.map(function (c) { return [c, c]; });
      }), 'C');
      this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(20);
      this.setTooltip('Change la couleur du trait.');
    }
  };
  Blockly.defineBlocksWithJsonArray([
    { type: 'fr_penup', message0: 'lever le crayon', previousStatement: null, nextStatement: null, colour: 20, tooltip: 'La tortue avance sans dessiner.' },
    { type: 'fr_pendown', message0: 'baisser le crayon', previousStatement: null, nextStatement: null, colour: 20, tooltip: 'La tortue dessine quand elle avance.' }
  ]);
  Blockly.Blocks['fr_start'] = {
    init: function () {
      this.jsonInit({ message0: '▶ quand on exécute', nextStatement: null, style: 'hat_blocks', tooltip: 'Le programme commence ici.' });
      this.setDeletable(false);
      this.setMovable(false);
    }
  };

  G.forBlock['fr_start'] = function () { return ''; };
  G.forBlock['fr_color'] = function (b) { return "couleur('" + b.getFieldValue('C') + "');\n"; };
  G.forBlock['fr_penup'] = function () { return 'leverCrayon();\n'; };
  G.forBlock['fr_pendown'] = function () { return 'baisserCrayon();\n'; };
  G.addReservedWords('avancer,droite,gauche,couleur,leverCrayon,baisserCrayon,highlightBlock,loopBudget,allerHaut,allerBas,allerDroite,allerGauche');
  G.INFINITE_LOOP_TRAP = 'if (--loopBudget < 0) throw "boucle";\n';

  /* Génère le code du programme : seulement le bloc de départ et les fonctions. */
  TB.generateCode = function (ws, withHighlight) {
    var prevPrefix = G.STATEMENT_PREFIX;
    G.STATEMENT_PREFIX = withHighlight ? 'highlightBlock(%1);\n' : null;
    var code = '';
    try {
      G.init(ws);
      var tops = ws.getTopBlocks(true);
      for (var i = 0; i < tops.length; i++) {
        var t = tops[i].type;
        if (t === 'fr_start' || t === 'procedures_defnoreturn' || t === 'procedures_defreturn') {
          var c = G.blockToCode(tops[i]);
          if (Array.isArray(c)) c = c[0];
          if (c) code += c;
        }
      }
      code = G.finish(code);
    } finally {
      G.STATEMENT_PREFIX = prevPrefix;
    }
    return code;
  };

  /* Nombre de blocs « utiles » (hors départ, hors blocs-nombres). */
  TB.countBlocks = function (ws) {
    return ws.getAllBlocks(false).filter(function (b) {
      return !b.isShadow() && b.type !== 'fr_start' && b.type !== 'math_number' && b.type.indexOf('fr_num_') !== 0;
    }).length;
  };

  /* ---------- Boîte à outils ---------- */
  function num(kind, v) {
    var s = { type: 'fr_num_' + kind };
    if (v !== undefined) s.fields = { V: String(v) };
    return { shadow: s };
  }
  function blk(type, inputs) {
    var o = { kind: 'block', type: type };
    if (inputs) o.inputs = inputs;
    return o;
  }

  TB.buildToolbox = function (groups) {
    var has = function (g) { return groups.indexOf(g) >= 0; };
    var cats = [], c;
    if (has('fwd') || has('move')) {
      c = [blk('fr_forward', { N: num('len') })];
      if (has('move')) { c.push(blk('fr_right', { N: num('ang') })); c.push(blk('fr_left', { N: num('ang') })); }
      cats.push({ kind: 'category', name: 'Mouvements', colour: '210', contents: c });
    }
    if (has('dir')) {
      cats.push({
        kind: 'category', name: 'Directions', colour: '160', contents: [
          blk('fr_up', { N: num('len') }), blk('fr_down', { N: num('len') }),
          blk('fr_west', { N: num('len') }), blk('fr_east', { N: num('len') })
        ]
      });
    }
    if (has('color') || has('pen')) {
      c = [];
      if (has('color')) c.push(blk('fr_color'));
      if (has('pen')) { c.push(blk('fr_penup')); c.push(blk('fr_pendown')); }
      cats.push({ kind: 'category', name: 'Crayon', colour: '20', contents: c });
    }
    if (has('loop')) {
      cats.push({ kind: 'category', name: 'Boucles', colour: '120', contents: [blk('controls_repeat_ext', { TIMES: num('cnt') })] });
    }
    if (has('var')) cats.push({ kind: 'category', name: 'Variables', colour: '330', custom: 'VARIABLE' });
    if (has('math')) {
      cats.push({
        kind: 'category', name: 'Calculs', colour: '230', contents: [
          blk('fr_num_val'),
          blk('math_arithmetic', { A: num('val'), B: num('val') })
        ]
      });
    }
    if (has('func')) cats.push({ kind: 'category', name: 'Fonctions', colour: '290', custom: 'PROCEDURE' });
    if (cats.length === 1 && !cats[0].custom) return { kind: 'flyoutToolbox', contents: cats[0].contents };
    return { kind: 'categoryToolbox', contents: cats };
  };

  /* Remplace les nombres saisis par des listes dans les menus Variables et Fonctions, et
     supprime le bouton « Créer une variable » (les variables sont fournies par le niveau). */
  function mk(tag, type) { var e = Blockly.utils.xml.createElement(tag); if (type) e.setAttribute('type', type); return e; }
  function valueShadow(name, type) {
    var v = mk('value'); v.setAttribute('name', name); v.appendChild(mk('shadow', type)); return v;
  }
  TB.installCategories = function (ws) {
    ws.registerToolboxCategoryCallback('VARIABLE', function (w) {
      var list = Blockly.Variables.flyoutCategory(w).filter(function (el) { return el.tagName.toLowerCase() !== 'button'; });
      list.forEach(function (el) {
        var type = el.getAttribute('type');
        if (type === 'math_change' || type === 'variables_set') {
          var name = type === 'math_change' ? 'DELTA' : 'VALUE';
          Array.prototype.slice.call(el.querySelectorAll('value')).forEach(function (v) { el.removeChild(v); });
          el.appendChild(valueShadow(name, 'fr_num_val'));
        }
      });
      return list;
    });
    ws.registerToolboxCategoryCallback('PROCEDURE', function (w) {
      var hidden = ['procedures_defreturn', 'procedures_ifreturn', 'procedures_callreturn'];
      var list = Blockly.Procedures.flyoutCategory(w).filter(function (el) {
        return !(el.getAttribute && hidden.indexOf(el.getAttribute('type')) >= 0);
      });
      list.forEach(function (el) {
        if (el.getAttribute && el.getAttribute('type') === 'procedures_callnoreturn') {
          var n = el.querySelectorAll('mutation > arg').length;
          for (var i = 0; i < n; i++) el.appendChild(valueShadow('ARG' + i, 'fr_num_val'));
        }
      });
      return list;
    });
  };

  /* ---------- DSL des solutions -> XML Blockly ---------- */
  /* Instructions : ['fd',e] ['rt',e] ['lt',e] ['N'|'S'|'E'|'W',e] ['color','rouge'] ['up'] ['down']
     ['repeat',e,[...]] ['set','v',e] ['add','v',e] ['def','nom',['param'..],[...]] ['call','nom',[e..]]
     Expressions : nombre | 'variable' | ['+'|'-'|'*'|'/', a, b] */
  var OPS = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };
  var DIRS = { N: 'fr_up', S: 'fr_down', E: 'fr_east', W: 'fr_west' };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function exp(e, kind) {
    if (typeof e === 'number') return '<shadow type="fr_num_' + kind + '"><field name="V">' + e + '</field></shadow>';
    if (typeof e === 'string') return '<block type="variables_get"><field name="VAR">' + esc(e) + '</field></block>';
    return '<block type="math_arithmetic"><field name="OP">' + OPS[e[0]] + '</field>' +
      '<value name="A">' + exp(e[1], 'val') + '</value><value name="B">' + exp(e[2], 'val') + '</value></block>';
  }
  function val(name, e, kind) { return '<value name="' + name + '">' + exp(e, kind) + '</value>'; }

  function stmt(s, rest) {
    var nxt = rest ? '<next>' + rest + '</next>' : '';
    var k = s[0];
    switch (k) {
      case 'fd': return '<block type="fr_forward">' + val('N', s[1], 'len') + nxt + '</block>';
      case 'rt': return '<block type="fr_right">' + val('N', s[1], 'ang') + nxt + '</block>';
      case 'lt': return '<block type="fr_left">' + val('N', s[1], 'ang') + nxt + '</block>';
      case 'N': case 'S': case 'E': case 'W':
        return '<block type="' + DIRS[k] + '">' + val('N', s[1], 'len') + nxt + '</block>';
      case 'color': return '<block type="fr_color"><field name="C">' + s[1] + '</field>' + nxt + '</block>';
      case 'up': return '<block type="fr_penup">' + nxt + '</block>';
      case 'down': return '<block type="fr_pendown">' + nxt + '</block>';
      case 'repeat':
        return '<block type="controls_repeat_ext">' + val('TIMES', s[1], 'cnt') +
          '<statement name="DO">' + chain(s[2]) + '</statement>' + nxt + '</block>';
      case 'set':
        return '<block type="variables_set"><field name="VAR">' + esc(s[1]) + '</field>' + val('VALUE', s[2], 'val') + nxt + '</block>';
      case 'add':
        return '<block type="math_change"><field name="VAR">' + esc(s[1]) + '</field>' + val('DELTA', s[2], 'val') + nxt + '</block>';
      case 'call': {
        var args = s[2] || [], v = '';
        for (var i = 0; i < args.length; i++) v += val('ARG' + i, args[i], 'val');
        return '<block type="procedures_callnoreturn"><mutation name="' + esc(s[1]) + '">@@ARGS:' + esc(s[1]) + '@@</mutation>' + v + nxt + '</block>';
      }
      default: throw new Error('instruction inconnue : ' + k);
    }
  }
  function chain(list) {
    var out = '';
    for (var i = list.length - 1; i >= 0; i--) out = stmt(list[i], out);
    return out;
  }

  TB.dslToXml = function (dsl) {
    var defs = dsl.filter(function (s) { return s[0] === 'def'; });
    var main = dsl.filter(function (s) { return s[0] !== 'def'; });
    var params = {};
    defs.forEach(function (d) { params[d[1]] = d[2] || []; });
    var xml = '<xml xmlns="https://developers.google.com/blockly/xml">';
    defs.forEach(function (d, i) {
      var args = (d[2] || []).map(function (p) { return '<arg name="' + esc(p) + '"></arg>'; }).join('');
      xml += '<block type="procedures_defnoreturn" x="20" y="' + (260 + i * 190) + '">' +
        '<mutation>' + args + '</mutation><field name="NAME">' + esc(d[1]) + '</field>' +
        '<statement name="STACK">' + chain(d[3]) + '</statement></block>';
    });
    xml += '<block type="fr_start" x="20" y="20" deletable="false">' + (main.length ? '<next>' + chain(main) + '</next>' : '') + '</block>';
    xml += '</xml>';
    return xml.replace(/@@ARGS:([^@]*)@@/g, function (_, name) {
      var key = name.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      return (params[key] || []).map(function (p) { return '<arg name="' + esc(p) + '"></arg>'; }).join('');
    });
  };

  /* Nombre de blocs d'une solution (même règle que countBlocks). */
  function countExp(e) {
    if (typeof e === 'number') return 0;
    if (typeof e === 'string') return 1;
    return 1 + countExp(e[1]) + countExp(e[2]);
  }
  TB.dslCount = function (list) {
    var n = 0;
    list.forEach(function (s) {
      n++;
      switch (s[0]) {
        case 'fd': case 'rt': case 'lt': case 'N': case 'S': case 'E': case 'W': n += countExp(s[1]); break;
        case 'repeat': n += countExp(s[1]) + TB.dslCount(s[2]); break;
        case 'set': case 'add': n += countExp(s[2]); break;
        case 'def': n += TB.dslCount(s[3]); break;
        case 'call': (s[2] || []).forEach(function (a) { n += countExp(a); }); break;
      }
    });
    return n;
  };

  /* ---------- Listes proposées pour un niveau ---------- */
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function numSort(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function pad(vals, pool, n) {
    var s = uniq(vals);
    var cands = pool.filter(function (p) { return s.indexOf(p) < 0; });
    function dist(x) { return s.length ? Math.min.apply(null, s.map(function (v) { return Math.abs(v - x); })) : 0; }
    cands.sort(function (a, b) { return dist(a) - dist(b); });
    while (s.length < n && cands.length) s.push(cands.shift());
    return numSort(s);
  }

  TB.levelOptions = function (dsl) {
    var o = { len: [], ang: [], cnt: [], val: [], col: [], vars: [] }, params = {};
    (function findParams(list) {
      list.forEach(function (s) {
        if (s[0] === 'def') { (s[2] || []).forEach(function (p) { params[p] = 1; }); findParams(s[3]); }
        else if (s[0] === 'repeat') findParams(s[2]);
      });
    })(dsl);
    function ex(e, kind) {
      if (typeof e === 'number') o[kind].push(e);
      else if (typeof e === 'string') { if (!params[e]) o.vars.push(e); }
      else { ex(e[1], 'val'); ex(e[2], 'val'); }
    }
    (function walk(list) {
      list.forEach(function (s) {
        switch (s[0]) {
          case 'fd': case 'N': case 'S': case 'E': case 'W': ex(s[1], 'len'); break;
          case 'rt': case 'lt': ex(s[1], 'ang'); break;
          case 'color': o.col.push(s[1]); break;
          case 'repeat': ex(s[1], 'cnt'); walk(s[2]); break;
          case 'set': case 'add': o.vars.push(s[1]); ex(s[2], 'val'); break;
          case 'def': walk(s[3]); break;
          case 'call': (s[2] || []).forEach(function (a) { ex(a, 'val'); }); break;
        }
      });
    })(dsl);
    o.len = pad(o.len, [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200], 4);
    o.ang = pad(o.ang, [30, 45, 60, 72, 90, 120, 135, 144, 150, 180], 4);
    o.val = pad(o.val, [1, 2, 3, 4, 5, 10, 15, 20, 50, 100, 360, 720], 4);
    o.cnt = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    var cols = uniq(o.col);
    ALL_COLORS.forEach(function (c) { if (cols.length < 4 && cols.indexOf(c) < 0) cols.push(c); });
    o.col = ALL_COLORS.filter(function (c) { return cols.indexOf(c) >= 0; });
    o.vars = uniq(o.vars);
    return o;
  };

  /* Charge un XML dans un espace de travail. */
  TB.loadXml = function (ws, xml) {
    var dom = Blockly.utils.xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, ws);
  };
})();
