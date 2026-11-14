/* Labo Code — Usine à machines : moteur de simulation (sans DOM, utilisable aussi sous Node pour les tests).
   Simulation déterministe à pas fixe : billes (gravité, rampes, rebonds), pièces, portes, capteurs, robot. */
(function (root) {
  'use strict';
  var W = 12, H = 8;
  var DT = 1 / 120, G = 24, R = 0.28, VMAX = 18, FPS_STEP = 2;      // trace enregistrée tous les 2 pas (60 images/s)
  var CH = ['rouge', 'bleu', 'vert', 'jaune'];
  var SOLID = { wall: 1, belt: 1, spring: 1, fan: 1, magnet: 1, ramp: 1, bumper: 1 };

  /* ---------- géométrie ---------- */
  function square(x, y) { return [{ x: x, y: y }, { x: x + 1, y: y }, { x: x + 1, y: y + 1 }, { x: x, y: y + 1 }]; }
  function polyFor(kind, rot, x, y) {
    if (kind === 'ramp') {
      var r = rot % 4;
      if (r === 0) return [{ x: x, y: y }, { x: x + 1, y: y + 1 }, { x: x, y: y + 1 }];            // ◣ descend vers la droite
      if (r === 1) return [{ x: x + 1, y: y }, { x: x + 1, y: y + 1 }, { x: x, y: y + 1 }];        // ◢ descend vers la gauche
      if (r === 2) return [{ x: x, y: y }, { x: x + 1, y: y }, { x: x + 1, y: y + 1 }];            // ◥
      return [{ x: x, y: y }, { x: x + 1, y: y }, { x: x, y: y + 1 }];                             // ◤
    }
    if (kind === 'bumper') {
      var p = [], k, cx = x + 0.5, cy = y + 0.5;
      for (k = 0; k < 8; k++) p.push({ x: cx + 0.42 * Math.cos(k * Math.PI / 4 + Math.PI / 8), y: cy + 0.42 * Math.sin(k * Math.PI / 4 + Math.PI / 8) });
      return p;
    }
    return square(x, y);
  }
  function area(poly) { var a = 0; for (var i = 0; i < poly.length; i++) { var p = poly[i], q = poly[(i + 1) % poly.length]; a += p.x * q.y - q.x * p.y; } return a; }
  /* contact cercle / polygone convexe : renvoie la normale (sortante) et la pénétration */
  function contact(m, poly) {
    var n = poly.length, sgn = area(poly) > 0 ? 1 : -1, inside = true, minIn = 1e9, inN = null, bestD2 = 1e9, bx = 0, by = 0, i;
    for (i = 0; i < n; i++) {
      var a = poly[i], b = poly[(i + 1) % n], ex = b.x - a.x, ey = b.y - a.y, len = Math.sqrt(ex * ex + ey * ey);
      var cr = (ex * (m.y - a.y) - ey * (m.x - a.x)) * sgn;
      if (cr < 0) inside = false;
      if (cr / len < minIn) { minIn = cr / len; inN = { x: sgn * ey / len, y: -sgn * ex / len }; }
      var t = Math.max(0, Math.min(1, ((m.x - a.x) * ex + (m.y - a.y) * ey) / (len * len)));
      var cx = a.x + t * ex, cy = a.y + t * ey, dx = m.x - cx, dy = m.y - cy, d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; bx = dx; by = dy; }
    }
    if (inside) return { nx: inN.x, ny: inN.y, pen: R + minIn };
    var d = Math.sqrt(bestD2);
    if (d >= R) return null;
    if (d < 1e-9) return { nx: 0, ny: -1, pen: R };
    return { nx: bx / d, ny: by / d, pen: R - d };
  }

  /* ---------- conditions (portes, lampes) ---------- */
  function evalCond(c, sim) {
    if (!c) return false;
    if (c.and) return c.and.every(function (k) { return evalCond(k, sim); });
    if (c.or) return c.or.some(function (k) { return evalCond(k, sim); });
    if (c.at) return sim.t >= c.at[0] && sim.t < c.at[1];
    if (c.all) return c.all.every(function (k) { return sim.ch[k]; });
    if (c.any) return c.any.some(function (k) { return sim.ch[k]; });
    if (c.not) return !sim.ch[c.not];
    return false;
  }

  /* ---------- la simulation ---------- */
  function Sim(level, placements) {
    this.level = level; this.t = 0; this.n = 0;
    this.marbles = []; this.ch = {}; CH.forEach(function (c) { this.ch[c] = false; }, this);
    this.cells = []; for (var i = 0; i < W * H; i++) this.cells.push(null);
    this.disp = []; this.buckets = []; this.doors = []; this.lamps = []; this.sensors = []; this.buttons = []; this.fans = []; this.magnets = [];
    this.inBucket = 0; this.lost = 0; this.spawned = 0; this.lampSeen = false; this.exitReached = false; this.exit = null;
    this.robot = null; this.trace = []; this.events = [];
    var self = this;
    (level.map || []).forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var c = row[x];
        if (c === '#') self.put(x, y, 'wall', 0, true);
        else if (c === 'o') self.disp.push({ x: x, y: y, n: 1, at: 0, every: 0.5, ch: null, i: 0, started: false });
        else if (c === 'U') self.buckets.push({ x: x, y: y, count: 0 });
        else if (c === 'X') self.exit = { x: x, y: y };
      }
    });
    (level.dispensers || []).forEach(function (d) {
      var e = self.disp.filter(function (q) { return q.x === d.x && q.y === d.y; })[0];
      if (!e) { e = { x: d.x, y: d.y, n: 1, at: 0, every: 0.5, ch: null, i: 0, started: false }; self.disp.push(e); }
      for (var k in d) e[k] = d[k];
    });
    (level.fixedParts || []).forEach(function (p) { self.addPart(p, true); });
    (level.doors || []).forEach(function (d) { self.doors.push({ x: d.x, y: d.y, cond: d.cond, open: false, color: d.color }); });
    (level.lamps || []).forEach(function (l) { self.lamps.push({ x: l.x, y: l.y, cond: l.cond, on: false }); });
    (level.buttons || []).forEach(function (b) { self.buttons.push({ x: b.x, y: b.y, ch: b.ch }); });
    (placements || []).forEach(function (p) { self.addPart(p, false); });
    if (level.robot) this.robot = { x: level.robot.x, y: level.robot.y, dir: level.robot.dir || 1, fx: level.robot.x, act: '' };
    this.buildPolys();
    this.disp.forEach(function (d) { d.i = 0; });
  }
  Sim.prototype.put = function (x, y, kind, rot, fixed) { if (x >= 0 && y >= 0 && x < W && y < H) this.cells[y * W + x] = { kind: kind, rot: rot || 0, fixed: !!fixed }; };
  Sim.prototype.addPart = function (p, fixed) {
    var k = p.p;
    if (k === 'sensor') this.sensors.push({ x: p.x, y: p.y, ch: CH[(p.r || 0) % 4], hit: false });
    else if (k === 'dispenser') this.disp.push({ x: p.x, y: p.y, n: p.n || (fixed ? 1 : 4), at: 0, every: 0.6, ch: p.ch || null, i: 0, started: false });
    else if (k === 'bucket') this.buckets.push({ x: p.x, y: p.y, count: 0 });
    else if (k === 'door') this.doors.push({ x: p.x, y: p.y, cond: { any: [CH[(p.r || 0) % 4]] }, open: false, color: CH[(p.r || 0) % 4] });
    else if (k === 'lamp') this.lamps.push({ x: p.x, y: p.y, cond: { any: [CH[(p.r || 0) % 4]] }, on: false });
    else {
      this.put(p.x, p.y, k, p.r || 0, fixed);
      if (k === 'fan') this.fans.push({ x: p.x, y: p.y, rot: (p.r || 0) % 4 });
      if (k === 'magnet') this.magnets.push({ x: p.x + 0.5, y: p.y + 0.5 });
    }
  };
  Sim.prototype.buildPolys = function () {
    this.polys = [];
    for (var i = 0; i < W * H; i++) {
      var c = this.cells[i], x = i % W, y = (i / W) | 0;
      this.polys.push(c && SOLID[c.kind] ? { poly: polyFor(c.kind, c.rot, x, y), kind: c.kind, rot: c.rot } : null);
    }
    this.fans.forEach(function (f) {      // zone de soufflage : jusqu'à 4 cases, arrêtée par un obstacle
      var d = [[0, -1], [1, 0], [0, 1], [-1, 0]][f.rot], cells = [], k, cx, cy;
      for (k = 1; k <= 4; k++) {
        cx = f.x + d[0] * k; cy = f.y + d[1] * k;
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) break;
        if (this.polys[cy * W + cx]) break;
        cells.push(cx + ',' + cy);
      }
      f.zone = cells; f.dir = d;
    }, this);
  };
  Sim.prototype.doorAt = function (x, y) {
    for (var i = 0; i < this.doors.length; i++) if (this.doors[i].x === x && this.doors[i].y === y) return this.doors[i];
    return null;
  };
  Sim.prototype.solidAt = function (x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return true;
    if (this.polys[y * W + x]) return true;
    var d = this.doorAt(x, y);
    return !!(d && !d.open);
  };

  Sim.prototype.spawn = function () {
    var t = this.t;
    this.disp.forEach(function (d) {
      if (d.i >= d.n) return;
      if (d.ch) { if (!this.ch[d.ch]) return; if (!d.started) { d.started = true; d.t0 = t; } }
      var t0 = d.ch ? d.t0 : d.at;
      if (t + 1e-9 >= t0 + d.i * d.every) { this.marbles.push({ x: d.x + 0.5, y: d.y + 0.5, vx: 0, vy: 0, alive: true }); d.i++; this.spawned++; }
    }, this);
  };

  Sim.prototype.substep = function () {
    var self = this, dt = DT;
    this.spawn();
    // portes, lampes
    this.doors.forEach(function (d) { d.open = evalCond(d.cond, self); });
    this.lamps.forEach(function (l) { l.on = evalCond(l.cond, self); if (l.on) self.lampSeen = true; });
    this.marbles.forEach(function (m) {
      if (!m.alive) return;
      m.vy += G * dt;
      var i, f, k;
      for (i = 0; i < this.fans.length; i++) {
        f = this.fans[i];
        if (f.zone.indexOf((m.x | 0) + ',' + (m.y | 0)) >= 0) { m.vx += f.dir[0] * 46 * dt; m.vy += f.dir[1] * 46 * dt; if (f.dir[1] !== 0) m.vx *= 0.995; }
      }
      for (i = 0; i < this.magnets.length; i++) {
        var mg = this.magnets[i], dx = mg.x - m.x, dy = mg.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 3.4 && d > 0.2) { var a = 58 * (1 - d / 3.4); m.vx += dx / d * a * dt; m.vy += dy / d * a * dt; m.vx *= 0.996; m.vy *= 0.996; }
      }
      var sp = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      if (sp > VMAX) { m.vx *= VMAX / sp; m.vy *= VMAX / sp; }
      m.x += m.vx * dt; m.y += m.vy * dt;
      // collisions avec les cases voisines (2 passes)
      for (k = 0; k < 2; k++) {
        var cx = m.x | 0, cy = m.y | 0, ox, oy;
        for (oy = -1; oy <= 1; oy++) {
          for (ox = -1; ox <= 1; ox++) {
            var gx = cx + ox, gy = cy + oy, polys = [];
            if (gx < 0 || gy < 0 || gx >= W || gy >= H) {
              if (gx < 0 || gx >= W || gy >= H) polys.push({ poly: square(gx, gy), kind: 'wall' });
              else continue;
            } else {
              var c = this.polys[gy * W + gx];
              if (c) polys.push(c);
              var dr = this.doorAt(gx, gy);
              if (dr && !dr.open) polys.push({ poly: square(gx, gy), kind: 'wall' });
            }
            for (var pi = 0; pi < polys.length; pi++) this.collide(m, polys[pi]);
          }
        }
      }
      // capteurs, seaux
      for (i = 0; i < this.sensors.length; i++) {
        var s = this.sensors[i];
        if ((m.x | 0) === s.x && (m.y | 0) === s.y && !s.hit) { s.hit = true; this.ch[s.ch] = true; this.events.push({ t: this.t, type: 'sensor', x: s.x, y: s.y }); }
      }
      for (i = 0; i < this.buckets.length; i++) {
        var b = this.buckets[i];
        if ((m.x | 0) === b.x && (m.y | 0) === b.y && m.y - b.y > 0.45) { m.alive = false; b.count++; this.inBucket++; this.events.push({ t: this.t, type: 'bucket', x: b.x, y: b.y }); break; }
      }
      if (m.y > H + 1.5 || m.x < -1.5 || m.x > W + 1.5) { m.alive = false; this.lost++; }
    }, this);
    this.t += dt; this.n++;
    if (this.n % FPS_STEP === 0) this.record();
  };

  Sim.prototype.collide = function (m, c) {
    var hit = contact(m, c.poly);
    if (!hit) return;
    m.x += hit.nx * hit.pen; m.y += hit.ny * hit.pen;
    var vn = m.vx * hit.nx + m.vy * hit.ny;
    if (vn < 0) {
      var e = c.kind === 'bumper' ? 1.0 : (c.kind === 'spring' ? 0.2 : 0.3);
      if (-vn < 1.6 && c.kind !== 'bumper') e = 0;
      m.vx -= (1 + e) * vn * hit.nx; m.vy -= (1 + e) * vn * hit.ny;
      if (c.kind === 'spring' && hit.ny < -0.5 && -vn > 0.8) { m.vy = -15; m.vx *= 0.9; }
      if (c.kind === 'bumper') { var s2 = Math.sqrt(m.vx * m.vx + m.vy * m.vy); if (s2 < 7) { m.vx *= 7 / (s2 + 1e-9); m.vy *= 7 / (s2 + 1e-9); } }
    }
    if (c.kind === 'belt' && hit.ny < -0.5) {
      var target = (c.rot % 2 === 0 ? 1 : -1) * 3;
      m.vx += (target - m.vx) * 0.12;
    } else if (hit.ny < -0.3 || Math.abs(hit.nx) > 0.3) {
      // frottement léger
      var tx = -hit.ny, ty = hit.nx, vt = m.vx * tx + m.vy * ty;
      m.vx -= vt * tx * 0.0012; m.vy -= vt * ty * 0.0012;
    }
  };

  Sim.prototype.record = function () {
    var fr = { t: this.t, m: [], d: this.doors.map(function (d) { return d.open ? 1 : 0; }), l: this.lamps.map(function (l) { return l.on ? 1 : 0; }),
      c: CH.map(function (k) { return this.ch[k] ? 1 : 0; }, this), b: this.buckets.map(function (b) { return b.count; }), s: this.sensors.map(function (s) { return s.hit ? 1 : 0; }) };
    this.marbles.forEach(function (m) { fr.m.push(m.alive ? +m.x.toFixed(3) : null, m.alive ? +m.y.toFixed(3) : null); });
    if (this.robot) fr.r = { x: +this.robot.fx.toFixed(3), dir: this.robot.dir, act: this.robot.act };
    this.trace.push(fr);
  };

  Sim.prototype.active = function () {
    var self = this, pend = this.disp.some(function (d) { return d.i < d.n; });
    return pend || this.marbles.some(function (m) { return m.alive; });
  };
  Sim.prototype.advance = function (sec) {
    var n = Math.round(sec / DT);
    for (var i = 0; i < n; i++) this.substep();
  };
  Sim.prototype.goalsMet = function () {
    var g = this.level.goal || {};
    if (g.n && this.inBucket < g.n) return false;
    if (g.lamp && !this.lampSeen) return false;
    if (g.exit && !this.exitReached) return false;
    return !!(g.n || g.lamp || g.exit);
  };

  /* ---------- robot : le programme pilote l'horloge de la simulation ---------- */
  function robotApi(sim) {
    var rb = sim.robot, lv = sim.level, ry = rb.y;
    var tmax = lv.tmax || 40;
    function guard() { if (sim.t > tmax) throw 'long'; }
    function blocked(x) { return x < 0 || x >= W || sim.solidAt(x, ry); }
    function moveTo(nx, dur) {
      var x0 = rb.fx, steps = Math.round(dur / DT), i;
      for (i = 1; i <= steps; i++) { rb.fx = x0 + (nx - x0) * i / steps; sim.substep(); }
      rb.x = nx; rb.fx = nx;
    }
    function checkExit() { if (sim.exit && rb.x === sim.exit.x && ry === sim.exit.y) sim.exitReached = true; }
    function idle(dur, act) { rb.act = act || ''; sim.advance(dur); rb.act = ''; }
    return {
      avancerCase: function () { guard(); var nx = rb.x + rb.dir; rb.act = 'walk'; if (blocked(nx)) { rb.act = 'bump'; sim.advance(0.4); rb.act = ''; return; } moveTo(nx, 0.5); rb.act = ''; checkExit(); },
      faireDemiTour: function () { guard(); rb.dir = -rb.dir; idle(0.3); },
      appuyer: function () {
        guard(); var did = false;
        sim.buttons.forEach(function (b) { if (b.x === rb.x && b.y === ry) { sim.ch[b.ch] = true; did = true; sim.events.push({ t: sim.t, type: 'button', x: b.x, y: b.y }); } });
        idle(did ? 0.5 : 0.3, 'press');
      },
      attendre: function () { guard(); idle(1); },
      chemin: function (c) { return !blocked(rb.x + rb.dir); },
      surBouton: function () { return sim.buttons.some(function (b) { return b.x === rb.x && b.y === ry; }); },
      arrivee: function () { return !!(sim.exit && rb.x === sim.exit.x && ry === sim.exit.y); },
      highlightBlock: function (id) { sim.events.push({ t: sim.t, type: 'hl', id: id, frame: sim.trace.length }); }
    };
  }

  /* Lance un niveau complet : placements = pièces posées, code = programme du robot (JS généré) ou null. */
  function run(level, placements, code, opts) {
    opts = opts || {};
    var sim = new Sim(level, placements), err = null, tmax = level.tmax || 40;
    if (sim.robot && code !== null && code !== undefined) {
      var api = robotApi(sim);
      try {
        new Function('avancerCase', 'faireDemiTour', 'appuyer', 'attendre', 'chemin', 'surBouton', 'arrivee', 'highlightBlock', 'loopBudget', code)(
          api.avancerCase, api.faireDemiTour, api.appuyer, api.attendre, api.chemin, api.surBouton, api.arrivee, api.highlightBlock, 3000);
      } catch (e) { err = (e === 'long' || e === 'boucle' || e instanceof RangeError) ? 'long' : 'autre'; }
    }
    var guardN = 0, endAt = Math.min(tmax, opts.maxT || tmax), still = 0;
    while (sim.t < endAt && (sim.active() || sim.t < 0.5)) {
      sim.substep();
      if (sim.goalsMet() && !sim.active()) break;
      if (sim.n % 60 === 0) {   // toutes les 0,5 s : si plus rien ne bouge (et rien n'est en attente), on arrête
        var moving = sim.marbles.some(function (m) { return m.alive && (m.vx * m.vx + m.vy * m.vy > 0.04); });
        var waiting = sim.disp.some(function (d) { return d.i < d.n && (!d.ch || sim.ch[d.ch]); });
        still = (!moving && !waiting && sim.t > 1) ? still + 1 : 0;
        if (still >= 3) break;
      }
      if (++guardN > 200000) break;
    }
    // laisse un instant pour que les lampes / portes réagissent
    sim.advance(0.3);
    sim.record();
    return { sim: sim, trace: sim.trace, events: sim.events, ok: sim.goalsMet(), err: err, inBucket: sim.inBucket, lost: sim.lost, spawned: sim.spawned, t: sim.t };
  }

  var API = { W: W, H: H, DT: DT, CH: CH, FPS_STEP: FPS_STEP, SOLID: SOLID, Sim: Sim, run: run, polyFor: polyFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.UsineEngine = API;
})(typeof window !== 'undefined' ? window : this);
