'use strict';
/* =====================================================================
   CAPÍTULOS: lo que hay que hacer en el mapa en cada uno
   ===================================================================== */
const marTxt = k => MARES[k].replace(/^Mar /, 'mar ').replace(/^Océano /, 'océano ');
const RANGE_COL = { pirineos: '#bb7f52', cantabrica: '#b8784c', iberico: '#c98c5a', central: '#c4865a', penibetico: '#bf8254', subbetico: '#c7925f', leon: '#c49060', galaico: '#b99566', vascos: '#c08c5c', catalana: '#c9966a', toledo: '#c9a070', morena: '#b98a5e', tramontana: '#c49060' };
const SYLLABUS_RANGES = ['pirineos', 'cantabrica', 'iberico', 'central', 'penibetico', 'subbetico'];
const NAME_SPOT = { peninsula: [39.5, -5.0], cantabrico: [44.05, -4.6], atlantico: [40.3, -10.2], mediterraneo: [37.3, 0.9], baleares: [40.35, 3.4], canarias: 'inset' };
function worldStateBefore(idx) {
  const s = { names: {}, rise: {}, meseta: 0, depr: null, rivers: {}, north: {}, lights: {}, costas: {}, stations: {} };
  if (idx > 0) for (const n of NOMBRES) s.names[n.id] = true;
  if (idx > 1) { for (const k of Object.keys(GEO.es.ranges)) s.rise[k] = 1; s.meseta = 1; s.depr = true; }
  if (idx > 2) { for (const r of RIOS) s.rivers[r.id] = 1; for (const r of RIOS_NORTE) s.north[r] = 1; }
  if (idx > 3) { s.lights.finisterre = 1; s.costas = { cadiz: 1, estrecho: 1, delta: 1 }; }
  if (idx > 4) for (const e of ESTACIONES) s.stations[e.id] = 1;
  return s;
}
class ChBase {
  constructor(play) { this.p = play; this.w = play.world; this.st = play.world.state; this.enemies = [0, 2, 4]; this.music = 'region'; const s0 = this.w.ll(40.42, -3.7); this.start = [s0[0], s0[1] + 150]; }
  ll(lat, lon) { return this.w.ll(lat, lon); }
  cll(lat, lon) { return this.w.cll(lat, lon); }
  spot(id) { const v = NAME_SPOT[id]; if (v === 'inset') return this.cll(29.2, -15.2); return this.ll(v[0], v[1]); }
  makeEnemy(k) { const sp = this.enemySpots ? this.enemySpots[k % this.enemySpots.length] : [40 + rnd(-2, 2), -4 + rnd(-3, 3)]; const [cx, cy] = sp.length > 2 ? this.cll(sp[0], sp[1]) : this.ll(sp[0], sp[1]); return { x: cx, y: cy, cx, cy, r: rnd(120, 260), w: rnd(.3, .6), ph: rnd(TAU), t: 0, sp: Game.d(80, 110, 140), chase: Game.d(170, 230, 290), dir: 1 }; }
  update() { } action() { return null; } objective() { return ''; } target() { return null; }
  weatherAt(x, y) {
    const st = this.st;
    for (const e of ESTACIONES) { const [ex, ey] = e.cat ? this.cll(e.cat[0], e.cat[1]) : this.ll(e.at[0], e.at[1]); if (dist(x, y, ex, ey) < 520) return st.stations[e.id] ? { oceanico: 'lluvia', montana: 'nieve', subtropical: 'calor', mediterraneo: 'sol' }[e.clima] : (this.crazy ? e.loco : null); }
    return null;
  }
  /* ---------- lo que ya está arreglado (debajo de los personajes) ---------- */
  drawUnder(c, cam) {
    const w = this.w, st = this.st;
    if (w.kind !== 'es') return;
    // Meseta levantada
    if (st.meseta > 0) { const k = st.meseta, ox = cam[0] - W / 2, oy = cam[1] - H / 2, tf = (x, y) => [x * w.s - ox, y * w.s - oy - 10 * k];
      c.save(); c.beginPath(); for (const r of GEO.es.meseta) ringPath(c, r, (x, y) => [x * w.s - ox, y * w.s - oy + 4]); c.fillStyle = `rgba(150,100,50,${.35 * k})`; c.fill();
      c.beginPath(); for (const r of GEO.es.meseta) ringPath(c, r, tf); c.fillStyle = `rgba(240,195,110,${.75 * k})`; c.fill(); c.lineWidth = 4; c.strokeStyle = `rgba(180,120,50,${k})`; c.setLineDash([16, 10]); c.stroke(); c.restore(); }
    if (st.depr) { const ox = cam[0] - W / 2, oy = cam[1] - H / 2; c.save(); c.beginPath(); ringPath(c, GEO.es.depr.ebro, (x, y) => [x * w.s - ox, y * w.s - oy]); c.fillStyle = 'rgba(140,210,100,.45)'; c.fill(); c.setLineDash([14, 10]); c.lineWidth = 4; c.strokeStyle = '#6fb548'; c.stroke(); c.restore(); }
    // ríos
    for (const r of RIOS) { const v = st.rivers[r.id] || 0; drawRiverW(w, cam, GEO.es.rivers[r.id][0], 10, v, v < 1, this.p.flowT); }
    for (const r of RIOS_NORTE) { const v = st.north[r] || 0; drawRiverW(w, cam, GEO.es.rivers[r][0], 6, v, v < 1, this.p.flowT * 1.8); }
    // cordilleras: las del temario (aplastadas o levantadas) y el resto, siempre aplastadas
    for (const k of Object.keys(GEO.es.ranges)) { const info = { h: (RANGE_INFO[k] || { h: .8 }).h, col: RANGE_COL[k] || '#c98c5a' }; drawRangeW(w, cam, k, st.rise[k] || 0, info, SYLLABUS_RANGES.includes(k) ? 1 : .5); }
  }
  /* ---------- objetos con altura (se ordenan con los personajes) ---------- */
  entities(ents, cam) {
    const w = this.w, st = this.st, S = (x, y) => this.p.toScreen(x, y);
    if (w.kind !== 'es') return;
    // el cole (Madrid)
    const [cx, cy] = this.ll(40.42, -3.7); ents.push({ y: cy, d: () => { const [x, y] = S(cx, cy); if (x > -200 && x < W + 200 && y > -100 && y < H + 250) drawSchool(x, y); } });
    // el Teide
    const [tx, ty] = this.cll(28.27, -16.64); if (!this.hideTeide) ents.push({ y: ty, d: () => { const [x, y] = S(tx, ty); if (x > -300 && x < W + 300 && y > -100 && y < H + 300) drawTeide(x, y + 10, this.teideS || .42, { expr: this.teideExpr || 'happy' }); } });
    // carteles puestos
    if (!this.hideSigns) for (const id in st.names) if (st.names[id]) { const n = NOMBRES.find(n => n.id === id); const [x0, y0] = Array.isArray(st.names[id]) ? st.names[id] : this.spot(id); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); if (x > -200 && x < W + 200 && y > -60 && y < H + 100) drawSign(x, y, n.name, { size: 24, col: '#fff', glow: false }); } }); }
    if (st.depr) { const [x0, y0] = Array.isArray(st.depr) ? st.depr : this.ll(41.75, -0.6); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); drawSign(x, y, 'Depresión del Ebro', { size: 20 }); } }); }
    if (st.lights.finisterre) { const [x0, y0] = this.w.snapLand(...this.ll(42.88, -9.27)); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); drawLighthouse(x, y, .7, true, { ph: 1 }); } }); }
    if (!this.hideSigns) for (const id of ['cadiz', 'delta', 'estrecho']) if (st.costas[id]) { const it = COSTAS.find(c => c.id === id); const at = Array.isArray(st.costas[id]) ? st.costas[id] : (it.zone ? this.ll(...it.zone.at) : this.ll(...it.at)); ents.push({ y: at[1], d: () => { const [x, y] = S(at[0], at[1]); if (id !== 'estrecho') drawBuoy(x, y, 1, true); drawSign(x, y - (id !== 'estrecho' ? 40 : 0), cap(it.name.replace(/^el /, '')), { size: 18, stick: id === 'estrecho' }); } }); }
    for (const e of ESTACIONES) if (!this.hideStations && (st.stations[e.id] || this.showStations)) { const [x0, y0] = e.cat ? this.cll(...e.cat) : this.ll(...e.at); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); if (x > -150 && x < W + 150 && y > -50 && y < H + 250) { drawStation(x, y, 1, { ok: !!st.stations[e.id], icon: CLIMAS[e.clima] && { oceanico: 'lluvia', montana: 'nieve', subtropical: 'calor', mediterraneo: 'sol' }[e.clima] }); if (st.stations[e.id]) chip(CLIMAS[e.clima].name, x, y + 26, CLIMAS[e.clima].col, '#fff', 16); } } }); }
  }
}
function drawSchool(x, y) {
  const c = G.ctx; c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(20,10,40,.25)'; ell(c, 0, 4, 110, 18); c.fill();
  rr(-95, -90, 190, 92, 8, '#ffcf8a', INK, 5); c.beginPath(); c.moveTo(-108, -88); c.lineTo(0, -142); c.lineTo(108, -88); c.closePath(); fillStroke(c, '#e0634a', 5);
  for (let i = 0; i < 4; i++) rr(-80 + i * 44, -74, 30, 26, 4, '#bfeaff', INK, 3); rr(-18, -40, 36, 42, 6, '#8a5a3a', INK, 4);
  circle(0, -110, 13, '#fff', INK, 3.5); c.lineWidth = 3; c.beginPath(); c.moveTo(0, -110); c.lineTo(0, -118); c.moveTo(0, -110); c.lineTo(6, -110); c.stroke();
  rr(-50, -164, 100, 26, 8, '#fff8ea', INK, 3.5); txt('EL COLE', 0, -150, { size: 18, font: 'T', color: '#e0634a' });
  c.restore();
}
/* ---------- utilidad: carteles sueltos por el suelo ---------- */
class SignsMixin {
  static place(ch, list, around, radius) { // los reparte en tierra alrededor de un punto
    return list.map((it, i) => { let x, y, tries = 0; do { const a = i / list.length * TAU + rnd(-.3, .3), r = rnd(radius * .45, radius); x = around[0] + Math.cos(a) * r; y = around[1] + Math.sin(a) * r * .8; tries++; } while (!ch.w.isLand(x, y) && tries < 40); return { it, x, y, state: 'ground', bob: rnd(TAU) }; });
  }
}
/* =====================================================================
   CAPÍTULO 1 · LOS NOMBRES VOLADOS
   ===================================================================== */
