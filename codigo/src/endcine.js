'use strict';
/* =====================================================================
   FINAL ANIMADO: ¡PLOF! · vuelta a clase · la corrección · el tema 2
   Una línea de tiempo con escenas, cámara, partículas y subtítulos.
   ===================================================================== */
class EndCine {
  enter() {
    this.t = 0; this.btns = [new Btn({ x: W - 210, y: 16, w: 190, h: 70, label: 'SALTAR ▸▸', size: 26, color: '#8c85b0', key: ['Escape'], onTap: () => { this.t = Math.max(this.t, 37.5); } })];
    this.drops = []; this.ring = []; this.stamps = []; this.conf = [];
    this.names = Game.team.names.join(' y ');
    this.map = new MapES({ x: 425, y: 108, s: .43, key: 'endmap', layers: { countries: true, meseta: true, depr: true } });
    this.subs = [
      [0.6, 5.6, 'narrador', 'El Aplanatrón 3000 dio tres vueltas sobre el Atlántico y… ¡PLOF!'],
      [7.2, 12.4, 'alvaro', 'Vale, vale… el examen tendrá sus 47 preguntas. Todas.'],
      [13.6, 17.4, 'alvaro', 'Diez… diez… ¿OTRO diez? ¡Pero si os lo sabéis TODO!'],
      [17.6, 21.8, 'narrador', 'Y el profesor Álvaro sonrió un poquito. Porque habíais demostrado que os lo sabíais.'],
      [23.2, 27.4, 'alvaro', 'Tema 2: «Un voto de confianza». Elecciones, votos, gobiernos…'],
      [27.6, 32.0, 'alvaro', '…mmm. Ya se me ocurrirá alguna maldad. ¡MUAJAJAJÁ!'],
    ];
    this.events = [
      [0.1, () => Sound.play('fin', { fade: .5 })], [1.2, () => Sound.sfx('whoosh')], [2.4, () => Sound.sfx('slideDown')], [3.3, () => { Sound.sfx('splash'); Sound.sfx('thud'); this.splash(); }],
      [4.6, () => Sound.sfx('plop')], [6.6, () => Sound.sfx('whoosh')], [7.0, () => Sound.sfx('cheer')], [13.0, () => Sound.sfx('whoosh')],
      ...Array.from({ length: 10 }, (_, i) => [13.8 + i * .42, () => { Sound.sfx('stomp'); this.stamps.push({ t0: this.t, i }); }]),
      [18.0, () => Sound.sfx('sparkle')], [22.4, () => Sound.sfx('whoosh')], [26.0, () => Sound.sfx('bling')], [28.4, () => { Sound.sfx('rumble'); Sound.sfx('laugh'); }], [29.2, () => { flash('#fff', .25); Sound.sfx('horn'); }],
      [32.6, () => { Sound.sfx('drumroll'); }], [33.8, () => { Sound.sfx('fanfare'); confetti(160); }],
    ];
    this.ev = 0;
  }
  splash() { for (let i = 0; i < 70; i++) { const a = -Math.PI / 2 + rnd(-1.2, 1.2), v = rnd(300, 900); this.drops.push({ x: 800 + rnd(-30, 30), y: 520, vx: Math.cos(a) * v * .6, vy: Math.sin(a) * v, r: rnd(4, 12) }); } this.ring.push({ t0: this.t }); shake(16, .6); }
  update(dt) {
    this.t += dt;
    while (this.ev < this.events.length && this.events[this.ev][0] <= this.t) { this.events[this.ev][1](); this.ev++; }
    for (const d of this.drops) { d.vy += 1400 * dt; d.x += d.vx * dt; d.y += d.vy * dt; } this.drops = this.drops.filter(d => d.y < H + 40);
    if (this.t > 38 && !this.endBtns) { this.endBtns = true; this.btns = [new Btn({ x: 360, y: 680, w: 260, h: 96, label: 'VER OTRA VEZ', size: 26, color: '#3ec1f3', onTap: () => go(() => new EndCine()) }), new Btn({ x: 660, y: 680, w: 260, h: 96, label: 'AL MAPA', size: 34, color: '#7ce05c', pulse: true, key: ['Enter'], onTap: () => go(() => new Hub()) })]; }
  }
  down() { }
  // utilidades de la línea de tiempo
  k(a, b) { return clamp((this.t - a) / (b - a), 0, 1); }
  draw(c) {
    const t = this.t;
    c.save();
    if (t < 6.4) this.sceneSea(c, t);
    else if (t < 13.2) this.sceneClass(c, t - 6.4);
    else if (t < 22.6) this.sceneMarking(c, t - 13.2);
    else if (t < 33.2) this.sceneNight(c, t - 22.6);
    else this.sceneTitle(c, t - 33.2);
    c.restore();
    // fundidos entre escenas
    for (const cut of [6.4, 13.2, 22.6, 33.2]) { const d = Math.abs(t - cut); if (d < .35) { c.fillStyle = `rgba(20,12,40,${1 - d / .35})`; c.fillRect(0, 0, W, H); } }
    if (t < .5) { c.fillStyle = `rgba(20,12,40,${1 - t / .5})`; c.fillRect(0, 0, W, H); }
    this.drawSub(c);
    for (const b of this.btns) b.draw();
  }
  drawSub(c) {
    const s = this.subs.find(s => this.t >= s[0] && this.t <= s[1]); if (!s) return;
    const n = Math.floor((this.t - s[0]) * 42), text = s[3].slice(0, n), who = s[2];
    const L = wrap(s[3], 900, 32), bh = L.length * 40 + 30, by = H - bh - 28;
    c.fillStyle = 'rgba(20,12,40,.72)'; rrPath(c, 170, by, 940, bh, 22); c.fill();
    if (who !== 'narrador') chip(who === 'alvaro' ? 'ÁLVARO' : who.toUpperCase(), 196, by, '#a66cff', '#fff', 20, 'left', { font: 'T' });
    let cnt = 0; L.forEach((l, i) => { const part = text.slice(cnt, cnt + l.length); cnt += l.length + 1; txt(part, 640, by + 34 + i * 40, { size: 32, color: '#fff', font: who === 'narrador' ? 'B' : 'B' }); });
  }
  /* ---------- 1. el mar al atardecer ---------- */
  sceneSea(c, t) {
    const cam = 1 + this.k(0, 6.4) * .08; c.translate(640, 400); c.scale(cam, cam); c.translate(-640, -400);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b1d5c'); g.addColorStop(.35, '#ff7a59'); g.addColorStop(.6, '#ffc36b'); g.addColorStop(.61, '#2a78c2'); g.addColorStop(1, '#123e75'); c.fillStyle = g; c.fillRect(-100, -100, W + 200, H + 200);
    const sg = c.createRadialGradient(640, 480, 20, 640, 480, 380); sg.addColorStop(0, 'rgba(255,240,180,.9)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = sg; c.fillRect(0, 100, W, 400); circle(640, 470, 90, '#fff1b8');
    c.fillStyle = 'rgba(255,230,160,.35)'; for (let i = 0; i < 12; i++) { const y = 500 + i * 22, w = 220 - i * 12 + Math.sin(t * 3 + i) * 20; c.fillRect(640 - w / 2, y, w, 5); }
    for (let i = 0; i < 3; i++) drawCloud(((i * 520 + t * 25) % 1700) - 200, 120 + i * 50, .9, 'rgba(255,220,230,.9)');
    for (let l = 0; l < 3; l++) { c.strokeStyle = `rgba(255,255,255,${.18 + l * .12})`; c.lineWidth = 3; for (let x = -((t * (30 + l * 30)) % 160); x < W + 160; x += 160) { c.beginPath(); c.arc(x, 560 + l * 80, 16, Math.PI * 1.1, Math.PI * 1.9); c.arc(x + 34, 560 + l * 80, 16, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
    // el Aplanatrón cae dando vueltas
    if (t < 3.3) { const u = this.k(.2, 3.3), x = lerp(-150, 800, u), y = lerp(80, 520, u * u), rot = u * TAU * 2.2;
      for (let i = 1; i < 10; i++) { const uu = Math.max(0, u - i * .03), xx = lerp(-150, 800, uu), yy = lerp(80, 520, uu * uu); c.globalAlpha = .5 - i * .045; circle(xx - 30, yy - 10, 14 + i * 3, i % 2 ? '#bbb' : '#fff'); } c.globalAlpha = 1;
      c.save(); c.translate(x, y); c.rotate(rot); drawPlancha(0, 0, .55, { dir: 1, expr: 'shock', arms: 'up', shadow: false }); c.restore(); }
    // ondas y gotas
    for (const r of this.ring) { const a = this.t - r.t0; for (let i = 0; i < 3; i++) { const rr2 = a * 260 - i * 60; if (rr2 > 0) { c.globalAlpha = Math.max(0, 1 - rr2 / 700); c.lineWidth = 5; c.strokeStyle = '#fff'; ell(c, 800, 530, rr2, rr2 * .22); c.stroke(); } } c.globalAlpha = 1; }
    for (const d of this.drops) circle(d.x, d.y, d.r, '#dff4ff', '#fff', 2);
    // Álvaro sale con flotador y bandera blanca
    if (t > 4.2) { const u = E.outBack(this.k(4.2, 5.0)), bob = Math.sin(t * 3) * 6; c.save(); c.translate(800, 560 + bob + (1 - u) * 140);
      drawAlvaro(0, -40, .42, { expr: 'sad', arms: 'up' }); c.lineWidth = 16; c.strokeStyle = INK; ell(c, 0, 20, 90, 26); c.stroke(); c.lineWidth = 11; c.strokeStyle = '#ff4b4b'; ell(c, 0, 20, 90, 26); c.stroke(); c.strokeStyle = '#fff'; c.setLineDash([22, 22]); ell(c, 0, 20, 90, 26); c.stroke(); c.setLineDash([]);
      rr(56, -170, 5, 110, 2, '#8a5a3a', INK, 2); const w = Math.sin(t * 7) * 5; c.beginPath(); c.moveTo(61, -168); c.quadraticCurveTo(90, -168 + w, 110, -160); c.lineTo(110, -130); c.quadraticCurveTo(90, -136 - w, 61, -135); c.closePath(); fillStroke(c, '#fff', 3); c.restore(); }
  }
  /* ---------- 2. lunes: el mapa arreglado ---------- */
  sceneClass(c, t) {
    const z = 1.12 - E.io(clamp(t / 6.8, 0, 1)) * .12; c.translate(640, 380); c.scale(z, z); c.translate(-640, -380);
    bg('cole');
    rr(250, 80, 780, 400, 18, '#8a5a3a', INK, 7); c.save(); rrPath(c, 272, 100, 736, 360, 10); c.clip(); this.map.drawBase(); this.map.drawRivers(['Duero', 'Tajo', 'Ebro']); this.map.drawRanges(Object.keys(GEO.es.ranges).concat(['teide'])); c.restore();
    for (let i = 0; i < 6; i++) { const a = t * 2 + i, x = 640 + Math.cos(a) * 170, y = 260 + Math.sin(a * 1.3) * 120; txt('✦', x, y, { size: 22 + Math.sin(t * 5 + i) * 6, color: '#fff3a0', outline: 3 }); }
    txt('MAPA DE ESPAÑA', 640, 70, { size: 24, font: 'T', color: '#fff', outline: 6 });
    // Álvaro empapado entra con los exámenes
    const ax = lerp(1400, 1000, E.outQ(clamp((t - .2) / 1.2, 0, 1)));
    drawAlvaro(ax, 470, .7, { expr: t > 1.4 && t < 6 ? 'talk' : 'sad', talk: t > .8 && t < 6, arms: 'idle' });
    for (let i = 0; i < 4; i++) { const u = (t * .9 + i / 4) % 1; circle(ax - 60 + i * 40, 380 + u * 260, 5, '#5cc2f5', INK, 1.5); }
    c.save(); c.translate(ax - 10, 330); c.rotate(Math.sin(t * 2) * .1); for (let i = 0; i < 5; i++) { c.save(); c.rotate(i * TAU / 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -22); c.lineTo(0, -30); c.lineTo(7, -22); c.closePath(); fillStroke(c, '#ff8a5c', 2.5); c.restore(); } c.restore();
    for (let j = 0; j < 10; j++) { c.save(); c.translate(ax - 40, 540 - j * 12); c.rotate((j % 3 - 1) * .05); rr(-60, -8, 120, 16, 3, '#fff8ea', INK, 2); c.restore(); }
    // los niños lo celebran
    Game.team.avs.forEach((av, i) => { const x = 170 + i * 150, hop = Math.abs(Math.sin(t * 6 + i)) * 40; drawKid(x, 660 - hop, 1.8, { av, dir: 1, look: .4, ph: i }); });
    drawRosa(520, 560 + Math.sin(t * 3) * 10, .5, { expr: 'proud' });
    if (Math.random() < .25) this.conf.push({ x: rnd(W), y: -10, vy: rnd(120, 240), r: rnd(TAU), col: pick(['#ff5c8a', '#3ec1f3', '#ffc933', '#7ce05c', '#a66cff']) });
    for (const q of this.conf) { q.y += q.vy * G.dt; q.r += G.dt * 4; c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.col; c.fillRect(-6, -3, 12, 6); c.restore(); } this.conf = this.conf.filter(q => q.y < H + 20);
  }
  /* ---------- 3. la gran corrección ---------- */
  sceneMarking(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe3b3'); g.addColorStop(1, '#f7cf8e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const lamp = c.createRadialGradient(760, 380, 40, 760, 380, 620); lamp.addColorStop(0, 'rgba(255,255,220,.55)'); lamp.addColorStop(1, 'rgba(120,70,40,.25)'); c.fillStyle = lamp; c.fillRect(0, 0, W, H);
    rr(-20, 560, W + 40, 260, 0, '#b77b4a', INK, 6); c.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 90) c.fillRect(x, 560, 4, 240);
    // Álvaro corrigiendo: su cara pasa de enfado a sonrisa
    const mood = t < 2.2 ? 'angry' : t < 4.2 ? 'shock' : t < 6 ? 'side' : 'happy';
    drawAlvaro(230, 520, .82, { expr: mood, arms: 'idle', talk: t > .4 && t < 4.2 });
    // cinta de exámenes
    const n = Math.min(50, Math.floor(t * 6.5)); for (let i = 0; i < 4; i++) { const x = 1360 - ((t * 420 + i * 260) % 1040); if (x < 480) continue; c.save(); c.globalAlpha = clamp((x - 480) / 120, 0, 1); c.translate(x, 470); c.rotate(-.05); rr(-90, -120, 180, 240, 8, '#fff', INK, 4); c.strokeStyle = '#c9d2e3'; c.lineWidth = 3; for (let k2 = 0; k2 < 7; k2++) { c.beginPath(); c.moveTo(-66, -80 + k2 * 26); c.lineTo(66, -80 + k2 * 26); c.stroke(); } txt('EXAMEN TEMA 1', 0, -100, { size: 16, font: 'T', color: '#6a4fc8' });
      const stamped = x < 820; if (stamped) { c.save(); c.translate(20, 20); c.rotate(-.25); circle(0, 0, 58, null, '#ff4b4b', 7); txt('10', 0, 4, { size: 58, font: 'T', color: '#ff4b4b' }); c.restore(); } c.restore(); c.globalAlpha = 1; }
    // el sello
    const st = this.stamps[this.stamps.length - 1]; if (st && t < 5.2) { const a = this.t - st.t0; const down = a < .12 ? a / .12 : a < .3 ? 1 : 1 - (a - .3) / .12; c.save(); c.translate(760, 300 + clamp(down, 0, 1) * 80); c.scale(1 + (a < .15 ? .15 : 0), 1 - (a < .15 ? .12 : 0)); rr(-30, -110, 60, 90, 12, '#8a5a3a', INK, 4); rr(-50, -24, 100, 30, 8, '#ff4b4b', INK, 4); c.restore(); }
    rr(930, 60, 300, 80, 20, '#fff', INK, 5); txt('Corregidos: ' + n + ' / 50', 1080, 100, { size: 28, font: 'T', color: '#ff4b4b' });
    if (t > 4.4) { const u = E.outBack(clamp((t - 4.4) / .6, 0, 1)); c.save(); c.translate(230, 180); c.scale(u, u); txt('♥', 90, 0, { size: 60, color: '#ff5c8a', outline: 6 }); c.restore(); }
  }
  /* ---------- 4. de noche: el tema 2 ---------- */
  sceneNight(c, t) {
    bg('cole'); const dark = c.createRadialGradient(700, 420, 40, 700, 420, 700); dark.addColorStop(0, 'rgba(20,12,40,.25)'); dark.addColorStop(1, 'rgba(10,6,25,.88)'); c.fillStyle = dark; c.fillRect(0, 0, W, H);
    if (t > 6.6 && t < 7.1) { c.fillStyle = 'rgba(220,230,255,.6)'; c.fillRect(0, 0, W, H); c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(1180, 110); c.lineTo(1150, 200); c.lineTo(1190, 210); c.lineTo(1140, 330); c.stroke(); }
    // estantería con el libro del tema 2
    rr(80, 260, 300, 300, 10, '#6b4a2a', INK, 5); for (let i = 0; i < 3; i++) rr(80, 340 + i * 80, 300, 10, 2, '#4a3220', INK, 3);
    for (let i = 0; i < 9; i++) if (i !== 4) rr(100 + i * 30, 272 + Math.floor(i / 9) * 80, 24, 64, 3, ['#3ec1f3', '#ff8a3d', '#7ce05c', '#a66cff'][i % 4], INK, 2);
    const pull = E.io(clamp((t - .4) / 1.2, 0, 1)), bx = lerp(220, 560, pull), by = lerp(304, 380, pull), bs = lerp(1, 2.6, pull);
    c.save(); c.translate(bx, by); c.scale(bs, bs); rr(-24, -34, 48, 68, 4, '#ff4b4b', INK, 3); txt('TEMA', 0, -14, { size: 9, font: 'T', color: '#fff' }); txt('2', 0, 6, { size: 20, font: 'T', color: '#ffc933', outline: 2 }); c.restore();
    if (pull > .9) txt('Un voto de confianza', 560, 480, { size: 26, font: 'T', color: '#fff', outline: 6 });
    // Álvaro: sonrisa malvada con brillo en los ojos
    const expr = t < 4.6 ? 'talk' : t < 5.2 ? 'side' : 'evil';
    drawAlvaro(930, 470, .8, { expr, arms: t > 5.6 ? 'rub' : 'idle', talk: t > .6 && t < 9 });
    if (t > 5.0) { const g2 = (Math.sin(t * 10) + 1) / 2; for (const dx of [-38, 38]) txt('✦', 930 + dx, 300, { size: 20 + g2 * 14, color: '#fff', outline: 3 }); }
    // el plano del VOTATRÓN 5000
    if (t > 5.8) { const u = E.outBack(clamp((t - 5.8) / .8, 0, 1)); c.save(); c.translate(560, 230); c.scale(u, u); c.rotate(-.05);
      rr(-230, -120, 460, 240, 10, '#2c5aa0', '#dbe8ff', 4); c.strokeStyle = 'rgba(220,235,255,.35)'; c.lineWidth = 1.5; for (let x = -220; x < 230; x += 20) { c.beginPath(); c.moveTo(x, -115); c.lineTo(x, 115); c.stroke(); } for (let y = -110; y < 120; y += 20) { c.beginPath(); c.moveTo(-225, y); c.lineTo(225, y); c.stroke(); }
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(-70, -40, 140, 110); c.beginPath(); c.moveTo(-30, -40); c.lineTo(30, -40); c.stroke(); c.strokeRect(-20, -52, 40, 12); c.beginPath(); c.moveTo(-70, 0); c.lineTo(-130, -40); c.moveTo(70, 0); c.lineTo(130, -40); c.moveTo(-40, 70); c.lineTo(-60, 105); c.moveTo(40, 70); c.lineTo(60, 105); c.stroke(); circle(0, 20, 18, null, '#fff', 3);
      txt('VOTATRÓN 5000', 0, -85, { size: 30, font: 'T', color: '#fff' }); txt('Proyecto secreto · no enseñar a 5.º', 0, 100, { size: 14, color: '#dbe8ff' }); c.restore(); }
    // la ventana con la luna
    rr(1070, 110, 180, 230, 10, '#1d2a55', INK, 6); circle(1200, 170, 26, '#fff8d8'); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(1160, 110); c.lineTo(1160, 340); c.moveTo(1070, 225); c.lineTo(1250, 225); c.stroke();
  }
  /* ---------- 5. cartel final ---------- */
  sceneTitle(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3b2a7a'); g.addColorStop(1, '#ff7a59'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = (i * 97 + t * 20) % W, y = (i * 53) % 420; circle(x, y, 1.5 + (i % 3), `rgba(255,255,255,${.3 + .4 * Math.abs(Math.sin(t * 2 + i))})`); }
    const u = E.outBack(clamp(t / .8, 0, 1)); c.save(); c.translate(640, 230); c.scale(u, u); c.rotate(-.04); txt('FIN', 0, 0, { size: 170, font: 'T', color: '#ffc933', outline: 18, shadow: 12, shadowC: INK }); c.restore();
    if (t > .9) { const v = clamp((t - .9) / .5, 0, 1); c.globalAlpha = v; txt('…¿o no?', 640, 360, { size: 48, font: 'T', color: '#fff', outline: 9 }); txt('Próximamente: el profesor Álvaro contra el TEMA 2', 640, 420, { size: 30, color: '#fff', outline: 7 }); c.globalAlpha = 1; }
    if (t > 1.6) { const v = clamp((t - 1.6) / .5, 0, 1); c.globalAlpha = v; txt('Gracias, ' + this.names + ', por salvar España (y el examen).', 640, 490, { size: fitSize('Gracias, ' + this.names + ', por salvar España (y el examen).', 1100, 28), color: '#fff', outline: 6 }); c.globalAlpha = 1; }
    Game.team.avs.forEach((av, i) => drawKid(140 + i * 120, 780 - Math.abs(Math.sin(t * 5 + i)) * 20, 1.5, { av, ph: i, dir: 1 }));
    drawAlvaro(1130, 700, .5, { expr: 'evil', arms: 'rub' }); drawRosa(930, 640, .45, { expr: 'happy' });
  }
}
