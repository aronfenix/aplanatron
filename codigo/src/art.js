'use strict';
/* =====================================================================
   ARTE: personajes y objetos dibujados con código (estilo cartoon)
   ===================================================================== */
const C = {
  ink: INK, sky: '#8fd8ff', sky2: '#d9f4ff', sea: '#3fa7e8', sea2: '#2b86cc', land: '#ffe08a', land2: '#f4c865', pt: '#f3e7c9',
  grass: '#8fdc5e', grass2: '#5fbf3f', mount: '#c98c5a', mount2: '#9c6440', snow: '#ffffff', river: '#2f8fe6',
  pink: '#ff5c8a', yellow: '#ffc933', orange: '#ff8a3d', blue: '#3ec1f3', green: '#7ce05c', purple: '#a66cff', red: '#ff4b4b', teal: '#2fd3c0',
  cream: '#fff8ea', grey: '#9a93b5', dgrey: '#5d5680',
  skin: '#f4c7a1', skin2: '#e3a47f', skin3: '#c9805e', hair: '#3b2a22', hair2: '#6f5c52', shirt: '#dff5ea', shirt2: '#b7decb', cape: '#43257a', cape2: '#e0284f',
};
function P(c, pts, close = true) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); if (close) c.closePath(); }
function fillStroke(c, fill, lw = 5, stroke = INK) { if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); } }
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); }
/* curva suave que pasa por los puntos (Catmull-Rom cerrada/abierta) */
function smooth(c, pts, close = true, t = .5) {
  const n = pts.length / 2; c.beginPath(); const g = i => { i = close ? (i + n) % n : clamp(i, 0, n - 1); return [pts[i * 2], pts[i * 2 + 1]]; };
  c.moveTo(pts[0], pts[1]);
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const [x0, y0] = g(i - 1), [x1, y1] = g(i), [x2, y2] = g(i + 1), [x3, y3] = g(i + 2);
    c.bezierCurveTo(x1 + (x2 - x0) * t / 3, y1 + (y2 - y0) * t / 3, x2 - (x3 - x1) * t / 3, y2 - (y3 - y1) * t / 3, x2, y2);
  }
  if (close) c.closePath();
}
/* borde "peludo" (barba, pelo) a lo largo de una curva */
function fuzzy(pts, amp = 6, step = 10, close = true, seed = 1) {
  const out = []; const n = pts.length / 2; let s = seed;
  const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const x1 = pts[i * 2], y1 = pts[i * 2 + 1], j = (i + 1) % n, x2 = pts[j * 2], y2 = pts[j * 2 + 1];
    const L = Math.hypot(x2 - x1, y2 - y1), m = Math.max(1, Math.round(L / step)), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    for (let k = 0; k < m; k++) { const f = k / m, a = (k % 2 ? amp : -amp * .25) * (.6 + R() * .6); out.push(x1 + (x2 - x1) * f + nx * a, y1 + (y2 - y1) * f + ny * a); }
  }
  if (!close) out.push(pts[pts.length - 2], pts[pts.length - 1]);
  return out;
}
/* ---------- ojos genéricos ---------- */
function eye(c, x, y, rx, ry, o = {}) {
  const look = o.look || [0, 0], lid = o.lid ?? 0, lidB = o.lidB ?? 0, iris = o.iris || '#5a3420', ir = o.ir ?? rx * .62;
  if (o.closed) { c.beginPath(); c.moveTo(x - rx, y); c.quadraticCurveTo(x, y + (o.closed === 'up' ? -ry * .8 : ry * .7), x + rx, y); fillStroke(c, null, o.lw || 5); return; }
  ell(c, x, y, rx, ry); c.fillStyle = '#fff'; c.fill();
  c.save(); ell(c, x, y, rx, ry); c.clip();
  const px = x + look[0] * rx * .45, py = y + look[1] * ry * .4;
  circle(px, py, ir, iris); circle(px, py, ir * .52, '#150b08');
  circle(px - ir * .35, py - ir * .38, ir * .3, '#fff');
  // párpados
  if (lid > 0) { c.fillStyle = o.lidC || C.skin2; c.beginPath(); c.rect(x - rx - 2, y - ry - 2, rx * 2 + 4, ry * 2 * lid + 2); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - rx, y - ry + ry * 2 * lid); c.lineTo(x + rx, y - ry + ry * 2 * lid); c.stroke(); }
  if (lidB > 0) { c.fillStyle = o.lidC || C.skin2; c.beginPath(); c.rect(x - rx - 2, y + ry - ry * 2 * lidB, rx * 2 + 4, ry * 2); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - rx, y + ry - ry * 2 * lidB); c.lineTo(x + rx, y + ry - ry * 2 * lidB); c.stroke(); }
  c.restore();
  ell(c, x, y, rx, ry); fillStroke(c, null, o.lw || 5);
}
/* =====================================================================
   PROFESOR ÁLVARO
   exprs: smug, evil, laugh, shock, angry, sad, side, talk
   ===================================================================== */
