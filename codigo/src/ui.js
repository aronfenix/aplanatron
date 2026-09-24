const Store = {
  KEY: 'aplanatron-tema1-v3', d: null,
  load() {
    let d = null; try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { }
    this.d = Object.assign({ teams: [], settings: { music: true, low: false }, unlockAll: false }, d || {});
    this.d.settings = Object.assign({ music: true, low: false }, this.d.settings);
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { } if (typeof Accounts !== 'undefined') Accounts.scheduleSave(); },
};

const PCOL = ['#ff5c8a', '#3ec1f3'];
const DIFF = {
  tranqui: { label: 'TRANQUI', color: '#7ce05c', desc: 'Más tiempo, menos preguntas y pistas extra.' },
  normal: { label: 'NORMAL', color: '#3ec1f3', desc: 'El reto de verdad.' },
  turbo: { label: 'TURBO', color: '#ff5c8a', desc: 'Rápido y con todo el temario. Para expertos.' },
};
const DKEYS = ['tranqui', 'normal', 'turbo'];

/* ---------- contraseñas (3 palabras = 21 bits: 8 notas + modo + nivel + control) ---------- */
function pwCheck(stars, mode, diff) { return (stars.reduce((a, s, i) => a + s * (i + 3), 0) * 5 + mode * 7 + diff * 3 + 1) & 3; }
function encodePw(stars, mode, diff) {
  let bits = 0; stars.forEach((s, i) => bits |= (s & 3) << (i * 2)); bits |= (mode - 1) << 16; bits |= (diff & 3) << 17; bits |= pwCheck(stars, mode, diff) << 19;
  return [bits & 127, (bits >> 7) & 127, (bits >> 14) & 127].map(i => CLAVES[i]);
}
function decodePw(str) {
  const ws = strip(str).toUpperCase().replace(/Ñ/g, 'N').split(/[\s·,.\-]+/).filter(Boolean);
  if (ws.length !== 3) return null;
  const idx = ws.map(w => CLAVES.indexOf(w)); if (idx.some(i => i < 0)) return { bad: ws.filter((w, i) => idx[i] < 0) };
  const bits = idx[0] | (idx[1] << 7) | (idx[2] << 14);
  const stars = [0, 1, 2, 3, 4, 5, 6, 7].map(i => (bits >> (i * 2)) & 3), mode = ((bits >> 16) & 1) + 1, diff = (bits >> 17) & 3, chk = (bits >> 19) & 3;
  if (diff > 2 || pwCheck(stars, mode, diff) !== chk) return null;
  return { stars, mode, diff: DKEYS[diff] };
}
/* =====================================================================
   FONDOS PINTADOS
   ===================================================================== */
