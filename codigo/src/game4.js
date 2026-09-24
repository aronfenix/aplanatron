'use strict';
/* =====================================================================
   MISIÓN 7 · EL APLANATRÓN 3000 (jefe final: repaso de todo)
   ===================================================================== */
class GameJefe extends Mini {
  constructor() { super(6); }
  setup() {
    this.hpMax = Game.d(8, 10, 13); this.hp = this.hpMax; this.steps = Game.d(6, 5, 4); this.step = 0;
    this.ax = this.stepX(0); this.bossRot = 0; this.bossY = 0; this.bossFlash = 0; this.teideJ = 0;
    this.balls = []; this.q = null; this.state = 'intro';
    this.queue = this.buildQueue();
    this.prog = null;
    this.showBanner('¡BATALLA FINAL!', 'Acertad para que el Teide lance lava', 2.2, '#ff4b4b');
    Sound.sfx('horn');
    later(2.4, () => { this.state = 'play'; this.nextQ(); });
  }
  stepX(s) { return lerp(190, 790, s / this.steps); }
  buildQueue() {
    const Q = [];
    for (const r of Game.choose(REPASO, 24)) Q.push({ id: r.id, q: r.q, opts: shuffle([r.a, r.b, r.c]), a: r.a });
    for (const b of Game.choose(BULOS, 6)) Q.push({ id: b.id, q: '¿Verdad o bulo? «' + b.text + '»', opts: ['VERDAD', 'BULO'], a: b.v ? 'VERDAD' : 'BULO', fix: b.fix });
    for (const r of Game.choose(RIOS.filter(x => !x.turbo), 5)) Q.push({ id: r.id, q: '¿A qué vertiente va el río ' + r.id + '?', opts: shuffle(['Cantábrica', 'Atlántica', 'Mediterránea']), a: VERTIENTES[r.vert].name });
    for (const k of Game.choose(CARTAS_CLIMA.filter(x => x.kind !== 'lugar' || true), 5)) { const others = shuffle(Object.keys(CLIMAS).filter(x => x !== k.clima)).slice(0, 2); Q.push({ id: k.id, q: '«' + k.text + '»: ¿de qué clima?', opts: shuffle([k.clima, ...others].map(x => CLIMAS[x].name)), a: CLIMAS[k.clima].name }); }
    return shuffle(Q);
  }
  nextQ() {
    if (this.state !== 'play') return;
    if (!this.queue.length) this.queue = this.buildQueue();
    const q = this.q = this.queue.shift(); this.lock = false; this.t = 0; this.T = Game.d(0, 18, 11);
    this.btns = this.btns.filter(b => !b.ans);
    const n = q.opts.length, w = n === 2 ? 420 : 380, gap = 24, x0 = 640 - (n * w + (n - 1) * gap) / 2;
    const cols = ['#3ec1f3', '#a66cff', '#ff8a3d'];
    q.btns = q.opts.map((o, i) => answerBtn({ x: x0 + i * (w + gap), y: 254, w, h: 118, color: n === 2 ? (o === 'VERDAD' ? '#7ce05c' : '#ff4b4b') : cols[i], text: o, size: n === 2 ? 40 : 28, ans: true, opt: o, onTap: () => this.pickA(o) }));
    this.btns.push(...q.btns);
    this.qk = 0; tw(this, { qk: 1 }, .4, { ease: E.outBack });
    this.setSpeak(q.q + ' ' + q.opts.join(', '), 1154, 118);
  }
  pickA(o) {
    if (this.lock || this.state !== 'play') return; this.lock = true; const q = this.q;
    q.btns.forEach(b => b.on = false);
    const right = q.btns.find(b => b.opt === q.a);
    this.nextTurn();
    if (o === q.a) { right.mark = 'ok'; this.ok++; this.total++; this.combo++; this.score += 150 + Math.min(5, this.combo) * 30; Game.mark(q.id, true); Sound.sfx('ok'); if (this.combo >= 3) Sound.extra(true); pop(right.x + right.w / 2, right.y, '¡BIEN!', '#7ce05c', 44); this.fire(); }
    else {
      if (o != null) q.btns.find(b => b.opt === o).mark = 'ko'; right.mark = 'ok';
      this.total++; this.combo = 0; Sound.extra(false); Game.mark(q.id, false); this.missed.push(q.q.replace(/^¿Verdad o bulo\? /, '') + ' → ' + q.a); Sound.sfx('bad'); shake(8, .3); this.alvSay('gloat');
      later(1.1, () => this.advance());
    }
  }
  fire() {
    this.teideJ = 1; tw(this, { teideJ: 0 }, .5, { ease: E.outEl }); Sound.sfx('lava');
    const b = { x: 1110, y: 490, t: 0, x1: this.ax + 90, y1: 560, dur: .8 }; this.balls.push(b);
    later(.82, () => this.hit());
  }
  hit() {
    this.hp--; this.bossFlash = 1; tw(this, { bossFlash: 0 }, .5); Sound.sfx('stomp'); shake(14, .4); flash('#ff8a3d', .2);
    burst(this.ax + 90, 560, { n: 30, c: ['#ff8a3d', '#ffc933', '#ff4b4b', '#fff'], sp: 500 });
    this.alvSay('hurt');
    if (this.step > 0) { this.step--; tw(this, { ax: this.stepX(this.step) }, .6, { ease: E.outBack }); }
    if (this.hp <= 0) return this.win();
    later(1.1, () => this.nextQ());
  }
  advance() {
    this.step++; Sound.sfx('horn'); tw(this, { ax: this.stepX(this.step) }, .9, { ease: E.inOut }); later(.4, () => { Sound.sfx('thud'); shake(6, .3); });
    if (this.step >= this.steps) { later(1, () => this.lose()); return; }
    const q = this.q; later(1.2, () => this.showHint(q.fix ? q.fix : 'Recordad: ' + q.a + '.', q.a, () => this.nextQ(), {}));
  }
  lose() {
    this.state = 'lost'; this.btns = this.btns.filter(b => !b.ans); this.q = null; this.teideSquash = 1; Sound.sfx('stomp'); shake(20, .6); Sound.stop(.2); later(.3, () => Sound.sfx('sad'));
    this.showBanner('¡EL TEIDE ESTÁ PLANO!', 'Álvaro gana… por ahora. ¡Volved a intentarlo!', 3, '#5d5680');
    this.finish({ delay: 3.4, forceStars: 0 });
  }
  win() {
    this.state = 'won'; this.btns = this.btns.filter(b => !b.ans); this.q = null; Sound.stop(.3);
    Sound.sfx('drumroll');
    later(1.2, () => { Sound.sfx('stomp'); flash('#fff', .8); shake(24, .8); confetti(200); for (let i = 0; i < 6; i++) later(i * .15, () => burst(this.ax + rnd(-60, 160), rnd(380, 600), { n: 30, sp: 600 })); tw(this, { bossY: -900, bossRot: 7 }, 1.8, { ease: E.inQ }); this.flyText = G.t; });
    later(2.2, () => { this.showBanner('¡APLANATRÓN DERROTADO!', 'El Teide sigue en pie. ¡Y España, entera!', 3, '#7ce05c'); Sound.sfx('cheer'); });
    this.finish({ delay: 5.4 });
  }
  play(dt) {
    for (const b of this.balls) b.t += dt; this.balls = this.balls.filter(b => b.t < b.dur);
    if (this.state === 'play' && this.q && !this.lock && this.T && this.qk >= 1) { this.t += dt; if (this.t > this.T) { this.pickA(null); } }
    const danger = this.step / this.steps; Sound.tempo(1 + danger * .25);
  }
  render(c) {
    bg('volcan');
    // isla
    c.beginPath(); c.moveTo(-20, 640); c.quadraticCurveTo(300, 600, 640, 615); c.quadraticCurveTo(1000, 630, 1300, 590); c.lineTo(1300, H + 20); c.lineTo(-20, H + 20); c.closePath(); fillStroke(c, '#e7c27a', 6);
    c.beginPath(); c.moveTo(-20, 700); c.quadraticCurveTo(640, 660, 1300, 690); c.lineTo(1300, H + 20); c.lineTo(-20, H + 20); c.closePath(); fillStroke(c, '#c99a58', 0);
    // marcas del camino
    for (let s = 0; s <= this.steps; s++) { const x = this.stepX(s) + 100; c.fillStyle = s === this.steps ? '#ff4b4b' : 'rgba(90,60,30,.35)'; ell(c, x, 660, 14, 5); c.fill(); }
    // Teide
    const sq = this.teideSquash ? .25 : 1;
    c.save(); c.translate(1110, 700); c.scale(1, sq); drawTeide(0, 0, 1.0 + this.teideJ * .08, { expr: this.state === 'won' ? 'proud' : this.teideJ > .1 ? 'shout' : this.step >= this.steps - 1 ? 'worried' : this.lock && this.q && this.q.btns.some(b => b.mark === 'ko') ? 'worried' : 'happy', look: [-1, 0], jump: this.teideJ * .1 }); c.restore();
    // Aplanatrón
    if (this.state !== 'won' || this.bossY > -880) {
      c.save(); c.translate(this.ax + 100, 690 + this.bossY); c.rotate(this.bossRot);
      drawRodolfo(0, 0, .66, { boss: true, riderS: .56, moving: this.state === 'play', expr: this.bossFlash > .2 ? 'sleepy' : 'angry', rider: this.bossFlash > .2 ? 'shock' : this.state === 'lost' ? 'laugh' : 'evil', riderArms: this.state === 'lost' ? 'up' : 'point', look: [1, 0], dist: this.ax / 30 });
      if (this.bossFlash > 0) { c.globalAlpha = this.bossFlash * .6; circle(40, -160, 190, '#fff'); c.globalAlpha = 1; }
      c.restore();
      if (this.flyText && G.t - this.flyText < 2.5) bubble('¡ME LAS PAGARÉIS! ¡El jueves, EXAMEN!', 60, 200, 420, { size: 26, tail: false });
    }
    // bolas de lava
    for (const b of this.balls) { const k = b.t / b.dur, x = lerp(b.x, b.x1, k), y = lerp(b.y, b.y1, k) - Math.sin(k * Math.PI) * 300; circle(x, y, 26, '#ff6a2b', INK, 5); circle(x - 7, y - 7, 9, '#ffc933'); if (!G.low) puff(x, y, { n: 1, c: '#ffb070', s: 18 }); }
    // barra de vida del jefe
    rr(330, 16, 620, 62, 31, '#fff8ea', INK, 6); txt('APLANATRÓN 3000', 470, 48, { size: 24, font: 'T', color: '#8f4fe8' });
    for (let i = 0; i < this.hpMax; i++) { const w = 330 / this.hpMax; rr(600 + i * w, 30, w - 4, 34, 8, i < this.hp ? '#ff4b4b' : '#ddd', INK, 3); }
    // pregunta
    if (this.q) {
      const k = this.qk; c.save(); c.translate(640, 172); c.scale(k, k);
      panel(-500, -70, 1000, 140, '#fff', { r: 30 });
      const L = wrap(this.q.q, 920, 34); const fs = L.length > 2 ? 28 : 34; const L2 = wrap(this.q.q, 920, fs);
      L2.forEach((l, i) => txt(l, 0, 2 - (L2.length - 1) * fs * .6 + i * fs * 1.2, { size: fs, color: INK }));
      c.restore();
      if (this.T && !this.lock) timeBar(340, 382, 600, 1 - this.t / this.T, '#ff8a3d');
      turnChip(this.turn, 250, 104);
    }
  }
}