const ALV_EXPR = {
  smug: { brL: [-6, 4], brR: [8, -10], lid: .38, lidB: .1, look: [.3, 0], mouth: 'smirk' },
  evil: { brL: [14, 0], brR: [14, 0], lid: .3, lidB: .15, look: [0, .1], mouth: 'grin', v: true },
  laugh: { brL: [14, -4], brR: [14, -4], closed: 'up', mouth: 'laugh', v: true },
  shock: { brL: [-16, 0], brR: [-16, 0], lid: 0, look: [0, 0], mouth: 'o', big: 1.25, small: .7 },
  angry: { brL: [18, 4], brR: [18, 4], lid: .25, look: [0, .1], mouth: 'teeth', v: true },
  sad: { brL: [-12, -12], brR: [-12, -12], lid: .35, look: [0, .45], mouth: 'sad', sadBrow: true },
  side: { brL: [4, 0], brR: [-8, 6], lid: .42, lidB: .05, look: [.95, 0], mouth: 'pout' },
  talk: { brL: [0, 0], brR: [-4, 0], lid: .12, look: [0, 0], mouth: 'talk' },
  happy: { brL: [-8, 0], brR: [-8, 0], closed: 'up', mouth: 'smile' },
};
function drawAlvaro(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  const ex = ALV_EXPR[o.expr || 'smug'] || ALV_EXPR.smug;
  const talking = o.talk && Math.sin(t * 22) > -0.2;
  const breathe = Math.sin(t * 2.2) * .012;
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  const arms = o.arms || 'idle';
  // ---- capa (detrás)
  if (o.cape !== false) {
    const wv = Math.sin(t * 2.5) * 8;
    c.beginPath(); c.moveTo(-70, -30); c.bezierCurveTo(-120, 40, -150 + wv, 150, -140 + wv, 250); c.lineTo(140 - wv, 250); c.bezierCurveTo(150 - wv, 150, 120, 40, 70, -30); c.closePath();
    fillStroke(c, C.cape2, 6);
    c.beginPath(); c.moveTo(-60, -30); c.bezierCurveTo(-100, 40, -120 + wv, 150, -112 + wv, 250); c.lineTo(-84, 250); c.bezierCurveTo(-80, 150, -60, 60, -30, -20); c.closePath(); fillStroke(c, C.cape, 0);
    c.beginPath(); c.moveTo(60, -30); c.bezierCurveTo(100, 40, 120 - wv, 150, 112 - wv, 250); c.lineTo(84, 250); c.bezierCurveTo(80, 150, 60, 60, 30, -20); c.closePath(); fillStroke(c, C.cape, 0);
    // cuello alto de la capa
    c.beginPath(); c.moveTo(-58, -8); c.lineTo(-150, -150); c.quadraticCurveTo(-120, -110, -100, -175); c.quadraticCurveTo(-80, -80, -30, -40); c.closePath(); fillStroke(c, C.cape, 6);
    c.beginPath(); c.moveTo(58, -8); c.lineTo(150, -150); c.quadraticCurveTo(120, -110, 100, -175); c.quadraticCurveTo(80, -80, 30, -40); c.closePath(); fillStroke(c, C.cape, 6);
    c.beginPath(); c.moveTo(-64, -18); c.lineTo(-128, -128); c.quadraticCurveTo(-106, -100, -96, -150); c.quadraticCurveTo(-78, -80, -40, -40); c.closePath(); fillStroke(c, C.cape2, 0);
    c.beginPath(); c.moveTo(64, -18); c.lineTo(128, -128); c.quadraticCurveTo(106, -100, 96, -150); c.quadraticCurveTo(78, -80, 40, -40); c.closePath(); fillStroke(c, C.cape2, 0);
  }
  c.save(); c.scale(1 + breathe, 1 - breathe);
  // ---- cuerpo (camiseta de pico)
  c.beginPath(); c.moveTo(-40, -30); c.bezierCurveTo(-90, -20, -96, 20, -92, 90); c.lineTo(-86, 250); c.lineTo(86, 250); c.lineTo(92, 90); c.bezierCurveTo(96, 20, 90, -20, 40, -30); c.closePath();
  fillStroke(c, C.shirt, 6);
  c.save(); c.clip(); c.fillStyle = C.shirt2; c.fillRect(40, -40, 70, 300); c.beginPath(); c.moveTo(-100, 200); c.lineTo(100, 200); c.lineTo(100, 260); c.lineTo(-100, 260); c.fill(); c.restore();
  // cuello en V
  c.beginPath(); c.moveTo(-36, -30); c.quadraticCurveTo(-18, 20, 0, 48); c.quadraticCurveTo(18, 20, 36, -30); c.closePath(); fillStroke(c, C.skin2, 5);
  c.beginPath(); c.moveTo(-24, -26); c.quadraticCurveTo(-12, 10, 0, 34); c.quadraticCurveTo(12, 10, 24, -26); fillStroke(c, C.skin, 0);
  c.beginPath(); c.moveTo(-44, -30); c.quadraticCurveTo(-20, 26, 0, 58); c.quadraticCurveTo(20, 26, 44, -30); fillStroke(c, null, 5, INK);
  c.beginPath(); c.moveTo(-40, -28); c.quadraticCurveTo(-19, 22, 0, 52); c.quadraticCurveTo(19, 22, 40, -28); fillStroke(c, null, 3, C.shirt2);
  // Rojelio en el bolsillo (cameo)
  if (o.pen !== false) {
    c.save(); c.translate(52, 70); c.rotate(.12);
    rr(-9, -36, 18, 50, 7, '#ff3355', INK, 4); rr(-9, -36, 18, 12, 5, '#b8163a', INK, 4);
    circle(-3, -14, 2.5, INK); circle(4, -14, 2.5, INK);
    c.restore();
    rr(28, 60, 50, 42, 6, C.shirt, INK, 4);
  }
  // ---- brazos
  drawAlvArms(c, arms, t, talking);
  c.restore();
  // ---- cabeza
  const hb = Math.sin(t * 2.2 + .6) * 3 + (o.bob || 0);
  const tilt = (o.tilt || 0) + (ex.mouth === 'laugh' ? Math.sin(t * 16) * .05 - .08 : 0);
  c.save(); c.translate(0, -40 + hb); c.rotate(tilt); c.translate(0, 40);
  drawAlvHead(c, ex, o, talking, t);
  c.restore();
  c.restore();
}
function drawAlvArms(c, arms, t, talking) {
  const sleeves = [];
  const sleeve = () => { };
  const hand = (hx, hy, r = 20) => { circle(hx, hy, r, C.skin, INK, 5); };
  const limb = (x1, y1, x2, y2) => {
    c.lineCap = 'round'; c.lineWidth = 30; c.strokeStyle = INK; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.lineWidth = 20; c.strokeStyle = C.skin; c.stroke();
    const mx = lerp(x1, x2, .38), my = lerp(y1, y2, .38);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(mx, my); c.lineWidth = 50; c.strokeStyle = INK; c.stroke(); c.lineWidth = 40; c.strokeStyle = C.shirt; c.stroke();
  };
  if (arms === 'up') {
    const w = Math.sin(t * 14) * 10;
    limb(-80, -8, -150 + w, -120); hand(-152 + w, -128, 22); fingers(c, -152 + w, -128, -2.2);
    limb(80, -8, 150 - w, -120); hand(152 - w, -128, 22); fingers(c, 152 - w, -128, -1);
    sleeve(-82, 0, .9); sleeve(82, 0, -.9);
  } else if (arms === 'point') {
    limb(-78, 0, -86, 150); hand(-86, 158);
    limb(80, -4, 190, -30); c.save(); c.translate(198, -32); rr(-14, -16, 34, 32, 12, C.skin, INK, 5); c.lineWidth = 14; c.strokeStyle = INK; c.beginPath(); c.moveTo(14, -6); c.lineTo(44, -10); c.stroke(); c.lineWidth = 6; c.strokeStyle = C.skin; c.stroke(); c.restore();
    sleeve(-82, 4, .1); sleeve(84, 0, -1.3);
  } else if (arms === 'cross') {
    c.lineCap = 'round';
    limb(-78, 6, 40, 96); limb(78, 6, -40, 106);
    hand(46, 94, 18); hand(-44, 104, 18);
    sleeve(-82, 8, .5); sleeve(82, 8, -.5);
  } else if (arms === 'rub') { // se frota las manos (malvado)
    const w = Math.sin(t * 18) * 6;
    limb(-78, 4, -22 + w, 100); limb(78, 4, 22 + w, 100);
    hand(-14 + w, 102, 22); hand(14 + w, 98, 22);
    sleeve(-82, 6, .45); sleeve(82, 6, -.45);
  } else {
    const sw = Math.sin(t * 2.2) * 4 + (talking ? Math.sin(t * 9) * 6 : 0);
    limb(-78, 0, -92 - sw, 150); hand(-92 - sw, 158);
    limb(78, 0, 92 + sw, 150); hand(92 + sw, 158);
    sleeve(-82, 4, .12); sleeve(82, 4, -.12);
  }
}
function fingers(c, x, y, a) { for (let i = -1; i <= 1; i++) { const aa = a + i * .45; c.lineCap = 'round'; c.lineWidth = 13; c.strokeStyle = INK; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(aa) * 32, y + Math.sin(aa) * 32); c.stroke(); c.lineWidth = 5; c.strokeStyle = C.skin; c.stroke(); } }
function drawAlvHead(c, ex, o, talking, t) {
  // coordenadas con origen en la base del cuello; la cabeza ocupa y ∈ [-270, 10]
  const blink = !ex.closed && ((t % 3.7) < .12);
  // orejas
  for (const sx of [-1, 1]) {
    c.save(); c.scale(sx, 1);
    c.beginPath(); c.moveTo(80, -150); c.bezierCurveTo(118, -178, 132, -120, 118, -98); c.bezierCurveTo(110, -80, 96, -76, 82, -86); c.closePath(); fillStroke(c, C.skin, 5);
    c.beginPath(); c.moveTo(88, -140); c.bezierCurveTo(112, -156, 118, -118, 106, -104); fillStroke(c, null, 4, C.skin3);
    c.restore();
  }
  // cráneo + cara
  c.beginPath(); c.moveTo(0, -272);
  c.bezierCurveTo(62, -272, 92, -226, 90, -160); c.bezierCurveTo(90, -110, 80, -60, 50, -20); c.lineTo(-50, -20); c.bezierCurveTo(-80, -60, -90, -110, -90, -160); c.bezierCurveTo(-92, -226, -62, -272, 0, -272); c.closePath();
  fillStroke(c, C.skin, 6);
  // sombra lateral y brillo de la calva
  c.save(); c.clip();
  c.fillStyle = 'rgba(214,140,108,.35)'; ell(c, 72, -170, 30, 110); c.fill();
  c.fillStyle = 'rgba(255,255,255,.75)'; ell(c, -28, -236, 26, 12, -.35); c.fill(); ell(c, 8, -248, 7, 4, -.2); c.fill();
  c.restore();
  // pelo lateral rapado (muy corto, entradas profundas)
  c.save(); c.beginPath(); c.moveTo(0, -272); c.bezierCurveTo(62, -272, 92, -226, 90, -160); c.bezierCurveTo(90, -110, 80, -60, 50, -20); c.lineTo(-50, -20); c.bezierCurveTo(-80, -60, -90, -110, -90, -160); c.bezierCurveTo(-92, -226, -62, -272, 0, -272); c.clip();
  for (const sx of [-1, 1]) {
    c.save(); c.scale(sx, 1);
    smooth(c, [58, -240, 80, -222, 94, -190, 96, -150, 94, -118, 84, -118, 80, -150, 74, -188, 60, -218], true, .4);
    c.fillStyle = '#5e4a3e'; c.fill();
    c.fillStyle = '#3b2a22'; for (let i = 0; i < 26; i++) { const yy = -232 + i * 4.4, xx = 70 + ((i * 37) % 17) + (yy > -200 ? 8 : 0); circle(xx, yy, 1.6, '#3b2a22'); }
    c.restore();
  }
  c.restore();
  c.beginPath(); c.moveTo(0, -272); c.bezierCurveTo(62, -272, 92, -226, 90, -160); c.bezierCurveTo(90, -110, 80, -60, 50, -20); c.lineTo(-50, -20); c.bezierCurveTo(-80, -60, -90, -110, -90, -160); c.bezierCurveTo(-92, -226, -62, -272, 0, -272); fillStroke(c, null, 6);
  // pelusilla central de la frente
  c.fillStyle = C.hair2; for (let i = -3; i <= 3; i++) { ell(c, i * 7, -258 + Math.abs(i) * 1.5, 2.2, 3); c.fill(); }
  // arrugas de la frente (en sorpresa)
  if (ex.big) { c.lineWidth = 3; c.strokeStyle = C.skin3; for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-34, -226 - i * 10); c.quadraticCurveTo(0, -234 - i * 10, 34, -226 - i * 10); c.stroke(); } }
  // barba (de patilla a patilla)
  const open = ex.mouth === 'laugh' ? 1 : ex.mouth === 'o' ? .5 : ex.mouth === 'teeth' ? .3 : ex.mouth === 'grin' ? .45 : (ex.mouth === 'talk' || talking) ? (talking ? .45 : .1) : 0;
  const jaw = open * 16;
  const beard = [-86, -128, -76, -102, -60, -88, -40, -84, -20, -90, 0, -92, 20, -90, 40, -84, 60, -88, 76, -102, 86, -128, 90, -96, 82, -52 + jaw * .5, 60, -10 + jaw, 30, 14 + jaw, 0, 20 + jaw, -30, 14 + jaw, -60, -10 + jaw, -82, -52 + jaw * .5, -90, -96];
  smooth(c, fuzzy(beard, 3, 7, true, 7), true, .35); fillStroke(c, C.hair, 5);
  c.save(); smooth(c, beard, true, .35); c.clip(); c.fillStyle = 'rgba(255,255,255,.07)'; ell(c, -30, -40, 40, 30); c.fill(); c.restore();
  // canas en la barba
  c.fillStyle = C.hair2; for (const [bx, by] of [[-40, -10], [-50, -30], [42, -14], [30, 0], [-22, 6], [52, -34], [-62, -52], [60, -60], [0, 12], [-12, -2], [16, 8]]) { ell(c, bx, by + jaw * .8, 3.5, 2); c.fill(); }
  // bigote
  smooth(c, fuzzy([-48, -62, -28, -80, 0, -76, 28, -80, 48, -62, 30, -58, 0, -62, -30, -58], 2, 6, true, 9), true, .3); fillStroke(c, '#2c1f19', 0);
  // boca
  drawAlvMouth(c, talking && ex.mouth !== 'laugh' && ex.mouth !== 'o' ? 'talk' : ex.mouth, jaw, t);
  // nariz (larga y recta)
  c.beginPath(); c.moveTo(-6, -158); c.bezierCurveTo(-12, -128, -26, -98, -18, -88); c.bezierCurveTo(-12, -80, 12, -80, 18, -88); c.bezierCurveTo(24, -96, 12, -128, 8, -158); fillStroke(c, C.skin, 5);
  c.beginPath(); c.moveTo(-14, -92); c.quadraticCurveTo(-8, -86, -2, -90); fillStroke(c, null, 3.5, C.skin3);
  c.beginPath(); c.moveTo(14, -92); c.quadraticCurveTo(8, -86, 2, -90); fillStroke(c, null, 3.5, C.skin3);
  ell(c, 6, -110, 5, 9, .1); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
  // mejillas
  c.fillStyle = 'rgba(255,120,120,.25)'; ell(c, -54, -104, 16, 9); c.fill(); ell(c, 54, -104, 16, 9); c.fill();
  // ojos
  const big = ex.big || 1, erx = 23 * big, ery = 22 * big;
  const look = o.look || ex.look || [0, 0];
  for (const sx of [-1, 1]) {
    const eyx = sx * 38, eyy = -150;
    if (!ex.closed) { c.fillStyle = 'rgba(190,120,95,.3)'; ell(c, eyx, eyy + 7, erx + 5, ery + 4); c.fill(); }
    if (blink) eye(c, eyx, eyy, erx, ery, { closed: 'down' });
    else eye(c, eyx, eyy, erx, ery, { look, lid: ex.lid || 0, lidB: ex.lidB || 0, closed: ex.closed, ir: erx * .58 * (ex.small || 1), iris: '#4b2a17', lidC: C.skin });
  }
  // cejas (gruesas y oscuras)
  for (const sx of [-1, 1]) {
    const b = sx < 0 ? ex.brL : ex.brR; const dy = b[1], inner = b[0];
    const x0 = sx * 14, x1 = sx * 64, yb = -186 + dy;
    c.beginPath();
    if (ex.sadBrow) { c.moveTo(x0, yb - 10); c.quadraticCurveTo(sx * 38, yb - 16, x1, yb + 6); }
    else { c.moveTo(x0, yb + inner); c.quadraticCurveTo(sx * 40, yb - 14 + (ex.v ? inner * .3 : 0), x1, yb - 2); }
    c.lineCap = 'round'; c.lineWidth = 17; c.strokeStyle = INK; c.stroke(); c.lineWidth = 11; c.strokeStyle = C.hair; c.stroke();
  }
  if (ex.mouth === 'sad') { c.fillStyle = '#7fd0ff'; const k = (t * .8) % 1; ell(c, -50, -130 + k * 60, 6, 9); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
}
function drawAlvMouth(c, m, jaw, t) {
  const lip = '#c4575c', dark = '#5a1a26';
  if (m === 'smirk') { c.beginPath(); c.moveTo(-24, -46); c.quadraticCurveTo(0, -36, 30, -56); c.quadraticCurveTo(4, -44, -24, -46); fillStroke(c, lip, 4); return; }
  if (m === 'pout') { ell(c, 0, -44, 17, 10); fillStroke(c, lip, 5); c.beginPath(); c.moveTo(-10, -44); c.lineTo(10, -44); fillStroke(c, null, 3, dark); return; }
  if (m === 'smile') { c.beginPath(); c.moveTo(-30, -52); c.quadraticCurveTo(0, -26, 30, -52); c.quadraticCurveTo(0, -38, -30, -52); fillStroke(c, dark, 5); return; }
  if (m === 'sad') { c.beginPath(); c.moveTo(-26, -34); c.quadraticCurveTo(-12, -50, 0, -44); c.quadraticCurveTo(12, -50, 26, -34); c.quadraticCurveTo(0, -40, -26, -34); fillStroke(c, lip, 4); return; }
  if (m === 'o') { ell(c, 0, -40, 14, 18); fillStroke(c, dark, 5); ell(c, 0, -32, 8, 6); c.fillStyle = '#e26b7a'; c.fill(); return; }
  if (m === 'talk') { const h = 8 + jaw * 1.2; ell(c, 0, -46 + h * .4, 22, h); fillStroke(c, dark, 5); c.save(); ell(c, 0, -46 + h * .4, 22, h); c.clip(); c.fillStyle = '#fff'; c.fillRect(-22, -46 + h * .4 - h, 44, 6); c.fillStyle = '#e26b7a'; ell(c, 0, -46 + h * 1.3, 14, 8); c.fill(); c.restore(); return; }
  // grin / laugh / teeth: boca grande con dientes
  const h = m === 'laugh' ? 30 : m === 'grin' ? 18 : 14, w = m === 'laugh' ? 44 : 46;
  c.beginPath(); c.moveTo(-w, -58); c.quadraticCurveTo(0, -50, w, -58); c.quadraticCurveTo(w * .6, -58 + h * 1.6, 0, -56 + h * 1.7); c.quadraticCurveTo(-w * .6, -58 + h * 1.6, -w, -58); c.closePath();
  fillStroke(c, dark, 5);
  c.save(); c.clip();
  c.fillStyle = '#fff'; c.fillRect(-w, -60, w * 2, m === 'teeth' ? 30 : 12);
  if (m !== 'teeth') { c.fillStyle = '#e26b7a'; ell(c, 0, -56 + h * 1.6, w * .5, h * .5); c.fill(); }
  c.lineWidth = 2.5; c.strokeStyle = '#d8c8c8'; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 12, -60); c.lineTo(i * 12, m === 'teeth' ? -30 : -48); c.stroke(); }
  c.restore();
  c.beginPath(); c.moveTo(-w, -58); c.quadraticCurveTo(0, -50, w, -58); c.quadraticCurveTo(w * .6, -58 + h * 1.6, 0, -56 + h * 1.7); c.quadraticCurveTo(-w * .6, -58 + h * 1.6, -w, -58); c.closePath(); fillStroke(c, null, 5);
}
/* =====================================================================
   DON TEIDE (volcán sabio y gruñón)
   exprs: happy, talk, worried, shout, proud
   ===================================================================== */