class Ch1 extends ChBase {
  constructor(p) {
    super(p); this.title = 'Los nombres volados'; this.enemies = [0, 1, 2]; this.enemySpots = [[38.8, -1.5], [41.8, -6.2], [37.6, -4.8]];
    this.signs = SignsMixin.place(this, shuffle(NOMBRES), this.start, 380);
    this.signs.forEach(s => s.label = s.it.name);
    for (const n of NOMBRES) this.st.names[n.id] = false;
  }
  update() {
    for (const p of this.p.players) { if (p.carry || p.flat > 0) continue; for (const s of this.signs) if (s.state === 'ground' && dist(p.x, p.y, s.x, s.y) < 55) { s.state = 'carried'; p.carry = s; s.by = p; Sound.sfx('pop'); break; } }
  }
  dropped(s, x, y) { s.state = 'ground'; s.x = x; s.y = y; s.by = null; }
  action(p) { if (p.carry) return { label: 'SOLTAR', fn: () => this.drop(p) }; return null; }
  inZone(z, p) {
    const w = this.w;
    if (z.type === 'land') return p.mode === 'walk' && [2, 3].includes(w.terrain(p.x, p.y));
    if (z.type === 'sea') return p.mode === 'boat' && w.seaZone(p.x, p.y) === z.sea;
    if (z.type === 'circle') { const [cx, cy] = this.ll(...z.at); return dist(p.x, p.y, cx, cy) < z.r * w.s; }
    if (z.type === 'inset') return w.inInset(p.x, p.y);
    if (z.type === 'depr') return inPolyW(p.x, p.y, GEO.es.depr[z.depr], w.s);
  }
  where(p) { const w = this.w; if (w.inInset(p.x, p.y)) return 'las islas Canarias'; if (p.mode === 'boat') return MARES[w.seaZone(p.x, p.y)].replace(/^Mar /, 'el mar ').replace(/^Océano /, 'el océano '); const t = w.terrain(p.x, p.y); return t === 3 ? 'la península Ibérica' : t === 2 ? 'Portugal, en la península Ibérica' : t === 4 ? 'una isla' : 'fuera de España'; }
  drop(p) {
    const s = p.carry, it = s.it;
    if (this.inZone(it.zone, p)) {
      p.carry = null; s.state = 'planted'; s.x = p.x; s.y = p.y + 4; this.st.names[it.id] = [s.x, s.y];
      this.p.win(...this.p.toScreen(p.x, p.y - 80), 'nom_' + it.id); Sound.sfx('fanfare'); this.p.showBanner(it.name, '¡En su sitio!', 1.4, '#7ce05c');
      if (this.signs.every(x => x.state === 'planted')) later(1.6, () => this.p.say([{ who: 'rosa', face: 'proud', text: '¡Todos los nombres en su sitio! La península, los tres mares y las islas. ¡Así sí se entiende el mapa!' }], () => this.p.finish()));
    } else {
      this.p.fail(...this.p.toScreen(p.x, p.y - 60), 'nom_' + it.id, null, it.name + ': ' + it.hint.split('.')[0] + '.');
      this.p.say([{ who: 'rosa', face: 'worried', text: 'Aquí no: estás en ' + this.where(p) + '. ' + it.hint }]);
    }
  }
  objective() { const left = this.signs.filter(s => s.state !== 'planted').length; const c = this.p.players.find(p => p.carry); return c ? 'Lleva «' + c.carry.it.name + '» a su sitio y pulsa SOLTAR.' : 'Coge un cartel del suelo. Quedan ' + left + '.'; }
  hint() { const c = this.p.players.find(p => p.carry); return c ? c.carry.it.hint : 'Los carteles están por el suelo, cerca del cole. ¡Pasa por encima para cogerlos!'; }
  target() { const c = this.p.players.find(p => p.carry); if (c) return this.spot(c.carry.it.id); const g = this.signs.find(s => s.state === 'ground'); return g ? [g.x, g.y] : null; }
  entities(ents, cam) { super.entities(ents, cam); for (const s of this.signs) if (s.state === 'ground') ents.push({ y: s.y, d: () => { const [x, y] = this.p.toScreen(s.x, s.y); drawSign(x, y + Math.sin(G.t * 3 + s.bob) * 3, s.it.name, { size: 20, glow: true }); } }); }
}
/* =====================================================================
   CAPÍTULO 2 · LAS ARRUGAS
   ===================================================================== */
class Ch2 extends ChBase {
  constructor(p) {
    super(p); this.title = 'Las arrugas'; this.enemies = [0, 2, 3]; this.enemySpots = [[41.2, -2.0], [39.0, -4.5], [42.3, -5.5], [37.8, -2.5]];
    for (const k of SYLLABUS_RANGES) this.st.rise[k] = 0; this.st.meseta = 0; this.st.depr = null;
    this.list = shuffle(RELIEVE.map(r => ({ ...r, kind: 'range' }))).concat([{ ...DEPRESION, kind: 'depr' }, { id: 'teide', kind: 'teide', name: 'el Teide' }]);
    this.i = 0;
  }
  get cur() { return this.list[this.i]; }
  begin() { this.next(true); }
  next(first) { const c = this.cur; if (!c) return; if (c.kind === 'depr') { const p = this.p.players[0]; p.carry = { it: DEPRESION, name: DEPRESION.name, label: DEPRESION.name }; if (!first) this.p.say([{ who: 'rosa', face: 'talk', text: 'Toma este cartel: «Depresión del Ebro». Una depresión es una zona baja. Llévalo a su sitio.' }]); } if (c.kind === 'teide') this.p.say([{ who: 'rosa', face: 'happy', text: '¡Relieve arreglado! Solo falta una visita: el único pico que la plancha no pudo aplastar. Id a ver al Teide, en Canarias.' }]); }
  candidate(p) { // qué arruga hay debajo del jugador (si la que buscamos está a mano, gana ella)
    const w = this.w, cur = this.cur, near = [];
    for (const r of RELIEVE) if (r.keys && !r.keys.every(k => this.st.rise[k] >= 1)) { let d = 1e9; for (const k of r.keys) d = Math.min(d, polyDist(p.x, p.y, GEO.es.ranges[k], w.s)); if (d < 80) near.push([d, r]); }
    if (this.st.meseta < 1 && inPolyW(p.x, p.y, GEO.es.meseta[0], w.s)) near.push([79, RELIEVE.find(r => r.id === 'meseta')]);
    if (near.some(n => n[1] === cur)) return cur;
    if (near.length) return near.sort((a, b) => a[0] - b[0])[0][1];
    for (const k of ['leon', 'galaico', 'vascos', 'catalana', 'toledo', 'morena']) if (polyDist(p.x, p.y, GEO.es.ranges[k], w.s) < 60) return { other: k };
    return null;
  }
  action(p) {
    const c = this.cur; if (!c) return null;
    if (c.kind === 'range') { const cand = this.candidate(p); if (cand && p.mode === 'walk') return { label: '¡LEVANTAR!', col: '#c98c5a', fn: () => this.raise(p, cand) }; return null; }
    if (c.kind === 'depr' && p.carry) return { label: 'SOLTAR', fn: () => this.dropDepr(p) };
    return null;
  }
  raise(p, cand) {
    const c = this.cur, [sx, sy] = this.p.toScreen(p.x, p.y - 60);
    if (cand.other) { this.p.fail(sx, sy, 'rel_' + c.id, null, cap(c.name) + ': ' + c.hint); this.p.say([{ who: 'rosa', face: 'worried', text: 'Esa arruga es de unas montañas que no buscamos ahora. ' + c.hint }]); return; }
    if (cand.id === c.id) {
      if (c.keys) for (const k of c.keys) tw(this.st.rise, { [k]: 1 }, 1.6, { ease: E.lin }); else tw(this.st, { meseta: 1 }, 1.4);
      Sound.sfx('rumble'); shake(10, 1); later(.3, () => Sound.sfx('rise')); this.p.win(sx, sy, 'rel_' + c.id); this.p.showBanner(cap(c.name), c.fact, 2, '#c98c5a');
      this.i++; later(2.2, () => this.next());
    } else { this.p.fail(sx, sy, 'rel_' + c.id, null, cap(c.name) + ': ' + c.hint); this.p.say([{ who: 'rosa', face: 'worried', text: '¡Esa no! Debajo de ti está ' + cand.name + '. Buscamos ' + c.name + '. ' + c.hint }]); }
  }
  dropDepr(p) {
    if (inPolyW(p.x, p.y, GEO.es.depr.ebro, this.w.s)) { p.carry = null; this.st.depr = [p.x, p.y + 4]; this.p.win(...this.p.toScreen(p.x, p.y - 80), 'depr'); Sound.sfx('fanfare'); this.p.showBanner('Depresión del Ebro', 'Una zona baja entre montañas', 1.8, '#7ce05c'); this.i++; later(2, () => this.next()); }
    else { this.p.fail(...this.p.toScreen(p.x, p.y - 60), 'depr', null, 'Depresión del Ebro: entre los Pirineos y el Sistema Ibérico.'); this.p.say([{ who: 'rosa', face: 'worried', text: 'Aquí no es. ' + DEPRESION.hint }]); }
  }
  dropped(it, x, y) { this.loose = { it, x, y }; }
  update() {
    if (this.loose) for (const p of this.p.players) if (!p.carry && p.flat <= 0 && dist(p.x, p.y, this.loose.x, this.loose.y) < 55) { p.carry = this.loose.it; this.loose = null; Sound.sfx('pop'); break; }
    const c = this.cur;
    if (c && c.kind === 'teide' && !this.teideDone && !this.others) { this.others = true; for (const k of Object.keys(GEO.es.ranges)) if (!SYLLABUS_RANGES.includes(k)) tw(this.st.rise, { [k]: 1 }, 2.5); }
    if (c && c.kind === 'teide' && !this.teideDone) { const [tx, ty] = this.cll(28.27, -16.64); if (this.p.players.some(p => dist(p.x, p.y, tx, ty) < 170)) { this.teideDone = true; this.teideExpr = 'proud'; Sound.sfx('fanfare'); this.p.win(...this.p.toScreen(tx, ty - 100), 'teide', true); this.p.say(GUION.teide.concat([{ who: 'rosa', face: 'proud', text: '¡El relieve de España vuelve a estar en pie! Meseta, cordilleras, depresión… ¡y el Teide, el más alto!' }]), () => this.p.finish()); } }
  }
  objective() { const c = this.cur; if (!c) return ''; if (c.kind === 'range') return 'Busca ' + c.name + ' y pulsa ¡LEVANTAR!'; if (c.kind === 'depr') return this.loose ? '¡Se te ha caído el cartel! Vuelve a cogerlo.' : 'Lleva el cartel a la depresión del Ebro y pulsa SOLTAR.'; return 'Visita al Teide, en las islas Canarias.'; }
  hint() { const c = this.cur; return c ? (c.hint || 'El Teide está en Tenerife, en las islas Canarias. Tendrás que ir en barco hasta el recuadro de abajo a la izquierda.') : null; }
  target() { const c = this.cur; if (!c) return null; if (this.loose) return [this.loose.x, this.loose.y]; if (c.kind === 'range') { if (c.area) return this.ll(40.0, -4.3); return this.w.map.rangeMid(c.keys[0]); } if (c.kind === 'depr') return this.ll(41.75, -0.6); return this.cll(28.27, -16.64); }
  entities(ents, cam) { super.entities(ents, cam); if (this.loose) { const l = this.loose; ents.push({ y: l.y, d: () => { const [x, y] = this.p.toScreen(l.x, l.y); drawSign(x, y, l.it.name, { size: 20, glow: true }); } }); } }
}
/* =====================================================================
   CAPÍTULO 3 · RÍOS SIN AGUA
   ===================================================================== */
