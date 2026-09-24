'use strict';
/* =====================================================================
   ARTE V2: niños (avatares), Rosa de los vientos, Gran Plancha, planchitas,
   globo, carteles, fuentes, estaciones del tiempo
   ===================================================================== */
const AVATARS = [
  { id: 0, name: 'Pelo corto', skin: '#f6cfae', hair: '#6b3f22', style: 'short', shirt: '#ff5c5c', pants: '#3b4a8a' },
  { id: 1, name: 'Coleta', skin: '#f9d6bd', hair: '#d8622a', style: 'ponytail', shirt: '#4fc36b', pants: '#2c3e66', freckles: true },
  { id: 2, name: 'Rizos', skin: '#c98a5e', hair: '#231812', style: 'curly', shirt: '#ffc933', pants: '#4a3b7a' },
  { id: 3, name: 'Moños', skin: '#e0ad84', hair: '#241a18', style: 'buns', shirt: '#a66cff', pants: '#2f5d7a' },
  { id: 4, name: 'Pincho', skin: '#f8d9c0', hair: '#f2c14e', style: 'spiky', shirt: '#3ec1f3', pants: '#394060' },
  { id: 5, name: 'Trenzas', skin: '#8a5a3c', hair: '#1b1110', style: 'braids', shirt: '#ff8a3d', pants: '#35305a' },
];
/* niño visto de 3/4, origen en los pies */
function drawKid(x, y, s = 1, o = {}) {
  const c = G.ctx, av = AVATARS[o.av || 0], t = G.t + (o.ph || 0), dir = o.dir || 1;
  const walk = o.walk ? Math.sin(t * 16) : 0, bob = o.walk ? Math.abs(Math.sin(t * 16)) * 3 : Math.sin(t * 2.5) * 1.2;
  const flat = o.flat || 0; // 0..1 planchado
  c.save(); c.translate(x, y); c.scale(s * dir, s * (1 - flat * .82)); if (flat) c.scale(1 + flat * .5, 1);
  // sombra
  c.fillStyle = 'rgba(20,10,40,.25)'; ell(c, 0, 2, 22, 7); c.fill();
  c.translate(0, -bob);
  // piernas
  if (!o.boat) {
    for (const k of [-1, 1]) { const sw = walk * k * 7; c.lineCap = 'round'; c.lineWidth = 12; c.strokeStyle = INK; c.beginPath(); c.moveTo(k * 7, -26); c.lineTo(k * 7 + sw, -6); c.stroke(); c.lineWidth = 7; c.strokeStyle = av.pants; c.stroke(); ell(c, k * 7 + sw + 3, -3, 8, 5); fillStroke(c, '#fff', 3); }
  }
  // cuerpo
  const arms = o.carry ? 'up' : 'swing';
  const armDraw = (k) => { c.lineCap = 'round'; c.lineWidth = 11; c.strokeStyle = INK; c.beginPath();
    if (arms === 'up') { c.moveTo(k * 13, -44); c.lineTo(k * 16, -72); } else { const sw = -walk * k * 8; c.moveTo(k * 13, -44); c.lineTo(k * 16 + sw * .3, -26 + Math.abs(sw) * .2); }
    c.stroke(); c.lineWidth = 6; c.strokeStyle = av.skin; c.stroke(); };
  armDraw(-1);
  rr(-15, -50, 30, 28, 11, av.shirt, INK, 4);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-11, -46, 22, 4);
  armDraw(1);
  // cabeza
  const hy = -74;
  if (av.style === 'ponytail') { ell(c, -22, hy - 2, 9, 14, .5); fillStroke(c, av.hair, 4); }
  if (av.style === 'braids') { for (const k of [-1, 1]) { rr(k * 20 - 5, hy, 10, 30, 5, av.hair, INK, 3.5); circle(k * 20, hy + 32, 5, '#ff5c8a', INK, 3); } }
  if (av.style === 'buns') { circle(-16, hy - 22, 10, av.hair, INK, 4); circle(16, hy - 22, 10, av.hair, INK, 4); }
  circle(0, hy, 24, av.skin, INK, 4.5);
  // pelo
  c.save(); c.beginPath(); c.arc(0, hy, 24, 0, TAU); c.clip(); c.fillStyle = av.hair;
  if (av.style === 'short' || av.style === 'ponytail' || av.style === 'buns' || av.style === 'braids') { c.beginPath(); c.moveTo(-26, hy - 2); c.quadraticCurveTo(-18, hy - 30, 6, hy - 28); c.quadraticCurveTo(26, hy - 24, 26, hy - 4); c.quadraticCurveTo(12, hy - 16, -4, hy - 12); c.quadraticCurveTo(-14, hy - 10, -26, hy - 2); c.fill(); }
  if (av.style === 'curly') { for (let i = -3; i <= 3; i++) circle(i * 8, hy - 20 + Math.abs(i) * 2, 9, av.hair); }
  if (av.style === 'spiky') { c.beginPath(); c.moveTo(-26, hy - 4); for (let i = 0; i < 6; i++) { c.lineTo(-22 + i * 9, hy - 34); c.lineTo(-18 + i * 9, hy - 14); } c.lineTo(26, hy - 4); c.lineTo(26, hy - 40); c.lineTo(-26, hy - 40); c.fill(); }
  c.restore();
  if (av.style === 'curly') for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(i * 8, hy - 20 + Math.abs(i) * 2, 9, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); }
  circle(0, hy, 24, null, INK, 4.5);
  // cara
  const blink = (t % 3.4) < .12, lk = o.look ?? .35;
  if (blink) { eye(c, -4, hy + 2, 5, 6, { closed: 'down', lw: 3 }); eye(c, 12, hy + 2, 5, 6, { closed: 'down', lw: 3 }); }
  else { eye(c, -4, hy + 2, 5, 7, { look: [lk, 0], ir: 3.8, lw: 3 }); eye(c, 12, hy + 2, 5, 7, { look: [lk, 0], ir: 3.8, lw: 3 }); }
  c.fillStyle = 'rgba(255,100,100,.35)'; ell(c, -10, hy + 12, 5, 3); c.fill(); ell(c, 18, hy + 12, 5, 3); c.fill();
  if (av.freckles) { c.fillStyle = '#c47a4a'; for (const [fx, fy] of [[-12, 10], [-9, 13], [15, 10], [19, 13]]) { c.beginPath(); c.arc(fx, hy + fy, 1.3, 0, TAU); c.fill(); } }
  if (o.mouth === 'o' || flat) { ell(c, 5, hy + 14, 3.5, 4); fillStroke(c, '#5a1a26', 2.5); }
  else { c.beginPath(); c.moveTo(0, hy + 12); c.quadraticCurveTo(5, hy + 17, 11, hy + 12); fillStroke(c, null, 3); }
  c.restore();
}
function drawKidBoat(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0), dir = o.dir || 1;
  c.save(); c.translate(x, y + Math.sin(t * 3) * 2); c.rotate(Math.sin(t * 2.2) * .05); c.scale(s * dir, s);
  c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 3; i++) { const k = (t * 1.5 + i / 3) % 1; ell(c, -34 - k * 30, 4, 10 * (1 - k) + 2, 3); c.fill(); }
  c.save(); c.translate(0, 10); drawKid(0, 0, 1, { av: o.av, boat: true, look: .6, carry: o.carry, ph: o.ph }); c.restore();
  c.beginPath(); c.moveTo(-36, -18); c.lineTo(40, -18); c.lineTo(26, 6); c.lineTo(-26, 6); c.closePath(); fillStroke(c, o.hull || '#ff5c8a', 5);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-30, -15, 62, 5);
  c.restore();
}
/* ---------- Rosa, la rosa de los vientos ---------- */
function drawRosa(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0), ex = o.expr || 'happy', talking = o.talk && Math.sin(t * 20) > -.2;
  c.save(); c.translate(x, y + Math.sin(t * 2.4) * 4); c.scale(s, s); c.rotate(Math.sin(t * 1.3) * .05);
  // puntas diagonales
  for (let i = 0; i < 4; i++) { c.save(); c.rotate(Math.PI / 4 + i * Math.PI / 2); c.beginPath(); c.moveTo(-12, 0); c.lineTo(0, -58); c.lineTo(12, 0); c.closePath(); fillStroke(c, i % 2 ? '#c9d7f0' : '#e3ecfa', 4); c.restore(); }
  // puntas cardinales
  const cols = ['#ff4b5c', '#fff', '#fff', '#fff'], lab = ['N', 'E', 'S', 'O'];
  for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(-17, -6); c.lineTo(0, -86); c.lineTo(17, -6); c.closePath(); fillStroke(c, cols[i], 5); c.fillStyle = i ? '#dfe6f5' : '#d8253a'; c.beginPath(); c.moveTo(0, -86); c.lineTo(17, -6); c.lineTo(0, -6); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-17, -6); c.lineTo(0, -86); c.lineTo(17, -6); c.closePath(); fillStroke(c, null, 5);
    c.translate(0, -104); c.rotate(-i * Math.PI / 2); txt(lab[i], 0, 0, { size: 22, font: 'T', color: i ? '#3a5a9a' : '#ff4b5c', outline: 5, oc: '#fff' }); c.restore(); }
  // cara
  circle(0, 0, 36, '#fff8ea', INK, 5); circle(0, 0, 36, null, '#ffc933', 3);
  const blink = (t % 3.8) < .12;
  if (blink || ex === 'proud') { eye(c, -12, -6, 7, 8, { closed: ex === 'proud' ? 'up' : 'down', lw: 3.5 }); eye(c, 12, -6, 7, 8, { closed: ex === 'proud' ? 'up' : 'down', lw: 3.5 }); }
  else { eye(c, -12, -6, 7, ex === 'worried' ? 10 : 9, { look: o.look || [0, 0], ir: 5, lw: 3.5, iris: '#2b6ad0' }); eye(c, 12, -6, 7, ex === 'worried' ? 10 : 9, { look: o.look || [0, 0], ir: 5, lw: 3.5, iris: '#2b6ad0' }); }
  if (ex === 'worried') { c.lineWidth = 3.5; c.strokeStyle = INK; c.beginPath(); c.moveTo(-18, -20); c.lineTo(-6, -24); c.moveTo(18, -20); c.lineTo(6, -24); c.stroke(); }
  c.fillStyle = 'rgba(255,90,120,.35)'; ell(c, -22, 8, 6, 4); c.fill(); ell(c, 22, 8, 6, 4); c.fill();
  if (talking) { ell(c, 0, 14, 8, 7); fillStroke(c, '#5a1a26', 3.5); }
  else if (ex === 'worried') { c.beginPath(); c.moveTo(-8, 16); c.quadraticCurveTo(0, 10, 8, 16); fillStroke(c, null, 3.5); }
  else { c.beginPath(); c.moveTo(-10, 10); c.quadraticCurveTo(0, 20, 10, 10); fillStroke(c, '#5a1a26', 3.5); }
  c.restore();
}
/* ---------- la Gran Plancha 3000 (con Álvaro encima) ---------- */
function drawPlancha(x, y, s = 1, o = {}) { // el APLANATRÓN 3000: apisonadora voladora
  const c = G.ctx, t = G.t + (o.ph || 0), dir = o.dir || 1, hover = o.hover ?? 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  if (o.shadow !== false) { c.fillStyle = 'rgba(20,10,40,.28)'; ell(c, 20, 70 + 60 * hover, 190 * (1 - hover * .15), 30); c.fill(); }
  c.translate(0, -hover * 20 + Math.sin(t * 2) * 6); c.scale(dir, 1);
  // humo de la chimenea
  if (!G.low) for (let i = 0; i < 4; i++) { const k = (t * .9 + i / 4) % 1; c.globalAlpha = (1 - k) * .75; circle(-95 - k * 60 + Math.sin(k * 5 + i) * 8, -150 - k * 90, 12 + k * 24, '#fff', '#c9d7e8', 3); } c.globalAlpha = 1;
  // propulsores
  for (const jy of [-30, 10]) { const f = 26 + Math.sin(t * 30 + jy) * 8; c.beginPath(); c.moveTo(-190, jy - 12); c.quadraticCurveTo(-190 - f * 1.6, jy, -190, jy + 12); c.closePath(); fillStroke(c, '#ffb938', 3); c.beginPath(); c.moveTo(-190, jy - 6); c.quadraticCurveTo(-190 - f, jy, -190, jy + 6); c.closePath(); c.fillStyle = '#fff3c4'; c.fill(); rr(-196, jy - 16, 22, 32, 6, '#6b6b7a', INK, 4); }
  // chimenea
  rr(-112, -140, 30, 60, 6, '#4b4b5a', INK, 5); rr(-118, -148, 42, 14, 5, '#ffb938', INK, 4);
  // cuerpo
  c.beginPath(); c.moveTo(-178, 30); c.lineTo(-178, -60); c.quadraticCurveTo(-176, -86, -150, -88); c.lineTo(40, -88); c.quadraticCurveTo(66, -86, 70, -60); c.lineTo(76, 30); c.closePath(); fillStroke(c, o.col || '#8f4fe8', 6);
  c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.22)'; ell(c, -60, -78, 130, 14); c.fill(); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(-190, 4, 280, 30);
  c.fillStyle = '#ffc933'; for (let i = -190; i < 90; i += 34) { c.beginPath(); c.moveTo(i, 14); c.lineTo(i + 17, 14); c.lineTo(i + 7, 30); c.lineTo(i - 10, 30); c.closePath(); c.fill(); } c.restore();
  // rótulo
  c.save(); c.translate(-50, -20); c.scale(dir, 1); txt('APLANATRÓN', 0, -6, { size: 22, font: 'T', color: '#fff', outline: 5 }); txt('3000', 0, 18, { size: 22, font: 'T', color: '#ffc933', outline: 5 }); c.restore();
  // luz y dial
  const on = Math.sin(t * 8) > 0; circle(-158, -66, 9, on ? '#ff5050' : '#8a2030', INK, 3);
  circle(45, -58, 13, '#fff', INK, 4); c.save(); c.translate(45, -58); c.rotate(t * 3); c.fillStyle = '#ff4b4b'; c.fillRect(-2, -10, 4, 10); c.restore();
  // brazo del rodillo
  c.lineWidth = 16; c.strokeStyle = INK; c.lineCap = 'round'; c.beginPath(); c.moveTo(40, -40); c.lineTo(150, -10); c.stroke(); c.lineWidth = 9; c.strokeStyle = '#6b6b7a'; c.stroke();
  // rodillo (gira)
  circle(150, -10, 74, '#b9c0cf', INK, 6); circle(150, -10, 56, '#d6dbe8', INK, 4);
  c.save(); c.translate(150, -10); c.rotate(t * 4); c.lineWidth = 5; c.strokeStyle = 'rgba(35,25,61,.35)'; for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(18, 0); c.lineTo(52, 0); c.stroke(); } c.restore();
  circle(150, -10, 16, '#ffc933', INK, 4);
  // cabina con Álvaro
  if (o.rider !== false) { c.save(); c.translate(-40, -120); c.scale(dir, 1); drawAlvaro(0, 0, .42, { expr: o.expr || 'evil', arms: o.arms || 'point', talk: o.talk, cape: true }); c.restore(); }
  c.beginPath(); c.moveTo(-96, -88); c.lineTo(-96, -60); c.lineTo(20, -60); c.lineTo(20, -88); c.stroke();
  c.restore();
}
function drawPlanchita(x, y, s = 1, o = {}) { // miniaplanadora
  const c = G.ctx, t = G.t + (o.ph || 0), dir = o.dir || 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(20,10,40,.25)'; ell(c, 0, 18, 34, 8); c.fill();
  c.translate(0, -6 + Math.abs(Math.sin(t * 8)) * -3); c.scale(dir, 1);
  if (!G.low) { const k = (t * 1.5) % 1; c.globalAlpha = 1 - k; circle(-24 - k * 8, -40 - k * 22, 4 + k * 7, '#fff', '#c9d7e8', 2); c.globalAlpha = 1; }
  rr(-28, -44, 8, 16, 3, '#4b4b5a', INK, 3);
  rr(-36, -34, 42, 36, 8, o.col || '#ff4b6b', INK, 4);
  circle(20, -2, 20, '#b9c0cf', INK, 4); c.save(); c.translate(20, -2); c.rotate(t * 8); c.lineWidth = 3; c.strokeStyle = 'rgba(35,25,61,.4)'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.moveTo(0, -12); c.lineTo(0, 12); c.stroke(); c.restore();
  eye(c, -18, -18, 5, 6, { look: [.6, 0], ir: 3.5, lw: 3, lid: .35, lidC: o.col || '#ff4b6b' }); eye(c, -4, -18, 5, 6, { look: [.6, 0], ir: 3.5, lw: 3, lid: .35, lidC: o.col || '#ff4b6b' });
  c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.moveTo(-22, -26); c.lineTo(-13, -23); c.moveTo(1, -26); c.lineTo(-8, -23); c.stroke();
  c.restore();
}
/* ---------- globo aerostático ---------- */
function drawBalloonCraft(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(20,10,40,.2)'; ell(c, 0, 40, 40, 10); c.fill();
  c.translate(0, -60 + Math.sin(t * 1.8) * 6);
  c.lineWidth = 3; c.strokeStyle = INK; for (const k of [-1, 1]) { c.beginPath(); c.moveTo(k * 36, -40); c.lineTo(k * 18, 10); c.stroke(); }
  // cesta con niños
  if (o.kids) o.kids.forEach((av, i) => { c.save(); c.translate((i - (o.kids.length - 1) / 2) * 20, 16); drawKid(0, 0, .55, { av, boat: true, carry: o.carry, ph: i }); c.restore(); });
  rr(-24, 6, 48, 30, 6, '#b8864e', INK, 4); c.fillStyle = '#8a6030'; for (let i = 0; i < 3; i++) c.fillRect(-20, 12 + i * 8, 40, 3);
  // globo
  ell(c, 0, -88, 62, 70); fillStroke(c, '#ffc933', 5);
  c.save(); ell(c, 0, -88, 62, 70); c.clip(); const cols = ['#ff5c8a', '#3ec1f3', '#7ce05c']; for (let i = -3; i <= 3; i++) { c.fillStyle = cols[(i + 3) % 3]; if (i % 2) { c.beginPath(); c.ellipse(0, -88, Math.abs(i) * 18, 72, 0, 0, TAU); c.fill(); } } c.restore();
  ell(c, 0, -88, 62, 70); fillStroke(c, null, 5); c.fillStyle = 'rgba(255,255,255,.4)'; ell(c, -22, -112, 12, 22, .3); c.fill();
  rr(-16, -24, 32, 12, 4, '#8a6030', INK, 3);
  c.restore();
}
/* ---------- cartel con nombre ---------- */
function drawSign(x, y, text, o = {}) {
  const c = G.ctx, s = o.s || 1, size = o.size || 22;
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(o.rot || 0);
  const w = Math.max(80, tw_(text, size) + 28), h = size * 1.8;
  if (o.stick !== false) { rr(-4, -6, 8, 40, 3, '#8a5a3a', INK, 3); }
  if (o.glow) { c.globalAlpha = .35 + Math.sin(G.t * 5) * .15; rr(-w / 2 - 10, -h - 16, w + 20, h + 20, 16, o.glowC || '#fff36a'); c.globalAlpha = 1; }
  rr(-w / 2 + 3, -h - 3, w, h, 10, 'rgba(20,10,40,.3)');
  rr(-w / 2, -h - 6, w, h, 10, o.col || '#fff8ea', INK, 4);
  txt(text, 0, -h / 2 - 5, { size, color: o.tc || INK, w: 700 });
  c.restore();
}
/* ---------- fuente (nacimiento de un río) ---------- */
function drawSpring(x, y, s = 1, on = false, o = {}) {
  const c = G.ctx, t = G.t;
  c.save(); c.translate(x, y); c.scale(s, s);
  ell(c, 0, 0, 34, 14); fillStroke(c, '#9a93b5', 5); ell(c, 0, -2, 24, 9); fillStroke(c, on ? '#3fa0f5' : '#7a6a58', 4);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; rr(Math.cos(a) * 30 - 7, Math.sin(a) * 12 - 6, 14, 10, 4, '#b8b2cc', INK, 3); }
  if (on) { for (let i = 0; i < 5; i++) { const k = (t * 1.6 + i / 5) % 1; const ang = -Math.PI / 2 + (i - 2) * .35; circle(Math.cos(ang) * k * 34, -8 + Math.sin(ang) * k * 50 + k * k * 40, 5 * (1 - k) + 2, '#7fd0ff', INK, 2); } }
  else { c.lineWidth = 3; c.strokeStyle = '#5a4a3a'; c.beginPath(); c.moveTo(-10, -4); c.lineTo(-2, 0); c.lineTo(6, -4); c.stroke(); }
  c.restore();
}
/* ---------- estación del tiempo ---------- */
function drawStation(x, y, s = 1, o = {}) {
  const c = G.ctx, t = G.t;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(20,10,40,.25)'; ell(c, 0, 4, 36, 10); c.fill();
  c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-6, -90); c.moveTo(22, 0); c.lineTo(6, -90); c.moveTo(-16, -30); c.lineTo(16, -30); c.moveTo(-11, -60); c.lineTo(11, -60); c.stroke();
  c.lineWidth = 3; c.strokeStyle = '#c9d0e0'; c.stroke();
  // anemómetro
  c.save(); c.translate(0, -100); c.rotate(o.ok ? t * 6 : Math.sin(t * 9) * .3);
  for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.lineWidth = 4; c.strokeStyle = INK; c.beginPath(); c.moveTo(0, 0); c.lineTo(22, 0); c.stroke(); circle(24, 0, 7, '#ff8a3d', INK, 3); } c.restore();
  // pantalla
  rr(-34, -150, 68, 44, 8, o.ok ? '#bff0ff' : '#3a3550', INK, 4);
  if (o.ok) drawWeather(o.icon || 'sol', 0, -130, .35); else if (Math.sin(t * 13) > .3) { txt('?!', 0, -128, { size: 24, font: 'T', color: '#ff4b4b', outline: 4 }); }
  if (!o.ok && Math.random() < .1 && !G.low) burst(x + rnd(-20, 20) * s, y - 140 * s, { n: 2, c: '#ffc933', sp: 120, life: .4, s: 6 });
  c.restore();
}
function drawBuoy(x, y, s = 1, on = false) {
  const c = G.ctx, b = Math.sin(G.t * 3 + x) * 3; c.save(); c.translate(x, y + b); c.scale(s, s);
  if (on) { c.globalAlpha = .5 + Math.sin(G.t * 6) * .2; circle(0, -34, 26, 'rgba(255,240,120,.6)'); c.globalAlpha = 1; }
  c.beginPath(); c.moveTo(-18, 0); c.lineTo(-10, -30); c.lineTo(10, -30); c.lineTo(18, 0); c.closePath(); fillStroke(c, '#ff4b5c', 4);
  c.fillStyle = '#fff'; c.fillRect(-14, -18, 28, 8); rr(-4, -44, 8, 14, 3, INK); circle(0, -46, 7, on ? '#fff27a' : '#5c6380', INK, 3);
  ell(c, 0, 0, 24, 7); fillStroke(c, '#1d4f8a', 4); c.restore();
}
/* bola de lava con texto (jefe final) */
function drawLavaBall(x, y, r, label, o = {}) {
  const c = G.ctx, t = G.t + (o.ph || 0);
  c.save(); c.translate(x, y + Math.sin(t * 4) * 3);
  c.globalAlpha = .35; circle(0, 0, r * 1.35, '#ff8a3d'); c.globalAlpha = 1;
  circle(0, 0, r, '#ff6a2b', INK, 5); circle(-r * .3, -r * .3, r * .35, '#ffc933');
  c.fillStyle = '#c33a14'; for (let i = 0; i < 4; i++) { const a = i * 1.7 + t * .3; ell(c, Math.cos(a) * r * .55, Math.sin(a) * r * .55, 5, 3, a); c.fill(); }
  if (label) { const size = fitSize(label, 220, 22); const w = tw_(label, size) + 22; rr(-w / 2, r + 6, w, size * 1.5, 10, '#fff8ea', INK, 3.5); txt(label, 0, r + 6 + size * .78, { size, color: INK }); }
  c.restore();
}