function drawTeide(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0), ex = o.expr || 'happy';
  const talking = o.talk && Math.sin(t * 20) > -0.2;
  const sq = Math.sin(t * 2.4) * .02 + (o.jump || 0);
  c.save(); c.translate(x, y); c.scale(s * (1 + sq), s * (1 - sq));
  if (o.alpha != null) c.globalAlpha = o.alpha;
  // bracitos
  const wave = o.wave ? Math.sin(t * 10) * .5 : 0;
  for (const sx of [-1, 1]) {
    c.save(); c.scale(sx, 1); c.translate(118, -70); c.rotate(-.5 + (sx > 0 ? wave : 0) + (ex === 'shout' ? -.9 : 0));
    c.lineCap = 'round'; c.lineWidth = 22; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 0); c.lineTo(46, -20); c.stroke(); c.lineWidth = 13; c.strokeStyle = '#b86a3e'; c.stroke();
    circle(52, -22, 13, '#b86a3e', INK, 5); c.restore();
  }
  // cono
  c.beginPath(); c.moveTo(-160, 0); c.bezierCurveTo(-120, -40, -80, -150, -46, -196); c.lineTo(46, -196); c.bezierCurveTo(80, -150, 120, -40, 160, 0); c.closePath();
  fillStroke(c, '#c87a4c', 7);
  c.save(); c.clip();
  c.fillStyle = '#a95f38'; c.beginPath(); c.moveTo(60, -200); c.bezierCurveTo(90, -120, 110, -60, 170, 0); c.lineTo(80, 0); c.bezierCurveTo(70, -80, 60, -150, 30, -200); c.fill();
  c.fillStyle = '#d99468'; for (const [a, b] of [[-90, -40], [-40, -20], [40, -60], [-70, -110]]) { ell(c, a, b, 26, 7, -.2); c.fill(); }
  // nieve
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-60, -200); c.lineTo(60, -200); c.lineTo(78, -160); c.quadraticCurveTo(62, -150, 54, -164); c.quadraticCurveTo(40, -140, 26, -160); c.quadraticCurveTo(10, -140, -6, -162); c.quadraticCurveTo(-22, -142, -34, -160); c.quadraticCurveTo(-50, -144, -60, -162); c.quadraticCurveTo(-70, -150, -80, -160); c.closePath(); c.fill();
  c.lineWidth = 4; c.strokeStyle = '#b9d6ee'; c.stroke();
  c.restore();
  c.beginPath(); c.moveTo(-160, 0); c.bezierCurveTo(-120, -40, -80, -150, -46, -196); c.lineTo(46, -196); c.bezierCurveTo(80, -150, 120, -40, 160, 0); fillStroke(c, null, 7);
  // cráter
  ell(c, 0, -196, 46, 10); fillStroke(c, ex === 'shout' ? '#ff6a2b' : '#6b3a22', 6);
  // humo / lava
  if (ex === 'shout') { for (let i = 0; i < 3; i++) { const k = (t * 1.6 + i / 3) % 1; circle(Math.sin(i * 3 + t * 4) * 20, -210 - k * 90, 14 + k * 16, k < .5 ? '#ff8a3d' : '#ffc933', INK, 4); } }
  else if (!G.low) { for (let i = 0; i < 3; i++) { const k = (t * .35 + i / 3) % 1; c.globalAlpha = (1 - k) * .9 * (o.alpha ?? 1); circle(Math.sin(k * 6 + i) * 14, -214 - k * 80, 10 + k * 18, '#fff', '#c9d7e8', 3); } c.globalAlpha = o.alpha ?? 1; }
  // cara
  const look = o.look || [0, 0], blink = (t % 4.3) < .12;
  const brow = ex === 'worried' ? 10 : ex === 'shout' ? -14 : ex === 'proud' ? -6 : 0;
  for (const sx of [-1, 1]) {
    const ex0 = sx * 36;
    if (blink || ex === 'proud') eye(c, ex0, -96, 20, 20, { closed: ex === 'proud' ? 'up' : 'down' });
    else eye(c, ex0, -96, 20, ex === 'shout' ? 24 : 21, { look, ir: 11, iris: '#3a6fb0', lid: ex === 'worried' ? .2 : 0, lidC: '#c87a4c' });
    // gafas redondas
    circle(ex0, -96, 27, null, INK, 5);
    // cejas de nube
    c.save(); c.translate(ex0, -132 + (sx < 0 ? brow : brow * (ex === 'worried' ? 1 : 1))); c.rotate(sx * (ex === 'worried' ? -.3 : ex === 'shout' ? .25 : 0));
    for (let i = -1; i <= 1; i++) circle(i * 13, -Math.abs(i) * -3, 11, '#fff', INK, 4);
    for (let i = -1; i <= 1; i++) circle(i * 13, -Math.abs(i) * -3, 8, '#fff');
    c.restore();
  }
  c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(-10, -96); c.quadraticCurveTo(0, -104, 10, -96); c.stroke();
  // mofletes
  c.fillStyle = 'rgba(255,90,90,.35)'; ell(c, -64, -58, 16, 9); c.fill(); ell(c, 64, -58, 16, 9); c.fill();
  // boca
  const open = ex === 'shout' ? 1 : talking ? .6 : ex === 'worried' ? .2 : 0;
  if (open > 0) { ell(c, 0, -40, 22, 8 + open * 16); fillStroke(c, '#5a1a26', 5); c.save(); ell(c, 0, -40, 22, 8 + open * 16); c.clip(); circle(0, -30 + open * 10, 14, '#e26b7a'); c.restore(); }
  else { c.beginPath(); c.moveTo(-26, -48); c.quadraticCurveTo(0, -24, 26, -48); fillStroke(c, '#5a1a26', 5); }
  // bigote de nube
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) circle(sx * (10 + i * 13), -56 - i * 2 + (i === 2 ? 4 : 0), 11 - i, '#fff', INK, 4);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) circle(sx * (10 + i * 13), -56 - i * 2 + (i === 2 ? 4 : 0), 8 - i, '#fff');
  c.restore();
}
/* =====================================================================
   RODOLFO, la apisonadora parlante (mira a la derecha)
   ===================================================================== */