class Ch3 extends ChBase {
  constructor(p) {
    super(p); this.title = 'Ríos sin agua'; this.enemies = [1, 2, 4]; this.enemySpots = [[41.4, -4.5], [39.9, -5.8], [41.9, -1.5], [40.2, -2.4]];
    for (const r of RIOS) this.st.rivers[r.id] = 0; for (const r of RIOS_NORTE) this.st.north[r] = 0;
    this.list = shuffle(RIOS).concat([{ id: 'norte' }]); this.i = 0; this.phase = 'fuente';
    this.springs = RIOS.map(r => ({ sys: r.nace, river: r.id, at: this.ll(...r.source), on: false })).concat(FUENTES_FALSAS.map(f => ({ sys: f[2], at: this.ll(f[0], f[1]), on: false })));
  }
  get cur() { return this.list[this.i]; }
  begin() { this.startRiver(); }
  startRiver() { const c = this.cur; this.phase = c.id === 'norte' ? 'norte' : 'fuente'; this.prog = 0; if (c.id === 'norte') this.p.say([{ who: 'rosa', face: 'talk', text: '¡Tres ríos grandes arreglados! Ahora los ríos pequeños del NORTE, los que van al mar Cantábrico. Pasad por encima de sus cauces.' }]); }
  near(p) { let b = null, bd = 90; for (const s of this.springs) { const d = dist(p.x, p.y, s.at[0], s.at[1]); if (d < bd && !s.used) { bd = d; b = s; } } return b; }
  action(p) { if (this.phase === 'fuente') { const s = this.near(p); if (s) return { label: 'ABRIR FUENTE', col: '#3e8ef0', fn: () => this.open(p, s) }; } return null; }
  open(p, s) {
    const c = this.cur, [sx, sy] = this.p.toScreen(s.at[0], s.at[1] - 60), sysName = RELIEVE.find(r => r.id === s.sys).name;
    if (s.sys === c.nace) {
      const real = this.springs.find(x => x.river === c.id); real.on = true; real.used = true;
      this.p.win(sx, sy, 'nace_' + c.id); Sound.sfx('splash');
      const txt2 = s === real ? '¡Sí! El ' + c.id + ' nace en ' + c.naceTxt + '. Ahora llevad el agua por su cauce seco hasta el mar.' : '¡Sí! El ' + c.id + ' nace en ' + c.naceTxt + '. Su fuente es esa de al lado, ¡ya sale el agua! Seguid su cauce hasta el mar.';
      this.p.say([{ who: 'rosa', face: 'happy', text: txt2 }]); this.phase = 'agua'; this.prog = .01; this.st.rivers[c.id] = .01;
    } else { this.p.fail(sx, sy, 'nace_' + c.id, null, 'El ' + c.id + ' nace en ' + c.naceTxt + '.'); s.dry = G.t; this.p.say([{ who: 'rosa', face: 'worried', text: 'Esta fuente está en ' + sysName + ' y está seca. El ' + c.id + ' no nace aquí. ' + c.hint.split('.')[0] + '.' }]); }
  }
  update(dt) {
    const c = this.cur; if (!c) return;
    if (this.phase === 'agua') {
      const pts = GEO.es.rivers[c.id][0];
      for (const p of this.p.players) { const pr = polyProj(p.x, p.y, pts, this.w.s); if (pr.d < 110 && pr.at > this.prog - .06 && pr.at < this.prog + .25) this.prog = Math.max(this.prog, Math.min(1, pr.at + .02)); }
      this.st.rivers[c.id] = lerp(this.st.rivers[c.id], this.prog, Math.min(1, dt * 4));
      if (this.prog >= .985 && !this.asked) { this.asked = true; this.st.rivers[c.id] = 1; Sound.sfx('splash'); const [ex, ey] = this.p.toScreen(...polyPointAt(pts, this.w.s, 1)); burst(ex, ey, { n: 30, c: ['#5cc2f5', '#fff'] });
        this.p.ask({ id: 'mar_' + c.id, q: '¡El agua ha llegado al mar! ¿Dónde desemboca el ' + c.id + '?', opts: shuffle(Object.values(MARES)), a: MARES[c.mar], hint: c.hint, miss: 'El ' + c.id + ' nace en ' + c.naceTxt + ' y desemboca en el ' + marTxt(c.mar) + '.', then: () => { this.phase = 'wait'; this.p.showBanner('Río ' + c.id, 'Nace en ' + c.naceTxt + ' y desemboca en el ' + marTxt(c.mar), 2.4, '#3e8ef0'); this.i++; this.asked = false; later(2.2, () => this.startRiver()); } }); }
    }
    if (this.phase === 'norte') {
      for (const r of RIOS_NORTE) if (!this.st.north[r]) { const pts = GEO.es.rivers[r][0]; if (this.p.players.some(p => polyDist(p.x, p.y, pts, this.w.s) < 70)) { tw(this.st.north, { [r]: 1 }, .7, { ease: E.lin }); this.st.north[r] = .01; Sound.sfx('splash'); const [x, y] = this.p.toScreen(...polyPointAt(pts, this.w.s, .5)); pop(x, y - 40, '¡' + r + '!', '#3ec1f3', 34); } }
      if (RIOS_NORTE.every(r => this.st.north[r]) && !this.asked) { this.asked = true; later(1, () => this.p.ask({ id: 'norte', q: '¡Qué deprisa se han llenado! ¿Cómo son los ríos del norte?', opts: shuffle(['Cortos, rápidos y caudalosos', 'Largos, lentos y con poca agua', 'Largos, rápidos y sin agua']), a: 'Cortos, rápidos y caudalosos', hint: 'Los ríos del norte nacen muy cerca del mar, en la Cordillera Cantábrica: por eso son cortos y bajan rápidos. Y como allí llueve mucho, llevan mucha agua: son caudalosos.', miss: 'Ríos del norte: cortos, rápidos y caudalosos.', then: () => this.p.say([{ who: 'rosa', face: 'proud', text: '¡Todos los ríos vuelven a correr! El Duero y el Tajo al Atlántico, el Ebro al Mediterráneo y los del norte al Cantábrico.' }], () => this.p.finish()) })); }
    }
  }
  objective() { const c = this.cur; if (!c) return ''; if (this.phase === 'wait') return '¡Río arreglado!'; if (this.phase === 'fuente') return 'El ' + c.id + ' está seco. ¿En qué montañas nace? Busca su fuente y ábrela.'; if (this.phase === 'agua') return 'Lleva el agua del ' + c.id + ' por su cauce seco hasta el mar (' + Math.round(this.prog * 100) + ' %).'; return 'Pasa por encima de los ríos cortos del norte (' + RIOS_NORTE.filter(r => this.st.north[r]).length + ' de ' + RIOS_NORTE.length + ').'; }
  hint() { const c = this.cur; if (!c) return null; if (this.phase === 'fuente') return c.hint.split('.')[0] + '.'; if (this.phase === 'agua') return 'Camina por encima del cauce seco (la línea marrón de puntos), río abajo. El agua te sigue.'; return 'Están en el norte, entre la Cordillera Cantábrica y el mar Cantábrico.'; }
  target() { const c = this.cur; if (!c || this.phase === 'wait') return null; if (this.phase === 'fuente') return this.springs.find(s => s.river === c.id).at; if (this.phase === 'agua') return polyPointAt(GEO.es.rivers[c.id][0], this.w.s, Math.min(1, this.prog + .08)); const r = RIOS_NORTE.find(r => !this.st.north[r]); return r ? polyPointAt(GEO.es.rivers[r][0], this.w.s, .5) : null; }
  entities(ents, cam) {
    super.entities(ents, cam);
    for (const s of this.springs) ents.push({ y: s.at[1], d: () => { const [x, y] = this.p.toScreen(s.at[0], s.at[1]); if (x < -100 || x > W + 100 || y < -100 || y > H + 100) return; drawSpring(x, y, 1.1, s.on); if (s.dry && G.t - s.dry < 1) { c2(x, y); } } });
    if (this.phase === 'agua') { const c = this.cur; const pt = polyPointAt(GEO.es.rivers[c.id][0], this.w.s, this.st.rivers[c.id]); ents.push({ y: pt[1], d: () => { const [x, y] = this.p.toScreen(pt[0], pt[1]); drawDrop(x, y - 40, .5, { expr: 'happy', look: [1, 0] }); } }); }
    function c2(x, y) { G.ctx.globalAlpha = .6; puff(x, y - 20, { n: 1, c: '#c9b28a' }); G.ctx.globalAlpha = 1; }
  }
}
/* =====================================================================
   CAPÍTULO 4 · FAROS Y COSTAS
   ===================================================================== */
