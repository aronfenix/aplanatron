'use strict';
/* =====================================================================
   MISIÓN 5 · OPERACIÓN TAPÓN (ríos de España)
   ===================================================================== */
const VERT_SEA = { cantabrica: 'marCantabrico', atlantica: 'oAtlantico', mediterranea: 'marMedit' };
class GameRios extends Mini {
  constructor() { super(4); }
  setup() {
    this.phase = 'A';
    this.mapA = new MapES({ x: 250, y: 96, s: .78, key: 'g5a', dry: true, layers: { countries: false } });
    const d = Game.diff;
    let pool = RIOS.filter(r => (d === 'turbo' || !r.turbo) && (d !== 'tranqui' || !r.of));
    let items = Game.choose(pool, Game.d(8, 11, 14)).map(r => ({ ...r, kind: 'rio' }));
    const nd = Game.d(0, 1, 2); items = items.concat(shuffle(RIOS_DESC).slice(0, nd).map(x => ({ ...x, kind: 'desc' })));
    this.items = shuffle(items); this.i = 0;
    this.seaPos = {}; for (const v in VERT_SEA) this.seaPos[v] = this.mapA.pt(VERT_SEA[v]);
    this.seaPos.atlantica = [this.seaPos.atlantica[0] + 20, this.seaPos.atlantica[1] + 40];
    this.seaPos.cantabrica = [this.seaPos.cantabrica[0], this.seaPos.cantabrica[1] + 10];
    this.seaPos.mediterranea = [this.seaPos.mediterranea[0] + 40, this.seaPos.mediterranea[1] + 70];
    this.home = this.mapA.pt('madrid'); this.home = [this.home[0] + 10, this.home[1] - 20];
    this.seaBtns = Object.keys(VERT_SEA).map(v => { const [x, y] = this.seaPos[v]; return new Btn({ x: x - 110, y: y - 44, w: 220, h: 96, color: VERTIENTES[v].col, label: '', r: 30, vert: v, on: false, icon: (cx, cy) => { txt(VERTIENTES[v].sea.split(' ')[0].toUpperCase(), cx, cy - 16, { size: 20, color: '#fff', outline: 5 }); txt(VERTIENTES[v].sea.split(' ').slice(1).join(' ').toUpperCase(), cx, cy + 12, { size: 26, font: 'T', color: '#fff', outline: 6 }); }, onTap: () => this.throwTo(v) }); });
    this.btns.push(...this.seaBtns);
    this.prog = () => this.phase === 'A' ? [this.i, this.items.length] : [this.bi, this.bitems.length];
    this.showBanner('¡Lanzad cada gota a su mar!', 'Deslizad el dedo desde la gota hacia el mar correcto', 2.4);
    later(2.6, () => this.next());
  }
  next() {
    if (this.i >= this.items.length) return this.startB();
    this.cur = this.items[this.i]; this.lock = false; this.seaBtns.forEach(b => b.on = true);
    this.drop = { x: this.home[0], y: this.home[1], k: 0, rot: 0 }; tw(this.drop, { k: 1 }, .5, { ease: E.outBack }); Sound.sfx('plop');
    this.setSpeak(this.cur.kind === 'desc' ? this.cur.text : 'Río ' + this.cur.id, 1140, 110);
  }
  onMove(p) { if (this.sw && this.sw.id === p.id) { this.sw.x = p.x; this.sw.y = p.y; } }
  onUp(p, cancel) {
    const s = this.sw; if (!s || s.id !== p.id) return; this.sw = null; if (cancel) return;
    const dx = p.x - s.x0, dy = p.y - s.y0; if (Math.hypot(dx, dy) < 40) return;
    const a = Math.atan2(dy, dx); let best = null, bd = 9;
    for (const v in this.seaPos) { const [sx, sy] = this.seaPos[v]; const b = Math.atan2(sy - this.drop.y, sx - this.drop.x); let dd = Math.abs(a - b); if (dd > Math.PI) dd = TAU - dd; if (dd < bd) { bd = dd; best = v; } }
    this.throwTo(best);
  }
  throwTo(v) {
    if (this.lock || !this.drop || this.phase !== 'A') return; this.lock = true; this.seaBtns.forEach(b => b.on = false);
    const it = this.cur, [sx, sy] = this.seaPos[v];
    Sound.sfx('whoosh'); tw(this.drop, { x: sx, y: sy - 50, rot: v === 'atlantica' ? -1 : 1 }, .55, { ease: E.inQ, done: () => {
      Sound.sfx('splash'); burst(sx, sy - 40, { n: 20, c: ['#5cc2f5', '#fff', '#3fa0f5'], sp: 320 }); this.drop = null;
      const done = () => { this.i++; this.nextTurn(); later(.4, () => this.next()); };
      const name = it.kind === 'desc' ? it.text : it.id;
      const hint = it.kind === 'desc' ? 'Vertiente ' + VERTIENTES[it.vert].name.toLowerCase() + ': ' + VERTIENTES[it.vert].rasgos : (it.of ? 'El ' + it.id + ' es afluente del ' + it.of + ', así que va al mismo mar que él: ' : 'El ' + it.id + ' desemboca en el ') + VERTIENTES[it.vert].sea + '. Es de la vertiente ' + VERTIENTES[it.vert].name.toLowerCase() + '.';
      if (v === it.vert) { this.good(sx, sy - 60, it.id, 100); this.glow = { v, t: G.t }; later(.6, done); }
      else this.bad(sx, sy - 40, it.id, hint, 'vertiente ' + VERTIENTES[it.vert].name.toLowerCase(), { title: 'Era la', then: done });
      if (v !== it.vert) this.missed[this.missed.length - 1] = name + ' → vertiente ' + VERTIENTES[it.vert].name.toLowerCase();
    } });
  }
  /* ---------- fase B: destapar ríos ---------- */
  startB() {
    this.phase = 'B0'; this.seaBtns.forEach(b => b.vis = false); this.drop = null;
    this.mapB = new MapES({ x: 330, y: 40, s: .9, key: 'g5b', dry: true, layers: { countries: false } });
    this.rivers = RIOS_MAPA.concat(Game.diff === 'turbo' ? RIOS_MAPA_TURBO : []);
    this.bitems = Game.choose(this.rivers.map(r => ({ id: r })), Game.d(5, 8, 11), x => 'map_' + x.id).map(x => x.id);
    if (Game.diff === 'tranqui') this.rivers = RIOS_MAPA;
    this.flow = {}; this.bi = 0; this.corks = {};
    for (const r of this.rivers) this.corks[r] = { on: true, y: 0, r: 0 };
    this.showBanner('¡Ahora, a quitar tapones!', 'Tocad el cauce seco del río que se pide', 2.4);
    later(2.6, () => { this.phase = 'B'; this.nextB(); });
  }
  nextB() {
    if (this.bi >= this.bitems.length) { for (const r of this.rivers) if (this.flow[r] == null) { this.flow[r] = 0; tw(this.flow, { [r]: 1 }, 1.4); } Sound.sfx('splash'); this.showBanner('¡El agua vuelve a correr!', null, 1.6); Sound.sfx('fanfare'); return this.finish({ delay: 2 }); }
    this.bcur = this.bitems[this.bi]; this.block = false; this.qk = 0; tw(this, { qk: 1 }, .4, { ease: E.outBack }); this.setSpeak('Río ' + this.bcur, 236, 384);
  }
  unplug(r) {
    this.flow[r] = 0; tw(this.flow, { [r]: 1 }, 1.6, { ease: E.lin }); const ck = this.corks[r]; if (ck) { ck.on = false; ck.vy = -500; ck.y = 0; }
    Sound.sfx('plop'); later(.2, () => Sound.sfx('splash'));
    const [x, y] = this.mapB.riverEnd(r); burst(x, y, { n: 14, c: ['#5cc2f5', '#fff', '#d9a066'] });
  }
  onDownB(p) {
    if (this.block) return; let best = null, bd = 30;
    for (const r of this.rivers) { if (this.flow[r] != null) continue; const d = this.mapB.riverHit(r, p.x, p.y); if (d < bd) { bd = d; best = r; } }
    if (!best) return; this.block = true; const it = this.bcur;
    const done = () => { this.bi++; this.nextTurn(); later(.8, () => this.nextB()); };
    if (best === it) { this.unplug(it); this.good(p.x, p.y - 30, 'map_' + it, 100); done(); }
    else { this.wrongR = { r: best, t: G.t }; this.bad(p.x, p.y, 'map_' + it, (RIO_INFO[it] || '') + ' Lo que habéis tocado era el ' + best + '.', 'río ' + it, { then: () => { this.unplug(it); this.showR = { r: it, t: G.t }; done(); } }); }
  }
  onDown(p) { if (this.phase === 'B') return this.onDownB(p); if (this.phase === 'A') return this.onDownA(p); }
  onDownA(p) { if (this.lock || !this.drop) return; if (dist(p.x, p.y, this.drop.x, this.drop.y) < 90) this.sw = { id: p.id, x0: p.x, y0: p.y, x: p.x, y: p.y }; }
  play(dt) { if (this.corks) for (const r in this.corks) { const ck = this.corks[r]; if (!ck.on && ck.vy != null) { ck.vy += 1400 * dt; ck.y += ck.vy * dt; ck.r += dt * 10; } } }
  render(c) {
    c.fillStyle = '#3ea5e6'; c.fillRect(0, 0, W, H);
    if (this.phase === 'A') {
      const m = this.mapA; m.drawBase(); m.drawRivers(RIOS_MAPA, { dry: true });
      for (const r of RIOS_MAPA) { const [x, y] = m.riverEnd(r); drawCork(x, y, .6); }
      if (this.glow && G.t - this.glow.t < 1) { const [x, y] = this.seaPos[this.glow.v]; c.globalAlpha = 1 - (G.t - this.glow.t); circle(x, y, 80 + (G.t - this.glow.t) * 80, null, '#fff', 10); c.globalAlpha = 1; }
      if (this.drop) {
        const d = this.drop, it = this.cur;
        if (this.sw) { c.save(); c.lineCap = 'round'; c.setLineDash([4, 14]); c.lineWidth = 10; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + (this.sw.x - this.sw.x0) * 1.6, d.y + (this.sw.y - this.sw.y0) * 1.6); c.stroke(); c.restore(); }
        drawDrop(d.x, d.y, .95 * d.k, { rot: d.rot, expr: this.sw ? 'scared' : 'happy', look: this.sw ? [clamp((this.sw.x - this.sw.x0) / 80, -1, 1), clamp((this.sw.y - this.sw.y0) / 80, -1, 1)] : [0, 0] });
        if (d.k > .5 && !this.lock) {
          if (it.kind === 'desc') bubble(it.text, d.x - 170, d.y - 70, 340, { size: 22, tailX: d.x });
          else { chip('Río ' + it.id, d.x, d.y + 86, '#fff', INK, 28); if (it.of && Game.diff === 'normal') chip('afluente del ' + it.of, d.x, d.y + 130, '#2b6ad0', '#fff', 18); }
          if (!this.sw) { const k = (G.t * .9) % 1; c.globalAlpha = 1 - k; circle(d.x + 40 + k * 50, d.y - k * 40, 16, '#fff', INK, 4); c.globalAlpha = 1; }
        }
      }
      turnChip(this.turn, 640, 76);
    } else {
      const m = this.mapB; if (!m) return; m.drawBase();
      const dry = this.rivers.filter(r => this.flow[r] == null), wet = this.rivers.filter(r => this.flow[r] != null);
      m.drawRivers(dry, { dry: true });
      if (wet.length) m.drawRivers(wet, { prog: this.flow });
      if (this.wrongR && G.t - this.wrongR.t < 1) { c.save(); c.globalAlpha = .7; c.lineWidth = 14; c.strokeStyle = '#ff4b4b'; c.lineCap = 'round'; for (const l of GEO.es.rivers[this.wrongR.r]) { c.beginPath(); ringPathOpen(c, l, m.tf); c.stroke(); } c.restore(); }
      for (const r of this.rivers) { const ck = this.corks[r]; const [x, y] = m.riverEnd(r); if (ck.on) drawCork(x, y, .7); else if (ck.y < 900) drawCork(x + ck.y * .2, y + ck.y, .7, ck.r); }
      for (const r of wet) { if (this.flow[r] >= 1) { const [x, y] = m.riverMid(r); chip(r, x, y, 'rgba(255,255,255,.9)', '#2b6ad0', 14); } }
      if (this.showR && G.t - this.showR.t < 3) { const [x, y] = m.riverMid(this.showR.r); arrowDown(x, y - 20, .7, '#7ce05c'); }
      rr(0, 90, 318, 710, 0, 'rgba(255,248,234,.93)'); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(318, 90); c.lineTo(318, H); c.stroke();
      if (this.phase === 'B' && this.bcur) {
        turnChip(this.turn, 160, 128);
        const k = this.qk; c.save(); c.translate(160, 320); c.scale(k, k); c.translate(-160, -320);
        txt('¿Dónde está el…', 160, 230, { size: 26, color: INK }); panel(20, 260, 280, 110, '#fff', { r: 22 }); txt('Río ' + this.bcur, 160, 318, { size: fitSize('Río ' + this.bcur, 250, 38, 'T'), font: 'T', color: '#2b6ad0' });
        drawDrop(160, 520, 1.1, { expr: 'happy', look: [1, -.3] }); c.restore();
      }
    }
  }
}
/* =====================================================================
   MISIÓN 6 · RODOLFO EN EUROPA (medio físico de Europa)
   ===================================================================== */
