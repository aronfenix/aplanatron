'use strict';
/* =====================================================================
   BASE COMÚN DE LOS MINIJUEGOS
   ===================================================================== */
class Mini {
  constructor(idx) { this.idx = idx; this.st = TESTS[idx]; }
  enter() {
    this.btns = []; this.ok = 0; this.total = 0; this.score = 0; this.combo = 0; this.turn = Math.random() < .5 ? 0 : 1; this.missed = [];
    this.paused = false; this.hint = null; this.alv = null; this.speak = null; this.phaseT = 0; this.banner = null;
    this.pauseBtn = new Btn({ x: W - 96, y: 14, w: 80, h: 76, color: '#8c85b0', label: '', r: 20, icon: (cx, cy) => { rr(cx - 14, cy - 16, 10, 32, 3, '#fff', INK, 3); rr(cx + 4, cy - 16, 10, 32, 3, '#fff', INK, 3); }, onTap: () => this.pause() });
    this.btns.push(this.pauseBtn);
    this.speakBtn = new Btn({ x: 0, y: 0, w: 64, h: 62, color: '#3ec1f3', label: '', r: 18, vis: false, icon: (cx, cy) => speakerIcon(cx, cy), onTap: () => this.speak && Sound.say(this.speak) });
    this.btns.push(this.speakBtn);
    Sound.play(this.st.music); Sound.extra(false); Sound.tempo(1);
    this.time = 0; this.setup();
    const h = this.howto && this.howto();
    if (h) { this.card = { ...h, k: 0 }; tw(this.card, { k: 1 }, .5, { ease: E.outBack }); const b = new Btn({ x: 790, y: 630, w: 330, h: 104, label: '¡A JUGAR!', size: 44, color: '#7ce05c', cardBtn: true, pulse: true, key: ['Enter', ' '], onTap: () => this.closeCard() }); this.btns.push(b);
      if (Sound.canSpeak()) this.btns.push(new Btn({ x: 690, y: 642, w: 80, h: 80, color: '#3ec1f3', label: '', r: 20, cardBtn: true, icon: (cx, cy) => speakerIcon(cx, cy), onTap: () => Sound.say(h.title + '. ' + h.lines.join(' ')) })); }
    else if (this.start) this.start();
  }
  closeCard() { if (!this.card) return; this.card = null; Sound.shutUp(); Sound.sfx('go'); this.btns = this.btns.filter(b => !b.cardBtn); if (this.start) this.start(); }
  drawCard(c) {
    const h = this.card, k = h.k; c.fillStyle = `rgba(30,20,70,${.6 * k})`; c.fillRect(0, 0, W, H);
    c.save(); c.translate(640, 400); c.scale(k, k); c.translate(-640, -400);
    panel(120, 60, 1040, 700, '#fff8ea', { r: 36 }); rr(120, 60, 1040, 100, 36, this.st.color, INK, 6);
    txt(h.title, 640, 112, { size: fitSize(h.title, 960, 50, 'T'), font: 'T', color: '#fff', outline: 9 });
    if (h.pic) { c.save(); h.pic(c, 360, 420); c.restore(); }
    let y = 210; for (const l of h.lines) { const L = wrap(l, 500, 27); L.forEach((q, i) => txt((i ? '   ' : '• ') + q, 620, y + i * 33, { size: 27, align: 'left', color: INK, w: 600 })); y += L.length * 33 + 16; }
    drawRosa(210, 670, .5, { expr: 'talk', talk: true });
    c.restore(); for (const b of this.btns) if (b.cardBtn) b.draw();
  }
  /* --- a sobrescribir --- */
  setup() { } play(dt) { } render(c) { }
  /* --- turnos --- */
  nextTurn() { this.turn = 1 - this.turn; }
  get who() { return Game.name(this.turn); }
  /* --- aciertos y fallos --- */
  good(x, y, id, pts = 100) {
    this.ok++; this.total++; this.combo++; const bonus = Math.min(5, this.combo - 1) * 20; this.score += pts + bonus; Game.mark(id, true);
    Sound.sfx('ok'); burst(x, y, { n: 22 }); pop(x, y - 30, '+' + (pts + bonus), '#ffc933', 42);
    if (this.combo === 3) Sound.extra(true);
    if (this.combo >= 3 && this.combo % 3 === 0) { later(.3, () => { pop(W - 200, 120, '¡RACHA x' + this.combo + '!', '#ff5c8a', 40); Sound.sfx('sparkle'); }); }
    if (Math.random() < .35) this.alvSay('hurt');
  }
  bad(x, y, id, hint, answer, o = {}) {
    this.total++; this.combo = 0; Sound.extra(false); Game.mark(id, false); if (answer && !this.missed.includes(answer)) this.missed.push(answer);
    Sound.sfx('bad'); shake(10, .3); if (x != null) { burst(x, y, { n: 10, c: ['#8c85b0', '#5d5680'], sp: 200 }); pop(x, y - 30, '¡Uy!', '#ff4b4b', 40); }
    this.alvSay('gloat');
    if (hint) this.showHint(hint, answer, o.then, o);
    else if (o.then) o.then();
  }
  showHint(text, answer, then, o = {}) {
    const h = { text, answer, then, k: 0, t0: G.t, title: o.title };
    this.hint = h; tw(h, { k: 1 }, .45, { ease: E.outBack });
    const b = new Btn({ x: 980, y: 660, w: 260, h: 104, label: '¡VALE!', size: 44, color: '#7ce05c', hintBtn: true, key: ['Enter', ' '], on: false, onTap: () => this.closeHint() });
    later(.9, () => { b.on = true; b.pulse = true; }, true);
    this.btns.push(b);
    if (Sound.canSpeak()) { const sb = new Btn({ x: 890, y: 672, w: 76, h: 80, color: '#3ec1f3', label: '', r: 20, hintBtn: true, icon: (cx, cy) => speakerIcon(cx, cy), onTap: () => Sound.say((answer ? 'La respuesta era: ' + answer + '. ' : '') + text) }); this.btns.push(sb); }
  }
  closeHint() { const h = this.hint; if (!h) return; this.hint = null; Sound.shutUp(); this.btns = this.btns.filter(b => !b.hintBtn); if (h.then) h.then(); }
  alvSay(kind) { if (this.alv && G.t - this.alv.t0 < 1.2) return; this.alv = { text: pick(PULLAS[kind]), kind, t0: G.t, k: 0, expr: kind === 'gloat' ? 'laugh' : pick(['shock', 'angry']) }; tw(this.alv, { k: 1 }, .4, { ease: E.outBack }); if (kind === 'gloat' && Math.random() < .5) Sound.sfx('laugh'); }
  setSpeak(text, x, y) { this.speak = text; if (text && Sound.canSpeak()) { this.speakBtn.vis = true; this.speakBtn.x = x; this.speakBtn.y = y; } else this.speakBtn.vis = false; }
  finish(extra = {}) {
    if (this.done) return; this.done = true; Sound.shutUp();
    const err = this.total - this.ok, r = this.total ? this.ok / this.total : 0; const stars = extra.stars ?? (r >= .9 ? 3 : r >= .7 ? 2 : 1);
    later(extra.delay ?? .8, () => go(() => new ChapterEnd({ ch: this.idx, stars, errors: err, missed: this.missed, score: this.score, time: this.time }), { col: this.st.color }));
  }
  showBanner(text, sub, dur = 1.6, col) { const b = { text, sub, k: 0, t0: G.t, dur, col: col || this.st.color }; this.banner = b; tw(b, { k: 1 }, .45, { ease: E.outBack }); Sound.sfx('whoosh'); later(dur, () => { if (this.banner === b) tw(b, { k: 0 }, .25, { ease: E.inQ, done: () => { if (this.banner === b) this.banner = null; } }); }); }
  pause() {
    if (this.paused || this.done) return; this.paused = true; Sound.volume(.25);
    this.pbtns = [
      new Btn({ x: 470, y: 300, w: 340, h: 104, label: 'SEGUIR', size: 44, color: '#7ce05c', key: ['Escape', 'Enter'], onTap: () => this.resume() }),
      new Btn({ x: 470, y: 430, w: 340, h: 100, label: 'EMPEZAR OTRA VEZ', size: 28, color: '#3ec1f3', onTap: () => go(() => this.st.make()) }),
      new Btn({ x: 470, y: 556, w: 340, h: 100, label: 'SALIR AL MAPA', size: 30, color: '#ff8a3d', onTap: () => go(() => new Hub()) }),
    ];
    this.savedBtns = this.btns; this.btns = this.pbtns.concat([soundBtn(W - 110, 20)]);
  }
  resume() { this.paused = false; this.btns = this.savedBtns; Sound.volume(1); }
  update(dt) {
    if (this.hint || this.card) return; // el juego espera mientras Rosa explica
    this.time += dt; this.play(dt);
  }
  updatePaused() { }
  down(p) { if (this.hint || this.paused || this.card) return; if (this.onDown) this.onDown(p); }
  move(p) { if (this.hint || this.paused || this.card) return; if (this.onMove) this.onMove(p); }
  up(p) { if (this.hint || this.paused || this.card) return; if (this.onUp) this.onUp(p); }
  cancel(p) { if (this.onUp) this.onUp(p, true); }
  draw(c) {
    this.render(c);
    this.hud(c);
    for (const b of (this.paused ? this.savedBtns : this.btns)) if (!b.hintBtn && !b.cardBtn) b.draw();
    this.drawAlv(c);
    if (this.banner) this.drawBanner(c);
  }
  drawTop(c) {
    if (this.card) this.drawCard(c);
    if (this.hint) this.drawHint(c);
    if (this.paused) { c.fillStyle = 'rgba(30,20,70,.7)'; c.fillRect(0, 0, W, H); txt('PAUSA', 640, 200, { size: 90, font: 'T', color: '#ffc933', outline: 12 }); for (const b of this.btns) b.draw(); }
  }
  hud(c) {
    const w = chip(this.st.name, 20, 50, this.st.color, '#fff', 26, 'left', { font: 'T' });
    if (this.prog) { const [i, n] = this.prog(); const x0 = W / 2 - n * 11; for (let k = 0; k < n; k++) circle(x0 + k * 22 + 11, 30, 8, k < i ? '#7ce05c' : 'rgba(255,255,255,.7)', INK, 3.5); }
    rr(W - 290, 22, 180, 58, 29, '#fff8ea', INK, 5); drawStar(W - 262, 51, 16, true); txt(String(this.score), W - 180, 53, { size: 30, color: INK });
  }
  drawAlv(c) {
    const a = this.alv; if (!a) return; const age = G.t - a.t0; if (age > 2.4) { this.alv = null; return; }
    const k = age > 2.1 ? 1 - (age - 2.1) / .3 : a.k;
    c.save(); c.translate(0, (1 - k) * 260);
    drawAlvaro(110, 730, .42, { expr: a.expr, arms: a.kind === 'gloat' ? 'up' : 'idle', cape: true, pen: false });
    bubble(a.text, 60, 520, 330, { size: 22, tailX: 150, bg: a.kind === 'gloat' ? '#f3e8ff' : '#fff' });
    c.restore();
  }
  drawBanner(c) {
    const b = this.banner, k = b.k; c.save(); c.translate(640, 380); c.scale(k, k); c.rotate(-.03);
    rr(-420, -80, 840, b.sub ? 170 : 130, 34, b.col, INK, 8);
    txt(b.text, 0, -18, { size: fitSize(b.text, 780, 60, 'T'), font: 'T', color: '#fff', outline: 10 });
    if (b.sub) txt(b.sub, 0, 46, { size: fitSize(b.sub, 780, 30), color: '#fff', outline: 6 });
    c.restore();
  }
  drawHint(c) {
    const h = this.hint, k = h.k; c.fillStyle = `rgba(30,20,70,${.55 * k})`; c.fillRect(0, 0, W, H);
    c.save(); c.translate(0, (1 - k) * 400);
    drawRosa(200, 640, .85, { expr: 'talk', talk: G.t - h.t0 < 2.5, look: [1, -.3] });
    const lines = wrap(h.text, 800, 32); const bh = (h.answer ? 70 : 0) + lines.length * 40 + 50, by = 610 - bh;
    rr(395, by + 8, 850, bh, 30, 'rgba(20,10,40,.3)'); rr(390, by, 850, bh, 30, '#fff8ea', INK, 6);
    c.beginPath(); c.moveTo(392, by + bh - 70); c.lineTo(330, by + bh - 20); c.lineTo(400, by + bh - 30); fillStroke(c, '#fff8ea', 6); c.fillStyle = '#fff8ea'; c.fillRect(392, by + bh - 76, 14, 50);
    let y = by + 42;
    if (h.answer) { txt(h.title || 'La respuesta era:', 420, y, { size: 24, align: 'left', color: '#8c85b0' }); txt(h.answer, 420 + tw_(h.title || 'La respuesta era:', 24) + 12, y, { size: fitSize(h.answer, 820 - tw_(h.title || 'La respuesta era:', 24) - 12, 32), align: 'left', color: '#ff5c8a' }); y += 56; }
    lines.forEach((l, i) => txt(l, 420, y + i * 40, { size: 32, align: 'left', color: INK }));
    for (const b of this.btns) if (b.hintBtn) b.draw();
    c.restore();
  }
}
function speakerIcon(cx, cy) {
  const c = G.ctx; c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 4;
  c.beginPath(); c.moveTo(cx - 18, cy - 7); c.lineTo(cx - 7, cy - 7); c.lineTo(cx + 5, cy - 18); c.lineTo(cx + 5, cy + 18); c.lineTo(cx - 7, cy + 7); c.lineTo(cx - 18, cy + 7); c.closePath(); c.fill(); c.stroke();
  c.lineWidth = 4; c.strokeStyle = '#fff'; c.beginPath(); c.arc(cx + 7, cy, 10, -.8, .8); c.stroke(); c.beginPath(); c.arc(cx + 7, cy, 17, -.8, .8); c.stroke();
}
/* barra de tiempo */
function timeBar(x, y, w, k, col = '#7ce05c') {
  rr(x, y, w, 22, 11, 'rgba(255,255,255,.8)', INK, 4);
  const kk = clamp(k, 0, 1); if (kk > 0) rr(x + 3, y + 3, (w - 6) * kk, 16, 8, kk < .3 ? '#ff4b4b' : kk < .6 ? '#ffc933' : col);
}
/* botón de respuesta grande con texto que se ajusta */
function answerBtn(o) {
  return new Btn(Object.assign({ f: 'B', size: 30, r: 26, icon: null }, o, { label: '', icon: (cx, cy, b) => {
    const size = o.size || 30, lines = wrap(b.text, b.w - 40, size); const s2 = lines.length > 2 ? size * .8 : size; const L = wrap(b.text, b.w - 40, s2);
    L.forEach((l, i) => txt(l, cx, cy + (i - (L.length - 1) / 2) * s2 * 1.12, { size: s2, color: b.tc || '#fff', outline: (b.tc || '#fff') === '#fff' ? 6 : 0 }));
    if (b.tag) chip(b.tag, b.w - 16, 4, b.tagC || INK, '#fff', 16, 'right');
    if (b.mark) { const ok = b.mark === 'ok'; circle(b.w - 26, 26 - b.h / 2 + cy, 22, ok ? '#7ce05c' : '#ff4b4b', INK, 4); txt(ok ? '✓' : '✗', b.w - 26, 27 - b.h / 2 + cy, { size: 26, color: '#fff' }); }
  } }));
}