class Ch4 extends ChBase {
  constructor(p) {
    super(p); this.title = 'Faros y costas'; this.enemies = [1, 3, 5]; this.enemySpots = [[36.2, -5.9], [35.85, -5.2], [36.4, -6.9], [42.2, -9.4], [40.4, 1.2]];
    this.st.lights = {}; this.st.costas = {};
    this.list = COSTAS.slice(); this.i = 0;
    this.faros = [{ at: this.w.snapLand(...this.ll(42.88, -9.27)), real: true }].concat(FAROS_FALSOS.map(f => ({ at: this.w.snapLand(...this.ll(f[0], f[1])) })));
  }
  get cur() { return this.list[this.i]; }
  begin() { this.next(); }
  next() { const c = this.cur; if (!c) return; if (c.kind === 'boya') { const p = this.p.players[0]; p.carry = { it: c, name: 'Boya: ' + c.name.replace(/^el /, ''), label: 'Boya: ' + c.name.replace(/^el /, '') }; } }
  action(p) {
    const c = this.cur; if (!c) return null;
    if (c.kind === 'faro') { const f = this.faros.find(f => !f.lit && dist(p.x, p.y, f.at[0], f.at[1]) < 110); if (f) return { label: 'ENCENDER', col: '#ffc933', fn: () => this.light(p, f) }; }
    if (c.kind === 'boya' && p.carry) return { label: 'SOLTAR', fn: () => this.dropBuoy(p) };
    return null;
  }
  light(p, f) {
    const c = this.cur, [sx, sy] = this.p.toScreen(f.at[0], f.at[1] - 80);
    if (f.real) { f.lit = true; this.st.lights.finisterre = 1; this.p.win(sx, sy, 'fin'); Sound.sfx('bling'); this.p.showBanner('Cabo de Finisterre', '¡El fin de la tierra, en el extremo oeste!', 2, '#ffc933'); this.i++; later(2.2, () => this.next()); }
    else { f.wrong = G.t; this.p.fail(sx, sy, 'fin', null, 'Cabo de Finisterre: en Galicia, en el extremo oeste.'); this.p.say([{ who: 'rosa', face: 'worried', text: 'Este faro es de otro cabo. ' + c.hint }]); }
  }
  dropBuoy(p) {
    const c = this.cur, z = c.zone, [cx, cy] = this.ll(...z.at);
    if (p.mode === 'boat' && dist(p.x, p.y, cx, cy) < z.r * this.w.s) { p.carry = null; this.st.costas[c.id] = [p.x, p.y]; this.p.win(...this.p.toScreen(p.x, p.y - 80), c.id); Sound.sfx('fanfare'); this.p.showBanner(cap(c.name), c.id === 'cadiz' ? 'Un golfo: el mar entrando en la tierra' : 'Un delta: la tierra que deja el río', 2, '#2fb8a0'); this.i++; later(2.2, () => this.next()); if (!this.cur) this.end(); }
    else { this.p.fail(...this.p.toScreen(p.x, p.y - 60), c.id, null, cap(c.name) + ': ' + c.hint.split('.')[0] + '.'); this.p.say([{ who: 'rosa', face: 'worried', text: (p.mode !== 'boat' ? 'Las boyas van en el agua. ' : 'Aquí no es. ') + c.hint }]); }
  }
  dropped(it, x, y) { this.loose = { it, x, y }; }
  update() {
    if (this.loose) for (const p of this.p.players) if (!p.carry && p.flat <= 0 && dist(p.x, p.y, this.loose.x, this.loose.y) < 60) { p.carry = this.loose.it; this.loose = null; Sound.sfx('pop'); break; }
    const c = this.cur;
    if (c && c.kind === 'paso') { const [gx, gy] = this.ll(...c.at); if (this.p.players.some(p => p.mode === 'boat' && dist(p.x, p.y, gx, gy) < 70)) { this.st.costas.estrecho = this.ll(36.1, -5.5); this.p.win(...this.p.toScreen(gx, gy - 60), 'estrecho'); Sound.sfx('fanfare'); this.p.showBanner('Estrecho de Gibraltar', 'Entre España y África: une el Atlántico y el Mediterráneo', 2.4, '#2fb8a0'); this.i++; later(2.5, () => this.next()); } }
  }
  end() { later(2.4, () => this.p.say([{ who: 'rosa', face: 'proud', text: '¡Vuelta a la península completada! Un cabo, un golfo, un estrecho y un delta. ¡Ya sois marineros!' }], () => this.p.finish())); }
  objective() { const c = this.cur; if (!c) return ''; if (this.loose) return '¡Una planchita te ha tirado la boya! Vuelve a cogerla.'; if (c.kind === 'faro') return 'Enciende el faro del cabo de Finisterre.'; if (c.kind === 'paso') return 'Navega por el estrecho de Gibraltar.'; return 'Lleva la boya ' + (c.name.startsWith('el ') ? 'al ' + c.name.slice(3) : 'a ' + c.name) + ' y suéltala en el agua.'; }
  hint() { const c = this.cur; return c ? c.hint : null; }
  target() { const c = this.cur; if (!c) return null; if (this.loose) return [this.loose.x, this.loose.y]; return c.zone ? this.ll(...c.zone.at) : this.ll(...c.at); }
  entities(ents, cam) {
    super.entities(ents, cam);
    for (const f of this.faros) if (!(f.real && this.st.lights.finisterre)) ents.push({ y: f.at[1], d: () => { const [x, y] = this.p.toScreen(f.at[0], f.at[1]); if (x < -200 || x > W + 200 || y < -150 || y > H + 150) return; drawLighthouse(x, y, .7, !!f.lit, { ph: x * .01 }); if (f.wrong && G.t - f.wrong < 1) circle(x, y - 40, 50, null, '#ff4b4b', 7); } });
    if (this.loose) { const l = this.loose; ents.push({ y: l.y, d: () => { const [x, y] = this.p.toScreen(l.x, l.y); drawBuoy(x, y, 1); drawSign(x, y - 40, l.it.name, { size: 16, stick: false, glow: true }); } }); }
  }
}
/* =====================================================================
   CAPÍTULO 5 · EL TIEMPO LOCO
   ===================================================================== */
class Ch5 extends ChBase {
  constructor(p) { super(p); this.title = 'El tiempo loco'; this.enemies = [0, 2, 3]; this.enemySpots = [[42.0, -4.0], [39.5, -2.0], [42.2, 0.0]]; this.st.stations = {}; this.showStations = true; this.crazy = true; }
  stPos(e) { return e.cat ? this.cll(...e.cat) : this.ll(...e.at); }
  action(p) { const e = ESTACIONES.find(e => !this.st.stations[e.id] && dist(p.x, p.y, ...this.stPos(e)) < 140); if (e) return { label: 'ARREGLAR', col: '#ffb938', fn: () => this.fix(e) }; return null; }
  fix(e) {
    const cl = CLIMAS[e.clima], others = k => shuffle(Object.keys(CLIMAS).filter(x => x !== e.clima)).slice(0, k);
    const qs = [
      { id: 'cl_' + e.clima, q: e.label + ': ¿qué clima hay en esta zona?', opts: shuffle(Object.keys(CLIMAS)).map(k => CLIMAS[k].name), a: cl.name, hint: cl.name + ': ' + cl.donde + '.' },
      { id: 'tm_' + e.clima, q: '¿Cómo es el tiempo en el ' + cl.name.toLowerCase() + '?', opts: shuffle([e.clima, ...others(2)]).map(k => CLIMAS[k].tiempo), a: cl.tiempo, hint: cl.name + ': ' + cl.temp + ' ' + cl.lluvia },
      { id: 'vg_' + e.clima, q: '¿Qué vegetación crece con el ' + cl.name.toLowerCase() + '?', opts: shuffle([e.clima, ...others(2)]).map(k => CLIMAS[k].veg), a: cl.veg, hint: cl.name + ': ' + cl.veg },
    ];
    let k = 0; const step = () => { if (k >= qs.length) { this.st.stations[e.id] = 1; Sound.sfx('fanfare'); this.p.showBanner(cl.name, cl.tiempo, 2.2, cl.col); if (ESTACIONES.every(x => this.st.stations[x.id])) later(2.4, () => this.p.say([{ who: 'rosa', face: 'proud', text: '¡El tiempo vuelve a ser normal! Llueve en el norte, hace calor en Canarias, nieva en las montañas y el centro está soleado y seco.' }], () => this.p.finish())); return; }
      const q = qs[k++]; this.p.ask({ ...q, miss: q.hint, then: step }); };
    step();
  }
  objective() { const n = ESTACIONES.filter(e => this.st.stations[e.id]).length; return 'Arregla las estaciones del tiempo (' + n + ' de 4). Hay una en el norte, una en el centro, una en los Pirineos y otra en Canarias.'; }
  hint() { const e = this.nextSt(); return e ? 'La más cercana: ' + e.label.toLowerCase() + '. Fíjate en el tiempo que hace allí.' : null; }
  nextSt() { const p = this.p.players[0]; return ESTACIONES.filter(e => !this.st.stations[e.id]).sort((a, b) => dist(p.x, p.y, ...this.stPos(a)) - dist(p.x, p.y, ...this.stPos(b)))[0]; }
  target() { const e = this.nextSt(); return e ? this.stPos(e) : null; }
}
CLIMAS.oceanico.tiempo = 'Suave todo el año y llueve mucho';
CLIMAS.mediterraneo.tiempo = 'Veranos calurosos y llueve poco';
CLIMAS.montana.tiempo = 'Inviernos muy fríos y mucha nieve';
CLIMAS.subtropical.tiempo = 'Calor todo el año y casi no llueve';
/* =====================================================================
   CAPÍTULO 6 · EUROPA (en globo)
   ===================================================================== */
