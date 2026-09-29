'use strict';
/* =====================================================================
   EL MAPA: España pequeñita por la que se camina (o se navega) para
   encontrar las pruebas. Cada prueba superada arregla su trozo.
   ===================================================================== */
const EXAM_Q = [10, 8, 7, 8, 12, 1, 0]; // preguntas que vuelven al examen de Álvaro con cada prueba
const HOJAS = [[43.2, -7.8, 'q2'], [41.6, -6.3, 'q6'], [39.3, -4.8, 'q10'], [38.1, -5.9, 'q15'], [37.4, -2.3, 'q3'], [39.9, -2.1, 'q9'], [41.6, -.9, 'q28'], [43.0, -.5, 'q1'], [42.7, -4.5, 'q11'], [39.6, 3.0, 'q27'], [38.6, -8.5, 'q7'], [28.4, -14.0, 'q19']];
class Hub {
  enter() {
    const t = Game.team; this.two = t.names.length > 1; this.w = this.world = getWorld('hub'); this.btns = []; this.t = 0;
    t.sheets = t.sheets || [];
    const st = t.stars, jd = t.justDone; if (jd != null) { delete t.justDone; Store.save(); }
    this.anim = { rise: st[1] > 0 && jd !== 1 ? 1 : 0, river: st[2] > 0 && jd !== 2 ? 1 : 0, names: st[0] > 0 && jd !== 0 ? 1 : 0, clima: st[3] > 0 && jd !== 3 ? 1 : 0, eu: st[4] > 0 && jd !== 4 ? 1 : 0, globos: st[5] > 0 && jd !== 5 ? 1 : 0 };
    this.stations = TESTS.map((ts, i) => { const [x, y] = this.w.ll(...ts.at); return { i, ts, x, y }; });
    const home = this.stations[5]; const sx = home.x + 40, sy = home.y + 150;
    const last = t.hubPos && this.w.isLand(...t.hubPos) ? t.hubPos : [sx, sy];
    this.players = t.avs.map((av, i) => ({ i, av, name: t.names[i], x: last[0] + (this.two ? (i ? 30 : -30) : 0), y: last[1], vx: 0, vy: 0, dir: 1, mode: 'walk', joy: null, goal: null, moving: false }));
    this.cam = [last[0], last[1]]; this.rosa = { x: last[0] - 60, y: last[1] - 90 }; this.hintOn = false; this.ch = {};
    this.ap = { t: rnd(10) };
    this.menuBtn = new Btn({ x: W - 110, y: 14, w: 94, h: 76, color: '#8c85b0', label: 'MENÚ', size: 20, r: 20, key: ['Escape'], onTap: () => this.menu() });
    this.enterBtn = new Btn({ x: W / 2 + 180, y: H - 138, w: 250, h: 112, color: '#7ce05c', label: '¡ENTRAR!', size: 40, r: 30, vis: false, pulse: true, key: [' ', 'Enter'], onTap: () => this.enterStation() });
    this.btns.push(this.menuBtn, this.enterBtn);
    Sound.play('mapa'); Sound.extra(false);
    if (!t.seen.hub) { t.seen.hub = 1; Store.save(); later(.8, () => this.say(GUION.hub1)); }
    if (jd != null) later(.9, () => this.restore(jd));
    if (t.justUnlocked === 6) { delete t.justUnlocked; Store.save(); later(jd != null ? 4.2 : 1, () => { this.say([{ who: 'rosa', face: 'proud', text: '¡Las cinco pruebas superadas! Se ha abierto el PUERTO del sur, en Málaga: la prueba final.' }, { who: 'alvaro', face: 'angry', text: '¡Os espero en el puerto! ¡El Aplanatrón tiene el depósito lleno!' }]); }); }
  }
  restore(i) {
    const n = EXAM_Q[i], k = { 0: 'names', 1: 'rise', 2: 'river', 3: 'clima', 4: 'eu', 5: 'globos' }[i];
    if (k) tw(this.anim, { [k]: 1 }, i === 1 ? 2.2 : 1.6, { ease: E.lin });
    const s = this.stations[i]; this.cam = [s.x, s.y]; this.follow = 2.6;
    Sound.sfx(i === 1 ? 'rumble' : i === 2 ? 'splash' : 'sparkle'); if (i === 1) later(.3, () => Sound.sfx('rise'));
    later(1.6, () => this.alvSay('hurt', n > 1 ? '¡NOOO! ¡' + n + ' preguntas más en mi examen!' : '¡Una pregunta más! ¡Mis tardes libres!'));
  }
  /* diálogos y bocadillos: los mismos que en el juego del mapa grande */
  menu() {
    if (this.paused) return; this.paused = true; this.savedBtns = this.btns;
    const pw = Game.pw().join(' ');
    this.btns = [new Btn({ x: 470, y: 250, w: 340, h: 100, label: 'SEGUIR', size: 40, color: '#7ce05c', key: ['Escape', 'Enter'], onTap: () => { this.paused = false; this.btns = this.savedBtns; } }),
      new Btn({ x: 470, y: 370, w: 340, h: 96, label: 'ESQUEMA', size: 34, color: '#ffc933', onTap: () => this.leave(() => new Esquema()) }),
      new Btn({ x: 90, y: 370, w: 300, h: 96, label: 'VÍDEOS', size: 34, color: '#3ec1f3', onTap: () => this.leave(() => new Cine()) }),
      new Btn({ x: 470, y: 486, w: 340, h: 96, label: 'SALIR', size: 34, color: '#ff8a3d', onTap: () => this.leave(() => new ModeSelect()) }), soundBtn(W - 110, 20)];
    if (Game.team.stars[6] > 0) this.btns.push(new Btn({ x: 850, y: 370, w: 300, h: 96, label: 'VER EL FINAL', size: 28, color: '#a66cff', onTap: () => this.leave(() => new EndCine()) }));
    this.pwText = pw;
  }
  leave(mk) { Game.team.hubPos = [this.players[0].x, this.players[0].y]; Store.save(); go(mk); }
  nearStation() { let b = null, bd = 95; for (const p of this.players) for (const s of this.stations) { const d = dist(p.x, p.y, s.x, s.y + 20); if (d < bd) { bd = d; b = s; } } return b; }
  enterStation() {
    const s = this.near; if (!s || this.dialog) return;
    if (!Game.unlocked(s.i)) { Sound.sfx('buzz'); const n = MAIN_TESTS.filter(k => Game.team.stars[k] > 0).length; this.say([{ who: 'alvaro', face: 'laugh', text: '¡El puerto está cerrado! Primero tendréis que superar las cinco pruebas. Lleváis ' + n + '. ¡JA!' }]); return; }
    Sound.sfx('go'); Game.team.hubPos = [s.x, s.y + 80]; Store.save(); startTest(s.i);
  }
  down(p) {
    if (this.paused) return; if (this.dialog) { this.dlgNext(); return; }
    const pl = this.two ? this.players[p.x < W / 2 ? 0 : 1] : this.players[0];
    if (pl.joy) return; pl.joy = { id: p.id, ox: p.x, oy: p.y, x: p.x, y: p.y, t0: G.t, drag: false };
  }
  move(p) { for (const pl of this.players) if (pl.joy && pl.joy.id === p.id) { pl.joy.x = p.x; pl.joy.y = p.y; if (dist(p.x, p.y, pl.joy.ox, pl.joy.oy) > 14) { pl.joy.drag = true; pl.goal = null; } } }
  up(p) { for (const pl of this.players) if (pl.joy && pl.joy.id === p.id) { const j = pl.joy; pl.joy = null; if (!j.drag && G.t - j.t0 < .4) { pl.goal = [j.x - W / 2 + this.cam[0], j.y - H / 2 + this.cam[1]]; Sound.sfx('tap'); } } }
  cancel(p) { this.up(p); }
  key(e) { if (this.dialog && (e.key === ' ' || e.key === 'Enter')) { this.dlgNext(); return true; } return false; }
  update(dt) {
    this.t += dt; this.ap.t += dt;
    if (this.dialog) { const d = this.dialog; if (d.shown < d.text.length) { const prev = Math.floor(d.shown); d.shown = Math.min(d.text.length, d.shown + dt * 46); if (Math.floor(d.shown) !== prev && prev % 3 === 0) Sound.voice(d.lines[d.i].who); } }
    const frozen = !!this.dialog || this.paused, K = G.keys || {};
    for (const p of this.players) {
      let ix = 0, iy = 0;
      if (p.joy && p.joy.drag) { const dx = p.joy.x - p.joy.ox, dy = p.joy.y - p.joy.oy, L = Math.hypot(dx, dy); if (L > 8) { const m = Math.min(1, L / 70); ix = dx / L * m; iy = dy / L * m; } if (L > 90) { p.joy.ox = p.joy.x - dx / L * 90; p.joy.oy = p.joy.y - dy / L * 90; } }
      else if (p.goal) { const dx = p.goal[0] - p.x, dy = p.goal[1] - p.y, L = Math.hypot(dx, dy); if (L < 12) p.goal = null; else { ix = dx / L; iy = dy / L; } }
      const up = this.two ? (p.i ? K.ArrowUp : K.w) : (K.ArrowUp || K.w), dn = this.two ? (p.i ? K.ArrowDown : K.s) : (K.ArrowDown || K.s), lf = this.two ? (p.i ? K.ArrowLeft : K.a) : (K.ArrowLeft || K.a), rt = this.two ? (p.i ? K.ArrowRight : K.d) : (K.ArrowRight || K.d);
      if (up || dn || lf || rt) { p.goal = null; ix = (rt ? 1 : 0) - (lf ? 1 : 0); iy = (dn ? 1 : 0) - (up ? 1 : 0); const L2 = Math.hypot(ix, iy); if (L2 > 1) { ix /= L2; iy /= L2; } }
      if (frozen) { ix = 0; iy = 0; }
      const sp = p.mode === 'boat' ? 290 : 240;
      p.vx = lerp(p.vx, ix * sp, Math.min(1, dt * 10)); p.vy = lerp(p.vy, iy * sp, Math.min(1, dt * 10));
      p.x = clamp(p.x + p.vx * dt, 30, this.w.W - 30); p.y = clamp(p.y + p.vy * dt, 60, this.w.H - 20);
      if (Math.abs(p.vx) > 20) p.dir = p.vx > 0 ? 1 : -1; p.moving = Math.hypot(p.vx, p.vy) > 30;
      const m = this.w.isLand(p.x, p.y) ? 'walk' : 'boat'; if (m !== p.mode) { p.mode = m; Sound.sfx(m === 'boat' ? 'splash' : 'thud'); }
      // hojas de examen
      for (const h of HOJAS) { if (Game.team.sheets.includes(h[2])) continue; const [hx, hy] = h[0] < 30 ? this.w.cll(h[0], h[1]) : this.w.ll(h[0], h[1]); if (dist(p.x, p.y, hx, hy) < 45) this.sheet(h); }
    }
    if (this.two) { const [a, b] = this.players; const mx = W - 200, my = H - 240; if (Math.abs(a.x - b.x) > mx) { const c0 = (a.x + b.x) / 2, s = Math.sign(a.x - b.x); a.x = c0 + s * mx / 2; b.x = c0 - s * mx / 2; } if (Math.abs(a.y - b.y) > my) { const c0 = (a.y + b.y) / 2, s = Math.sign(a.y - b.y); a.y = c0 + s * my / 2; b.y = c0 - s * my / 2; } }
    const tx = this.players.reduce((s, p) => s + p.x, 0) / this.players.length, ty = this.players.reduce((s, p) => s + p.y, 0) / this.players.length - 30;
    if (this.follow > 0) this.follow -= dt; else { this.cam[0] = lerp(this.cam[0], clamp(tx, W / 2, this.w.W - W / 2), Math.min(1, dt * 4)); this.cam[1] = lerp(this.cam[1], clamp(ty, H / 2, this.w.H - H / 2), Math.min(1, dt * 4)); }
    const p0 = this.players[0]; this.rosa.x = lerp(this.rosa.x, p0.x - 60 * p0.dir, Math.min(1, dt * 3)); this.rosa.y = lerp(this.rosa.y, p0.y - 100, Math.min(1, dt * 3));
    this.near = frozen ? null : this.nearStation(); this.enterBtn.vis = !!this.near;
    if (this.near) { this.enterBtn.color = Game.unlocked(this.near.i) ? this.near.ts.color : '#8c85b0'; this.enterBtn.label = Game.unlocked(this.near.i) ? '¡ENTRAR!' : 'CERRADO'; }
    if (this.toast && G.t - this.toast.t0 > 6) this.toast = null;
  }
  sheet(h) {
    Game.team.sheets.push(h[2]); Store.save(); const q = REPASO.find(r => r.id === h[2]); Sound.sfx('sparkle');
    this.toast = { q: q.q, a: q.a, n: Game.team.sheets.length, t0: G.t, k: 0 }; tw(this.toast, { k: 1 }, .4, { ease: E.outBack });
  }
  toScreen(wx, wy) { return [wx - this.cam[0] + W / 2, wy - this.cam[1] + H / 2]; }
  draw(c) {
    const w = this.w, cam = this.cam, st = Game.team.stars, A = this.anim, S = (x, y) => this.toScreen(x, y);
    w.drawBase(cam[0], cam[1]);
    // meseta y relieve
    if (A.rise > 0) { const k = A.rise, ox = cam[0] - W / 2, oy = cam[1] - H / 2; c.save(); c.beginPath(); for (const r of GEO.es.meseta) ringPath(c, r, (x, y) => [x * w.s - ox, y * w.s - oy - 5 * k]); c.fillStyle = `rgba(240,195,110,${.6 * k})`; c.fill(); c.restore(); }
    for (const k of Object.keys(GEO.es.ranges)) drawRangeW(w, cam, k, A.rise, { h: (RANGE_INFO[k] || { h: .8 }).h * 1.6, col: RANGE_COL[k] || '#c98c5a' }, .8);
    for (const r of RIOS) drawRiverW(w, cam, GEO.es.rivers[r.id][0], 6, A.river, A.river < 1, this.t);
    for (const r of RIOS_NORTE) drawRiverW(w, cam, GEO.es.rivers[r][0], 4, A.river, A.river < 1, this.t * 1.8);
    const ents = [];
    // nombres de mares, islas y costas
    if (A.names > 0) for (const n of NOMBRES) { const v = NAME_SPOT[n.id]; const [x0, y0] = v === 'inset' ? w.cll(29.4, -15.0) : w.ll(v[0], v[1]); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); c.save(); c.translate(x, y); c.scale(A.names, A.names); drawSign(0, 0, n.name, { size: 18 }); c.restore(); } }); }
    if (A.names > 0) for (const [nm, la, lo] of [['Golfo de Cádiz', 36.55, -6.95], ['Estrecho de Gibraltar', 35.95, -5.5], ['Delta del Ebro', 40.6, 1.1]]) { const [x0, y0] = w.ll(la, lo); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); c.globalAlpha = A.names; drawBuoy(x, y, .8, true); chip(nm, x, y + 20, '#2fb8a0', '#fff', 13); c.globalAlpha = 1; } }); }
    // climas
    if (A.clima > 0) for (const [k, la, lo] of [['lluvia', 43.0, -7.5], ['sol', 39.6, -3.5], ['nieve', 42.8, .3], ['calor', 28.5, -15.5], ['sol', 37.5, -2.0]]) { const [x0, y0] = la < 30 ? w.cll(la, lo) : w.ll(la, lo); ents.push({ y: y0 - 200, d: () => { const [x, y] = S(x0, y0); c.globalAlpha = A.clima; drawWeather(k, x, y - 110, .55); c.globalAlpha = 1; } }); }
    // hojas de examen perdidas
    for (const h of HOJAS) if (!Game.team.sheets.includes(h[2])) { const [x0, y0] = h[0] < 30 ? w.cll(h[0], h[1]) : w.ll(h[0], h[1]); ents.push({ y: y0, d: () => { const [x, y] = S(x0, y0); if (x > -40 && x < W + 40 && y > -40 && y < H + 40) drawSheet(x, y - 20 + Math.sin(G.t * 3 + x) * 5); } }); }
    // estaciones
    for (const s of this.stations) ents.push({ y: s.y, d: () => this.drawStation(c, s) });
    for (const p of this.players) ents.push({ y: p.y, d: () => { const [x, y] = S(p.x, p.y); if (p.mode === 'boat') drawKidBoat(x, y, 1, { av: p.av, dir: p.dir, hull: PCOL[p.i], ph: p.i }); else drawKid(x, y, 1, { av: p.av, dir: p.dir, walk: p.moving, ph: p.i }); if (this.two) chip(p.name, x, y + 22, PCOL[p.i], '#fff', 14); if (p.goal) { const [gx, gy] = S(p.goal[0], p.goal[1]); circle(gx, gy, 10 + Math.sin(G.t * 8) * 3, null, PCOL[p.i], 4); } } });
    ents.sort((a, b) => a.y - b.y); for (const e of ents) e.d();
    const [rx, ry] = S(this.rosa.x, this.rosa.y); drawRosa(rx, ry, .3, { expr: 'happy' });
    // el Aplanatrón vigila el puerto
    const port = this.stations[6], [px, py] = S(port.x + Math.sin(this.ap.t * .5) * 160, port.y - 200 + Math.sin(this.ap.t * 1.3) * 25);
    if (px > -300 && px < W + 300 && st[6] === 0) drawPlancha(px, py, .38, { dir: Math.cos(this.ap.t * .5) > 0 ? 1 : -1, expr: 'evil' });
  }
  drawStation(c, s) {
    const [x, y] = this.toScreen(s.x, s.y); if (x < -200 || x > W + 200 || y < -150 || y > H + 250) return;
    const st = Game.team.stars[s.i], open = Game.unlocked(s.i), near = this.near === s;
    c.fillStyle = 'rgba(20,10,40,.22)'; ell(c, x, y + 4, 70, 16); c.fill();
    switch (s.ts.icon) {
      case 'faro': drawLighthouse(x, y, .75, st > 0, { ph: 1 }); break;
      case 'tunel': { peak(c, x, y, 120, 110, '#c98c5a', true); c.beginPath(); c.moveTo(x - 34, y); c.lineTo(x - 34, y - 36); c.arc(x, y - 36, 34, Math.PI, TAU); c.lineTo(x + 34, y); c.closePath(); fillStroke(c, '#2e2759', 5); rr(x - 40, y - 78, 80, 10, 4, '#ffc933', INK, 3); break; }
      case 'fuente': { rr(x - 12, y - 110, 24, 110, 6, '#8a5a3a', INK, 4); rr(x - 50, y - 150, 100, 60, 14, '#3e8ef0', INK, 5); txt('H₂O', x, y - 120, { size: 20, font: 'T', color: '#fff', outline: 4 }); drawSpring(x + 46, y - 4, .8, st > 0); break; }
      case 'agencia': { rr(x - 70, y - 100, 140, 100, 10, '#ffe7b8', INK, 5); c.beginPath(); c.moveTo(x - 82, y - 96); c.lineTo(x, y - 140); c.lineTo(x + 82, y - 96); c.closePath(); fillStroke(c, '#ffb938', 5); rr(x - 18, y - 52, 36, 52, 6, '#8a5a3a', INK, 4); rr(x - 60, y - 88, 36, 28, 5, '#bfeaff', INK, 3); rr(x + 24, y - 88, 36, 28, 5, '#bfeaff', INK, 3); rr(x - 50, y - 170, 100, 30, 8, '#fff', INK, 4); txt('VIAJES', x, y - 155, { size: 18, font: 'T', color: '#ff8a3d' }); break; }
      case 'aduana': { c.lineWidth = 16; c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 60, y); c.lineTo(x - 60, y - 90); c.arc(x, y - 90, 60, Math.PI, TAU); c.lineTo(x + 60, y); c.stroke(); c.lineWidth = 9; c.strokeStyle = '#3e5fd0'; c.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; txt('★', x + Math.cos(a) * 30, y - 95 + Math.sin(a) * 30, { size: 13, color: '#ffc933' }); } if (st > 0) for (let k = 0; k < 3; k++) drawBalloon(x - 50 + k * 50, y - 190 + Math.sin(G.t * 2 + k) * 6, 14, ['#ff5c8a', '#3ec1f3', '#ffc933'][k], ''); break; }
      case 'cole': { drawSchool(x, y); if (st > 0) for (let k = 0; k < 3; k++) drawBalloon(x - 70 + k * 70, y - 200 + Math.sin(G.t * 2 + k) * 6, 16, ['#ff5c8a', '#7ce05c', '#a66cff'][k], ''); break; }
      case 'puerto': { rr(x - 90, y - 14, 180, 22, 6, '#8a5a3a', INK, 4); for (let k = 0; k < 4; k++) rr(x - 80 + k * 50, y, 10, 30, 3, '#6b4a2a', INK, 3); drawBoat(x + 30, y - 30, .7, { col: '#ff4b4b' }); if (!open) { c.lineWidth = 7; c.strokeStyle = '#6b6b7a'; c.beginPath(); c.moveTo(x - 90, y - 60); c.lineTo(x + 90, y + 10); c.moveTo(x - 90, y + 10); c.lineTo(x + 90, y - 60); c.stroke(); rr(x - 18, y - 42, 36, 30, 6, '#ffc933', INK, 4); } break; }
    }
    // cartel con nombre y estrellas
    const lab = s.ts.short.toUpperCase(), wv = tw_(lab, 20, 'T') + 40, ty = y - (s.ts.icon === 'agencia' ? 215 : s.ts.icon === 'fuente' ? 190 : s.ts.icon === 'aduana' || s.ts.icon === 'cole' ? 175 : 160);
    rr(x - wv / 2, ty - 20, wv, 40, 14, open ? s.ts.color : '#8c85b0', INK, 4); txt(lab, x, ty, { size: 20, font: 'T', color: '#fff', outline: 5 });
    for (let k = 0; k < 3; k++) drawStar(x - 26 + k * 26, ty + 32, 11, k < st);
    if (near) { c.lineWidth = 5; c.strokeStyle = '#fff'; c.setLineDash([10, 8]); c.lineDashOffset = -G.t * 30; ell(c, x, y + 4, 80, 22); c.stroke(); c.setLineDash([]); }
  }
  drawTop(c) {
    const t = Game.team, st = t.stars;
    // equipo y examen
    panel(14, 12, 330, 108, '#fff8ea', { r: 22 });
    t.avs.forEach((av, i) => drawKid(52 + i * 44, 104, .55, { av, ph: i }));
    const nm = t.names.join(' y '); txt(nm, this.two ? 220 : 196, 40, { size: fitSize(nm, 200, 22), color: INK });
    drawStar(this.two ? 150 : 110, 80, 14, true); txt(st.reduce((a, b) => a + b, 0) + ' / 21', this.two ? 196 : 156, 82, { size: 20, color: INK }); chip('Hojas ' + t.sheets.length + '/12', this.two ? 290 : 262, 82, '#fff', INK, 15);
    const nq = 1 + EXAM_Q.reduce((a, q, i) => a + (st[i] > 0 ? q : 0), 0);
    rr(360, 18, 250, 70, 20, '#fff', INK, 4); c.save(); c.translate(392, 53); c.rotate(-.1); rr(-18, -24, 36, 48, 4, '#fff', INK, 3); txt('A+', 0, 0, { size: 16, font: 'T', color: '#ff4b4b' }); c.restore();
    txt('Examen de Álvaro', 510, 38, { size: 16, color: '#8c85b0' }); txt(nq + (nq === 1 ? ' pregunta' : ' preguntas'), 510, 64, { size: 24, font: 'T', color: nq > 40 ? '#7ce05c' : '#ff5c8a' });
    Play.prototype.minimap.call(this, c);
    // estaciones en el minimapa
    const mw = 210, k = mw / this.w.W, x0 = W - mw - 16, y0 = 100; for (const s of this.stations) circle(x0 + s.x * k, y0 + s.y * k, 5, Game.unlocked(s.i) ? s.ts.color : '#8c85b0', INK, 2);
    // tarjeta de la prueba cercana
    const s = this.near; if (s && !this.dialog) { const open = Game.unlocked(s.i); panel(W / 2 - 440, H - 150, 600, 124, '#fff8ea', { r: 24 }); rr(W / 2 - 440, H - 150, 20, 124, 10, s.ts.color);
      txt(s.ts.name, W / 2 - 400, H - 118, { size: fitSize(s.ts.name, 540, 30, 'T'), font: 'T', align: 'left', color: INK });
      txt(open ? s.ts.topic : 'Cerrado hasta superar las cinco pruebas (' + MAIN_TESTS.filter(k2 => st[k2] > 0).length + '/5)', W / 2 - 400, H - 80, { size: 20, align: 'left', color: '#6a4fc8', w: 600 });
      for (let j = 0; j < 3; j++) drawStar(W / 2 - 385 + j * 34, H - 46, 14, j < st[s.i]); }
    else if (this.t < 14 && !this.dialog && !this.paused) { chip(this.two ? 'Cada uno se mueve con su mitad de pantalla' : 'Toca el mapa para caminar o arrastra el dedo', W / 2, H - 40, 'rgba(35,25,61,.75)', '#fff', 20); }
    for (const b of (this.paused ? this.savedBtns : this.btns)) b.draw();
    for (const p of this.players) if (p.joy && p.joy.drag) { circle(p.joy.ox, p.joy.oy, 70, 'rgba(255,255,255,.25)', 'rgba(255,255,255,.8)', 5); const dx = p.joy.x - p.joy.ox, dy = p.joy.y - p.joy.oy, L = Math.hypot(dx, dy), m = Math.min(70, L); circle(p.joy.ox + (L ? dx / L * m : 0), p.joy.oy + (L ? dy / L * m : 0), 32, PCOL[p.i], INK, 4); }
    if (this.toast) { const q = this.toast, k = q.k; c.save(); c.translate(640, 250); c.scale(k, k); panel(-330, -90, 660, 180, '#fff', { r: 24 }); c.save(); c.translate(-280, -10); c.rotate(-.12); drawSheet(0, 0); c.restore(); txt('¡Hoja del examen de Álvaro! (' + q.n + '/12)', 30, -58, { size: 20, color: '#8c85b0' }); wrap(q.q, 500, 24).forEach((l, i) => txt(l, 30, -22 + i * 28, { size: 24, color: INK })); txt('→ ' + q.a, 30, 58, { size: 26, font: 'T', color: '#2fb8a0' }); c.restore(); }
    if (this.alv) this.drawAlv(c);
    if (this.dialog) this.drawDialog(c);
    if (this.paused) { c.fillStyle = 'rgba(30,20,70,.7)'; c.fillRect(0, 0, W, H); txt('MENÚ', 640, 150, { size: 80, font: 'T', color: '#ffc933', outline: 12 }); txt('Contraseña: ' + this.pwText, 640, 640, { size: 30, font: 'T', color: '#fff', outline: 7 }); txt('Apúntala para seguir en otra tablet o en casa.', 640, 684, { size: 22, color: '#fff', outline: 5 }); for (const b of this.btns) b.draw(); }
  }
}
for (const k of ['say', 'dlgLine', 'dlgNext', 'drawDialog', 'drawAlv', 'alvSay']) Hub.prototype[k] = Play.prototype[k];
