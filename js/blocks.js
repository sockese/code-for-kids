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

  var ALL_COLORS = ['rouge', 'orange', 'jaune', 'vert', 'turquoise', 'bleu', 'violet', 'rose', 'marron', 'gris', 'noir'];

  /* Listes proposées par défaut (mode création libre). */
  TB.FREE_OPTS = {
    len: [100, 200, 400],
    ang: [30, 45, 60, 72, 90, 120, 135, 144, 150, 180],
    cnt: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    val: [5, 10, 50, 100, 200, 360],
    col: ALL_COLORS.slice(),
    vars: ['taille', 'angle', 'cotes', 'a', 'b']
  };
  TB.LENGTHS = [100, 200, 400];
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
  var swatches = {};
  function swatch(name) {
    if (!swatches[name]) {
      var hex = (TB.COLORS && TB.COLORS[name]) || '#999999';
      swatches[name] = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><rect x="1.5" y="1.5" width="31" height="31" rx="8" fill="' + hex + '" stroke="#ffffff" stroke-width="3"/>' +
        '<rect x="0.75" y="0.75" width="32.5" height="32.5" rx="8.5" fill="none" stroke="#00000055" stroke-width="1.5"/></svg>');
    }
    return swatches[name];
  }
  Blockly.Blocks['fr_color'] = {
    init: function () {
      this.appendDummyInput().appendField('couleur du crayon').appendField(new Blockly.FieldDropdown(function () {
        var l = TB.opts.col && TB.opts.col.length ? TB.opts.col : ALL_COLORS;
        // on montre la couleur elle-même (pastille) plutôt que son nom
        return l.map(function (c) { return [{ src: swatch(c), width: 34, height: 34, alt: c }, c]; });
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

  /* ---------- Blocs du labyrinthe ---------- */
  var COND_OPTIONS = [['devant', 'devant'], ['à gauche', 'gauche'], ['à droite', 'droite']];
  Blockly.defineBlocksWithJsonArray([
    { type: 'lab_forward', message0: 'avancer', previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Avance d’une case.' },
    { type: 'lab_left', message0: 'tourner à gauche ↺', previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Pivote sur place vers la gauche.' },
    { type: 'lab_right', message0: 'tourner à droite ↻', previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Pivote sur place vers la droite.' },
    { type: 'lab_eat', message0: 'manger 🍓', previousStatement: null, nextStatement: null, colour: 20, tooltip: 'Mange la fraise de la case.' },
    {
      type: 'lab_until', message0: 'répéter jusqu’à l’arrivée', message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null, nextStatement: null, colour: 120, tooltip: 'Recommence jusqu’à ce que la tortue soit arrivée.'
    },
    {
      type: 'lab_if', message0: 'si chemin %1', args0: [{ type: 'field_dropdown', name: 'C', options: COND_OPTIONS }],
      message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null, nextStatement: null, colour: 45, tooltip: 'Fait les blocs seulement si le chemin est libre.'
    },
    {
      type: 'lab_ifelse', message0: 'si chemin %1', args0: [{ type: 'field_dropdown', name: 'C', options: COND_OPTIONS }],
      message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      message2: 'sinon %1', args2: [{ type: 'input_statement', name: 'ELSE' }],
      previousStatement: null, nextStatement: null, colour: 45, tooltip: 'Fait un groupe de blocs si le chemin est libre, un autre sinon.'
    }
  ]);
  G.forBlock['lab_forward'] = function () { return 'avancerCase();\n'; };
  G.forBlock['lab_left'] = function () { return 'tournerGauche();\n'; };
  G.forBlock['lab_right'] = function () { return 'tournerDroite();\n'; };
  G.forBlock['lab_eat'] = function () { return 'manger();\n'; };
  G.forBlock['lab_until'] = function (b, gen) {
    return 'while (!arrivee()) {\n' + gen.addLoopTrap(gen.statementToCode(b, 'DO'), b) + '}\n';
  };
  G.forBlock['lab_if'] = function (b, gen) {
    return "if (chemin('" + b.getFieldValue('C') + "')) {\n" + gen.statementToCode(b, 'DO') + '}\n';
  };
  G.forBlock['lab_ifelse'] = function (b, gen) {
    return "if (chemin('" + b.getFieldValue('C') + "')) {\n" + gen.statementToCode(b, 'DO') + '} else {\n' + gen.statementToCode(b, 'ELSE') + '}\n';
  };
  Blockly.defineBlocksWithJsonArray([
    {
      type: 'lab_while', message0: 'répéter tant que chemin %1', args0: [{ type: 'field_dropdown', name: 'C', options: COND_OPTIONS }],
      message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null, nextStatement: null, colour: 120, tooltip: 'Recommence tant que le chemin est libre.'
    },
    {
      type: 'lab_ifberry', message0: 'si fraise ici 🍓', message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null, nextStatement: null, colour: 45, tooltip: 'Fait les blocs seulement s’il y a une fraise sur la case.'
    }
  ]);
  G.forBlock['lab_while'] = function (b, gen) {
    return "while (chemin('" + b.getFieldValue('C') + "')) {\n" + gen.addLoopTrap(gen.statementToCode(b, 'DO'), b) + '}\n';
  };
  G.forBlock['lab_ifberry'] = function (b, gen) {
    return 'if (surFraise()) {\n' + gen.statementToCode(b, 'DO') + '}\n';
  };
  /* ---------- Blocs du robot (Usine à machines) ---------- */
  var ROB_COND = [['chemin devant', 'devant'], ['bouton ici', 'bouton']];
  Blockly.defineBlocksWithJsonArray([
    { type: 'rob_turn', message0: 'faire demi-tour ↺', previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Brickbot se retourne.' },
    { type: 'rob_press', message0: 'appuyer sur le bouton', previousStatement: null, nextStatement: null, colour: 20, tooltip: 'Appuie sur le bouton qui est sous Brickbot.' },
    {
      type: 'rob_if', message0: 'si %1', args0: [{ type: 'field_dropdown', name: 'C', options: ROB_COND }],
      message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null, nextStatement: null, colour: 45, tooltip: 'Fait les blocs seulement si c’est vrai.'
    },
    {
      type: 'rob_ifelse', message0: 'si %1', args0: [{ type: 'field_dropdown', name: 'C', options: ROB_COND }],
      message1: 'faire %1', args1: [{ type: 'input_statement', name: 'DO' }],
      message2: 'sinon %1', args2: [{ type: 'input_statement', name: 'ELSE' }],
      previousStatement: null, nextStatement: null, colour: 45, tooltip: 'Un groupe de blocs si c’est vrai, un autre sinon.'
    }
  ]);
  function robCond(b) { return b.getFieldValue('C') === 'bouton' ? 'surBouton()' : "chemin('devant')"; }
  G.forBlock['rob_turn'] = function () { return 'faireDemiTour();\n'; };
  G.forBlock['rob_press'] = function () { return 'appuyer();\n'; };
  G.forBlock['rob_if'] = function (b, gen) { return 'if (' + robCond(b) + ') {\n' + gen.statementToCode(b, 'DO') + '}\n'; };
  G.forBlock['rob_ifelse'] = function (b, gen) { return 'if (' + robCond(b) + ') {\n' + gen.statementToCode(b, 'DO') + '} else {\n' + gen.statementToCode(b, 'ELSE') + '}\n'; };
  G.addReservedWords('avancerCase,tournerGauche,tournerDroite,manger,chemin,arrivee,surFraise,faireDemiTour,appuyer,attendre,surBouton');

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

  /* Boîte à outils plate : tous les blocs du niveau sont visibles en permanence, sans sous-menu.
     env = { vars: [noms des variables], procs: [[nom, [paramètres]]] } (mis à jour quand l'enfant crée une fonction). */
  TB.buildToolbox = function (groups, env) {
    env = env || {};
    var has = function (g) { return groups.indexOf(g) >= 0; };
    var c = [], G6 = 4;
    function add(type, inputs, extra) { var o = blk(type, inputs); o.gap = G6; if (extra) for (var k in extra) o[k] = extra[k]; c.push(o); }
    if (has('lmove')) { add('lab_forward'); add('lab_left'); add('lab_right'); }
    if (has('leat')) add('lab_eat');
    if (has('lrep')) add('controls_repeat_ext', { TIMES: num('cnt') });
    if (has('luntil')) add('lab_until');
    if (has('rmove')) add('lab_forward');
    if (has('rturn')) add('rob_turn');
    if (has('rpress')) add('rob_press');
    if (has('rif')) { add('rob_if'); add('rob_ifelse'); }
    if (has('lwhile')) add('lab_while');
    if (has('lif')) { add('lab_if'); add('lab_ifelse'); }
    if (has('lberry')) add('lab_ifberry');
    if (has('fwd') || has('move')) {
      add('fr_forward', { N: num('len') });
      if (has('move')) { add('fr_right', { N: num('ang') }); add('fr_left', { N: num('ang') }); }
    }
    if (has('dir')) {
      add('fr_up', { N: num('len') }); add('fr_down', { N: num('len') });
      add('fr_west', { N: num('len') }); add('fr_east', { N: num('len') });
    }
    if (has('color')) add('fr_color');
    if (has('pen')) { add('fr_penup'); add('fr_pendown'); }
    if (has('loop')) add('controls_repeat_ext', { TIMES: num('cnt') });
    if (has('var')) {
      var vars = env.vars || [];
      if (vars.length) {
        add('variables_set', { VALUE: num('val') }, { fields: { VAR: { name: vars[0] } } });
        add('math_change', { DELTA: num('val') }, { fields: { VAR: { name: vars[0] } } });
        vars.slice(0, 4).forEach(function (v) { add('variables_get', null, { fields: { VAR: { name: v } } }); });
      }
    }
    if (has('math')) add('math_arithmetic', { A: num('val'), B: num('val') });
    if (has('func')) {
      add('procedures_defnoreturn');
      (env.procs || []).forEach(function (p) {
        var inputs = {};
        p[1].forEach(function (_, i) { inputs['ARG' + i] = num('val'); });
        add('procedures_callnoreturn', inputs, { extraState: { name: p[0], params: p[1] } });
      });
    }
    return { kind: 'flyoutToolbox', contents: c };
  };

  /* Échelle des blocs : grands quand il y en a peu, un peu plus petits quand la liste est longue. */
  TB.pickScale = function (def) {
    var n = def && def.contents ? def.contents.length : 8;
    return n <= 6 ? 1.2 : (n <= 9 ? 1.1 : (n <= 12 ? 1.0 : 0.9));
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
      case 'LF': return '<block type="lab_forward">' + nxt + '</block>';
      case 'LL': return '<block type="lab_left">' + nxt + '</block>';
      case 'LR': return '<block type="lab_right">' + nxt + '</block>';
      case 'LE': return '<block type="lab_eat">' + nxt + '</block>';
      case 'RT': return '<block type="rob_turn">' + nxt + '</block>';
      case 'RP': return '<block type="rob_press">' + nxt + '</block>';
      case 'rif': return '<block type="rob_if"><field name="C">' + s[1] + '</field><statement name="DO">' + chain(s[2]) + '</statement>' + nxt + '</block>';
      case 'rifelse': return '<block type="rob_ifelse"><field name="C">' + s[1] + '</field><statement name="DO">' + chain(s[2]) +
        '</statement><statement name="ELSE">' + chain(s[3]) + '</statement>' + nxt + '</block>';
      case 'while': return '<block type="lab_while"><field name="C">' + s[1] + '</field><statement name="DO">' + chain(s[2]) + '</statement>' + nxt + '</block>';
      case 'ifb': return '<block type="lab_ifberry"><statement name="DO">' + chain(s[1]) + '</statement>' + nxt + '</block>';
      case 'until': return '<block type="lab_until"><statement name="DO">' + chain(s[1]) + '</statement>' + nxt + '</block>';
      case 'if': return '<block type="lab_if"><field name="C">' + s[1] + '</field><statement name="DO">' + chain(s[2]) + '</statement>' + nxt + '</block>';
      case 'ifelse': return '<block type="lab_ifelse"><field name="C">' + s[1] + '</field><statement name="DO">' + chain(s[2]) +
        '</statement><statement name="ELSE">' + chain(s[3]) + '</statement>' + nxt + '</block>';
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
        case 'until': n += TB.dslCount(s[1]); break;
        case 'while': n += TB.dslCount(s[2]); break;
        case 'rif': n += TB.dslCount(s[2]); break;
        case 'rifelse': n += TB.dslCount(s[2]) + TB.dslCount(s[3]); break;
        case 'ifb': n += TB.dslCount(s[1]); break;
        case 'if': n += TB.dslCount(s[2]); break;
        case 'ifelse': n += TB.dslCount(s[2]) + TB.dslCount(s[3]); break;
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
    for (var i = 0; i < pool.length && s.length < n; i++) if (s.indexOf(pool[i]) < 0) s.push(pool[i]);
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
    o.len = TB.LENGTHS.slice();
    o.ang = pad(o.ang, [90, 60, 120, 45, 30, 72, 135, 144, 150, 180], 4);
    o.val = pad(o.val, [100, 200, 400, 50, 20, 10, 5, 360, 720, 2, 3, 1], 4);
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