class Ch6 extends ChBase {
  constructor(p) {
    super(p); this.title = 'Europa en globo'; this.world = 'eu'; this.enemies = [1, 2, 4]; this.music = 'europa'; this.start = this.w.ll(42.6, 1.0);
    this.list = shuffle(EUROPA); this.i = 0; this.planted = []; this.rise = {}; this.flow = {};
  }
  makeEnemy(k) { const spots = [[47, 10], [52, 18], [45, 25], [58, 30], [50, 3]]; const [cx, cy] = this.w.ll(...spots[k % spots.length]); return { x: cx, y: cy, cx, cy, r: rnd(150, 300), w: rnd(.3, .6), ph: rnd(TAU), t: 0, sp: Game.d(90, 120, 150), chase: Game.d(180, 240, 300), dir: 1 }; }
  get cur() { return this.list[this.i]; }
  action(p) { if (!this.cur) return null; return { label: this.cur.type === 'range' ? '¡LEVANTAR!' : 'SOLTAR AQUÍ', col: this.cur.type === 'range' ? '#c98c5a' : null, fn: () => this.put(p) }; }
  zoneD(it, p) { const w = this.w; if (it.type === 'pt') { const [x, y] = w.ll(...it.at); return dist(p.x, p.y, x, y) - it.r * w.s; } if (it.type === 'range') return polyDist(p.x, p.y, GEO.eu.ranges[it.key], w.s) - 90; let b = 1e9; for (const l of GEO.eu.rivers[it.key]) b = Math.min(b, polyDist(p.x, p.y, l, w.s)); return b - 70; }
  put(p) {
    const it = this.cur, [sx, sy] = this.p.toScreen(p.x, p.y - 150);
    if (this.zoneD(it, p) <= 0) {
      if (it.type === 'range') { this.rise[it.key] = 0; tw(this.rise, { [it.key]: 1 }, 1.5, { ease: E.lin }); Sound.sfx('rumble'); shake(8, .8); }
      else if (it.type === 'river') { this.flow[it.key] = 0; tw(this.flow, { [it.key]: 1 }, 2, { ease: E.lin }); Sound.sfx('splash'); this.planted.push({ it, x: p.x, y: p.y }); }
      else this.planted.push({ it, x: p.x, y: p.y });
      this.p.win(sx, sy, 'eu_' + it.id); this.p.showBanner(it.name, null, 1.3, '#a66cff'); this.i++;
      if (!this.cur) later(1.6, () => { for (const k of Object.keys(GEO.eu.ranges)) if (this.rise[k] == null) { this.rise[k] = 0; tw(this.rise, { [k]: 1 }, 1.8); } Sound.sfx('rumble'); this.p.say([{ who: 'rosa', face: 'proud', text: '¡Europa arreglada! Penínsulas, islas, la Gran Llanura, los Alpes, los Urales, el Rin y el Danubio. Álvaro huye a Canarias…' }, { who: 'alvaro', face: 'angry', text: '¡Esto no acaba aquí! ¡Me voy a por la última arruga!' }], () => this.p.finish()); });
    } else {
      let near = null; for (const e of EUROPA) if (e !== it && this.zoneD(e, p) <= 0) near = e;
      this.p.fail(sx, sy, 'eu_' + it.id, null, it.name + ': ' + it.hint.split('.')[0] + '.');
      this.p.say([{ who: 'rosa', face: 'worried', text: (near ? 'Aquí está ' + (near.type === 'pt' ? 'la zona de «' + near.name + '»' : near.name) + ', no ' + it.name + '. ' : 'Aquí no es. ') + it.hint }]);
    }
  }
  objective() { const it = this.cur; if (!it) return ''; return (it.type === 'range' ? 'Levanta ' + it.name + '.' : 'Suelta «' + it.name + '» en su sitio.') + ' (' + this.i + ' de ' + this.list.length + ')'; }
  hint() { return this.cur ? this.cur.hint : null; }
  target() { const it = this.cur; if (!it) return null; if (it.type === 'pt') return this.w.ll(...it.at); if (it.type === 'range') return this.w.map.rangeMid(it.key); return this.w.map.riverMid(it.key); }
  drawUnder(c, cam) {
    const w = this.w;
    for (const k of Object.keys(GEO.eu.rivers)) { const dry = ['Rin', 'Danubio'].includes(k); for (const l of GEO.eu.rivers[k]) drawRiverW(w, cam, l, 7, dry ? (this.flow[k] || 0) : 1, dry && !(this.flow[k] >= 1), this.p.flowT); }
    for (const k of Object.keys(GEO.eu.ranges)) drawRangeW(w, cam, k, this.rise[k] || 0, RANGE_INFO[k] || { h: .9, col: '#c98c5a' }, 1);
  }
  entities(ents) { for (const s of this.planted) ents.push({ y: s.y, d: () => { const [x, y] = this.p.toScreen(s.x, s.y); drawSign(x, y, s.it.name, { size: 22, col: '#fff' }); } }); }
}
/* =====================================================================
   CAPÍTULO 7 · LA GRAN PLANCHA (jefe final en Canarias)
   ===================================================================== */