function hills(c, y, col, amp, seed, stroke = true) {
  c.beginPath(); c.moveTo(-20, H + 20); c.lineTo(-20, y);
  for (let x = -20; x <= W + 40; x += 40) c.lineTo(x, y - Math.sin(x * .006 + seed) * amp - Math.sin(x * .017 + seed * 2) * amp * .4);
  c.lineTo(W + 40, H + 20); c.closePath(); c.fillStyle = col; c.fill(); if (stroke) { c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); }
}
function skyGrad(c, a, b) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H); }
const BGS = {
  campo(c) {
    skyGrad(c, '#6fd0ff', '#d6f4ff');
    for (const [x, y, s] of [[180, 120, 1.2], [620, 80, .9], [1040, 150, 1.1]]) drawCloud(x, y, s);
    for (let i = 0; i < 7; i++) { const x = 60 + i * 200, h = 150 + (i % 3) * 60; peak(c, x, 470, h, h * .7, i % 2 ? '#b98a64' : '#c49a70', h > 200); }
    hills(c, 520, '#9be36a', 26, 1); hills(c, 620, '#7cd35a', 30, 3); hills(c, 720, '#5fbf3f', 20, 5);
  },
  cole(c) {
    c.fillStyle = '#ffe3b3'; c.fillRect(0, 0, W, H); c.fillStyle = '#f7cf8e'; c.fillRect(0, 560, W, 240);
    c.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 0; x < W; x += 80) c.fillRect(x, 0, 40, 560);
    rr(250, 80, 780, 400, 18, '#8a5a3a', INK, 7); rr(272, 100, 736, 360, 10, '#2f5a45', INK, 5);
    c.save(); c.globalAlpha = .85; txt('TEMA 1', 640, 150, { size: 52, font: 'T', color: '#f5f5f0' }); txt('Relieve · Costas · Climas · Ríos · Europa', 640, 205, { size: 28, color: '#e8f0e8', w: 500 });
    c.strokeStyle = '#f5f5f0'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 9; i++) { const x = 360 + i * 60; c.moveTo(x, 400); c.lineTo(x + 30, 330 - (i % 3) * 20); c.lineTo(x + 60, 400); } c.stroke(); c.restore();
    rr(0, 540, W, 26, 0, '#c9905a', INK, 5);
    // ventana
    rr(1070, 110, 180, 230, 10, '#bfeaff', INK, 6); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(1160, 110); c.lineTo(1160, 340); c.moveTo(1070, 225); c.lineTo(1250, 225); c.stroke();
    drawCloud(1120, 160, .5);
    // reloj
    circle(120, 150, 56, '#fff', INK, 7); c.lineWidth = 6; c.beginPath(); c.moveTo(120, 150); c.lineTo(120, 108); c.moveTo(120, 150); c.lineTo(150, 150); c.stroke();
  },
  noche(c) {
    skyGrad(c, '#1b1446', '#4a2f7a');
    c.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const x = (i * 197) % W, y = (i * 89) % 420; c.globalAlpha = .4 + (i % 5) * .12; c.fillRect(x, y, 3, 3); } c.globalAlpha = 1;
    circle(1080, 130, 60, '#fff3c4', INK, 6); circle(1100, 116, 12, '#f0dfa0'); circle(1060, 146, 8, '#f0dfa0');
    for (let i = 0; i < 8; i++) { const x = 40 + i * 180, h = 120 + (i % 3) * 70; peak(c, x, 520, h, h * .75, '#5a3f7a', h > 200); }
    hills(c, 560, '#3a2a5a', 22, 2); hills(c, 680, '#2a1f45', 26, 4);
  },
  mar(c) {
    skyGrad(c, '#ff9a6b', '#ffd79a');
    circle(640, 430, 120, '#ffe27a', null); c.globalAlpha = .4; circle(640, 430, 170, '#fff2b0'); c.globalAlpha = 1;
    const g = c.createLinearGradient(0, 430, 0, H); g.addColorStop(0, '#3a8fd8'); g.addColorStop(1, '#1d4f8a'); c.fillStyle = g; c.fillRect(0, 430, W, H - 430);
    c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 430); c.lineTo(W, 430); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; for (let y = 470; y < H; y += 50) for (let x = (y % 100); x < W; x += 110) { c.beginPath(); c.arc(x, y, 12, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    c.beginPath(); c.moveTo(0, 430); c.lineTo(0, 300); c.quadraticCurveTo(120, 280, 230, 330); c.lineTo(300, 430); c.closePath(); c.fillStyle = '#8a6a50'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  },
  tele(c) {
    c.fillStyle = '#2a2350'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#342b66' : '#2e2759'; c.beginPath(); c.moveTo(640, 300); c.lineTo(i * 120 - 80, -40); c.lineTo(i * 120 + 40, -40); c.closePath(); c.fill(); }
    rr(200, 60, 880, 440, 24, '#5f4bb6', INK, 8); rr(226, 84, 828, 392, 14, '#8fd8ff', INK, 5);
    c.save(); rrPath(c, 226, 84, 828, 392, 14); c.clip(); drawSun(360, 200, 1.2); drawCloud(560, 170, 1); drawCloud(900, 260, 1.2, '#dfe8f5'); drawWeather('lluvia', 780, 330, 1); c.restore();
    rr(0, 600, W, 200, 0, '#4a3a8a', INK, 6); rr(380, 560, 520, 120, 20, '#ff5c8a', INK, 7); txt('TELE-ÁLVARO', 640, 620, { size: 44, font: 'T', color: '#fff', outline: 8 });
    for (let i = 0; i < 11; i++) circle(250 + i * 78, 516, 9, i % 2 ? '#ffc933' : '#fff', INK, 4);
  },
  rio(c) {
    skyGrad(c, '#7fd8ff', '#e0f7ff'); drawCloud(260, 120, 1.1); drawCloud(980, 90, .9);
    for (let i = 0; i < 6; i++) { const x = 80 + i * 240, h = 170 + (i % 2) * 70; peak(c, x, 440, h, h * .7, '#b98a64', true); }
    hills(c, 480, '#9be36a', 20, 2);
    c.beginPath(); c.moveTo(520, 480); c.bezierCurveTo(560, 580, 380, 640, 300, H + 10); c.lineTo(900, H + 10); c.bezierCurveTo(820, 640, 680, 580, 700, 480); c.closePath(); c.fillStyle = '#3fa0f5'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    hills(c, 700, '#7cd35a', 12, 6, false);
  },
  europa(c) {
    skyGrad(c, '#9fd9ff', '#f0faff');
    for (const [x, y, s] of [[150, 110, 1], [520, 180, .7], [900, 90, 1.2], [1180, 220, .8]]) drawCloud(x, y, s);
    // monumentos de Europa (siluetas cartoon)
    c.fillStyle = '#9db6d8'; c.strokeStyle = INK; c.lineWidth = 5;
    c.beginPath(); c.moveTo(180, 620); c.lineTo(240, 300); c.lineTo(300, 620); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(208, 480); c.lineTo(272, 480); c.stroke();
    rr(420, 420, 120, 200, 6, '#b8c8e0', INK, 5); circle(480, 400, 40, '#b8c8e0', INK, 5); rr(470, 330, 20, 40, 4, '#b8c8e0', INK, 4);
    rr(760, 380, 60, 240, 4, '#c8b8a0', INK, 5); rr(750, 360, 80, 30, 4, '#c8b8a0', INK, 5); circle(790, 470, 20, '#fff', INK, 4);
    rr(960, 470, 220, 150, 6, '#d8c0a0', INK, 5); for (let i = 0; i < 5; i++) rr(975 + i * 42, 490, 20, 130, 3, '#efe0c8', INK, 3); c.beginPath(); c.moveTo(950, 470); c.lineTo(1070, 420); c.lineTo(1190, 470); c.closePath(); c.fillStyle = '#d8c0a0'; c.fill(); c.stroke();
    hills(c, 620, '#9be36a', 14, 2); hills(c, 720, '#7cd35a', 18, 4);
  },
  volcan(c) {
    skyGrad(c, '#ff7a59', '#ffd08a');
    c.fillStyle = 'rgba(255,255,255,.4)'; for (const [x, y] of [[200, 120], [980, 160]]) drawCloud(x, y, 1, '#ffe8d8');
    const g = c.createLinearGradient(0, 560, 0, H); g.addColorStop(0, '#2f7fd0'); g.addColorStop(1, '#1d4f8a'); c.fillStyle = g; c.fillRect(0, 560, W, H - 560);
    c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 560); c.lineTo(W, 560); c.stroke();
  },
  guarida(c) {
    skyGrad(c, '#241a45', '#4b2a6e');
    for (let i = 0; i < 6; i++) rr(40 + i * 210, 80, 150, 520, 16, '#35265f', INK, 5);
    for (let i = 0; i < 6; i++) { c.fillStyle = '#ffc933'; c.globalAlpha = .6; circle(115 + i * 210, 160, 22, '#ffc933'); c.globalAlpha = 1; }
    rr(0, 600, W, 200, 0, '#2a1d4a', INK, 6);
    c.fillStyle = '#ff4b6b'; c.globalAlpha = .18; c.beginPath(); c.moveTo(640, 0); c.lineTo(300, 800); c.lineTo(980, 800); c.closePath(); c.fill(); c.globalAlpha = 1;
  },
  titulo(c) {
    skyGrad(c, '#5ac8ff', '#c8efff');
    circle(1120, 110, 70, '#ffe27a', INK, 6);
    for (const [x, y, s] of [[160, 110, 1.1], [520, 70, .8], [860, 150, 1]]) drawCloud(x, y, s);
    hills(c, 560, '#b6ea88', 18, 1);
    hills(c, 650, '#8fdc5e', 22, 3); hills(c, 740, '#6cc948', 18, 6);
  },
};
function bg(name) { blit('bg:' + name, 0, 0, W, H, c => (BGS[name] || BGS.campo)(c)); }
/* =====================================================================
   PIEZAS DE INTERFAZ
   ===================================================================== */
