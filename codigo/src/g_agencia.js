'use strict';
/* =====================================================================
   PRUEBA 4 · AGENCIA DE VIAJES ROSA (climas)
   Llegan turistas con lo que buscan. Hay que arrastrar cada uno a la
   puerta de su clima antes de que se le acabe la paciencia.
   ===================================================================== */
const CLIMA_PISTAS = {
  oceanico: ['Quiero un sitio donde llueva mucho durante todo el año.', 'Ni frío ni calor: quiero temperaturas suaves todo el año.', 'Quiero pasear por bosques muy verdes y praderas.', 'Quiero ir al norte, a la costa del mar Cantábrico.', 'Quiero un sitio verde, con lluvia y sin veranos calurosos.'],
  mediterraneo: ['Quiero veranos muy calurosos y que llueva poco.', 'Busco un sitio seco, donde casi no llueva en verano.', 'Quiero ver árboles y matorrales que aguantan la sequía.', 'Quiero ir al centro, al este o al sur de España.', 'Quiero playa en verano, con mucho calor y poca lluvia.'],
  montana: ['Quiero inviernos largos y muy fríos.', 'Quiero ver mucha nieve y hacer muñecos de nieve.', 'Quiero ver bosques de árboles con forma de cono y prados de alta montaña.', 'Quiero subir a lo alto de los Pirineos.', 'Quiero veranos cortos y frescos.'],
  subtropical: ['Quiero calor todo el año, ¡también en invierno!', 'Quiero un sitio donde casi no llueva y haga calor siempre.', 'Quiero ver plantas que aguantan mucho calor y poca agua.', 'Quiero ir a las islas Canarias.', 'En Navidad quiero ir en bañador.'],
};
const CLIMA_KEYS = ['oceanico', 'mediterraneo', 'montana', 'subtropical'];
class GameAgencia extends Mini {
  constructor() { super(3); }
  howto() {
    return { title: 'Agencia de viajes Rosa', lines: ['El Aplanatrón ha revuelto los climas y los turistas no saben adónde ir.', 'Cada turista dice lo que busca. Arrástralo con el dedo hasta la puerta de su clima.', 'Si esperan demasiado, se enfadan y se van. ¡Atended a todos!', this.two ? 'Podéis arrastrar los dos a la vez.' : 'Ojo: puede colarse algún turista sospechoso…'],
      pic: (c, x, y) => { drawClimaDoor(x - 60, y - 150, 190, 250, 'mediterraneo', 1); drawKid(x - 190, y + 150, 1.5, { av: 2, dir: 1 }); c.setLineDash([6, 10]); c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 160, y + 20); c.quadraticCurveTo(x - 120, y - 80, x - 20, y - 60); c.stroke(); c.setLineDash([]); } };
  }
  setup() {
    this.two = Game.team.names.length > 1;
    this.doors = CLIMA_KEYS.map((k, j) => ({ k, x: 26 + j * 310, y: 96, w: 290, h: 300, shake: 0, glow: 0 }));
    this.total0 = Game.d(10, 13, 16); this.spawned = 0; this.served = 0; this.guests = []; this.spawnT = 1; this.drags = {};
    this.pat = Game.d(40, 30, 22); this.maxAt = Game.d(2, 3, 4); this.slots = [170, 470, 770, 1070];
    const pool = []; for (const k of CLIMA_KEYS) for (const t of shuffle(CLIMA_PISTAS[k]).slice(0, 4)) pool.push({ k, t });
    this.pool = shuffle(pool); this.spy = Game.diff !== 'tranqui' ? irnd(4, this.total0 - 3) : -1;
    this.prog = () => [this.served, this.total0];
  }
  start() { this.running = true; }
  freeSlot() { return this.slots.findIndex((sx, i) => !this.guests.some(g => g.slot === i && !g.leaving)); }
  spawn() {
    const slot = this.freeSlot(); if (slot < 0) return;
    let g;
    if (this.spawned === this.spy) g = { spy: true, t: 'Quiero un país completamente PLANO: sin montañas, sin ríos… y sin exámenes.' };
    else { const it = this.pool.pop() || { k: pick(CLIMA_KEYS), t: pick(CLIMA_PISTAS.oceanico) }; g = { k: it.k, t: it.t }; }
    Object.assign(g, { slot, x: W + 120, y: 690, hx: this.slots[slot], p: 1, av: irnd(0, AVATARS.length - 1), hat: irnd(0, 3), id: this.spawned, drag: null });
    this.spawned++; this.guests.push(g); Sound.sfx('bling');
  }
  onDown(p) {
    for (const g of this.guests.slice().reverse()) if (!g.leaving && !g.drag && Math.abs(p.x - g.x) < 70 && p.y > g.y - 170 && p.y < g.y + 20) { g.drag = { id: p.id, ox: p.x - g.x, oy: p.y - g.y }; this.drags[p.id] = g; Sound.sfx('pop'); return; }
  }
  onMove(p) { const g = this.drags[p.id]; if (g) { g.x = p.x - g.drag.ox; g.y = p.y - g.drag.oy; } for (const d of this.doors) d.glow = Object.values(this.drags).some(g => this.doorAt(g.x, g.y - 60) === d) ? 1 : 0; }
  onUp(p) {
    const g = this.drags[p.id]; if (!g) return; delete this.drags[p.id]; g.drag = null; for (const d of this.doors) d.glow = 0;
    const d = this.doorAt(g.x, g.y - 60); if (!d) return; this.send(g, d);
  }
  doorAt(x, y) { return this.doors.find(d => x > d.x && x < d.x + d.w && y > d.y && y < d.y + d.h + 60); }
  send(g, d) {
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    if (g.spy) { g.leaving = 'spy'; this.served++; this.score += 250; Sound.sfx('laugh'); shake(10, .4); this.showBanner('¡ERA ÁLVARO DISFRAZADO!', 'No existe ningún país plano. ¡Fuera de aquí!', 2, '#a66cff'); tw(g, { x: W + 300, y: -200 }, 1.4, { ease: E.inQ }); this.alvSay('hurt'); return; }
    if (d.k === g.k) { g.leaving = 'ok'; this.served++; tw(g, { x: cx, y: d.y + d.h - 20 }, .35, { done: () => tw(g, { sc: .01 }, .35) }); g.sc = 1; d.shake = .1; this.good(cx, cy, 'tur_' + g.k); pop(cx, d.y + 40, '¡Buen viaje!', '#7ce05c', 30); }
    else { d.shake = .6; g.hx = this.slots[g.slot]; tw(g, { x: g.hx, y: 690 }, .45, { ease: E.outBack }); this.bad(cx, cy, 'tur_' + g.k, 'Este turista decía: «' + g.t + '». Eso es el ' + CLIMAS[g.k].name.toLowerCase() + ': ' + CLIMAS[g.k].temp + ' ' + CLIMAS[g.k].lluvia, CLIMAS[g.k].name + ': ' + g.t.replace(/^Quiero /, ''), { title: 'Buscaba el:' }); }
  }
  play(dt) {
    if (!this.running) return;
    this.spawnT -= dt; const active = this.guests.filter(g => !g.leaving).length;
    if (this.spawned < this.total0 && (this.spawnT <= 0 || active === 0) && active < this.maxAt) { this.spawn(); this.spawnT = Game.d(8, 6, 4.5); }
    for (const g of this.guests) {
      if (!g.leaving && !g.drag) { g.x = lerp(g.x, this.slots[g.slot], Math.min(1, dt * 3)); g.y = lerp(g.y, 690, Math.min(1, dt * 6)); }
      if (!g.leaving && !g.drag) { g.p -= dt / this.pat; if (g.p <= 0) this.angry(g); }
    }
    for (const d of this.doors) d.shake = Math.max(0, d.shake - dt);
    this.guests = this.guests.filter(g => !(g.leaving && (g.sc < .05 || g.x > W + 250 || g.y < -150)));
    if (this.spawned >= this.total0 && !this.guests.some(g => !g.leaving) && !this.done && !this.hint) { this.showBanner('¡Agencia cerrada!', 'Todos los turistas atendidos', 1.6); this.finish({ delay: 1.8 }); }
  }
  angry(g) {
    g.leaving = 'angry'; this.served++; Sound.sfx('sad'); tw(g, { x: W + 250 }, 1.6, { ease: E.inQ });
    if (g.spy) return;
    this.bad(g.x, g.y - 100, 'tur_' + g.k, '¡Se ha cansado de esperar! Quería: «' + g.t + '». Eso es el ' + CLIMAS[g.k].name.toLowerCase() + '.', CLIMAS[g.k].name + ': ' + g.t.replace(/^Quiero /, ''), { title: 'Buscaba el:' });
  }
  render(c) {
    // interior
    c.fillStyle = '#ffe9c7'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 80) c.fillRect(x, 0, 40, 440);
    c.fillStyle = '#e8c08a'; c.fillRect(0, 440, W, H); c.strokeStyle = 'rgba(120,80,40,.25)'; c.lineWidth = 3; for (let x = -200; x < W; x += 110) { c.beginPath(); c.moveTo(x, 440); c.lineTo(x + 200, H); c.stroke(); }
    rr(0, 430, W, 18, 0, '#b77b4a', INK, 4);
    for (const d of this.doors) { c.save(); if (d.shake > 0) c.translate(Math.sin(G.t * 60) * 8 * d.shake, 0); drawClimaDoor(d.x, d.y, d.w, d.h, d.k, Game.d(2, 1, 0), d.glow); c.restore(); }
    // mostrador
    rr(470, 450, 340, 70, 14, '#ff8a3d', INK, 5); txt('AGENCIA ROSA', 640, 485, { size: 26, font: 'T', color: '#fff', outline: 5 }); drawRosa(640, 440, .3, { expr: 'happy' });
    // turistas
    const gs = this.guests.slice().sort((a, b) => (a.drag ? 1 : 0) - (b.drag ? 1 : 0));
    for (const g of gs) this.drawGuest(c, g);
    // marcador
    rr(W - 330, 22, 220, 58, 29, '#fff8ea', INK, 5); txt('Turistas: ' + this.served + ' / ' + this.total0, W - 220, 52, { size: 22, color: INK });
  }
  drawGuest(c, g) {
    const sc = g.sc ?? 1; c.save(); c.translate(g.x, g.y); c.scale(sc, sc);
    if (g.spy) { drawAlvaro(0, -95, .36, { expr: g.leaving ? 'shock' : 'smug', cape: false }); rr(-38, -165, 76, 18, 6, INK); rr(-60, -212, 120, 16, 8, '#e0634a', INK, 3); rr(-34, -250, 68, 42, 10, '#e0634a', INK, 3); }
    else { drawKid(0, 0, 1.25, { av: g.av, dir: g.x > 640 ? -1 : 1, walk: !!g.drag || g.leaving === 'angry', mouth: g.leaving === 'angry' ? 'o' : null, ph: g.id });
      const hy = -150; if (g.hat === 0) { c.beginPath(); ell(c, 0, hy + 8, 44, 10); fillStroke(c, '#ffe08a', 3); rr(-22, hy - 16, 44, 24, 10, '#ffe08a', INK, 3); rr(-22, hy - 2, 44, 7, 3, '#ff5c8a'); }
      else if (g.hat === 1) { rr(-30, hy - 4, 60, 12, 5, INK); }
      rr(30, -60, 34, 46, 7, ['#3ec1f3', '#a66cff', '#7ce05c', '#ff8a3d'][g.hat], INK, 3); rr(40, -70, 14, 12, 4, null, INK, 3); }
    c.restore();
    if (g.leaving) return;
    // bocadillo y paciencia
    const bw = 260, L = wrap(g.t, bw - 30, 19), bh = L.length * 23 + 22, by = g.y - 190 - bh;
    rr(g.x - bw / 2 + 3, by + 5, bw, bh, 16, 'rgba(20,10,40,.2)'); rr(g.x - bw / 2, by, bw, bh, 16, g.spy ? '#f3e8ff' : '#fff', INK, 4);
    L.forEach((l, i) => txt(l, g.x, by + 22 + i * 23, { size: 19, color: INK }));
    const k = clamp(g.p, 0, 1); rr(g.x - 60, g.y + 14, 120, 14, 7, 'rgba(255,255,255,.8)', INK, 3); if (k > 0) rr(g.x - 58, g.y + 16, 116 * k, 10, 5, k < .3 ? '#ff4b4b' : k < .6 ? '#ffc933' : '#7ce05c');
    if (k < .3 && !g.drag) { circle(g.x + 62, g.y - 150, 16, '#ff4b4b', INK, 3); txt('!', g.x + 62, g.y - 150, { size: 24, font: 'T', color: '#fff' }); }
  }
}
function drawClimaDoor(x, y, w, h, k, detail = 1, glow = 0) {
  const c = G.ctx, cl = CLIMAS[k];
  if (glow) { c.save(); c.globalAlpha = .5; rr(x - 10, y - 10, w + 20, h + 20, 30, '#fff'); c.restore(); }
  rr(x, y, w, h, 24, '#8a5a3a', INK, 5);
  c.save(); rrPath(c, x + 14, y + 14, w - 28, h - 90, 16); c.clip();
  const sky = { oceanico: ['#9fb8c9', '#d6e3ea'], mediterraneo: ['#5ec6f3', '#c8efff'], montana: ['#8fc3f0', '#e8f4ff'], subtropical: ['#ffb45e', '#ffe7a8'] }[k];
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(x, y, w, h);
  const bx = x + 14, by = y + h - 76, bw = w - 28;
  if (k === 'oceanico') { c.fillStyle = '#6cc948'; c.fillRect(bx, by - 60, bw, 70); for (let i = 0; i < 4; i++) { circle(bx + 30 + i * 60, by - 70, 24, '#3f9e3a', INK, 3); rr(bx + 27 + i * 60, by - 50, 6, 20, 2, '#8a5a3a'); } drawCloud(x + w / 2, y + 60, .7); c.strokeStyle = '#3e8ef0'; c.lineWidth = 3; for (let i = 0; i < 10; i++) { const rx = x + 30 + (i * 37) % (w - 60), ry = y + 80 + ((G.t * 120 + i * 40) % 90); c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 4, ry + 12); c.stroke(); } }
  if (k === 'mediterraneo') { drawSun(x + w - 60, y + 60, .5); c.fillStyle = '#e8c878'; c.fillRect(bx, by - 50, bw, 60); for (let i = 0; i < 3; i++) { rr(bx + 40 + i * 80, by - 80, 8, 34, 3, '#8a5a3a', INK, 2); ell(c, bx + 44 + i * 80, by - 88, 30, 16); fillStroke(c, '#9bb35a', 3); } for (let i = 0; i < 4; i++) { ell(c, bx + 20 + i * 70, by - 44, 16, 9); fillStroke(c, '#b8a14a', 2); } }
  if (k === 'montana') { c.fillStyle = '#fff'; c.fillRect(bx, by - 40, bw, 50); peak(c, x + w / 2 - 40, by - 30, 130, 80, '#a08870', true); peak(c, x + w / 2 + 60, by - 30, 100, 60, '#b09880', true); for (let i = 0; i < 4; i++) { const tx = bx + 26 + i * 64, ty = by - 20; c.beginPath(); c.moveTo(tx, ty - 44); c.lineTo(tx - 16, ty); c.lineTo(tx + 16, ty); c.closePath(); fillStroke(c, '#2f7a4a', 3); } for (let i = 0; i < 12; i++) circle(x + 20 + (i * 53) % (w - 40), y + 30 + ((G.t * 40 + i * 30) % (h - 120)), 3.5, '#fff'); }
  if (k === 'subtropical') { drawSun(x + 60, y + 60, .55); c.fillStyle = '#f4d58a'; c.fillRect(bx, by - 40, bw, 50); c.fillStyle = '#3ea5e6'; c.fillRect(bx, by - 10, bw, 20); for (let i = 0; i < 3; i++) { const px = bx + 50 + i * 90; rr(px - 5, by - 90, 10, 60, 4, '#7a5a3a', INK, 2); for (let a = 0; a < 5; a++) { c.save(); c.translate(px, by - 92); c.rotate(-1.4 + a * .7); ell(c, 18, 0, 20, 6); fillStroke(c, '#5fae3c', 2); c.restore(); } } }
  c.restore(); c.lineWidth = 4; c.strokeStyle = INK; rrPath(c, x + 14, y + 14, w - 28, h - 90, 16); c.stroke();
  rr(x + 10, y + h - 70, w - 20, 58, 14, cl.col, INK, 4); txt(cl.name, x + w / 2, y + h - 41 - (detail > 1 ? 8 : 0), { size: fitSize(cl.name, w - 40, 26, 'T'), font: 'T', color: '#fff', outline: 5 });
  if (detail > 1) txt({ oceanico: 'norte', mediterraneo: 'centro, este y sur', montana: 'montañas altas', subtropical: 'islas Canarias' }[k], x + w / 2, y + h - 22, { size: 15, color: '#fff', outline: 4 });
}
