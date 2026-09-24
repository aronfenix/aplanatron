'use strict';
/* =====================================================================
   PRUEBA 2 · LA GRAN CARRERA (relieve)
   Corredor de perfil: se cruza España de norte a sur y del centro a
   Francia. Antes de cada forma del relieve hay tres puertas a distinta
   altura; al pasar por la buena, la montaña se levanta delante.
   ===================================================================== */
const CARRERA = [
  { name: 'TRAMO 1 · DE NORTE A SUR', route: [[43.5, -4.1], [40.4, -3.9], [36.75, -3.6], [28.27, -16.6]], end: 9100,
    forms: [
      { id: 'cantabrica', type: 'mount', x0: 850, x1: 1550, H: 330, peaks: 3, col: '#b8784c', label: 'Cordillera Cantábrica' },
      { id: 'meseta', type: 'plateau', x0: 1700, x1: 5000, H: 130, ramp: 220, col: '#d9a860', label: 'Meseta Central', signX: 2300 },
      { id: 'central', type: 'mount', x0: 2900, x1: 3550, H: 300, peaks: 2, col: '#c4865a', label: 'Sistema Central' },
      { id: 'beticos', type: 'mount', x0: 5750, x1: 6450, H: 360, peaks: 3, col: '#bf8254', label: 'Sistemas Béticos' },
      { id: 'isla', type: 'plateau', x0: 8150, x1: 8950, H: 30, ramp: 60, fixed: true },
      { id: 'teide', type: 'volcano', x0: 8350, x1: 8850, H: 430, col: '#c87a4c', label: 'El Teide' },
    ],
    seas: [[-900, 120, 'Mar Cantábrico'], [6650, 8200, 'Mar Mediterráneo · rumbo a Canarias']],
    gates: [
      { x: 520, form: 'cantabrica', q: 'Pegadas al mar Cantábrico, en el norte:', a: 'Cordillera Cantábrica', b: ['Sistemas Béticos', 'Sistema Ibérico'] },
      { x: 1420, form: 'meseta', q: 'Una llanura alta y enorme en el centro:', a: 'Meseta Central', b: ['Depresión del Ebro', 'Península Ibérica'] },
      { x: 2550, form: 'central', q: 'Montañas que parten la Meseta en dos:', a: 'Sistema Central', b: ['Pirineos', 'Cordillera Cantábrica'] },
      { x: 5350, form: 'beticos', q: 'Montañas del sur, en Andalucía:', a: 'Sistemas Béticos', b: ['Sistema Central', 'Sistema Ibérico'] },
      { x: 7750, form: 'teide', q: 'En Canarias, el pico más alto de España:', a: 'El Teide', b: ['Los Pirineos', 'El Sistema Central'] },
    ] },
  { name: 'TRAMO 2 · DEL CENTRO A FRANCIA', route: [[40.4, -3.7], [41.2, -1.9], [41.7, -0.5], [42.7, 0.6], [43.6, 1.4]], end: 5500,
    forms: [
      { id: 'mesetaBase', type: 'plateau', x0: -1200, x1: 2150, H: 130, ramp: 240, fixed: true },
      { id: 'iberico', type: 'mount', x0: 800, x1: 1650, H: 290, peaks: 3, col: '#c98c5a', label: 'Sistema Ibérico', base: 130 },
      { id: 'relleno', type: 'plateau', x0: 1900, x1: 3500, H: 125, ramp: 120, invert: 'depresion' },
      { id: 'depresion', type: 'low', x0: 2050, x1: 3350, col: '#7cc95a', label: 'Depresión del Ebro' },
      { id: 'pirineos', type: 'mount', x0: 3350, x1: 4250, H: 420, peaks: 4, col: '#bb7f52', label: 'Pirineos' },
      { id: 'francia', type: 'plateau', x0: 4150, x1: 6500, H: 50, ramp: 200, fixed: true },
    ],
    seas: [],
    gates: [
      { x: 420, form: 'iberico', q: 'Bordean la Meseta por el este:', a: 'Sistema Ibérico', b: ['Sistema Central', 'Sistemas Béticos'] },
      { x: 1780, form: 'depresion', q: 'Zona baja por la que pasa el río Ebro:', a: 'Depresión del Ebro', b: ['Meseta Central', 'Golfo de Cádiz'] },
      { x: 3000, form: 'pirineos', q: 'La frontera natural con Francia:', a: 'Pirineos', b: ['Cordillera Cantábrica', 'Sistemas Béticos'] },
    ] },
];
const RUN = { g: 2600, v: 920, base: 640 };
class GameCarrera extends Mini {
  constructor() { super(1); }
  howto() {
    return { title: 'La gran carrera', lines: ['El Aplanatrón ha dejado España lisa. Cruzadla corriendo: de norte a sur y del centro hasta Francia.', 'Antes de cada montaña hay tres puertas: una en el suelo, otra a un salto y otra a dos saltos.', 'Toca la pantalla para saltar (y otra vez en el aire para el doble salto). Pasa por la puerta buena y la montaña se levantará.', 'Salta las miniaplanadoras y coge las hojas de examen.'],
      pic: (c, x, y) => { c.fillStyle = '#7cc95a'; c.fillRect(x - 200, y + 80, 400, 30); drawDoorStack(x + 110, y + 80, ['Cordillera', '¿?', '¿?'], '#ff5c8a', 1, .7); drawKid(x - 90, y + 80, 1.3, { av: Game.team.avs[0], walk: true, dir: 1 }); } };
  }
  setup() {
    this.two = Game.team.names.length > 1; this.tr = 0; this.q = 0; this.back = 0;
    this.speed = Game.d(175, 215, 265); this.camH = 0;
    this.mini = new MapES({ x: 1086, y: 96, s: .17, key: 'runmini', layers: { countries: false } });
    this.btns.push(...[0, 1].slice(0, this.two ? 2 : 1).map(i => new Btn({ x: this.two ? (i ? W - 190 : 20) : W - 200, y: H - 150, w: 170, h: 130, color: PCOL[i], label: '¡SALTA!', size: 30, r: 30, key: this.two ? (i ? ['ArrowUp', 'Enter'] : ['w', ' ']) : [' ', 'ArrowUp', 'w', 'Enter'], onTap: () => this.jump(i) })));
    this.prog = () => [this.q, 8];
    this.loadTramo(0);
  }
  start() { this.showBanner(CARRERA[0].name, 'Del mar Cantábrico… ¡hasta Canarias!', 1.8, '#c98c5a'); this.countdown(); }
  countdown() { this.running = false; this.cd = 3; Sound.sfx('count'); const tick = () => { this.cd--; if (this.cd > 0) { Sound.sfx('count'); later(.8, tick); } else { Sound.sfx('go'); this.cd = 0; this.running = true; } }; later(.8, tick); }
  loadTramo(i) {
    const T = CARRERA[i]; this.T = T; this.tr = i;
    this.forms = T.forms.map(f => ({ ...f, r: f.fixed ? 1 : 0 }));
    this.gates = T.gates.map((g, k) => ({ ...g, opts: shuffle([g.a, ...g.b]), owner: this.two ? (this.q + k) % 2 : 0, done: false }));
    this.x = -650; this.french = false; this.runners = (this.two ? [0, 1] : [0]).map(i => ({ i, dx: this.two ? (i ? -70 : 10) : 0, y: 0, vy: 0, air: false, jumps: 0, hurt: 0 }));
    this.enemies = []; this.sheets = []; this.signs = [];
    // hojas de examen y miniaplanadoras entre puertas
    for (let x = 300; x < T.end - 300; x += rnd(420, 700)) { if (i === 1 && x > 4150) continue; if (this.gates.some(g => Math.abs(g.x - x) < 380) || this.inSea(x)) continue; if (Math.random() < Game.d(.25, .4, .55)) this.enemies.push({ x, vx: -rnd(60, 110), dead: false }); else this.sheets.push({ x, h: rnd(60, 230), got: false }); }
    for (const r of this.runners) r.y = this.ground(r.dx);
  }
  inSea(x) { return this.T.seas.find(s => x > s[0] && x < s[1]); }
  form(id) { return this.forms.find(f => f.id === id); }
  ground(x) {
    if (this.inSea(x)) return -8;
    let h = 0;
    for (const f of this.forms) {
      if (x < f.x0 - 5 || x > f.x1 + 5) continue;
      const r = f.invert ? 1 - (this.form(f.invert).r) : f.r; if (r <= 0) continue;
      if (f.type === 'plateau') { const ss = k => k * k * (3 - 2 * k); const k1 = clamp((x - f.x0) / f.ramp, 0, 1), k2 = clamp((f.x1 - x) / f.ramp, 0, 1); h += f.H * r * ss(k1) * ss(k2); }
      else if (f.type === 'mount') { const u = clamp((x - f.x0) / (f.x1 - f.x0), 0, 1); const env = Math.pow(Math.sin(Math.PI * u), 1.3); h += f.H * r * env * (.72 + .28 * Math.abs(Math.sin(u * Math.PI * f.peaks))); }
      else if (f.type === 'volcano') { const u = clamp((x - f.x0) / (f.x1 - f.x0), 0, 1); let e = Math.pow(Math.sin(Math.PI * u), .9); if (u > .44 && u < .56) e -= .06; h += f.H * r * e; }
    }
    return h;
  }
  jump(i) {
    if (!this.running || this.done || this.hint) return; const r = this.runners[i] || this.runners[0];
    if (!r.air) { r.vy = -RUN.v; r.air = true; r.jumps = 1; Sound.sfx('boing'); }
    else if (r.jumps < 2) { r.vy = -RUN.v * .95; r.jumps = 2; Sound.sfx('plop'); puff(...this.scr(this.x + r.dx, r.y), { n: 4, c: '#fff' }); }
  }
  onDown(p) { if (p.y < 90) return; this.jump(this.two ? (p.x < W / 2 ? 0 : 1) : 0); }
  scr(wx, h) { return [wx - this.x + 330, RUN.base - h + this.camH]; }
  nextGate() { return this.gates.find(g => !g.done); }
  play(dt) {
    if (!this.running) return;
    const g = this.nextGate(), near = g && g.x - this.x < 700 && g.x - this.x > -40;
    const slow = near ? Game.d(.45, .55, .7) : 1; this.slow = lerp(this.slow ?? 1, slow, Math.min(1, dt * 4));
    const sdt = dt * this.slow;
    const lookH = Math.max(this.ground(this.x + 120), this.ground(this.x + 420)); this.camH = lerp(this.camH, Math.max(0, lookH - 60), Math.min(1, dt * 2.5)); if (!Number.isFinite(this.camH)) this.camH = 0;
    if (this.tr === 1 && this.x > 4250 && !this.french) { this.french = true; Sound.play('europa', { fade: 1 }); this.showBanner('¡BIENVENUE EN FRANCE!', 'Has cruzado los Pirineos: ¡ya estás en Francia!', 1.8, '#3e5fd0'); }
    this.x += this.speed * sdt;
    for (const r of this.runners) {
      const wx = this.x + r.dx, gy = this.ground(wx);
      if (r.hurt > 0) r.hurt -= dt;
      if (r.air) { r.vy += RUN.g * sdt; r.y -= r.vy * sdt; if (r.y <= gy && r.vy > 0) { r.y = gy; r.air = false; r.jumps = 0; r.vy = 0; } }
      else r.y = gy;
      if (r.y < gy) { r.y = gy; if (r.vy > 0) { r.air = false; r.jumps = 0; r.vy = 0; } }
      // hojas y enemigos
      for (const s of this.sheets) if (!s.got && Math.abs(s.x - wx) < 40 && Math.abs(r.y + 45 - (this.ground(s.x) + s.h)) < 60) { s.got = true; this.score += 20; this.back++; Sound.sfx('sparkle'); pop(...this.scr(s.x, this.ground(s.x) + s.h + 30), '+1 pregunta', '#ffc933', 26); }
      for (const e of this.enemies) if (!e.dead && Math.abs(e.x - wx) < 38 && r.y - this.ground(e.x) < 45 && r.hurt <= 0) { r.hurt = 1.2; this.score = Math.max(0, this.score - 30); Sound.sfx('stomp'); shake(8, .25); this.alvSay('gloat'); }
    }
    for (const e of this.enemies) { e.x += e.vx * sdt; }
    // puertas
    for (const gt of this.gates) if (!gt.done) {
      const r = this.runners.find(r => r.i === gt.owner) || this.runners[0];
      if (this.x + r.dx >= gt.x) this.cross(gt, r);
    }
    // formas que se levantan
    for (const f of this.forms) if (f.rising) { f.r = Math.min(1, f.r + dt * .9); if (f.r >= 1) f.rising = false; }
    // final del tramo
    if (this.x > this.T.end && !this.ending) { this.ending = true; this.tramoEnd(); }
  }
  doorOf(r, gt) { const h = r.y + 45 - this.ground(gt.x); return h < 105 ? 0 : h < 245 ? 1 : 2; }
  cross(gt, r) {
    gt.done = true; const k = this.doorOf(r, gt), pick = gt.opts[k], ok = pick === gt.a; gt.pick = k; gt.ok = ok; this.q++;
    const [sx, sy] = this.scr(gt.x, this.ground(gt.x) + [55, 190, 330][k]);
    const f = this.form(gt.form); f.rising = true; Sound.sfx('rumble'); later(.2, () => Sound.sfx('rise'));
    if (ok) { this.good(sx, sy, 'rel_' + gt.form); this.showBanner(f.label.toUpperCase(), '¡Se levanta!', 1.3, f.col); }
    else { this.bad(sx, sy, 'rel_' + gt.form, null, gt.a + ': ' + gt.q.replace(/…$/, '.')); this.showBanner('¡Era: ' + gt.a + '!', 'Has pasado por «' + pick + '»', 1.8, '#ff4b4b'); }
    this.signs.push({ x: f.signX || (f.x0 + f.x1) / 2, label: f.label, col: f.col, ok });
    if (this.two) this.turn = 1 - gt.owner;
  }
  tramoEnd() {
    Sound.sfx('fanfare'); confetti(60);
    if (this.tr === 0) { this.showBanner('¡TRAMO 1 CONSEGUIDO!', 'Ahora, del centro a Francia', 2.2, '#7ce05c'); this.running = false; later(2.4, () => { flash('#fff', .4); this.loadTramo(1); this.ending = false; this.showBanner(CARRERA[1].name, 'De Madrid hasta la frontera', 1.8, '#c98c5a'); this.countdown(); }); }
    else { this.running = false; this.showBanner('¡FRANCIA!', 'Los Pirineos: frontera natural', 2, '#7ce05c'); this.finish({ delay: 2.2 }); }
  }
  render(c) {
    const B = RUN.base + this.camH;
    // cielo y fondo
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6fd0ff'); g.addColorStop(1, '#d9f3ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    drawSun(1150, 110, .8); for (let i = 0; i < 4; i++) drawCloud(((i * 420 - this.x * .12) % 1700 + 1700) % 1700 - 200, 140 + (i % 2) * 70, .7 + (i % 3) * .15);
    c.fillStyle = '#b9dcef'; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 20) c.lineTo(x, 520 - 60 * Math.abs(Math.sin((x + this.x * .25) / 260))); c.lineTo(W, H); c.closePath(); c.fill();
    // mar
    for (const s of this.T.seas) { const [x0] = this.scr(s[0], 0), [x1] = this.scr(s[1], 0); if (x1 < 0 || x0 > W) continue; c.fillStyle = '#3ea5e6'; c.fillRect(x0, B + 4, x1 - x0, H); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; for (let x = Math.max(x0, -40); x < Math.min(x1, W + 40); x += 70) { c.beginPath(); c.arc(x + (G.t * 30) % 70, B + 20, 12, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } txt(s[2], clamp((x0 + x1) / 2, x0 + 200, x1 - 200), B + 90, { size: 30, font: 'T', color: 'rgba(255,255,255,.85)' }); }
    // terreno
    const pts = []; for (let sx = -10; sx <= W + 10; sx += 8) { const wx = this.x + sx - 330; if (this.inSea(wx)) { pts.push(null); continue; } pts.push([sx, B - this.ground(wx)]); }
    const runs = []; let cur = []; for (const p of pts) { if (p) cur.push(p); else if (cur.length) { runs.push(cur); cur = []; } } if (cur.length) runs.push(cur);
    for (const run of runs) {
      c.beginPath(); c.moveTo(run[0][0], H); for (const p of run) c.lineTo(p[0], p[1]); c.lineTo(run[run.length - 1][0], H); c.closePath();
      const gg = c.createLinearGradient(0, 150, 0, H); gg.addColorStop(0, '#b98a5e'); gg.addColorStop(.55, '#d8b27a'); gg.addColorStop(.72, '#8fd46a'); gg.addColorStop(1, '#6cc948'); c.fillStyle = gg; c.fill();
      c.lineWidth = 6; c.strokeStyle = INK; c.lineJoin = 'round'; c.beginPath(); run.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      // nieve en las cumbres
      c.save(); c.beginPath(); c.moveTo(run[0][0], H); for (const p of run) c.lineTo(p[0], p[1]); c.lineTo(run[run.length - 1][0], H); c.closePath(); c.clip(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10, B - 330); for (const p of run) c.lineTo(p[0], Math.min(p[1] + 34, B - 330 + Math.sin(p[0] * .08) * 6)); c.lineTo(W + 10, B - 330); c.lineTo(W + 10, 0); c.lineTo(-10, 0); c.closePath(); c.fill(); c.restore();
    }
    // árboles y casitas
    for (let wx = Math.floor((this.x - 400) / 170) * 170; wx < this.x + W; wx += 170) { if (this.inSea(wx) || this.gates.some(g => Math.abs(g.x - wx) < 120)) continue; const h = this.ground(wx), [x, y] = this.scr(wx, h), kind = (wx * 7919) % 5;
      if (h > 250) { c.beginPath(); c.moveTo(x, y - 46); c.lineTo(x - 14, y + 2); c.lineTo(x + 14, y + 2); c.closePath(); fillStroke(c, '#2f7a4a', 3); }
      else if (kind < 3) { rr(x - 3, y - 20, 6, 22, 2, '#8a5a3a', INK, 2); circle(x, y - 30, 16, h > 100 ? '#9bb35a' : '#5fae3c', INK, 3); }
      else if (kind === 3) { rr(x - 16, y - 24, 32, 24, 3, '#fff3dc', INK, 3); c.beginPath(); c.moveTo(x - 20, y - 22); c.lineTo(x, y - 40); c.lineTo(x + 20, y - 22); c.closePath(); fillStroke(c, '#e0634a', 3); } }
    // depresión del Ebro: el río
    const dp = this.form('depresion'); if (dp && dp.r > .5) { const [a] = this.scr(dp.x0 + 150, 0), [b] = this.scr(dp.x1 - 150, 0); if (b > 0 && a < W) { c.lineWidth = 14; c.strokeStyle = '#3fa0f5'; c.lineCap = 'round'; c.beginPath(); c.moveTo(a, B - this.ground(dp.x0 + 150) - 4); c.lineTo(b, B - this.ground(dp.x1 - 150) - 4); c.stroke(); txt('Río Ebro', (a + b) / 2, B - 30, { size: 22, color: '#fff', outline: 5 }); } }
    // carteles de las formas levantadas
    for (const s of this.signs) { const [x, y] = this.scr(s.x, this.ground(s.x)); if (x > -200 && x < W + 200) drawSign(x, y - 8, s.label, { size: 20, col: s.ok ? '#fff' : '#ffe0e0' }); }
    // Francia
    if (this.tr === 1) { const [fx, fy] = this.scr(4260, this.ground(4260)); if (fx > -300 && fx < W + 300) { drawSign(fx, fy, 'FRANCIA', { size: 26 }); drawTricolor(fx + 60, fy, 1); }
      // un pueblecito francés
      const [ex, ey] = this.scr(5200, this.ground(5200)); if (ex > -300 && ex < W + 400) drawEiffel(ex + 150, ey, .9);
      FRENCH.forEach((f, k) => { const wx = 4450 + k * 190, [x, y] = this.scr(wx, this.ground(wx)); if (x < -120 || x > W + 120) return; drawFrench(x, y, 1.15, k, f); if (Math.abs(wx - this.x) < 520) bubble(f.say, x - 70, y - 190, 150, { size: 20, tailX: x - 10 }); }); }
    // meta
    const [mx, my] = this.scr(this.T.end, this.ground(this.T.end)); if (mx < W + 100) { rr(mx - 4, my - 150, 8, 150, 3, '#8a5a3a', INK, 3); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) c.fillRect(mx + 4 + i * 16, my - 150 + j * 16, 16, 16), c.fillStyle = (i + j) % 2 ? INK : '#fff'; }
    // hojas y enemigos
    for (const s of this.sheets) if (!s.got) { const [x, y] = this.scr(s.x, this.ground(s.x) + s.h); if (x > -50 && x < W + 50) drawSheet(x, y + Math.sin(G.t * 3 + s.x) * 6); }
    for (const e of this.enemies) { const [x, y] = this.scr(e.x, this.ground(e.x)); if (x > -60 && x < W + 60) drawPlanchita(x, y, 1.2, { dir: -1 }); }
    // puertas
    for (const gt of this.gates) { const [x, y] = this.scr(gt.x, this.ground(gt.x)); if (x < -150 || x > W + 150) continue; drawDoorStack(x, y, gt.opts, PCOL[gt.owner], gt.done ? .35 : 1, 1, gt.done ? gt.pick : -1, gt.ok); }
    // corredores
    for (const r of this.runners) { const [x, y] = this.scr(this.x + r.dx, r.y); const sea = this.inSea(this.x + r.dx);
      if (r.hurt > 0 && Math.floor(G.t * 12) % 2) c.globalAlpha = .4;
      if (sea) drawKidBoat(x, y + 6, 1.3, { av: Game.team.avs[r.i], dir: 1, hull: PCOL[r.i] }); else drawKid(x, y, 1.3, { av: Game.team.avs[r.i], dir: 1, walk: !r.air, ph: r.i });
      c.globalAlpha = 1; if (this.two) chip(Game.name(r.i), x, y + 22, PCOL[r.i], '#fff', 15); }
    // pregunta de la puerta que viene
    const gt = this.nextGate(); if (gt && gt.x - this.x < 1100) { const tw0 = Math.min(740, tw_(gt.q, 30) + 60); panel(20, 92, tw0, this.two ? 104 : 76, '#fff8ea', { r: 22 }); if (this.two) chip('Puerta de ' + Game.name(gt.owner), 44, 116, PCOL[gt.owner], '#fff', 17, 'left'); txt(gt.q, 44, this.two ? 162 : 131, { size: fitSize(gt.q, tw0 - 50, 30), align: 'left', color: INK, w: 700 }); }
    if (this.cd > 0) { c.save(); const k = 1 + (G.t % .8) * .3; c.translate(640, 330); c.scale(k, k); txt(String(this.cd), 0, 0, { size: 150, font: 'T', color: '#ffc933', outline: 16 }); c.restore(); }
    // minimapa del recorrido
    c.save(); rrPath(c, 1080, 90, 184, 150, 14); c.clip(); c.fillStyle = '#3ea5e6'; c.fillRect(1080, 90, 184, 150); this.mini.drawBase(); c.restore(); c.lineWidth = 4; c.strokeStyle = INK; rrPath(c, 1080, 90, 184, 150, 14); c.stroke();
    const rt = this.T.route.map(([la, lo]) => { if (la < 30) return this.mini.cpt('teide'); const [mx2, my2] = PROJ.es(la, lo); return this.mini.P(mx2, my2); });
    c.setLineDash([5, 6]); c.lineWidth = 4; c.strokeStyle = '#ff5c8a'; c.beginPath(); rt.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke(); c.setLineDash([]);
    const k = clamp(this.x / this.T.end, 0, 1) * (rt.length - 1), i0 = Math.min(rt.length - 2, Math.floor(k)); const px = lerp(rt[i0][0], rt[i0 + 1][0], k - i0), py = lerp(rt[i0][1], rt[i0 + 1][1], k - i0); circle(px, py, 8, '#ffc933', INK, 3);
    chip(this.T.name, 1172, 256, '#c98c5a', '#fff', 14);
    chip('Preguntas devueltas al examen: ' + this.back, 640, H - 30, '#ffc933', INK, 18);
  }
}
function drawDoorStack(x, y, opts, col, alpha = 1, s = 1, picked = -1, ok = false) {
  const c = G.ctx; c.save(); c.globalAlpha = alpha; c.translate(x, y); c.scale(s, s);
  const hs = [55, 190, 330], labels = ['sin saltar', '1 salto', '2 saltos'];
  c.lineWidth = 10; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -400); c.stroke(); c.lineWidth = 5; c.strokeStyle = '#8a5a3a'; c.stroke();
  opts.forEach((o, k) => { const cy = -hs[k]; const w = 190, h = 92; const fill = picked === k ? (ok ? '#7ce05c' : '#ff4b4b') : '#fff8ea';
    rr(-w / 2, cy - h / 2, w, h, 20, fill, col, 7); txt(o, 0, cy - 8, { size: fitSize(o, w - 20, 22), color: INK }); txt(labels[k], 0, cy + 26, { size: 15, color: '#8c85b0' }); });
  c.restore();
}
function drawSheet(x, y) { const c = G.ctx; c.save(); c.translate(x, y); c.rotate(Math.sin(G.t * 2 + x) * .2); rr(-18, -24, 36, 48, 4, '#fff', INK, 3); c.strokeStyle = '#aab5ca'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-11, -13 + k * 9); c.lineTo(11, -13 + k * 9); c.stroke(); } txt('?', 8, 14, { size: 16, font: 'T', color: '#ff4b4b' }); c.restore(); }

