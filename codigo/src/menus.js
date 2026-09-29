/* =====================================================================
   PARTIDA Y MENÚS (v2): 1 o 2 jugadores, personajes, diario, final
   ===================================================================== */
const TESTS = [
  { id: 'banderas', name: 'El tirachinas de banderas', short: 'Tirachinas', topic: 'Mares, península, islas y costas', color: '#2fb8a0', music: 'mar', at: [42.9, -8.85], icon: 'faro', make: () => new GameBanderas() },
  { id: 'carrera', name: 'La gran carrera', short: 'Carrera', topic: 'El relieve de España', color: '#c98c5a', music: 'este', at: [40.3, -5.55], icon: 'tunel', make: () => new GameCarrera() },
  { id: 'rios', name: 'Fontaneros del río', short: 'Fontaneros', topic: 'Duero, Tajo, Ebro y ríos del norte', color: '#3e8ef0', music: 'norte', at: [42.25, -2.9], icon: 'fuente', make: () => new GameRios() },
  { id: 'agencia', name: 'Agencia de viajes Rosa', short: 'Agencia', topic: 'Los climas de España', color: '#ffb938', music: 'canarias', at: [39.4, -0.75], icon: 'agencia', make: () => new GameAgencia() },
  { id: 'puzle', name: 'El puzle de Europa', short: 'Puzle', topic: 'Europa: penínsulas, islas, montañas y ríos', color: '#a66cff', music: 'europa', at: [42.55, 1.45], icon: 'aduana', make: () => new GamePuzle() },
  { id: 'globos', name: 'Globos del diccionario', short: 'Globos', topic: 'Palabras del relieve y la costa (extra)', color: '#ff5c8a', music: 'globos', at: [40.42, -3.7], icon: 'cole', make: () => new GameGlobos() },
  { id: 'final', name: 'La prueba final', short: 'Final', topic: 'Todo el tema y batalla en Canarias', color: '#ff4b4b', music: 'jefe', at: [36.75, -4.45], icon: 'puerto', make: () => new Play(6) },
];
const MAIN_TESTS = [0, 1, 2, 3, 4];
const Game = {
  team: null,
  get diff() { return this.team ? this.team.diff : 'normal'; },
  d(tr, no, tu) { return { tranqui: tr, normal: no, turbo: tu }[this.diff]; },
  name(i) { return this.team ? this.team.names[i % this.team.names.length] : 'Jugador'; },
  unlocked(i) { if (Store.d.unlockAll || i !== 6) return true; return MAIN_TESTS.every(k => this.team.stars[k] >= 1); },
  mark(id, ok) { if (!this.team) return; const r = this.team.miss; r[id] = clamp((r[id] || 0) + (ok ? -1 : 2), 0, 6); if (!r[id]) delete r[id]; },
  choose(bank, n, key = x => x.id) { const reb = this.team ? this.team.miss : {}; const hard = shuffle(bank.filter(x => reb[key(x)])).slice(0, Math.ceil(n * .4)); const rest = shuffle(bank.filter(x => !hard.includes(x))); return shuffle(hard.concat(rest.slice(0, n - hard.length))); },
  sub(s) { const n = this.team ? this.team.names : ['Jugador']; return s.replace(/\{A\}/g, n.join(' y ')).replace(/\{B\}/g, n[1] || n[0]); },
  pw() { const t = this.team; return encodePw(t.stars, t.mode, DKEYS.indexOf(t.diff)); },
};
/* ---------- título ---------- */
function logo(x, y, s = 1) {
  const c = G.ctx; c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-.035);
  const t = '¡APLANATRÓN!'; c.font = font(118, 'T'); let xx = -c.measureText(t).width / 2;
  for (let i = 0; i < t.length; i++) { const ch = t[i], w = c.measureText(ch).width; const b = Math.sin(G.t * 4 + i * .6) * 6; txt(ch, xx + w / 2, b - 10, { size: 118, font: 'T', color: i % 2 ? '#ffc933' : '#ff8a3d', outline: 15, shadow: 11, shadowC: INK }); xx += w; }
  txt('El profe que no quería corregir', 0, 86, { size: 36, font: 'T', color: '#fff', outline: 9, shadow: 5, shadowC: INK });
  c.restore();
}
class Boot {
  enter() { this.btns = []; }
  draw(c) { bg('titulo'); c.fillStyle = 'rgba(30,20,70,.35)'; c.fillRect(0, 0, W, H); logo(640, 280, .9); const k = .6 + .4 * Math.sin(G.t * 4); c.globalAlpha = k; txt('TOCA LA PANTALLA PARA EMPEZAR', 640, 560, { size: 40, font: 'T', color: '#fff', outline: 9 }); c.globalAlpha = 1; txt('Subid el volumen: hay música.', 640, 630, { size: 26, color: '#fff', outline: 6 }); }
  down() { Sound.init(); try { const el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement && matchMedia('(pointer: coarse)').matches) el.requestFullscreen().then(() => { try { screen.orientation.lock('landscape'); } catch (e) { } }).catch(() => { }); } catch (e) { } Sound.sfx('fanfare'); go(() => new Title(), { col: '#ffc933' }); }
  key(e) { if (e.key === 'Enter' || e.key === ' ') { this.down(); return true; } }
}
class Title {
  enter() {
    this.map = new MapES({ x: 250, y: 130, s: .82, key: 'titlemap', layers: { countries: false } });
    this.rise = {}; for (const k of Object.keys(GEO.es.ranges)) this.rise[k] = 1; this.px = -400; this.pass = 0;
    this.btns = [new Btn({ x: 440, y: 596, w: 400, h: 124, label: '¡A JUGAR!', size: 56, color: '#ff5c8a', pulse: true, key: ['Enter', ' '], onTap: () => go(() => new ModeSelect()) }), soundBtn(W - 106, 20), new Btn({ x: W - 250, y: 20, w: 130, h: 78, label: 'PROFE', size: 26, color: '#5d5680', onTap: () => go(() => new Profe()) })];
    Sound.play('titulo');
  }
  update(dt) {
    this.px += dt * 260; if (this.px > W + 500) { this.px = -500; this.pass++; }
    if (!this.spr) return; for (const k in this.rise) { const sp = this.spr[k]; if (!sp) continue; const under = Math.abs(sp.cx - this.px) < 90; if (under && this.rise[k] > .5) { this.rise[k] = .02; Sound.sfx('thud'); puff(sp.cx, sp.cy, { n: 4, c: '#fff' }); later(1.2 + rnd(.4), () => { tw(this.rise, { [k]: 1 }, .8, { ease: E.outBack }); Sound.sfx('boing'); }); } }
  }
  sprites() { // cada cordillera en su propio lienzo pequeño: al planchar solo se aplasta en vertical
    const m = this.map; this.spr = {};
    for (const k of Object.keys(GEO.es.ranges)) { const r = GEO.es.ranges[k]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < r.length; i += 2) { const [x, y] = m.P(r[i], r[i + 1]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      x0 -= 30; x1 += 30; y0 -= 45; y1 += 14; const bw = Math.ceil(x1 - x0), bh = Math.ceil(y1 - y0);
      this.spr[k] = { x0, y0, bw, bh, cx: (x0 + x1) / 2, cy: y1 - 20, cv: cached('tspr:' + k, bw, bh, c => { c.translate(-x0, -y0); m.paintRangePeaks(c, r, RANGE_INFO[k] || { h: .8, col: '#c98c5a' }, m.tf, 1); }) }; }
    this.order = Object.keys(this.spr).sort((a, b) => this.spr[a].y0 + this.spr[a].bh - this.spr[b].y0 - this.spr[b].bh);
  }
  draw(c) {
    bg('titulo'); this.map.drawBase(); this.map.drawRivers(['Duero', 'Tajo', 'Ebro']);
    if (!this.spr) this.sprites();
    for (const k of this.order) { const sp = this.spr[k], r = this.rise[k]; if (r < .03) continue; c.save(); c.translate(sp.x0, sp.y0 + sp.bh); c.scale(1, r); c.drawImage(sp.cv, 0, -sp.bh, sp.bw, sp.bh); c.restore(); }
    drawPlancha(this.px, 470, .55, { dir: 1, expr: 'laugh', arms: 'up' });
    c.fillStyle = 'rgba(30,20,70,.18)'; c.fillRect(0, 0, W, H);
    logo(640, 200, .95);
    [0, 3].forEach((av, i) => drawKid(170 + i * 70, 760, 1.25, { av, dir: 1, walk: false, look: .6, ph: i }));
    drawRosa(1130, 620, .7, { expr: 'worried', look: [-1, -.3] });
    for (const b of this.btns) b.draw();
    txt('Tema 1 de Ciencias Sociales · 5.º de Primaria', 640, H - 30, { size: 20, color: '#fff', outline: 5 });
  }
}
class ModeSelect {
  enter() {
    const mk = (mode, x) => new Btn({ x, y: 190, w: 470, h: 470, color: mode === 1 ? '#3ec1f3' : '#ff5c8a', r: 40, label: '', icon: (cx, cy) => {
      txt(mode === 1 ? '1 JUGADOR' : '2 JUGADORES', cx, cy - 170, { size: 54, font: 'T', color: '#fff', outline: 10 });
      if (mode === 1) drawKid(cx, cy + 110, 2.3, { av: 2, walk: false, look: .2 }); else { drawKid(cx - 80, cy + 110, 2.1, { av: 1, dir: 1 }); drawKid(cx + 80, cy + 110, 2.1, { av: 4, dir: -1, ph: 1 }); }
      txt(mode === 1 ? 'Para jugar en casa' : 'Para los grupos interactivos', cx, cy + 170, { size: 28, color: '#fff', outline: 6 });
    }, onTap: () => go(() => new Teams(mode)) });
    this.btns = [mk(1, 130), mk(2, 680), backBtn(() => go(() => new Title()))];
    Sound.play('titulo');
  }
  draw(c) { bg('titulo'); txt('¿CUÁNTOS JUGÁIS?', 640, 100, { size: 64, font: 'T', color: '#ffc933', outline: 11, shadow: 6, shadowC: INK }); for (const b of this.btns) b.draw(); }
}
class Teams {
  constructor(mode) { this.mode = mode; }
  enter() {
    this.btns = [
      new Btn({ x: 60, y: 668, w: 290, h: 106, label: this.mode === 1 ? '+ NUEVO JUGADOR' : '+ NUEVA PAREJA', size: 27, color: '#7ce05c', onTap: () => go(() => new NewTeam(this.mode)) }),
      new Btn({ x: 370, y: 668, w: 310, h: 106, label: 'TENGO CONTRASEÑA', size: 27, color: '#3ec1f3', onTap: () => go(() => new Password(this.mode)) }),
      new Btn({ x: 700, y: 668, w: 330, h: 106, label: 'CUENTA ONLINE', size: 29, color: '#a66cff', onTap: () => Accounts.open(this.mode) }),
      new Btn({ x: 1050, y: 668, w: 170, h: 106, label: 'VOLVER', size: 27, color: '#8c85b0', onTap: () => go(() => new ModeSelect()) })];
    const teams = Store.d.teams.filter(t => t.mode === this.mode).sort((a, b) => (b.last || 0) - (a.last || 0)).slice(0, 8);
    teams.forEach((t, i) => { const x = 60 + (i % 4) * 295, y = 150 + Math.floor(i / 4) * 245;
      this.btns.push(new Btn({ x, y, w: 275, h: 225, color: '#fff8ea', label: '', r: 26, icon: (cx, cy) => {
        t.avs.forEach((av, k) => drawKid(cx + (t.avs.length > 1 ? (k ? 38 : -38) : 0), cy - 10, .9, { av, ph: k, dir: k ? -1 : 1 }));
        const nm = t.names.join(' y '); txt(nm, cx, cy + 34, { size: fitSize(nm, 250, 26), color: INK });
        const tot = t.stars.reduce((a, b) => a + b, 0); drawStar(cx - 36, cy + 74, 18, true); txt(tot + ' / 21', cx + 20, cy + 76, { size: 24, color: INK });
      }, onTap: () => { Accounts.clearActive(); Game.team = t; t.last = Date.now(); Store.save(); go(() => t.seenIntro ? new Hub() : new Intro()); } })); });
    this.empty = !teams.length; Sound.play('titulo');
  }
  draw(c) { bg('titulo'); txt(this.mode === 1 ? '¿QUIÉN JUEGA?' : '¿QUÉ PAREJA JUEGA?', 640, 80, { size: 58, font: 'T', color: '#ffc933', outline: 11, shadow: 6, shadowC: INK });
    if (this.empty) { drawRosa(300, 420, .9, { expr: 'talk', talk: true }); bubble('Todavía no hay nadie guardado en esta tablet. Pulsa «NUEVO». Si ya jugaste en otra tablet, usa tu contraseña.', 460, 300, 660, { tailX: 470, below: true, size: 30 }); }
    for (const b of this.btns) b.draw(); }
}
class NewTeam {
  constructor(mode, preset) { this.mode = mode; this.preset = preset; }
  enter() {
    this.i = 0; this.names = []; this.avs = []; this.step = 'av'; this.btns = [];
    this.kb = new Keyboard(this, { y: 400, max: 14, upper: true, autoCap: true, accents: true, okLabel: 'SIGUIENTE', onOk: v => this.okName(v) }); this.kb.show(false);
    this.btns.push(backBtn(() => go(() => new Teams(this.mode))));
    this.avBtns = AVATARS.map((a, k) => new Btn({ x: 110 + (k % 3) * 360, y: 170 + Math.floor(k / 3) * 290, w: 340, h: 270, color: '#fff8ea', r: 30, label: '', icon: (cx, cy) => { drawKid(cx, cy + 105, 2, { av: k, look: .2, ph: k }); }, onTap: () => this.pickAv(k) }));
    this.btns.push(...this.avBtns);
    this.diffBtns = DKEYS.map((k, i) => new Btn({ x: 90 + i * 380, y: 300, w: 340, h: 330, color: DIFF[k].color, vis: false, label: '', r: 30, icon: (cx, cy) => { txt(DIFF[k].label, cx, cy - 110, { size: 56, font: 'T', color: '#fff', outline: 9 }); wrap(DIFF[k].desc, 280, 28).forEach((l, j) => txt(l, cx, cy - 40 + j * 34, { size: 28, color: INK })); }, onTap: () => this.create(k) }));
    this.btns.push(...this.diffBtns);
  }
  pickAv(k) { this.avs[this.i] = k; Sound.sfx('ok'); this.step = 'name'; this.avBtns.forEach(b => b.vis = false); this.kb.show(true); this.kb.val = ''; this.kb.shift = true; }
  okName(v) {
    v = v.trim(); if (!v) { shake(8, .2); Sound.sfx('bad'); return; }
    this.names[this.i] = v.charAt(0).toUpperCase() + v.slice(1); Sound.sfx('ok'); this.i++;
    if (this.i < this.mode) { this.step = 'av'; this.kb.show(false); this.avBtns.forEach(b => b.vis = true); return; }
    this.kb.show(false);
    if (this.preset) return this.create(this.preset.diff);
    this.step = 'diff'; this.diffBtns.forEach(b => b.vis = true);
  }
  create(diff) {
    const p = this.preset;
    const t = { id: Date.now().toString(36), mode: this.mode, names: this.names, avs: this.avs, diff, stars: p ? p.stars.slice() : [0, 0, 0, 0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0, 0, 0, 0], miss: {}, seenIntro: !!p, seen: {}, last: Date.now() };
    Accounts.clearActive(); Store.d.teams.push(t); Store.save(); Game.team = t; go(() => p ? new Hub() : new Intro());
  }
  key(e) { if (this.step === 'name') return this.kb.key(e); }
  draw(c) {
    bg('titulo'); c.fillStyle = 'rgba(30,20,70,.12)'; c.fillRect(0, 0, W, H);
    const who = 'JUGADOR ' + (this.i + 1) + ': ';
    if (this.step === 'av') txt(this.mode === 1 ? 'Elige tu personaje' : who + 'elige personaje', 640, 90, { size: 50, font: 'T', color: PCOL[this.i], outline: 9 });
    if (this.step === 'name') { txt(this.mode === 1 ? '¿Cómo te llamas?' : who + '¿cómo te llamas?', 640, 80, { size: 48, font: 'T', color: PCOL[this.i], outline: 9 }); drawKid(230, 360, 1.8, { av: this.avs[this.i], look: .5 }); this.kb.drawField(330, 170, 620, 130); txt('(con mayúscula, que es un nombre propio)', 640, 340, { size: 22, color: '#fff', outline: 5 }); }
    if (this.step === 'diff') { txt('¿Cómo de difícil?', 640, 110, { size: 52, font: 'T', color: '#ffc933', outline: 9 }); txt(this.names.join(' y '), 640, 190, { size: 38, color: '#fff', outline: 7 }); txt('El profe lo puede cambiar desde su panel.', 640, 700, { size: 24, color: '#fff', outline: 5 }); }
    for (const b of this.btns) b.draw();
  }
}
class Password {
  constructor(mode) { this.mode = mode; }
  enter() { this.btns = []; this.msg = null; this.kb = new Keyboard(this, { y: 400, max: 30, upperOnly: true, okLabel: 'ENTRAR', onOk: v => this.ok(v) }); this.btns.push(backBtn(() => go(() => new Teams(this.mode)))); }
  ok(v) { const r = decodePw(v); if (!r || r.bad) { Sound.sfx('bad'); shake(10, .3); this.msg = r && r.bad ? '«' + r.bad[0] + '» no es una palabra de contraseña. ¿Está bien escrita?' : 'Esa contraseña no funciona. Revisa las tres palabras y el orden.'; return; } Sound.sfx('ok'); go(() => new NewTeam(r.mode, r)); }
  key(e) { return this.kb.key(e); }
  draw(c) { bg('titulo'); txt('Escribe tus tres palabras', 640, 80, { size: 48, font: 'T', color: '#ffc933', outline: 9 }); txt('separadas por espacios. Por ejemplo: VOLCAN PULPO NIEBLA', 640, 134, { size: 26, color: '#fff', outline: 5 }); this.kb.drawField(160, 180, 960, 120, { size: 48 }); if (this.msg) { drawAlvaro(1140, 330, .3, { expr: 'laugh' }); bubble(this.msg, 190, 316, 800, { size: 24, below: true, tail: false }); } for (const b of this.btns) b.draw(); }
}
function startTest(i) { const t = TESTS[i], v = videoForTest(i); go(v ? () => new VideoScene(v, () => t.make()) : () => t.make(), { col: t.color }); }
/* =====================================================================
   FIN DE CAPÍTULO
   ===================================================================== */
class ChapterEnd {
  constructor(o) { this.o = o; }
  enter() {
    const o = this.o, t = Game.team, i = o.ch; this.stars = o.stars;
    const before = t.stars[i]; const wasLocked = !Game.unlocked(6);
    t.stars[i] = Math.max(t.stars[i], this.stars); t.best[i] = Math.max(t.best[i] || 0, o.score || 0); if (wasLocked && Game.unlocked(6)) t.justUnlocked = 6;
    if (before === 0) t.justDone = i;
    this.newEsq = before === 0 && this.stars > 0 && ESQUEMA.some(e => e.t === i); Store.save();
    this.k = 0; this.shown = 0; tw(this, { k: 1 }, .6, { ease: E.outBack });
    this.btns = [new Btn({ x: 700, y: 666, w: 270, h: 106, label: 'REPETIR', size: 36, color: '#3ec1f3', onTap: () => startTest(i) }), new Btn({ x: 990, y: 666, w: 270, h: 106, label: 'SEGUIR', size: 38, color: '#7ce05c', pulse: true, key: ['Enter'], onTap: () => this.leave() })];
    Sound.play('victoria', { onEnd: () => { if (G.scene === this) Sound.play('mapa', { vol: .6 }); } }); later(.5, () => confetti(120));
    for (let s = 0; s < this.stars; s++) later(.9 + s * .45, () => { this.shown = s + 1; Sound.sfx('star', s); burst(250 + s * 150, 300, { n: 24 }); shake(5, .15); });
  }
  leave() { const i = this.o.ch; if (i === 6 && !Game.team.seen.fin) { Game.team.seen.fin = 1; Store.save(); go(() => new EndCine()); return; } go(() => this.newEsq ? new Esquema(false, ESQUEMA.findIndex(e => e.t === i)) : new Hub()); }
  draw(c) {
    const o = this.o, ci = TESTS[o.ch]; bg('titulo');
    c.save(); c.translate(640, 400); c.scale(this.k, this.k); c.translate(-640, -400);
    panel(60, 70, 560, 620, '#fff8ea', { r: 34 });
    txt(this.stars === 3 ? '¡PERFECTO!' : '¡CONSEGUIDO!', 340, 140, { size: 60, font: 'T', color: '#ff8a3d' }); txt(ci.name, 340, 196, { size: 26, color: INK });
    for (let k = 0; k < 3; k++) drawStar(190 + k * 150, 300, 58, k < this.shown, { rot: (k - 1) * .15 });
    if (o.errors != null) { txt('Fallos: ' + o.errors + (o.hints != null ? '   ·   Pistas: ' + o.hints : ''), 340, 400, { size: 30, color: INK }); if (o.time) txt('Tiempo: ' + Math.floor(o.time / 60) + ' min ' + Math.round(o.time % 60) + ' s', 340, 446, { size: 26, color: '#6a4fc8' }); }
    if (o.score != null) txt('Puntos: ' + o.score + '   ·   Récord: ' + Game.team.best[o.ch], 340, 474, { size: 24, color: '#6a4fc8' });
    if (o.ch !== 6 && o.ch !== 5) chip('+' + EXAM_Q[o.ch] + ' preguntas para el examen de Álvaro', 340, 525, '#ff5c8a', '#fff', 18);
    if (this.newEsq) chip('¡Nuevo trozo del esquema!', 340, 575, '#ffc933', INK, 24);
    Game.team.avs.forEach((av, k) => drawKid(210 + k * 80, 685, .85, { av, ph: k, walk: false, look: .2 }));
    drawRosa(525, 655, .35, { expr: 'proud' });
    panel(660, 70, 580, 570, '#fff', { r: 34 }); txt('PARA EL CUADERNO', 950, 120, { size: 36, font: 'T', color: '#ff5c8a' });
    const m = o.missed || [];
    if (!m.length) { txt('¡Ni un fallo!', 950, 300, { size: 40, font: 'T', color: '#7ce05c' }); drawTeide(950, 560, .7, { expr: 'proud' }); }
    else { txt('Copiad esto bien en el cuaderno:', 950, 166, { size: 22, color: '#8c85b0' }); let y = 204; for (const s of m.slice(0, 7)) { const L = wrap(s, 510, 22).slice(0, 2); L.forEach((l, j) => txt((j ? '   ' : '• ') + l, 690, y + j * 26, { size: 22, align: 'left', color: INK, w: 600 })); y += L.length * 26 + 14; } }
    c.restore(); for (const b of this.btns) b.draw();
  }
}
class Ending {
  enter() { this.btns = [new Btn({ x: 980, y: 680, w: 270, h: 100, label: 'MAPA', size: 40, color: '#7ce05c', onTap: () => go(() => new Hub()) })]; Sound.play('fin'); this.t = 0; confetti(150); }
  update(dt) { this.t += dt; if (this.t % 2.5 < dt) confetti(60); }
  draw(c) {
    bg('cole');
    drawAlvaro(760, 560, .62, { expr: 'side', arms: 'cross' });
    c.save(); c.strokeStyle = 'rgba(40,60,70,.55)'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { const yy = 610 + i * 24; c.beginPath(); c.moveTo(715, yy); for (let k = 1; k <= 6; k++) c.lineTo(715 + k * 15, yy + (k % 2 ? 6 : -6)); c.stroke(); } c.restore();
    Game.team.avs.forEach((av, k) => drawKid(330 + k * 110, 760, 1.8, { av, ph: k, look: .6 }));
    drawRosa(1110, 470, .7, { expr: 'proud' });
    txt('¡FIN!', 640, 110, { size: 110, font: 'T', color: '#ffc933', outline: 14, shadow: 8, shadowC: INK });
    txt(Game.team.names.join(' y ') + (Game.team.names.length > 1 ? ' han' : ' ha') + ' salvado España (y el examen)', 640, 206, { size: 34, color: '#fff', outline: 7 });
    txt('Álvaro tiene 2 350 preguntas que corregir. Y sonríe un poquito.', 640, 252, { size: 26, color: '#fff', outline: 6 });
    for (const b of this.btns) b.draw();
  }
}
/* =====================================================================
   ESQUEMA SECRETO
   ===================================================================== */
class Esquema {
  constructor(all, hi) { this.all = all; this.hi = hi; }
  enter() {
    this.btns = [backBtn(() => go(() => this.all ? new Profe() : new Hub()), 20, 18, this.all ? 'VOLVER' : 'MAPA')];
    this.tab = this.hi != null && this.hi >= 0 ? this.hi : 0; this.k = 1;
    ESQUEMA.forEach((e, i) => this.btns.push(new Btn({ x: 20, y: 104 + i * 94, w: 250, h: 86, color: this.open(i) ? e.col : '#8c85b0', label: '', r: 20, icon: (cx, cy) => { const L = wrap(e.title, 210, 22, 'T'); L.forEach((l, j) => txt(l, cx, cy - (L.length - 1) * 12 + j * 24, { size: 22, font: 'T', color: '#fff', outline: 6 })); if (this.tab === i) { G.ctx.lineWidth = 6; G.ctx.strokeStyle = '#fff'; rrPath(G.ctx, cx - 118, cy - 34, 236, 68, 16); G.ctx.stroke(); } }, onTap: () => { this.tab = i; this.k = 0; tw(this, { k: 1 }, .35, { ease: E.outBack }); } })));
    if (this.hi != null && this.hi >= 0) later(.4, () => { confetti(80); Sound.sfx('fanfare'); });
    Sound.play('mapa', { vol: .6 });
  }
  open(i) { if (this.all) return true; const e = ESQUEMA[i]; return Game.team && Game.team.stars[e.t] > 0; }
  draw(c) {
    c.fillStyle = '#fdf6e3'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(62,193,243,.25)'; c.lineWidth = 2; for (let y = 40; y < H; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = 'rgba(255,92,138,.4)'; c.beginPath(); c.moveTo(290, 0); c.lineTo(290, H); c.stroke();
    txt('ESQUEMA DEL TEMA 1', 780, 58, { size: 46, font: 'T', color: '#ff8a3d' });
    const e = ESQUEMA[this.tab]; c.save(); c.translate(780, 420); c.scale(.9 + .1 * this.k, .9 + .1 * this.k); c.translate(-780, -420); c.globalAlpha = this.k;
    if (!this.open(this.tab)) { panel(360, 160, 840, 500, '#eee8f8', { r: 30 }); txt('¡BLOQUEADO!', 780, 300, { size: 60, font: 'T', color: '#8c85b0' }); txt('Supera «' + TESTS[e.t].name + '»', 780, 380, { size: 30, color: INK }); txt('para desbloquear este trozo.', 780, 420, { size: 30, color: INK }); drawAlvaro(780, 700, .4, { expr: 'smug', arms: 'cross' }); }
    else { const rows = e.rows, n = rows.length, top = 120, rowH = Math.min(128, 600 / n);
      rr(320, top + 6, 230, n * rowH - 12, 26, e.col, INK, 6); wrap(e.title, 200, 30, 'T').forEach((l, j, a) => txt(l, 435, top + n * rowH / 2 - (a.length - 1) * 17 + j * 34, { size: 30, font: 'T', color: '#fff', outline: 7 }));
      rows.forEach((r, i) => { const y = top + i * rowH + rowH / 2; c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.moveTo(550, top + n * rowH / 2); c.bezierCurveTo(580, top + n * rowH / 2, 570, y, 600, y); c.stroke();
        rr(600, y - rowH / 2 + 6, 240, rowH - 12, 18, shade(e.col, .55), INK, 5); wrap(r[0], 220, 22).slice(0, 3).forEach((l, j, a) => txt(l, 720, y - (a.length - 1) * 13 + j * 26, { size: 22, color: INK }));
        c.beginPath(); c.moveTo(840, y); c.lineTo(860, y); c.stroke(); rr(860, y - rowH / 2 + 6, 400, rowH - 12, 14, '#fff', INK, 4);
        let fs = 19, L = wrap(r[1], 380, fs, 'B', 500); if (L.length * fs * 1.2 > rowH - 20) { fs = 16; L = wrap(r[1], 380, fs, 'B', 500); } L.slice(0, 6).forEach((l, j, a) => txt(l, 875, y - (a.length - 1) * (fs * .6) + j * fs * 1.2, { size: fs, align: 'left', color: INK, w: 500 })); }); }
    c.restore(); for (const b of this.btns) b.draw();
  }
}
/* =====================================================================
   PANEL DEL PROFE
   ===================================================================== */
const PROFE_CODE = 'CORREGIR';
class Profe {
  enter() { this.ok = false; this.btns = []; this.msg = ''; this.kb = new Keyboard(this, { y: 400, max: 12, upperOnly: true, okLabel: 'ENTRAR', onOk: v => { if (strip(v).toUpperCase() === PROFE_CODE) { Sound.sfx('ok'); this.open(); } else { Sound.sfx('bad'); shake(8, .2); this.msg = 'Código incorrecto.'; this.kb.val = ''; } } }); this.btns.push(backBtn(() => go(() => new Title()))); }
  open() { this.ok = true; this.sel = null; this.page = 0; this.build(); }
  build() {
    const B = [backBtn(() => go(() => new Title()))];
    B.push(new Btn({ x: 40, y: 120, w: 370, h: 84, color: Store.d.unlockAll ? '#7ce05c' : '#8c85b0', label: Store.d.unlockAll ? 'FINAL: SIEMPRE ABIERTA' : 'FINAL: AL ACABAR LAS 5', size: 22, onTap: () => { Store.d.unlockAll = !Store.d.unlockAll; Store.save(); this.build(); } }));
    B.push(new Btn({ x: 40, y: 220, w: 370, h: 84, color: G.low ? '#ffb938' : '#8c85b0', label: G.low ? 'EFECTOS: MODO LIGERO' : 'EFECTOS: COMPLETOS', size: 22, onTap: () => { setLow(!G.low); this.build(); } }));
    B.push(new Btn({ x: 40, y: 320, w: 370, h: 84, color: '#ff4b4b', label: this.confirm ? '¿SEGURO? PULSA OTRA VEZ' : 'BORRAR TODO', size: 22, onTap: () => { if (this.confirm) { Store.d.teams = []; Store.save(); this.confirm = false; this.sel = null; } else { this.confirm = true; later(3, () => { this.confirm = false; this.build(); }); } this.build(); } }));
    B.push(new Btn({ x: 40, y: 420, w: 370, h: 84, color: '#3ec1f3', label: 'VER EL ESQUEMA COMPLETO', size: 22, onTap: () => go(() => new Esquema(true)) }));
    const teams = Store.d.teams.slice().sort((a, b) => (b.last || 0) - (a.last || 0)); this.teams = teams;
    teams.slice(this.page * 6, this.page * 6 + 6).forEach((t, i) => B.push(new Btn({ x: 450, y: 120 + i * 92, w: 360, h: 82, color: this.sel === t ? '#ffc933' : '#fff8ea', tc: INK, label: t.names.join(' y '), size: 24, f: 'B', r: 18, onTap: () => { this.sel = t; this.build(); } })));
    if (teams.length > 6) B.push(new Btn({ x: 450, y: 680, w: 360, h: 76, color: '#8c85b0', label: 'MÁS ▸', size: 22, onTap: () => { this.page = (this.page + 1) % Math.ceil(teams.length / 6); this.build(); } }));
    if (this.sel) { DKEYS.forEach((k, i) => B.push(new Btn({ x: 850 + i * 136, y: 190, w: 126, h: 70, color: this.sel.diff === k ? DIFF[k].color : '#8c85b0', label: DIFF[k].label, size: 20, onTap: () => { this.sel.diff = k; Store.save(); this.build(); } }))); B.push(new Btn({ x: 850, y: 680, w: 400, h: 76, color: '#ff4b4b', label: 'BORRAR', size: 22, onTap: () => { Store.d.teams = Store.d.teams.filter(t => t !== this.sel); this.sel = null; Store.save(); this.build(); } })); }
    this.btns = B;
  }
  key(e) { if (!this.ok) return this.kb.key(e); }
  draw(c) {
    bg('titulo'); c.fillStyle = 'rgba(30,20,70,.6)'; c.fillRect(0, 0, W, H);
    if (!this.ok) { txt('PANEL DEL PROFE', 640, 90, { size: 54, font: 'T', color: '#ffc933', outline: 9 }); txt(this.msg || 'Escribe el código', 640, 150, { size: 28, color: '#fff', outline: 5 }); this.kb.drawField(360, 200, 560, 130); }
    else {
      txt('PANEL DEL PROFE', 640, 60, { size: 46, font: 'T', color: '#ffc933', outline: 9 }); txt('Guardados en esta tablet (' + this.teams.length + ')', 630, 100, { size: 22, color: '#fff', outline: 5 });
      if (this.sel) { const t = this.sel; panel(840, 110, 420, 560, '#fff8ea'); txt(t.names.join(' y '), 1050, 150, { size: fitSize(t.names.join(' y '), 390, 28), color: INK }); txt((t.mode === 1 ? '1 jugador' : '2 jugadores') + ' · Contraseña: ' + encodePw(t.stars, t.mode, DKEYS.indexOf(t.diff)).join(' '), 1050, 286, { size: 16, color: INK });
        TESTS.forEach((ci, i) => { txt((i + 1) + '. ' + ci.name, 860, 322 + i * 24, { size: 17, align: 'left', color: INK, w: 500 }); for (let k = 0; k < 3; k++) drawStar(1180 + k * 26, 322 + i * 24, 10, k < t.stars[i]); });
        const miss = Object.entries(t.miss).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => itemName(e[0]));
        txt('Lo que más le cuesta:', 860, 530, { size: 20, align: 'left', color: '#c0304a' }); wrap(miss.length ? miss.join(', ') : '¡Nada todavía!', 380, 18, 'B', 500).slice(0, 5).forEach((l, i) => txt(l, 860, 560 + i * 23, { size: 18, align: 'left', color: INK, w: 500 })); }
      else { txt('Toca un nombre para ver su progreso,', 1050, 380, { size: 22, color: '#fff', outline: 5 }); txt('cambiar su nivel o borrarlo.', 1050, 410, { size: 22, color: '#fff', outline: 5 }); }
      txt('Código del panel: ' + PROFE_CODE, 225, 560, { size: 18, color: '#fff', outline: 4 });
    }
    for (const b of this.btns) b.draw();
  }
}
function itemName(id) {
  const [k, v] = id.includes('_') ? [id.slice(0, id.indexOf('_')), id.slice(id.indexOf('_') + 1)] : [id, id];
  const map = { tur: () => 'turista del clima ' + v, b: () => (BANDERAS.find(x => x.id === 'b_' + v) || {}).short, nom: () => (NOMBRES.find(n => n.id === v) || {}).name, rel: () => (RELIEVE.find(n => n.id === v) || {}).name, nace: () => 'dónde nace el ' + v, mar: () => 'dónde desemboca el ' + v, eu: () => (EUROPA.find(n => n.id === v) || {}).name, cl: () => 'clima ' + v, tm: () => 'tiempo del clima ' + v, vg: () => 'vegetación del clima ' + v };
  if (map[k]) return map[k]() || id; const q = REPASO.find(q => q.id === id); if (q) return q.q; const w = VOCAB.find(x => x.id === id); if (w) return w.word;
  return { depr: 'depresión del Ebro', fin: 'cabo de Finisterre', cadiz: 'golfo de Cádiz', estrecho: 'estrecho de Gibraltar', delta: 'delta del Ebro', norte: 'ríos del norte', teide: 'el Teide' }[id] || id;
}