function drawRodolfo(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0), ex = o.expr || 'happy', boss = !!o.boss;
  const talking = o.talk && Math.sin(t * 18) > -0.2;
  const vib = (o.moving ? Math.sin(t * 40) * 2 : 0);
  const body = boss ? '#8f4fe8' : '#ffc12e', body2 = boss ? '#6a2fc0' : '#e89a12';
  c.save(); c.translate(x, y + vib); c.scale(s * (o.flip ? -1 : 1), s);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  const rot = (o.dist || t * 2) * (o.moving ? 1 : 0);
  // tubo de escape y humo
  rr(-118, -236, 22, 70, 6, '#6b6b7a', INK, 5); rr(-124, -246, 34, 16, 6, '#4b4b5a', INK, 5);
  if (!G.low) for (let i = 0; i < 3; i++) { const k = (t * (o.moving ? 1.8 : .7) + i / 3) % 1; c.globalAlpha = (1 - k) * (o.alpha ?? 1) * .85; circle(-107 - k * 50, -256 - k * 70, 10 + k * 16, boss ? '#b58cff' : '#d8d8e6', INK, 3); }
  c.globalAlpha = o.alpha ?? 1;
  // Álvaro montado (detrás de la cabina: se le ve de cintura para arriba)
  if (o.rider) { c.save(); c.translate(-60, -255); c.scale(o.flip ? -1 : 1, 1); drawAlvaro(0, -30, o.riderS || .42, { expr: o.rider, arms: o.riderArms || 'point', ph: 1, talk: o.riderTalk }); c.restore(); }
  // cuerpo trasero
  rr(-180, -170, 250, 110, 26, body, INK, 7);
  c.fillStyle = body2; rrPath(c, -180, -100, 250, 40, 20); c.fill(); rr(-180, -170, 250, 110, 26, null, INK, 7);
  // cabina
  rr(-150, -300, 170, 150, 24, body, INK, 7);
  rr(-138, -290, 146, 16, 8, 'rgba(255,255,255,.4)');
  // parabrisas con ojos
  rr(-132, -272, 136, 88, 18, '#dff3ff', INK, 6);
  const look = o.look || [.4, 0];
  const lid = ex === 'angry' ? .35 : ex === 'sleepy' ? .5 : 0;
  eye(c, -96, -228, 26, 30, { look, ir: 15, iris: '#2b6ad0', lid, lidC: '#bfe6ff' });
  eye(c, -30, -228, 26, 30, { look, ir: 15, iris: '#2b6ad0', lid, lidC: '#bfe6ff' });
  if (ex === 'angry') { c.lineWidth = 9; c.strokeStyle = INK; c.lineCap = 'round'; c.beginPath(); c.moveTo(-122, -270); c.lineTo(-76, -254); c.moveTo(-4, -270); c.lineTo(-50, -254); c.stroke(); }
  if (ex === 'love') { for (const hx of [-96, -30]) { c.fillStyle = '#ff5c8a'; c.beginPath(); c.moveTo(hx, -210); c.bezierCurveTo(hx - 30, -236, hx - 16, -262, hx, -244); c.bezierCurveTo(hx + 16, -262, hx + 30, -236, hx, -210); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); } }
  // boca (parrilla delantera)
  const open = talking ? 1 : ex === 'shout' || ex === 'angry' ? .8 : 0;
  rr(-10, -150 - open * 6, 90, 50 + open * 12, 14, open ? '#5a1a26' : '#555566', INK, 6);
  if (!open) { c.lineWidth = 4; c.strokeStyle = '#8888a0'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(4 + i * 20, -142); c.lineTo(4 + i * 20, -108); c.stroke(); } }
  else { c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) rr(0 + i * 20, -154, 16, 14, 3, '#fff'); circle(34, -110, 14, '#e26b7a'); }
  // rodillo delantero
  c.save(); c.translate(150, -86);
  circle(0, 0, 86, '#8b8fa8', INK, 7); circle(0, 0, 70, '#a8adc4'); c.lineWidth = 5; c.strokeStyle = '#7a7e96';
  for (let i = 0; i < 6; i++) { const a = rot + i * TAU / 6; c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); c.lineTo(Math.cos(a) * 66, Math.sin(a) * 66); c.stroke(); }
  circle(0, 0, 26, '#6b6f86', INK, 5); c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, -30, -46, 26, 12, -.6); c.fill();
  if (boss) for (let i = 0; i < 10; i++) { const a = rot + i * TAU / 10; c.save(); c.rotate(a); c.beginPath(); c.moveTo(80, -10); c.lineTo(104, 0); c.lineTo(80, 10); fillStroke(c, '#d8dbe8', 4); c.restore(); }
  c.restore();
  // soporte del rodillo
  rr(56, -186, 118, 40, 12, body, INK, 6);
  // rueda trasera
  c.save(); c.translate(-120, -50); circle(0, 0, 54, '#2e2a3a', INK, 7); circle(0, 0, 26, '#c8c8d8', INK, 5);
  for (let i = 0; i < 4; i++) { const a = rot * 1.5 + i * TAU / 4; circle(Math.cos(a) * 12, Math.sin(a) * 12, 4, INK); } c.restore();
  // luz de alarma
  const on = Math.sin(t * 10) > 0; circle(-2, -312, 14, on ? '#ff5050' : '#a02030', INK, 5);
  if (on && !G.low) { c.globalAlpha = .3 * (o.alpha ?? 1); circle(-2, -312, 30, '#ff5050'); c.globalAlpha = o.alpha ?? 1; }
  if (boss) { txt('A-3000', -55, -76, { size: 30, font: 'T', color: '#ffc933', outline: 6 }); }
  else txt('RODOLFO', -55, -76, { size: 22, font: 'T', color: '#fff', outline: 5 });
  c.restore();
}
/* =====================================================================
   MONTAÑITAS (criaturas de cordillera), GOTAS, GLOBOS, FAROS, BARCOS
   ===================================================================== */
