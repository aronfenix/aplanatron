'use strict';
/* =====================================================================
   MISIÓN 3 · LOS FAROS APAGADOS (costas)
   ===================================================================== */
function drawBuoy(x, y, s = 1, on = false) {
  const c = G.ctx, b = Math.sin(G.t * 3 + x) * 3; c.save(); c.translate(x, y + b); c.scale(s, s);
  if (on) { c.globalAlpha = .5 + Math.sin(G.t * 6) * .2; circle(0, -34, 26, 'rgba(255,240,120,.6)'); c.globalAlpha = 1; }
  c.beginPath(); c.moveTo(-18, 0); c.lineTo(-10, -30); c.lineTo(10, -30); c.lineTo(18, 0); c.closePath(); fillStroke(c, '#ff4b5c', 4);
  c.fillStyle = '#fff'; c.fillRect(-14, -18, 28, 8); rr(-4, -44, 8, 14, 3, INK); circle(0, -46, 7, on ? '#fff27a' : '#5c6380', INK, 3);
  ell(c, 0, 0, 24, 7); fillStroke(c, '#1d4f8a', 4); c.restore();
}
class GameFaros extends Mini {
  constructor() { super(2); }
  setup() {
    this.map = new MapES({ x: 330, y: 40, s: .9, key: 'g3', style: 'night', layers: { countries: false } });
    this.marks = COSTAS.map(it => ({ it, pos: it.cpt ? this.map.cpt(it.cpt) : this.map.pt(it.pt), lit: false }));
    this.items = Game.choose(COSTAS, Game.d(8, 12, 17));
    this.i = 0; this.phase = 'A';
    this.boat = { x: 160, y: 520, k: 1 };
    this.prog = () => this.phase === 'A' ? [this.i, this.items.length] : [this.bi, this.bitems.length];
    this.showBanner('¡Encended los faros!', 'Tocad en el mapa el sitio que busca cada barco', 2.2);
    later(2.4, () => this.next());
  }
  next() {
    if (this.i >= this.items.length) return this.startB();
    this.cur = this.items[this.i]; this.lock = false; this.qk = 0; tw(this, { qk: 1 }, .45, { ease: E.outBack });
    this.boat = { x: 160, y: 540, k: 0 }; tw(this.boat, { k: 1 }, .5, { ease: E.outBack }); Sound.sfx('horn');
    this.setSpeak(this.cur.name, 236, 390);
  }
  near(p) { let best = null, bd = 44; for (const m of this.marks) { const d = dist(p.x, p.y, m.pos[0], m.pos[1] - 16); if (d < bd) { bd = d; best = m; } } return best; }
  onDown(p) {
    if (this.phase !== 'A' || this.lock || !this.cur) return;
    const m = this.near(p); if (!m) return; this.lock = true;
    const right = this.marks.find(k => k.it === this.cur);
    if (m === right) { this.light(m); this.good(m.pos[0], m.pos[1] - 40, this.cur.id, 100); this.sail(m, () => { this.i++; this.nextTurn(); this.next(); }); }
    else { m.wrong = G.t; this.bad(m.pos[0], m.pos[1], this.cur.id, this.cur.hint, this.cur.name, { then: () => { this.light(right); right.show = G.t; this.sail(right, () => { this.i++; this.nextTurn(); this.next(); }); } }); }
  }
  light(m) { m.lit = true; Sound.sfx('bling'); burst(m.pos[0], m.pos[1] - 30, { n: 14, c: ['#fff27a', '#ffc933', '#fff'] }); }
  sail(m, done) { tw(this.boat, { x: m.pos[0], y: m.pos[1] + 6, k: .45 }, 1.1, { ease: E.inOut, done: () => later(.35, done) }); Sound.sfx('whoosh'); this.setSpeak(null); }
  /* ---------- fase B: ¿qué mar? ---------- */
  startB() {
    this.phase = 'B'; this.cur = null; this.bi = 0;
    for (const m of this.marks) if (!m.lit) { m.lit = true; }
    Sound.sfx('sparkle');
    const pool = COSTAS.filter(x => x.sea).map(x => ({ id: 'sea_' + x.id, text: x.name, sea: x.sea, pos: this.marks.find(m => m.it === x).pos, hint: x.hint })).concat(COSTA_TIPOS.map(x => ({ id: 'sea_' + x.id, text: x.text, sea: x.sea, pos: this.map.pt(x.pt), hint: x.hint, tipo: true })));
    this.bitems = Game.choose(pool, Game.d(6, 8, 10));
    this.showBanner('¿Qué mar baña esta costa?', 'Cantábrico, Atlántico o Mediterráneo', 2.4);
    const mk = (sea, y, col) => answerBtn({ x: 22, y, w: 286, h: 140, color: col, text: SEAS[sea], size: 30, sea, onTap: () => this.answer(sea) });
    this.seaBtns = [mk('cantabrico', 250, '#2fb8a0'), mk('atlantico', 410, '#3e8ef0'), mk('mediterraneo', 570, '#ff8a3d')];
    this.seaBtns.forEach(b => b.on = false); this.btns.push(...this.seaBtns);
    later(2.6, () => this.nextB());
  }
  nextB() {
    if (this.bi >= this.bitems.length) { this.showBanner('¡Costas a salvo!', null, 1.4); Sound.sfx('fanfare'); return this.finish({ delay: 1.6 }); }
    this.bcur = this.bitems[this.bi]; this.seaBtns.forEach(b => { b.on = true; b.mark = null; }); this.block = false;
    this.qk = 0; tw(this, { qk: 1 }, .4, { ease: E.outBack }); this.setSpeak(this.bcur.text, 330, 150);
  }
  answer(sea) {
    if (this.block) return; this.block = true; const it = this.bcur; this.seaBtns.forEach(b => b.on = false);
    const done = () => { this.bi++; this.nextTurn(); this.nextB(); };
    if (sea === it.sea) { this.seaBtns.find(b => b.sea === sea).mark = 'ok'; this.good(it.pos[0], it.pos[1] - 40, it.id, 100); later(.8, done); }
    else { this.seaBtns.find(b => b.sea === sea).mark = 'ko'; this.seaBtns.find(b => b.sea === it.sea).mark = 'ok'; this.bad(it.pos[0], it.pos[1], it.id, it.hint, SEAS[it.sea], { then: done }); this.missed[this.missed.length - 1] = it.text + ': ' + SEAS[it.sea]; }
  }
  render(c) {
    const m = this.map; c.fillStyle = '#153a6b'; c.fillRect(0, 0, W, H);
    m.drawBase();
    c.fillStyle = 'rgba(10,10,40,.12)'; c.fillRect(0, 0, W, H);
    if (Game.diff === 'tranqui' || this.phase === 'A') { const lab = (t, x, y) => txt(t, x, y, { size: 22, font: 'T', color: 'rgba(255,255,255,.75)' }); const a = m.pt('marCantabrico'), b = m.pt('oAtlantico'), d = m.pt('marMedit'); if (this.phase === 'A' || Game.diff === 'tranqui') { lab('MAR CANTÁBRICO', a[0], a[1]); lab('OCÉANO', b[0] + 40, b[1] - 14); lab('ATLÁNTICO', b[0] + 40, b[1] + 14); lab('MAR MEDITERRÁNEO', d[0] + 30, d[1] + 40); } }
    // marcas
    for (const mk of this.marks) {
      const [x, y] = mk.pos, it = mk.it, wrong = mk.wrong && G.t - mk.wrong < .8;
      const hl = this.phase === 'B' && this.bcur && dist(this.bcur.pos[0], this.bcur.pos[1], x, y) < 2;
      if (hl) { c.globalAlpha = .5 + Math.sin(G.t * 6) * .3; circle(x, y - 16, 34 + Math.sin(G.t * 6) * 6, null, '#fff36a', 8); c.globalAlpha = 1; }
      if (it.kind === 'faro') drawLighthouse(x, y + 4, .36, mk.lit, { ph: x * .01 });
      else if (it.kind === 'boya') drawBuoy(x, y + 4, .7, mk.lit);
      else { circle(x, y - 12, 16, mk.lit ? '#fff27a' : '#5c6380', INK, 4); drawStar(x, y - 12, 10, mk.lit); }
      if (wrong) circle(x, y - 16, 30, null, '#ff4b4b', 7);
      if (mk.show && G.t - mk.show < 4) arrowDown(x, y - 50, .7, '#7ce05c');
      if (mk.lit && this.phase === 'A') chip(it.short || it.name, x, y + 22, 'rgba(255,255,255,.9)', INK, 12);
    }
    if (this.phase === 'B' && this.bcur && this.bcur.tipo) { const [x, y] = this.bcur.pos; arrowDown(x, y - 40, .9); }
    // barco
    if (this.phase === 'A') { const b = this.boat; c.save(); if (b.x > 318) drawBoat(b.x, b.y, .9 * b.k, { sail: '#ffc933' }); c.restore(); }
    // panel izquierdo
    rr(0, 90, 318, 710, 0, 'rgba(255,248,234,.93)'); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(318, 90); c.lineTo(318, H); c.stroke();
    if (this.phase === 'A') {
      turnChip(this.turn, 160, 128);
      if (this.cur) {
        const k = this.qk; c.save(); c.translate(160, 300); c.scale(k, k); c.translate(-160, -300);
        bubble('¡Socorro! No veo nada. ¿Dónde está…', 20, 176, 280, { below: true, tail: false, size: 22 });
        panel(20, 260, 280, 120, '#fff', { r: 22 }); const nm = this.cur.name; wrap(nm, 250, 30, 'T').forEach((l, i, a) => txt(l, 160, 320 - (a.length - 1) * 17 + i * 34, { size: 30, font: 'T', color: '#2b6ad0' }));
        c.restore();
        seaFill(c, 0, 600, 318, 200); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 600); c.lineTo(318, 600); c.stroke();
        if (this.boat.x <= 318) drawBoat(this.boat.x, this.boat.y + 60, 1.3 * this.boat.k, { sail: '#ffc933' });
      }
    } else {
      turnChip(this.turn, 160, 128);
      if (this.bcur) { const k = this.qk; c.save(); c.translate(160, 190); c.scale(k, k); c.translate(-160, -190); panel(14, 150, 290, 88, '#fff', { r: 20 }); const L = wrap(this.bcur.text, 264, 22); L.slice(0, 3).forEach((l, i) => txt(l, 160, 194 - (Math.min(3, L.length) - 1) * 13 + i * 26, { size: 22, color: INK })); c.restore(); }
    }
  }
}
/* =====================================================================
   MISIÓN 4 · EL PARTE DEL TIEMPO (climas de España)
   ===================================================================== */