class Ch7 extends ChBase {
  constructor(p) {
    super(p); this.title = 'Batalla en Canarias'; this.enemies = [0, 0, 0]; this.music = 'jefe'; this.world = 'boss';
    this.start = this.cll(28.1, -15.9);
    this.hpMax = Game.d(6, 8, 10); this.hp = this.hpMax; this.balls = []; this.shots = [];
    this.boss = { x: this.cll(28.7, -17.2)[0], y: this.cll(28.7, -17.2)[1], vx: 0, vy: 0, t: 0, dive: null, hit: 0, dir: 1 };
    this.queue = shuffle(REPASO); this.q = null;
    const i0 = this.cll(29.5, -18.3), i1 = this.cll(27.55, -13.3); this.box = [i0[0] + 40, i0[1] + 60, i1[0] - 40, i1[1] - 30];
    this.teideExpr = 'shout'; this.teideS = .75; this.hideStations = true; this.hideSigns = true;
  }
  begin() { this.newQ(); }
  newQ() { if (this.hp <= 0) return; this.q = this.queue.shift() || (this.queue = shuffle(REPASO)).shift(); const opts = shuffle([this.q.a, this.q.b, this.q.c]); this.balls = []; const [tx, ty] = this.cll(28.27, -16.64); opts.forEach((o, k) => { const a = -Math.PI / 2 + (k - 1) * 1.1 + rnd(-.2, .2); const tgt = [clamp(tx + Math.cos(a) * rnd(260, 420), this.box[0], this.box[2]), clamp(ty + 160 + Math.sin(a) * 120 + rnd(0, 120), this.box[1] + 80, this.box[3])]; this.balls.push({ label: o, ok: o === this.q.a, x: tx, y: ty - 120, sx: tx, sy: ty - 120, tx: tgt[0], ty: tgt[1], t: 0, ph: k }); }); Sound.sfx('lava'); this.teideJ = 1; }
  action(p) { if (p.carry && p.carry.ball) return { label: '¡LANZAR!', col: '#ff6a2b', fn: () => this.throwB(p) }; return null; }
  throwB(p) {
    const b = p.carry.ball; p.carry = null; this.shots.push({ x: p.x, y: p.y - 120, t: 0, ok: b.ok, label: b.label, fx: p.x, fy: p.y - 120 }); Sound.sfx('whoosh');
  }
  update(dt) {
    const bs = this.boss; bs.t += dt; if (bs.hit > 0) bs.hit -= dt;
    // la plancha se mueve y a veces embiste
    const tgtP = this.p.players[Math.floor(bs.t / 6) % this.p.players.length];
    if (!bs.dive && bs.t % 7 > 6.2 && this.hp > 0) { bs.dive = { x: tgtP.x, y: tgtP.y, t: 0 }; Sound.sfx('horn'); }
    if (bs.dive) { bs.dive.t += dt; if (bs.dive.t > 1.1) { bs.x = lerp(bs.x, bs.dive.x, Math.min(1, dt * 8)); bs.y = lerp(bs.y, bs.dive.y - 60, Math.min(1, dt * 8)); if (bs.dive.t > 1.6) { for (const p of this.p.players) if (p.flat <= 0 && p.inv <= 0 && dist(p.x, p.y, bs.dive.x, bs.dive.y) < 110) this.p.squash(p); shake(10, .3); Sound.sfx('stomp'); bs.dive = null; } } }
    else { const [cx, cy, ax2, ay2] = this.bossHome ? this.bossHome() : [(this.box[0] + this.box[2]) / 2, (this.box[1] + this.box[3]) / 2 - 80, 380, 90]; bs.x = lerp(bs.x, cx + Math.sin(bs.t * .5) * ax2, Math.min(1, dt * 1.5)); bs.y = lerp(bs.y, cy + Math.sin(bs.t * .9) * ay2, Math.min(1, dt * 1.5)); }
    bs.dir = tgtP.x > bs.x ? 1 : -1;
    // jugadores dentro del recuadro de Canarias
    for (const p of this.p.players) { p.x = clamp(p.x, this.box[0], this.box[2]); p.y = clamp(p.y, this.box[1], this.box[3]); }
    // bolas de lava
    for (const b of this.balls) { if (b.t < 1) { b.t = Math.min(1, b.t + dt * 1.2); b.x = lerp(b.sx, b.tx, b.t); b.y = lerp(b.sy, b.ty, b.t) - Math.sin(b.t * Math.PI) * 260; } }
    if (this.autoPick !== false) for (const p of this.p.players) if (!p.carry && p.flat <= 0) for (const b of this.balls) if (b.t >= 1 && !b.taken && dist(p.x, p.y, b.x, b.y) < 60) { b.taken = true; p.carry = { ball: b, name: b.label, label: b.label }; Sound.sfx('pop'); break; }
    // disparos
    for (const s of this.shots) { s.t += dt; const k = Math.min(1, s.t / .6); s.x = lerp(s.fx, bs.x, k); s.y = lerp(s.fy, bs.y - 60, k) - Math.sin(k * Math.PI) * 180;
      if (k >= 1 && !s.done) { s.done = true; const [sx, sy] = this.p.toScreen(bs.x, bs.y - 60);
        if (s.ok) { this.hp--; bs.hit = .6; shake(14, .4); flash('#ff8a3d', .2); Sound.sfx('stomp'); burst(sx, sy, { n: 36, c: ['#ff8a3d', '#ffc933', '#ff4b4b', '#fff'], sp: 520 }); this.p.win(sx, sy, this.q.id); this.balls = []; for (const p of this.p.players) if (p.carry && p.carry.ball) p.carry = null; if (this.hp <= 0) this.win(); else later(1.2, () => this.newQ()); }
        else { burst(sx, sy, { n: 12, c: ['#8c85b0', '#fff'] }); this.p.fail(sx, sy, this.q.id, null, this.q.q + ' → ' + this.q.a); pop(sx, sy - 40, '¡Esa no era!', '#ff4b4b', 36); } } }
    this.shots = this.shots.filter(s => !s.done);
    // si se gastan todas las bolas sin acertar, nuevas
    if (this.q && this.balls.length && this.balls.every(b => b.taken) && !this.p.players.some(p => p.carry) && !this.shots.length && this.hp > 0) { this.balls = []; later(.6, () => this.newQ()); }
  }
  win() {
    this.q = null; this.balls = []; const bs = this.boss; Sound.stop(.3); Sound.sfx('drumroll');
    later(1.1, () => { flash('#fff', .8); shake(24, .8); confetti(200); Sound.sfx('cheer'); this.flying = true; tw(bs, { y: bs.y - 1200, x: bs.x - 900 }, 2.2, { ease: E.inQ }); this.p.showBanner('¡GRAN PLANCHA DERROTADA!', 'El Teide sigue en pie. ¡Y España, entera!', 3, '#7ce05c'); this.teideExpr = 'proud'; });
    later(3.8, () => this.p.say(GUION.fin, () => this.p.finish()));
  }
  objective() { return this.q ? this.q.q + ' Coge la bola correcta y lánzasela al Aplanatrón.' : ''; }
  hint() { if (!this.q) return null; const sp = { q5: 'El Ebro va hacia el este.', q6: 'El Duero va hacia el oeste, a Portugal.', q7: 'El Tajo acaba en Lisboa, en Portugal.' }[this.q.id]; return 'Pista: ' + (sp ? sp + ' ' : '') + 'La respuesta empieza por «' + this.q.a.replace(/^(El|La|Los|Las|Un|Una) /, '').charAt(0) + '». La bola correcta tiene una flecha.'; }
  target() { const b = this.balls.find(b => b.ok && !b.taken); return b ? [b.x, b.y] : null; }
  drawUnder(c, cam) { super.drawUnder(c, cam); const [a, b] = this.p.toScreen(this.box[0] - 40, this.box[1] - 60), [a2, b2] = this.p.toScreen(this.box[2] + 40, this.box[3] + 30); c.save(); c.beginPath(); c.rect(-50, -50, W + 100, H + 100); c.rect(a, b, a2 - a, b2 - b); c.fillStyle = 'rgba(60,10,30,.55)'; c.fill('evenodd'); c.lineWidth = 8; c.strokeStyle = '#ff6a2b'; c.setLineDash([]); c.strokeRect(a, b, a2 - a, b2 - b); c.restore(); const bs = this.boss; if (bs.dive) { const [x, y] = this.p.toScreen(bs.dive.x, bs.dive.y); const k = Math.min(1, bs.dive.t / 1.1); c.globalAlpha = .35 + k * .3; ell(c, x, y, 110 * k + 20, 40 * k + 8); c.fillStyle = '#ff4b4b'; c.fill(); c.globalAlpha = 1; } }
  entities(ents, cam) {
    super.entities(ents, cam);
    for (const b of this.balls) if (!b.taken) ents.push({ y: b.y, d: () => { const [x, y] = this.p.toScreen(b.x, b.y); drawLavaBall(x, y - 30, 30, b.t >= 1 ? b.label : null, { ph: b.ph }); } });
    const bs = this.boss; ents.push({ y: bs.y + 200, d: () => { const [x, y] = this.p.toScreen(bs.x, bs.y); c3(x, y, bs, this); } });
    for (const s of this.shots) ents.push({ y: 1e9, d: () => { const [x, y] = this.p.toScreen(s.x, s.y); drawLavaBall(x, y, 24, null); } });
    function c3(x, y, bs, me) { G.ctx.save(); if (bs.hit > 0) { G.ctx.translate(rnd(-6, 6), rnd(-6, 6)); } drawPlancha(x, y, .72, { dir: bs.dir, expr: bs.hit > 0 ? 'shock' : me.flying ? 'sad' : 'evil', arms: bs.hit > 0 ? 'up' : 'point', hover: bs.dive && bs.dive.t > 1.1 ? .2 : 1 }); G.ctx.restore(); }
  }
  hud(c) {
    if (this.hp <= 0 && !this.flying) return;
    rr(430, 16, 420, 50, 25, '#fff8ea', INK, 5); txt('APLANATRÓN', 540, 43, { size: 20, font: 'T', color: '#8f4fe8' });
    for (let i = 0; i < this.hpMax; i++) { const w = 190 / this.hpMax; rr(640 + i * w, 28, w - 3, 26, 6, i < this.hp ? '#ff4b4b' : '#ddd', INK, 3); }
  }
  drawOver() { }
}
const CHAPTERS = [Ch1, Ch2, Ch3, Ch4, Ch5, Ch6, Ch7];
Ch6.world = 'eu';
/* =====================================================================
   PRUEBA FINAL · EL GRAN EXAMEN: tareas por el mapa grande y, al final,
   la batalla contra el Aplanatrón en Canarias
   ===================================================================== */
