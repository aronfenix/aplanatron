'use strict';
/* =====================================================================
   PRUEBA 1 · EL TIRACHINAS DE BANDERAS (mares, península, islas y costas)
   Se tira una bandera con el tirachinas para clavarla en el sitio del mapa.
   ===================================================================== */
const BANDERAS = [
  { id: 'b_peninsula', name: 'la península Ibérica', short: 'Península Ibérica', type: 'land', c: [40.0, -4.0], hint: 'La península Ibérica es la tierra donde están España y Portugal. Rodeada de agua por todas partes menos por los Pirineos.', def: 'Península: tierra rodeada de agua por todas partes menos por una.' },
  { id: 'b_cantabrico', name: 'el mar Cantábrico', short: 'Mar Cantábrico', type: 'sea', sea: 'cantabrico', c: [44.1, -4.5], hint: 'El mar Cantábrico está al NORTE de España, arriba en el mapa.' },
  { id: 'b_atlantico', name: 'el océano Atlántico', short: 'Océano Atlántico', type: 'sea', sea: 'atlantico', c: [40.5, -10.2], hint: 'El océano Atlántico está al OESTE de la península, a la izquierda en el mapa. También baña Canarias.' },
  { id: 'b_mediterraneo', name: 'el mar Mediterráneo', short: 'Mar Mediterráneo', type: 'sea', sea: 'mediterraneo', c: [38.0, 1.0], hint: 'El mar Mediterráneo está al ESTE y al SURESTE de España, a la derecha en el mapa.' },
  { id: 'b_baleares', name: 'las islas Baleares', short: 'Islas Baleares', type: 'circle', c: [39.6, 2.9], r: 62, hint: 'Las islas Baleares están en el mar Mediterráneo, al ESTE de la península: Mallorca, Menorca, Ibiza…', def: 'Archipiélago: un grupo de islas.' },
  { id: 'b_canarias', name: 'las islas Canarias', short: 'Islas Canarias', type: 'inset', hint: 'Las Canarias están en el océano Atlántico, cerca de África. En el mapa van dentro del recuadro de abajo a la izquierda.' },
  { id: 'b_finisterre', name: 'el cabo de Finisterre', short: 'Cabo de Finisterre', type: 'circle', c: [42.9, -9.2], r: 48, hint: 'Finisterre está en Galicia, en el extremo OESTE: es el punto más occidental. Arriba a la izquierda.', def: 'Cabo: punta de tierra que entra en el mar.' },
  { id: 'b_cadiz', name: 'el golfo de Cádiz', short: 'Golfo de Cádiz', type: 'circle', c: [36.6, -6.9], r: 48, hint: 'El golfo de Cádiz está en el SUROESTE, en el océano Atlántico, justo antes del estrecho.', def: 'Golfo: gran entrada del mar en la tierra.' },
  { id: 'b_estrecho', name: 'el estrecho de Gibraltar', short: 'Estrecho de Gibraltar', type: 'circle', c: [35.97, -5.55], r: 44, hint: 'El estrecho de Gibraltar está en el SUR, entre España y África. Une el Atlántico con el Mediterráneo.', def: 'Estrecho: paso de mar entre dos tierras.' },
  { id: 'b_delta', name: 'el delta del Ebro', short: 'Delta del Ebro', type: 'circle', c: [40.7, 0.85], r: 44, hint: 'El delta del Ebro está en el ESTE, en el Mediterráneo, donde el río Ebro llega al mar.', def: 'Delta: tierra que deja un río al llegar al mar.' },
];
class GameBanderas extends Mini {
  constructor() { super(0); }
  howto() {
    return { title: 'El tirachinas de banderas', lines: ['El Aplanatrón ha borrado los nombres de los mares, las islas y las costas.', 'Tirad del tirachinas hacia atrás, apuntad y soltad para clavar la bandera en el sitio que se pide.', 'Cuidado con el viento: empuja la bandera hacia donde indica la flecha.', this.two ? 'Tiráis por turnos.' : '¡Suerte!'],
      pic: (c, x, y) => { drawSling(x - 60, y + 40, 1.2, { pull: [-60, 50] }); drawFlag(x + 110, y - 90, 1.3, '#ff5c8a'); c.setLineDash([6, 12]); c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 50, y - 20); c.quadraticCurveTo(x + 30, y - 220, x + 110, y - 90); c.stroke(); c.setLineDash([]); } };
  }
  setup() {
    this.two = Game.team.names.length > 1;
    this.map = new MapES({ x: 505, y: 112, s: .74, key: 'bmap', layers: { countries: true } });
    this.w = getWorld('es');
    this.queue = Game.choose(BANDERAS, Game.d(8, 10, 10)); this.retried = {}; this.planted = []; this.i = 0; this.n = this.queue.length;
    this.anchor = [235, 560]; this.pull = null; this.shot = null; this.wind = [0, 0];
    this.ap = { x: 900, t: 0 };
    this.prog = () => [this.i, this.n];
  }
  start() { this.next(); }
  get cur() { return this.queue[this.i]; }
  next() {
    if (this.i >= this.queue.length) { this.showBanner('¡Banderas clavadas!', null, 1.4); return this.finish({ delay: 1.6 }); }
    const w = Game.d(0, 30, 60); const a = rnd(TAU); this.wind = [Math.cos(a) * w * rnd(.4, 1), Math.sin(a) * w * rnd(.4, 1)];
    this.ready = true; this.cardK = 0; tw(this, { cardK: 1 }, .4, { ease: E.outBack }); Sound.sfx('whoosh');
    this.setSpeak('Clava la bandera en ' + this.cur.name, 20, 330);
  }
  mu(lat, lon) { const [mx, my] = PROJ.es(lat, lon); return [mx, my]; }
  scr(lat, lon) { const [mx, my] = this.mu(lat, lon); return this.map.P(mx, my); }
  terrainAt(mx, my) { return this.w.terrain(mx * this.w.s, my * this.w.s); }
  inInset(mx, my) { return this.w.inInset(mx * this.w.s, my * this.w.s); }
  hit(t, mx, my) {
    if (mx < 0 || my < 0 || mx > 1000 || my > GEO.es.H) return false;
    const ter = this.terrainAt(mx, my), inset = this.inInset(mx, my);
    if (t.type === 'circle') { const [cx, cy] = this.mu(...t.c); return Math.hypot(mx - cx, my - cy) < t.r || (t.id === 'b_baleares' && ter === 4 && mx > 780); }
    if (t.type === 'inset') return inset;
    if (t.type === 'land') return !inset && (ter === 2 || ter === 3);
    if (t.type === 'sea') return inset ? t.sea === 'atlantico' && ter === 0 : ter === 0 && this.w.seaZone(mx * this.w.s, my * this.w.s) === t.sea;
  }
  where(mx, my) {
    if (mx < 0 || my < 0 || mx > 1000 || my > GEO.es.H) return 'fuera del mapa';
    if (this.inInset(mx, my)) return 'en las islas Canarias';
    for (const t of BANDERAS) if (t.type === 'circle' && this.hit(t, mx, my)) return 'en ' + t.name;
    const ter = this.terrainAt(mx, my);
    if (ter === 0) return 'en ' + { cantabrico: 'el mar Cantábrico', atlantico: 'el océano Atlántico', mediterraneo: 'el mar Mediterráneo' }[this.w.seaZone(mx * this.w.s, my * this.w.s)];
    if (ter === 3) return 'en la península Ibérica, en España';
    if (ter === 2) return 'en Portugal, en la península Ibérica';
    if (ter === 4) return 'en una isla';
    return 'fuera de España';
  }
  aimOf(px, py) { const [ax, ay] = this.anchor; return [ax + (ax - px) * 6, ay + (ay - py) * 6]; }
  onDown(p) { if (!this.ready || this.shot) return; if (dist(p.x, p.y, this.anchor[0], this.anchor[1] - 40) < 150 || p.x < 470) { this.pull = { id: p.id, x: this.anchor[0], y: this.anchor[1] }; this.onMove(p); Sound.sfx('tap'); } }
  onMove(p) { const q = this.pull; if (!q || q.id !== p.id) return; let dx = p.x - this.anchor[0], dy = p.y - this.anchor[1]; const L = Math.hypot(dx, dy), M = 190; if (L > M) { dx *= M / L; dy *= M / L; } q.x = this.anchor[0] + dx; q.y = this.anchor[1] + dy; }
  onUp(p, cancel) {
    const q = this.pull; if (!q || q.id !== p.id) return; this.pull = null;
    if (cancel || dist(q.x, q.y, this.anchor[0], this.anchor[1]) < 25) return;
    const [tx, ty] = this.aimOf(q.x, q.y); const land = [tx + this.wind[0], ty + this.wind[1]];
    this.ready = false; this.shot = { from: [this.anchor[0], this.anchor[1] - 40], to: land, t: 0, col: PCOL[this.two ? this.turn : 0] }; Sound.sfx('boing'); Sound.sfx('whoosh');
  }
  land() {
    const s = this.shot, t = this.cur, [mx, my] = this.map.M(s.to[0], s.to[1]); this.shot = null;
    const [sx, sy] = s.to;
    if (this.hit(t, mx, my)) {
      this.planted.push({ x: sx, y: sy, col: s.col, label: t.short }); Sound.sfx('thud'); shake(4, .15);
      this.good(sx, sy - 40, t.id, 100); this.showBanner(t.short.toUpperCase(), t.def || '¡En su sitio!', 1.5, '#2fb8a0');
      this.i++; if (this.two) this.nextTurn(); later(1.7, () => this.next());
    } else {
      this.miss = { x: sx, y: sy, t0: G.t }; Sound.sfx('splash');
      if (!this.retried[t.id]) { this.retried[t.id] = 1; this.queue.push(t); this.n = this.queue.length; }
      this.showZone = t;
      this.bad(sx, sy - 30, t.id, 'Tu bandera ha caído ' + this.where(mx, my) + '. ' + t.hint, t.short, { then: () => { this.showZone = null; this.i++; if (this.two) this.nextTurn(); this.next(); }, title: 'Había que darle a:' });
    }
  }
  play(dt) {
    this.ap.t += dt; this.ap.x = 870 + Math.sin(this.ap.t * .4) * 330;
    const s = this.shot; if (s) { s.t += dt / .85; if (s.t >= 1) this.land(); }
  }
  render(c) {
    bg('mar');
    const m = this.map; m.drawBase();
    for (const p of this.planted) { drawFlag(p.x, p.y, .7, p.col); chip(p.label, p.x, p.y + 16, 'rgba(255,255,255,.9)', INK, 13); }
    if (this.miss && G.t - this.miss.t0 < 3) { const k = (G.t - this.miss.t0) / 3; c.globalAlpha = 1 - k; drawFlag(this.miss.x, this.miss.y + k * 30, .7, '#8c85b0'); c.globalAlpha = 1; }
    if (this.showZone) this.drawZone(c, this.showZone);
    drawPlancha(this.ap.x, 70, .3, { dir: Math.cos(this.ap.t * .4) > 0 ? 1 : -1, expr: 'laugh', shadow: false });
    // colina, tirachinas y jugador
    c.fillStyle = '#7cc95a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, 560); c.quadraticCurveTo(240, 470, 470, 600); c.lineTo(470, H); c.closePath(); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    const who = this.two ? this.turn : 0, av = Game.team.avs[who] ?? 0;
    drawKid(100, 690, 1.5, { av, dir: 1, look: .4, ph: who });
    const q = this.pull; const pull = q ? [q.x - this.anchor[0], q.y - this.anchor[1]] : [0, 0];
    drawSling(this.anchor[0], this.anchor[1] + 60, 1, { pull, loaded: this.ready && !this.shot, col: PCOL[who] });
    if (q && Math.hypot(...pull) > 20) { let [tx, ty] = this.aimOf(q.x, q.y); if (Game.diff !== 'turbo') { tx += this.wind[0]; ty += this.wind[1]; } c.lineWidth = 5; c.strokeStyle = '#fff'; c.setLineDash([4, 14]); c.beginPath(); c.moveTo(this.anchor[0], this.anchor[1] - 40); c.quadraticCurveTo((this.anchor[0] + tx) / 2, Math.min(this.anchor[1], ty) - 200, tx, ty); c.stroke(); c.setLineDash([]); circle(tx, ty, 22, null, '#fff', 5); circle(tx, ty, 22, null, INK, 2); c.fillStyle = '#fff'; c.fillRect(tx - 2, ty - 30, 4, 60); c.fillRect(tx - 30, ty - 2, 60, 4); }
    // viento
    const wl = Math.hypot(...this.wind); if (wl > 4) { const x0 = 400, y0 = 150; rr(x0 - 70, y0 - 44, 140, 88, 20, 'rgba(255,255,255,.85)', INK, 4); txt('VIENTO', x0, y0 - 24, { size: 18, font: 'T', color: '#3e8ef0' }); c.save(); c.translate(x0, y0 + 12); c.rotate(Math.atan2(this.wind[1], this.wind[0])); const L = 16 + wl * .4; c.lineWidth = 7; c.strokeStyle = INK; c.lineCap = 'round'; c.beginPath(); c.moveTo(-L, 0); c.lineTo(L, 0); c.moveTo(L - 12, -10); c.lineTo(L, 0); c.lineTo(L - 12, 10); c.stroke(); c.restore(); }
    // bandera en vuelo
    const s = this.shot; if (s) { const x = lerp(s.from[0], s.to[0], s.t), y = lerp(s.from[1], s.to[1], s.t) - Math.sin(s.t * Math.PI) * 240, sc = .7 + Math.sin(s.t * Math.PI) * .5;
      c.fillStyle = 'rgba(20,10,40,.25)'; ell(c, lerp(s.from[0], s.to[0], s.t), lerp(s.from[1], s.to[1], s.t), 14 * sc, 5 * sc); c.fill(); c.save(); c.translate(x, y); c.rotate((s.t - .5) * 1.2); drawFlag(0, 0, sc, s.col); c.restore(); }
    // tarjeta con el objetivo
    const t = this.cur; if (t && this.i < this.queue.length) { const k = this.cardK ?? 1; c.save(); c.translate(250, 250); c.scale(k, k); c.translate(-250, -250);
      panel(22, 96, 330, 200, '#fff8ea', { r: 24 }); txt(this.two ? 'Le toca a ' + Game.name(this.turn) : '¡Clava la bandera en…', 187, 128, { size: 22, color: this.two ? PCOL[this.turn] : '#8c85b0' });
      if (this.two) txt('Clava la bandera en…', 187, 158, { size: 20, color: '#8c85b0' });
      const L = wrap(t.name.toUpperCase(), 290, 34, 'T'); L.forEach((l, j) => txt(l, 187, 200 + j * 38, { size: 34, font: 'T', color: '#ff5c8a' }));
      if (Game.diff === 'tranqui' && t.def) wrap(t.def, 300, 17).forEach((l, j) => txt(l, 187, 262 + j * 20, { size: 17, color: INK }));
      c.restore(); }
  }
  drawZone(c, t) {
    const pulse = 1 + Math.sin(G.t * 6) * .08;
    let x, y, r;
    if (t.type === 'inset') { const [ix, iy, iw, ih] = this.map.insetRect; x = ix + iw / 2; y = iy + ih / 2; r = Math.max(iw, ih) / 2; }
    else { [x, y] = this.scr(...t.c); r = (t.r || 70) * this.map.s; }
    c.save(); c.globalAlpha = .35; circle(x, y, r * pulse, '#ffc933'); c.globalAlpha = 1; circle(x, y, r * pulse, null, '#ff8a3d', 6); c.restore();
    txt('▼', x, y - r - 24 + Math.sin(G.t * 6) * 6, { size: 40, color: '#ff8a3d', outline: 7 });
  }
}
function drawFlag(x, y, s = 1, col = '#ff5c8a') {
  const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(20,10,40,.25)'; ell(c, 0, 2, 12, 4); c.fill();
  rr(-3, -70, 6, 72, 3, '#8a5a3a', INK, 3);
  const wv = Math.sin(G.t * 6) * 4; c.beginPath(); c.moveTo(3, -68); c.quadraticCurveTo(22, -72 + wv, 44, -62); c.quadraticCurveTo(26, -52 - wv, 44, -42); c.quadraticCurveTo(22, -44 + wv, 3, -40); c.closePath(); fillStroke(c, col, 3.5);
  c.restore();
}
function drawSling(x, y, s = 1, o = {}) {
  const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s);
  const [px, py] = o.pull || [0, 0], pouch = [px, -100 + py];
  c.lineCap = 'round'; c.lineWidth = 18; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 20); c.lineTo(0, -50); c.moveTo(0, -45); c.lineTo(-36, -110); c.moveTo(0, -45); c.lineTo(36, -110); c.stroke();
  c.lineWidth = 11; c.strokeStyle = '#a0683f'; c.stroke();
  c.lineWidth = 6; c.strokeStyle = '#5a2fa8'; c.beginPath(); c.moveTo(-36, -108); c.lineTo(pouch[0], pouch[1]); c.lineTo(36, -108); c.stroke();
  rr(pouch[0] - 16, pouch[1] - 10, 32, 20, 8, '#5a2fa8', INK, 3);
  if (o.loaded !== false) { c.save(); c.translate(pouch[0], pouch[1] - 6); c.rotate(-.5); drawFlag(0, 0, .45, o.col || '#ff5c8a'); c.restore(); }
  c.restore();
}
