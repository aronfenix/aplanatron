'use strict';
/* =====================================================================
   VÍDEOS DE TEORÍA: el cine de Rosa y el vídeo antes de cada prueba.
   Los archivos están en public/videos (Cloudflare); build.py los copia
   a docs/videos para GitHub Pages (git guarda una sola copia).
   ===================================================================== */
const VIDEOS = [
  { id: 'palabras', file: 'aplanatron-teoria-1-palabras-del-mapa.mp4', title: 'Las palabras del mapa', topic: 'Mares, costas y relieve', color: '#2fb8a0', tests: [0, 5] },
  { id: 'tiempo', file: 'aplanatron-teoria-2-el-tiempo-loco.mp4', title: 'El tiempo loco', topic: 'Los climas de España', color: '#ffb938', tests: [3] },
  { id: 'europa', file: 'aplanatron-teoria-3-europa-en-globo.mp4', title: 'Europa en globo', topic: 'El medio físico de Europa', color: '#a66cff', tests: [4] },
];
const VIDEO_BASE = 'videos/';
const videoSeen = v => !!(Game.team && Game.team.seen && Game.team.seen['v_' + v.id]);
/* vídeo que se ve antes de la prueba i (solo la primera vez) */
function videoForTest(i) { return VIDEOS.find(v => v.tests.includes(i) && !videoSeen(v)); }
const VBOX = { x: 100, y: 112, w: 1080, h: 608 };
class VideoScene {
  constructor(v, then) { this.v = v; this.then = then; }
  enter() {
    this.t = 0; this.err = false; this.ended = false; Sound.stop(.3);
    if (Game.team) { Game.team.seen = Game.team.seen || {}; Game.team.seen['v_' + this.v.id] = 1; Store.save(); }
    const el = this.el = document.createElement('video');
    el.src = VIDEO_BASE + this.v.file; el.controls = true; el.playsInline = true; el.setAttribute('playsinline', ''); el.preload = 'auto';
    el.setAttribute('controlsList', 'nodownload');
    Object.assign(el.style, { position: 'fixed', zIndex: 3, background: '#000', borderRadius: '12px', objectFit: 'contain' });
    el.addEventListener('ended', () => { this.ended = true; if (this.goBtn) this.goBtn.pulse = true; });
    el.addEventListener('error', () => { this.err = true; el.style.display = 'none'; });
    document.body.appendChild(el); this.place();
    const p = el.play(); if (p && p.catch) p.catch(() => { });
    this.btns = this.then
      ? [this.goBtn = new Btn({ x: W - 290, y: 16, w: 270, h: 84, label: '¡A JUGAR! ▸', size: 30, color: '#7ce05c', key: ['Escape'], onTap: () => this.leave() })]
      : [backBtn(() => this.leave(), 20, 18, 'VÍDEOS')];
  }
  place() {
    if (!this.el) return; const s = G.scale, k = [G.ox + VBOX.x * s, G.oy + VBOX.y * s, VBOX.w * s, VBOX.h * s].map(Math.round).join();
    if (k === this.pk) return; this.pk = k; const [l, t, w, h] = k.split(',');
    Object.assign(this.el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
  }
  pause() { if (this.el) this.el.pause(); }
  exit() { if (!this.el) return; this.el.pause(); this.el.removeAttribute('src'); this.el.load(); this.el.remove(); this.el = null; }
  leave() { this.exit(); go(this.then || (() => new Cine())); }
  update(dt) { this.t += dt; }
  draw(c) {
    c.fillStyle = '#23193d'; c.fillRect(0, 0, W, H);
    txt(this.v.title, 640, 58, { size: fitSize(this.v.title, 640, 44, 'T'), font: 'T', color: this.v.color, outline: 9 });
    rr(VBOX.x - 8, VBOX.y - 8, VBOX.w + 16, VBOX.h + 16, 20, '#000', this.v.color, 6);
    if (this.err) { txt('No se ha podido cargar el vídeo.', 640, 380, { size: 34, font: 'T', color: '#fff', outline: 7 }); txt('Comprueba la conexión a internet y vuelve a intentarlo.', 640, 436, { size: 24, color: '#fff' }); }
    else this.place();
    if (this.then) txt(this.ended ? '¡Ahora a demostrar lo que sabéis!' : 'Mira el vídeo antes de la prueba o pulsa «¡A JUGAR!» para empezar ya.', 640, 764, { size: 22, color: '#fff' });
    for (const b of this.btns) b.draw();
  }
}
/* el cine de Rosa: todos los vídeos para volver a verlos */
class Cine {
  enter() {
    this.btns = [backBtn(() => go(() => new Hub()), 20, 18, 'MAPA')];
    VIDEOS.forEach((v, i) => this.btns.push(new Btn({ x: 70 + i * 390, y: 230, w: 360, h: 380, color: v.color, label: '', r: 30, onTap: () => go(() => new VideoScene(v)),
      icon: (cx, cy) => {
        const c = G.ctx; circle(cx, cy - 70, 62, '#fff', INK, 6);
        c.fillStyle = v.color; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 18, cy - 102); c.lineTo(cx + 32, cy - 70); c.lineTo(cx - 18, cy - 38); c.closePath(); c.fill(); c.stroke();
        txt('VÍDEO ' + (i + 1), cx, cy + 22, { size: 22, color: '#fff', outline: 5 });
        wrap(v.title, 320, 32, 'T').forEach((l, j) => txt(l, cx, cy + 62 + j * 36, { size: 32, font: 'T', color: '#fff', outline: 7 }));
        txt(v.topic, cx, cy + 142, { size: 20, color: INK });
        if (videoSeen(v)) chip('✓ Visto', cx, cy - 160, '#fff', INK, 18);
      } })));
    Sound.play('mapa', { vol: .6 });
  }
  draw(c) {
    c.fillStyle = '#23193d'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 14; i++) c.fillRect(i * 96 + 20, 690, 60, 110);
    txt('EL CINE DE ROSA', 640, 70, { size: 60, font: 'T', color: '#ffc933', outline: 10 });
    txt('Los vídeos de teoría del tema 1. Toca uno para verlo.', 640, 150, { size: 26, color: '#fff' });
    drawRosa(1180, 720, .32, { expr: 'happy' });
    for (const b of this.btns) b.draw();
  }
}
