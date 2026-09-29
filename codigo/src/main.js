'use strict';
/* =====================================================================
   ARRANQUE
   ===================================================================== */
(function boot() {
  G.cv = document.getElementById('c'); G.ctx = G.cv.getContext('2d');
  Store.load(); G.low = !!Store.d.settings.low;
  Sound.st.music = Store.d.settings.music !== false; Sound.st.sfx = Sound.st.music;
  resize(); initInput();
  const start = () => {
    const q = new URLSearchParams(location.hash.slice(1));
    if (q.get('test')) { // atajo para pruebas: #test=c3&mode=2&diff=normal&stars=11000000
      const mode = +(q.get('mode') || 2);
      Game.team = { id: 'test', mode, names: mode === 1 ? ['Lucía'] : ['Lucía', 'Mateo'], avs: mode === 1 ? [1] : [1, 4], diff: q.get('diff') || 'normal', stars: (q.get('stars') || '0000000').padEnd(8, '0').split('').map(Number), best: [0, 0, 0, 0, 0, 0, 0, 0], miss: {}, seenIntro: true, seen: {}, last: 0 };
      const n = q.get('test'); const map = { hub: () => new Hub(), g0: () => new GameBanderas(), g1: () => new GameCarrera(), g2: () => new GameRios(), g3: () => new GameAgencia(), g4: () => new GamePuzle(), g5: () => new GameGlobos(), final: () => new Play(6), esq: () => new Esquema(true), title: () => new Title(), boot: () => new Boot(), intro: () => new Intro(), end: () => new EndCine(), cine: () => new Cine(), vid: () => new VideoScene(VIDEOS[+(q.get('v') || 0)]), profe: () => new Profe(), teams: () => new Teams(mode), mode: () => new ModeSelect(), nuevo: () => new NewTeam(mode), fin: () => new ChapterEnd({ ch: +(q.get('ch') || 0), stars: 2, score: 420, errors: 3, hints: 1, time: 312, missed: ['El Ebro nace en la Cordillera Cantábrica y desemboca en el Mediterráneo.', 'Los ríos del norte son cortos, rápidos y caudalosos.'] }) };
      if (map[n]) enter(map[n]()); else if (n.startsWith('c')) enter(new Play(+n.slice(1) - 1));
    } else enter(new Boot());
    requestAnimationFrame(frame);
  };
  const fontsReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('40px Lucky'), document.fonts.load('700 20px Fredoka'), document.fonts.load('500 20px Fredoka')]) : Promise.resolve();
  let started = false; const go1 = () => { if (!started) { started = true; start(); } };
  fontsReady.then(go1, go1); setTimeout(go1, 2500);
})();
