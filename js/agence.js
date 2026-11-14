/* Labo Code — Agence Z : messages secrets, binaire et cryptographie.
   36 missions en 6 séries, histoire, grades, dossier secret, message pour un ami. Tout est original. */
(function () {
  'use strict';
  var App = window.App, $ = App.$, esc = App.esc;
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var SYMBOLS = ['🍎', '🍌', '🍒', '🐶', '🐘', '🐸', '🍇', '🏠', '🍦', '🃏', '🔑', '🦁', '🌙', '🥜', '🐙', '🐧', '👑', '🌈', '⭐', '🌳', '☂️', '🎻', '🐋', '❌', '🧶', '🦓'];
  var MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
  var POLY = ['ABCDE', 'FGHIK', 'LMNOP', 'QRSTU', 'VWXYZ'];

  /* ---------- outils de codage ---------- */
  function norm(s) { return String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z]/g, ''); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function between(a, b) { return a + rnd(b - a + 1); }
  function caesar(text, k) { return text.replace(/[A-Z]/g, function (c) { return ALPHA[(ALPHA.indexOf(c) + k % 26 + 26) % 26]; }); }
  function bin(n, w) { var s = n.toString(2); while (s.length < w) s = '0' + s; return s; }
  function letterBits(c) { return bin(ALPHA.indexOf(c) + 1, 5); }
  function polyCode(c) { if (c === 'J') c = 'I'; for (var r = 0; r < 5; r++) { var i = POLY[r].indexOf(c); if (i >= 0) return (r + 1) + '' + (i + 1); } return '??'; }
  function atbash(t) { return t.replace(/[A-Z]/g, function (c) { return ALPHA[25 - ALPHA.indexOf(c)]; }); }
  function reverseText(t) { return t.split('').reverse().join(''); }
  function toSymbols(t) { return t.split('').map(function (c) { return c === ' ' ? ' ' : SYMBOLS[ALPHA.indexOf(c)]; }).join(''); }
  function parityOk(bits) { return (bits.split('1').length - 1) % 2 === 0; }

  /* ---------- messages (tous sans accent, adaptés aux enfants) ---------- */
  var W3S = ['SEL', 'EAU', 'FEU', 'ROI', 'LIT', 'RAT', 'OIE', 'ARC', 'NEZ', 'BUS', 'VIN', 'MUR', 'OUI', 'NON'];
  var W34 = W3S.concat(['CHAT', 'LUNE', 'PAIN', 'LOUP', 'ROSE', 'BOIS', 'MIEL', 'PORT', 'CLEF', 'NUIT', 'LAIT']);
  var W5E = ['ECOLE', 'NEIGE', 'TIGRE', 'AGENT', 'ROBOT', 'FUSEE', 'OCEAN', 'CARTE', 'PLAGE', 'LIVRE', 'FLEUR', 'PIANO', 'TRAIN'];
  var W56 = W5E.concat(['PIRATE', 'SECRET', 'COFFRE', 'ESPION', 'TRESOR', 'SOLEIL', 'JARDIN', 'CHEVAL']);
  var P2 = ['LE CHAT', 'UN ROBOT', 'LA LUNE', 'CODE SECRET', 'MON AMI', 'LE COFFRE', 'UN TRESOR', 'AU REVOIR', 'BONNE NUIT', 'LE PIRATE', 'MON AGENT', 'LE JARDIN'];
  var P3 = ['LE CHAT DORT', 'LA LUNE BRILLE', 'UN ROBOT AMI', 'LE TRESOR EST ICI', 'MON AMI EST LA', 'LA CLE EST PERDUE', 'VIVE LES AGENTS', 'LE COFFRE EST FERME'];
  var P4 = ['LE TRESOR EST CACHE DANS LE JARDIN', 'RENDEZ VOUS A MIDI SOUS LE GRAND PONT', 'LA CLE EST SOUS LE TAPIS ROUGE', 'LE ROBOT A MANGE TOUS LES GATEAUX', 'MISSION TERMINEE BRAVO A TOUS LES AGENTS', 'LE PIGEON DORE VOLE AU CLAIR DE LUNE'];
  var POOLS = { w3s: W3S, w34: W34, w5e: W5E.filter(function (w) { return w.indexOf('J') < 0; }), w56: W56, p2: P2, p3: P3, p4: P4 };
  function text(pool) { return pick(POOLS[pool]); }

  /* ---------- sons : morse ---------- */
  var actx = null;
  function tone(t0, dur, f) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f || 620;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
    g.gain.setValueAtTime(0.3, t0 + dur - 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function playMorse(word) {
    if (!App.data.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + 0.05, u = 0.1;
      norm(word).split('').forEach(function (c) {
        MORSE[c].split('').forEach(function (s) { var d = s === '.' ? u : 3 * u; tone(t, d); t += d + u; });
        t += 2 * u;
      });
    } catch (e) { /* pas de son */ }
  }
  function playSymbol(s) {
    if (!App.data.sound) return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); tone(actx.currentTime + 0.01, s === '.' ? 0.1 : 0.3); } catch (e) { /* ignoré */ }
  }

  /* ---------- séries, histoire ---------- */
  var SERIES = [
    { n: 1, name: 'Codes à symboles', icon: '🍎', badge: '🥉', title: 'Le message sous la porte', desc: 'Un code, c’est une table qui remplace chaque lettre par un autre signe.',
      intro: 'Agent, un message a été glissé sous la porte de l’Agence Z. Il est écrit avec des petits dessins !' },
    { n: 2, name: 'Chiffre de César', icon: '🎡', badge: '🥈', title: 'La roue du voleur', desc: 'Décale toutes les lettres du même nombre de pas : la roue de César !',
      intro: 'Nous avons trouvé une roue de carton près de la cage. Elle sert à décaler l’alphabet.' },
    { n: 3, name: 'Le binaire', icon: '🔢', badge: '🥇', title: 'Les cartes du coffre', desc: 'Les ordinateurs ne comptent qu’avec des 0 et des 1.',
      intro: 'Un coffre s’ouvre avec des cartes magiques : chaque carte retournée ajoute sa valeur.' },
    { n: 4, name: 'Texte en binaire', icon: '💾', badge: '🏅', title: 'La cassette binaire', desc: 'Chaque lettre devient un nombre, puis des 0 et des 1.',
      intro: 'Une cassette contient un message en zéros et en uns. A = 1, B = 2, C = 3…' },
    { n: 5, name: 'Autres codes', icon: '📡', badge: '🎖️', title: 'L’horloge qui clignote', desc: 'Morse, miroir, grille secrète : les espions ont plus d’un tour dans leur sac.',
      intro: 'La tour de l’horloge clignote par éclairs longs et courts. Est-ce du morse ?' },
    { n: 6, name: 'Opérations spéciales', icon: '🕶️', badge: '🏆', title: 'Le dernier code', desc: 'Doubles codes, lettres les plus fréquentes, erreurs de transmission…',
      intro: 'Le voleur a mélangé plusieurs codes pour brouiller les pistes. Montre ce que tu sais !' }
  ];
  var STORY = [
    ['Un matin, un message mystérieux est glissé sous la porte de l’Agence Z.', 'Il est écrit avec des petits dessins : un code de la Centrale !', 'Tu le décodes : « Le pigeon doré a disparu ».', 'Le pigeon doré est la mascotte de l’Agence, adorée de tous les agents.', 'Il ne s’est pas envolé : quelqu’un l’a pris pendant la nuit.', 'La Centrale t’ordonne d’enquêter. Ton enquête commence !'],
    ['Près de la cage vide, tu trouves une roue en carton oubliée.', 'C’est une roue de César, utilisée par les espions depuis l’Antiquité.', 'Le voleur a laissé un papier codé avec cette roue.', 'Chaque lettre est décalée dans l’alphabet : il faut deviner de combien.', 'Tu maîtrises le décalage : le voleur aime décaler ses mots !', 'Le papier parle d’un rendez-vous dans le vieux phare.'],
    ['Au phare, un coffre est fermé par un code à cartes magiques.', 'Chaque carte vaut 1, 2, 4, 8 ou 16 quand on la retourne.', 'Tu comprends que les ordinateurs comptent avec des 0 et des 1.', 'Le coffre s’ouvre quand le bon nombre apparaît.', 'À l’intérieur, une cassette pleine de zéros et de uns.', 'La cassette contient un message en langage binaire !'],
    ['Chaque lettre de la cassette est un nombre écrit en binaire.', 'A vaut 1, B vaut 2, C vaut 3, et ainsi de suite.', 'Tu traduis les zéros et les uns en lettres, une par une.', 'Le message dit : « Cherche là où brille le soleil du soir ».', 'Tu écris ton propre nom en binaire dans le registre du phare.', 'Un dernier indice t’envoie vers la tour de l’horloge.'],
    ['La tour de l’horloge clignote par éclairs longs et courts.', 'C’est du morse, le langage des phares et des marins !', 'Tu notes les points et les traits.', 'Tu réponds en tapant sur ta lampe : le voleur te répond !', 'Derrière le cadran, un papier est écrit comme dans un miroir.', 'Une grille secrète apparaît : un code à coordonnées !'],
    ['Le voleur a mélangé plusieurs codes pour brouiller les pistes.', 'Mais les lettres les plus fréquentes le trahissent.', 'Tu repères l’erreur de transmission grâce au bit de parité.', 'Le message se lit avec l’alphabet inversé : A devient Z !', 'Tu retrouves le pigeon doré, sain et sauf, dans le grenier.', 'Bravo, agent ! La Centrale te nomme Chef de l’Agence Z.']
  ];
  var GRADES = [[0, 'Recrue'], [60, 'Agent'], [150, 'Agent spécial'], [250, 'Agent secret'], [340, 'Chef de la Centrale']];
  function grade(pts) {
    var i = 0; GRADES.forEach(function (g, k) { if (pts >= g[0]) i = k; });
    var next = GRADES[i + 1];
    return { name: GRADES[i][1], next: next ? next[1] : null, left: next ? next[0] - pts : 0, pct: next ? Math.round((pts - GRADES[i][0]) / (next[0] - GRADES[i][0]) * 100) : 100 };
  }

  /* ---------- les types de missions ---------- */
  var KB_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];
  function wordsLens(plain) { return plain.split(' ').map(function (w) { return w.length; }); }
  function slots(inst, typed) {
    var i = 0;
    return inst.lens.map(function (n) {
      var h = '<span class="word">';
      for (var k = 0; k < n; k++, i++) h += '<span class="slot' + (i === typed.length ? ' cur' : '') + '">' + (typed[i] || '') + '</span>';
      return h + '</span>';
    }).join('');
  }
  function typedBlank() { return { typed: '' }; }
  function typedSolve(inst, st) { st.typed = inst.expected; }
  function typedCheck(inst, st) {
    var ok = st.typed === inst.expected, good = 0;
    for (var i = 0; i < inst.expected.length; i++) if (st.typed[i] === inst.expected[i]) good++;
    return { ok: ok, detail: ok ? '' : (st.typed.length < inst.expected.length ? 'Il manque des lettres : ' + st.typed.length + ' sur ' + inst.expected.length + '.' : good + ' lettres justes sur ' + inst.expected.length + '.') };
  }
  function letterInst(plain, extra) {
    var inst = { plain: plain, expected: norm(plain), lens: wordsLens(plain) };
    for (var k in extra) inst[k] = extra[k];
    return inst;
  }
  function tokenRow(items) { return '<div class="tokens">' + items.join('') + '</div>'; }
  function bigText(t) { return '<div class="bigtext">' + esc(t) + '</div>'; }

  /* Roue de César : anneau extérieur fixe (clair) ; anneau intérieur décalé de k (codé). */
  function wheelHtml(k, showPreview, preview) {
    var step = 360 / 26, outer = '', inner = '';
    for (var i = 0; i < 26; i++) {
      outer += '<text transform="rotate(' + (i * step).toFixed(2) + ') translate(0,-101)" text-anchor="middle" class="wo">' + ALPHA[i] + '</text>';
      inner += '<text transform="rotate(' + (i * step).toFixed(2) + ') translate(0,-70)" text-anchor="middle" class="wi">' + ALPHA[i] + '</text>';
    }
    return '<div class="wheelbox"><svg viewBox="-120 -120 240 240" class="wheel"><circle r="118" class="wr1"/><circle r="84" class="wr2"/><circle r="52" class="wr3"/>' +
      '<g>' + outer + '</g><g transform="rotate(' + (-k * step).toFixed(2) + ')">' + inner + '</g>' +
      '<text y="9" text-anchor="middle" class="wc">+' + k + '</text></svg>' +
      '<div class="wctl"><button class="btn small" data-act="wl">◀</button><span>Décalage : <b>' + k + '</b></span><button class="btn small" data-act="wr">▶</button></div>' +
      '<div class="wnote">Haut : lettre claire · Bas (rouge) : lettre codée</div>' +
      (showPreview !== undefined ? '<div class="wprev"><button class="btn small" data-act="test">🔍 Tester ce décalage</button>' + (preview ? '<div class="wp">' + esc(preview) + '</div>' : '') + '</div>' : '') + '</div>';
  }

  /* Tableaux de référence affichés à côté de l'énigme. */
  function refHtml(kind) {
    var title, items, cols = 3;
    if (kind === 'symbols') {
      title = '📖 Table des symboles'; cols = 4;
      items = ALPHA.split('').map(function (c, i) { return '<span class="rc"><b>' + c + '</b>' + SYMBOLS[i] + '</span>'; });
    } else if (kind === 'bin') {
      title = '💾 Lettre · numéro · binaire'; cols = 3;
      items = ALPHA.split('').map(function (c, i) { return '<span class="rc"><b>' + c + '</b><i>' + (i + 1) + '</i>' + letterBits(c) + '</span>'; });
    } else if (kind === 'morse') {
      title = '📡 Table du morse'; cols = 3;
      items = ALPHA.split('').map(function (c) { return '<span class="rc"><b>' + c + '</b>' + MORSE[c].replace(/\./g, '•').replace(/-/g, '–') + '</span>'; });
    } else if (kind === 'atbash') {
      title = '🪞 Alphabet inversé'; cols = 4;
      items = ALPHA.split('').map(function (c) { return '<span class="rc"><b>' + c + '</b>' + atbash(c) + '</span>'; });
    } else {
      title = '🧩 Grille secrète';
      return '<div class="ref"><h4>' + title + '</h4><table class="poly"><tr><th></th>' + [1, 2, 3, 4, 5].map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' +
        POLY.map(function (r, i) { return '<tr><th>' + (i + 1) + '</th>' + r.split('').map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table><p class="small">I et J partagent la même case.</p></div>';
    }
    return '<div class="ref"><h4>' + title + '</h4><div class="rgrid c' + cols + '">' + items.join('') + '</div></div>';
  }

  function cardsHtml(values, bits, interactive) {
    return '<div class="cards">' + values.map(function (v, i) {
      return '<button class="bcard ' + (bits[i] ? 'on' : 'off') + '" ' + (interactive ? 'data-act="card" data-i="' + i + '"' : 'disabled') + '><b>' + v + '</b><span>' + (bits[i] ? '1' : '0') + '</span></button>';
    }).join('') + '</div>';
  }
  function bitRowHtml(r, bits, row, interactive, labelRow) {
    var vals = [16, 8, 4, 2, 1];
    return '<div class="bitrow">' + (labelRow ? '<div class="bitlabels">' + vals.map(function (v) { return '<i>' + v + '</i>'; }).join('') + '</div>' : '') +
      '<div class="bits">' + bits.split('').map(function (b, c) { return '<button class="bit ' + (b === '1' ? 'on' : '') + '" ' + (interactive ? 'data-act="bit" data-r="' + r + '" data-c="' + c + '"' : 'disabled') + '>' + b + '</button>'; }).join('') + '</div></div>';
  }

  var KINDS = {
    /* ---- symboles ---- */
    symDec: {
      input: 'letters', icon: '🔍', tool: 'symbols', side: function () { return refHtml('symbols'); },
      build: function (m) { return letterInst(text(m.pool)); },
      panel: function (inst, st) { return tokenRow(toSymbols(inst.plain).split(' ').map(function (w) { return '<span class="tokword">' + w + '</span>'; })) + '<div class="answer" id="ans">' + slots(inst, st.typed) + '</div>'; },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Ouvre la 📖 table des symboles : trouve chaque dessin dans la table et note sa lettre.'
    },
    symEnc: {
      input: 'symbols', icon: '✍️', tool: 'symbols', side: function () { return refHtml('symbols'); },
      build: function (m) { var p = text(m.pool); return { plain: p, expected: norm(p) }; },
      panel: function (inst, st) { return bigText(inst.plain) + '<div class="answer symans" id="ans">' + (st.seq.length ? st.seq.map(function (c) { return SYMBOLS[ALPHA.indexOf(c)]; }).join(' ') : '<span class="ph">Compose ton message codé avec les dessins ci-dessous</span>') + '</div>'; },
      blank: function () { return { seq: [] }; }, solve: function (inst, st) { st.seq = inst.expected.split(''); },
      check: function (inst, st) { var ok = st.seq.join('') === inst.expected; return { ok: ok, detail: ok ? '' : 'Vérifie chaque lettre dans la table : ' + st.seq.length + ' dessins sur ' + inst.expected.length + '.' }; },
      hint: 'Pour chaque lettre du mot, cherche son dessin dans la 📖 table et touche-le.'
    },
    /* ---- César ---- */
    casDec: {
      input: 'letters', icon: '🎡', tool: 'caesar',
      build: function (m) { var k = m.shift || between(m.kmin, m.kmax), p = text(m.pool); return letterInst(p, { k: k, cipher: caesar(norm(p).length ? p : p, k), known: m.known !== false }); },
      panel: function (inst, st) {
        return bigText(inst.cipher) + (inst.known ? '<div class="keyinfo">🔑 Clé : décalage de <b>' + inst.k + '</b></div>' : '<div class="keyinfo">🔑 Clé inconnue : tourne la roue et teste !</div>') +
          '<div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      sideKind: 'wheel', side: function (inst, st) { return wheelHtml(st.w, inst.known ? undefined : true, st.preview ? caesar(inst.cipher, -st.w) : ''); },
      blank: function () { return { typed: '', w: 0, preview: false }; }, solve: typedSolve, check: typedCheck,
      hint: 'Pour décoder : trouve la lettre codée sur l’anneau du bas, et lis la vraie lettre sur l’anneau du haut. Mets la roue sur la bonne clé !'
    },
    casEnc: {
      input: 'letters', icon: '🎡', tool: 'caesar',
      build: function (m) { var k = between(m.kmin, m.kmax), p = text(m.pool); return { plain: p, k: k, expected: norm(caesar(p, k)), lens: wordsLens(p) }; },
      panel: function (inst, st) {
        return bigText(inst.plain) + '<div class="keyinfo">🔑 Clé : décalage de <b>' + inst.k + '</b></div><div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      sideKind: 'wheel', side: function (inst, st) { return wheelHtml(st.w); },
      blank: function () { return { typed: '', w: 0 }; }, solve: typedSolve, check: typedCheck,
      hint: 'Pour coder : trouve la vraie lettre sur l’anneau du haut, et lis la lettre codée sur l’anneau du bas.'
    },
    casFind: {
      input: 'none', icon: '🕵️', tool: 'caesar', action: '✅ C’est ce décalage !',
      build: function (m) { var k = between(m.kmin, m.kmax), p = text(m.pool); return { plain: p, k: k, cipher: caesar(p, k) }; },
      panel: function (inst, st) {
        return bigText(inst.cipher) + '<div class="keyinfo">🔑 Quel décalage a été utilisé ? Teste-les avec la roue : le bon donne des mots qui ont un sens.</div>';
      },
      sideKind: 'wheel', side: function (inst, st) { return wheelHtml(st.w, true, st.preview ? caesar(inst.cipher, -st.w) : ''); },
      blank: function () { return { w: 0, preview: false }; }, solve: function (inst, st) { st.w = inst.k; },
      check: function (inst, st) { var ok = st.w === inst.k; return { ok: ok, detail: ok ? '' : 'Ce décalage ne donne pas un message qui a du sens. Essaie un autre !' }; },
      hint: 'Appuie sur « Tester ce décalage » pour chaque position de la roue, jusqu’à lire de vrais mots.'
    },
    /* ---- binaire ---- */
    binBuild: {
      input: 'none', icon: '🃏', tool: 'bin', action: '🔓 Ouvrir le coffre',
      build: function (m) { var vals = [32, 16, 8, 4, 2, 1].slice(6 - m.cards); var t = m.target || between(m.tmin, m.tmax); return { vals: vals, target: t }; },
      panel: function (inst, st) {
        var sum = 0; inst.vals.forEach(function (v, i) { if (st.bits[i]) sum += v; });
        return '<div class="target">Fais apparaître le nombre <b>' + inst.target + '</b></div>' + cardsHtml(inst.vals, st.bits, true) +
          '<div class="keyinfo">Cartes retournées : ' + (inst.vals.filter(function (v, i) { return st.bits[i]; }).join(' + ') || 'aucune') + ' = <b>' + sum + '</b></div>';
      },
      blank: function (inst) { return { bits: inst.vals.map(function () { return 0; }) }; },
      solve: function (inst, st) { var t = inst.target; st.bits = inst.vals.map(function (v) { if (t >= v) { t -= v; return 1; } return 0; }); },
      check: function (inst, st) { var s = 0; inst.vals.forEach(function (v, i) { if (st.bits[i]) s += v; }); return { ok: s === inst.target, detail: s === inst.target ? '' : 'Tes cartes font ' + s + ', il faut ' + inst.target + '.' }; },
      hint: 'Commence par la plus grande carte qui ne dépasse pas le nombre, puis continue avec ce qui reste.'
    },
    binRead: {
      input: 'digits', icon: '👀', tool: 'bin',
      build: function (m) { var vals = [32, 16, 8, 4, 2, 1].slice(6 - m.cards), n = between(m.tmin, m.tmax); return { vals: vals, n: n, expected: String(n) }; },
      panel: function (inst, st) {
        var t = inst.n, bits = inst.vals.map(function (v) { if (t >= v) { t -= v; return 1; } return 0; });
        return '<div class="target">Quel nombre les cartes montrent-elles ?</div>' + cardsHtml(inst.vals, bits, false) + '<div class="answer" id="ans"><span class="bignum">' + (st.typed || '?') + '</span></div>';
      },
      blank: typedBlank, solve: typedSolve,
      check: function (inst, st) { var ok = st.typed === inst.expected; return { ok: ok, detail: ok ? '' : 'Additionne seulement les cartes retournées (celles qui montrent 1).' }; },
      hint: 'Additionne les valeurs des cartes qui montrent un 1.'
    },
    /* ---- lettres en binaire ---- */
    letEnc: {
      input: 'none', icon: '💾', tool: 'bin', action: '✅ Envoyer', side: function () { return refHtml('bin'); },
      build: function (m) {
        var w = m.name ? (norm(App.profile ? App.data.current : '').slice(0, 6) || 'AGENT') : (m.pool ? pick(POOLS[m.pool]) : ALPHA[rnd(16)]);
        return { plain: w, letters: w.split('') };
      },
      panel: function (inst, st) {
        return '<div class="target">Écris en binaire (A = 1, B = 2, C = 3…)</div><div class="rows">' + inst.letters.map(function (c, r) {
          return '<div class="lrow"><span class="lt">' + c + '</span>' + bitRowHtml(r, st.rows[r], null, true, r === 0) + '</div>';
        }).join('') + '</div>';
      },
      blank: function (inst) { return { rows: inst.letters.map(function () { return '00000'; }) }; },
      solve: function (inst, st) { st.rows = inst.letters.map(letterBits); },
      check: function (inst, st) {
        var bad = inst.letters.filter(function (c, r) { return st.rows[r] !== letterBits(c); });
        return { ok: !bad.length, detail: bad.length ? 'La lettre ' + bad[0] + ' n’est pas bonne : c’est la n° ' + (ALPHA.indexOf(bad[0]) + 1) + '.' : '' };
      },
      hint: 'Trouve le numéro de la lettre (A = 1…), puis allume les cartes 16, 8, 4, 2, 1 qui le forment.'
    },
    letDec: {
      input: 'letters', icon: '🔓', tool: 'bin', side: function () { return refHtml('bin'); },
      build: function (m) { var w = m.one ? ALPHA[rnd(16)] : (m.pool ? pick(POOLS[m.pool]) : 'AGENT'); return { plain: w, expected: w, lens: [w.length] }; },
      panel: function (inst, st) {
        return '<div class="target">Décode le message binaire</div><div class="rows rowsrow">' + inst.plain.split('').map(function (c, r) { return bitRowHtml(r, letterBits(c), null, false, r === 0); }).join('') +
          '</div><div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Additionne les cartes allumées (16, 8, 4, 2, 1) pour trouver le numéro, puis la lettre (1 = A, 2 = B…). Regarde la 📖 table.'
    },
    /* ---- morse, miroir, grille ---- */
    morseDec: {
      input: 'letters', icon: '📡', tool: 'morse', side: function () { return refHtml('morse'); },
      build: function (m) { var w = m.fixed || text(m.pool); return { plain: w, expected: w, lens: [w.length] }; },
      panel: function (inst, st) {
        return '<div class="tokens">' + inst.plain.split('').map(function (c) { return '<span class="morse">' + MORSE[c].replace(/\./g, '•').replace(/-/g, '–') + '</span>'; }).join('') + '</div>' +
          '<button class="btn small" data-act="play">🔊 Écouter</button><div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Ouvre la 📖 table du morse : • est un point court, – est un trait long.'
    },
    morseListen: {
      input: 'letters', icon: '🎧', tool: 'morse', side: function () { return refHtml('morse'); },
      build: function (m) { var w = text(m.pool); return { plain: w, expected: w, lens: [w.length] }; },
      panel: function (inst, st) {
        return '<div class="target">Écoute le message (court = point, long = trait)</div><button class="btn go" data-act="play">🔊 Écouter</button>' +
          '<div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Écoute plusieurs fois, note les sons courts et longs, puis cherche-les dans la 📖 table du morse.'
    },
    morseEnc: {
      input: 'morse', icon: '💡', tool: 'morse', side: function () { return refHtml('morse'); },
      build: function (m) { var w = text(m.pool); return { plain: w, expected: w.split('').map(function (c) { return MORSE[c]; }) }; },
      panel: function (inst, st) {
        return bigText(inst.plain) + '<div class="answer morseans" id="ans">' + (st.groups.join('') === '' && st.groups.length === 1 ? '<span class="ph">Tape sur • et – (puis « lettre suivante »)</span>' :
          st.groups.map(function (g) { return '<span class="mg">' + (g.replace(/\./g, '•').replace(/-/g, '–') || '…') + '</span>'; }).join(' ')) + '</div>';
      },
      blank: function () { return { groups: [''] }; }, solve: function (inst, st) { st.groups = inst.expected.slice(); },
      check: function (inst, st) {
        var g = st.groups.slice(); while (g.length > 1 && g[g.length - 1] === '') g.pop();
        var ok = g.join('|') === inst.expected.join('|');
        return { ok: ok, detail: ok ? '' : 'Pas encore : vérifie chaque lettre dans la table (une lettre = un groupe).' };
      },
      hint: 'Une lettre à la fois : tape les • et – de la lettre, puis « lettre suivante ».'
    },
    polyDec: {
      input: 'letters', icon: '🧩', tool: 'poly', side: function () { return refHtml('poly'); },
      build: function (m) { var w = text(m.pool); return { plain: w, expected: w, lens: [w.length] }; },
      panel: function (inst, st) {
        return '<div class="target">Chaque lettre est une case de la grille : ligne puis colonne</div><div class="tokens">' + inst.plain.split('').map(function (c) { return '<span class="morse">' + polyCode(c) + '</span>'; }).join('') +
          '</div><div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Ouvre la 📖 grille. « 23 » veut dire ligne 2, colonne 3.'
    },
    textDec: {
      input: 'letters', icon: '🪞', tool: 'textDec', side: function (inst) { return inst.cipher === 'atbash' ? refHtml('atbash') : ''; },
      build: function (m) { var p = text(m.pool), shown = m.cipher === 'mirror' ? reverseText(p) : atbash(p); return letterInst(p, { shown: shown, cipher: m.cipher }); },
      panel: function (inst, st) {
        return '<div class="target">' + (inst.cipher === 'mirror' ? 'Le message est écrit comme dans un miroir' : 'L’alphabet est inversé : A↔Z, B↔Y…') + '</div>' + bigText(inst.shown) +
          '<div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Miroir : lis le message en partant de la fin. Alphabet inversé : A devient Z, B devient Y, C devient X…'
    },
    /* ---- opérations spéciales ---- */
    dbl: {
      input: 'letters', icon: '🧬', tool: 'bin', side: function () { return refHtml('bin'); },
      build: function (m) { var w = text(m.pool), k = between(1, 5); return { plain: w, k: k, cipher: caesar(w, k), expected: w, lens: [w.length] }; },
      panel: function (inst, st) {
        return '<div class="target">Double code : 1) du binaire aux lettres, 2) décale de <b>' + inst.k + '</b> pas en arrière</div><div class="rows rowsrow">' +
          inst.cipher.split('').map(function (c, r) { return bitRowHtml(r, letterBits(c), null, false, r === 0); }).join('') + '</div><div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      blank: typedBlank, solve: typedSolve, check: typedCheck,
      hint: 'Étape 1 : décode chaque groupe binaire en lettre. Étape 2 : recule dans l’alphabet du nombre de pas indiqué (A−1 devient Z).'
    },
    freq: {
      input: 'letters', icon: '📊', tool: 'freq',
      build: function (m) { var k = between(3, 11), p = text(m.pool); return letterInst(p, { k: k, cipher: caesar(p, k) }); },
      panel: function (inst, st) {
        return bigText(inst.cipher) + '<div class="keyinfo">🔑 Clé inconnue ! Indice : la lettre la plus fréquente est sûrement un E (outil 📊).</div>' +
          '<div class="answer" id="ans">' + slots(inst, st.typed) + '</div>';
      },
      sideKind: 'wheel', side: function (inst, st) { return wheelHtml(st.w, true, st.preview ? caesar(inst.cipher, -st.w) : ''); },
      blank: function () { return { typed: '', w: 0, preview: false }; }, solve: typedSolve, check: typedCheck,
      hint: 'Ouvre l’outil 📊 : la lettre la plus fréquente du message codé remplace sûrement le E. Compte le décalage, puis teste-le sur la roue.'
    },
    parFind: {
      input: 'none', icon: '🛰️', tool: 'parity', action: '✅ Ces octets sont faux',
      build: function () {
        var bytes = [], bad = [], n = 6, nb = between(1, 2), i;
        for (i = 0; i < n; i++) { var b = bin(rnd(128), 7); b += parityOk(b) ? '0' : '1'; bytes.push(b); }
        while (bad.length < nb) { var x = rnd(n); if (bad.indexOf(x) < 0) bad.push(x); }
        bad.forEach(function (x) { var p = rnd(8), a = bytes[x].split(''); a[p] = a[p] === '1' ? '0' : '1'; bytes[x] = a.join(''); });
        return { bytes: bytes, bad: bad.sort() };
      },
      panel: function (inst, st) {
        return '<div class="target">Chaque octet doit avoir un nombre <b>pair</b> de 1. Touche les octets abîmés pendant la transmission.</div><div class="bytes">' +
          inst.bytes.map(function (b, i) { return '<button class="byte ' + (st.sel.indexOf(i) >= 0 ? 'sel' : '') + '" data-act="par" data-i="' + i + '">' + b.slice(0, 7) + '<i>' + b[7] + '</i></button>'; }).join('') + '</div>';
      },
      blank: function () { return { sel: [] }; }, solve: function (inst, st) { st.sel = inst.bad.slice(); },
      check: function (inst, st) { var ok = st.sel.slice().sort().join() === inst.bad.join(); return { ok: ok, detail: ok ? '' : 'Compte les 1 de chaque octet : le total doit être pair. Il y a ' + inst.bad.length + ' octet(s) faux.' }; },
      hint: 'Compte les 1 dans chaque octet (le dernier chiffre est le bit de parité). Si le total est impair, l’octet est abîmé.'
    },
    parAdd: {
      input: 'none', icon: '🛠️', tool: 'parity', action: '✅ Envoyer',
      build: function () { var w = []; for (var i = 0; i < 4; i++) w.push(bin(rnd(128), 7)); if (parityOk(w[0])) w[0] = w[0].slice(0, 6) + (w[0][6] === '1' ? '0' : '1'); return { words: w }; },
      panel: function (inst, st) {
        return '<div class="target">Ajoute le bit de parité (dernier chiffre) pour que chaque octet ait un nombre <b>pair</b> de 1.</div><div class="bytes">' +
          inst.words.map(function (b, i) { return '<div class="byte2">' + b + '<button class="bit ' + (st.last[i] ? 'on' : '') + '" data-act="par8" data-i="' + i + '">' + st.last[i] + '</button></div>'; }).join('') + '</div>';
      },
      blank: function (inst) { return { last: inst.words.map(function () { return 0; }) }; },
      solve: function (inst, st) { st.last = inst.words.map(function (w) { return parityOk(w) ? 0 : 1; }); },
      check: function (inst, st) {
        var bad = inst.words.filter(function (w, i) { return !parityOk(w + st.last[i]); });
        return { ok: !bad.length, detail: bad.length ? 'Il reste un octet avec un nombre impair de 1.' : '' };
      },
      hint: 'Compte les 1 des 7 premiers chiffres. Si c’est pair, mets 0 ; si c’est impair, mets 1.'
    }
  };

  /* ---------- liste des 36 missions ---------- */
  function mis(id, kind, title, o) { o = o || {}; o.id = id; o.kind = kind; o.title = title; o.s = Number(id.charAt(0)); o.n = Number(id.charAt(2)); o.boss = o.n === 6; return o; }
  var MISSIONS = [
    mis('1-1', 'symDec', 'Le premier message', { pool: 'w3s', brief: 'Décode ce mot avec la table des symboles.' }),
    mis('1-2', 'symDec', 'Deux mots', { pool: 'p2', brief: 'Cette fois, le message a deux mots.' }),
    mis('1-3', 'symEnc', 'À ton tour !', { pool: 'w3s', brief: 'Code ce mot avec les dessins : touche-les dans l’ordre.' }),
    mis('1-4', 'symEnc', 'Un mot plus long', { pool: 'w56', brief: 'Code ce mot, plus long, avec les dessins.' }),
    mis('1-5', 'symDec', 'Message du labo', { pool: 'p3', brief: 'Un message de trois mots du laboratoire.' }),
    mis('1-6', 'symDec', 'Le grand secret', { pool: 'p4', brief: 'MISSION SPÉCIALE : décode cette longue phrase !' }),
    mis('2-1', 'casDec', 'La roue magique', { pool: 'w3s', shift: 3, known: true, brief: 'Décode ce mot : la clé est un décalage de 3.' }),
    mis('2-2', 'casDec', 'Décalage connu', { pool: 'p2', kmin: 1, kmax: 6, known: true, brief: 'La clé est donnée : décode ce message.' }),
    mis('2-3', 'casEnc', 'Code ton message', { pool: 'w3s', kmin: 2, kmax: 5, brief: 'Code ce mot avec la clé donnée.' }),
    mis('2-4', 'casFind', 'Quel décalage ?', { pool: 'w56', kmin: 2, kmax: 9, brief: 'Message intercepté, clé inconnue : trouve le décalage.' }),
    mis('2-5', 'casFind', 'Un inconnu écrit…', { pool: 'p2', kmin: 5, kmax: 15, brief: 'Encore une clé à deviner, mais plus grande !' }),
    mis('2-6', 'casDec', 'Le message du voleur', { pool: 'p4', kmin: 3, kmax: 12, known: false, brief: 'MISSION SPÉCIALE : trouve la clé, puis lis le message complet.' }),
    mis('3-1', 'binBuild', 'La première carte', { cards: 4, target: 5, brief: 'Retourne les cartes pour faire apparaître 5.' }),
    mis('3-2', 'binBuild', 'Compter avec les cartes', { cards: 4, target: 13, brief: 'Fais apparaître 13 avec les cartes.' }),
    mis('3-3', 'binBuild', 'Un plus grand nombre', { cards: 5, tmin: 14, tmax: 31, brief: 'Cinq cartes cette fois. Trouve la bonne combinaison !' }),
    mis('3-4', 'binRead', 'Lire les cartes', { cards: 4, tmin: 3, tmax: 15, brief: 'Quel nombre les cartes montrent-elles ?' }),
    mis('3-5', 'binRead', 'Lire plus vite', { cards: 5, tmin: 10, tmax: 31, brief: 'Encore une lecture, avec cinq cartes.' }),
    mis('3-6', 'binBuild', 'Le coffre-fort', { cards: 6, tmin: 33, tmax: 63, brief: 'MISSION SPÉCIALE : six cartes, un nombre secret entre 33 et 63 !' }),
    mis('4-1', 'letEnc', 'Une lettre en binaire', { brief: 'Écris cette lettre en binaire. (A = 1, B = 2…)' }),
    mis('4-2', 'letDec', 'Une lettre cachée', { one: true, brief: 'Quelle lettre se cache dans ce groupe de 0 et de 1 ?' }),
    mis('4-3', 'letDec', 'Un mot en binaire', { pool: 'w3s', brief: 'Décode le mot écrit en binaire.' }),
    mis('4-4', 'letEnc', 'Code un mot', { pool: 'w3s', brief: 'Écris ce mot en binaire, lettre par lettre.' }),
    mis('4-5', 'letEnc', 'Ton nom en binaire', { name: true, brief: 'Écris ton prénom en binaire (6 lettres au maximum).' }),
    mis('4-6', 'letDec', 'La cassette secrète', { pool: 'w5e', brief: 'MISSION SPÉCIALE : décode ce mot de cinq lettres.' }),
    mis('5-1', 'morseDec', 'SOS !', { fixed: 'SOS', brief: 'Un signal de détresse en morse. Que dit-il ?' }),
    mis('5-2', 'morseDec', 'Lire le morse', { pool: 'w3s', brief: 'Décode ce mot en morse avec la table.' }),
    mis('5-3', 'morseEnc', 'Envoie en morse', { pool: 'w3s', brief: 'Écris ce mot en morse. Chaque tape fait un son !' }),
    mis('5-4', 'morseListen', 'À l’écoute', { pool: 'w3s', brief: 'Écoute le message et retrouve le mot avec la table.' }),
    mis('5-5', 'textDec', 'Message miroir', { pool: 'p2', cipher: 'mirror', brief: 'Le voleur écrit à l’envers !' }),
    mis('5-6', 'polyDec', 'La grille secrète', { pool: 'w5e', brief: 'MISSION SPÉCIALE : décode avec la grille de coordonnées.' }),
    mis('6-1', 'dbl', 'Double code', { pool: 'w3s', brief: 'Un code dans un code : d’abord le binaire, puis le décalage.' }),
    mis('6-2', 'freq', 'Les lettres trahissent', { pool: 'p3', brief: 'Utilise la fréquence des lettres pour trouver la clé.' }),
    mis('6-3', 'parFind', 'Erreur de transmission', { brief: 'Trouve les octets abîmés grâce au bit de parité.' }),
    mis('6-4', 'parAdd', 'Protège ton message', { brief: 'Ajoute le bit de parité pour protéger l’envoi.' }),
    mis('6-5', 'textDec', 'Alphabet inversé', { pool: 'p2', cipher: 'atbash', brief: 'Ici A devient Z, B devient Y…' }),
    mis('6-6', 'freq', 'L’affaire du pigeon doré', { pool: 'p4', brief: 'MISSION FINALE : retrouve le message complet du voleur !' })
  ];
  var BY_ID = {};
  MISSIONS.forEach(function (m, i) { m.index = i; BY_ID[m.id] = m; });

  /* ---------- progression ---------- */
  function done(p) { return p.agence.done; }
  function points(p) { var s = 0, d = p.agence && p.agence.done; if (!d) return 0; Object.keys(d).forEach(function (k) { s += d[k].pts || 0; }); return s; }
  function seriesDone(p, s) { return MISSIONS.filter(function (m) { return m.s === s && done(p)[m.id]; }).length; }

  /* ---------- vue : liste des missions ---------- */
  function viewList() {
    App.renderHeader('missions', 'agence');
    var p = App.profile(), pts = points(p), g = grade(pts);
    var html = '<div class="agency-head card"><div><h2>🕵️ Agence Z</h2><p>Bienvenue, <b>agent ' + esc(App.data.current) + '</b> ! La Centrale compte sur toi.</p></div>' +
      '<div class="grade"><b>' + g.name + '</b> · ' + pts + ' pts<div class="rankbar"><i style="width:' + g.pct + '%"></i></div><small>' + (g.next ? g.left + ' pts avant « ' + g.next + ' »' : 'Grade maximum !') + '</small></div></div>';
    SERIES.forEach(function (s) {
      var n = seriesDone(p, s.n);
      html += '<section class="series card"><div class="series-head"><h2>' + s.icon + ' Série ' + s.n + ' : ' + s.name + '</h2><span class="count">' + (n === 6 ? s.badge + ' ' : '') + n + ' / 6</span></div>' +
        '<p>' + esc(s.desc) + '</p><div class="pills">';
      MISSIONS.filter(function (m) { return m.s === s.n; }).forEach(function (m) {
        var r = done(p)[m.id];
        html += '<a class="pill mpill ' + (r ? 'done' : '') + (m.boss ? ' boss' : '') + '" href="#/agence/mission/' + m.id + '"><div class="m-ico">' + KINDS[m.kind].icon + '</div><b>' + m.id + (m.boss ? ' ★' : '') + '</b><small>' + esc(m.title) + '</small><span class="stars">' + (r ? (r.pts >= (m.boss ? 15 : 10) ? '★★' : '★☆') : '') + '</span></a>';
      });
      html += '</div></section>';
    });
    $('#view').innerHTML = html;
  }

  /* ---------- vue : une mission ---------- */
  var cur = null;
  function dispose() {
    if (cur && cur.onKey) document.removeEventListener('keydown', cur.onKey);
    cur = null;
  }

  function keyboardHtml() {
    return '<div class="kbd">' + KB_ROWS.map(function (r) { return '<div class="krow">' + r.split('').map(function (c) { return '<button class="key" data-k="' + c + '">' + c + '</button>'; }).join('') + '</div>'; }).join('') +
      '<div class="krow"><button class="key wide" data-k="CLEAR">Effacer tout</button><button class="key wide" data-k="BACK">⌫</button></div></div>';
  }
  function digitsHtml() {
    return '<div class="kbd digits"><div class="krow">' + '1234567890'.split('').map(function (c) { return '<button class="key" data-k="' + c + '">' + c + '</button>'; }).join('') +
      '<button class="key wide" data-k="BACK">⌫</button></div></div>';
  }
  function symbolsHtml() {
    return '<div class="kbd symk"><div class="krow">' + SYMBOLS.map(function (s, i) { return '<button class="key sym" data-s="' + ALPHA[i] + '">' + s + '</button>'; }).join('') +
      '<button class="key wide" data-s="BACK">⌫</button></div></div>';
  }
  function morseHtml() {
    return '<div class="kbd morsek"><div class="krow"><button class="key big" data-m=".">•</button><button class="key big" data-m="-">–</button><button class="key wide" data-m="/">lettre suivante</button><button class="key wide" data-m="BACK">⌫</button></div></div>';
  }

  function viewMission(id) {
    var m = BY_ID[id];
    if (!m) { location.hash = '#/agence'; return; }
    App.renderHeader('mission', 'agence');
    var K = KINDS[m.kind], inst = K.build(m), st = K.blank(inst);
    var next = MISSIONS[m.index + 1], prev = MISSIONS[m.index - 1], S = SERIES[m.s - 1];
    cur = { m: m, K: K, inst: inst, st: st, hint: false };
    $('#view').className = 'is-level';
    $('#view').innerHTML =
      '<section class="level mission"><div class="level-head"><a class="btn small" href="#/agence">← Missions</a><span class="badge">' + m.id + (m.boss ? ' ★' : '') + '</span><h2>' + esc(m.title) + '</h2><span class="spacer"></span>' +
      (prev ? '<a class="btn small" href="#/agence/mission/' + prev.id + '">◀</a>' : '') + (next ? '<a class="btn small" href="#/agence/mission/' + next.id + '">▶</a>' : '') + '</div>' +
      '<div class="instruction">' + (m.n === 1 ? '<b>' + esc(S.title) + ' — </b>' + esc(S.intro) + ' ' : '') + '🗣️ Centrale : ' + esc(m.brief) + '</div><div class="m-steps" id="steps"></div>' +
      '<div class="m-main"><div class="m-left"><div class="m-panel" id="mp"></div>' +
      '<div class="m-input" id="mi">' + (K.input === 'letters' ? keyboardHtml() : K.input === 'digits' ? digitsHtml() : K.input === 'symbols' ? symbolsHtml() : K.input === 'morse' ? morseHtml() : '') + '</div>' +
      '<div class="m-actions"><button class="btn go" id="check">' + (K.action || '✅ Vérifier') + '</button><button class="btn small" id="hint">💡 Indice</button>' +
      '<button class="btn small" id="tool">🧰 Outil</button><button class="btn small" id="sol" title="Pour les adultes">👀 Solution</button></div></div><div class="m-right" id="mr"></div></div></section>';
    render();
    $('#view').addEventListener('click', onClick);
    cur.onKey = function (e) {
      if (!cur || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.overlay')) return;
      if (K.input === 'letters' && /^[a-zA-Z]$/.test(e.key)) { key(e.key.toUpperCase()); e.preventDefault(); }
      else if ((K.input === 'letters' || K.input === 'digits') && e.key === 'Backspace') { key('BACK'); e.preventDefault(); }
      else if (K.input === 'digits' && /^[0-9]$/.test(e.key)) { key(e.key); e.preventDefault(); }
      else if (e.key === 'Enter') { check(); e.preventDefault(); }
    };
    document.addEventListener('keydown', cur.onKey);
    $('#check').onclick = check;
    $('#hint').onclick = function () { cur.hint = true; toast('💡 ' + K.hint, 'hint'); };
    $('#tool').onclick = function () { openTool(K.tool); };
    $('#sol').onclick = function () {
      if (!confirm('Afficher la solution ? (Pour les adultes.)')) return;
      cur.hint = true; K.solve(inst, st); render(); toast('Voici la solution. Touche « Vérifier » pour valider.', 'hint');
    };
  }

  /* ---------- étapes de la réponse : nombre typique et progression ---------- */
  function typedS(unit) {
    return function (inst, st) {
      var n = inst.expected.length;
      return { n: n, unit: unit, filled: function (i) { return i < st.typed.length; }, good: function (i) { return st.typed[i] === inst.expected[i]; } };
    };
  }
  function popcount(n) { var c = 0; while (n) { c += n & 1; n >>= 1; } return c; }
  var STEPS = {
    symDec: typedS('lettres à décoder'), casDec: typedS('lettres à décoder'), casEnc: typedS('lettres à coder'),
    letDec: typedS('lettres à retrouver'), morseDec: typedS('lettres à décoder'), morseListen: typedS('lettres à retrouver'),
    polyDec: typedS('lettres à décoder'), textDec: typedS('lettres à décoder'), dbl: typedS('lettres à retrouver'),
    freq: typedS('lettres à décoder'), binRead: typedS('chiffres à trouver'),
    symEnc: function (inst, st) {
      return { n: inst.expected.length, unit: 'dessins à choisir', filled: function (i) { return i < st.seq.length; }, good: function (i) { return st.seq[i] === inst.expected[i]; } };
    },
    morseEnc: function (inst, st) {
      return { n: inst.expected.length, unit: 'lettres en morse', filled: function (i) { return !!st.groups[i]; }, good: function (i) { return st.groups[i] === inst.expected[i]; } };
    },
    binBuild: function (inst, st) {
      var cnt = st.bits.reduce(function (a, b) { return a + b; }, 0);
      return { n: popcount(inst.target), unit: 'cartes à retourner', filled: function (i) { return i < cnt; } };
    },
    letEnc: function (inst, st) {
      return { n: inst.letters.length, unit: 'lettres à écrire en binaire', filled: function (i) { return st.rows[i] !== '00000'; }, good: function (i) { return st.rows[i] === letterBits(inst.letters[i]); } };
    },
    casFind: function (inst, st) {
      return { n: inst.k, unit: 'pas de roue à faire', filled: function (i) { return i < st.w; } };
    },
    parFind: function (inst, st) {
      return { n: inst.bad.length, unit: 'octets abîmés à repérer', filled: function (i) { return i < st.sel.length; }, good: function (i) { return inst.bad.indexOf(st.sel[i]) >= 0; } };
    },
    parAdd: function (inst, st) {
      var need = inst.words.filter(function (w) { return !parityOk(w); }).length, cnt = st.last.reduce(function (a, b) { return a + b; }, 0);
      return { n: need, unit: 'bits de parité à ajouter', filled: function (i) { return i < cnt; } };
    }
  };
  function stepInfo(kind, inst, st) {
    var s = STEPS[kind](inst, st), done = 0;
    for (var i = 0; i < s.n; i++) if (s.filled(i)) done++;
    s.done = done;
    return s;
  }
  function renderSteps() {
    var el = $('#steps'); if (!el || !cur) return;
    var s = stepInfo(cur.m.kind, cur.inst, cur.st), chips = '';
    for (var i = 0; i < s.n; i++) {
      var cls = s.filled(i) ? 'on' : '';
      if (cur.checked && s.filled(i) && s.good) cls = s.good(i) ? 'ok' : 'ko';
      chips += '<i class="chip ' + cls + '"></i>';
    }
    el.innerHTML = '<span class="ms-title">🪜 Réponse en <b>' + s.n + '</b> étape' + (s.n > 1 ? 's' : '') + ' <em>(' + s.unit + ')</em></span>' +
      '<span class="ms-bar">' + chips + '</span><span class="ms-count">' + s.done + ' / ' + s.n + '</span>' +
      (cur.checked ? '<span class="ms-leg">🟩 juste · 🟥 à corriger</span>' : '');
  }

  function render() {
    var mp = $('#mp'); if (!mp || !cur) return;
    renderSteps();
    mp.innerHTML = cur.K.panel(cur.inst, cur.st) + '<div class="msg" id="msg"></div>';
    var mr = $('#mr');
    if (mr) {
      var side = cur.K.side ? cur.K.side(cur.inst, cur.st) : '';
      mr.innerHTML = side; mr.style.display = side ? '' : 'none';
      mr.className = 'm-right ' + (cur.K.sideKind === 'wheel' ? 'wheel-side' : 'ref-side');
    }
    $('#msg').onclick = function () { toast('', ''); };
  }
  function toast(t, kind) { var m = $('#msg'); if (!m) return; m.className = 'msg' + (t ? ' show ' + kind : ''); m.innerHTML = t; }

  function key(k) {
    cur.checked = false;
    var st = cur.st, K = cur.K, max = K.input === 'digits' ? 2 : (cur.inst.expected || '').length;
    if (K.input !== 'letters' && K.input !== 'digits') return;
    if (k === 'BACK') st.typed = st.typed.slice(0, -1);
    else if (k === 'CLEAR') st.typed = '';
    else if (st.typed.length < max) st.typed += k;
    render();
  }

  function onClick(e) {
    if (!cur) return;
    var t = e.target.closest('button'); if (!t) return;
    var st = cur.st, inst = cur.inst, a = t.dataset.act;
    if (t.dataset.k || t.dataset.s || t.dataset.m || a) cur.checked = false;
    if (t.dataset.k) { key(t.dataset.k); return; }
    if (t.dataset.s) { if (t.dataset.s === 'BACK') st.seq.pop(); else st.seq.push(t.dataset.s); render(); return; }
    if (t.dataset.m) {
      var g = st.groups, m = t.dataset.m;
      if (m === 'BACK') { if (g[g.length - 1] === '' && g.length > 1) g.pop(); else g[g.length - 1] = g[g.length - 1].slice(0, -1); }
      else if (m === '/') { if (g[g.length - 1] !== '') g.push(''); }
      else { g[g.length - 1] += m; playSymbol(m); }
      render(); return;
    }
    if (!a) return;
    if (a === 'card') st.bits[Number(t.dataset.i)] = st.bits[Number(t.dataset.i)] ? 0 : 1;
    else if (a === 'bit') { var r = Number(t.dataset.r), c = Number(t.dataset.c), row = st.rows[r].split(''); row[c] = row[c] === '1' ? '0' : '1'; st.rows[r] = row.join(''); }
    else if (a === 'wl') { st.w = (st.w + 25) % 26; st.preview = false; }
    else if (a === 'wr') { st.w = (st.w + 1) % 26; st.preview = false; }
    else if (a === 'test') st.preview = true;
    else if (a === 'par') { var i = Number(t.dataset.i), ix = st.sel.indexOf(i); if (ix >= 0) st.sel.splice(ix, 1); else st.sel.push(i); }
    else if (a === 'par8') { var j = Number(t.dataset.i); st.last[j] = st.last[j] ? 0 : 1; }
    else if (a === 'play') { playMorse(inst.plain); return; }
    render();
  }

  function check() {
    if (!cur) return;
    var res = cur.K.check(cur.inst, cur.st);
    if (!res.ok) { cur.checked = true; renderSteps(); toast('❌ Pas encore ! ' + res.detail, 'warn'); App.beep([220]); return; }
    succeed();
  }

  function succeed() {
    var m = cur.m, p = App.profile(), before = App.allPoints(p), rb = App.rankInfo(before), gb = grade(points(p));
    var pts = (m.boss ? 15 : 10) - (cur.hint ? 5 : 0), prev = done(p)[m.id];
    if (!prev || pts > prev.pts) done(p)[m.id] = { pts: pts, ts: Date.now() };
    App.save();
    var after = App.allPoints(p), ra = App.rankInfo(after), gained = after - before, ga = grade(points(p));
    App.renderHeader('mission', 'agence');
    App.beep([523, 659, 784, 1047]); App.confetti();
    var idx = m.n - 1, next = MISSIONS[m.index + 1], S = SERIES[m.s - 1];
    var complete = seriesDone(p, m.s) === 6;
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay"><div class="dialog"><div class="stamp">CONFIDENTIEL</div><h2>Mission réussie !</h2>' +
      '<div class="pts">' + (gained > 0 ? '+' + gained + ' points' : 'Déjà réussie') + '</div>' +
      (cur.hint && gained > 0 ? '<p class="small">Sans indice, tu gagnes 5 points de plus !</p>' : '') +
      '<div class="story">📁 <b>Dossier secret</b> : « ' + esc(STORY[m.s - 1][idx]) + ' »</div>' +
      (complete ? '<p><b>' + S.badge + ' Insigne « ' + esc(S.name) + ' » obtenu !</b></p>' : '') +
      (ga.name !== gb.name ? '<p><b>⬆ Nouveau grade d’agent : ' + ga.name + ' !</b></p>' : '') +
      '<div class="rank"><b>' + ra.name + '</b> · ' + after + ' pts<div class="rankbar"><i style="width:' + ra.pct + '%"></i></div></div>' +
      '<div class="row"><button class="btn" id="m-close">Rester ici</button><a class="btn" href="#/agence" id="m-list">Missions</a>' +
      (next ? '<a class="btn primary" href="#/agence/mission/' + next.id + '" id="m-next">Mission suivante →</a>' : '') + '</div></div></div>';
    var close = function () { root.innerHTML = ''; };
    $('#m-close').onclick = close; $('#m-list').addEventListener('click', close);
    if (next) $('#m-next').addEventListener('click', close);
  }

  /* ---------- outils d'agent ---------- */
  function openTool(kind) {
    var body = '', title = 'Outil';
    if (kind === 'symbols') {
      title = '📖 Table des symboles';
      body = '<div class="tbl">' + ALPHA.split('').map(function (c, i) { return '<span class="tc"><b>' + c + '</b>' + SYMBOLS[i] + '</span>'; }).join('') + '</div>';
    } else if (kind === 'caesar') {
      title = '🎡 Le chiffre de César';
      body = '<p>On décale chaque lettre du même nombre de pas dans l’alphabet. Avec un décalage de 3 : A devient D, B devient E, Z devient C.</p>' +
        '<div class="tbl small">' + ALPHA.split('').map(function (c, i) { return '<span class="tc"><b>' + c + '</b>' + (i + 1) + '</span>'; }).join('') + '</div>' +
        '<p>Pour <b>coder</b> : lettre claire en haut → lettre codée en bas. Pour <b>décoder</b> : l’inverse.</p>';
    } else if (kind === 'bin') {
      title = '💾 Binaire et alphabet';
      body = '<p>Cartes : <b>16 · 8 · 4 · 2 · 1</b>. Une carte retournée (1) ajoute sa valeur. Exemple : 10110 = 16 + 4 + 2 = 22.</p><div class="tbl small">' +
        ALPHA.split('').map(function (c) { return '<span class="tc wide"><b>' + c + '</b> ' + (ALPHA.indexOf(c) + 1) + ' = ' + letterBits(c) + '</span>'; }).join('') + '</div>';
    } else if (kind === 'morse') {
      title = '📡 Table du morse';
      body = '<div class="tbl small">' + ALPHA.split('').map(function (c) { return '<span class="tc wide"><b>' + c + '</b> ' + MORSE[c].replace(/\./g, '•').replace(/-/g, '–') + '</span>'; }).join('') + '</div>';
    } else if (kind === 'poly') {
      title = '🧩 Grille secrète';
      body = '<table class="poly"><tr><th></th>' + [1, 2, 3, 4, 5].map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' +
        POLY.map(function (r, i) { return '<tr><th>' + (i + 1) + '</th>' + r.split('').map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table><p class="small">I et J partagent la même case.</p>';
    } else if (kind === 'textDec') {
      title = '🪞 Miroir et alphabet inversé';
      body = '<p><b>Miroir :</b> on lit le message de la fin vers le début.</p><p><b>Alphabet inversé :</b></p><div class="tbl small">' +
        ALPHA.split('').map(function (c) { return '<span class="tc"><b>' + c + '</b>' + atbash(c) + '</span>'; }).join('') + '</div>';
    } else if (kind === 'freq') {
      title = '📊 Fréquence des lettres';
      var counts = {}, max = 1;
      (cur && cur.inst.cipher ? cur.inst.cipher : '').split('').forEach(function (c) { if (c !== ' ') { counts[c] = (counts[c] || 0) + 1; max = Math.max(max, counts[c]); } });
      body = '<p>En français, la lettre la plus fréquente est <b>E</b>. Cherche la lettre qui revient le plus dans le message codé :</p><div class="hist">' +
        ALPHA.split('').map(function (c) { return '<div class="hb"><i style="height:' + Math.round((counts[c] || 0) / max * 100) + '%"></i><span>' + c + '</span></div>'; }).join('') + '</div>';
    } else if (kind === 'parity') {
      title = '🛰️ Le bit de parité';
      body = '<p>Un octet = 8 chiffres. Les 7 premiers portent le message, le <b>dernier</b> est le bit de parité : il sert à avoir toujours un nombre <b>pair</b> de 1.</p>' +
        '<p>Exemple : <b>1011001</b> a 4 uns (pair) → bit de parité 0. <b>1011000</b> a 3 uns (impair) → bit de parité 1.</p><p>Si le total est impair à l’arrivée, une erreur s’est glissée !</p>';
    }
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay"><div class="dialog toolbox"><h2>' + title + '</h2>' + body + '<div class="row"><button class="btn primary" id="m-close">Fermer</button></div></div></div>';
    $('#m-close').onclick = function () { root.innerHTML = ''; };
  }

  /* ---------- vue : dossier secret ---------- */
  function viewDossier() {
    App.renderHeader('dossier', 'agence');
    var p = App.profile(), html = '<div class="agency-head card"><div><h2>📁 Dossier secret : l’affaire du pigeon doré</h2><p>Chaque mission réussie ajoute une page à l’enquête.</p></div></div>';
    SERIES.forEach(function (s, si) {
      html += '<section class="series card"><div class="series-head"><h2>' + s.icon + ' Chapitre ' + s.n + ' : ' + esc(s.title) + '</h2><span class="count">' + seriesDone(p, s.n) + ' / 6</span></div><ul class="story-list">';
      STORY[si].forEach(function (line, i) {
        var id = s.n + '-' + (i + 1);
        html += done(p)[id] ? '<li>' + esc(line) + '</li>' : '<li class="locked">🔒 Réussis la mission ' + id + ' pour lire cette page.</li>';
      });
      html += '</ul></section>';
    });
    $('#view').innerHTML = html;
  }

  /* ---------- vue : message pour un ami ---------- */
  var MSG = { mode: 'code', code: 'cesar', shift: 3, plain: '', input: '', out: '' };
  function encodeMsg(plain) {
    var t = norm(plain);
    if (MSG.code === 'symboles') return toSymbols(t);
    if (MSG.code === 'cesar') return caesar(t, MSG.shift);
    if (MSG.code === 'binaire') return t.split('').map(letterBits).join(' ');
    return t.split('').map(function (c) { return MORSE[c]; }).join(' ');
  }
  function decodeMsg(src) {
    var s = String(src).trim();
    try {
      if (MSG.code === 'symboles') {
        var out = '', rest = s.replace(/\s+/g, '');
        while (rest.length) {
          var found = false;
          for (var i = 0; i < SYMBOLS.length; i++) if (rest.indexOf(SYMBOLS[i]) === 0) { out += ALPHA[i]; rest = rest.slice(SYMBOLS[i].length); found = true; break; }
          if (!found) { rest = rest.slice(1); }
        }
        return out;
      }
      if (MSG.code === 'cesar') return caesar(norm(s), -MSG.shift);
      if (MSG.code === 'binaire') return (s.match(/[01]{5}/g) || []).map(function (b) { var n = parseInt(b, 2); return n >= 1 && n <= 26 ? ALPHA[n - 1] : '?'; }).join('');
      var rev = {}; Object.keys(MORSE).forEach(function (c) { rev[MORSE[c]] = c; });
      return s.replace(/[•]/g, '.').replace(/[–−]/g, '-').split(/\s+/).map(function (g) { return rev[g] || (g ? '?' : ''); }).join('');
    } catch (e) { return ''; }
  }
  function viewMessage() {
    App.renderHeader('message', 'agence');
    var sel = function (id, opts, val) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
    var shifts = []; for (var k = 1; k <= 25; k++) shifts.push([k, 'décalage ' + k]);
    var html = '<div class="msgpage card"><h2>✉️ Message pour un ami</h2><p>Code un message, copie-le et envoie-le à un ami (SMS, mail, papier…). Il le décodera ici avec le même code. Rien n’est envoyé sur Internet.</p>' +
      '<div class="msgctl"><div class="seg"><button class="btn small' + (MSG.mode === 'code' ? ' primary' : '') + '" data-mode="code">✍️ Coder</button><button class="btn small' + (MSG.mode === 'decode' ? ' primary' : '') + '" data-mode="decode">🔓 Décoder</button></div>' +
      '<label>Code : ' + sel('mcode', [['cesar', 'César'], ['symboles', 'Symboles'], ['binaire', 'Binaire'], ['morse', 'Morse']], MSG.code) + '</label>' +
      (MSG.code === 'cesar' ? '<label>Clé : ' + sel('mshift', shifts, MSG.shift) + '</label>' : '') + '</div>';
    if (MSG.mode === 'code') {
      html += '<div class="answer" id="mans">' + (MSG.plain ? esc(MSG.plain) : '<span class="ph">Écris ton message avec les touches</span>') + '</div>' + keyboardHtml().replace('data-k="CLEAR">Effacer tout', 'data-k="CLEAR">Effacer tout').replace('</div></div>', '<button class="key wide" data-k="SPACE">espace</button></div></div>') +
        '<h3>Message codé</h3><textarea id="mout" readonly rows="3">' + esc(encodeMsg(MSG.plain)) + '</textarea><div class="row"><button class="btn primary" id="copy">📋 Copier</button><span id="copied"></span></div>';
    } else {
      html += '<h3>Colle le message reçu</h3><textarea id="min" rows="3" placeholder="Colle ici le message codé…">' + esc(MSG.input) + '</textarea><div class="row"><button class="btn primary" id="dec">🔓 Décoder</button></div>' +
        '<h3>Message lu</h3><div class="answer" id="mres">' + esc(MSG.out || '') + '</div>';
    }
    $('#view').innerHTML = html + '</div>';
    var v = $('#view');
    v.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { MSG.mode = b.dataset.mode; viewMessage(); }; });
    $('#mcode').onchange = function (e) { MSG.code = e.target.value; viewMessage(); };
    if ($('#mshift')) $('#mshift').onchange = function (e) { MSG.shift = Number(e.target.value); viewMessage(); };
    if (MSG.mode === 'code') {
      v.querySelectorAll('.key').forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.k;
          if (k === 'BACK') MSG.plain = MSG.plain.slice(0, -1); else if (k === 'CLEAR') MSG.plain = ''; else if (k === 'SPACE') MSG.plain += ' '; else if (MSG.plain.length < 120) MSG.plain += k;
          $('#mans').innerHTML = MSG.plain ? esc(MSG.plain) : '<span class="ph">Écris ton message avec les touches</span>';
          $('#mout').value = encodeMsg(MSG.plain);
        };
      });
      $('#copy').onclick = function () {
        var t = $('#mout'); t.select();
        var ok = false;
        try { if (navigator.clipboard) { navigator.clipboard.writeText(t.value); ok = true; } else ok = document.execCommand('copy'); } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } }
        $('#copied').textContent = ok ? ' ✅ Copié !' : ' Sélectionne le texte et copie-le.';
      };
    } else {
      $('#dec').onclick = function () { MSG.input = $('#min').value; MSG.out = decodeMsg(MSG.input); $('#mres').textContent = MSG.out || '(rien à lire)'; };
    }
  }

  /* ---------- tests automatiques ---------- */
  function tests() {
    var rows = '', fails = 0;
    function row(id, title, ok, detail) { if (!ok) fails++; rows += '<tr><td>' + id + '</td><td>' + esc(title) + '</td><td class="' + (ok ? 'okc' : 'koc') + '">' + (ok ? 'OK' : 'ÉCHEC') + '</td><td>' + esc(detail) + '</td></tr>'; }
    MISSIONS.forEach(function (m) {
      var K = KINDS[m.kind], ok = true, why = [];
      try {
        for (var t = 0; t < 40; t++) {
          var inst = K.build(m), st = K.blank(inst);
          if (K.check(inst, st).ok) { ok = false; why.push('réponse vide acceptée'); break; }
          K.solve(inst, st);
          if (!K.check(inst, st).ok) { ok = false; why.push('solution refusée'); break; }
          var s0 = stepInfo(m.kind, inst, K.blank(inst)), s1 = stepInfo(m.kind, inst, st);
          if (!(s0.n > 0) || s0.done !== 0 || s1.done !== s1.n) { ok = false; why.push('étapes ' + s0.n + ' / ' + s0.done + ' / ' + s1.done); break; }
          K.panel(inst, st);
          if (m.kind === 'symEnc' || m.kind === 'letEnc') { /* une réponse fausse doit être refusée */
            var bad = K.blank(inst); if (m.kind === 'symEnc') bad.seq = ['Z']; else bad.rows = inst.letters.map(function () { return '11111'; });
            if (K.check(inst, bad).ok) { ok = false; why.push('mauvaise réponse acceptée'); break; }
          }
          if (m.kind === 'casDec' && norm(caesar(inst.cipher, -inst.k)) !== inst.expected) { ok = false; why.push('aller-retour César'); break; }
          if (m.kind === 'freq' && norm(caesar(inst.cipher, -inst.k)) !== inst.expected) { ok = false; why.push('aller-retour fréquence'); break; }
          if (m.kind === 'polyDec' && /\?\?/.test(inst.plain.split('').map(polyCode).join(''))) { ok = false; why.push('grille'); break; }
          if (m.kind === 'parFind') { var okb = inst.bytes.filter(function (b) { return !parityOk(b); }).length; if (okb !== inst.bad.length) { ok = false; why.push('parité'); break; } }
        }
      } catch (e) { ok = false; why.push('ERREUR ' + e.message); }
      row(m.id, m.title, ok, ok ? K.input + ', 40 tirages' : why.join(' ; '));
    });
    // codages de base
    var b = true;
    b = b && caesar('ABC XYZ', 3) === 'DEF ABC' && caesar(caesar('SECRET', 7), -7) === 'SECRET';
    b = b && letterBits('A') === '00001' && letterBits('Z') === '11010' && polyCode('A') === '11' && polyCode('Z') === '55' && atbash('AZ') === 'ZA';
    b = b && SYMBOLS.length === 26 && Object.keys(MORSE).length === 26;
    row('outils', 'César, binaire, grille, miroir', b, 'valeurs de référence');
    var all = MISSIONS.every(function (m) { return Object.keys(POOLS).indexOf(m.pool || 'w3s') >= 0 || !m.pool; }) && STORY.every(function (s) { return s.length === 6; });
    row('données', '36 missions, histoire complète', MISSIONS.length === 36 && all, MISSIONS.length + ' missions');
    return { title: 'Agence Z (' + MISSIONS.length + ' missions)', rows: rows, fails: fails };
  }

  App.registerRoute(/^#\/agence$/, viewList);
  App.registerRoute(/^#\/agence\/mission\/(\d-\d)$/, function (m) { viewMission(m[1]); });
  App.registerRoute(/^#\/agence\/dossier$/, viewDossier);
  App.registerRoute(/^#\/agence\/message$/, viewMessage);
  App.registerDispose(dispose);
  App.registerPoints(points);
  App.registerTests(tests);
  App.registerActivity({
    id: 'agence', href: '#/agence', icon: '🕵️', title: 'Agence Z',
    desc: 'Décode et code des messages secrets : symboles, César, binaire, morse…',
    progress: function (p) { return { done: Object.keys(done(p)).filter(function (k) { return BY_ID[k]; }).length, total: MISSIONS.length, points: points(p) }; }
  });
})();