class ChFinal extends Ch7 {
  constructor(p) {
    super(p); this.label = 'PRUEBA FINAL'; this.title = 'El gran examen'; this.phase = 'tasks'; this.world = 'es'; this.music = 'region';
    this.hideSigns = false; this.hideStations = true; this.teideS = .42; this.teideExpr = 'happy';
    const s0 = this.w.ll(40.42, -3.7); this.start = [s0[0], s0[1] + 150]; this.enemies = [1, 2, 3];
    const st = this.st, pick1 = a => a[Math.floor(Math.random() * a.length)];
    const nom = pick1(NOMBRES), rel = pick1(RELIEVE.filter(r => r.keys)), decoy = pick1(RELIEVE.filter(r => r.keys && r !== rel)), rio = pick1(RIOS), est = pick1(ESTACIONES);
    this.tasks = shuffle([{ k: 'sign', it: nom }, { k: 'raise', it: rel, decoy }, { k: 'river', it: rio }, { k: 'faro' }, { k: 'clima', it: est }]);
    // el Aplanatrón vuelve a estropear esas cosas
    st.names[nom.id] = false; for (const k of rel.keys.concat(decoy.keys)) st.rise[k] = 0; st.rivers[rio.id] = 0; st.lights.finisterre = 0; st.stations = {};
    this.springs = [{ sys: rio.nace, at: this.ll(...rio.source), ok: true }].concat(shuffle(FUENTES_FALSAS.filter(f => f[2] !== rio.nace)).slice(0, 2).map(f => ({ sys: f[2], at: this.ll(f[0], f[1]) })));
    this.faros = [{ at: this.w.snapLand(...this.ll(42.88, -9.27)), real: true }].concat(shuffle(FAROS_FALSOS).slice(0, 3).map(f => ({ at: this.w.snapLand(...this.ll(f[0], f[1])) })));
    this.ti = -1;
  }
  makeEnemy(k) { return ChBase.prototype.makeEnemy.call(this, k); }
  begin() { this.p.say(GUION.final, () => this.nextTask()); }
  get task() { return this.tasks[this.ti]; }
  nextTask() {
    this.ti++; const t = this.task; this.loose = null;
    if (!t) { this.p.say([{ who: 'rosa', face: 'proud', text: '¡El mapa está completo otra vez! Pero… ¡mirad! ¡El Aplanatrón sale volando hacia Canarias!' }], () => this.toBoss()); return; }
    this.p.showBanner('TAREA ' + (this.ti + 1) + ' DE ' + this.tasks.length, this.objective(), 2.2, '#ff8a3d');
    if (t.k === 'sign') { const p = this.p.players[0]; p.carry = { it: t.it, name: t.it.name, label: t.it.name }; }
  }
  toBoss() {
    this.p.started = false; this.cine = { t: 0 }; Sound.play('jefe', { fade: 1.2 }); Sound.sfx('horn');
    later(1.0, () => Sound.sfx('whoosh')); later(3.4, () => Sound.sfx('whoosh')); later(5.0, () => { Sound.sfx('rumble'); shake(14, 1.2); }); later(6.2, () => { Sound.sfx('lava'); Sound.sfx('laugh'); });
    later(7.6, () => { flash('#fff', .5); this.cine = null; this.enterArena(); this.p.started = true; this.p.say(GUION.boss, () => this.newQ()); });
  }
  enterArena() {
    this.phase = 'boss'; this.world = 'boss'; this.hideSigns = true; this.hideTeide = true; this.noMinimap = true; this.autoPick = false; this.forceWalk = true;
    const A = this.A = this.cll(28.27, -16.64), X = sx => A[0] + sx - 640, Y = sy => A[1] + sy - 400; this.X = X; this.Y = Y;
    this.box = [X(150), Y(420), X(1130), Y(700)];
    this.p.players.forEach((p, i) => { p.x = X(560 + i * 160); p.y = Y(640); p.carry = null; p.mode = 'walk'; p.vx = p.vy = 0; });
    this.p.cam = [A[0], A[1]]; this.p.enemies = []; this.p.region = null; this.boss.x = X(1000); this.boss.y = Y(220); this.teideExpr = 'shout';
    this.p.rosa.x = X(420); this.p.rosa.y = Y(560);
  }
  bossHome() { return [this.X(640), this.Y(215), 380, 45]; }
  newQ() {
    if (this.hp <= 0 || this.phase !== 'boss') return;
    this.q = this.queue.shift() || (this.queue = shuffle(REPASO)).shift(); const opts = shuffle([this.q.a, this.q.b, this.q.c]); this.balls = [];
    const ox = this.X(640), oy = this.Y(250), spots = shuffle([[260, 540], [470, 650], [640, 520], [820, 650], [1020, 545]]).slice(0, 3);
    opts.forEach((o, k) => { const [sx, sy] = spots[k]; this.balls.push({ label: o, ok: o === this.q.a, x: ox, y: oy, sx: ox, sy: oy, tx: this.X(sx + rnd(-30, 30)), ty: this.Y(sy + rnd(-20, 20)), t: 0, ph: k }); });
    for (const b of this.balls) { const cx = this.X(640), cy = this.Y(585), dx = (b.tx - cx) / 560, dy = (b.ty - cy) / 160, r = Math.hypot(dx, dy); if (r > .78) { b.tx = cx + dx / r * .78 * 560; b.ty = cy + dy / r * .78 * 160; } }
    Sound.sfx('lava'); this.teideJ = 1;
  }
  inIsland(x, y) { const dx = (x - this.X(640)) / 590, dy = (y - this.Y(585)) / 170; return dx * dx + dy * dy <= 1; }
  done() { const t = this.task; t.ok = true; later(1.8, () => this.nextTask()); }
  action(p) {
    if (this.cine) return null;
    if (this.phase === 'boss') { if (p.carry && p.carry.ball) return super.action(p); const b = this.balls.find(b => b.t >= 1 && !b.taken && dist(p.x, p.y, b.x, b.y) < 95); if (b) return { label: '¡COGER!', col: '#ff8a3d', fn: () => { b.taken = true; p.carry = { ball: b, name: b.label, label: b.label }; Sound.sfx('pop'); } }; return null; }
    const t = this.task; if (!t || t.ok) return null;
    if (t.k === 'sign' && p.carry) return { label: 'SOLTAR', fn: () => this.dropSign(p) };
    if (t.k === 'raise' && p.mode === 'walk') { for (const r of [t.it, t.decoy]) if (!r.done && r.keys.some(k => polyDist(p.x, p.y, GEO.es.ranges[k], this.w.s) < 80)) return { label: '¡LEVANTAR!', col: '#c98c5a', fn: () => this.raiseT(p, r) }; }
    if (t.k === 'river' && !t.open) { const s = this.springs.find(s => dist(p.x, p.y, s.at[0], s.at[1]) < 90 && !s.dry); if (s) return { label: 'ABRIR FUENTE', col: '#3e8ef0', fn: () => this.openT(s) }; }
    if (t.k === 'faro') { const f = this.faros.find(f => !f.wrongDone && dist(p.x, p.y, f.at[0], f.at[1]) < 110); if (f) return { label: 'ENCENDER', col: '#ffc933', fn: () => this.faroT(f) }; }
    if (t.k === 'clima') { const e = t.it, [ex, ey] = e.cat ? this.cll(...e.cat) : this.ll(...e.at); if (dist(p.x, p.y, ex, ey) < 140) return { label: 'ARREGLAR', col: '#ffb938', fn: () => this.climaT(e) }; }
    return null;
  }
  dropSign(p) {
    const it = this.task.it;
    if (Ch1.prototype.inZone.call(this, it.zone, p)) { p.carry = null; this.st.names[it.id] = [p.x, p.y + 4]; this.p.win(...this.p.toScreen(p.x, p.y - 80), 'nom_' + it.id); Sound.sfx('fanfare'); this.p.showBanner(it.name, '¡En su sitio!', 1.4, '#7ce05c'); this.done(); }
    else { this.p.fail(...this.p.toScreen(p.x, p.y - 60), 'nom_' + it.id, null, it.name + ': ' + it.hint.split('.')[0] + '.'); this.p.say([{ who: 'rosa', face: 'worried', text: 'Aquí no: estás en ' + Ch1.prototype.where.call(this, p) + '. ' + it.hint }]); }
  }
  raiseT(p, r) {
    const t = this.task, [sx, sy] = this.p.toScreen(p.x, p.y - 60); r.done = true;
    for (const k of r.keys) tw(this.st.rise, { [k]: 1 }, 1.6, { ease: E.lin }); Sound.sfx('rumble'); shake(10, 1);
    if (r === t.it) { this.p.win(sx, sy, 'rel_' + r.id); this.p.showBanner(cap(r.name), r.fact, 2, '#c98c5a'); this.done(); }
    else { this.p.fail(sx, sy, 'rel_' + t.it.id, null, cap(t.it.name) + ': ' + t.it.hint); this.p.say([{ who: 'rosa', face: 'worried', text: 'Eso era ' + r.name + '. Buscamos ' + t.it.name + '. ' + t.it.hint }]); }
  }
  openT(s) {
    const t = this.task, r = t.it, [sx, sy] = this.p.toScreen(s.at[0], s.at[1] - 60);
    if (s.ok) { t.open = true; s.on = true; Sound.sfx('splash'); this.p.win(sx, sy, 'nace_' + r.id);
      this.p.ask({ id: 'mar_' + r.id, q: '¡Sale agua! ¿Y dónde desemboca el ' + r.id + '?', opts: shuffle(Object.values(MARES)), a: MARES[r.mar], hint: r.hint, miss: 'El ' + r.id + ' nace en ' + r.naceTxt + ' y desemboca en el ' + marTxt(r.mar) + '.', then: () => { tw(this.st.rivers, { [r.id]: 1 }, 2.5, { ease: E.lin }); this.p.showBanner('Río ' + r.id, 'Nace en ' + r.naceTxt + ' y desemboca en el ' + marTxt(r.mar), 2.4, '#3e8ef0'); this.done(); } }); }
    else { s.dry = true; this.p.fail(sx, sy, 'nace_' + r.id, null, 'El ' + r.id + ' nace en ' + r.naceTxt + '.'); this.p.say([{ who: 'rosa', face: 'worried', text: 'Esa fuente está en ' + (SYS_NAME[s.sys] || s.sys) + ' y está seca. ' + r.hint.split('.')[0] + '.' }]); }
  }
  faroT(f) {
    const [sx, sy] = this.p.toScreen(f.at[0], f.at[1] - 80);
    if (f.real) { f.lit = true; this.st.lights.finisterre = 1; this.p.win(sx, sy, 'fin'); Sound.sfx('bling'); this.p.showBanner('Cabo de Finisterre', 'El punto más occidental de España', 2, '#ffc933'); this.done(); }
    else { f.wrong = G.t; f.wrongDone = true; this.p.fail(sx, sy, 'fin', null, 'Cabo de Finisterre: en Galicia, en el extremo oeste.'); this.p.say([{ who: 'rosa', face: 'worried', text: 'Este faro es de otro cabo. Finisterre está en Galicia, en el extremo OESTE: el punto más occidental.' }]); }
  }
  climaT(e) {
    const cl = CLIMAS[e.clima];
    this.p.ask({ id: 'cl_' + e.clima, q: e.label + ': ¿qué clima hay en esta zona?', opts: shuffle(Object.keys(CLIMAS)).map(k => CLIMAS[k].name), a: cl.name, hint: cl.name + ': ' + cl.donde + '. ' + cl.temp, miss: cl.name + ': ' + cl.donde + '.', then: () => { this.st.stations[e.id] = 1; Sound.sfx('fanfare'); this.p.showBanner(cl.name, CLIMAS[e.clima].tiempo, 2.2, cl.col); this.done(); } });
  }
  dropped(it, x, y) { if (this.phase === 'boss') return; this.loose = { it, x, y }; }
  update(dt) {
    if (this.cine) return;
    if (this.phase === 'boss') { super.update(dt); for (const p of this.p.players) { const cx = this.X(640), cy = this.Y(585); let dx = (p.x - cx) / 560, dy = (p.y - cy) / 160; const L = Math.hypot(dx, dy); if (L > 1) { p.x = cx + dx / L * 560; p.y = cy + dy / L * 160; } } this.p.cam = [this.A[0], this.A[1]]; return; }
    if (this.loose) for (const p of this.p.players) if (!p.carry && p.flat <= 0 && dist(p.x, p.y, this.loose.x, this.loose.y) < 60) { p.carry = this.loose.it; this.loose = null; Sound.sfx('pop'); break; }
  }
  objective() {
    if (this.phase === 'boss') return super.objective(); const t = this.task; if (!t) return '';
    if (this.loose) return '¡Te han tirado el cartel! Vuelve a cogerlo.';
    if (t.k === 'sign') return 'Lleva el cartel «' + t.it.name + '» a su sitio y pulsa SOLTAR.';
    if (t.k === 'raise') return 'El Aplanatrón ha vuelto a aplastar ' + t.it.name + '. Búscalo y pulsa ¡LEVANTAR!';
    if (t.k === 'river') return 'El ' + t.it.id + ' se ha secado. Abre su fuente, en las montañas donde nace.';
    if (t.k === 'faro') return 'Enciende el faro del cabo de Finisterre, el punto más occidental.';
    return 'Arregla la estación del tiempo: ' + t.it.label.toLowerCase() + '.';
  }
  hint() {
    if (this.phase === 'boss') return super.hint(); const t = this.task; if (!t) return null;
    if (t.k === 'sign') return t.it.hint; if (t.k === 'raise') return t.it.hint; if (t.k === 'river') return t.it.hint.split('.')[0] + '.';
    if (t.k === 'faro') return 'Finisterre está en Galicia, arriba a la izquierda, en el extremo oeste.'; return 'La estación está marcada en el minimapa.';
  }
  target() {
    if (this.phase === 'boss') return super.target(); const t = this.task; if (!t) return null; if (this.loose) return [this.loose.x, this.loose.y];
    if (t.k === 'sign') return this.spot(t.it.id); if (t.k === 'raise') return t.it.area ? this.ll(40.0, -4.3) : this.w.map.rangeMid(t.it.keys[0]);
    if (t.k === 'river') return this.springs[0].at; if (t.k === 'faro') return this.faros[0].at; const e = t.it; return e.cat ? this.cll(...e.cat) : this.ll(...e.at);
  }
  drawUnder(c, cam) { if (this.phase === 'boss') return this.drawArena(c); ChBase.prototype.drawUnder.call(this, c, cam); }
  drawArena(c) {
    const t = G.t; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff9a5a'); g.addColorStop(.35, '#ffcf8a'); g.addColorStop(.36, '#3ea5e6'); g.addColorStop(1, '#2b7fc2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    drawSun(1120, 90, .9); for (let i = 0; i < 3; i++) drawCloud((i * 480 + t * 12) % 1500 - 120, 70 + i * 30, .6);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (let y = 300; y < H; y += 46) for (let x = ((y / 46) % 2) * 60 - 60 + (t * 20) % 120; x < W + 60; x += 120) { c.beginPath(); c.arc(x, y, 10, Math.PI * 1.1, Math.PI * 1.9); c.arc(x + 20, y, 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    // la isla
    c.save(); c.fillStyle = 'rgba(10,40,90,.3)'; ell(c, 646, 598, 640, 205); c.fill();
    c.beginPath(); for (let k = 0; k <= 60; k++) { const a = k / 60 * TAU, r = 1 + Math.sin(a * 5) * .03 + Math.sin(a * 3 + 1) * .04; const x = 640 + Math.cos(a) * 630 * r, y = 585 + Math.sin(a) * 200 * r; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fillStyle = '#f4d58a'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    c.beginPath(); ell(c, 640, 575, 560, 160); c.fillStyle = '#c9a070'; c.fill();
    c.globalAlpha = .5 + Math.sin(t * 3) * .2; c.strokeStyle = '#ff6a2b'; c.lineWidth = 5; for (const [x0, y0, x1, y1] of [[520, 470, 470, 540], [760, 470, 830, 540], [640, 480, 650, 560]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 12, (y0 + y1) / 2, x1, y1); c.stroke(); } c.globalAlpha = 1;
    for (const [x, y, s2] of [[110, 600, 1], [1170, 600, 1], [250, 700, .8], [1050, 700, .8]]) { rr(x - 5, y - 70 * s2, 10, 70 * s2, 4, '#7a5a3a', INK, 3); for (let a = 0; a < 5; a++) { c.save(); c.translate(x, y - 72 * s2); c.rotate(-1.4 + a * .7 + Math.sin(t * 2 + x) * .05); ell(c, 24 * s2, 0, 26 * s2, 7 * s2); fillStroke(c, '#5fae3c', 2.5); c.restore(); } }
    c.restore();
    // el Teide, gigante, al fondo
    drawTeide(640, 470, 1.35, { expr: this.teideExpr || 'shout' });
    if (this.teideJ) { this.teideJ = Math.max(0, this.teideJ - G.dt); if (!G.low && Math.random() < .5) burst(640, 250, { n: 3, c: ['#ff6a2b', '#ffc933'], sp: 260 }); }
  }
  entities(ents, cam) {
    if (this.phase === 'boss') return super.entities(ents, cam);
    ChBase.prototype.entities.call(this, ents, cam); const t = this.task, S = (x, y) => this.p.toScreen(x, y);
    if (t && t.k === 'river') for (const s of this.springs) ents.push({ y: s.at[1], d: () => { const [x, y] = S(...s.at); if (x > -100 && x < W + 100 && y > -100 && y < H + 100) drawSpring(x, y, 1.1, !!s.on); } });
    if (t && t.k === 'faro') for (const f of this.faros) ents.push({ y: f.at[1], d: () => { const [x, y] = S(...f.at); if (x > -200 && x < W + 200 && y > -150 && y < H + 150) { drawLighthouse(x, y, .7, !!f.lit, { ph: x * .01 }); if (f.wrong && G.t - f.wrong < 1) circle(x, y - 40, 50, null, '#ff4b4b', 7); } } });
    if (t && t.k === 'clima') { const e = t.it, [ex, ey] = e.cat ? this.cll(...e.cat) : this.ll(...e.at); ents.push({ y: ey, d: () => { const [x, y] = S(ex, ey); drawStation(x, y, 1, { ok: !!this.st.stations[e.id] }); } }); }
    if (this.loose) { const l = this.loose; ents.push({ y: l.y, d: () => { const [x, y] = S(l.x, l.y); drawSign(x, y, l.it.name, { size: 20, glow: true }); } }); }
  }
  hud(c) { if (this.cine) return this.drawCine(c); if (this.phase === 'boss') return super.hud(c); chip('TAREA ' + Math.min(this.ti + 1, this.tasks.length) + ' / ' + this.tasks.length, 640, 44, '#ff5c8a', '#fff', 22); }
}
ChFinal.prototype.drawCine = function (c) {
  this.cine.t += G.dt; const t = this.cine.t, k = (a, b) => clamp((t - a) / (b - a), 0, 1), io = E.io;
  c.save();
  if (t < 3.3) { // 1) el Aplanatrón huye sobre el mar; los niños le persiguen en barca
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb86b'); g.addColorStop(.55, '#ffe2a8'); g.addColorStop(.56, '#2f93d8'); g.addColorStop(1, '#1d5f9e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    drawSun(980, 330, 1.6); for (let i = 0; i < 4; i++) drawCloud(((i * 400 - t * 160) % 1700 + 1700) % 1700 - 200, 120 + (i % 2) * 70, .9);
    for (let l = 0; l < 3; l++) { c.strokeStyle = `rgba(255,255,255,${.3 + l * .2})`; c.lineWidth = 3 + l; const sp = 80 + l * 90, yy = 480 + l * 90; for (let x = -((t * sp) % 140); x < W + 140; x += 140) { c.beginPath(); c.arc(x, yy, 14 + l * 4, Math.PI * 1.1, Math.PI * 1.9); c.arc(x + 30, yy, 14 + l * 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
    const px = lerp(-300, W + 400, io(k(.1, 3.1))), py = 230 + Math.sin(t * 4) * 20; for (let i = 0; i < 8; i++) { c.globalAlpha = .5 - i * .06; circle(px - 180 - i * 55, py + 30 + Math.sin(t * 6 + i) * 8, 18 + i * 4, '#fff'); } c.globalAlpha = 1;
    c.save(); c.translate(px, py); c.rotate(.08); drawPlancha(0, 0, .8, { dir: 1, expr: 'laugh', arms: 'up', shadow: false }); c.restore();
    const bx = lerp(-200, 700, io(k(.6, 3.3))); c.save(); c.translate(bx, 610 + Math.sin(t * 5) * 8); c.rotate(Math.sin(t * 3) * .06); drawKidBoat(0, 0, 2, { av: Game.team.avs[0], dir: 1, hull: PCOL[0] }); if (Game.team.avs[1] != null) drawKidBoat(-120, 20, 2, { av: Game.team.avs[1], dir: 1, hull: PCOL[1] }); c.restore();
    if (t > .8) bubble('¡A por el Teide! ¡Es la ÚLTIMA montaña!', clamp(px - 150, 40, W - 420), 90, 380, { size: 24, tailX: clamp(px, 80, W - 60), below: false, bg: '#f3e8ff' });
  } else if (t < 5.2) { // 2) rumbo a Canarias en el mapa
    c.fillStyle = '#23193d'; c.fillRect(0, 0, W, H);
    const m = this._cm || (this._cm = new MapES({ x: 190, y: 5, s: .98, key: 'cinemap', layers: { countries: true } })); m.drawBase();
    const a = m.P(...PROJ.es(40.4, -3.7)), b = m.cpt('teide'), mid = [(a[0] + b[0]) / 2 - 60, Math.min(a[1], b[1]) + 60];
    const q = io(k(3.4, 5.0)), bez = u => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mid[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * mid[1] + u * u * b[1]];
    c.setLineDash([10, 12]); c.lineWidth = 6; c.strokeStyle = '#ff5c8a'; c.beginPath(); for (let u = 0; u <= q; u += .02) { const p = bez(u); u ? c.lineTo(...p) : c.moveTo(...p); } c.stroke(); c.setLineDash([]);
    const p1 = bez(q), p2 = bez(Math.max(0, q - .18)); drawPlancha(p1[0], p1[1] - 30, .28, { dir: -1, expr: 'laugh', shadow: false }); drawKidBoat(p2[0], p2[1], .9, { av: Game.team.avs[0], dir: -1, hull: PCOL[0] });
    txt('Rumbo a Canarias…', 640, 740, { size: 44, font: 'T', color: '#fff', outline: 9 });
  } else { // 3) el Teide se despierta
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1f4d'); g.addColorStop(1, '#ff7a3d'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const up = E.outBack(k(5.2, 6.0)), sh = t > 5.0 && t < 6.2 ? Math.sin(t * 60) * 6 : 0;
    c.save(); c.translate(sh, (1 - up) * 500); drawTeide(640, 860, 3.2, { expr: t > 6.1 ? 'shout' : 'worried' }); c.restore();
    if (t > 6.1) { for (let i = 0; i < 4; i++) { const u = (t * 1.3 + i / 4) % 1; circle(640 + Math.sin(i * 2.3) * 200 * u, 200 - Math.sin(u * Math.PI) * 180 + u * 120, 24 - u * 10, '#ff6a2b', INK, 3); }
      const kk = E.outBack(k(6.1, 6.6)); c.save(); c.translate(640, 150); c.scale(kk, kk); c.rotate(-.04); txt('¡NADIE APLANA AL TEIDE!', 0, 0, { size: 64, font: 'T', color: '#ffc933', outline: 12 }); c.restore(); }
  }
  const f = Math.max(1 - k(0, .4), k(7.2, 7.6)); if (f > 0) { c.fillStyle = `rgba(0,0,0,${f})`; c.fillRect(0, 0, W, H); }
  c.restore();
};
CHAPTERS[6] = ChFinal;
