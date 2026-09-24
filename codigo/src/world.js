'use strict';
/* =====================================================================
   MUNDO EXPLORABLE: mapa real a gran escala, cámara, teselas, terreno
   ===================================================================== */
const WS = 4, WSE = 3.2, TILE = 512;
/* ---------- proyecciones (las mismas que tools/geo.py) ---------- */
const PROJ = {
  merc: la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360)),
  esSX: 1000 / (16.2 * Math.PI / 180),
  es(lat, lon) { return [(lon + 11.2) * Math.PI / 180 * this.esSX, (this.merc(44.9) - this.merc(lat)) * this.esSX]; },
  esInv(mx, my) { const lon = -11.2 + mx / this.esSX * 180 / Math.PI; const m = this.merc(44.9) - my / this.esSX; return [(2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180 / Math.PI, lon]; },
  ca(lat, lon) { const sx = 1000 / (5 * Math.PI / 180); const x = (lon + 18.3) * Math.PI / 180 * sx, y = (this.merc(29.5) - this.merc(lat)) * sx; return [INSET.x + x * INSET.s, INSET.y + y * INSET.s]; },
  eu(lat, lon) {
    const l = lon * Math.PI / 180, p = lat * Math.PI / 180, l0 = 20 * Math.PI / 180, p0 = 53 * Math.PI / 180;
    const k = Math.sqrt(2 / (1 + Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0)));
    const X = k * Math.cos(p) * Math.sin(l - l0), Y = -k * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0));
    return [(X + 0.4292079178695641) * 1218.881246407985, (Y + 0.37956574154167383) * 1218.881246407985];
  },
};
/* ---------- el mundo ---------- */
class World {
  constructor(kind, sc) {
    this.kind = kind; const d = kind === 'es' ? GEO.es : GEO.eu; this.d = d;
    this.s = sc || (kind === 'es' ? WS : WSE);
    this.W = 1000 * this.s; this.H = d.H * this.s;
    this.map = kind === 'es' ? new MapES({ x: 0, y: 0, s: this.s, key: 'w' + kind + this.s }) : new MapEU({ x: 0, y: 0, s: this.s, key: 'w' + kind + this.s });
    this.tiles = new Map(); this.ver = 0; this.state = {};
    this.buildGrid();
  }
  /* coordenadas */
  ll(lat, lon) { const [x, y] = this.kind === 'es' ? PROJ.es(lat, lon) : PROJ.eu(lat, lon); return [x * this.s, y * this.s]; }
  cll(lat, lon) { const [x, y] = PROJ.ca(lat, lon); return [x * this.s, y * this.s]; }
  P(mx, my) { return [mx * this.s, my * this.s]; }
  inInset(wx, wy) { if (this.kind !== 'es') return false; const mx = wx / this.s, my = wy / this.s; return mx > INSET.x && mx < INSET.x + 1000 * INSET.s && my > INSET.y && my < INSET.y + GEO.es.HC * INSET.s; }
  /* rejilla de terreno: 0 mar · 1 otra tierra · 2 Portugal · 3 península (España) · 4 islas de España · 5 Canarias */
  buildGrid() { // cada clase de tierra en su propio canal de color: así el antialias de los bordes no confunde clases
    const gw = 1000, gh = Math.ceil(this.d.H); this.gw = gw; this.gh = gh;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh; const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, gw, gh); c.globalCompositeOperation = 'lighter'; return c; };
    const A = mk(), B = mk();
    const fillR = (c, rings, col, tf = (x, y) => [x, y]) => { c.fillStyle = col; for (const r of rings) { c.beginPath(); ringPath(c, r, tf); c.fill(); } };
    if (this.kind === 'es') {
      const d = this.d; fillR(A, d.other, '#ff0000'); fillR(A, d.portugal, '#00ff00');
      const big = d.spain.reduce((a, r) => r.length > a.length ? r : a, []);
      fillR(B, d.spain.filter(r => r !== big), '#ff0000'); fillR(A, [big], '#0000ff');
      for (const c of [A, B]) { c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(INSET.x, INSET.y, 1000 * INSET.s, d.HC * INSET.s); c.globalCompositeOperation = 'lighter'; }
      fillR(B, d.canarias, '#00ff00', (x, y) => [INSET.x + x * INSET.s, INSET.y + y * INSET.s]);
    } else { fillR(A, this.d.other, '#ff0000'); fillR(A, this.d.europe, '#0000ff'); A.globalCompositeOperation = 'source-over'; A.fillStyle = '#000'; A.beginPath(); for (const r of this.d.lakes) ringPath(A, r, (x, y) => [x, y]); A.fill(); }
    const pa = A.getImageData(0, 0, gw, gh).data, pb = B.getImageData(0, 0, gw, gh).data; this.grid = new Uint8Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) { const v = [0, pa[i * 4], pa[i * 4 + 1], pa[i * 4 + 2], pb[i * 4], pb[i * 4 + 1]]; let best = 0, bv = 127; for (let k = 1; k < 6; k++) if (v[k] > bv) { bv = v[k]; best = k; } this.grid[i] = best; }
  }
  terrain(wx, wy) { const x = Math.floor(wx / this.s), y = Math.floor(wy / this.s); if (x < 0 || y < 0 || x >= this.gw || y >= this.gh) return 0; return this.grid[y * this.gw + x]; }
  isLand(wx, wy) { return this.terrain(wx, wy) > 0; }
  snapLand(wx, wy, inward = 14) { // punto de tierra más cercano (para faros y cosas de la costa)
    if (this.isLand(wx, wy)) return [wx, wy];
    for (let r = 6; r < 500; r += 6) for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, x = wx + Math.cos(a) * r, y = wy + Math.sin(a) * r; if (this.isLand(x, y)) return [x + Math.cos(a) * inward, y + Math.sin(a) * inward]; }
    return [wx, wy];
  }
  seaZone(wx, wy) {
    if (this.kind !== 'es') return null;
    if (this.inInset(wx, wy)) return 'atlantico';
    const [lat, lon] = PROJ.esInv(wx / this.s, wy / this.s);
    if (lat > 43.2 && lon > -7.7 && lon < .6) return 'cantabrico';
    if (lon > -5.6) return 'mediterraneo';
    return 'atlantico';
  }
  latlon(wx, wy) { return PROJ.esInv(wx / this.s, wy / this.s); }
  /* ---------- teselas del fondo (mar, tierras, bordes) ---------- */
  invalidate() { this.tiles.clear(); this.ver++; }
  tile(tx, ty) {
    const key = tx + ',' + ty; let t = this.tiles.get(key);
    if (t) { t.used = G.t; return t.cv; }
    if (this.tiles.size > 30) { let old = null; for (const [k, v] of this.tiles) if (!old || v.used < old[1].used) old = [k, v]; this.tiles.delete(old[0]); }
    const rs = Math.min(G.rs, G.low ? 1 : 1.3), cv = document.createElement('canvas'); cv.width = Math.ceil(TILE * rs); cv.height = Math.ceil(TILE * rs);
    const c = cv.getContext('2d'); c.scale(rs, rs); c.translate(-tx * TILE, -ty * TILE);
    const prev = G.ctx; G.ctx = c; try { this.paintTile(c, tx * TILE, ty * TILE); } finally { G.ctx = prev; }
    this.tiles.set(key, { cv, used: G.t }); return cv;
  }
  paintTile(c, x0, y0) {
    const m = this.map, d = this.d;
    const g = c.createLinearGradient(0, y0, 0, y0 + TILE); g.addColorStop(0, '#5ec6f3'); g.addColorStop(1, '#4bb5ec'); c.fillStyle = g; c.fillRect(x0, y0, TILE, TILE);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.lineCap = 'round';
    const sy = Math.floor(y0 / 60) * 60; for (let yy = sy; yy < y0 + TILE + 60; yy += 60) { const off = (yy / 60) % 2 ? 60 : 0; for (let xx = Math.floor(x0 / 120) * 120 + off; xx < x0 + TILE + 120; xx += 120) { c.beginPath(); c.arc(xx, yy, 10, Math.PI * 1.1, Math.PI * 1.9); c.arc(xx + 20, yy, 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
    const cull = r => { let a = 1e9, b = -1e9, e = 1e9, f = -1e9; for (let i = 0; i < r.length; i += 2) { const x = r[i] * this.s, y = r[i + 1] * this.s; if (x < a) a = x; if (x > b) b = x; if (y < e) e = y; if (y > f) f = y; } return b < x0 - 20 || a > x0 + TILE + 20 || f < y0 - 20 || e > y0 + TILE + 20; };
    const land = (rings, fill, lw, tf = m.tf) => { const rs = rings.filter(r => !cull(tf === m.tf ? r : r.map((v, i) => i % 2 ? INSET.y + v * INSET.s : INSET.x + v * INSET.s))); if (!rs.length) return;
      c.save(); c.translate(5, 8); c.beginPath(); for (const r of rs) ringPath(c, r, tf); c.fillStyle = 'rgba(10,40,90,.22)'; c.fill(); c.restore();
      c.beginPath(); for (const r of rs) ringPath(c, r, tf); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
      c.save(); c.clip(); c.lineWidth = 16; c.strokeStyle = 'rgba(255,255,255,.25)'; c.stroke(); c.restore(); };
    if (this.kind === 'es') {
      land(d.other, '#eadcc0', 5); land(d.portugal, '#f4ecd2', 5);
      land(d.spain, this.state.climate ? '#ffd166' : '#ffe08a', 6);
      c.save(); c.beginPath(); for (const r of d.spain) ringPath(c, r, m.tf); c.clip(); this.paintLandDetail(c, x0, y0); c.restore();
      // recuadro de Canarias
      const ix = INSET.x * this.s, iy = INSET.y * this.s, iw = 1000 * INSET.s * this.s, ih = d.HC * INSET.s * this.s;
      if (!(ix > x0 + TILE || ix + iw < x0 || iy > y0 + TILE || iy + ih < y0)) {
        c.save(); c.setLineDash([22, 16]); c.lineWidth = 6; c.strokeStyle = 'rgba(35,25,61,.55)'; rrPath(c, ix, iy, iw, ih, 30); c.stroke(); c.restore();
        land(d.canarias, this.state.climate ? '#ff9ab0' : '#ffe08a', 5, (x, y) => [(INSET.x + x * INSET.s) * this.s, (INSET.y + y * INSET.s) * this.s]);
        txt('ISLAS CANARIAS', ix + 40, iy + 44, { size: 34, font: 'T', align: 'left', color: 'rgba(35,25,61,.45)' });
      }
      const lab = (t, lat, lon, sz) => { const [x, y] = this.ll(lat, lon); if (x > x0 - 400 && x < x0 + TILE + 400 && y > y0 - 100 && y < y0 + TILE + 100) txt(t, x, y, { size: sz, font: 'T', color: 'rgba(90,70,50,.3)' }); };
      lab('PORTUGAL', 39.6, -8.0, 60); lab('FRANCIA', 44.2, 1.5, 70); lab('MARRUECOS', 35.1, -4.5, 60); lab('ÁFRICA', 35.3, -1.0, 44);
    } else {
      land(d.other, '#e2d6c0', 5); land(d.europe, '#ffe08a', 5);
      c.beginPath(); for (const r of d.lakes) ringPath(c, r, m.tf); c.fillStyle = '#5ec6f3'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
      c.save(); c.beginPath(); for (const r of d.europe) ringPath(c, r, m.tf); c.clip(); this.paintLandDetail(c, x0, y0); c.restore();
    }
  }
  paintLandDetail(c, x0, y0) {
    // hierba, arbolitos y casitas repartidos (siempre en el mismo sitio)
    const step = 70;
    for (let gy = Math.floor(y0 / step) * step; gy < y0 + TILE + step; gy += step) for (let gx = Math.floor(x0 / step) * step; gx < x0 + TILE + step; gx += step) {
      let h = (gx * 73856093 ^ gy * 19349663) >>> 0; const r = () => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; };
      const x = gx + r() * step, y = gy + r() * step; if (!this.isLand(x, y)) continue;
      const k = r();
      if (k < .18) { c.fillStyle = 'rgba(120,190,80,.35)'; ell(c, x, y, 16, 7); c.fill(); }
      else if (k < .26) { c.fillStyle = 'rgba(20,10,40,.15)'; ell(c, x, y + 3, 11, 4); c.fill(); circle(x, y - 10, 11, '#79c95a', INK, 3); c.fillStyle = 'rgba(255,255,255,.3)'; circle(x - 3, y - 13, 4, 'rgba(255,255,255,.3)'); }
      else if (k < .29) { rr(x - 9, y - 12, 18, 13, 3, '#fff3dc', INK, 3); c.beginPath(); c.moveTo(x - 12, y - 11); c.lineTo(x, y - 22); c.lineTo(x + 12, y - 11); c.closePath(); fillStroke(c, '#e0634a', 3); }
    }
  }
  drawBase(camX, camY) {
    const c = G.ctx; const x0 = camX - W / 2, y0 = camY - H / 2;
    const tx0 = Math.floor(x0 / TILE), ty0 = Math.floor(y0 / TILE), tx1 = Math.floor((x0 + W) / TILE), ty1 = Math.floor((y0 + H) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { const cv = this.tile(tx, ty); c.drawImage(cv, tx * TILE - x0, ty * TILE - y0, TILE + .5, TILE + .5); }
    // pre-generar una tesela vecina por fotograma
    if (!this._pre) this._pre = 0; const ring = [[tx0 - 1, ty0], [tx1 + 1, ty0], [tx0, ty0 - 1], [tx0, ty1 + 1], [tx1 + 1, ty1], [tx0 - 1, ty1]];
    const n = ring[this._pre++ % ring.length]; if (n[0] >= 0 && n[1] >= 0 && n[0] * TILE < this.W && n[1] * TILE < this.H && !this.tiles.has(n[0] + ',' + n[1])) this.tile(n[0], n[1]);
  }
}
/* ---------- geometría útil ---------- */
function polyDist(px, py, pts, s) { let b = 1e9; for (let i = 2; i < pts.length; i += 2) { const ax = pts[i - 2] * s, ay = pts[i - 1] * s, bx = pts[i] * s, by = pts[i + 1] * s; const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1; let k = ((px - ax) * dx + (py - ay) * dy) / L2; k = clamp(k, 0, 1); b = Math.min(b, Math.hypot(px - ax - dx * k, py - ay - dy * k)); } return b; }
function polyProj(px, py, pts, s) { // devuelve la fracción del recorrido más cercana y la distancia
  let L = 0, best = { d: 1e9, at: 0 }; const segs = [];
  for (let i = 2; i < pts.length; i += 2) { const l = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]) * s; segs.push(l); L += l; }
  let acc = 0;
  for (let i = 2, j = 0; i < pts.length; i += 2, j++) { const ax = pts[i - 2] * s, ay = pts[i - 1] * s, bx = pts[i] * s, by = pts[i + 1] * s; const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1; let k = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1); const d = Math.hypot(px - ax - dx * k, py - ay - dy * k); if (d < best.d) best = { d, at: (acc + segs[j] * k) / L }; acc += segs[j]; }
  return best;
}
function polyPointAt(pts, s, f) { let L = 0; const segs = []; for (let i = 2; i < pts.length; i += 2) { const l = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]); segs.push(l); L += l; } let target = f * L; for (let i = 2, j = 0; i < pts.length; i += 2, j++) { if (target <= segs[j] || j === segs.length - 1) { const k = segs[j] ? clamp(target / segs[j], 0, 1) : 0; return [(pts[i - 2] + (pts[i] - pts[i - 2]) * k) * s, (pts[i - 1] + (pts[i + 1] - pts[i - 1]) * k) * s]; } target -= segs[j]; } return [pts[0] * s, pts[1] * s]; }
function inPolyW(px, py, ring, s) { return pointInPoly(px / s, py / s, ring); }
/* ---------- montañas: aplastadas o levantadas ---------- */
function rangePeaks(pts, info) {
  const smp = samplePoly(pts, 7); const n = smp.length;
  return smp.map(([x, y], i) => { const mid = 1 - Math.abs(i / (n - 1 || 1) - .5) * 1.2; let hh = (mid * .4 + .6) * info.h; hh *= .8 + ((i * 7) % 5) * .08; return { mx: x + ((i * 13) % 7 - 3) * .8, my: y + ((i * 5) % 3 - 1) * 2.2, h: hh, i, n }; });
}
function drawRangeW(w, cam, key, prog, info, flatAlpha = 1) {
  const c = G.ctx, pts = w.d.ranges[key]; if (!pts) return;
  const peaks = w._peaks || (w._peaks = {}); const list = peaks[key] || (peaks[key] = rangePeaks(pts, info).sort((a, b) => a.my - b.my));
  const s = w.s, ox = cam[0] - W / 2, oy = cam[1] - H / 2;
  for (const p of list) {
    const x = p.mx * s - ox, y = p.my * s - oy; if (x < -120 || x > W + 120 || y < -60 || y > H + 200) continue;
    const kk = clamp(prog * 1.5 - (p.i / p.n) * .5, 0, 1);
    const hh = 26 * s * .62 * p.h, ww = hh * .62;
    if (kk <= 0) { if (flatAlpha > 0) { c.globalAlpha = .55 * flatAlpha; c.fillStyle = shade(info.col, .15); ell(c, x, y - 3, ww * 1.05, 9); c.fill(); c.strokeStyle = shade(info.col, -.25); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - ww * .8, y - 3); c.quadraticCurveTo(x, y - 9, x + ww * .8, y - 3); c.stroke(); c.globalAlpha = 1; } continue; }
    const e = E.outBack(kk); peak(c, x, y, hh * e, ww * (1 + (1 - e) * .3), info.col, info.h >= .95 && e > .6);
  }
}
/* ---------- ríos (secos o con agua hasta cierto punto) ---------- */
function partialPts(pts, prog) {
  if (prog >= 1) return pts; let L = 0; const seg = []; for (let i = 2; i < pts.length; i += 2) { const l = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]); seg.push(l); L += l; }
  const out = [pts[0], pts[1]]; let tgt = prog * L;
  for (let i = 2, j = 0; i < pts.length; i += 2, j++) { if (tgt >= seg[j]) { out.push(pts[i], pts[i + 1]); tgt -= seg[j]; } else { const k = seg[j] ? tgt / seg[j] : 0; out.push(pts[i - 2] + (pts[i] - pts[i - 2]) * k, pts[i - 1] + (pts[i + 1] - pts[i - 1]) * k); break; } }
  return out;
}
function drawRiverW(w, cam, pts, width, prog, dry, flowT = 0) {
  const c = G.ctx, s = w.s, ox = cam[0] - W / 2, oy = cam[1] - H / 2;
  const tf = (x, y) => [x * s - ox, y * s - oy];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (dry) { c.beginPath(); ringPathOpen(c, pts, tf); c.setLineDash([10, 12]); c.lineWidth = width + 4; c.strokeStyle = 'rgba(140,95,60,.75)'; c.stroke(); c.setLineDash([]); }
  if (prog > 0) {
    const pp = partialPts(pts, prog); if (pp.length >= 4) {
      c.beginPath(); ringPathOpen(c, pp, tf);
      c.lineWidth = width + 6; c.strokeStyle = '#1b4e9a'; c.stroke();
      c.lineWidth = width; c.strokeStyle = '#3fa0f5'; c.stroke();
      if (!G.low) { c.setLineDash([14, 26]); c.lineDashOffset = -flowT * 70; c.lineWidth = Math.max(2, width * .3); c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke(); }
    }
  }
  c.restore();
}
