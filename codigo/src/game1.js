'use strict';
/* =====================================================================
   MISIÓN 1 · LA FUGA DE LAS CORDILLERAS (relieve de España)
   ===================================================================== */
class GameRelieve extends Mini {
  constructor() { super(0); }
  setup() {
    this.map = new MapES({ x: 330, y: 40, s: .9, key: 'g1', layers: { meseta: true, countries: true } });
    const n = Game.d(8, 12, 15);
    this.items = Game.choose(RELIEVE, n);
    this.pins = (Game.diff === 'tranqui' ? this.items : RELIEVE).map(it => ({ it, pos: this.pinPos(it), placed: false }));
    this.placed = {}; this.rise = {}; this.fade = {};
    this.phase = 'A'; this.i = 0; this.cur = null; this.drag = null;
    this.showBanner('¡Devolved el relieve a su sitio!', 'Arrastrad cada criatura hasta su marca del mapa', 2.2);
    later(2.4, () => this.nextItem());
    this.prog = () => this.phase === 'A' || !this.bitems ? [this.i, this.items.length] : [this.bi, this.bitems.length];
  }
  pinPos(it) {
    const m = this.map;
    if (it.id === 'betico') { const a = m.rangeMid('penibetico'), b = m.rangeMid('subbetico'); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
    if (it.keys) return m.rangeMid(it.keys[0]);
    if (it.depr) { const [x, y] = polyCentroid(GEO.es.depr[it.depr]); return m.P(x, y); }
    if (it.sub === 'subN') { const [x, y] = esLL(41.75, -4.25); return m.P(x, y); }
    if (it.sub === 'subS') { const [x, y] = esLL(39.0, -3.1); return m.P(x, y); }
  }
  nextItem() {
    if (this.i >= this.items.length) return this.startB();
    this.cur = { it: this.items[this.i], x: 165, y: 470, sc: 0, home: [165, 470], tries: 0 };
    tw(this.cur, { sc: 1 }, .5, { ease: E.outBack }); Sound.sfx('boing');
    this.setSpeak(this.cur.it.name, 236, 288);
  }
  onDown(p) {
    const c = this.cur; if (!c || this.phase !== 'A' || c.flying) return;
    if (dist(p.x, p.y, c.x, c.y - 40) < 110) { this.drag = { id: p.id, dx: c.x - p.x, dy: c.y - p.y }; Sound.sfx('tap'); }
  }
  onMove(p) { const d = this.drag; if (!d || d.id !== p.id) return; this.cur.x = p.x + d.dx; this.cur.y = p.y + d.dy; this.hover = this.nearPin(this.cur.x, this.cur.y - 45); }
  nearPin(x, y) { let best = null, bd = 70; for (const p of this.pins) { if (p.placed) continue; const d = dist(x, y, p.pos[0], p.pos[1]); if (d < bd) { bd = d; best = p; } } return best; }
  onUp(p, cancel) {
    const d = this.drag; if (!d || d.id !== p.id) return; this.drag = null; this.hover = null;
    if (!cancel) { this.cur.x = p.x + d.dx; this.cur.y = p.y + d.dy; }
    const c = this.cur, pin = this.nearPin(c.x, c.y - 45);
    if (!pin) { this.flyHome(); return; }
    if (pin.it === c.it) this.placeOk(pin);
    else {
      c.tries++; pin.wrong = G.t;
      this.flyHome();
      if (c.tries === 1) this.bad(pin.pos[0], pin.pos[1], c.it.id, c.it.hint, c.it.name, { title: 'Esa marca no era. Buscad:', then: () => { this.showCorrect = G.t; } });
      else { Sound.sfx('bad'); shake(6, .2); this.showCorrect = G.t; }
    }
  }
  flyHome() { const c = this.cur; c.flying = true; tw(c, { x: c.home[0], y: c.home[1] }, .45, { ease: E.outBack, done: () => c.flying = false }); Sound.sfx('slideDown'); }
  placeOk(pin) {
    const c = this.cur; this.cur = null; c.flying = true;
    this.flyer = { it: c.it, x: c.x, y: c.y, s: 1 }; tw(this.flyer, { x: pin.pos[0], y: pin.pos[1] + 10, s: .15 }, .35, { ease: E.inQ, done: () => this.flyer = null });
    if (c.tries === 0) this.good(pin.pos[0], pin.pos[1] - 30, c.it.id, 120); else { Sound.sfx('ok'); burst(pin.pos[0], pin.pos[1], { n: 12 }); }
    pin.placed = true; this.placed[c.it.id] = true;
    const it = c.it;
    if (it.keys) { for (const k of it.keys) { this.rise[k] = 0; tw(this.rise, { [k]: 1 }, 1.3, { ease: E.lin }); } Sound.sfx('rumble'); shake(6, .8); later(.2, () => Sound.sfx('rise')); }
    else { this.fade[it.id] = 0; tw(this.fade, { [it.id]: 1 }, .8); Sound.sfx('sparkle'); }
    puff(pin.pos[0], pin.pos[1], { n: 8 });
    this.i++; this.nextTurn(); this.setSpeak(null);
    later(1.2, () => this.nextItem());
  }
  /* ---------- fase B: clasificar ---------- */
  startB() {
    this.phase = 'B0'; this.cur = null;
    for (const it of RELIEVE) if (it.keys && !this.placed[it.id]) { this.placed[it.id] = true; for (const k of it.keys) { this.rise[k] = 0; tw(this.rise, { [k]: 1 }, 1.2); } }
    for (const it of RELIEVE) if (!it.keys && !this.placed[it.id]) { this.placed[it.id] = true; this.fade[it.id] = 0; tw(this.fade, { [it.id]: 1 }, .8); }
    this.pins.forEach(p => p.placed = true);
    Sound.sfx('rumble');
    later(1.4, () => {
      this.showBanner('¡Ahora, a clasificar!', Game.name(0) + ': BORDEA  ·  ' + Game.name(1) + ': EXTERIOR  ·  DENTRO: cualquiera', 3.6);
      later(3.9, () => this.beginB());
    });
  }
  beginB() {
    this.phase = 'B'; this.bi = 0;
    this.bitems = Game.choose(RELIEVE.filter(x => x.keys), Game.d(6, 9, 11), x => 'cls_' + x.id);
    const mk = (cat, x, y, col, who) => answerBtn({ x, y, w: 286, h: 150, color: col, text: CAT_LABEL[cat], size: 28, cat, tag: who, tagC: col === '#ffc933' ? '#ff8a3d' : shade(col, -.4), onTap: () => this.answer(cat) });
    this.catBtns = [mk('bordea', 22, 150, PCOL[0], Game.name(0)), mk('dentro', 22, 330, '#ffc933', 'LOS DOS'), mk('exterior', 22, 510, PCOL[1], Game.name(1))];
    this.catBtns[1].tc = INK;
    this.btns.push(...this.catBtns);
    this.nextB();
  }
  nextB() {
    if (this.bi >= this.bitems.length) { this.phase = 'end'; this.catBtns.forEach(b => b.on = false); this.showBanner('¡Relieve restaurado!', null, 1.6); Sound.sfx('fanfare'); return this.finish({ delay: 1.8 }); }
    this.bcur = this.bitems[this.bi]; this.bt = 0; this.btMax = Game.d(0, 9, 6); this.catBtns.forEach(b => { b.on = true; b.mark = null; });
    this.setSpeak(this.bcur.name, 700, 700);
    this.bpop = 0; tw(this, { bpop: 1 }, .4, { ease: E.outBack });
  }
  answer(cat) {
    if (this.phase !== 'B' || !this.bcur || this.bLock) return; const it = this.bcur; this.bLock = true;
    const [x, y] = this.pinPos(it); const b = this.catBtns.find(b => b.cat === cat);
    this.catBtns.forEach(b => b.on = false);
    const done = () => { this.bLock = false; this.bi++; this.nextB(); };
    if (cat === it.cat) { b.mark = 'ok'; this.good(x, y - 40, 'cls_' + it.id, 100); later(.8, done); }
    else { b.mark = 'ko'; this.catBtns.find(b => b.cat === it.cat).mark = 'ok'; this.bad(x, y, 'cls_' + it.id, it.hint, it.name + ': ' + CAT_LABEL[it.cat].toLowerCase(), { title: 'Era:', then: done }); this.hint.answer = CAT_LABEL[it.cat]; }
  }
  play(dt) {
    if (this.phase === 'B' && this.btMax && !this.bLock) { this.bt += dt; if (this.bt > this.btMax) { this.bLock = true; const it = this.bcur; const [x, y] = this.pinPos(it); this.catBtns.forEach(b => b.on = false); this.bad(x, y, 'cls_' + it.id, '¡Se acabó el tiempo! ' + it.hint, it.name + ': ' + CAT_LABEL[it.cat].toLowerCase(), { title: 'Era:', then: () => { this.bLock = false; this.bi++; this.nextB(); } }); this.hint.answer = CAT_LABEL[it.cat]; } }
  }
  render(c) {
    const m = this.map;
    c.fillStyle = '#3ea5e6'; c.fillRect(0, 0, W, H);
    m.drawBase();
    // submesetas y depresiones colocadas
    for (const it of RELIEVE) {
      const f = this.fade[it.id]; if (f == null) continue; c.globalAlpha = f;
      if (it.sub) m.fillRings(c, GEO.es[it.sub], it.sub === 'subN' ? '#efbd6a' : '#f7d58f', '#c9913e', 3);
      if (it.depr) m.fillRings(c, [GEO.es.depr[it.depr]], '#a8e07a', '#6fb548', 3, [8, 6]);
      c.globalAlpha = 1;
    }
    // resaltado en la fase B
    if (this.phase === 'B' && this.bcur) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = .55 + Math.sin(G.t * 6) * .25; c.lineWidth = 34; c.strokeStyle = '#fff36a'; for (const k of this.bcur.keys) { c.beginPath(); ringPathOpen(c, GEO.es.ranges[k], m.tf); c.stroke(); } c.restore(); }
    const names = Object.keys(this.rise); if (names.length) m.drawRanges(names, this.rise);
    // marcas
    if (this.phase === 'A') for (const p of this.pins) {
      const [x, y] = p.pos, hov = this.hover === p, wrong = p.wrong && G.t - p.wrong < .6, corr = this.showCorrect && this.cur && p.it === this.cur.it && G.t - this.showCorrect < 30;
      if (p.placed) { chip(p.it.short || p.it.name, x, y + 4, 'rgba(255,255,255,.92)', INK, 13); continue; }
      const r = hov ? 30 : 22; circle(x + 2, y + 4, r, 'rgba(20,10,40,.3)'); circle(x, y, r, wrong ? '#ff4b4b' : hov ? '#ffc933' : corr ? '#7ce05c' : '#fff', INK, 5);
      txt('?', x, y + 1, { size: hov ? 30 : 24, font: 'T', color: hov || corr ? '#fff' : '#a66cff', outline: hov || corr ? 5 : 0 });
      if (corr) arrowDown(x, y - 26, .7, '#7ce05c');
    }
    if (this.phase !== 'A') for (const p of this.pins) { const [x, y] = p.pos; if (this.phase === 'B' && this.bcur === p.it) continue; if (p.it.keys) continue; chip(p.it.short || p.it.name, x, y + 4, 'rgba(255,255,255,.85)', INK, 13); }
    // panel izquierdo
    rr(0, 90, 318, 710, 0, 'rgba(255,248,234,.9)'); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(318, 90); c.lineTo(318, H); c.stroke();
    if (this.phase === 'A') {
      drawSack(165, 760, .95, { shake: !!this.cur && !this.drag });
      turnChip(this.turn, 160, 128);
      const cu = this.cur;
      if (cu) {
        const nm = cu.it.name; panel(18, 170, 282, 110, '#fff', { r: 22 });
        wrap(nm, 250, 30, 'T').forEach((l, i, a) => txt(l, 160, 225 - (a.length - 1) * 17 + i * 34, { size: 30, font: 'T', color: INK }));
        c.save();
        const s = cu.sc * (this.drag ? 1.05 : 1), walk = !!this.drag;
        if (this.drag && cu.x > 300) { } else if (cu.it.keys) drawRangeBuddy(cu.x, cu.y, .95 * s, { color: cu.it.col, walk, wiggle: !!this.drag, expr: this.drag ? 'scared' : 'happy', rot: this.drag ? Math.sin(G.t * 12) * .06 : 0 });
        else drawBlobBuddy(cu.x, cu.y, .95 * s, { color: cu.it.col, walk, rot: this.drag ? Math.sin(G.t * 12) * .06 : 0 });
        c.restore();
        if (!this.drag && !cu.flying && cu.sc >= 1) { txt('¡Arrastradme!', 165, 540 + Math.sin(G.t * 4) * 4, { size: 24, color: '#ff5c8a', outline: 0 }); }
      }
    } else {
      if (this.phase === 'B' && this.bcur) {
        const k = this.bpop; c.save(); c.translate(780, 110); c.scale(k, k);
        rr(-300, -34, 600, 72, 36, '#fff8ea', INK, 6); txt(this.bcur.name, 0, 2, { size: fitSize(this.bcur.name, 560, 36, 'T'), font: 'T', color: INK }); c.restore();
        if (this.btMax) timeBar(560, 158, 440, 1 - this.bt / this.btMax);
      }
    }
    if (this.flyer) { const f = this.flyer; if (f.it.keys) drawRangeBuddy(f.x, f.y, f.s, { color: f.it.col, expr: 'happy' }); else drawBlobBuddy(f.x, f.y, f.s, { color: f.it.col }); }
    if (this.drag && this.cur) { // la criatura arrastrada va por encima del panel
      const cu = this.cur; if (cu.x > 300) { if (cu.it.keys) drawRangeBuddy(cu.x, cu.y, 1, { color: cu.it.col, walk: true, wiggle: true, expr: 'scared' }); else drawBlobBuddy(cu.x, cu.y, 1, { color: cu.it.col, walk: true }); }
    }
  }
}
/* =====================================================================
   MISIÓN 2 · GLOBOS DEL DICCIONARIO (vocabulario del relieve)
   ===================================================================== */
