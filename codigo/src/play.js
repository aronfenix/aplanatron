'use strict';
/* =====================================================================
   ESCENA DE JUEGO: muñecos que se mueven por el mapa, HUD, diálogos,
   preguntas, pistas de Rosa, planchitas y la Gran Plancha sobrevolando
   ===================================================================== */
const WORLDS = {};
function getWorld(kind) { return WORLDS[kind] || (WORLDS[kind] = kind === 'hub' ? new World('es', 2.3) : new World(kind)); }
const PSPEED = { walk: 250, boat: 320, balloon: 360 };
class Play {
  constructor(chIdx) { this.chIdx = chIdx; }
  enter() {
    const Cls = CHAPTERS[this.chIdx];
    this.world = getWorld(Cls.world || 'es'); this.world.state = worldStateBefore(this.chIdx); this.world.invalidate();
    this.btns = []; this.errors = 0; this.hints = 0; this.missed = []; this.good = 0; this.t = 0; this.progT = 0; this.flowT = 0;
    this.enemies = []; this.dialog = null; this.quiz = null; this.banner = null; this.alv = null; this.hintOn = false; this.done = false; this.paused = false;
    this.ch = new Cls(this);
    const [sx, sy] = this.ch.start;
    const team = Game.team;
    this.players = team.avs.map((av, i) => ({ i, av, name: team.names[i], x: sx + (team.avs.length > 1 ? (i ? 45 : -45) : 0), y: sy, vx: 0, vy: 0, dir: 1, mode: 'walk', carry: null, flat: 0, inv: 0, joy: null, kx: 0, ky: 0, moving: false }));
    this.two = this.players.length > 1;
    this.cam = [sx, sy];
    this.rosa = { x: sx - 80, y: sy - 90 };
    this.plancha = { x: sx + 900, y: sy - 600, t: rnd(10) };
    // botones
    this.pauseBtn = new Btn({ x: W - 96, y: 14, w: 80, h: 76, color: '#8c85b0', label: '', r: 20, icon: (cx, cy) => { rr(cx - 14, cy - 16, 10, 32, 3, '#fff', INK, 3); rr(cx + 4, cy - 16, 10, 32, 3, '#fff', INK, 3); }, onTap: () => this.pause(), key: ['Escape', 'p'] });
    this.hintBtn = new Btn({ x: W - 196, y: 14, w: 90, h: 76, color: '#3ec1f3', label: '', r: 20, icon: (cx, cy) => { drawRosa(cx, cy - 2, .22, { expr: 'happy' }); }, onTap: () => this.askHint(), key: ['h'] });
    this.speakBtn = new Btn({ x: 0, y: 0, w: 56, h: 54, color: '#3ec1f3', label: '', r: 16, vis: false, icon: (cx, cy) => speakerIcon(cx, cy), onTap: () => Sound.say(this.ch.objective()) });
    this.actBtns = this.players.map((p, i) => new Btn({ x: this.two ? (i ? W - 250 : 20) : W - 260, y: H - 146, w: this.two ? 230 : 240, h: 126, color: PCOL[i], label: '', size: 34, vis: false, r: 30, onTap: () => this.doAction(p), key: this.two ? (i ? ['Enter'] : [' ']) : [' ', 'Enter'] }));
    this.btns.push(this.pauseBtn, this.hintBtn, this.speakBtn, ...this.actBtns);
    // enemigos
    const ne = Game.d(this.ch.enemies[0], this.ch.enemies[1], this.ch.enemies[2]);
    for (let k = 0; k < ne; k++) this.enemies.push(this.ch.makeEnemy(k));
    this.region = null; this.regionT = 0;
    Sound.extra(false); Sound.tempo(1);
    this.showBanner(this.ch.label || 'CAPÍTULO ' + (this.chIdx + 1), this.ch.title, 2.2);
    const intro = GUION['c' + (this.chIdx + 1)];
    if (intro && !this.ch.skipIntro) later(2.3, () => this.say(intro, () => this.begin())); else later(2.3, () => this.begin());
    this.music(true);
  }
  begin() { this.started = true; if (this.ch.begin) this.ch.begin(); this.progT = 0; }
  /* ---------- música por zonas ---------- */
  music(force) {
    let r = this.ch.music;
    if (r === 'region') {
      const p = this.players[0]; const w = this.world;
      if (w.inInset(p.x, p.y)) r = 'canarias'; else if (p.mode === 'boat') r = 'mar';
      else { const [lat, lon] = w.latlon(p.x, p.y); r = lat > 42.2 && lon < -1.6 ? 'norte' : lat < 38.3 ? 'sur' : lon > -1.3 ? 'este' : 'centro'; }
    }
    if (force || r !== this.region) { if (!force && G.t - this.regionT < 3) return; this.region = r; this.regionT = G.t; Sound.play(r, { fade: 1.6 }); }
  }
  /* ---------- mensajes ---------- */
  say(lines, then) { this.dialog = { lines, i: 0, shown: 0, then, k: 0 }; tw(this.dialog, { k: 1 }, .35, { ease: E.outBack }); this.dlgLine(); }
  dlgLine() { const d = this.dialog; const l = d.lines[d.i]; d.text = Game.sub(l.text); d.shown = 0; if (l.who === 'alvaro' && l.face === 'laugh') Sound.sfx('laugh'); }
  dlgNext() { const d = this.dialog; if (!d) return; if (d.shown < d.text.length) { d.shown = d.text.length; return; } Sound.sfx('tap'); d.i++; if (d.i >= d.lines.length) { this.dialog = null; if (d.then) d.then(); } else this.dlgLine(); }
  ask(o) { // {q, opts, a, then(ok)}
    const q = { ...o, k: 0, turn: this.two ? (this.quizTurn = 1 - (this.quizTurn ?? 1)) : 0 }; this.quiz = q; tw(q, { k: 1 }, .4, { ease: E.outBack });
    const n = q.opts.length, w = n > 3 ? 280 : 340, gap = 20, x0 = 640 - (n * w + (n - 1) * gap) / 2, cols = ['#3ec1f3', '#a66cff', '#ff8a3d', '#7ce05c'];
    q.btns = q.opts.map((t, i) => answerBtn({ x: x0 + i * (w + gap), y: 430, w, h: 130, color: cols[i % 4], text: t, size: 28, quiz: true, onTap: () => this.answer(t) }));
    this.btns.push(...q.btns); Sound.sfx('whoosh');
    if (Sound.canSpeak()) this.say2 = q.q;
  }
  answer(t) {
    const q = this.quiz; if (!q || q.answered) return; q.answered = true;
    const ok = t === q.a; const b = q.btns.find(b => b.text === t), r = q.btns.find(b => b.text === q.a);
    q.btns.forEach(b => b.on = false); b.mark = ok ? 'ok' : 'ko'; r.mark = 'ok';
    if (ok) { this.win(640, 400, q.id); } else this.fail(640, 400, q.id, q.hint, q.miss || (q.q + ' → ' + q.a));
    later(ok ? 1 : 1.2, () => { this.btns = this.btns.filter(x => !x.quiz); this.quiz = null; if (!ok && q.hint) this.say([{ who: 'rosa', face: 'talk', text: q.hint }], () => q.then && q.then(ok)); else q.then && q.then(ok); });
  }
  showBanner(text, sub, dur = 1.8, col) { const b = { text, sub, k: 0, col: col || '#ff8a3d' }; this.banner = b; tw(b, { k: 1 }, .45, { ease: E.outBack }); Sound.sfx('whoosh'); later(dur, () => { if (this.banner === b) tw(b, { k: 0 }, .25, { ease: E.inQ, done: () => { if (this.banner === b) this.banner = null; } }); }); }
  alvSay(kind, text) { this.alv = { text: text || pick(PULLAS[kind]), kind, t0: G.t, k: 0, expr: kind === 'gloat' ? 'laugh' : pick(['shock', 'angry']) }; tw(this.alv, { k: 1 }, .4, { ease: E.outBack }); if (kind === 'gloat') Sound.sfx('laugh'); }
  /* ---------- aciertos, fallos, pistas ---------- */
  win(x, y, id, silent) { this.good++; if (id) Game.mark(id, true); Sound.sfx('ok'); burst(x, y, { n: 26 }); if (!silent && Math.random() < .5) this.alvSay('hurt'); this.progT = 0; this.hintOn = false; }
  fail(x, y, id, hint, miss) { this.errors++; if (id) Game.mark(id, false); if (miss && !this.missed.includes(miss)) this.missed.push(miss); Sound.sfx('bad'); shake(8, .3); if (x != null) burst(x, y, { n: 12, c: ['#8c85b0', '#5d5680'] }); this.alvSay('gloat'); }
  askHint() { if (!this.started || this.done) return; if (!this.hintOn) { this.hintOn = true; this.hints++; Sound.sfx('sparkle'); const h = this.ch.hint && this.ch.hint(); if (h) this.say([{ who: 'rosa', face: 'talk', text: h }]); } }
  /* ---------- acción del botón grande ---------- */
  actionFor(p) { if (!this.started || this.dialog || this.quiz || p.flat > 0) return null; return this.ch.action(p); }
  doAction(p) { const a = this.actionFor(p); if (a) a.fn(); }
  /* ---------- entrada ---------- */
  pause() { if (this.paused || this.done) return; this.paused = true; Sound.volume(.25);
    this.savedBtns = this.btns; this.btns = [
      new Btn({ x: 470, y: 290, w: 340, h: 104, label: 'SEGUIR', size: 44, color: '#7ce05c', key: ['Escape', 'Enter'], onTap: () => { this.paused = false; this.btns = this.savedBtns; Sound.volume(1); } }),
      new Btn({ x: 470, y: 416, w: 340, h: 100, label: 'EMPEZAR OTRA VEZ', size: 28, color: '#3ec1f3', onTap: () => go(() => new Play(this.chIdx)) }),
      new Btn({ x: 470, y: 540, w: 340, h: 100, label: 'SALIR AL MAPA', size: 28, color: '#ff8a3d', onTap: () => go(() => new Hub()) }), soundBtn(W - 110, 20)]; }
  down(p) {
    if (this.paused) return;
    if (this.dialog) { this.dlgNext(); return; }
    if (this.quiz) return;
    const pl = this.two ? this.players[p.x < W / 2 ? 0 : 1] : this.players[0];
    if (pl.joy) return; pl.joy = { id: p.id, ox: p.x, oy: p.y, x: p.x, y: p.y };
  }
  move(p) { for (const pl of this.players) if (pl.joy && pl.joy.id === p.id) { pl.joy.x = p.x; pl.joy.y = p.y; } }
  up(p) { for (const pl of this.players) if (pl.joy && pl.joy.id === p.id) pl.joy = null; }
  cancel(p) { this.up(p); }
  key(e) {
    if (this.dialog && (e.key === ' ' || e.key === 'Enter')) { this.dlgNext(); return true; }
    return false;
  }
  /* ---------- bucle ---------- */
  update(dt) {
    this.t += dt; this.flowT += dt;
    if (this.dialog) { const d = this.dialog; if (d.shown < d.text.length) { const prev = Math.floor(d.shown); d.shown = Math.min(d.text.length, d.shown + dt * 46); if (Math.floor(d.shown) !== prev && prev % 3 === 0) Sound.voice(d.lines[d.i].who); } }
    const frozen = !!(this.dialog || this.quiz || this.done || !this.started);
    const K = G.keys || {};
    for (const p of this.players) {
      let ix = 0, iy = 0;
      if (p.joy) { const dx = p.joy.x - p.joy.ox, dy = p.joy.y - p.joy.oy, L = Math.hypot(dx, dy); if (L > 8) { const m = Math.min(1, L / 70); ix = dx / L * m; iy = dy / L * m; } if (L > 90) { p.joy.ox = p.joy.x - dx / L * 90; p.joy.oy = p.joy.y - dy / L * 90; } }
      const up = this.two ? (p.i ? K.ArrowUp : K.w) : (K.ArrowUp || K.w), dn = this.two ? (p.i ? K.ArrowDown : K.s) : (K.ArrowDown || K.s), lf = this.two ? (p.i ? K.ArrowLeft : K.a) : (K.ArrowLeft || K.a), rt = this.two ? (p.i ? K.ArrowRight : K.d) : (K.ArrowRight || K.d);
      if (up) iy -= 1; if (dn) iy += 1; if (lf) ix -= 1; if (rt) ix += 1; const L2 = Math.hypot(ix, iy); if (L2 > 1) { ix /= L2; iy /= L2; }
      if (frozen || p.flat > 0) { ix = 0; iy = 0; }
      if (p.flat > 0) p.flat = Math.max(0, p.flat - dt); if (p.inv > 0) p.inv -= dt;
      const sp = PSPEED[p.mode] * (Game.diff === 'turbo' ? 1.08 : 1);
      p.vx = lerp(p.vx, ix * sp, Math.min(1, dt * 10)); p.vy = lerp(p.vy, iy * sp, Math.min(1, dt * 10));
      p.x = clamp(p.x + p.vx * dt, 20, this.world.W - 20); p.y = clamp(p.y + p.vy * dt, 40, this.world.H - 10);
      if (Math.abs(p.vx) > 20) p.dir = p.vx > 0 ? 1 : -1;
      p.moving = Math.hypot(p.vx, p.vy) > 30;
      if (this.ch.forceWalk) p.mode = 'walk';
      else if (this.ch.world !== 'eu') { const m = this.world.isLand(p.x, p.y) ? 'walk' : 'boat'; if (m !== p.mode) { p.mode = m; Sound.sfx(m === 'boat' ? 'splash' : 'thud'); puff(...this.toScreen(p.x, p.y), { n: 6, c: m === 'boat' ? '#dff4ff' : '#f3e7c9' }); } }
      else p.mode = 'balloon';
    }
    // en parejas, que no se separen más que la pantalla
    if (this.two) { const [a, b] = this.players; const mx = W - 160, my = H - 220; if (Math.abs(a.x - b.x) > mx) { const c0 = (a.x + b.x) / 2; const s = Math.sign(a.x - b.x); a.x = c0 + s * mx / 2; b.x = c0 - s * mx / 2; } if (Math.abs(a.y - b.y) > my) { const c0 = (a.y + b.y) / 2; const s = Math.sign(a.y - b.y); a.y = c0 + s * my / 2; b.y = c0 - s * my / 2; } }
    // cámara
    const tx = this.players.reduce((s, p) => s + p.x, 0) / this.players.length, ty = this.players.reduce((s, p) => s + p.y, 0) / this.players.length - 40;
    this.cam[0] = lerp(this.cam[0], clamp(tx, W / 2, this.world.W - W / 2), Math.min(1, dt * 5)); this.cam[1] = lerp(this.cam[1], clamp(ty, H / 2, this.world.H - H / 2), Math.min(1, dt * 5));
    // Rosa acompaña al jugador 1
    const p0 = this.players[0]; this.rosa.x = lerp(this.rosa.x, p0.x - 70 * p0.dir, Math.min(1, dt * 3)); this.rosa.y = lerp(this.rosa.y, p0.y - 120, Math.min(1, dt * 3));
    // la Gran Plancha sobrevuela
    const pl = this.plancha; pl.t += dt * .12; pl.x = this.cam[0] + Math.sin(pl.t) * 1100; pl.y = this.cam[1] - 250 + Math.sin(pl.t * 1.7) * 200; pl.dir = Math.cos(pl.t) > 0 ? 1 : -1;
    if (!frozen) {
      this.progT += dt;
      const auto = Game.d(12, 28, 0); if (auto && this.progT > auto && !this.hintOn && this.ch.target && this.ch.target()) { this.hintOn = true; this.hints += .5; Sound.sfx('sparkle'); }
      for (const e of this.enemies) this.updEnemy(e, dt);
      this.ch.update(dt);
      this.music();
    }
    // botones de acción
    this.players.forEach((p, i) => { const a = this.actionFor(p), b = this.actBtns[i]; if (a) { b.vis = true; b.label = a.label; b.color = a.col || PCOL[i]; b.pulse = true; } else b.vis = false; });
    const ob = this.ch.objective && this.ch.objective(); this.speakBtn.vis = !!(ob && Sound.canSpeak() && !this.dialog); this.speakBtn.x = 24 + Math.min(560, this.objW || 400) + 10; this.speakBtn.y = 104;
  }
  updEnemy(e, dt) {
    e.t += dt;
    const near = this.players.reduce((b, p) => { const d = dist(p.x, p.y, e.x, e.y); return d < b.d ? { p, d } : b; }, { p: null, d: 1e9 });
    if (near.d < e.chase && near.p.flat <= 0 && near.p.inv <= 0) { const dx = near.p.x - e.x, dy = near.p.y - e.y, L = near.d || 1; e.x += dx / L * e.sp * 1.15 * dt; e.y += dy / L * e.sp * 1.15 * dt; e.dir = dx > 0 ? 1 : -1; }
    else { const tx = e.cx + Math.cos(e.t * e.w + e.ph) * e.r, ty = e.cy + Math.sin(e.t * e.w + e.ph) * e.r * .6; const dx = tx - e.x, dy = ty - e.y, L = Math.hypot(dx, dy) || 1; const v = Math.min(e.sp, L / dt); e.x += dx / L * v * dt; e.y += dy / L * v * dt; if (Math.abs(dx) > 1) e.dir = dx > 0 ? 1 : -1; }
    for (const p of this.players) if (p.flat <= 0 && p.inv <= 0 && dist(p.x, p.y - 30, e.x, e.y - 20) < 42) this.squash(p);
  }
  squash(p) {
    p.flat = 1.3; p.inv = 3.2; Sound.sfx('stomp'); shake(8, .3); puff(...this.toScreen(p.x, p.y), { n: 10 });
    if (p.carry) { const it = p.carry; p.carry = null; if (this.ch.dropped) this.ch.dropped(it, p.x + rnd(-60, 60), p.y + rnd(20, 60)); }
    this.alvSay('gloat', pick(['¡Aplanado!', '¡Liso como un examen en blanco!', '¡Plaf!']));
  }
  toScreen(wx, wy) { return [wx - this.cam[0] + W / 2, wy - this.cam[1] + H / 2]; }
  finish() {
    if (this.done) return; this.done = true; Sound.shutUp();
    const st = this.errors <= 1 && this.hints <= 1 ? 3 : this.errors <= 4 && this.hints <= 3 ? 2 : 1;
    later(1.6, () => go(() => new ChapterEnd({ ch: this.chIdx, stars: st, errors: this.errors, hints: Math.floor(this.hints), missed: this.missed, time: this.t })));
  }
  /* ---------- dibujo ---------- */
  draw(c) {
    const w = this.world, cam = this.cam;
    w.drawBase(cam[0], cam[1]);
    this.ch.drawUnder(c, cam);
    // entidades ordenadas por altura
    const ents = [];
    for (const p of this.players) ents.push({ y: p.y, d: () => this.drawPlayer(p) });
    for (const e of this.enemies) ents.push({ y: e.y, d: () => { const [x, y] = this.toScreen(e.x, e.y); drawPlanchita(x, y, 1, { dir: e.dir, ph: e.ph }); } });
    this.ch.entities(ents, cam);
    ents.sort((a, b) => a.y - b.y); for (const e of ents) e.d();
    // Rosa
    const [rx, ry] = this.toScreen(this.rosa.x, this.rosa.y);
    drawRosa(rx, ry, .36, { expr: this.hintOn ? 'talk' : 'happy', talk: this.hintOn && Math.sin(G.t * 2) > 0 });
    if (this.hintOn && this.ch.target) { const tg = this.ch.target(); if (tg) { const [tx, ty] = this.toScreen(tg[0], tg[1]); const a = Math.atan2(ty - ry, tx - rx); const onS = tx > 40 && tx < W - 40 && ty > 100 && ty < H - 40; if (onS) arrowDown(tx, ty - 30, .8, '#ff5c8a'); else arrowAt(rx + Math.cos(a) * 70, ry + Math.sin(a) * 70, a, .7, '#ff5c8a'); } }
    // la Gran Plancha
    const pl = this.plancha, [px, py] = this.toScreen(pl.x, pl.y);
    if (px > -500 && px < W + 500 && this.ch.world !== 'boss') { c.save(); c.globalAlpha = .96; drawPlancha(px, py, .5, { dir: pl.dir, expr: 'evil', hover: 1 }); c.restore(); }
    this.ch.drawOver && this.ch.drawOver(c, cam);
    // clima: partículas según la zona
    this.weather(c);
  }
  drawPlayer(p) {
    const [x, y] = this.toScreen(p.x, p.y), blink = p.inv > 0 && p.flat <= 0 && Math.floor(G.t * 10) % 2;
    if (blink) G.ctx.globalAlpha = .45;
    if (p.mode === 'boat') drawKidBoat(x, y, 1.2, { av: p.av, dir: p.dir, carry: !!p.carry, hull: PCOL[p.i], ph: p.i });
    else if (p.mode === 'balloon') drawBalloonCraft(x, y, 1, { kids: [p.av], carry: !!p.carry, ph: p.i });
    else drawKid(x, y, 1.25, { av: p.av, dir: p.dir, walk: p.moving, carry: !!p.carry, flat: p.flat > 0 ? Math.min(1, p.flat * 3) : 0, ph: p.i });
    G.ctx.globalAlpha = 1;
    if (p.carry) drawSign(x, y - (p.mode === 'balloon' ? 245 : p.mode === 'boat' ? 148 : 185), p.carry.label || p.carry.name, { stick: false, size: 22, col: '#fff8ea' });
    if (this.two) chip(p.name, x, y + 28, PCOL[p.i], '#fff', 16);
  }
  weather(c) {
    if (G.low || this.ch.world === 'eu') return; const w = this.world, [cx, cy] = this.cam;
    const kind = this.ch.weatherAt ? this.ch.weatherAt(cx, cy) : null; if (!kind) return;
    const n = kind === 'lluvia' ? 70 : kind === 'nieve' ? 50 : 0; this._wx = this._wx || Array.from({ length: 80 }, () => [rnd(W), rnd(H), rnd(.6, 1.2)]);
    if (kind === 'sol' || kind === 'calor') { c.fillStyle = kind === 'calor' ? 'rgba(255,140,60,.10)' : 'rgba(255,230,120,.08)'; c.fillRect(0, 0, W, H); return; }
    c.strokeStyle = kind === 'lluvia' ? 'rgba(210,235,255,.55)' : '#fff'; c.lineWidth = 2; c.fillStyle = '#fff';
    for (let i = 0; i < n; i++) { const d = this._wx[i]; d[1] += (kind === 'lluvia' ? 900 : 90) * d[2] * G.dt; d[0] += (kind === 'lluvia' ? -120 : Math.sin(G.t + i) * 30) * G.dt; if (d[1] > H) { d[1] = -10; d[0] = rnd(W + 100); } if (d[0] < -20) d[0] += W + 40;
      if (kind === 'lluvia') { c.beginPath(); c.moveTo(d[0], d[1]); c.lineTo(d[0] - 5, d[1] + 18); c.stroke(); } else { c.beginPath(); c.arc(d[0], d[1], 3 * d[2], 0, TAU); c.fill(); } }
  }
  drawTop(c) {
    // HUD
    const ob = this.ch.objective && this.ch.objective();
    chip((this.ch.label || 'CAPÍTULO ' + (this.chIdx + 1)) + ' · ' + this.ch.title, 20, 44, '#ff8a3d', '#fff', 22, 'left', { font: 'T' });
    if (ob && this.started) { const L = wrap(ob, 540, 25); const ww = Math.min(580, Math.max(...L.map(l => tw_(l, 25))) + 40); this.objW = ww; panel(20, 78, ww, L.length * 32 + 26, '#fff8ea', { r: 20 }); L.forEach((l, i) => txt(l, 40, 106 + i * 32, { size: 25, align: 'left', color: INK })); }
    if (!this.ch.noMinimap) this.minimap(c);
    if (!this.two && !this.players[0].joy && this.t < 12 && this.started && !this.dialog) { c.globalAlpha = .6; circle(170, H - 150, 70, 'rgba(255,255,255,.35)', '#fff', 5); circle(170 + Math.sin(G.t * 3) * 30, H - 150, 30, '#fff', INK, 4); txt('Arrastra el dedo para moverte', 170, H - 50, { size: 20, color: '#fff', outline: 5 }); c.globalAlpha = 1; }
    for (const p of this.players) if (p.joy) { circle(p.joy.ox, p.joy.oy, 70, 'rgba(255,255,255,.25)', 'rgba(255,255,255,.8)', 5); const dx = p.joy.x - p.joy.ox, dy = p.joy.y - p.joy.oy, L = Math.hypot(dx, dy), m = Math.min(70, L); circle(p.joy.ox + (L ? dx / L * m : 0), p.joy.oy + (L ? dy / L * m : 0), 32, PCOL[p.i], INK, 4); }
    if (this.ch.hud) this.ch.hud(c);
    for (const b of (this.paused ? this.savedBtns : this.btns)) if (!b.quiz) b.draw();
    if (this.quiz) this.drawQuiz(c);
    if (this.alv) this.drawAlv(c);
    if (this.dialog) this.drawDialog(c);
    if (this.banner) { const b = this.banner, k = b.k; c.save(); c.translate(640, 330); c.scale(k, k); c.rotate(-.03); rr(-420, -80, 840, b.sub ? 170 : 130, 34, b.col, INK, 8); txt(b.text, 0, -18, { size: fitSize(b.text, 780, 60, 'T'), font: 'T', color: '#fff', outline: 10 }); if (b.sub) txt(b.sub, 0, 46, { size: fitSize(b.sub, 780, 32), color: '#fff', outline: 6 }); c.restore(); }
    if (this.paused) { c.fillStyle = 'rgba(30,20,70,.7)'; c.fillRect(0, 0, W, H); txt('PAUSA', 640, 200, { size: 90, font: 'T', color: '#ffc933', outline: 12 }); for (const b of this.btns) b.draw(); }
  }
  minimap(c) {
    const w = this.world, mw = 210, mh = mw * w.H / w.W, x0 = W - mw - 16, y0 = 100;
    const key = 'mini:' + w.kind; const cv = cached(key, mw, mh, cc => { const m = w.kind === 'es' ? new MapES({ x: 0, y: 0, s: mw / 1000, key: 'mm', layers: { countries: false } }) : new MapEU({ x: 0, y: 0, s: mw / 1000, key: 'mme' }); m.paintBase(cc); });
    rr(x0 - 4, y0 - 4, mw + 8, mh + 8, 14, '#fff8ea', INK, 4); c.save(); rrPath(c, x0, y0, mw, mh, 10); c.clip(); c.drawImage(cv, x0, y0, mw, mh); c.restore();
    const k = mw / w.W;
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.strokeRect(x0 + (this.cam[0] - W / 2) * k, y0 + (this.cam[1] - H / 2) * k, W * k, H * k);
    if (this.hintOn && this.ch.target) { const tg = this.ch.target(); if (tg) { circle(x0 + tg[0] * k, y0 + tg[1] * k, 7 + Math.sin(G.t * 8) * 3, '#ff5c8a', INK, 2.5); } }
    for (const p of this.players) circle(x0 + p.x * k, y0 + p.y * k, 6, PCOL[p.i], INK, 2.5);
    txt('N', x0 + mw - 14, y0 + 14, { size: 16, font: 'T', color: '#ff4b5c', outline: 4, oc: '#fff' });
  }
  drawQuiz(c) {
    const q = this.quiz, k = q.k; c.fillStyle = `rgba(30,20,70,${.5 * k})`; c.fillRect(0, 0, W, H);
    c.save(); c.translate(640, 360); c.scale(k, k); c.translate(-640, -360);
    const L = wrap(q.q, 900, 36); panel(170, 200, 940, L.length * 46 + 70, '#fff', { r: 30 }); L.forEach((l, i) => txt(l, 640, 244 + i * 46, { size: 36, color: INK }));
    if (this.two) chip('Le toca a ' + Game.name(q.turn), 640, 196, PCOL[q.turn], '#fff', 22);
    for (const b of q.btns) b.draw();
    c.restore();
  }
  drawAlv(c) {
    const a = this.alv, age = G.t - a.t0; if (age > 2.6) { this.alv = null; return; } const k = age > 2.3 ? 1 - (age - 2.3) / .3 : a.k;
    c.save(); c.translate((1 - k) * 320, 0);
    c.save(); c.beginPath(); c.arc(1205, 350, 58, 0, TAU); c.fillStyle = '#f3e8ff'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.clip(); drawAlvaro(1205, 485, .5, { expr: a.expr, cape: false, pen: false }); c.restore();
    const bw = Math.min(480, tw_(a.text, 24) + 60); bubble(a.text, 1135 - bw, 325, bw, { size: 24, below: true, tail: false, bg: '#f3e8ff' });
    c.restore();
  }
  drawDialog(c) {
    const d = this.dialog, l = d.lines[d.i], who = l.who, talking = d.shown < d.text.length, k = d.k;
    c.fillStyle = `rgba(30,20,70,${.25 * k})`; c.fillRect(0, 0, W, H);
    c.save(); c.translate(0, (1 - k) * 300);
    if (who === 'rosa') drawRosa(150, 520, .95, { expr: l.face, talk: talking });
    else if (who === 'alvaro') drawAlvaro(170, 600, .62, { expr: talking && (!l.face || l.face === 'smug') ? 'talk' : l.face, talk: talking, arms: l.arms || 'idle' });
    else if (who === 'teide') drawTeide(170, 600, .8, { expr: l.face, talk: talking });
    const nar = who === 'narrador'; panel(40, 570, W - 80, 206, nar ? '#2e2759' : '#fff8ea', { r: 28 });
    const name = { alvaro: 'PROFESOR ÁLVARO', rosa: 'ROSA DE LOS VIENTOS', teide: 'DON TEIDE' }[who];
    if (name) chip(name, 76, 572, { alvaro: '#a66cff', rosa: '#3ec1f3', teide: '#ff8a3d' }[who], '#fff', 22, 'left', { font: 'T' });
    const s = d.text.slice(0, Math.floor(d.shown)), lines = wrap(d.text, W - 190, 34); let cnt = 0;
    lines.forEach((ln, i) => { const part = s.slice(cnt, cnt + ln.length); cnt += ln.length + 1; txt(part, 90, 632 + i * 44, { size: 34, align: 'left', color: nar ? '#fff' : INK }); });
    if (!talking && Math.floor(G.t * 3) % 2) txt('▼', W - 96, 742, { size: 30, color: '#ff5c8a' });
    c.restore();
  }
}
G.keys = {};
addEventListener('keydown', e => { G.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; });
addEventListener('keyup', e => { G.keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
