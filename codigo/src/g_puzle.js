'use strict';
/* =====================================================================
   PRUEBA 5 · EL PUZLE DE EUROPA
   Las penínsulas y las islas están recortadas del mapa de verdad. Hay
   que encajar cada pieza en su hueco. Después, pegatinas: Alpes,
   Urales, Gran Llanura Europea, Rin y Danubio.
   ===================================================================== */
const PIEZAS = [
  { id: 'pIberica', name: 'Península Ibérica', col: '#ff8a3d', poly: [[44.2, -10.8], [44.2, -1.75], [43.35, -1.72], [42.85, -.4], [42.7, 1.2], [42.45, 3.3], [41.8, 4.4], [35.6, 4.4], [35.6, -1.9], [35.95, -5.3], [36.05, -6.6], [35.6, -10.8]] },
  { id: 'pItalica', name: 'Península Itálica', col: '#e0634a', poly: [[44.12, 9.7], [44.25, 12.4], [44.0, 13.7], [41.2, 18.5], [40.2, 18.95], [39.6, 18.8], [37.8, 16.4], [37.85, 15.7], [38.3, 15.72], [38.7, 15.4], [40.0, 12.6], [42.1, 10.8], [43.2, 10.2]] },
  { id: 'pBalcanica', name: 'Península Balcánica', col: '#a66cff', poly: [[45.75, 13.4], [45.5, 15.5], [45.2, 17.5], [45.05, 19.2], [44.85, 20.6], [44.7, 22.4], [43.95, 22.9], [43.7, 24.5], [43.75, 25.8], [44.05, 27.1], [44.4, 28.2], [45.3, 29.8], [43.0, 30.6], [41.6, 29.25], [41.0, 28.9], [40.45, 26.95], [40.05, 26.1], [39.0, 26.2], [36.5, 28.0], [34.6, 27.0], [34.6, 22.5], [36.5, 20.5], [39.6, 19.8], [41.0, 19.2], [42.3, 16.8], [43.4, 15.0], [44.3, 13.1]] },
  { id: 'pEscandinava', name: 'Península Escandinava', col: '#7ce05c', poly: [[58.3, 4.2], [62.5, 3.8], [67.0, 10.0], [70.5, 16.5], [71.5, 25.0], [71.0, 31.5], [69.8, 31.5], [69.75, 29.2], [69.9, 28.0], [69.45, 25.9], [69.0, 25.2], [68.6, 23.2], [69.05, 20.6], [68.45, 22.4], [67.85, 23.55], [66.9, 23.7], [65.85, 24.15], [65.5, 23.5], [64.2, 21.6], [63.3, 20.9], [62.6, 19.4], [60.6, 19.2], [59.6, 19.4], [57.4, 19.3], [56.2, 16.6], [55.6, 14.6], [55.25, 14.0], [55.25, 12.9], [55.75, 12.75], [56.1, 12.55], [56.6, 12.3], [57.8, 11.3], [58.05, 9.0]] },
  { id: 'granBretana', name: 'Gran Bretaña', col: '#ff5c8a', poly: [[49.8, -6.7], [50.0, -1.5], [50.75, 1.15], [51.15, 1.6], [51.6, 2.3], [53.6, 2.3], [57.5, -1.0], [59.2, -1.8], [61.0, -.6], [61.0, -3.0], [58.8, -8.2], [56.2, -7.9], [55.55, -6.35], [55.2, -5.85], [54.75, -5.4], [54.2, -4.85], [53.5, -4.9], [52.4, -5.35], [51.6, -5.8], [50.4, -6.7]] },
  { id: 'irlanda', name: 'Irlanda', col: '#46c97a', poly: [[51.2, -11.2], [51.2, -6.1], [52.3, -5.95], [53.8, -5.75], [54.35, -5.3], [54.9, -5.62], [55.3, -6.05], [55.5, -6.35], [55.6, -8.2], [55.5, -10.9]] },
  { id: 'islandia', name: 'Islandia', col: '#ffc933', poly: [[62.9, -25.5], [62.9, -12.5], [67.0, -12.5], [67.0, -25.5]] },
];
const PEGATINAS = [
  { id: 'granLlanura', name: 'Gran Llanura Europea', kind: 'plain', hint: 'La Gran Llanura Europea ocupa el CENTRO y el NORTE de Europa: Francia del norte, Alemania, Polonia… Es enorme y muy plana.' },
  { id: 'alpes', name: 'Alpes', kind: 'range', key: 'alpes', hint: 'Los Alpes están en el centro-sur de Europa, al norte de Italia, entre Francia, Suiza y Austria.' },
  { id: 'urales', name: 'Urales', kind: 'range', key: 'urales', hint: 'Los montes Urales están muy al ESTE, en Rusia. Son la frontera entre Europa y Asia.' },
  { id: 'Rin', name: 'Río Rin', kind: 'river', key: 'Rin', hint: 'El Rin nace en los Alpes, va hacia el NORTE, cruza Alemania y desemboca en el mar del Norte.' },
  { id: 'Danubio', name: 'Río Danubio', kind: 'river', key: 'Danubio', hint: 'El Danubio cruza Europa de oeste a ESTE, pasa por Viena y desemboca en el mar Negro.' },
];
class GamePuzle extends Mini {
  constructor() { super(4); }
  howto() {
    return { title: 'El puzle de Europa', lines: ['El Aplanatrón ha desmontado Europa. Las penínsulas y las islas se han salido del mapa.', 'Arrastra cada pieza (mira su nombre) hasta su sitio. Si está cerca, encaja sola.', 'Después, pegad las pegatinas: los Alpes, los Urales, la Gran Llanura Europea, el Rin y el Danubio.'],
      pic: (c, x, y) => { rr(x - 130, y - 110, 120, 90, 16, '#3ec1f3', INK, 5); txt('Península', x - 70, y - 75, { size: 18, color: '#fff', outline: 4 }); txt('Itálica', x - 70, y - 50, { size: 18, color: '#fff', outline: 4 }); c.setLineDash([6, 10]); c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 10, y - 60); c.quadraticCurveTo(x + 60, y - 110, x + 110, y + 10); c.stroke(); c.setLineDash([]); circle(x + 110, y + 20, 30, null, '#ff5c8a', 6); } };
  }
  setup() {
    this.two = Game.team.names.length > 1;
    this.map = new MapEU({ x: 370, y: 60, s: .8, key: 'puzmap' });
    const m = this.map, s = m.s;
    this.pieces = PIEZAS.map(p => { const pts = p.poly.map(([la, lo]) => m.P(...PROJ.eu(la, lo))); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      // recorte ajustado a la tierra
      const cv = document.createElement('canvas'), rs = Math.min(G.rs, 1.5); cv.width = Math.ceil((x1 - x0) * rs); cv.height = Math.ceil((y1 - y0) * rs); const c = cv.getContext('2d'); c.scale(rs, rs); c.translate(-x0, -y0);
      c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip();
      c.beginPath(); for (const r of GEO.eu.europe) ringPath(c, r, m.tf); c.fillStyle = p.col; c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
      c.save(); c.clip(); c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke(); c.restore();
      const px = c.getImageData(0, 0, cv.width, cv.height).data; let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1; for (let yy = 0; yy < cv.height; yy += 2) for (let xx = 0; xx < cv.width; xx += 2) if (px[(yy * cv.width + xx) * 4 + 3] > 20) { bx0 = Math.min(bx0, xx); bx1 = Math.max(bx1, xx); by0 = Math.min(by0, yy); by1 = Math.max(by1, yy); }
      const tx0 = x0 + bx0 / rs - 3, ty0 = y0 + by0 / rs - 3, tw = (bx1 - bx0) / rs + 6, th = (by1 - by0) / rs + 6;
      return { ...p, pts, cv, sx: x0, sy: y0, sw: x1 - x0, sh: y1 - y0, hx: tx0 + tw / 2, hy: ty0 + th / 2, tx0, ty0, tw, th, placed: false, x: 0, y: 0, k: .5, drag: null }; });
    // bandeja
    const order = shuffle(this.pieces.slice()); order.forEach((p, i) => { p.tray = [185, 150 + i * 88]; p.x = p.tray[0]; p.y = p.tray[1]; p.k = Math.min(.55, 150 / Math.max(p.tw, p.th * 1.6)); });
    this.stickers = PEGATINAS.map((q, i) => ({ ...q, tray: [185, 200 + i * 110], x: 185, y: 200 + i * 110, placed: false, drag: null }));
    this.phase = 'piezas'; this.drags = {}; this.rise = {}; this.flow = {};
    this.prog = () => [this.pieces.filter(p => p.placed).length + this.stickers.filter(p => p.placed).length, this.pieces.length + this.stickers.length];
  }
  start() { this.running = true; }
  items() { return this.phase === 'piezas' ? this.pieces : this.stickers; }
  onDown(p) {
    if (!this.running) return;
    const list = this.items().filter(q => !q.placed && !q.drag).reverse();
    for (const q of list) { const w = this.phase === 'piezas' ? Math.max(70, q.tw * q.k / 2 + 16) : 150; const h = this.phase === 'piezas' ? Math.max(40, q.th * q.k / 2 + 16) : 45; if (Math.abs(p.x - q.x) < w && Math.abs(p.y - q.y) < h) { q.drag = { id: p.id, ox: p.x - q.x, oy: p.y - q.y }; this.drags[p.id] = q; Sound.sfx('pop'); if (this.phase === 'piezas') tw(q, { k: 1 }, .2); return; } }
  }
  onMove(p) { const q = this.drags[p.id]; if (q) { q.x = p.x - q.drag.ox * (this.phase === 'piezas' ? q.k : 1); q.y = p.y - q.drag.oy * (this.phase === 'piezas' ? q.k : 1); } }
  onUp(p) {
    const q = this.drags[p.id]; if (!q) return; delete this.drags[p.id]; q.drag = null;
    if (q.x < 360) { this.back(q); return; }
    if (this.phase === 'piezas') this.dropPiece(q); else this.dropSticker(q);
  }
  back(q) { tw(q, { x: q.tray[0], y: q.tray[1] }, .35, { ease: E.outBack }); if (this.phase === 'piezas') { const k0 = Math.min(.55, 150 / Math.max(q.tw, q.th * 1.6)); tw(q, { k: k0 }, .3); } }
  dropPiece(q) {
    const d = dist(q.x, q.y, q.hx, q.hy), tol = Game.d(95, 75, 55);
    if (d < tol) { q.placed = true; tw(q, { x: q.hx, y: q.hy, k: 1 }, .25, { ease: E.outBack }); Sound.sfx('thud'); this.good(q.hx, q.hy, 'eu_' + q.id); this.showBanner(q.name, null, 1.1, q.col); this.checkPhase(); }
    else { const near = this.pieces.find(o => o !== q && !o.placed && dist(q.x, q.y, o.hx, o.hy) < 90); this.bad(q.x, q.y, 'eu_' + q.id, (near ? 'Ese hueco es el de ' + near.name + '. ' : '') + (EUROPA.find(e => e.id === q.id) || {}).hint, q.name, { title: 'Pieza:' }); this.back(q); }
  }
  zoneOk(q, x, y) {
    const m = this.map, s = m.s;
    if (q.kind === 'plain') { const [cx, cy] = m.P(...PROJ.eu(52.3, 17.0)); return Math.hypot((x - cx) / 1.8, y - cy) < 75; }
    if (q.kind === 'range') return polyDist(x - m.x, y - m.y, GEO.eu.ranges[q.key], s) < 55;
    let b = 1e9; for (const l of GEO.eu.rivers[q.key]) b = Math.min(b, polyDist(x - m.x, y - m.y, l, s)); return b < 40;
  }
  dropSticker(q) {
    if (this.zoneOk(q, q.x, q.y)) { q.placed = true; Sound.sfx('thud'); this.good(q.x, q.y, 'eu_' + q.id); if (q.kind === 'range') { this.rise[q.key] = 0; tw(this.rise, { [q.key]: 1 }, 1.3, { ease: E.lin }); Sound.sfx('rumble'); } if (q.kind === 'river') { this.flow[q.key] = 0; tw(this.flow, { [q.key]: 1 }, 1.6, { ease: E.lin }); Sound.sfx('splash'); } this.showBanner(q.name, null, 1.1, '#a66cff'); this.checkPhase(); }
    else { const other = this.stickers.find(o => o !== q && !o.placed && this.zoneOk(o, q.x, q.y)); this.bad(q.x, q.y, 'eu_' + q.id, (other ? 'Ahí van ' + (other.kind === 'river' ? 'el ' + other.name : other.kind === 'plain' ? 'la ' + other.name : 'los ' + other.name) + '. ' : '') + q.hint, q.name, { title: 'Pegatina:' }); this.back(q); }
  }
  checkPhase() {
    if (this.phase === 'piezas' && this.pieces.every(p => p.placed)) { later(1.2, () => { this.phase = 'pegatinas'; this.showBanner('¡Europa montada!', 'Ahora, las pegatinas', 1.6, '#a66cff'); Sound.sfx('fanfare'); }); }
    if (this.phase === 'pegatinas' && this.stickers.every(p => p.placed)) { later(1, () => { this.showBanner('¡Europa completa!', null, 1.4); this.finish({ delay: 1.6 }); }); }
  }
  render(c) {
    const m = this.map;
    c.fillStyle = '#3ea5e6'; c.fillRect(0, 0, W, H); m.drawBase();
    // huecos: se tapan con mar las piezas que faltan
    for (const p of this.pieces) if (!p.placed || p.k < .99) { c.save(); c.beginPath(); p.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip(); c.beginPath(); for (const r of GEO.eu.europe) ringPath(c, r, m.tf); c.fillStyle = '#4bb0ea'; c.fill();  c.restore(); }
    // relieve y ríos pegados
    const rk = Object.keys(this.rise); if (rk.length) m.drawRanges(rk, this.rise);
    for (const k in this.flow) for (const l of GEO.eu.rivers[k]) m.paintRiver(c, l, 5, this.flow[k]);
    for (const q of this.stickers) if (q.placed) chip(q.name, q.x, q.y + (q.kind === 'range' ? 22 : 0), q.kind === 'river' ? '#3e8ef0' : q.kind === 'plain' ? '#46c97a' : '#c98c5a', '#fff', 15);
    // piezas colocadas
    for (const p of this.pieces) if (p.placed) this.drawPiece(c, p, false);
    // bandeja
    panel(14, 86, 342, 700, '#fff8ea', { r: 26 }); txt(this.phase === 'piezas' ? 'PIEZAS' : 'PEGATINAS', 185, 116, { size: 28, font: 'T', color: '#a66cff' });
    if (this.phase === 'piezas') { for (const p of this.pieces) if (!p.placed && !p.drag) this.drawPiece(c, p, true); }
    else for (const q of this.stickers) if (!q.placed && !q.drag) this.drawSticker(c, q);
    for (const p of this.pieces) if (p.drag) this.drawPiece(c, p, true);
    for (const q of this.stickers) if (q.drag) this.drawSticker(c, q);
    if (this.two) chip('Podéis arrastrar los dos a la vez', 640, H - 26, '#a66cff', '#fff', 17);
  }
  drawPiece(c, p, label) {
    c.save(); c.translate(p.x, p.y); c.scale(p.k, p.k); c.translate(-p.hx, -p.hy);
    if (p.drag) { c.globalAlpha = .3; c.drawImage(p.cv, p.sx + 8, p.sy + 10, p.sw, p.sh); c.globalAlpha = 1; }
    c.drawImage(p.cv, p.sx, p.sy, p.sw, p.sh); c.restore();
    if (label) chip(p.name, p.x, p.y + Math.max(24, p.th * p.k / 2 + 8), p.col, '#fff', 15);
  }
  drawSticker(c, q) {
    const x = q.x, y = q.drag ? q.y - 80 : q.y; const c2 = G.ctx;
    if (q.drag) { c2.lineWidth = 4; c2.strokeStyle = INK; c2.beginPath(); c2.moveTo(x, y + 38); c2.lineTo(x, q.y); c2.stroke(); circle(x, q.y, 9, '#ff5c8a', INK, 3); }
    rr(x - 140, y - 38, 280, 76, 20, '#fff', INK, 4);
    if (q.kind === 'range') { peak(c, x - 100, y + 18, 40, 24, '#c98c5a', true); peak(c, x - 78, y + 18, 30, 18, '#b8784c', true); }
    else if (q.kind === 'river') { c.lineWidth = 7; c.strokeStyle = '#3fa0f5'; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 120, y + 10); c.bezierCurveTo(x - 100, y - 20, x - 90, y + 25, x - 70, y - 10); c.stroke(); }
    else { rr(x - 125, y - 4, 60, 20, 8, '#8fdc5e', INK, 3); }
    txt(q.name, x + 25, y, { size: fitSize(q.name, 180, 24), color: INK });
  }
}
