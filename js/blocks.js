/* Tortue Blocs — définition des blocs, générateur de code, boîte à outils, DSL des solutions */
(function () {
  'use strict';
  var TB = (window.TB = window.TB || {});
  // Selon la version de Blockly, le générateur est Blockly.JavaScript ou Blockly.JavaScript.javascriptGenerator.
  var G = Blockly.JavaScript.javascriptGenerator || Blockly.JavaScript;
  var ORDER_NONE = G.ORDER_NONE !== undefined ? G.ORDER_NONE : 99;

  var COLOR_OPTIONS = [['rouge', 'rouge'], ['orange', 'orange'], ['jaune', 'jaune'], ['vert', 'vert'],
    ['bleu', 'bleu'], ['violet', 'violet'], ['rose', 'rose'], ['noir', 'noir']];

  /* ---------- Blocs ---------- */
  Blockly.defineBlocksWithJsonArray([
    {
      type: 'fr_forward', message0: 'avancer de %1', args0: [{ type: 'input_value', name: 'N', check: 'Number' }],
      previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Fait avancer la tortue (en traçant si le crayon est baissé).'
    },
    {
      type: 'fr_right', message0: 'tourner à droite de %1 °', args0: [{ type: 'input_value', name: 'N', check: 'Number' }],
      previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Fait pivoter la tortue vers la droite.'
    },
    {
      type: 'fr_left', message0: 'tourner à gauche de %1 °', args0: [{ type: 'input_value', name: 'N', check: 'Number' }],
      previousStatement: null, nextStatement: null, colour: 210, tooltip: 'Fait pivoter la tortue vers la gauche.'
    },
    {
      type: 'fr_color', message0: 'couleur du crayon %1', args0: [{ type: 'field_dropdown', name: 'C', options: COLOR_OPTIONS }],
      previousStatement: null, nextStatement: null, colour: 20, tooltip: 'Change la couleur du trait.'
    },
    { type: 'fr_penup', message0: 'lever le crayon', previousStatement: null, nextStatement: null, colour: 20, tooltip: 'La tortue avance sans dessiner.' },
    { type: 'fr_pendown', message0: 'baisser le crayon', previousStatement: null, nextStatement: null, colour: 20, tooltip: 'La tortue dessine quand elle avance.' }
  ]);
  Blockly.Blocks['fr_start'] = {
    init: function () {
      this.jsonInit({ message0: '▶ quand on exécute', nextStatement: null, style: 'hat_blocks', tooltip: 'Le programme commence ici.' });
      this.setDeletable(false);
    }
  };

  /* ---------- Générateur JavaScript ---------- */
  G.forBlock['fr_start'] = function () { return ''; };
  function numberStmt(fn) {
    return function (block, gen) {
      var v = gen.valueToCode(block, 'N', ORDER_NONE) || '0';
      return fn + '(' + v + ');\n';
    };
  }
  G.forBlock['fr_forward'] = numberStmt('avancer');
  G.forBlock['fr_right'] = numberStmt('droite');
  G.forBlock['fr_left'] = numberStmt('gauche');
  G.forBlock['fr_color'] = function (b) { return "couleur('" + b.getFieldValue('C') + "');\n"; };
  G.forBlock['fr_penup'] = function () { return 'leverCrayon();\n'; };
  G.forBlock['fr_pendown'] = function () { return 'baisserCrayon();\n'; };
  G.addReservedWords('avancer,droite,gauche,couleur,leverCrayon,baisserCrayon,highlightBlock,loopBudget');
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

  /* Nombre de blocs « utiles » (hors départ, hors nombres). */
  TB.countBlocks = function (ws) {
    return ws.getAllBlocks(false).filter(function (b) {
      return !b.isShadow() && b.type !== 'fr_start' && b.type !== 'math_number';
    }).length;
  };

  /* ---------- Boîte à outils ---------- */
  function num(v) { return { shadow: { type: 'math_number', fields: { NUM: v } } }; }
  function blk(type, inputs, fields) {
    var o = { kind: 'block', type: type };
    if (inputs) o.inputs = inputs;
    if (fields) o.fields = fields;
    return o;
  }

  TB.buildToolbox = function (groups) {
    var has = function (g) { return groups.indexOf(g) >= 0; };
    var cats = [], c;
    if (has('fwd') || has('move')) {
      c = [blk('fr_forward', { N: num(100) })];
      if (has('move')) { c.push(blk('fr_right', { N: num(90) })); c.push(blk('fr_left', { N: num(90) })); }
      cats.push({ kind: 'category', name: 'Mouvements', colour: '210', contents: c });
    }
    if (has('color') || has('pen')) {
      c = [];
      if (has('color')) c.push(blk('fr_color'));
      if (has('pen')) { c.push(blk('fr_penup')); c.push(blk('fr_pendown')); }
      cats.push({ kind: 'category', name: 'Crayon', colour: '20', contents: c });
    }
    if (has('loop')) {
      cats.push({ kind: 'category', name: 'Boucles', colour: '120', contents: [blk('controls_repeat_ext', { TIMES: num(4) })] });
    }
    if (has('var')) cats.push({ kind: 'category', name: 'Variables', colour: '330', custom: 'VARIABLE' });
    if (has('math')) {
      cats.push({
        kind: 'category', name: 'Calculs', colour: '230', contents: [
          blk('math_number', null, { NUM: 10 }),
          blk('math_arithmetic', { A: num(1), B: num(1) })
        ]
      });
    }
    if (has('func')) cats.push({ kind: 'category', name: 'Fonctions', colour: '290', custom: 'PROCEDURE' });
    if (cats.length === 1 && !cats[0].custom) return { kind: 'flyoutToolbox', contents: cats[0].contents };
    return { kind: 'categoryToolbox', contents: cats };
  };

  /* ---------- DSL des solutions -> XML Blockly ---------- */
  /* Instructions : ['fd',e] ['rt',e] ['lt',e] ['color','rouge'] ['up'] ['down']
     ['repeat',e,[...]] ['set','v',e] ['add','v',e] ['def','nom',['param'..],[...]] ['call','nom',[e..]]
     Expressions : nombre | 'variable' | ['+'|'-'|'*'|'/', a, b] */
  var OPS = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function exp(e) {
    if (typeof e === 'number') return '<block type="math_number"><field name="NUM">' + e + '</field></block>';
    if (typeof e === 'string') return '<block type="variables_get"><field name="VAR">' + esc(e) + '</field></block>';
    return '<block type="math_arithmetic"><field name="OP">' + OPS[e[0]] + '</field>' +
      '<value name="A">' + exp(e[1]) + '</value><value name="B">' + exp(e[2]) + '</value></block>';
  }
  function val(name, e) { return '<value name="' + name + '">' + exp(e) + '</value>'; }

  function stmt(s, rest) {
    var nxt = rest ? '<next>' + rest + '</next>' : '';
    var k = s[0], body;
    switch (k) {
      case 'fd': body = '<block type="fr_forward">' + val('N', s[1]) + nxt + '</block>'; break;
      case 'rt': body = '<block type="fr_right">' + val('N', s[1]) + nxt + '</block>'; break;
      case 'lt': body = '<block type="fr_left">' + val('N', s[1]) + nxt + '</block>'; break;
      case 'color': body = '<block type="fr_color"><field name="C">' + s[1] + '</field>' + nxt + '</block>'; break;
      case 'up': body = '<block type="fr_penup">' + nxt + '</block>'; break;
      case 'down': body = '<block type="fr_pendown">' + nxt + '</block>'; break;
      case 'repeat':
        body = '<block type="controls_repeat_ext">' + val('TIMES', s[1]) +
          '<statement name="DO">' + chain(s[2]) + '</statement>' + nxt + '</block>';
        break;
      case 'set':
        body = '<block type="variables_set"><field name="VAR">' + esc(s[1]) + '</field>' + val('VALUE', s[2]) + nxt + '</block>';
        break;
      case 'add':
        body = '<block type="math_change"><field name="VAR">' + esc(s[1]) + '</field>' + val('DELTA', s[2]) + nxt + '</block>';
        break;
      case 'call': {
        var args = s[2] || [], m = '<mutation name="' + esc(s[1]) + '">', v = '';
        // Les noms des paramètres sont recopiés depuis la définition (voir dslToXml).
        for (var i = 0; i < args.length; i++) v += val('ARG' + i, args[i]);
        body = '<block type="procedures_callnoreturn">' + m + '@@ARGS:' + esc(s[1]) + '@@</mutation>' + v + nxt + '</block>';
        break;
      }
      default: throw new Error('instruction inconnue : ' + k);
    }
    return body;
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
      xml += '<block type="procedures_defnoreturn" x="' + (330) + '" y="' + (20 + i * 190) + '">' +
        '<mutation>' + args + '</mutation><field name="NAME">' + esc(d[1]) + '</field>' +
        '<statement name="STACK">' + chain(d[3]) + '</statement></block>';
    });
    xml += '<block type="fr_start" x="20" y="20" deletable="false">' + (main.length ? '<next>' + chain(main) + '</next>' : '') + '</block>';
    xml += '</xml>';
    xml = xml.replace(/@@ARGS:([^@]*)@@/g, function (_, name) {
      var key = name.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      return (params[key] || []).map(function (p) { return '<arg name="' + esc(p) + '"></arg>'; }).join('');
    });
    return xml;
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
        case 'fd': case 'rt': case 'lt': n += countExp(s[1]); break;
        case 'repeat': n += countExp(s[1]) + TB.dslCount(s[2]); break;
        case 'set': case 'add': n += countExp(s[2]); break;
        case 'def': n += TB.dslCount(s[3]); break;
        case 'call': (s[2] || []).forEach(function (a) { n += countExp(a); }); break;
      }
    });
    return n;
  };

  /* Charge un XML dans un espace de travail. */
  TB.loadXml = function (ws, xml) {
    var dom = Blockly.utils.xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, ws);
  };
})();