function sceneSky(c, w, h, a = '#8fd8ff', b = '#e3f7ff') { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function seaFill(c, x, y, w, h) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#5cc2f5'); g.addColorStop(1, '#2f8fd8'); c.fillStyle = g; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3; c.lineCap = 'round'; for (let yy = y + 18; yy < y + h; yy += 34) for (let xx = x + ((yy / 34) % 2) * 30; xx < x + w; xx += 70) { c.beginPath(); c.arc(xx, yy, 7, Math.PI * 1.1, Math.PI * 1.9); c.arc(xx + 14, yy, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
function landShape(c, pts, fill = '#ffe08a', lw = 5, sm = true) { if (sm) smooth(c, pts, true, .5); else P(c, pts); fillStroke(c, fill, lw); }
const SCENES = {
  montana(c, w, h) { sceneSky(c, w, h); drawCloud(90, 70, .6); peak(c, 120, h - 50, 120, 90, '#b98a64', false); peak(c, w - 110, h - 50, 140, 100, '#b98a64', false); peak(c, w / 2, h - 40, 250, 160, '#c98c5a', true); hills(c, h - 40, '#8fdc5e', 6, 1); return [w / 2, 72]; },
  llanura(c, w, h) { sceneSky(c, w, h); drawSun(w - 70, 60, .6, { face: false }); seaFill(c, 0, h - 90, 120, 90); c.beginPath(); c.moveTo(110, h - 88); c.lineTo(w + 10, h - 96); c.lineTo(w + 10, h + 10); c.lineTo(110, h + 10); c.closePath(); fillStroke(c, '#8fdc5e', 5);
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#f5d76e' : '#b8e070'; c.fillRect(140 + i * 70, h - 70, 60, 40); } cow(c, 300, h - 76); cow(c, 440, h - 76); peak(c, w - 60, h - 94, 50, 50, '#b98a64'); txt('mar', 50, h - 50, { size: 18, color: '#fff', outline: 4 }); return [340, h - 120]; },
  meseta(c, w, h) { sceneSky(c, w, h); drawCloud(100, 60, .55); seaFill(c, 0, h - 60, 110, 60); c.beginPath(); c.moveTo(100, h - 58); c.lineTo(160, h - 60); c.lineTo(200, h - 210); c.lineTo(w - 60, h - 214); c.lineTo(w - 30, h - 60); c.lineTo(w + 10, h - 60); c.lineTo(w + 10, h + 10); c.lineTo(100, h + 10); c.closePath(); fillStroke(c, '#d9a860', 5);
    c.beginPath(); c.moveTo(200, h - 210); c.lineTo(w - 60, h - 214); c.lineTo(w - 70, h - 190); c.lineTo(212, h - 188); c.closePath(); fillStroke(c, '#b8d86a', 4); for (let i = 0; i < 5; i++) { c.fillStyle = '#9a6a3a'; c.fillRect(230 + i * 60, h - 150 + (i % 2) * 20, 30, 5); } c.beginPath(); c.moveTo(100, h - 58); c.lineTo(w + 10, h - 60); c.stroke(); txt('mar', 50, h - 30, { size: 18, color: '#fff', outline: 4 }); return [(200 + w - 60) / 2, h - 230]; },
  valle(c, w, h) { sceneSky(c, w, h); drawCloud(w / 2, 50, .5);
    c.beginPath(); c.moveTo(-10, h + 10); c.lineTo(-10, 70); c.quadraticCurveTo(110, 40, 250, h - 120); c.lineTo(310, h - 120); c.quadraticCurveTo(450, 40, w + 10, 70); c.lineTo(w + 10, h + 10); c.closePath(); fillStroke(c, '#c49a70', 5);
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10, 70); c.quadraticCurveTo(40, 58, 90, 84); c.lineTo(40, 110); c.lineTo(-10, 120); c.fill(); c.beginPath(); c.moveTo(w + 10, 70); c.quadraticCurveTo(w - 40, 58, w - 90, 84); c.lineTo(w - 40, 110); c.lineTo(w + 10, 120); c.fill();
    c.beginPath(); c.moveTo(250, h - 120); c.lineTo(310, h - 120); c.lineTo(430, h + 10); c.lineTo(130, h + 10); c.closePath(); fillStroke(c, '#8fdc5e', 5);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(280, h - 118); c.bezierCurveTo(300, h - 90, 250, h - 70, 275, h - 45); c.bezierCurveTo(300, h - 20, 250, h - 5, 270, h + 12); c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 10; c.strokeStyle = '#3fa0f5'; c.stroke();
    drawPlant('encina', 190, h - 20, .22); drawPlant('encina', 370, h - 30, .2); return [280, h - 140]; },
  peninsula(c, w, h) { seaFill(c, 0, 0, w, h); landShape(c, [-20, h + 20, -20, h - 70, 150, h - 80, 210, h - 150, 220, 120, 270, 60, 330, 70, 360, 140, 350, h - 150, 400, h - 80, w + 20, h - 70, w + 20, h + 20]); c.fillStyle = '#8fdc5e'; ell(c, 280, 170, 30, 20); c.fill(); drawPlant('encina', 300, 230, .22); return [290, 50]; },
  isla(c, w, h) { seaFill(c, 0, 0, w, h); landShape(c, [150, 220, 190, 150, 290, 130, 390, 150, 420, 220, 350, 280, 220, 280]); c.fillStyle = '#fff3c4'; ell(c, 280, 262, 90, 12); c.fill(); drawPlant('palmera', 300, 230, .5); return [w / 2, 110]; },
  archipielago(c, w, h) { seaFill(c, 0, 0, w, h); const isl = [[120, 110, 50], [250, 200, 70], [400, 110, 55], [430, 260, 40], [150, 270, 35]]; for (const [x, y, r] of isl) landShape(c, [x - r, y, x - r * .5, y - r * .7, x + r * .5, y - r * .6, x + r, y + r * .1, x + r * .4, y + r * .7, x - r * .6, y + r * .6]); c.save(); c.setLineDash([12, 10]); c.lineWidth = 5; c.strokeStyle = '#fff'; ell(c, 280, 190, 250, 140); c.stroke(); c.restore(); return [280, 40]; },
  golfo(c, w, h) { seaFill(c, 0, 0, w, h); landShape(c, [-20, -20, w + 20, -20, w + 20, h - 60, w - 60, h - 30, w - 120, 180, w - 200, 110, 200, 110, 120, 180, 60, h - 30, -20, h - 60]); drawBoat(w / 2, 200, .5); return [w / 2, 170]; },
  cabo(c, w, h) { seaFill(c, 0, 0, w, h); landShape(c, [-20, -20, 200, -20, 260, 100, 330, 150, 440, 175, 330, 205, 250, 250, 200, h + 20, -20, h + 20]); drawLighthouse(420, 180, .55, true, { noBeam: true }); return [440, 110]; },
  playa(c, w, h) { sceneSky(c, w, h); drawSun(80, 60, .6); seaFill(c, 0, h - 130, w, 130); c.beginPath(); c.moveTo(170, h + 10); c.quadraticCurveTo(220, h - 140, w + 10, h - 150); c.lineTo(w + 10, h + 10); c.closePath(); fillStroke(c, '#ffe7a3', 5);
    c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(400, h - 140); c.lineTo(420, h - 250); c.stroke(); c.beginPath(); c.moveTo(340, h - 230); c.quadraticCurveTo(420, h - 300, 500, h - 250); c.closePath(); fillStroke(c, '#ff5c8a', 5); rr(300, h - 110, 90, 26, 6, '#3ec1f3', INK, 4); return [330, h - 150]; },
  acantilado(c, w, h) { sceneSky(c, w, h); drawCloud(120, 60, .6); seaFill(c, 0, h - 100, w, 100); c.beginPath(); c.moveTo(300, h + 10); c.lineTo(310, h - 100); c.lineTo(290, h - 170); c.lineTo(320, h - 230); c.lineTo(300, h - 280); c.lineTo(w + 10, h - 285); c.lineTo(w + 10, h + 10); c.closePath(); fillStroke(c, '#a07a5a', 5);
    c.beginPath(); c.moveTo(300, h - 280); c.lineTo(w + 10, h - 285); c.lineTo(w + 10, h - 260); c.lineTo(310, h - 262); c.closePath(); fillStroke(c, '#8fdc5e', 4); c.lineWidth = 4; c.strokeStyle = '#7a5a40'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(330 + i * 40, h - 240 + i * 30); c.lineTo(380 + i * 40, h - 230 + i * 30); c.stroke(); }
    for (let i = 0; i < 3; i++) { const k = (G.t * .8 + i / 3) % 1; circle(300 - k * 40, h - 100 - k * 60, 10 + k * 12, 'rgba(255,255,255,.8)'); } return [270, h - 200]; },
  ria(c, w, h) { seaFill(c, 0, 0, w, h);
    c.beginPath(); c.moveTo(150, -10); c.lineTo(140, 80); c.quadraticCurveTo(170, 125, 250, 150); c.quadraticCurveTo(320, 168, 390, 180); c.quadraticCurveTo(320, 196, 250, 214); c.quadraticCurveTo(170, 240, 140, 290); c.lineTo(150, h + 10); c.lineTo(w + 10, h + 10); c.lineTo(w + 10, -10); c.closePath(); fillStroke(c, '#8fdc5e', 5);
    c.lineCap = 'round'; c.beginPath(); c.moveTo(388, 180); c.bezierCurveTo(440, 175, 470, 140, w + 10, 130); c.lineWidth = 14; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8; c.strokeStyle = '#3fa0f5'; c.stroke();
    for (const [x, y] of [[250, 80], [420, 90], [260, 320], [440, 290], [520, 220]]) peak(c, x, y + 30, 44, 42, '#b98a64'); drawBoat(90, 190, .4); return [290, 150]; },
  afluente(c, w, h) { c.fillStyle = '#b8e878'; c.fillRect(0, 0, w, h); c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = 34; c.strokeStyle = INK; c.beginPath(); c.moveTo(-10, 250); c.bezierCurveTo(150, 220, 300, 290, w + 10, 240); c.stroke(); c.lineWidth = 26; c.strokeStyle = '#3fa0f5'; c.stroke();
    c.lineWidth = 18; c.strokeStyle = INK; c.beginPath(); c.moveTo(360, -10); c.bezierCurveTo(330, 100, 380, 170, 320, 262); c.stroke(); c.lineWidth = 11; c.strokeStyle = '#5cc2f5'; c.stroke();
    for (const [x, y] of [[100, 80], [480, 90], [150, 330], [460, 330]]) drawPlant('encina', x, y, .25); return [380, 70]; },
};
function drawScene(id, x, y, w, h) {
  const c = G.ctx; c.save(); rrPath(c, x, y, w, h, 24); c.clip(); c.translate(x, y);
  const [ax, ay] = SCENES[id](c, w, h); c.restore();
  rr(x, y, w, h, 24, null, INK, 7);
  arrowDown(x + ax, y + ay, 1, '#ff5c8a');
}
class GameGlobos extends Mini {
  constructor() { super(1); }
  setup() {
    const n = Game.d(8, 12, 16);
    let pool = VOCAB.filter(v => Game.diff !== 'tranqui' || v.scene);
    this.items = Game.choose(pool, n);
    this.i = 0; this.balloons = [];
    this.prog = () => [this.i, this.items.length];
    this.showBanner('¡Reventad la palabra correcta!', 'Mirad el dibujo o leed la definición', 2);
    later(2.2, () => this.round());
  }
  round() {
    if (this.i >= this.items.length) { this.showBanner('¡Diccionario recuperado!', null, 1.5); return this.finish({ delay: 1.6 }); }
    const it = this.items[this.i]; this.cur = it; this.lock = false;
    this.mode = it.scene && (Game.diff === 'tranqui' || Math.random() < .65) ? 'scene' : 'def';
    this.cardK = 0; tw(this, { cardK: 1 }, .45, { ease: E.outBack });
    const nOpt = Game.d(3, 4, 5);
    const fam = VOCAB_FAMILY.find(f => f.includes(it.id)) || [];
    let dis = shuffle(VOCAB.filter(v => v !== it && fam.includes(v.id)));
    dis = dis.concat(shuffle(VOCAB.filter(v => v !== it && !fam.includes(v.id))));
    const opts = shuffle([it, ...dis.slice(0, nOpt - 1)]);
    const T = Game.d(15, 11, 8), cols = shuffle(['#ff5c8a', '#3ec1f3', '#7ce05c', '#a66cff', '#ff8a3d', '#ffc933']);
    const lane = 600 / opts.length;
    this.balloons = opts.map((o, k) => ({ it: o, x: 660 + lane * (k + .5) + rnd(-12, 12), y: H + 90 + k * 55 + rnd(0, 30), vy: -(H + 260) / T * rnd(.9, 1.1), col: cols[k], r: 66, ph: rnd(6), alive: true }));
    this.setSpeak(this.mode === 'def' ? it.def : null, 560, 580);
    Sound.sfx('slideUp');
  }
  onDown(p) {
    if (this.lock) return;
    for (const b of this.balloons) { if (!b.alive) continue; const dx = (p.x - b.x) / b.r, dy = (p.y - b.y) / (b.r * 1.12); if (dx * dx + dy * dy < 1.15) { this.popB(b); return; } }
  }
  popB(b) {
    b.alive = false; Sound.sfx('pop'); burst(b.x, b.y, { n: 16, c: [b.col, '#fff'], sp: 380 });
    const it = this.cur;
    if (b.it === it) { this.lock = true; this.good(b.x, b.y, it.id, 100); this.flyAway(); this.i++; this.nextTurn(); later(1.1, () => this.round()); }
    else { this.lock = true; b.fake = true; this.bad(b.x, b.y, it.id, cap(it.word) + ': ' + it.def + (b.it ? '  (Y «' + b.it.word + '» es: ' + b.it.def.toLowerCase().replace(/\.$/, '') + '.)' : ''), it.word, { then: () => { this.flyAway(); this.i++; this.nextTurn(); later(.6, () => this.round()); } }); }
  }
  flyAway() { for (const b of this.balloons) if (b.alive) b.vy = -900; }
  play(dt) {
    for (const b of this.balloons) { b.y += b.vy * dt; b.x += Math.sin(G.t * 1.3 + b.ph) * 12 * dt; }
    if (!this.lock && this.cur) { const c = this.balloons.find(b => b.it === this.cur); if (c && c.alive && c.y < -140) { this.lock = true; c.alive = false; this.bad(null, null, this.cur.id, '¡Se ha escapado! ' + cap(this.cur.word) + ': ' + this.cur.def, this.cur.word, { then: () => { this.flyAway(); this.i++; this.nextTurn(); later(.4, () => this.round()); } }); } }
  }
  render(c) {
    bg('campo');
    const it = this.cur;
    if (it) {
      const k = this.cardK; c.save(); c.translate(330, 360); c.scale(k, k); c.translate(-330, -360);
      if (this.mode === 'scene') { drawScene(it.scene, 40, 130, 580, 380); txt('¿Qué señala la flecha?', 330, 560, { size: 36, font: 'T', color: '#fff', outline: 9 }); }
      else { panel(40, 130, 580, 380, '#fff8ea', { r: 30 }); txt('DEFINICIÓN', 330, 180, { size: 30, font: 'T', color: '#ff5c8a' }); const L = wrap(it.def, 500, 40); L.forEach((l, i) => txt(l, 330, 330 - (L.length - 1) * 24 + i * 48, { size: 40, color: INK })); txt('¿Qué palabra es?', 330, 560, { size: 36, font: 'T', color: '#fff', outline: 9 }); }
      c.restore();
      turnChip(this.turn, 330, 640);
    }
    for (const b of this.balloons) if (b.alive) drawBalloon(b.x, b.y, b.r, b.col, b.it.word, { ph: b.ph, size: 30 });
  }
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