class GameTiempo extends Mini {
  constructor() { super(3); }
  setup() {
    const pool = CARTAS_CLIMA.filter(x => Game.diff === 'turbo' || !x.turbo);
    this.items = Game.choose(pool, Game.d(10, 14, 20));
    this.i = 0; this.mini = new MapES({ x: 0, y: 0, s: .3, key: 'mini', layers: { countries: false } });
    const mk = (cl, x, y, pl) => answerBtn({ x, y, w: 300, h: 190, color: CLIMAS[cl].col, text: CLIMAS[cl].name, size: 34, clima: cl, tag: Game.name(pl), tagC: PCOL[pl], onTap: () => this.answer(cl) });
    this.cBtns = [mk('oceanico', 20, 150, 0), mk('montana', 20, 440, 0), mk('mediterraneo', 960, 150, 1), mk('subtropical', 960, 440, 1)];
    for (const b of this.cBtns) { const cl = b.clima, old = b.icon; b.icon = (cx, cy, bb) => { drawWeather(CLIMAS[cl].icon, cx, cy - 22, .62); txt(CLIMAS[cl].name, cx, cy + 50, { size: 32, font: 'T', color: '#fff', outline: 7 }); if (bb.tag) chip(bb.tag, bb.w - 14, 6, bb.tagC, '#fff', 16, 'right'); if (bb.mark) { const ok = bb.mark === 'ok'; circle(28, 28 - bb.h / 2 + cy, 22, ok ? '#7ce05c' : '#ff4b4b', INK, 4); txt(ok ? '✓' : '✗', 28, 29 - bb.h / 2 + cy, { size: 26, color: '#fff' }); } }; b.on = false; }
    this.btns.push(...this.cBtns);
    this.prog = () => [this.i, this.items.length];
    this.showBanner('¡Arreglad el parte del tiempo!', 'Mandad cada tarjeta a su clima', 2.2);
    later(2.4, () => this.next());
  }
  next() {
    if (this.i >= this.items.length) { this.showBanner('¡Climas en orden!', null, 1.4); Sound.sfx('fanfare'); return this.finish({ delay: 1.6 }); }
    this.cur = this.items[this.i]; this.lock = false; this.t = 0; this.tMax = Game.d(0, 11, 7);
    this.card = { k: 0, x: 640, y: 380, s: 1, r: 0 }; tw(this.card, { k: 1 }, .45, { ease: E.outBack }); Sound.sfx('whoosh');
    this.cBtns.forEach(b => { b.on = true; b.mark = null; });
    this.setSpeak(this.cur.text, 850, 104);
  }
  answer(cl) {
    if (this.lock || !this.cur) return; this.lock = true; const it = this.cur; this.cBtns.forEach(b => b.on = false);
    const b = this.cBtns.find(b => b.clima === cl), right = this.cBtns.find(b => b.clima === it.clima);
    const go2 = () => { this.i++; this.next(); };
    if (cl === it.clima) { b.mark = 'ok'; tw(this.card, { x: b.x + b.w / 2, y: b.y + b.h / 2, s: .2, r: 1 }, .45, { ease: E.inQ }); this.good(b.x + b.w / 2, b.y + b.h / 2, it.id, 100); later(.8, go2); }
    else { b.mark = 'ko'; right.mark = 'ok'; this.bad(b.x + b.w / 2, b.y + b.h / 2, it.id, CLIMA_HINT[it.clima], 'Clima ' + CLIMAS[it.clima].name.toLowerCase(), { then: () => { tw(this.card, { x: right.x + right.w / 2, y: right.y + right.h / 2, s: .2 }, .45, { ease: E.inQ }); later(.5, go2); } }); this.missed[this.missed.length - 1] = it.text + ' → clima ' + CLIMAS[it.clima].name.toLowerCase(); }
  }
  play(dt) {
    if (this.cur && !this.lock && this.tMax && this.card.k >= 1) { this.t += dt; if (this.t > this.tMax) { this.lock = true; const it = this.cur; this.cBtns.forEach(b => b.on = false); this.cBtns.find(b => b.clima === it.clima).mark = 'ok'; this.bad(640, 380, it.id, '¡Tiempo! ' + CLIMA_HINT[it.clima], 'Clima ' + CLIMAS[it.clima].name.toLowerCase(), { then: () => { this.i++; this.next(); } }); this.missed[this.missed.length - 1] = it.text + ' → clima ' + CLIMAS[it.clima].name.toLowerCase(); } }
  }
  render(c) {
    bg('tele');
    const it = this.cur;
    drawAlvaro(640, 760, .42, { expr: this.lock ? 'shock' : 'talk', talk: !this.lock && this.card && this.card.k < 1.01 && G.t % 3 < 1.2, arms: 'point', look: [.3, -.5] });
    if (it) {
      const cd = this.card; c.save(); c.translate(cd.x, cd.y); c.scale(cd.k * cd.s, cd.k * cd.s); c.rotate(cd.r * 3);
      panel(-200, -200, 400, 400, '#fff', { r: 30 });
      const kindTag = { planta: 'VEGETACIÓN', lugar: 'LUGAR', tiempo: 'EL TIEMPO' }[it.kind]; chip(kindTag, 0, -196, '#6a4fc8', '#fff', 18);
      if (it.kind === 'planta') { drawPlant(it.art, 0, 70, it.art === 'pradera' ? 1.3 : .95); }
      else if (it.kind === 'tiempo') { drawWeather(it.art, 0, -30, 1.3); }
      else { c.save(); c.translate(-150, -170); const mm = this.mini; c.save(); rrPath(c, 0, 0, 300, 240, 16); c.clip(); c.drawImage(cached('mini:base', W, H, cc => mm.paintBase(cc)), 0, 0, W, H); c.restore(); rr(0, 0, 300, 240, 16, null, INK, 4);
        const p = it.cpt ? mm.cpt(it.cpt) : mm.pt(it.pt); const pr = 10 + Math.sin(G.t * 6) * 3; circle(p[0], p[1], pr + 8, 'rgba(255,75,75,.35)'); circle(p[0], p[1], 9, '#ff4b4b', INK, 4); c.restore(); }
      const L = wrap(it.text, 360, 32); L.forEach((l, i) => txt(l, 0, 150 - (L.length - 1) * 18 + i * 36, { size: L.length > 1 ? 28 : 34, color: INK }));
      c.restore();
      if (this.tMax && !this.lock) timeBar(470, 138, 340, 1 - this.t / this.tMax, '#3ec1f3');
    }
  }
}
