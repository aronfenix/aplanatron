'use strict';
/* =====================================================================
   PRUEBA 3 · FONTANEROS DEL RÍO (ríos)
   1) ¿Dónde nace? (se toca la fuente buena)  2) ¿Adónde va? (se toca su mar)
   3) Tuberías colocadas sobre el cauce REAL del río: hay que girarlas
      antes de que llegue el agua.  4) Ríos del norte: cortos y rápidos.
   ===================================================================== */
const DIRV = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S O
const SEA_ARROWS = { cantabrico: [44.15, -4.6], atlantico: [40.6, -10.4], mediterraneo: [38.4, 1.4] };
const SYS_NAME = { iberico: 'Sistema Ibérico', cantabrica: 'Cordillera Cantábrica', central: 'Sistema Central', beticos: 'Sistemas Béticos', pirineos: 'Pirineos' };
class GameRios extends Mini {
  constructor() { super(2); }
  howto() {
    return { title: 'Fontaneros del río', lines: ['El Aplanatrón ha secado los ríos. Para cada río: tocad la fuente de las montañas donde nace y después el mar donde desemboca.', 'Luego aparecen tuberías sobre su cauce. Tocadlas para girarlas y unir la fuente con el mar… ¡antes de que llegue el agua!', 'Si una tubería está mal puesta, el agua se sale por ahí.'],
      pic: (c, x, y) => { for (let i = 0; i < 4; i++) drawPipeTile(x - 150 + i * 80, y - 40, 76, i === 2 ? [0, 1] : [1, 3], i < 2); drawSpring(x - 230, y - 40, 1, true); } };
  }
  setup() {
    this.map = new MapES({ x: 20, y: 96, s: .8, key: 'riomap', layers: { countries: true } });
    this.list = shuffle(RIOS.slice()); this.i = 0; this.doneRivers = []; this.leaks = 0;
    this.prog = () => [Math.min(this.i, 3) + (this.phase === 'norte' || this.phase === 'fin' ? 1 : 0), 4];
  }
  start() { this.beginRiver(); }
  get cur() { return this.list[this.i]; }
  mu(lat, lon) { return PROJ.es(lat, lon); }
  scr(lat, lon) { return this.map.P(...this.mu(lat, lon)); }
  beginRiver() {
    const r = this.cur; if (!r) return this.beginNorte();
    this.phase = 'fuente'; this.tiles = null; this.water = -1;
    const fakes = shuffle(FUENTES_FALSAS.filter(f => f[2] !== r.nace)).filter((f, i, a) => a.findIndex(g => g[2] === f[2]) === i).slice(0, 2);
    this.springs = shuffle([{ sys: r.nace, at: r.source, ok: true }].concat(fakes.map(f => ({ sys: f[2], at: [f[0], f[1]] }))));
    this.say('El ' + r.id + ' está seco. ¿En qué montañas nace? Toca su fuente.');
  }
  say(t) { this.msg = t; this.msgK = 0; tw(this, { msgK: 1 }, .35, { ease: E.outBack }); this.setSpeak(t, 1180, 120); }
  onDown(p) {
    if (this.phase === 'fuente') { for (const s of this.springs) { const [x, y] = this.scr(...s.at); if (dist(p.x, p.y, x, y) < 48) return this.pickSpring(s, x, y); } }
    else if (this.phase === 'mar') { for (const k in SEA_ARROWS) { const [x, y] = this.scr(...SEA_ARROWS[k]); if (dist(p.x, p.y, x, y) < 60) return this.pickSea(k, x, y); } }
    else if (this.phase === 'tubos') { const t = this.tileAt(p.x, p.y); if (t && !t.fixed && t.idx > this.water) { t.rot = (t.rot + 1) % 4; t.spin = 1; Sound.sfx('tap'); } }
    else if (this.phase === 'norte') { for (const n of this.nsprings) { if (!n.on && dist(p.x, p.y, n.x, n.y) < 44) { n.on = true; n.t = 0; Sound.sfx('splash'); } } }
  }
  pickSpring(s, x, y) {
    const r = this.cur;
    if (s.ok) { this.good(x, y - 30, 'nace_' + r.id); s.on = true; this.say('¡Sí! El ' + r.id + ' nace en ' + r.naceTxt + '. Y ahora… ¿en qué mar u océano desemboca? Toca su flecha.'); this.phase = 'mar'; }
    else this.bad(x, y - 30, 'nace_' + r.id, 'Esa fuente está en ' + (SYS_NAME[s.sys] || s.sys) + '. ' + r.hint.split('.')[0] + '.', 'El ' + r.id + ' nace en ' + r.naceTxt, { then: () => { const ok = this.springs.find(q => q.ok); ok.on = true; this.phase = 'mar'; this.say('Ahora… ¿en qué mar u océano desemboca el ' + r.id + '? Toca su flecha.'); } });
  }
  pickSea(k, x, y) {
    const r = this.cur;
    const go = () => { this.buildPipes(); this.phase = 'tubos'; this.say('¡A girar tuberías! El agua sale de la fuente en unos segundos. Uníos al ' + MARES[r.mar].replace(/^Mar /, 'mar ').replace(/^Océano /, 'océano ') + '.'); };
    if (k === r.mar) { this.good(x, y, 'mar_' + r.id); this.seaPick = k; go(); }
    else this.bad(x, y, 'mar_' + r.id, 'El ' + r.id + ' desemboca en el ' + MARES[r.mar].replace(/^Mar /, 'mar ').replace(/^Océano /, 'océano ') + '. ' + r.hint.split('.').slice(1, 2).join('.') + '.', 'El ' + r.id + ' desemboca en el ' + MARES[r.mar], { then: () => { this.seaPick = r.mar; go(); } });
  }
  buildPipes() {
    const r = this.cur, pts = GEO.es.rivers[r.id][0], cs = this.cs = 46, ox = this.map.x, oy = this.map.y;
    const cells = []; const key = (a, b) => a + ',' + b;
    let L = 0; for (let i = 2; i < pts.length; i += 2) L += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    const n = Math.ceil(L * this.map.s / 3);
    for (let k = 0; k <= n; k++) { const [px, py] = polyPointAt(pts, this.map.s, k / n); const cx = Math.floor(px / cs), cy = Math.floor(py / cs); const last = cells[cells.length - 1];
      if (last && last[0] === cx && last[1] === cy) continue;
      if (last && last[0] !== cx && last[1] !== cy) cells.push([cx, last[1]]);
      const seen = cells.findIndex(q => q[0] === cx && q[1] === cy); if (seen >= 0) { cells.length = seen + 1; continue; }
      cells.push([cx, cy]); }
    // una casilla más hacia el mar
    const a = cells[cells.length - 2], b = cells[cells.length - 1]; if (a && b) cells.push([b[0] + (b[0] - a[0]), b[1] + (b[1] - a[1])]);
    const dirTo = (p, q) => DIRV.findIndex(d => d[0] === q[0] - p[0] && d[1] === q[1] - p[1]);
    this.tiles = cells.map((c0, idx) => {
      const ins = idx ? (dirTo(c0, cells[idx - 1])) : -1, out = idx < cells.length - 1 ? dirTo(c0, cells[idx + 1]) : (idx ? (ins + 2) % 4 : 1);
      const open = ins < 0 ? [out] : [ins, out];
      const straight = open.length === 2 && (open[0] + 2) % 4 === open[1];
      let rot = 0; if (idx > 0) { const pre = Game.diff === 'tranqui' && Math.random() < .35; rot = pre ? 0 : straight ? pick([1, 3]) : pick([1, 2, 3]); }
      return { idx, gx: c0[0], gy: c0[1], x: ox + c0[0] * cs, y: oy + c0[1] * cs, open, rot, fixed: idx === 0, spin: 0, last: idx === cells.length - 1 };
    });
    this.water = 0; this.flowT = -Game.d(15, 11, 8); this.leakAt = -1; this.wprog = 0;
  }
  tileAt(x, y) { if (!this.tiles) return null; return this.tiles.find(t => x >= t.x && x < t.x + this.cs && y >= t.y && y < t.y + this.cs); }
  opensOf(t) { return t.open.map(d => (d + t.rot) % 4); }
  connected(i) { // ¿el agua puede pasar de la casilla i-1 a la i?
    const a = this.tiles[i - 1], b = this.tiles[i]; const d = DIRV.findIndex(v => v[0] === b.gx - a.gx && v[1] === b.gy - a.gy);
    return this.opensOf(a).includes(d) && this.opensOf(b).includes((d + 2) % 4);
  }
  play(dt) {
    for (const t of this.tiles || []) if (t.spin > 0) t.spin = Math.max(0, t.spin - dt * 6);
    if (this.phase === 'tubos') {
      this.flowT += dt; const step = Game.d(.6, .45, .35);
      if (this.flowT >= step) {
        const nx = this.water + 1;
        if (nx >= this.tiles.length) { const last = this.tiles[this.tiles.length - 1]; if (this.opensOf(last).includes(last.open[last.open.length - 1])) this.riverDone(); else this.leak(last); this.flowT = 0; }
        else if (this.connected(nx)) { this.water = nx; this.flowT = 0; this.leakAt = -1; Sound.sfx('plop'); }
        else this.leak(this.tiles[this.water]);
      }
    }
    if (this.phase === 'norte') { for (const n of this.nsprings) if (n.on && n.t < 1) n.t = Math.min(1, n.t + dt * 2.5); if (this.nsprings.every(n => n.t >= 1) && !this.nq) { this.nq = true; later(.8, () => this.norteQuiz()); } }
  }
  leak(t) {
    if (this.leakAt !== t.idx) { this.leakAt = t.idx; this.leaks++; this.score = Math.max(0, this.score - 25); Sound.sfx('splash'); shake(4, .2); pop(t.x + 20, t.y - 10, '¡Fuga!', '#3e8ef0', 30); if (this.leaks % 3 === 1) this.alvSay('gloat'); }
    if (G.t % .3 < .05) burst(t.x + 20, t.y + 20, { n: 3, c: ['#5cc2f5', '#fff'], sp: 160 });
    this.flowT = Game.d(1.2, 1.0, .8);
  }
  riverDone() {
    const r = this.cur; this.phase = 'lleno'; this.doneRivers.push(r.id); this.anim = { id: r.id, k: 0 }; tw(this.anim, { k: 1 }, 1.4);
    Sound.sfx('splash'); Sound.sfx('fanfare'); this.score += 150; this.showBanner('RÍO ' + r.id.toUpperCase(), 'Nace en ' + r.naceTxt + ' y desemboca en el ' + MARES[r.mar].replace(/^Mar /, 'mar ').replace(/^Océano /, 'océano '), 2.2, '#3e8ef0');
    later(2.6, () => { this.tiles = null; this.i++; this.beginRiver(); });
  }
  beginNorte() {
    this.phase = 'norte'; this.nq = false;
    this.nsprings = RIOS_NORTE.map(n => { const pts = GEO.es.rivers[n][0]; const [x, y] = this.map.P(pts[0], pts[1]); return { id: n, x, y, on: false, t: 0 }; });
    this.say('¡Último! Los ríos del NORTE nacen en la Cordillera Cantábrica y van al mar Cantábrico. Abrid sus cinco fuentes y mirad qué pasa.');
  }
  norteQuiz() {
    const opts = shuffle(['Cortos, rápidos y caudalosos', 'Largos, lentos y con poca agua', 'Largos, rápidos y sin agua']);
    this.phase = 'quiz'; this.say('¡Qué deprisa se han llenado! ¿Cómo son los ríos del norte?');
    this.qbtns = opts.map((o, j) => answerBtn({ x: 870, y: 300 + j * 138, w: 390, h: 120, color: ['#3ec1f3', '#a66cff', '#ff8a3d'][j], text: o, size: 26, onTap: () => this.answerNorte(o) }));
    this.btns.push(...this.qbtns);
  }
  answerNorte(o) {
    if (this.phase !== 'quiz') return; this.phase = 'fin'; this.btns = this.btns.filter(b => !this.qbtns.includes(b));
    const ok = o === 'Cortos, rápidos y caudalosos';
    const end = () => { this.showBanner('¡Ríos salvados!', null, 1.4); this.finish({ delay: 1.6 }); };
    if (ok) { this.good(1060, 400, 'norte'); end(); }
    else this.bad(1060, 400, 'norte', 'Los ríos del norte nacen muy cerca del mar, en la Cordillera Cantábrica: son CORTOS y bajan RÁPIDOS. Como allí llueve mucho, llevan mucha agua: son CAUDALOSOS.', 'Ríos del norte: cortos, rápidos y caudalosos', { then: end });
  }
  render(c) {
    bg('mar'); const m = this.map; m.drawBase(); m.drawRanges(Object.keys(GEO.es.ranges));
    const r = this.cur;
    if (this.doneRivers.length) m.drawRivers(this.doneRivers.filter(id => !this.anim || id !== this.anim.id));
    if (this.anim) m.paintRiver(c, GEO.es.rivers[this.anim.id][0], 6, this.anim.k, false);
    if (r && this.phase !== 'lleno') m.paintRiver(c, GEO.es.rivers[r.id][0], 5, 0, true);
    if (this.phase === 'norte' || this.phase === 'quiz' || this.phase === 'fin') for (const n of this.nsprings) { m.paintRiver(c, GEO.es.rivers[n.id][0], 5, n.t, n.t < 1); drawSpring(n.x, n.y, .7, n.on); if (!n.on) txt('▼', n.x, n.y - 36 + Math.sin(G.t * 6) * 5, { size: 26, color: '#ff8a3d', outline: 5 }); }
    if (this.phase === 'fuente') for (const s of this.springs) { const [x, y] = this.scr(...s.at); drawSpring(x, y, 1, !!s.on); chip(SYS_NAME[s.sys] || s.sys, x, y + 30, '#c98c5a', '#fff', 16); }
    if (this.phase === 'mar') { for (const k in SEA_ARROWS) { const [x, y] = this.scr(...SEA_ARROWS[k]); const pul = this.phase === 'mar' ? 1 + Math.sin(G.t * 5) * .06 : 1; c.save(); c.translate(x, y); c.scale(pul, pul); circle(0, 0, 46, '#3e8ef0', INK, 5); txt('≈', 0, -4, { size: 44, color: '#fff', outline: 5 }); c.restore(); chip(MARES[k], x, y + 60, '#3e8ef0', '#fff', 16); } }
    if (this.phase === 'fuente' || this.phase === 'mar') { const s = this.springs.find(q => q.on); if (s) { const [x, y] = this.scr(...s.at); drawSpring(x, y, 1, true); } }
    // tuberías
    if (this.tiles) {
      for (const t of this.tiles) { const wet = t.idx <= this.water, leak = t.idx === this.leakAt; c.save(); c.translate(t.x + this.cs / 2, t.y + this.cs / 2); c.rotate(-t.spin * Math.PI / 2); c.translate(-t.x - this.cs / 2, -t.y - this.cs / 2); drawPipeTile(t.x, t.y, this.cs, this.opensOf(t), wet, leak, t.idx === 0, t.last); c.restore(); }

    }
    // panel
    panel(846, 96, 420, 176, '#fff8ea', { r: 24 }); txt(r ? 'RÍO ' + r.id.toUpperCase() : 'RÍOS DEL NORTE', 1056, 128, { size: 32, font: 'T', color: '#3e8ef0' });
    if (this.msg) { const k = this.msgK ?? 1; c.globalAlpha = k; wrap(this.msg, 380, 21).slice(0, 4).forEach((l, i) => txt(l, 866, 168 + i * 25, { size: 21, align: 'left', color: INK, w: 600 })); c.globalAlpha = 1; }
    if (this.phase === 'tubos') { panel(846, 490, 420, 120, this.flowT < 0 ? '#e6f4ff' : '#fff', { r: 24 }); if (this.flowT < 0) { txt('El agua sale en', 1056, 525, { size: 22, color: '#3e8ef0' }); txt(String(Math.ceil(-this.flowT)), 1056, 572, { size: 48, font: 'T', color: '#3e8ef0' }); } else txt('¡El agua ya corre!', 1056, 550, { size: 28, font: 'T', color: '#3e8ef0' }); }
    if (this.phase !== 'quiz') { panel(846, 290, 420, 180, '#fff', { r: 24 }); txt('RÍOS SALVADOS', 1056, 322, { size: 22, font: 'T', color: '#8c85b0' }); ['Duero', 'Tajo', 'Ebro'].forEach((id, j) => { const ok = this.doneRivers.includes(id); chip(id, 920 + j * 136, 380, ok ? '#3e8ef0' : '#c9c2dc', '#fff', 22); }); if (this.leaks) txt('Fugas: ' + this.leaks, 1056, 440, { size: 20, color: '#ff4b4b' }); }
  }
}
function drawPipeTile(x, y, s, opens, wet, leak, source, mouth) {
  const c = G.ctx; rr(x + 1, y + 1, s - 2, s - 2, 7, leak ? 'rgba(255,200,200,.95)' : 'rgba(255,248,234,.92)', INK, 2.5);
  const cx = x + s / 2, cy = y + s / 2;
  const path = () => { c.beginPath(); for (const d of opens) { c.moveTo(cx, cy); c.lineTo(cx + DIRV[d][0] * s / 2, cy + DIRV[d][1] * s / 2); } };
  c.lineCap = 'round'; path(); c.lineWidth = s * .42; c.strokeStyle = INK; c.stroke(); path(); c.lineWidth = s * .28; c.strokeStyle = wet ? '#3fa0f5' : '#b9a58c'; c.stroke();
  if (wet && !G.low) { path(); c.lineWidth = s * .08; c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([4, 6]); c.lineDashOffset = -G.t * 30; c.stroke(); c.setLineDash([]); }
  if (source) circle(cx, cy, s * .24, '#3fa0f5', INK, 2.5);
  if (mouth) txt('≈', cx, cy, { size: s * .5, color: '#fff', outline: 3 });
}
