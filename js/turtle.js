/* Tortue Blocs — moteur de dessin : exécution, cadrage, comparaison */
(function () {
  'use strict';
  var TB = (window.TB = window.TB || {});

  TB.SIZE = 600;
  TB.DEFAULT_COLOR = 'bleu';
  TB.COLORS = {
    rouge: '#e53935', orange: '#fb8c00', jaune: '#fdd835', vert: '#43a047',
    bleu: '#1e88e5', violet: '#8e24aa', rose: '#ec407a', noir: '#212121'
  };

  var MAX_CMDS = 40000;

  /* Exécute le code généré par les blocs et renvoie la liste des commandes. */
  TB.execute = function (code) {
    var cmds = [], x = 0, y = 0, a = 0, pen = true, col = TB.DEFAULT_COLOR;

    function num(v) {
      v = Number(v);
      if (!isFinite(v)) throw 'valeur';
      return v;
    }
    function check() { if (cmds.length > MAX_CMDS) throw 'long'; }

    var api = {
      avancer: function (n) {
        n = num(n);
        var r = a * Math.PI / 180;
        var nx = x + n * Math.sin(r), ny = y - n * Math.cos(r);
        cmds.push({ t: 'line', x0: x, y0: y, x1: nx, y1: ny, pen: pen, col: col, a: a });
        x = nx; y = ny; check();
      },
      droite: function (d) {
        a = (((a + num(d)) % 360) + 360) % 360;
        cmds.push({ t: 'turn', a: a }); check();
      },
      gauche: function (d) {
        a = (((a - num(d)) % 360) + 360) % 360;
        cmds.push({ t: 'turn', a: a }); check();
      },
      couleur: function (c) { col = TB.COLORS[c] ? c : TB.DEFAULT_COLOR; },
      leverCrayon: function () { pen = false; },
      baisserCrayon: function () { pen = true; },
      highlightBlock: function (id) { cmds.push({ t: 'hl', id: id }); check(); }
    };

    try {
      var fn = new Function('avancer', 'droite', 'gauche', 'couleur', 'leverCrayon', 'baisserCrayon',
        'highlightBlock', 'loopBudget', code);
      fn(api.avancer, api.droite, api.gauche, api.couleur, api.leverCrayon, api.baisserCrayon,
        api.highlightBlock, 100000);
    } catch (e) {
      var kind = 'autre';
      if (e === 'valeur') kind = 'valeur';
      else if (e === 'long' || e === 'boucle') kind = 'long';
      else if (e instanceof RangeError) kind = 'long';
      return { cmds: cmds, error: kind, detail: String(e && e.message || e) };
    }
    return { cmds: cmds, error: null };
  };

  /* Segments visibles (crayon baissé, longueur non nulle). */
  TB.segments = function (cmds) {
    var out = [];
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i];
      if (c.t === 'line' && c.pen && Math.hypot(c.x1 - c.x0, c.y1 - c.y0) > 0.01) out.push(c);
    }
    return out;
  };

  /* Cadrage : centre le dessin cible dans la zone et l'agrandit si besoin. */
  TB.makeMap = function (segs) {
    var minX = 0, maxX = 0, minY = 0, maxY = 0, i, s;
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      minX = Math.min(minX, s.x0, s.x1); maxX = Math.max(maxX, s.x0, s.x1);
      minY = Math.min(minY, s.y0, s.y1); maxY = Math.max(maxY, s.y0, s.y1);
    }
    var w = Math.max(maxX - minX, 1), h = Math.max(maxY - minY, 1);
    var zoom = Math.min(2.6, (TB.SIZE - 130) / Math.max(w, h));
    return { zoom: zoom, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  };
  TB.px = function (map, x, y) {
    return [TB.SIZE / 2 + map.zoom * (x - map.cx), TB.SIZE / 2 + map.zoom * (y - map.cy)];
  };

  function newCanvas() {
    var c = document.createElement('canvas');
    c.width = c.height = TB.SIZE;
    return c;
  }

  /* Dessine des segments sur un canvas (utilisé pour le modèle, le tracé et la comparaison). */
  TB.drawSegments = function (g, segs, map, lw, mode) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      g.strokeStyle = mode === 'black' ? '#000' : (TB.COLORS[s.col] || '#000');
      var p0 = TB.px(map, s.x0, s.y0), p1 = TB.px(map, s.x1, s.y1);
      g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
    }
  };

  function raster(segs, map, lw, colored) {
    var c = newCanvas();
    var g = c.getContext('2d', { willReadFrequently: true });
    TB.drawSegments(g, segs, map, lw, colored ? 'color' : 'black');
    return g.getImageData(0, 0, TB.SIZE, TB.SIZE).data;
  }

  /* Compare deux dessins (tolérance ~4 px). */
  TB.compare = function (player, target, map, checkColor) {
    var pt = raster(player, map, 2, checkColor), pd = raster(player, map, 9, false);
    var tt = raster(target, map, 2, false), td = raster(target, map, 9, checkColor);
    var nP = 0, mP = 0, nT = 0, mT = 0, cm = 0, n = TB.SIZE * TB.SIZE;
    for (var i = 0; i < n; i++) {
      var o = i * 4;
      if (pt[o + 3] > 80) {
        nP++;
        if (td[o + 3] <= 80) mP++;
        else if (checkColor && pt[o + 3] > 200 && td[o + 3] > 200) {
          var d = Math.abs(pt[o] - td[o]) + Math.abs(pt[o + 1] - td[o + 1]) + Math.abs(pt[o + 2] - td[o + 2]);
          if (d > 120) cm++;
        }
      }
      if (tt[o + 3] > 80) {
        nT++;
        if (pd[o + 3] <= 80) mT++;
      }
    }
    function tol(k) { return Math.max(10, k * 0.006); }
    return {
      ok: nP > 0 && mP <= tol(nP) && mT <= tol(nT) && cm <= Math.max(10, nP * 0.03),
      empty: nP === 0, extra: mP > tol(nP), missing: mT > tol(nT), wrongColor: cm > Math.max(10, nP * 0.03),
      nP: nP, mP: mP, nT: nT, mT: mT, cm: cm
    };
  };
})();
