'use strict';
/* =====================================================================
   MOTOR: lienzo, bucle, entrada táctil, tweens, partículas, texto, UI
   ===================================================================== */
const W = 1280, H = 800;
const G = {
  cv: null, ctx: null, scale: 1, ox: 0, oy: 0, dpr: 1, rs: 1, t: 0, dt: 0,
  scene: null, next: null, trans: null, tweens: [], timers: [], parts: [], pops: [],
  shakeA: 0, shakeT: 0, flashT: 0, flashC: '#fff', flashMax: 1, low: false, ptrs: new Map(), caches: new Map(), fps: 60,
};
const TAU = Math.PI * 2;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function strip(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'); }
function norm(s) { return s.replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ'); }
const E = {
  io: k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, outBounce: k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; }, sine: k => .5 - Math.cos(k * Math.PI) / 2,
  lin: k => k, inQ: k => k * k, outQ: k => 1 - (1 - k) * (1 - k), inOut: k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
  outBack: k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  outEl: k => k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * TAU / 3) + 1,
  outBounce: k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; },
  inBack: k => 2.7 * k * k * k - 1.7 * k * k,
};
function tw(o, props, dur, opt = {}) {
  const t = { o, from: {}, to: props, dur, t: -(opt.delay || 0), ease: opt.ease || E.outQ, done: opt.done, scene: opt.global ? null : G.scene };
  for (const k in props) t.from[k] = o[k];
  G.tweens = G.tweens.filter(x => !(x.o === o && Object.keys(x.to).some(k => k in props)));
  G.tweens.push(t); return t;
}
function later(sec, fn, global) { const t = { t: sec, fn, scene: global ? null : G.scene }; G.timers.push(t); return t; }
function updTweens(dt) {
  const tws = G.tweens; G.tweens = [];
  for (const t of tws) {
    if (t.scene && t.scene !== G.scene) continue;
    t.t += dt; if (t.t < 0) { G.tweens.push(t); if (t.t + dt >= 0) for (const k in t.to) t.from[k] = t.o[k]; continue; }
    const k = Math.min(1, t.t / t.dur), e = t.ease(k);
    for (const p in t.to) t.o[p] = t.from[p] + (t.to[p] - t.from[p]) * e;
    if (k < 1) G.tweens.push(t); else if (t.done) t.done();
  }
  const tms = G.timers; G.timers = [];
  for (const t of tms) { if (t.scene && t.scene !== G.scene) continue; if (t.dead) continue; t.t -= dt; if (t.t <= 0) t.fn(); else G.timers.push(t); }
}
/* ---------- partículas ---------- */
const CONF = ['#ff5c8a', '#ffc933', '#3ec1f3', '#7ce05c', '#a66cff', '#ff8a3d'];
function burst(x, y, o = {}) {
  const n = G.low ? Math.ceil((o.n || 18) / 2) : (o.n || 18);
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), s = rnd(o.sp0 || 120, o.sp || 420);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 80), g: o.g ?? 700, life: rnd(.5, o.life || 1.1), age: 0, c: o.c ? (Array.isArray(o.c) ? pick(o.c) : o.c) : pick(CONF), sz: rnd(o.s0 || 6, o.s || 14), shape: o.shape || pick(['c', 's', 'st']), rot: rnd(TAU), vr: rnd(-8, 8), drag: o.drag || 0.5 });
  }
}
function confetti(n = 90) { if (G.low) n = n / 3 | 0; for (let i = 0; i < n; i++) G.parts.push({ x: rnd(W), y: rnd(-300, -10), vx: rnd(-60, 60), vy: rnd(120, 260), g: 40, life: rnd(2.5, 4), age: 0, c: pick(CONF), sz: rnd(9, 16), shape: 'conf', rot: rnd(6), vr: rnd(-7, 7), drag: 0 }); }
function puff(x, y, o = {}) { const n = G.low ? 3 : (o.n || 7); for (let i = 0; i < n; i++) G.parts.push({ x: x + rnd(-20, 20), y: y + rnd(-10, 10), vx: rnd(-80, 80), vy: rnd(-90, -20), g: -20, life: rnd(.5, .9), age: 0, c: o.c || '#fff', sz: rnd(14, o.s || 30), shape: 'puff', rot: 0, vr: 0, drag: 2 }); }
function pop(x, y, text, c = '#ffc933', size = 46) { G.pops.push({ x, y, text, c, size, age: 0, life: 1.1 }); }
function shake(a = 12, t = .3) { if (G.low) a *= .5; G.shakeA = Math.max(G.shakeA, a); G.shakeT = Math.max(G.shakeT, t); }
function flash(c = '#fff', t = .25) { G.flashC = c; G.flashT = t; G.flashMax = t; }
function updParts(dt) {
  for (const p of G.parts) { p.age += dt; p.vy += p.g * dt; const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
  G.parts = G.parts.filter(p => p.age < p.life && p.y < H + 60);
  for (const p of G.pops) p.age += dt; G.pops = G.pops.filter(p => p.age < p.life);
}
function drawParts(c) {
  for (const p of G.parts) {
    const k = p.age / p.life; c.globalAlpha = p.shape === 'puff' ? (1 - k) * .85 : k > .7 ? (1 - k) / .3 : 1;
    c.fillStyle = p.c; c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
    if (p.shape === 'c') { c.beginPath(); c.arc(0, 0, p.sz / 2, 0, TAU); c.fill(); }
    else if (p.shape === 's') { c.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz); }
    else if (p.shape === 'st') { starPath(c, 0, 0, p.sz * .7, p.sz * .3, 5); c.fill(); }
    else if (p.shape === 'conf') { c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2); }
    else if (p.shape === 'puff') { c.beginPath(); c.arc(0, 0, p.sz * (0.6 + k * .6), 0, TAU); c.fill(); }
    else if (p.shape === 'drop') { c.beginPath(); c.arc(0, 0, p.sz / 2, 0, TAU); c.fill(); }
    c.restore();
  }
  c.globalAlpha = 1;
  for (const p of G.pops) {
    const k = p.age / p.life, s = k < .2 ? E.outBack(k / .2) : 1;
    c.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
    c.save(); c.translate(p.x, p.y - k * 70); c.scale(s, s);
    txt(p.text, 0, 0, { size: p.size, font: 'T', color: p.c, outline: 8 });
    c.restore();
  }
  c.globalAlpha = 1;
}
function starPath(c, x, y, R, r, n = 5, rot = -Math.PI / 2) {
  c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r : R; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
}
/* ---------- texto ---------- */
const FONTS = { T: '"Lucky", "Arial Black", sans-serif', B: '"Fredoka", "Trebuchet MS", sans-serif' };
const INK = '#23193d';
function font(size, f = 'B', w = 700) { return f === 'T' ? `${Math.round(size)}px ${FONTS.T}` : `${w} ${Math.round(size)}px ${FONTS.B}`; }
function txt(s, x, y, o = {}) {
  const c = G.ctx; c.font = font(o.size || 32, o.font || 'B', o.w || 700);
  c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
  const yy = y + (o.font === 'T' ? (o.size || 32) * 0.1 : 0);
  if (o.shadow) { c.fillStyle = o.shadowC || 'rgba(0,0,0,.35)'; if (o.outline) { c.lineWidth = o.outline; c.lineJoin = 'round'; c.strokeStyle = o.shadowC || 'rgba(0,0,0,.35)'; c.strokeText(s, x + o.shadow * .5, yy + o.shadow); } c.fillText(s, x + o.shadow * .5, yy + o.shadow); }
  if (o.outline) { c.lineWidth = o.outline; c.lineJoin = 'round'; c.miterLimit = 2; c.strokeStyle = o.oc || INK; c.strokeText(s, x, yy); }
  c.fillStyle = o.color || INK; c.fillText(s, x, yy);
}
function tw_(s, size, f = 'B', w = 700) { G.ctx.font = font(size, f, w); return G.ctx.measureText(s).width; }
function wrap(s, maxW, size, f = 'B', w = 700) {
  const out = []; for (const para of String(s).split('\n')) {
    const words = para.split(' '); let line = '';
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (tw_(t, size, f, w) > maxW && line) { out.push(line); line = wd; } else line = t; }
    out.push(line);
  } return out;
}
function fitSize(s, maxW, size, f = 'B', min = 14) { while (size > min && tw_(s, size, f) > maxW) size -= 2; return size; }
/* ---------- formas ---------- */
function rrPath(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function rr(x, y, w, h, r, fill, stroke, lw = 5) { const c = G.ctx; rrPath(c, x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); } }
function circle(x, y, r, fill, stroke, lw = 5) { const c = G.ctx; c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } }
function shade(hex, k) { // k>0 aclara, k<0 oscurece
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
function panel(x, y, w, h, fill = '#fff8ea', o = {}) {
  const c = G.ctx, r = o.r ?? 26;
  if (!o.noShadow) rr(x + 6, y + 9, w, h, r, 'rgba(20,10,40,.28)');
  rr(x, y, w, h, r, fill, INK, o.lw || 6);
  if (o.shine !== false) { c.save(); rrPath(c, x + 3, y + 3, w - 6, h - 6, r - 3); c.clip(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y, w, Math.min(18, h * .2)); c.restore(); }
}
/* ---------- botones ---------- */
class Btn {
  constructor(o) { Object.assign(this, { vis: true, on: true, color: '#ffc933', tc: '#fff', size: 34, f: 'T', down: 0, sq: 0, pulse: false, r: 22 }, o); }
  hit(p) { return this.vis && this.on && p.x >= this.x - 6 && p.x <= this.x + this.w + 6 && p.y >= this.y - 6 && p.y <= this.y + this.h + 6; }
  draw() {
    if (!this.vis) return; const c = G.ctx; const { x, y, w, h } = this;
    const pr = this.down ? 1 : 0, lip = 9;
    let s = 1 + this.sq; if (this.pulse && this.on) s += Math.sin(G.t * 5) * .025;
    c.save(); c.translate(x + w / 2, y + h / 2); c.scale(s, s); c.translate(-w / 2, -h / 2);
    if (!this.on) c.globalAlpha = .45;
    const col = this.color;
    rr(4, lip + 6, w, h - lip, this.r, 'rgba(20,10,40,.3)');
    rr(0, pr * lip, w, h - lip, this.r, shade(col, -.3), INK, 6);
    rr(0, pr * lip - (1 - pr) * 0, w, h - lip, this.r, col);
    c.save(); rrPath(c, 0, pr * lip, w, h - lip, this.r); c.clip();
    c.fillStyle = shade(col, -.3); c.fillRect(0, pr * lip + h - lip - 10, w, 10);
    c.fillStyle = 'rgba(255,255,255,.35)'; rrPath(c, 10, pr * lip + 7, w - 20, Math.min(16, (h - lip) * .28), 8); c.fill();
    c.restore();
    rrPath(c, 0, pr * lip, w, h - lip, this.r); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    const cy = pr * lip + (h - lip) / 2;
    if (this.icon) this.icon(w / 2, cy, this);
    if (this.label) {
      const size = fitSize(this.label, w - 30, this.size, this.f);
      txt(this.label, w / 2, cy + 2, { size, font: this.f, color: this.tc, outline: this.tc === INK ? 0 : 7 });
    }
    c.restore();
  }
}
function tapBtn(b) { b.sq = -.08; tw(b, { sq: 0 }, .35, { ease: E.outEl }); Sound.sfx('tap'); }
/* ---------- escenas ---------- */
function go(make, o = {}) {
  if (G.trans) return;
  G.trans = { make, t: 0, phase: 0, kind: o.kind || 'iris', cx: o.x ?? W / 2, cy: o.y ?? H / 2, col: o.col || INK };
}
function enter(sc) { if (G.scene && G.scene !== sc && G.scene.exit) G.scene.exit(); G.scene = sc; G.tweens = G.tweens.filter(t => !t.scene); G.timers = G.timers.filter(t => !t.scene); G.parts = []; G.pops = []; for (const k of G.ptrs.keys()) G.ptrs.delete(k); sc.btns = sc.btns || []; if (sc.enter) sc.enter(); }
function resize() {
  const ww = innerWidth, wh = innerHeight; G.scale = Math.min(ww / W, wh / H);
  G.dpr = Math.min(window.devicePixelRatio || 1, G.low ? 1 : 2);
  let rs = G.scale * G.dpr; const maxRs = G.low ? 1.1 : 1.6; if (rs > maxRs) rs = maxRs; if (rs < .5) rs = .5;
  G.rs = rs; G.cv.width = Math.round(W * rs); G.cv.height = Math.round(H * rs);
  const cw = W * G.scale, ch = H * G.scale; G.ox = (ww - cw) / 2; G.oy = (wh - ch) / 2;
  Object.assign(G.cv.style, { width: cw + 'px', height: ch + 'px', left: G.ox + 'px', top: G.oy + 'px' });
  G.caches.clear();
}
function toLogical(e) { return { x: (e.clientX - G.ox) / G.scale, y: (e.clientY - G.oy) / G.scale, id: e.pointerId }; }
/* caché de dibujos estáticos (se regenera al cambiar el tamaño) */
function cached(key, w, h, fn) {
  let cv = G.caches.get(key);
  if (!cv) { cv = document.createElement('canvas'); cv.width = Math.ceil(w * G.rs); cv.height = Math.ceil(h * G.rs); const c = cv.getContext('2d'); c.scale(G.rs, G.rs); const prev = G.ctx; G.ctx = c; try { fn(c); } finally { G.ctx = prev; } G.caches.set(key, cv); }
  return cv;
}
function blit(key, x, y, w, h, fn) { const cv = cached(key, w, h, fn); G.ctx.drawImage(cv, x, y, w, h); }
function initInput() {
  const cv = G.cv;
  const btns = () => (G.scene && G.scene.btns) || [];
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); Sound.init(); if (G.trans) return; const p = toLogical(e);
    try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    G.ptrs.set(e.pointerId, p);
    const list = btns();
    for (let i = list.length - 1; i >= 0; i--) { const b = list[i]; if (b.hit(p)) { b.down = e.pointerId; b.downT = G.t; if (b.onDown) b.onDown(p); return; } }
    if (G.scene.down) G.scene.down(p);
  });
  cv.addEventListener('pointermove', e => {
    e.preventDefault(); const p = toLogical(e); if (G.ptrs.has(e.pointerId)) G.ptrs.set(e.pointerId, p);
    for (const b of btns()) if (b.down === e.pointerId && !b.hit(p) && !b.sticky) b.down = 0;
    if (G.scene && G.scene.move && !G.trans) G.scene.move(p);
  });
  const up = e => {
    e.preventDefault(); const p = toLogical(e); G.ptrs.delete(e.pointerId); if (G.trans) return;
    for (const b of btns()) if (b.down === e.pointerId) { b.down = 0; if (b.hit(p) || b.sticky) { tapBtn(b); b.onTap && b.onTap(b); } return; }
    if (G.scene && G.scene.up) G.scene.up(p);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { G.ptrs.delete(e.pointerId); for (const b of btns()) if (b.down === e.pointerId) b.down = 0; if (G.scene && G.scene.cancel) G.scene.cancel(toLogical(e)); });
  addEventListener('keydown', e => {
    Sound.init(); if (G.trans) return;
    if (G.scene && G.scene.key && G.scene.key(e)) { e.preventDefault(); return; }
    for (const b of btns()) if (b.vis && b.on && b.key && b.key.includes(e.key)) { tapBtn(b); b.onTap && b.onTap(b); e.preventDefault(); return; }
  });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Sound.suspend(); if (G.scene && G.scene.pause && !G.scene.paused) G.scene.pause(); } else Sound.resume(); });
  cv.addEventListener('contextmenu', e => e.preventDefault());
}
let lastT = 0, fpsAcc = 0, fpsN = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  let dt = Math.min(.05, (ts - lastT) / 1000 || 0) * (G.speed || 1); lastT = ts; G.dt = dt; G.t += dt;
  fpsAcc += dt; fpsN++; if (fpsAcc > 2) { G.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (G.fps < 30 && !G.low && !G.autoLowTried && G.t > 8) { G.autoLowTried = true; setLow(true); } }
  const T = G.trans;
  if (T) {
    T.t += dt * (T.phase ? 2.4 : 2.8);
    if (T.phase === 0 && T.t >= 1) { T.phase = 1; T.t = 0; const sc = T.make(); enter(sc); }
    else if (T.phase === 1 && T.t >= 1) G.trans = null;
  }
  const sc = G.scene;
  if (sc && !(T && T.phase === 0)) { if (!sc.paused) { updTweens(dt); if (sc.update) sc.update(dt); } else if (sc.updatePaused) { updTweens(dt); sc.updatePaused(dt); } updParts(sc.paused ? 0 : dt); }
  else updTweens(dt);
  if (G.shakeT > 0) G.shakeT -= dt; if (G.flashT > 0) G.flashT -= dt;
  const c = G.ctx; c.setTransform(G.rs, 0, 0, G.rs, 0, 0);
  if (G.shakeT > 0) { const a = G.shakeA * (G.shakeT / .3); c.translate(rnd(-a, a), rnd(-a, a)); } else G.shakeA = 0;
  if (sc) { sc.draw(c); drawParts(c); if (sc.drawTop) sc.drawTop(c); }
  c.setTransform(G.rs, 0, 0, G.rs, 0, 0);
  if (G.flashT > 0) { c.globalAlpha = clamp(G.flashT / G.flashMax, 0, 1) * .8; c.fillStyle = G.flashC; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  if (T) drawTrans(c, T);
}
function drawTrans(c, T) {
  const k = T.phase === 0 ? E.inOut(Math.min(1, T.t)) : 1 - E.inOut(Math.min(1, T.t));
  const R = Math.hypot(W, H) * (1 - k);
  c.save(); c.fillStyle = T.col; c.beginPath(); c.rect(0, 0, W, H);
  if (R > 1) c.arc(T.cx, T.cy, R, 0, TAU, true); c.fill('evenodd');
  if (R > 1 && R < 800) { c.lineWidth = 10; c.strokeStyle = '#ffc933'; c.beginPath(); c.arc(T.cx, T.cy, R, 0, TAU); c.stroke(); }
  c.restore();
}
function setLow(v) { G.low = v; resize(); if (window.Store) { Store.d.settings.low = v; Store.save(); } }