class GameEuropa extends Mini {
  constructor() { super(5); }
  setup() {
    this.map = new MapEU({ x: 330, y: 70, s: .84, key: 'g6' });
    this.items = Game.choose(EUROPA, Game.d(8, 12, 16), x => 'eu_' + x.id);
    this.markers = Game.diff !== 'turbo';
    this.i = 0; this.phase = 'A';
    this.prog = () => this.phase === 'A' ? [this.i, this.items.length] : [this.bi, this.bitems.length];
    this.showBanner('¡Que no aplane Europa!', 'Tocad en el mapa lo que dice Álvaro antes de que llegue Rodolfo', 2.6);
    later(2.8, () => this.next());
  }
  posOf(it) { const m = this.map; if (it.type === 'range') return m.rangeMid(it.id); if (it.type === 'river') return m.riverMid(it.id); return m.pt(it.id); }
  hitDist(it, p) {
    const m = this.map;
    if (this.markers) { const [x, y] = this.posOf(it); return dist(p.x, p.y, x, y) - 8; }
    if (it.type === 'range') { const [mx, my] = m.M(p.x, p.y); return segDist(mx, my, GEO.eu.ranges[it.id]) * m.s - 6; }
    if (it.type === 'river') { let b = 1e9; const [mx, my] = m.M(p.x, p.y); for (const l of GEO.eu.rivers[it.id]) b = Math.min(b, segDist(mx, my, l)); return b * m.s; }
    const [x, y] = m.pt(it.id); return dist(p.x, p.y, x, y) - 20;
  }
  next() {
    if (this.i >= this.items.length) return this.startB();
    this.cur = this.items[this.i]; this.lock = false; this.T = Game.d(16, 11, 8); this.t = 0;
    this.cands = this.markers ? EUROPA.filter(x => x.cat === this.cur.cat) : EUROPA;
    const tgt = this.posOf(this.cur), side = pick([[this.map.x, rnd(200, 700)], [1250, rnd(200, 700)], [rnd(400, 1200), 90], [rnd(400, 1200), 790]]);
    this.rod = { x0: side[0], y0: side[1], x: side[0], y: side[1], tx: tgt[0], ty: tgt[1] };
    this.qk = 0; tw(this, { qk: 1 }, .4, { ease: E.outBack }); Sound.sfx('horn');
    this.setSpeak('¡A por ' + this.cur.name + '!', 236, 566);
  }
  onDown(p) {
    if (this.phase !== 'A' || this.lock || !this.cur || p.x < 320) return;
    let best = null, bd = this.markers ? 34 : 40;
    for (const it of this.cands) { const d = this.hitDist(it, p); if (d < bd) { bd = d; best = it; } }
    if (!best) { if (!this.markers) { this.missTap = { x: p.x, y: p.y, t: G.t }; Sound.sfx('buzz'); } return; }
    this.lock = true; const it = this.cur, [tx, ty] = this.posOf(it);
    const done = () => { this.i++; this.nextTurn(); later(.5, () => this.next()); };
    if (best === it) { this.saved = { it, t: G.t }; this.good(tx, ty - 30, 'eu_' + it.id, 100 + Math.round(40 * (1 - this.t / this.T))); Sound.sfx('boing'); tw(this.rod, { x: this.rod.x0, y: this.rod.y0 }, .8, { ease: E.inBack, done }); }
    else { this.wrongTap = { x: p.x, y: p.y, t: G.t }; this.bad(p.x, p.y, 'eu_' + it.id, it.hint, cap(it.name), { then: () => { this.showT = { it, t: G.t }; done(); } }); }
  }
  flatten() {
    this.lock = true; const it = this.cur, [tx, ty] = this.posOf(it); this.squash = { it, t: G.t };
    Sound.sfx('stomp'); shake(12, .4); puff(tx, ty, { n: 10 });
    this.bad(tx, ty, 'eu_' + it.id, '¡Rodolfo ha llegado primero! ' + it.hint, cap(it.name), { then: () => { this.i++; this.nextTurn(); later(.4, () => this.next()); } });
  }
  play(dt) {
    if (this.phase === 'A' && this.cur && !this.lock && this.qk >= 1) {
      this.t += dt; const k = clamp(this.t / this.T, 0, 1), r = this.rod; r.x = lerp(r.x0, r.tx, k); r.y = lerp(r.y0, r.ty, k);
      if (k >= 1) this.flatten();
    }
    if (this.phase === 'B' && this.bcur && !this.block && this.bT) { this.bt += dt; if (this.bt > this.bT) this.vote(null); }
  }
  /* ---------- fase B: ¿verdad o bulo? ---------- */
  startB() {
    this.phase = 'B0'; this.cur = null;
    this.bitems = Game.choose(BULOS, Game.d(6, 8, 10)); this.bi = 0;
    this.showBanner('¡Noticias de Tele-Álvaro!', '¿Es verdad o es un bulo?', 2.2);
    this.vBtns = [answerBtn({ x: 330, y: 610, w: 290, h: 130, color: '#7ce05c', text: 'VERDAD', size: 44, v: true, onTap: () => this.vote(true) }), answerBtn({ x: 660, y: 610, w: 290, h: 130, color: '#ff4b4b', text: 'BULO', size: 44, v: false, onTap: () => this.vote(false) })];
    this.vBtns.forEach(b => b.on = false); this.btns.push(...this.vBtns);
    later(2.4, () => { this.phase = 'B'; this.nextB(); });
  }
  nextB() {
    if (this.bi >= this.bitems.length) { this.showBanner('¡Europa, a salvo!', null, 1.4); Sound.sfx('fanfare'); return this.finish({ delay: 1.6 }); }
    this.bcur = this.bitems[this.bi]; this.block = false; this.bt = 0; this.bT = Game.d(0, 14, 9); this.vBtns.forEach(b => { b.on = true; b.mark = null; });
    this.qk = 0; tw(this, { qk: 1 }, .4, { ease: E.outBack }); Sound.sfx('drumroll'); this.setSpeak(this.bcur.text, 1080, 180);
  }
  vote(v) {
    if (this.block) return; this.block = true; const it = this.bcur; this.vBtns.forEach(b => b.on = false);
    const done = () => { this.bi++; this.nextTurn(); later(.4, () => this.nextB()); };
    const right = this.vBtns.find(b => b.v === it.v);
    if (v === it.v) { right.mark = 'ok'; this.good(right.x + right.w / 2, right.y, it.id, 100); later(.9, done); }
    else { if (v != null) this.vBtns.find(b => b.v === v).mark = 'ko'; right.mark = 'ok'; this.bad(640, 300, it.id, it.v ? '¡Era VERDAD! ' + it.text : '¡Era un BULO! ' + (it.fix || ''), it.v ? 'VERDAD' : 'BULO', { then: done }); this.missed[this.missed.length - 1] = it.text + (it.v ? ' (verdad)' : ' → bulo: ' + (it.fix || '')); }
  }
  render(c) {
    if (this.phase === 'A' || this.phase === 'B0' && !this.bitems) {
      const m = this.map; c.fillStyle = '#3ea5e6'; c.fillRect(0, 0, W, H);
      m.drawBase(); m.drawRanges(Object.keys(GEO.eu.ranges)); m.drawRivers(Object.keys(GEO.eu.rivers));
      const sq = this.squash && G.t - this.squash.t < 2 ? this.squash.it : null;
      if (sq) { const [x, y] = this.posOf(sq); c.save(); c.globalAlpha = 1 - (G.t - this.squash.t) / 2; ell(c, x, y, 60, 14); fillStroke(c, '#9a93b5', 5); c.restore(); }
      if (this.markers && this.cands && !this.lock) for (const it of this.cands) { const [x, y] = this.posOf(it); circle(x, y, 18, '#fff', INK, 5); circle(x, y, 7, '#a66cff'); }
      if (this.wrongTap && G.t - this.wrongTap.t < .8) circle(this.wrongTap.x, this.wrongTap.y, 26, null, '#ff4b4b', 7);
      if (this.missTap && G.t - this.missTap.t < .5) circle(this.missTap.x, this.missTap.y, 20, null, 'rgba(255,255,255,.8)', 5);
      if (this.showT && G.t - this.showT.t < 3.5) { const [x, y] = this.posOf(this.showT.it); arrowDown(x, y - 16, .7, '#7ce05c'); chip(cap(this.showT.it.name), x, y + 26, '#fff', INK, 16); }
      if (this.saved && G.t - this.saved.t < 2) { const [x, y] = this.posOf(this.saved.it); chip(cap(this.saved.it.name), x, y + 26, '#7ce05c', '#fff', 18); }
      if (this.rod && this.cur) { const r = this.rod; drawRodolfo(r.x, r.y + 20, .17, { moving: !this.lock, flip: r.tx < r.x0, rider: 'evil', riderArms: 'point', dist: G.t * 3 }); }
      rr(0, 90, 318, 710, 0, 'rgba(255,248,234,.93)'); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(318, 90); c.lineTo(318, H); c.stroke();
      if (this.cur) {
        turnChip(this.turn, 160, 128);
        const k = this.qk; c.save(); c.translate(160, 300); c.scale(k, k); c.translate(-160, -300);
        drawAlvaro(80, 350, .3, { expr: 'evil', arms: 'point', talk: !this.lock });
        bubble('¡Rodolfo, a por…', 128, 200, 180, { size: 20, below: true, tail: false });
        panel(20, 380, 280, 130, '#fff', { r: 22 }); wrap(cap(this.cur.name), 250, 30, 'T').forEach((l, i, a) => txt(l, 160, 446 - (a.length - 1) * 17 + i * 34, { size: 30, font: 'T', color: '#a66cff' }));
        chip(this.cur.cat.toUpperCase(), 160, 380, '#a66cff', '#fff', 16);
        c.restore();
        if (!this.lock) timeBar(30, 534, 190, 1 - this.t / this.T, '#a66cff');
        drawRodolfo(160, 760, .38, { moving: !this.lock, rider: null, expr: this.lock ? 'sleepy' : 'angry', dist: G.t * 3 });
      }
    } else {
      bg('tele'); rr(-10, 560, W + 20, 260, 0, '#3b2f78', INK, 6);
      c.fillStyle = '#ff4b4b'; c.fillRect(226, 400, 828, 60); txt('ÚLTIMA HORA · ÚLTIMA HORA · ÚLTIMA HORA', 640 - ((G.t * 80) % 200), 432, { size: 30, font: 'T', color: '#fff', outline: 6 });
      drawAlvaro(1110, 740, .55, { expr: this.block ? 'side' : 'talk', talk: !this.block && G.t % 4 < 2, arms: 'idle' });
      if (this.bcur) { const k = this.qk; c.save(); c.translate(640, 250); c.scale(k, k); panel(-380, -130, 760, 250, '#fff', { r: 26 }); const L = wrap('«' + this.bcur.text + '»', 700, 38); L.forEach((l, i) => txt(l, 0, -10 - (L.length - 1) * 23 + i * 46, { size: 38, color: INK })); c.restore(); if (this.bT && !this.block) timeBar(330, 560, 620, 1 - this.bt / this.bT, '#ffc933'); turnChip(this.turn, 640, 108); }
    }
  }
}