function chip(text, x, y, bgc, fg = '#fff', size = 24, align = 'center', o = {}) {
  const w = tw_(text, size, o.font || 'B') + size * 1.3, h = size * 1.75; const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  rr(x0 + 3, y - h / 2 + 5, w, h, h / 2, 'rgba(20,10,40,.28)'); rr(x0, y - h / 2, w, h, h / 2, bgc, INK, 5);
  txt(text, x0 + w / 2, y + 1, { size, color: fg, outline: fg === '#fff' ? 5 : 0, font: o.font || 'B' }); return w;
}
function bubble(text, x, y, w, o = {}) {
  const size = o.size || 26, lines = wrap(text, w - 44, size), lh = size * 1.22, h = lines.length * lh + 30;
  const c = G.ctx, by = o.below ? y : y - h;
  rr(x + 5, by + 7, w, h, 22, 'rgba(20,10,40,.25)');
  if (o.tail !== false) { const tx = o.tailX ?? x + 50; c.beginPath(); if (o.below) { c.moveTo(tx - 16, by + 4); c.lineTo(tx + (o.tailDx || 0), by - 26); c.lineTo(tx + 16, by + 4); } else { c.moveTo(tx - 16, by + h - 4); c.lineTo(tx + (o.tailDx || 0), by + h + 26); c.lineTo(tx + 16, by + h - 4); } c.closePath(); fillStroke(c, o.bg || '#fff', 5); }
  rr(x, by, w, h, 22, o.bg || '#fff', INK, 5);
  if (o.tail !== false) { const tx = o.tailX ?? x + 50; c.fillStyle = o.bg || '#fff'; c.fillRect(tx - 12, o.below ? by - 2 : by + h - 8, 24, 10); }
  lines.forEach((l, i) => txt(l, x + 22, by + 16 + lh * (i + .5), { size, align: 'left', color: o.color || INK, w: o.w || 700 }));
  return h;
}
function turnChip(i, x = W / 2, y = 108) { const n = Game.name(i); chip('Le toca a ' + n, x, y, PCOL[i % 2], '#fff', 26); }
function soundBtn(x, y) {
  return new Btn({ x, y, w: 78, h: 78, color: '#a66cff', label: '', icon: (cx, cy) => {
    const c = G.ctx, on = Sound.st.music;
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 20, cy - 8); c.lineTo(cx - 8, cy - 8); c.lineTo(cx + 6, cy - 20); c.lineTo(cx + 6, cy + 20); c.lineTo(cx - 8, cy + 8); c.lineTo(cx - 20, cy + 8); c.closePath(); c.fill(); c.stroke();
    if (on) { c.lineWidth = 4; c.strokeStyle = '#fff'; c.beginPath(); c.arc(cx + 8, cy, 12, -.8, .8); c.stroke(); c.beginPath(); c.arc(cx + 8, cy, 20, -.8, .8); c.stroke(); }
    else { c.lineWidth = 6; c.strokeStyle = '#ff4b4b'; c.beginPath(); c.moveTo(cx + 12, cy - 10); c.lineTo(cx + 26, cy + 10); c.moveTo(cx + 26, cy - 10); c.lineTo(cx + 12, cy + 10); c.stroke(); }
  }, onTap: () => { const v = !Sound.st.music; Sound.setMusic(v); Sound.setSfx(v); Store.d.settings.music = v; Store.save(); } });
}
function backBtn(onTap, x = 24, y = 20, label = 'VOLVER') { return new Btn({ x, y, w: 170, h: 74, label, size: 26, color: '#8c85b0', onTap, key: ['Escape'] }); }
/* ---------- teclado en pantalla ---------- */
class Keyboard {
  constructor(sc, o = {}) {
    this.sc = sc; this.o = o; this.val = o.val || ''; this.max = o.max || 24; this.shift = !!o.upper; this.caps = !!o.upperOnly;
    const rows = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
    const kw = 98, kh = 78, gap = 9, y0 = o.y ?? 400, x0 = (W - (10 * kw + 9 * gap)) / 2;
    this.keys = [];
    rows.forEach((r, ri) => {
      const off = ri === 2 ? (kw + gap) * 1.5 : 0;
      [...r].forEach((ch, i) => { const b = new Btn({ x: x0 + off + i * (kw + gap), y: y0 + ri * (kh + gap), w: kw, h: kh, color: '#fff8ea', tc: INK, size: 38, f: 'B', ch, r: 16, onTap: () => this.type(this.shift || this.caps ? ch.toUpperCase() : ch) }); this.keys.push(b); sc.btns.push(b); });
    });
    const y3 = y0 + 3 * (kh + gap);
    this.del = new Btn({ x: x0 + 8.5 * (kw + gap), y: y0 + 2 * (kh + gap), w: kw * 1.5 + gap, h: kh, color: '#ff8a3d', label: '⌫', size: 34, f: 'B', r: 16, onTap: () => { this.val = this.val.slice(0, -1); } });
    sc.btns.push(this.del);
    if (!this.caps) { this.sh = new Btn({ x: x0, y: y0 + 2 * (kh + gap), w: kw * 1.5, h: kh, color: '#a66cff', label: 'MAYÚS', size: 22, r: 16, onTap: () => { this.shift = !this.shift; } }); sc.btns.push(this.sh); }
    let x = x0;
    if (o.accents) { ['á', 'é', 'í', 'ó', 'ú'].forEach((ch, i) => { const b = new Btn({ x: x + i * (kw * .72 + gap), y: y3, w: kw * .72, h: kh, color: '#ffe7b8', tc: INK, size: 34, f: 'B', ch, r: 16, onTap: () => this.type(this.shift ? ch.toUpperCase() : ch) }); this.keys.push(b); sc.btns.push(b); }); x += 5 * (kw * .72 + gap); }
    const okW = 230, spW = x0 + 10 * kw + 9 * gap - okW - gap - x;
    this.space = new Btn({ x, y: y3, w: spW, h: kh, color: '#fff8ea', tc: INK, label: 'espacio', size: 26, f: 'B', r: 16, onTap: () => this.type(' ') });
    this.ok = new Btn({ x: x + spW + gap, y: y3, w: okW, h: kh, color: '#7ce05c', label: o.okLabel || 'OK', size: 32, r: 16, onTap: () => o.onOk && o.onOk(this.val) });
    sc.btns.push(this.space, this.ok);
    this.all = [...this.keys, this.del, this.space, this.ok, this.sh].filter(Boolean);
  }
  type(ch) { if (this.val.length >= this.max) return; if (ch === ' ' && (!this.val || this.val.endsWith(' '))) return; this.val += ch; if (this.shift && !this.caps) this.shift = false; if (this.o.autoCap && ch === ' ') this.shift = true; }
  key(e) {
    if (e.key === 'Backspace') { this.val = this.val.slice(0, -1); return true; }
    if (e.key === 'Enter') { this.o.onOk && this.o.onOk(this.val); return true; }
    if (e.key.length === 1 && /[\p{L} ]/u.test(e.key)) { this.type(this.caps ? e.key.toUpperCase() : e.key); return true; }
    return false;
  }
  show(v) { this.all.forEach(b => b.vis = v); }
  drawField(x, y, w, h, o = {}) {
    panel(x, y, w, h, '#fff', { r: 20 });
    const s = this.val, size = fitSize(s || 'M', w - 60, o.size || 52);
    txt(s || (o.ph || ''), x + w / 2, y + h / 2 + 2, { size, color: s ? INK : '#b9ab9a' });
    if (Math.floor(G.t * 2) % 2 === 0) { const tw = s ? tw_(s, size) : 0; rr(x + w / 2 + tw / 2 + 5, y + h / 2 - size * .45, 5, size * .9, 2, '#ff5c8a'); }
    for (const b of this.keys) if (b.ch) b.label = (this.shift || this.caps) ? b.ch.toUpperCase() : b.ch;
  }
}
