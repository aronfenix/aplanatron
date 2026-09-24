'use strict';
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
  constructor() { super(5); }
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