function drawRangeBuddy(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  const col = o.color || C.mount, bob = Math.sin(t * 6) * (o.wiggle ? 6 : 2);
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(o.rot || 0);
  // pies
  for (const fx of [-34, 34]) { const step = o.walk ? Math.sin(t * 14 + fx) * 6 : 0; ell(c, fx + step, 4, 18, 10); fillStroke(c, shade(col, -.35), 5); }
  const peaks = [[-52, 58, .78], [52, 58, .72], [0, 92, 1]];
  for (const [px, ph, k] of peaks) {
    const bw = 64 * k + 22;
    c.beginPath(); c.moveTo(px - bw, 0); c.quadraticCurveTo(px - bw * .3, -ph * .6, px, -ph - bob * k); c.quadraticCurveTo(px + bw * .3, -ph * .6, px + bw, 0); c.closePath();
    fillStroke(c, px === 0 ? col : shade(col, -.12), 6);
    c.save(); c.clip(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(px - 30, -ph * .62 - bob * k); c.lineTo(px, -ph - 10 - bob * k); c.lineTo(px + 30, -ph * .62 - bob * k); c.lineTo(px + 14, -ph * .54 - bob * k); c.lineTo(px + 4, -ph * .64 - bob * k); c.lineTo(px - 8, -ph * .52 - bob * k); c.closePath(); c.fill(); c.restore();
    c.beginPath(); c.moveTo(px - bw, 0); c.quadraticCurveTo(px - bw * .3, -ph * .6, px, -ph - bob * k); c.quadraticCurveTo(px + bw * .3, -ph * .6, px + bw, 0); fillStroke(c, null, 6);
  }
  // cara
  const ex = o.expr || 'happy', blink = (t % 3.1) < .12;
  if (blink) { eye(c, -14, -34, 9, 10, { closed: 'down', lw: 4 }); eye(c, 14, -34, 9, 10, { closed: 'down', lw: 4 }); }
  else { eye(c, -14, -34, 9, ex === 'scared' ? 13 : 10, { look: o.look || [0, 0], ir: 6, lw: 4 }); eye(c, 14, -34, 9, ex === 'scared' ? 13 : 10, { look: o.look || [0, 0], ir: 6, lw: 4 }); }
  if (ex === 'scared') { ell(c, 0, -14, 7, 9); fillStroke(c, '#5a1a26', 4); }
  else if (ex === 'sad') { c.beginPath(); c.moveTo(-10, -10); c.quadraticCurveTo(0, -20, 10, -10); fillStroke(c, null, 4); }
  else { c.beginPath(); c.moveTo(-12, -18); c.quadraticCurveTo(0, -6, 12, -18); fillStroke(c, '#5a1a26', 4); }
  c.fillStyle = 'rgba(255,90,90,.35)'; ell(c, -26, -20, 7, 4); c.fill(); ell(c, 26, -20, 7, 4); c.fill();
  c.restore();
}
function drawDrop(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0), sq = Math.sin(t * 5) * .05;
  c.save(); c.translate(x, y); c.scale(s * (1 + sq), s * (1 - sq)); c.rotate(o.rot || 0);
  c.beginPath(); c.moveTo(0, -60); c.bezierCurveTo(14, -34, 44, -10, 44, 16); c.bezierCurveTo(44, 42, 24, 56, 0, 56); c.bezierCurveTo(-24, 56, -44, 42, -44, 16); c.bezierCurveTo(-44, -10, -14, -34, 0, -60); c.closePath();
  fillStroke(c, o.color || '#4db8ff', 6);
  c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -20, 0, 7, 14, .3); c.fill();
  const ex = o.expr || 'happy';
  eye(c, -13, 12, 9, 11, { look: o.look || [0, 0], ir: 6, lw: 4, closed: ex === 'happyC' ? 'up' : false }); eye(c, 13, 12, 9, 11, { look: o.look || [0, 0], ir: 6, lw: 4, closed: ex === 'happyC' ? 'up' : false });
  if (ex === 'scared') { ell(c, 0, 36, 6, 8); fillStroke(c, '#1a3a6a', 4); }
  else { c.beginPath(); c.moveTo(-10, 30); c.quadraticCurveTo(0, 42, 10, 30); fillStroke(c, '#1a3a6a', 4); }
  c.restore();
}
function drawBalloon(x, y, r, col, label, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.7) * .06 + (o.rot || 0));
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, r * 1.12); c.bezierCurveTo(12, r * 1.5, -12, r * 1.8, 4, r * 2.3); c.stroke();
  ell(c, 0, 0, r, r * 1.12); fillStroke(c, col, 6);
  c.beginPath(); c.moveTo(-9, r * 1.08); c.lineTo(9, r * 1.08); c.lineTo(0, r * 1.22); c.closePath(); fillStroke(c, shade(col, -.2), 4);
  c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, -r * .45, -r * .5, r * .18, r * .32, .5); c.fill();
  if (label) { const size = fitSize(label, r * 1.9, o.size || 30); txt(label, 0, 2, { size, color: '#fff', outline: 7 }); }
  c.restore();
}
function drawLighthouse(x, y, s = 1, on = false, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  c.save(); c.translate(x, y); c.scale(s, s);
  if (on && !o.noBeam) {
    const a = Math.sin(t * 1.8) * .9 + (o.beamA || 0);
    c.save(); c.rotate(a); const gr = c.createLinearGradient(0, 0, 260, 0); gr.addColorStop(0, 'rgba(255,240,150,.85)'); gr.addColorStop(1, 'rgba(255,240,150,0)');
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, -78); c.lineTo(260, -128); c.lineTo(260, -28); c.closePath(); c.fill(); c.restore();
    c.save(); c.rotate(a + Math.PI); c.fillStyle = gr; c.beginPath(); c.moveTo(0, -78); c.lineTo(160, -110); c.lineTo(160, -46); c.closePath(); c.globalAlpha = .5; c.fill(); c.restore();
  }
  c.beginPath(); c.moveTo(-22, 0); c.lineTo(-15, -62); c.lineTo(15, -62); c.lineTo(22, 0); c.closePath(); fillStroke(c, '#fff', 5);
  c.save(); c.clip(); c.fillStyle = '#ff4b5c'; c.fillRect(-30, -20, 60, 14); c.fillRect(-30, -48, 60, 14); c.restore();
  c.beginPath(); c.moveTo(-22, 0); c.lineTo(-15, -62); c.lineTo(15, -62); c.lineTo(22, 0); c.closePath(); fillStroke(c, null, 5);
  rr(-14, -84, 28, 22, 5, on ? '#fff27a' : '#5c6380', INK, 5);
  if (on) { c.globalAlpha = .6 + Math.sin(t * 8) * .2; circle(0, -73, 26, 'rgba(255,240,120,.5)'); c.globalAlpha = 1; }
  c.beginPath(); c.moveTo(-20, -84); c.lineTo(0, -102); c.lineTo(20, -84); c.closePath(); fillStroke(c, '#ff4b5c', 5);
  rr(-22, -64, 44, 6, 3, INK);
  c.restore();
}
function drawBoat(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  c.save(); c.translate(x, y + Math.sin(t * 2.2) * 4); c.rotate(Math.sin(t * 1.7) * .06); c.scale(s * (o.flip ? -1 : 1), s);
  c.beginPath(); c.moveTo(0, -90); c.lineTo(0, -12); c.lineTo(46, -20); c.closePath(); fillStroke(c, '#fff', 5);
  c.beginPath(); c.moveTo(-6, -80); c.lineTo(-6, -14); c.lineTo(-40, -18); c.closePath(); fillStroke(c, o.sail || '#ffc933', 5);
  c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(-3, -96); c.lineTo(-3, -6); c.stroke();
  c.beginPath(); c.moveTo(-58, -12); c.lineTo(62, -12); c.lineTo(44, 16); c.lineTo(-42, 16); c.closePath(); fillStroke(c, o.hull || '#ff5c8a', 6);
  circle(-18, 1, 5, '#fff', INK, 3); circle(6, 1, 5, '#fff', INK, 3); circle(30, 1, 5, '#fff', INK, 3);
  c.restore();
}
function drawCork(x, y, s = 1, rot = 0) {
  const c = G.ctx; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(-14, -16); c.lineTo(14, -16); c.lineTo(11, 16); c.lineTo(-11, 16); c.closePath(); fillStroke(c, '#d9a066', 4);
  c.fillStyle = '#b97c45'; circle(-4, -4, 2.5, '#b97c45'); circle(5, 6, 2, '#b97c45'); ell(c, 0, -16, 14, 4); fillStroke(c, '#e8b884', 4);
  c.restore();
}
function drawStar(x, y, r, on = true, o = {}) {
  const c = G.ctx; c.save(); c.translate(x, y); c.rotate(o.rot || 0); const s = o.s ?? 1; c.scale(s, s);
  starPath(c, 0, 4, r, r * .5, 5); c.fillStyle = 'rgba(20,10,40,.3)'; c.fill();
  starPath(c, 0, 0, r, r * .5, 5); fillStroke(c, on ? '#ffc933' : '#5d5680', Math.max(4, r * .14));
  if (on) { c.fillStyle = 'rgba(255,255,255,.55)'; starPath(c, -r * .12, -r * .15, r * .45, r * .2, 5); c.fill(); }
  c.restore();
}
/* ---------- iconos meteorológicos ---------- */
function drawCloud(x, y, s = 1, col = '#fff', o = {}) {
  const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  const blobs = [[-40, 6, 26], [-12, -12, 34], [22, -6, 30], [44, 10, 22], [0, 12, 28]];
  c.fillStyle = INK; for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(bx, by, r + (o.lw ?? 5), 0, TAU); c.fill(); }
  c.fillStyle = col; for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, -14, -24, 14, 7, -.3); c.fill();
  c.restore();
}
function drawSun(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t; c.save(); c.translate(x, y); c.scale(s, s); c.rotate(t * .4);
  for (let i = 0; i < 10; i++) { c.save(); c.rotate(i * TAU / 10); c.beginPath(); c.moveTo(-10, -44); c.lineTo(0, -66); c.lineTo(10, -44); c.closePath(); fillStroke(c, '#ffb020', 5); c.restore(); }
  c.rotate(-t * .4); circle(0, 0, 42, '#ffd23a', INK, 6);
  if (o.face !== false) { eye(c, -13, -6, 6, 8, { closed: 'up', lw: 4 }); eye(c, 13, -6, 6, 8, { closed: 'up', lw: 4 }); c.beginPath(); c.moveTo(-12, 10); c.quadraticCurveTo(0, 22, 12, 10); fillStroke(c, null, 4); c.fillStyle = 'rgba(255,90,90,.4)'; ell(c, -24, 6, 6, 4); c.fill(); ell(c, 24, 6, 6, 4); c.fill(); }
  c.restore();
}
function drawWeather(kind, x, y, s = 1) {
  const c = G.ctx, t = G.t;
  if (kind === 'lluvia' || kind === 'lluviaFuerte') {
    const n = kind === 'lluviaFuerte' ? 7 : 4;
    for (let i = 0; i < n; i++) { const k = (t * 1.5 + i / n) % 1; c.lineCap = 'round'; c.lineWidth = 6 * s; c.strokeStyle = '#3ea0ff'; c.beginPath(); const xx = x + (i - n / 2 + .5) * 18 * s, yy = y + 20 * s + k * 50 * s; c.moveTo(xx, yy); c.lineTo(xx - 5 * s, yy + 14 * s); c.stroke(); }
    drawCloud(x, y, s, '#dfe8f5');
  } else if (kind === 'nieve') {
    for (let i = 0; i < 5; i++) { const k = (t * .6 + i / 5) % 1; const xx = x + (i - 2) * 20 * s + Math.sin(t * 3 + i) * 5, yy = y + 24 * s + k * 50 * s; txt('*', xx, yy, { size: 34 * s, color: '#fff', outline: 4 }); }
    drawCloud(x, y, s, '#eef3fb');
  } else if (kind === 'sol') drawSun(x, y, s);
  else if (kind === 'calor') { drawSun(x, y - 6 * s, s * .9); thermo(x + 46 * s, y + 10 * s, s * .8, .95); }
  else if (kind === 'frio') { drawWeather('nieve', x - 10 * s, y, s * .8); thermo(x + 50 * s, y + 10 * s, s * .8, .15); }
  else if (kind === 'suave') { drawSun(x - 20 * s, y - 10 * s, s * .7, { face: false }); drawCloud(x + 16 * s, y + 10 * s, s * .8); }
}
function thermo(x, y, s, k) {
  const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  rr(-10, -56, 20, 70, 10, '#fff', INK, 5); circle(0, 20, 16, k > .5 ? '#ff4b4b' : '#3ea0ff', INK, 5);
  rr(-4, 14 - 60 * k, 8, 60 * k + 6, 4, k > .5 ? '#ff4b4b' : '#3ea0ff'); c.restore();
}
/* ---------- plantas y paisajes para las tarjetas de clima ---------- */
function trunk(c, w, h, col = '#8a5a3a') { c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * .35, -h); c.lineTo(w * .35, -h); c.lineTo(w / 2, 0); c.closePath(); fillStroke(c, col, 5); }
function blobCanopy(c, cx, cy, blobs, col) {
  c.fillStyle = INK; for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(cx + bx, cy + by, r + 5, 0, TAU); c.fill(); }
  c.fillStyle = col; for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(cx + bx, cy + by, r, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.22)'; for (const [bx, by, r] of blobs.slice(0, 3)) { c.beginPath(); c.arc(cx + bx - r * .25, cy + by - r * .3, r * .45, 0, TAU); c.fill(); }
}
function drawPlant(kind, x, y, s = 1) {
  const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  ell(c, 0, 2, 70, 10); c.fillStyle = 'rgba(20,10,40,.18)'; c.fill();
  switch (kind) {
    case 'haya': trunk(c, 26, 90, '#a3a3a8'); blobCanopy(c, 0, -120, [[0, -20, 48], [-40, 4, 36], [40, 4, 36], [-20, 24, 30], [22, 24, 30], [0, -52, 30]], '#6fd24e'); break;
    case 'roble': trunk(c, 32, 70, '#7a4a2c'); blobCanopy(c, 0, -104, [[-36, -6, 38], [34, -8, 40], [0, -34, 40], [-10, 16, 34], [30, 20, 28]], '#3f9e3a');
      c.save(); c.translate(56, -32); c.rotate(.4); oakLeaf(c); c.restore(); break;
    case 'castano': trunk(c, 30, 70, '#6e4228'); blobCanopy(c, 0, -104, [[-34, 0, 40], [36, -4, 38], [0, -34, 40], [0, 16, 36]], '#58b33d');
      c.save(); c.translate(52, -28); burr(c); c.restore(); break;
    case 'encina': trunk(c, 28, 50, '#6b4a33'); blobCanopy(c, 0, -80, [[-40, 4, 32], [40, 4, 32], [0, -20, 40], [-18, 16, 30], [20, 16, 30]], '#3d7a3a');
      c.save(); c.translate(56, -20); acorn(c); c.restore(); break;
    case 'alcornoque': trunk(c, 34, 60, '#c0582e'); c.fillStyle = '#8d8274'; c.fillRect(-16, -60, 32, 26); c.lineWidth = 5; c.strokeStyle = INK; c.strokeRect(-16, -60, 32, 26);
      blobCanopy(c, 0, -92, [[-40, 0, 32], [40, 0, 32], [0, -22, 38], [0, 10, 30]], '#4b8a3e'); break;
    case 'drago': c.beginPath(); c.moveTo(-18, 0); c.lineTo(-12, -70); c.lineTo(12, -70); c.lineTo(18, 0); fillStroke(c, '#b7a07e', 5);
      for (const a of [-1.1, -.55, 0, .55, 1.1]) { c.save(); c.translate(0, -70); c.rotate(a); rr(-7, -50, 14, 52, 6, '#b7a07e', INK, 4); c.restore(); }
      for (const a of [-1.1, -.55, 0, .55, 1.1]) { const px = Math.sin(a) * 50, py = -70 - Math.cos(a) * 50; for (let k = -3; k <= 3; k++) { c.save(); c.translate(px, py); c.rotate(k * .35 - Math.PI / 2 + a * .3); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -3, 30, 0); c.quadraticCurveTo(14, 4, 0, 0); fillStroke(c, '#5aa644', 3); c.restore(); } } break;
    case 'palmera': c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-20, -70, 4, -140); c.lineTo(16, -140); c.quadraticCurveTo(-4, -70, 12, 0); c.closePath(); fillStroke(c, '#c49a63', 5);
      for (const a of [-2.6, -2.0, -1.4, -.9, -.3, .3]) { c.save(); c.translate(10, -140); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(40, -24, 80, 10); c.quadraticCurveTo(40, -6, 0, 0); fillStroke(c, '#3fbf4a', 4); c.restore(); }
      circle(4, -132, 8, '#8a5a2a', INK, 3); circle(18, -130, 8, '#8a5a2a', INK, 3); break;
    case 'tabaiba': for (const [a, l] of [[-.8, 50], [-.3, 64], [.2, 60], [.7, 46], [0, 40]]) { c.save(); c.rotate(a); rr(-6, -l, 12, l, 6, '#8e8e6a', INK, 4); blobCanopy(c, 0, -l - 8, [[0, 0, 13], [-9, 4, 9], [9, 4, 9]], '#9ccf4f'); c.restore(); } break;
    case 'sabina': c.beginPath(); c.moveTo(-14, 0); c.bezierCurveTo(-10, -40, 20, -50, 40, -80); c.lineTo(50, -74); c.bezierCurveTo(28, -40, 10, -30, 14, 0); fillStroke(c, '#8a6242', 5); blobCanopy(c, 46, -92, [[0, 0, 26], [-26, 6, 18], [24, 8, 16]], '#5f8f4a'); break;
    case 'abeto': rr(-8, -24, 16, 26, 4, '#7a4a2c', INK, 4); for (let i = 0; i < 3; i++) { const w = 70 - i * 18, yy = -20 - i * 42; c.beginPath(); c.moveTo(-w, yy); c.lineTo(0, yy - 70); c.lineTo(w, yy); c.closePath(); fillStroke(c, '#2f7d4a', 5); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-w * .6, yy - 24); c.lineTo(0, yy - 70); c.lineTo(w * .6, yy - 24); c.quadraticCurveTo(0, yy - 40, -w * .6, yy - 24); c.fill(); } break;
    case 'enebro': blobCanopy(c, 0, -40, [[-30, 6, 26], [30, 6, 26], [0, -14, 32], [0, 14, 28]], '#4f8a6a'); for (const [bx, by] of [[-20, -30], [14, -48], [26, -10], [-6, 0], [-32, 10]]) circle(bx, by, 6, '#5b6fd0', INK, 3); break;
    case 'musgo': c.beginPath(); c.moveTo(-70, 0); c.quadraticCurveTo(-60, -70, 0, -76); c.quadraticCurveTo(64, -70, 70, 0); c.closePath(); fillStroke(c, '#9aa0b5', 5);
      c.save(); c.clip(); blobCanopy(c, 0, -70, [[-40, 0, 26], [0, -10, 30], [40, 0, 26], [-60, 30, 20], [60, 30, 20]], '#7cc242'); c.restore(); c.beginPath(); c.moveTo(-70, 0); c.quadraticCurveTo(-60, -70, 0, -76); c.quadraticCurveTo(64, -70, 70, 0); fillStroke(c, null, 5); break;
    case 'matorral': for (const bx of [-40, 0, 40]) { blobCanopy(c, bx, -24, [[0, 0, 22], [-14, 8, 16], [14, 8, 16]], '#7ea35a'); for (let k = 0; k < 4; k++) circle(bx + Math.cos(k * 1.7) * 14, -30 + Math.sin(k * 1.7) * 12, 5, bx === 0 ? '#b37cf0' : '#d1a6ff', INK, 2.5); } break;
    case 'pradera': c.fillStyle = '#7cd35a'; c.beginPath(); c.ellipse(0, 0, 90, 26, 0, Math.PI, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
      cow(c, 0, -10); break;
    case 'olivo': trunk(c, 26, 50, '#7a6a55'); blobCanopy(c, 0, -76, [[-36, 0, 28], [36, 0, 28], [0, -18, 34], [0, 8, 26]], '#8faa6a'); break;
    case 'pino': c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-4, -60, 8, -110); c.lineTo(16, -108); c.quadraticCurveTo(8, -60, 12, 0); fillStroke(c, '#8a5a3a', 5); blobCanopy(c, 10, -120, [[-32, 0, 26], [30, 2, 26], [0, -12, 30]], '#2f8a4a'); break;
  }
  c.restore();
}
function oakLeaf(c) { c.beginPath(); c.moveTo(0, 20); for (let i = 0; i < 5; i++) { const y = 10 - i * 8; c.quadraticCurveTo(-18, y - 2, -8, y - 6); } c.lineTo(0, -32); for (let i = 4; i >= 0; i--) { const y = 10 - i * 8; c.quadraticCurveTo(8, y - 6, 18, y - 2); } c.closePath(); fillStroke(c, '#5fb33c', 4); }
function burr(c) { c.lineWidth = 3; c.strokeStyle = INK; for (let i = 0; i < 14; i++) { const a = i * TAU / 14; c.beginPath(); c.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); c.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); c.stroke(); } circle(0, 0, 15, '#b8d65a', INK, 4); circle(0, 2, 8, '#7a3f1e', INK, 3); }
function acorn(c) { ell(c, 0, 6, 11, 14); fillStroke(c, '#b9773e', 4); c.beginPath(); c.arc(0, -4, 13, Math.PI, TAU); c.closePath(); fillStroke(c, '#7a5a3a', 4); rr(-2, -22, 4, 8, 2, INK); }
function cow(c, x, y) { c.save(); c.translate(x, y); rr(-34, -40, 60, 34, 14, '#fff', INK, 4); circle(-12, -30, 7, INK); circle(10, -20, 6, INK); for (const lx of [-26, -14, 8, 18]) rr(lx - 3, -10, 7, 16, 3, '#fff', INK, 3); rr(20, -54, 30, 26, 10, '#fff', INK, 4); ell(c, 40, -36, 11, 8); fillStroke(c, '#ffb3c0', 3); circle(30, -46, 3, INK); c.restore(); }
/* criatura "zona llana" (depresiones y submesetas) */
function drawBlobBuddy(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0), col = o.color || '#8fd05e', sq = Math.sin(t * 5) * .05;
  c.save(); c.translate(x, y); c.scale(s * (1 + sq), s * (1 - sq)); c.rotate(o.rot || 0);
  for (const fx of [-30, 30]) { const step = o.walk ? Math.sin(t * 14 + fx) * 6 : 0; ell(c, fx + step, 4, 18, 10); fillStroke(c, shade(col, -.35), 5); }
  c.beginPath(); c.moveTo(-80, 0); c.bezierCurveTo(-84, -40, -60, -56, -20, -54); c.bezierCurveTo(10, -60, 60, -58, 78, -40); c.bezierCurveTo(90, -24, 86, 0, 80, 0); c.closePath(); fillStroke(c, col, 6);
  c.save(); c.clip(); c.fillStyle = shade(col, .25); for (let i = -3; i <= 3; i++) { ell(c, i * 24, -30 + (i % 2) * 8, 10, 4); c.fill(); } c.restore();
  const blink = (t % 3.3) < .12;
  if (blink) { eye(c, -16, -30, 9, 10, { closed: 'down', lw: 4 }); eye(c, 16, -30, 9, 10, { closed: 'down', lw: 4 }); }
  else { eye(c, -16, -30, 9, 10, { look: o.look || [0, 0], ir: 6, lw: 4 }); eye(c, 16, -30, 9, 10, { look: o.look || [0, 0], ir: 6, lw: 4 }); }
  c.beginPath(); c.moveTo(-10, -14); c.quadraticCurveTo(0, -4, 10, -14); fillStroke(c, '#5a1a26', 4);
  c.restore();
}
function drawSack(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t, wob = Math.sin(t * 7) * (o.shake ? 6 : 1.5) * .01;
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(wob);
  c.beginPath(); c.moveTo(-110, 0); c.bezierCurveTo(-130, -80, -90, -150, -50, -160); c.lineTo(50, -160); c.bezierCurveTo(90, -150, 130, -80, 110, 0); c.closePath(); fillStroke(c, '#c9a36b', 7);
  c.save(); c.clip(); c.fillStyle = '#b08850'; for (let i = 0; i < 6; i++) { c.fillRect(-120, -140 + i * 26, 240, 4); } c.restore();
  c.beginPath(); c.moveTo(-110, 0); c.bezierCurveTo(-130, -80, -90, -150, -50, -160); c.lineTo(50, -160); c.bezierCurveTo(90, -150, 130, -80, 110, 0); c.closePath(); fillStroke(c, null, 7);
  ell(c, 0, -160, 58, 16); fillStroke(c, '#5a3a20', 6);
  txt('ÁLVARO', 0, -70, { size: 30, font: 'T', color: '#7a4a1a' }); txt('NO TOCAR', 0, -38, { size: 18, color: '#7a4a1a' });
  c.restore();
}
function arrowDown(x, y, s = 1, col = '#ffc933') { const c = G.ctx, b = Math.sin(G.t * 6) * 8 * s; c.save(); c.translate(x, y - b); c.scale(s, s); c.beginPath(); c.moveTo(-14, -50); c.lineTo(14, -50); c.lineTo(14, -22); c.lineTo(28, -22); c.lineTo(0, 0); c.lineTo(-28, -22); c.lineTo(-14, -22); c.closePath(); fillStroke(c, col, 5); c.restore(); }
function arrowAt(x, y, ang, s = 1, col = '#ffc933') { const c = G.ctx; c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); arrowDown(0, 0, s, col); c.restore(); }
