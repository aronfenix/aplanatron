'use strict';
/* =====================================================================
   MAPAS: España (con recuadro de Canarias) y Europa, dibujados en cartoon
   ===================================================================== */
const RANGE_INFO = {
  cantabrica: { h: 1.1, col: '#c98c5a' }, leon: { h: .8, col: '#c49060' }, galaico: { h: .7, col: '#b99566' }, vascos: { h: .75, col: '#c08c5c' },
  pirineos: { h: 1.3, col: '#bb7f52' }, catalana: { h: .7, col: '#c9966a' }, iberico: { h: .95, col: '#c98c5a' }, central: { h: 1.05, col: '#c4865a' },
  toledo: { h: .62, col: '#c9a070' }, morena: { h: .72, col: '#b98a5e' }, penibetico: { h: 1.2, col: '#bf8254' }, subbetico: { h: .85, col: '#c7925f' },
  tramontana: { h: .7, col: '#c49060' },
  alpes: { h: 1.3, col: '#bb7f52' }, apeninos: { h: .85, col: '#c98c5a' }, carpatos: { h: .95, col: '#c49060' }, caucaso: { h: 1.25, col: '#bb7f52' }, urales: { h: .8, col: '#c9a070' }, escandinavos: { h: .95, col: '#b99566' },
};
function polyLen(pts) { let L = 0; for (let i = 2; i < pts.length; i += 2) L += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]); return L; }
function samplePoly(pts, step) {
  const out = [[pts[0], pts[1]]]; let need = step;
  for (let i = 2; i < pts.length; i += 2) {
    const x0 = pts[i - 2], y0 = pts[i - 1], x1 = pts[i], y1 = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0); let pos = 0;
    while (L - pos >= need) { pos += need; out.push([x0 + (x1 - x0) * pos / L, y0 + (y1 - y0) * pos / L]); need = step; }
    need -= (L - pos);
  }
  return out;
}
function segDist(px, py, pts) { let best = 1e9; for (let i = 2; i < pts.length; i += 2) { const ax = pts[i - 2], ay = pts[i - 1], bx = pts[i], by = pts[i + 1]; const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1; let k = ((px - ax) * dx + (py - ay) * dy) / L2; k = clamp(k, 0, 1); const d = Math.hypot(px - ax - dx * k, py - ay - dy * k); if (d < best) best = d; } return best; }
function pointInPoly(px, py, r) { let ins = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]; if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
function polyCentroid(r) { let x = 0, y = 0, n = r.length / 2; for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; } return [x / n, y / n]; }
function ringPath(c, r, tf) { c.moveTo(tf(r[0], r[1])[0], tf(r[0], r[1])[1]); for (let i = 2; i < r.length; i += 2) { const p = tf(r[i], r[i + 1]); c.lineTo(p[0], p[1]); } c.closePath(); }
/* pico cartoon */
function peak(c, x, y, h, w, col, snow) {
  c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * .25, y - h * .75, x, y - h); c.quadraticCurveTo(x + w * .25, y - h * .75, x + w, y); c.closePath();
  c.fillStyle = col; c.fill();
  c.save(); c.clip(); c.fillStyle = shade(col, -.22); c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w * 1.2, y); c.lineTo(x + w * .15, y); c.closePath(); c.fill();
  if (snow) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - w * .5, y - h * .55); c.lineTo(x, y - h - 2); c.lineTo(x + w * .5, y - h * .55); c.lineTo(x + w * .2, y - h * .48); c.lineTo(x, y - h * .6); c.lineTo(x - w * .2, y - h * .48); c.closePath(); c.fill(); }
  c.restore();
  c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * .25, y - h * .75, x, y - h); c.quadraticCurveTo(x + w * .25, y - h * .75, x + w, y); c.lineWidth = 3; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
}
class GeoMap {
  constructor(data, o = {}) {
    this.d = data; this.x = o.x || 0; this.y = o.y || 0; this.s = o.s || 1; this.key = o.key || ('m' + Math.random());
    this.style = o.style || 'day'; this.rise = {}; this.water = {}; this.dry = !!o.dry;
    this.tf = (mx, my) => [this.x + mx * this.s, this.y + my * this.s];
  }
  P(mx, my) { return [this.x + mx * this.s, this.y + my * this.s]; }
  M(sx, sy) { return [(sx - this.x) / this.s, (sy - this.y) / this.s]; }
  get w() { return 1000 * this.s; } get h() { return this.d.H * this.s; }
  /* capa estática: mar + tierras */
  drawBase(extra) {
    const k = this.key + ':base:' + this.style + ':' + (extra ? extra.key : '');
    blit(k, 0, 0, W, H, c => { this.paintBase(c); if (extra) extra.fn(c); });
  }
  seaCol() { return this.style === 'night' ? ['#1d4f8a', '#153a6b'] : ['#63c9f5', '#3ea5e6']; }
  paintSea(c, x0 = 0, y0 = 0, w = W, h = H) {
    const [a, b] = this.seaCol(); const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(x0, y0, w, h);
    c.strokeStyle = this.style === 'night' ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let yy = y0 + 20; yy < y0 + h; yy += 46) for (let xx = x0 + ((yy / 46) % 2) * 40; xx < x0 + w; xx += 90) { c.beginPath(); c.arc(xx, yy, 9, Math.PI * 1.1, Math.PI * 1.9); c.arc(xx + 18, yy, 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  }
  landPath(c, rings, tf = this.tf) { c.beginPath(); for (const r of rings) ringPath(c, r, tf); }
  paintLand(c, rings, fill, lw = 4, tf = this.tf, shadow = true) {
    if (shadow) { c.save(); c.translate(3, 5); this.landPath(c, rings, tf); c.fillStyle = 'rgba(10,40,90,.28)'; c.fill(); c.restore(); }
    this.landPath(c, rings, tf); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  }
  paintRangePeaks(c, pts, info, tf = this.tf, prog = 1, sc = 1) {
    const step = 16, smp = samplePoly(pts, step).map(p => tf(p[0], p[1]));
    const n = smp.length, s = this.s * sc;
    const list = smp.map(([x, y], i) => { const mid = 1 - Math.abs(i / (n - 1 || 1) - .5) * 1.2; const hh = (22 + 10 * mid) * info.h * s * (0.85 + ((i * 7) % 5) * .06); return { x: x + ((i * 13) % 7 - 3) * s, y: y + ((i * 5) % 3 - 1) * 3 * s, h: hh, i }; });
    list.sort((a, b) => a.y - b.y);
    for (const p of list) { const kk = clamp(prog * 1.4 - (p.i / n) * .4, 0, 1); if (kk <= 0) continue; const e = E.outBack(kk); peak(c, p.x, p.y, p.h * e, p.h * .62, info.col, info.h >= .95 && e > .6); }
  }
  paintRiver(c, pts, w, prog = 1, dry = false, tf = this.tf) {
    const L = polyLen(pts) * this.s;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); ringPathOpen(c, pts, tf);
    if (dry) { c.setLineDash([6, 7]); c.lineWidth = w + 2; c.strokeStyle = 'rgba(140,95,60,.75)'; c.stroke(); c.setLineDash([]); }
    if (prog > 0) {
      c.setLineDash([L * prog, L + 10]);
      c.lineWidth = w + 4; c.strokeStyle = '#1b4e9a'; c.stroke();
      c.lineWidth = w; c.strokeStyle = '#3fa0f5'; c.stroke();
      if (w > 3) { c.lineWidth = Math.max(1.5, w * .35); c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke(); }
    }
    c.restore();
  }
  riverHit(name, sx, sy) { const ls = this.d.rivers[name]; if (!ls) return 1e9; const [mx, my] = this.M(sx, sy); let b = 1e9; for (const l of ls) b = Math.min(b, segDist(mx, my, l)); return b * this.s; }
  riverMid(name) { const l = this.d.rivers[name][0]; const smp = samplePoly(l, polyLen(l) / 2.01); const p = smp[1] || smp[0]; return this.P(p[0], p[1]); }
  riverEnd(name) { const l = this.d.rivers[name][0]; return this.P(l[l.length - 2], l[l.length - 1]); }
  riverStart(name) { const l = this.d.rivers[name][0]; return this.P(l[0], l[1]); }
  rangeMid(name) { const r = this.d.ranges[name]; const smp = samplePoly(r, polyLen(r) / 2.01); const p = smp[1] || smp[0]; return this.P(p[0], p[1]); }
  pt(name) { const p = this.d.pts[name]; return this.P(p[0], p[1]); }
}
function ringPathOpen(c, r, tf) { let p = tf(r[0], r[1]); c.moveTo(p[0], p[1]); for (let i = 2; i < r.length; i += 2) { p = tf(r[i], r[i + 1]); c.lineTo(p[0], p[1]); } }
/* ---------------- ESPAÑA ---------------- */
const INSET = { x: 10, y: 688, s: .225 }; // recuadro de Canarias (abajo a la izquierda, sin tapar el golfo de Cádiz)
const MAIN_RIVERS = ['Duero', 'Tajo', 'Guadiana', 'Guadalquivir', 'Ebro', 'Miño', 'Júcar', 'Segura'];
class MapES extends GeoMap {
  constructor(o = {}) {
    super(GEO.es, o);
    this.inset = INSET; // recuadro de Canarias en unidades del mapa
    this.layers = Object.assign({ meseta: false, subs: false, depr: false, ranges: [], rivers: [], dryRivers: [], climate: false, labels: false, canarias: true, riverW: 1 }, o.layers || {});
  }
  get insetRect() { const i = this.inset; return [this.x + i.x * this.s, this.y + i.y * this.s, 1000 * i.s * this.s, this.d.HC * i.s * this.s]; }
  CP(mx, my) { const i = this.inset; return this.P(i.x + mx * i.s, i.y + my * i.s); }
  cpt(name) { const p = this.d.cpts[name]; return this.CP(p[0], p[1]); }
  paintBase(c) {
    this.paintSea(c);
    const d = this.d;
    this.paintLand(c, d.other, this.style === 'night' ? '#7b86a6' : '#eadcc0', 3);
    this.paintLand(c, d.portugal, this.style === 'night' ? '#a3abc6' : '#f7efd8', 3);
    const landCol = this.style === 'night' ? '#e6d49a' : this.dry ? '#ecdca8' : C.land;
    this.paintLand(c, d.spain, landCol, 4.5);
    // brillo interior (efecto recortable)
    c.save(); this.landPath(c, d.spain); c.clip(); c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke(); c.restore();
    if (this.layers.climate) this.paintClimate(c);
    if (this.layers.meseta) this.paintMeseta(c);
    if (this.layers.depr) this.paintDepr(c);
    // recuadro de Canarias
    if (this.layers.canarias) this.paintCanarias(c, landCol);
    // Portugal y Francia (rótulos suaves)
    if (this.layers.countries !== false) {
      const pp = this.P(95, 420); txt('PORTUGAL', pp[0], pp[1], { size: 15 * this.s / .8, color: 'rgba(80,70,60,.55)', w: 700 });
      const pf = this.P(900, 95); txt('FRANCIA', pf[0], pf[1], { size: 15 * this.s / .8, color: 'rgba(80,70,60,.55)' });
      const pm = this.P(440, 790); txt('MARRUECOS', pm[0], pm[1] - 6, { size: 14 * this.s / .8, color: 'rgba(80,70,60,.55)' });
    }
  }
  paintCanarias(c, landCol) {
    const [x, y, w, h] = this.insetRect;
    c.save(); rrPath(c, x, y, w, h, 12); c.clip(); this.paintSea(c, x, y, w, h); c.restore();
    this.paintLand(c, this.d.canarias, this.layers.climate ? '#ff9ab0' : landCol, 3, (mx, my) => this.CP(mx, my), false);
    rr(x, y, w, h, 12, null, INK, 4);
    txt('Islas Canarias', x + 10, y + 14, { size: 13 * this.s / .8, align: 'left', color: INK, w: 700 });
  }
  paintMeseta(c) {
    const d = this.d;
    if (this.layers.subs) {
      this.fillRings(c, d.subN, '#f0c070', '#d9a650'); this.fillRings(c, d.subS, '#f5cf86', '#dcae5c');
    } else this.fillRings(c, d.meseta, '#f2c678', '#d6a452');
  }
  fillRings(c, rings, fill, stroke, lw = 3, dash) { c.beginPath(); for (const r of rings) ringPath(c, r, this.tf); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; if (dash) c.setLineDash(dash); c.stroke(); c.setLineDash([]); } }
  paintDepr(c) { for (const k in this.d.depr) this.fillRings(c, [this.d.depr[k]], '#a8e07a', '#7cbf52', 3, [8, 6]); }
  paintClimate(c) {
    const d = this.d; c.save(); this.landPath(c, d.spain); c.clip();
    this.fillRings(c, d.spain, '#ffd166'); // mediterráneo
    this.fillRings(c, d.clima.oceanico, '#7fd88a'); this.fillRings(c, d.clima.montana, '#c6a2f5');
    c.restore(); this.landPath(c, d.spain); c.lineWidth = 4.5; c.strokeStyle = INK; c.stroke();
  }
  /* capa de relieve (cordilleras) */
  drawRanges(names, progMap = {}) {
    const c = G.ctx; const animating = names.some(n => (progMap[n] ?? 1) < 1);
    const draw = (cc) => { const all = names.filter(n => this.d.ranges[n]).sort((a, b) => (this.d.ranges[a][1]) - (this.d.ranges[b][1])); for (const n of all) if (this.d.ranges[n]) this.paintRangePeaks(cc, this.d.ranges[n], RANGE_INFO[n], this.tf, progMap[n] ?? 1); if (names.includes('teide')) this.paintTeide(cc); };
    if (animating) draw(c); else blit(this.key + ':r:' + names.join(','), 0, 0, W, H, draw);
  }
  paintTeide(c) { const [x, y] = this.cpt('teide'); peak(c, x, y + 6 * this.s, 34 * this.s, 22 * this.s, '#c87a4c', true); }
  drawRivers(names, o = {}) {
    const c = G.ctx; const key = this.key + ':rv:' + names.join(',') + (o.dry ? ':d' : '');
    const draw = cc => { for (const n of names) { const main = MAIN_RIVERS.includes(n); for (const l of this.d.rivers[n] || []) this.paintRiver(cc, l, (main ? 5 : 3) * this.s / .8 * this.layers.riverW, o.prog ? (o.prog[n] ?? 1) : (o.dry ? 0 : 1), o.dry); } };
    if (o.prog && Object.values(o.prog).some(v => v < 1)) draw(c); else blit(key, 0, 0, W, H, draw);
  }
  label(name, text, o = {}) {
    const [x, y] = o.canarias ? this.cpt(name) : this.pt(name);
    txt(text, x + (o.dx || 0), y + (o.dy || 0), { size: o.size || 16, color: o.color || '#fff', outline: o.outline ?? 5, font: o.font || 'B' });
  }
}
/* ---------------- EUROPA ---------------- */
class MapEU extends GeoMap {
  constructor(o = {}) { super(GEO.eu, o); this.layers = Object.assign({ climate: false }, o.layers || {}); }
  paintBase(c) {
    this.paintSea(c);
    const d = this.d;
    this.paintLand(c, d.other, '#e2d6c0', 3);
    if (this.layers.climate) {
      const cols = { polar: '#eef6ff', oceanico: '#7fd88a', continental: '#cfe57a', mediterraneo: '#ffd166', montana: '#c6a2f5' };
      c.save(); c.translate(3, 5); this.landPath(c, d.europe); c.fillStyle = 'rgba(10,40,90,.28)'; c.fill(); c.restore();
      for (const k in cols) if (d.clima[k]) { this.landPath(c, d.clima[k]); c.fillStyle = cols[k]; c.fill(); }
      this.landPath(c, d.europe); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
    } else this.paintLand(c, d.europe, '#ffe08a', 3.5);
    this.landPath(c, d.lakes); c.fillStyle = this.seaCol()[0]; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  }
  drawRanges(names, progMap = {}) {
    const c = G.ctx; const animating = names.some(n => (progMap[n] ?? 1) < 1);
    const draw = cc => { for (const n of names) this.paintRangePeaks(cc, this.d.ranges[n], RANGE_INFO[n], this.tf, progMap[n] ?? 1, .75); };
    if (animating) draw(c); else blit(this.key + ':r:' + names.join(','), 0, 0, W, H, draw);
  }
  drawRivers(names, o = {}) {
    const c = G.ctx; const key = this.key + ':rv:' + names.join(',');
    const draw = cc => { for (const n of names) for (const l of this.d.rivers[n] || []) this.paintRiver(cc, l, 4 * this.s / .8, o.prog ? (o.prog[n] ?? 1) : 1); };
    if (o.prog && Object.values(o.prog).some(v => v < 1)) draw(c); else blit(key, 0, 0, W, H, draw);
  }
}
/* lat/lon -> coordenadas del mapa de España (misma proyección que tools/geo.py) */
function esLL(lat, lon) {
  const merc = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360)), SX = 1000 / (16.2 * Math.PI / 180);
  return [(lon + 11.2) * Math.PI / 180 * SX, (merc(44.9) - merc(lat)) * SX];
}
