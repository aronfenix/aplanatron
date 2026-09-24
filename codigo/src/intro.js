/* =====================================================================
   INTRO: el profe, los exámenes y el Aplanatrón 3000
   ===================================================================== */
const INTRO_LABELS = [['marCantabrico', 'MAR CANTÁBRICO'], ['oAtlantico', 'OCÉANO ATLÁNTICO'], ['marMedit', 'MAR MEDITERRÁNEO'], ['madrid', 'Meseta Central'], ['mallorca', 'Islas Baleares'], ['huesca', 'Pirineos'], ['oviedo', 'Cordillera Cantábrica'], ['granada', 'Sistemas Béticos'], ['teruel', 'Sistema Ibérico'], ['valladolid', 'Duero'], ['toledoC', 'Tajo'], ['zaragoza', 'Ebro']];
class Intro {
  enter() {
    this.small = new MapES({ x: 425, y: 108, s: .43, key: 'intro-s', layers: { countries: true } });
    this.big = new MapES({ x: 190, y: 5, s: .98, key: 'intro-b', layers: { countries: true } });
    this.RNG = Object.keys(GEO.es.ranges); this.rise = {}; this.RNG.forEach(k => this.rise[k] = 1); this.riv = { Duero: 1, Tajo: 1, Ebro: 1, 'Miño': 1, Guadiana: 1, Guadalquivir: 1 };
    this.labels = INTRO_LABELS.map(([p, t]) => ({ p, t, fly: null }));
    const S = this.S = { scene: 'cole', cam: 0, dark: 0, alv: { x: 1010, y: 440, s: .72, expr: 'sad', arms: 'idle', flip: false, vis: true, shirt: 0 }, pl: { x: 640, y: -400, s: .6, vis: false, dir: -1, rider: false, hover: 1, expr: 'laugh' }, kids: { vis: false, k: 0, shake: 0 }, pile: 1, night: 1, wob: 0, vortex: 0, white: 0, title: 0, rosa: 0, inside: 0, fall: 0 };
    this.fly = []; this.steam = []; this.papers = []; this.line = null; this.wait = 0; this.tapped = false;
    this.btns = [new Btn({ x: W - 210, y: 16, w: 190, h: 70, label: 'SALTAR ▸▸', size: 26, color: '#8c85b0', key: ['Escape'], onTap: () => this.end() })];
    this.co = this.script(); Sound.play('intro');
    this.world = getWorld('es');
  }
  line_(who, text, face) { this.line = { who, face, text: Game.sub(text), shown: 0, t: 0 }; }
  *script() {
    const S = this.S, A = S.alv, P = S.pl, T = (o, p, d, e) => tw(o, p, d, { ease: e || E.io });
    yield this.say('narrador', 'Domingo, 23:47. El profesor Álvaro lleva todo el fin de semana corrigiendo exámenes del tema 1.');
    yield this.say('alvaro', 'Pregunta 1: «¿Dónde nace el Ebro?». Pregunta 2: «¿Qué es un golfo?». Pregunta 47: «¿Cómo son los ríos del norte?»…', 'sad');
    A.expr = 'shock'; A.arms = 'up'; Sound.sfx('horn'); shake(8, .4); S.wob = 1; for (let i = 0; i < 6; i++) this.papers.push({ x: A.x - 40 + rnd(-60, 60), y: 560, vx: rnd(-260, 260), vy: rnd(-520, -320), r: 0, vr: rnd(-6, 6) });
    yield this.say('alvaro', '¡CUARENTA Y SIETE preguntas! ¡Por CINCUENTA alumnos! ¡Y se me ha gastado el boli rojo!', 'shock');
    A.flip = true; A.expr = 'angry'; A.arms = 'idle'; Sound.sfx('rumble'); yield .5;
    yield this.say('alvaro', 'Todo es culpa de España. Montañas, ríos, cabos, golfos, climas… ¡Demasiadas cosas que preguntar!', 'angry');
    A.expr = 'evil'; A.arms = 'rub'; S.wob = 0; Sound.sfx('sparkle');
    yield this.say('alvaro', 'Pero… si España fuera PLANA, el examen tendría UNA sola pregunta: «¿Cómo es España?». Respuesta: «Plana». ¡Corregido en tres segundos!', 'evil');
    Sound.sfx('laugh'); T(S, { dark: .5 }, .6); Sound.sfx('thud'); yield .8; Sound.sfx('drumroll'); P.vis = true; P.y = -300; T(P, { y: 280 }, 2.2, E.outQ); for (let i = 0; i < 8; i++) { shake(4 + i, .25); this.steamAt(P.x + rnd(-150, 150), P.y + 60, 5); yield .27; }
    Sound.sfx('horn'); shake(18, .6); flash('#fff', .3); T(S, { dark: .2 }, .4);
    yield this.say('alvaro', '¡Ha llegado la hora del APLANATRÓN 3000! Rodillo de titanio, turbo a reacción… y cero ganas de corregir.', 'laugh');
    T(A, { x: P.x + 40, y: 320, s: .0001 }, .5, E.inQ); Sound.sfx('boing'); yield .5; P.rider = true; A.vis = false;
    yield this.say('alvaro', 'Programa número 1: «APLANAR ESPAÑA». ¡Que no quede nada que preguntar!', 'evil');
    // cámara: entramos en el mapa
    T(S, { cam: 1, dark: 0 }, 1.6); T(P, { y: 60, s: .35 }, 1.4); Sound.sfx('whoosh'); yield 1.7;
    S.scene = 'map'; P.x = 1400; P.y = 80; P.s = .62; P.dir = -1; P.hover = .3;
    this.sweep = true; T(P, { x: 60 }, 5.2, E.lin); Sound.sfx('lava'); yield 2.6;
    yield .1; this.say('narrador', 'Las montañas quedaron planas. Los ríos se secaron. ¡Y los nombres salieron volando!');
    yield 2.8; this.sweep = false; P.vis = false;
    yield this.waitLine();
    // lunes por la mañana
    S.scene = 'cole'; S.cam = 1; S.night = 0; S.pile = 0; S.kids.vis = true; A.vis = true; A.s = .72; A.x = 1010; A.y = 440; A.flip = false; A.expr = 'smug'; A.arms = 'cross'; T(S, { cam: 0 }, 1.2); yield 1.3;
    yield this.say('narrador', 'Lunes, 9:00. Llegan {A} a clase.');
    Sound.sfx('bad'); S.kids.shake = 1;
    yield this.say('kids', '¡Profe! ¿Qué le ha pasado al mapa? ¡Está liso!');
    yield this.say('alvaro', 'Nada, nada. Por cierto: el examen del tema 1 tendrá una sola pregunta. De nada.', 'smug');
    yield this.say('kids', '¡Pero así no aprendemos nada! ¡Hay que arreglarlo!');
    A.expr = 'shock'; Sound.sfx('rumble'); T(S, { vortex: 1 }, 1.4); shake(10, 1.4); yield 1.4;
    T(S.kids, { k: 1 }, 1.4, E.inQ); Sound.sfx('slideDown'); yield 1.5; S.kids.vis = false;
    T(S, { white: 1 }, .35); yield .45; S.scene = 'inside'; S.vortex = 0; T(S, { white: 0 }, .8); S.fall = 0; T(S, { fall: 1 }, 1, E.outBounce); yield .9; Sound.sfx('thud'); shake(10, .3); burst(W / 2, 520, { n: 30, c: ['#fff', '#ffe7b8'] }); yield .6;
    yield this.say('kids', '¿Dónde estamos? Esto es… ¿Madrid? ¡Estamos DENTRO del mapa!');
    Sound.sfx('sparkle'); T(S, { rosa: 1 }, .6, E.outBack); yield .6;
    yield this.say('rosa', '¡Hola, {A}! Soy Rosa, la rosa de los vientos de este mapa. ¡Menos mal que habéis venido!', 'happy');
    yield this.say('rosa', 'Cada cosa que devolváis al mapa será una pregunta que vuelve al examen. Y Álvaro tendrá que corregirla…', 'talk');
    Sound.sfx('laugh'); Sound.sfx('horn'); S.alvSky = 1;
    yield this.say('alvaro', '¡NI SE OS OCURRA! ¡Mi examen tiene UNA pregunta y así se va a quedar! ¡Aplanatrón, vigílalos!', 'angry');
    S.alvSky = 0; Sound.sfx('fanfare'); T(S, { title: 1 }, .7, E.outBack); shake(12, .4); yield 3.2;
    this.end();
  }
  say(who, text, face) { this.line_(who, text, face); return { line: true }; }
  waitLine() { return { line: true }; }
  steamAt(x, y, n = 4) { for (let i = 0; i < n; i++) this.steam.push({ x: x + rnd(-20, 20), y, vx: rnd(-30, 30), vy: rnd(-120, -60), r: rnd(18, 34), a: .8, t: 0 }); }
  end() { if (this.over) return; this.over = true; Sound.shutUp(); Game.team.seenIntro = true; Store.save(); go(() => new Hub(), { col: '#ffc933' }); }
  down() { if (this.line && this.line.shown >= this.line.text.length) this.tapped = true; else if (this.line) this.line.shown = this.line.text.length; }
  key(e) { if (e.key === ' ' || e.key === 'Enter') { this.down(); return true; } }
  update(dt) {
    for (const q of this.papers) { q.vy += 900 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; } this.papers = this.papers.filter(q => q.y < H + 60);
    const L = this.line;
    if (L) { const prev = Math.floor(L.shown); L.shown = Math.min(L.text.length, L.shown + dt * 40); if (Math.floor(L.shown) !== prev && prev % 3 === 0) Sound.voice(L.who === 'kids' ? 'narrador' : L.who); if (L.shown >= L.text.length) L.t += dt; }
    // la plancha barriendo el mapa
    if (this.sweep) {
      const P = this.S.pl, m = this.big; this.steamAt(P.x + 120, P.y + 110, 1);
      for (const k of this.RNG) if (this.rise[k] === 1) { const [x, y] = m.rangeMid(k); if (P.x < x + 60) { this.rise[k] = .999; tw(this.rise, { [k]: 0 }, .35, { ease: E.inQ }); Sound.sfx('thud'); shake(7, .2); puff(x, y, { n: 8, c: '#fff' }); } }
      for (const r in this.riv) if (this.riv[r] === 1) { const pts = GEO.es.rivers[r] && GEO.es.rivers[r][0]; if (!pts) continue; const h = Math.floor(pts.length / 4) * 2; const [a, b] = m.P(pts[h], pts[h + 1]); if (P.x < a) { this.riv[r] = .999; tw(this.riv, { [r]: 0 }, .8); Sound.sfx('splash'); this.steamAt(a, b, 6); } }
      for (const l of this.labels) if (!l.fly) { const [x, y] = m.pt(l.p); if (P.x < x + 40) { l.fly = { x, y, vx: rnd(-200, 200), vy: rnd(-700, -500), r: 0, vr: rnd(-6, 6) }; Sound.sfx('pop'); } }
    }
    for (const l of this.labels) if (l.fly) { const f = l.fly; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 500 * dt; f.r += f.vr * dt; }
    for (const s of this.steam) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 30; s.a -= dt * .6; } this.steam = this.steam.filter(s => s.a > 0);
    // guion
    if (this.wait > 0) { this.wait -= dt; return; }
    if (this.waitingLine) { if (!L || this.tapped || L.t > Math.max(2.4, L.text.length * .04)) { this.waitingLine = false; this.tapped = false; if (L && this.S.scene !== 'map') this.line = null; } else return; }
    const r = this.co.next(); if (r.done) return;
    if (typeof r.value === 'number') this.wait = r.value; else if (r.value && r.value.line) this.waitingLine = true;
  }
  drawCole(c) {
    const S = this.S, m = this.small;
    bg('cole');
    // mapa de la pared, en lugar de la pizarra
    rr(250, 80, 780, 400, 18, '#8a5a3a', INK, 7);
    c.save(); rrPath(c, 272, 100, 736, 360, 10); c.clip();
    const wob = S.wob ? Math.sin(G.t * 9) * 2 : 0; c.translate(0, wob);
    m.drawBase(); m.drawRivers(Object.keys(this.riv), { prog: this.riv }); m.drawRanges(this.RNG.concat(['teide']), this.rise);
    for (const l of this.labels) if (!l.fly) { const [x, y] = m.pt(l.p); txt(l.t, x, y, { size: 11, color: '#fff', outline: 3 }); }
    if (S.vortex) { c.save(); c.translate(640, 280); c.rotate(G.t * 6); for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.fillStyle = i % 2 ? `rgba(166,108,255,${.7 * S.vortex})` : `rgba(255,201,51,${.7 * S.vortex})`; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 500 * S.vortex, 0, TAU / 12); c.fill(); } c.restore(); }
    c.restore(); c.lineWidth = 5; c.strokeStyle = INK; rrPath(c, 272, 100, 736, 360, 10); c.stroke();
    txt('MAPA DE ESPAÑA', 640, 70, { size: 26, font: 'T', color: '#fff', outline: 6 });
    // pupitres y alumnos
    const K = S.kids;
    if (K.vis) (Game.team.avs.length > 1 ? Game.team.avs : [Game.team.avs[0], 5]).forEach((av, i) => {
      const hx = i ? 1170 : 110, k = K.k; const x = lerp(hx, 640, k), y = lerp(760, 300, k), sc = 1.9 * (1 - k * .9);
      c.save(); if (k) { c.translate(x, y - 60 * sc); c.rotate(k * 14 * (i ? 1 : -1)); c.translate(-x, -(y - 60 * sc)); }
      drawKid(x + (K.shake ? Math.sin(G.t * 40 + i) * 3 : 0), y, sc, { av, dir: i ? -1 : 1, look: -.5, mouth: K.shake ? 'o' : null, ph: i }); c.restore();
      if (!k) rr(hx - 110, 740, 220, 60, 10, '#c98c5a', INK, 5);
    });
    if (S.night) { const g = c.createRadialGradient(1000, 470, 60, 1000, 470, 520); g.addColorStop(0, 'rgba(255,220,140,.12)'); g.addColorStop(.35, 'rgba(15,10,40,.35)'); g.addColorStop(1, `rgba(15,10,40,${.78 * S.night})`); c.fillStyle = g; c.fillRect(0, 0, W, H); circle(1180, 150, 36, '#fff8d8', INK, 4); txt('23:47', 120, 230, { size: 24, font: 'T', color: '#ffc933', outline: 5 }); }
    if (S.dark) { c.fillStyle = `rgba(15,10,40,${S.dark})`; c.fillRect(0, 0, W, H); }
    const P = S.pl; if (P.vis && S.cam < .95) {
      if (S.dark) { const g = c.createRadialGradient(P.x, P.y + 120, 10, P.x, P.y + 300, 420); g.addColorStop(0, 'rgba(255,240,180,.55)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(P.x - 80, P.y + 60); c.lineTo(P.x - 380, H); c.lineTo(P.x + 380, H); c.lineTo(P.x + 80, P.y + 60); c.fill(); }
      drawPlancha(P.x, P.y, P.s, { dir: P.dir, expr: P.expr, arms: 'up', rider: P.rider, shadow: false, hover: 1 });
    }
    const A = S.alv; if (A.vis) { drawAlvaro(A.x, A.y, A.s, { expr: A.expr, arms: A.arms, flip: A.flip, talk: this.line && this.line.who === 'alvaro' && this.line.shown < this.line.text.length });
    if (S.pile) { rr(850, 600, 330, 30, 8, '#8a5a3a', INK, 5); rr(870, 630, 20, 110, 5, '#6b4a2a', INK, 4); rr(1140, 630, 20, 110, 5, '#6b4a2a', INK, 4);
      for (let j = 0; j < 18; j++) { const x = 910 + (j % 3) * 62 + Math.sin(j * 3) * 6 + (S.wob ? Math.sin(G.t * 20 + j) * 3 : 0), y = 590 - Math.floor(j / 3) * 24; c.save(); c.translate(x, y); c.rotate((j % 5 - 2) * .06); rr(-38, -12, 76, 24, 3, '#fff8ea', INK, 2); c.restore(); }
      chip('EXÁMENES SIN CORREGIR', 1015, 668, '#ff4b4b', '#fff', 16);
      c.save(); c.translate(870, 585); c.rotate(-.5); rr(-4, -46, 8, 50, 3, '#ff4b4b', INK, 2.5); c.restore(); }
    for (const q of this.papers) { c.save(); c.translate(q.x, q.y); c.rotate(q.r); rr(-26, -18, 52, 36, 3, '#fff', INK, 2.5); c.strokeStyle = '#ff4b4b'; c.lineWidth = 3; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-2, 8); c.lineTo(12, -8); c.stroke(); c.restore(); }
      if (A.shirt > .05) { c.save(); c.globalAlpha = A.shirt; c.strokeStyle = 'rgba(40,60,70,.6)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { const q = A.s / .6, yy = A.y + (15 + i * 22) * q; c.beginPath(); c.moveTo(A.x - 45 * q, yy); for (let k = 1; k <= 6; k++) c.lineTo(A.x - 45 * q + k * 15 * q, yy + (k % 2 ? 6 : -6)); c.stroke(); } c.restore(); } }
  }
  drawMap(c) {
    const S = this.S, m = this.big;
    c.fillStyle = '#3ea5e6'; c.fillRect(0, 0, W, H);
    m.drawBase(); m.drawRivers(Object.keys(this.riv), { prog: this.riv }); m.drawRanges(this.RNG.concat(['teide']), this.rise);
    for (const l of this.labels) { const f = l.fly; if (!f) { const [x, y] = m.pt(l.p); txt(l.t, x, y, { size: 22, color: '#fff', outline: 5 }); } else { c.save(); c.translate(f.x, f.y); c.rotate(f.r); txt(l.t, 0, 0, { size: 22, color: '#fff', outline: 5 }); c.restore(); } }
    const P = S.pl; if (P.vis) { c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(P.x + 100, 0, W, H); drawPlancha(P.x, P.y + 260, P.s, { dir: -1, expr: 'laugh', arms: 'up', rider: true, hover: .2 }); }
  }
  drawInside(c) {
    const S = this.S, w = this.world; if (!this.inW) { w.state = worldStateBefore(0); w.invalidate(); this.inW = w.ll(40.42, -3.7); }
    w.drawBase(this.inW[0], this.inW[1] + 120);
    drawSchool(W / 2 - 230, H / 2 + 60, .9);
    const f = S.fall; const avs = Game.team.avs; avs.forEach((av, i) => { const x = W / 2 + (avs.length > 1 ? (i ? 80 : -80) : 0), y = lerp(-200, 600, f); drawKid(x, y, 1.6, { av, dir: i ? -1 : 1, look: .3, ph: i }); });
    if (S.rosa) { c.save(); c.globalAlpha = Math.min(1, S.rosa); drawRosa(W / 2 + 280, 400, .8 * S.rosa, { expr: this.line && this.line.who === 'rosa' ? (this.line.face || 'talk') : 'happy', talk: this.line && this.line.who === 'rosa' && this.line.shown < this.line.text.length, look: [-1, .2] }); c.restore(); }
    if (S.alvSky) drawPlancha(300 + Math.sin(G.t * 1.5) * 60, 200 + Math.sin(G.t * 2.3) * 20, .55, { dir: 1, expr: 'laugh', arms: 'up', hover: 1 });
  }
  draw(c) {
    const S = this.S;
    if (S.scene === 'cole') {
      const z = E.io ? S.cam : S.cam, Z = lerp(1, .98 / .43, z), tx = lerp(0, 190 - 425 * .98 / .43, z), ty = lerp(0, 5 - 108 * .98 / .43, z);
      c.save(); c.translate(tx, ty); c.scale(Z, Z); this.drawCole(c); c.restore();
    } else if (S.scene === 'map') this.drawMap(c); else this.drawInside(c);
    for (const s of this.steam) { c.globalAlpha = Math.max(0, s.a); circle(s.x, s.y, s.r, '#fff'); } c.globalAlpha = 1;
    if (S.white) { c.fillStyle = `rgba(255,255,255,${S.white})`; c.fillRect(0, 0, W, H); }
    if (S.title) { c.save(); c.fillStyle = `rgba(30,20,70,${.5 * S.title})`; c.fillRect(0, 0, W, H); logo(640, 360, S.title); c.restore(); }
    this.drawLine(c);
    for (const b of this.btns) b.draw();
  }
  drawLine(c) {
    const L = this.line; if (!L || this.S.title) return;
    const col = { alvaro: '#a66cff', rosa: '#ff5c8a', narrador: '#5d5680', kids: '#3ec1f3', teide: '#ff8a3d' }[L.who];
    const name = { alvaro: 'ÁLVARO', rosa: 'ROSA', narrador: 'NARRADOR', kids: Game.team.names.join(' y ').toUpperCase(), teide: 'TEIDE' }[L.who];
    const s = L.text.slice(0, Math.floor(L.shown)), lines = wrap(L.text, 780, 30), bh = lines.length * 38 + 40, by = H - bh - 22, bx = 230;
    rr(bx + 5, by + 8, 820, bh, 26, 'rgba(20,10,40,.3)'); rr(bx, by, 820, bh, 26, L.who === 'narrador' ? '#fff8ea' : '#fff', INK, 6);
    chip(name, bx + 30, by, col, '#fff', 24, 'left', { font: 'T' });
    let n = 0; lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, s.length - n)); n += l.length + 1; txt(part, bx + 26, by + 40 + i * 38, { size: 30, align: 'left', color: INK, w: 700 }); });
    if (L.shown >= L.text.length) txt('▼', bx + 790, by + bh - 22 + Math.sin(G.t * 6) * 4, { size: 26, color: col });
  }
}