const FRENCH = [{ say: '¡Bonjour!', flag: true }, { say: '¡Oh là là!', bag: true }, { say: 'Croissant?', cafe: true }, { say: '¡Bienvenue!', flag: true, bag: true }, { say: '¡Magnifique!', acc: true }];
function drawTricolor(x, y, s = 1) { const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s); rr(-3, -110, 6, 110, 3, '#8a5a3a', INK, 3); const w = Math.sin(G.t * 5) * 3; [['#3e5fd0', 0], ['#fff', 22], ['#ff4b4b', 44]].forEach(([col, dx]) => { c.beginPath(); c.moveTo(3 + dx, -108 + w * dx / 44); c.lineTo(25 + dx, -108 + w * (dx + 22) / 44); c.lineTo(25 + dx, -70 + w * (dx + 22) / 44); c.lineTo(3 + dx, -70 + w * dx / 44); c.closePath(); c.fillStyle = col; c.fill(); }); c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(3, -108, 66, 38); c.restore(); }
function drawEiffel(x, y, s = 1) { const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#6b5a7a'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(-70, 0); c.quadraticCurveTo(-30, -90, -12, -260); c.lineTo(-6, -330); c.lineTo(6, -330); c.lineTo(12, -260); c.quadraticCurveTo(30, -90, 70, 0); c.lineTo(40, 0); c.quadraticCurveTo(0, -60, -40, 0); c.closePath(); c.fill(); c.stroke(); rr(-40, -120, 80, 10, 3, '#6b5a7a', INK, 3); rr(-24, -220, 48, 8, 3, '#6b5a7a', INK, 3); c.restore(); }
function drawFrench(x, y, s, k, f) {
  const c = G.ctx, t = G.t + k;
  if (f.cafe) { rr(x + 34, y - 44, 60, 8, 3, '#fff', INK, 3); rr(x + 60, y - 38, 6, 38, 2, '#6b6b7a', INK, 2); c.beginPath(); c.moveTo(x + 50, y - 50); c.quadraticCurveTo(x + 64, y - 66, x + 78, y - 50); c.closePath(); fillStroke(c, '#f2b25c', 2.5); }
  drawKid(x, y - Math.abs(Math.sin(t * 5)) * 6, s, { av: k % 6, dir: -1, look: -.3, ph: k });
  const hy = y - 100 * s - Math.abs(Math.sin(t * 5)) * 6;
  c.save(); c.translate(x - 2 * s, hy); ell(c, 0, 0, 24 * s, 9 * s); fillStroke(c, '#23233d', 3); rr(-2 * s, -12 * s, 5 * s, 8 * s, 2, '#23233d'); c.restore();
  c.strokeStyle = 'rgba(35,25,61,.55)'; c.lineWidth = 3; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x - 16 * s, y - (58 - j * 9) * s); c.lineTo(x + 16 * s, y - (58 - j * 9) * s); c.stroke(); }
  if (f.bag) { c.save(); c.translate(x - 26 * s, y - 50 * s); c.rotate(-.9 + Math.sin(t * 5) * .1); rr(-6 * s, -38 * s, 13 * s, 76 * s, 6 * s, '#e5a54a', INK, 3); c.strokeStyle = '#b87a2a'; c.lineWidth = 2; for (let j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(-4 * s, j * 12 * s); c.lineTo(4 * s, j * 12 * s - 5 * s); c.stroke(); } c.restore(); }
  if (f.flag) { c.save(); c.translate(x + 20 * s, y - 40 * s); c.rotate(Math.sin(t * 4) * .25); drawTricolor(0, 0, .6); c.restore(); }
  if (f.acc) { c.save(); c.translate(x, y - 55 * s); const sq = 1 + Math.sin(t * 6) * .25; rr(-26 * s * sq, -14 * s, 52 * s * sq, 28 * s, 5, '#ff4b4b', INK, 3); c.restore(); if (Math.sin(t * 3) > .7) txt('♪', x + 30, y - 120 * s, { size: 26, color: '#3e5fd0', outline: 4 }); }
}
GameCarrera.prototype.drawAlv = function (c) { // en la carrera, las pullas van abajo para no tapar las puertas
  const a = this.alv; if (!a) return; const age = G.t - a.t0; if (age > 2.4) { this.alv = null; return; } const k = age > 2.1 ? 1 - (age - 2.1) / .3 : a.k;
  c.save(); c.translate(0, (1 - k) * 200); c.save(); c.beginPath(); c.arc(450, 700, 50, 0, TAU); c.fillStyle = '#f3e8ff'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.clip(); drawAlvaro(450, 745, .44, { expr: a.expr, cape: false }); c.restore();
  const bw = Math.min(420, tw_(a.text, 22) + 50); bubble(a.text, 510, 676, bw, { size: 22, below: true, tail: false, bg: '#f3e8ff' }); c.restore();
};
