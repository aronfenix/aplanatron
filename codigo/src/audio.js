'use strict';
/* =====================================================================
   SONIDO: música generativa (Web Audio), efectos, voces y lectura en voz alta
   ===================================================================== */
const Sound = (() => {
  let ac = null, master, musicBus, sfxBus, voiceBus, verb, verbSend;
  const st = { music: true, sfx: true, ready: false, musicVol: .5, sfxVol: .8, tts: true, extra: false };
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) return null; return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12; }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let noiseBuf = null;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 4; master.connect(ac.destination);
    const out = ac.createGain(); out.gain.value = .9; out.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = st.music ? st.musicVol : 0; musicBus.connect(out);
    sfxBus = ac.createGain(); sfxBus.gain.value = st.sfx ? st.sfxVol : 0; sfxBus.connect(out);
    voiceBus = ac.createGain(); voiceBus.gain.value = st.sfx ? .5 : 0; voiceBus.connect(out);
    // reverb sencilla
    verb = ac.createConvolver(); const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = ir; verbSend = ac.createGain(); verbSend.gain.value = .26; verbSend.connect(verb); verb.connect(out);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    st.ready = true;
    if (ac.state === 'suspended') ac.resume();
    setInterval(tick, 25);
    if (pending) { const p = pending; pending = null; play(p.name, p.opt); }
  }
  function suspend() { if (ac && ac.state === 'running') ac.suspend(); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }
  function setMusic(on) { st.music = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? st.musicVol : 0, ac.currentTime, .05); }
  function setSfx(on) { st.sfx = on; if (sfxBus) { sfxBus.gain.setTargetAtTime(on ? st.sfxVol : 0, ac.currentTime, .05); voiceBus.gain.setTargetAtTime(on ? .5 : 0, ac.currentTime, .05); } }
  /* ---------- instrumentos (síntesis "acústica": nada de 8 bits) ---------- */
  function env(g, t, a, peak, d, sus, rel, end) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(.0001, peak * sus), t + a + d); g.gain.setValueAtTime(Math.max(.0001, peak * sus), Math.max(end, t + a + d)); g.gain.exponentialRampToValueAtTime(.0001, Math.max(end, t + a + d) + rel); }
  function osc(type, f, t, dest, o = {}) { const n = ac.createOscillator(); n.type = type; n.frequency.setValueAtTime(f, t); if (o.detune) n.detune.value = o.detune; n.connect(dest); n.start(t); n.stop(o.stop || t + 2); return n; }
  function out(dst, rev = .3, filt) { const g = ac.createGain(); let head = g; if (filt) { const f = ac.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; f.Q.value = filt[2] || .7; g.connect(f); head = f; } head.connect(dst); if (rev) { const s = ac.createGain(); s.gain.value = rev; head.connect(s); s.connect(verbSend); } return { g, f: head }; }
  function vib(o, t, f, depth, rate, delay, end) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * depth, t + delay); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(end); }
  const ksCache = {};
  function ks(m, damp = .996, len = .9, bright = .5) { // Karplus-Strong: cuerda pulsada
    const key = m + ':' + damp + ':' + len + ':' + bright; if (ksCache[key]) return ksCache[key];
    const sr = ac.sampleRate, f = hz(m), N = Math.max(2, Math.round(sr / f)), L = Math.floor(sr * len), b = ac.createBuffer(1, L, sr), d = b.getChannelData(0);
    const ring = new Float32Array(N); let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * (1 - bright) + r * bright; ring[i] = prev; }
    let p = 0; const dd = damp - Math.min(.015, f / 60000);
    for (let i = 0; i < L; i++) { const nx = (p + 1) % N; const v = ring[p]; ring[p] = (v + ring[nx]) * .5 * dd; d[i] = v; p = nx; }
    let mx = 0; for (let i = 0; i < Math.min(L, 4000); i++) mx = Math.max(mx, Math.abs(d[i])); if (mx > 0) for (let i = 0; i < L; i++) d[i] /= mx;
    ksCache[key] = b; return b;
  }
  function pluckOut(buf, t, v, dst, filt, rev, stop) { const s = ac.createBufferSource(); s.buffer = buf; const o = out(dst, rev, filt); o.g.gain.value = v; s.connect(o.g); s.start(t); s.stop(t + (stop || buf.duration)); return o; }
  const INST = {
    piano(m, t, dur, v, dst) {
      const f = hz(m), tau = clamp(1.6 * Math.sqrt(262 / f), .35, 2.6), end = t + Math.max(.12, dur), o = out(dst, .28);
      const parts = [[1, 1], [2, .42], [3, .18], [4.02, .08]];
      for (const [k, a] of parts) { if (f * k > 9000) continue; const g = ac.createGain(); g.connect(o.g); const tk = tau / (1 + (k - 1) * .8); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v * .32 * a, t + .004); g.gain.setTargetAtTime(.0001, t + .004, tk); g.gain.setTargetAtTime(.0001, end, .07); osc('sine', f * k, t, g, { stop: end + .5 }); }
      const n = noise(t, .03, v * .05, o.g, 'bandpass', 2500, .8);
    },
    strings(m, t, dur, v, dst, o2 = {}) {
      const f = hz(m), end = t + Math.max(.15, dur * .98), o = out(dst, .45, ['lowpass', Math.min(5000, 1200 + f * 2.2), .5]);
      env(o.g, t, o2.att || .14, v * .1, .2, .85, o2.rel || .3, end);
      for (const dt of [-8, 7]) { const s = osc('sawtooth', f, t, o.g, { stop: end + .5, detune: dt }); vib(s, t, f, .005, 5.3, .35, end + .5); }
    },
    violin(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.1, dur * .95), o = out(dst, .4, ['lowpass', 3800, .9]);
      env(o.g, t, .07, v * .13, .1, .8, .18, end);
      const s = osc('sawtooth', f, t, o.g, { stop: end + .3 }); vib(s, t, f, .008, 5.8, .22, end + .3);
      const s2 = osc('sawtooth', f, t, o.g, { stop: end + .3, detune: 5 }); vib(s2, t, f, .007, 5.5, .25, end + .3);
    },
    spic(m, t, dur, v, dst) { // cuerdas cortas (spiccato)
      const f = hz(m), o = out(dst, .3, ['lowpass', 2600, .8]); env(o.g, t, .006, v * .16, .09, .15, .05, t + .09);
      osc('sawtooth', f, t, o.g, { stop: t + .3, detune: -4 }); osc('sawtooth', f, t, o.g, { stop: t + .3, detune: 5 });
    },
    pizz(m, t, dur, v, dst) { pluckOut(ks(m, .985, .55, .35), t, v * .75, dst, ['lowpass', 1900, .7], .3); },
    guitar(m, t, dur, v, dst) { pluckOut(ks(m, .996, 1.2, .55), t, v * .6, dst, ['lowpass', 3000, .6], .22); },
    timple(m, t, dur, v, dst) { pluckOut(ks(m, .991, .7, .85), t, v * .5, dst, ['highpass', 280, .7], .2); },
    harp(m, t, dur, v, dst) { pluckOut(ks(m, .998, 1.8, .3), t, v * .55, dst, ['lowpass', 3200, .5], .45); },
    mando(m, t, dur, v, dst) { // trémolo de mandolina
      const n = Math.max(1, Math.min(14, Math.round(dur / .07))); for (let k = 0; k < n; k++) pluckOut(ks(m, .99, .35, .9), t + k * .07, v * (k ? .32 : .45) * (.85 + Math.random() * .3), dst, ['lowpass', 5200, .6], .25, .3);
    },
    flute(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.08, dur * .92), o = out(dst, .4); env(o.g, t, .06, v * .2, .1, .8, .12, end);
      const s = osc('sine', f, t, o.g, { stop: end + .3 }); vib(s, t, f, .006, 5, .2, end + .3);
      const g2 = ac.createGain(); g2.gain.value = .16; g2.connect(o.g); const s2 = osc('sine', f * 2, t, g2, { stop: end + .3 }); vib(s2, t, f * 2, .006, 5, .2, end + .3);
      noise(t, .12, v * .035, o.g, 'bandpass', f * 2, 1.2);
    },
    whistle(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.06, dur * .9), o = out(dst, .35); env(o.g, t, .02, v * .17, .05, .85, .06, end);
      const s = osc('triangle', f, t, o.g, { stop: end + .2 }); vib(s, t, f, .007, 6, .25, end + .2);
      const g2 = ac.createGain(); g2.gain.value = .25; g2.connect(o.g); osc('sine', f * 2, t, g2, { stop: end + .2 });
      noise(t, .05, v * .04, o.g, 'bandpass', f * 3, 1);
    },
    clarinet(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.06, dur * .85), o = out(dst, .3, ['lowpass', 1500, .7]); env(o.g, t, .03, v * .15, .06, .75, .08, end);
      const s = osc('square', f, t, o.g, { stop: end + .2 }); vib(s, t, f, .004, 5, .3, end + .2);
    },
    oboe(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.08, dur * .92), o = out(dst, .4, ['bandpass', 1300, 1.1]); env(o.g, t, .05, v * .3, .08, .8, .12, end);
      const s = osc('sawtooth', f, t, o.g, { stop: end + .3 }); vib(s, t, f, .006, 5.2, .25, end + .3);
    },
    horn(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.1, dur * .92), o = out(dst, .45, ['lowpass', 500, .8]);
      o.f.frequency.setValueAtTime(400, t); o.f.frequency.exponentialRampToValueAtTime(1500, t + .12); o.f.frequency.exponentialRampToValueAtTime(1000, t + .4);
      env(o.g, t, .07, v * .16, .2, .75, .2, end); osc('sawtooth', f, t, o.g, { stop: end + .4, detune: -5 }); osc('sawtooth', f, t, o.g, { stop: end + .4, detune: 6 });
    },
    brass(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.06, dur * .9), o = out(dst, .35, ['lowpass', 600, 1.5]);
      o.f.frequency.setValueAtTime(600, t); o.f.frequency.exponentialRampToValueAtTime(3200, t + .05); o.f.frequency.exponentialRampToValueAtTime(1800, t + .25);
      env(o.g, t, .025, v * .17, .12, .7, .1, end); osc('sawtooth', f, t, o.g, { stop: end + .3, detune: -7 }); osc('sawtooth', f, t, o.g, { stop: end + .3, detune: 7 });
    },
    accordion(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.05, dur * .9), o = out(dst, .25, ['bandpass', 1500, .6]); env(o.g, t, .03, v * .26, .08, .8, .07, end);
      osc('sawtooth', f, t, o.g, { stop: end + .2, detune: -14 }); osc('sawtooth', f, t, o.g, { stop: end + .2, detune: 14 }); osc('square', f / 2, t, o.g, { stop: end + .2 });
    },
    pipes(m, t, dur, v, dst) { // bordón de gaita
      const f = hz(m), end = t + dur, o = out(dst, .3, ['bandpass', 900, 1.2]); env(o.g, t, .25, v * .2, .1, .9, .4, end); osc('sawtooth', f, t, o.g, { stop: end + .6, detune: 3 });
    },
    choir(m, t, dur, v, dst) {
      const f = hz(m), end = t + Math.max(.2, dur * .98), o = out(dst, .55); env(o.g, t, .35, v * .5, .2, .85, .4, end);
      for (const [fr, q, a] of [[750, 5, .6], [1150, 6, .35]]) { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q; const g = ac.createGain(); g.gain.value = a; bp.connect(g); g.connect(o.g); for (const dt of [-10, 9]) { const s = osc('sawtooth', f, t, bp, { stop: end + .6, detune: dt }); vib(s, t, f, .004, 4.6, .5, end + .6); } }
    },
    dbass(m, t, dur, v, dst) { // contrabajo pizzicato
      const f = hz(m), o = out(dst, .12, ['lowpass', 700, .8]); const end = t + Math.min(.9, Math.max(.2, dur));
      env(o.g, t, .008, v * .55, .3, .3, .12, end); osc('sine', f, t, o.g, { stop: end + .3 }); const g2 = ac.createGain(); g2.gain.value = .35; g2.connect(o.g); osc('triangle', f * 2, t, g2, { stop: end + .3 });
    },
    bass(m, t, dur, v, dst) { // bajo largo de cuerda (arco)
      const f = hz(m), end = t + Math.max(.1, dur * .95), o = out(dst, .15, ['lowpass', 520, .8]); env(o.g, t, .05, v * .3, .1, .8, .12, end); osc('sawtooth', f, t, o.g, { stop: end + .3 });
    },
    timp(m, t, dur, v, dst) {
      const f = hz(m), o = out(dst, .35); env(o.g, t, .005, v * .7, .9, .01, .1, t + .9); const s = osc('sine', f * 1.03, t, o.g, { stop: t + 1.2 }); s.frequency.exponentialRampToValueAtTime(f, t + .08);
      const g2 = ac.createGain(); g2.gain.value = .3; g2.connect(o.g); osc('sine', f * 1.5, t, g2, { stop: t + .6 }); noise(t, .08, v * .25, o.g, 'lowpass', 500);
    },
    celesta(m, t, dur, v, dst) {
      const f = hz(m), o = out(dst, .45); env(o.g, t, .003, v * .28, 1.1, .01, .1, t + 1.1); osc('sine', f, t, o.g, { stop: t + 1.3 });
      const g2 = ac.createGain(); g2.connect(o.g); env(g2, t, .002, .5, .25, .01, .05, t + .25); osc('sine', f * 4, t, g2, { stop: t + .35 });
    },
    glock(m, t, dur, v, dst) {
      const f = hz(m), o = out(dst, .4); env(o.g, t, .003, v * .3, 1.1, .01, .1, t + 1.1); osc('sine', f, t, o.g, { stop: t + 1.3 });
      const g2 = ac.createGain(); g2.connect(o.g); env(g2, t, .002, .4, .3, .01, .05, t + .3); osc('sine', f * 2.76, t, g2, { stop: t + .4 });
    },
    marimba(m, t, dur, v, dst) {
      const f = hz(m), o = out(dst, .3); env(o.g, t, .004, v * .55, .45, .01, .05, t + .45); osc('sine', f, t, o.g, { stop: t + .6 });
      const g2 = ac.createGain(); g2.connect(o.g); env(g2, t, .002, .35, .05, .01, .02, t + .06); osc('sine', f * 4, t, g2, { stop: t + .1 });
    },
  };
  function noise(t, dur, vol, dst, type = 'highpass', freq = 6000, q = 1) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain();
    s.connect(f); f.connect(g); g.connect(dst); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.start(t, Math.random() * .5); s.stop(t + dur + .05); return { s, f, g };
  }
  function thump(t, f0, f1, dur, v, dst) { const g = ac.createGain(); g.connect(dst); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); const o = osc('sine', f0, t, g, { stop: t + dur + .02 }); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
  function drum(ch, t, v, dst) {
    switch (ch) {
      case 'k': thump(t, 110, 45, .35, v * .8, dst); break; // bombo suave
      case 's': noise(t, .18, v * .35, dst, 'bandpass', 2400, .5); thump(t, 200, 160, .08, v * .15, dst); break; // caja con escobilla
      case 'h': noise(t, .05, v * .16, dst, 'highpass', 6500); break; // maraca
      case 't': noise(t, .1, v * .2, dst, 'highpass', 7500); noise(t + .015, .08, v * .12, dst, 'highpass', 9000); break; // pandereta
      case 'c': for (let k = 0; k < 3; k++) noise(t + k * .009, .07, v * .35, dst, 'bandpass', 1150 + k * 150, 1.1); break; // palmas
      case 'j': thump(t, 100, 58, .2, v * .7, dst); noise(t, .04, v * .2, dst, 'lowpass', 500); break; // cajón grave
      case 'x': noise(t, .09, v * .4, dst, 'bandpass', 1900, .9); thump(t, 240, 190, .05, v * .25, dst); break; // cajón agudo
      case 'b': thump(t, 95, 68, .3, v * .75, dst); noise(t, .05, v * .15, dst, 'lowpass', 700); break; // bodhrán
      case 'd': thump(t, 150, 120, .09, v * .35, dst); noise(t, .03, v * .12, dst, 'lowpass', 1500); break; // bodhrán suave
      case 'w': { const o = out(dst, .3); env(o.g, t, .002, v * .12, .5, .01, .05, t + .5); osc('sine', 1180, t, o.g, { stop: t + .6 }); osc('sine', 2950, t, o.g, { stop: t + .4 }); break; } // triángulo
      case 'r': { const o = out(dst, .15); env(o.g, t, .002, v * .3, .06, .01, .02, t + .06); osc('sine', 1250, t, o.g, { stop: t + .1 }); osc('sine', 830, t, o.g, { stop: t + .1 }); break; } // caja china
      case 'p': noise(t, .03, v * .35, dst, 'bandpass', 3200, 2); noise(t + .03, .03, v * .3, dst, 'bandpass', 3000, 2); break; // castañuelas
      case 'y': noise(t, 1.4, v * .14, dst, 'highpass', 5000); break; // platillo
      case 'm': thump(t, 75, 58, .7, v * .8, dst); noise(t, .1, v * .2, dst, 'lowpass', 400); break; // timbal
    }
  }
  /* ---------- composición: notación compacta ---------- */
  const CH = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], sus: [0, 5, 7], '6': [0, 4, 7, 9], add9: [0, 4, 7, 14] };
  function chord(name) { const m = /^([A-G])(#|b)?(.*)$/.exec(name); const r = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return { r, iv: CH[m[3]] || CH[''] }; }
  function mel(str) { const out = []; for (const tok of str.trim().split(/\s+/)) { const [n, l] = tok.split(':'); const len = +(l || 1); out.push(n === '.' ? null : { m: midi(n), len }); for (let i = 1; i < len; i++) out.push(undefined); } return out; }
  function track(o) {
    const steps = o.bar * o.chords.length, parts = [];
    for (const p of o.parts) {
      const seq = new Array(steps).fill(undefined);
      if (p.mel) { const m = mel(p.mel); for (let i = 0; i < steps; i++) seq[i] = m[i % m.length]; }
      else if (p.gen) { o.chords.forEach((cn, bi) => { const c = chord(cn); p.gen(c, bi, (i, n) => { if (i < o.bar) seq[bi * o.bar + i] = n; }, o.bar); }); }
      else if (p.drums) { const d = p.drums.replace(/\s|\|/g, ''); for (let i = 0; i < steps; i++) { const ch = d[i % d.length]; if (ch !== '.' && ch !== '-') seq[i] = { d: ch }; } }
      parts.push({ ...p, seq });
    }
    return { bpm: o.bpm, spb: o.spb, steps, parts, swing: o.swing || 0, loop: o.loop !== false };
  }
  const R = (c, oct, deg = 0) => { const iv = c.iv.slice(0, 3); const k = ((deg % 3) + 3) % 3, o = Math.floor(deg / 3); return 12 * (oct + 1) + c.r + iv[k] + 12 * o; };
  const tri = (c, oct) => [R(c, oct, 0), R(c, oct, 1), R(c, oct, 2)];
  // generadores de acompañamiento
  const G_ = {
    pad: (oct = 3) => (c, bi, put, bar) => put(0, { ms: tri(c, oct), len: bar }),
    arp: (oct = 4, pat = [0, 1, 2, 1], step = 2) => (c, bi, put, bar) => { for (let i = 0, k = 0; i < bar; i += step, k++) put(i, { m: R(c, oct, pat[k % pat.length]), len: step }); },
    strum: (oct = 3, at = [0, 4, 6, 10, 12, 14]) => (c, bi, put, bar) => { at.forEach((p, k) => { if (p < bar) put(p, { ms: [R(c, oct, 0), R(c, oct, 1), R(c, oct, 2), R(c, oct, 3)], len: 2, strum: k % 2 ? -1 : 1 }); }); },
    bass: (oct = 2, pat = [[0, 0, 4], [8, 2, 4]]) => (c, bi, put, bar) => { for (const [p, d, l] of pat) if (p < bar) put(p, { m: R(c, oct, d) - (d === 2 ? 12 : 0), len: l }); },
    walk: (oct = 2) => (c, bi, put, bar) => { const n = [0, 2, 1, 2]; for (let i = 0; i < bar; i += 4) put(i, { m: R(c, oct, n[(i / 4) % 4]) - (n[(i / 4) % 4] === 2 ? 12 : 0), len: 3 }); },
    stabs: (oct = 4, at = [4, 12]) => (c, bi, put, bar) => { for (const p of at) if (p < bar) put(p, { ms: tri(c, oct), len: 1 }); },
    drone: (ms) => (c, bi, put, bar) => put(0, { ms, len: bar }),
    ost: (oct = 3, pat = [0, 0, 1, 0, 2, 0, 1, 0]) => (c, bi, put, bar) => { for (let i = 0; i < bar; i++) put(i, { m: R(c, oct, pat[i % pat.length]), len: 1 }); },
    root: (oct = 1, at = [0, 8]) => (c, bi, put, bar) => { for (const p of at) if (p < bar) put(p, { m: R(c, oct, 0), len: 4 }); },
  };
  // canción con secciones (A, B…), redoble suave al final de cada sección y capa extra para las rachas
  function song(o) {
    const slots = {}; let off = 0;
    for (const L of o.form) {
      const S = o.sections[L];
      const t = track({ bpm: o.bpm, spb: o.spb, bar: o.bar, chords: S.chords, parts: Object.entries(S.parts).map(([k, p]) => ({ ...p, slot: k })) });
      for (const p of t.parts) {
        const seq = slots[p.slot] || (slots[p.slot] = []); while (seq.length < off) seq.push(undefined);
        p.seq.forEach((n, i) => seq.push(n ? (n.d ? { d: n.d, vol: p.vol } : { ...n, inst: n.inst || p.inst, vol: p.vol }) : n));
      }
      off += t.steps;
      for (const k in slots) while (slots[k].length < off) slots[k].push(undefined);
    }
    if (o.extra && slots[o.extra]) slots.extra = slots[o.extra].map(n => n && n.m ? { m: n.m + 12, len: n.len, inst: 'celesta', vol: .5 } : undefined);
    return { bpm: o.bpm, spb: o.spb, steps: off, swing: o.swing || 0, loop: o.loop !== false, parts: Object.entries(slots).map(([k, seq]) => ({ slot: k, seq, extra: k === 'extra' })) };
  }
  const TRACKS = {};
  /* Título: marcha del villano (orquesta de dibujos) */
  TRACKS.titulo = song({ bpm: 112, spb: 4, bar: 16, form: 'ABA', extra: 'mel', sections: {
    A: { chords: ['Dm', 'A#', 'Gm', 'A', 'Dm', 'A#', 'Gm', 'A7'], parts: {
      mel: { inst: 'horn', vol: 1, mel: 'D5:6 E5:2 F5:4 A5:4 G5:4 F5:2 D5:2 F5:8 A#4:4 D5:4 G5:6 F5:2 E5:8 C#5:4 A4:4 D5:6 E5:2 F5:4 A5:4 D6:6 C6:2 A#5:4 F5:4 G5:4 A#5:4 D6:4 C6:2 A#5:2 A5:6 G5:2 E5:4 C#5:4' },
      ost: { inst: 'pizz', vol: .7, gen: G_.arp(4, [0, 1, 2, 1], 2) }, pad: { inst: 'strings', vol: .5, gen: G_.pad(3) },
      bass: { inst: 'dbass', vol: .9, gen: G_.bass(2) }, tim: { inst: 'timp', vol: .6, gen: G_.root(1, [0]) },
      drums: { drums: 'k...s...k.k.s..s', vol: .45 } } },
    B: { chords: ['F', 'C', 'Dm', 'A#', 'F', 'C', 'A#', 'A7'], parts: {
      mel: { inst: 'flute', vol: 1, mel: 'C5:2 F5:2 A5:4 C6:6 A5:2 G5:4 E5:4 C5:8 D5:2 F5:2 A5:4 D6:6 C6:2 A#5:4 A5:4 F5:8 C5:2 F5:2 A5:4 C6:4 F6:4 E6:4 D6:4 C6:4 G5:4 A#5:4 D6:4 F6:4 D6:4 C#6:8 E6:4 A5:4' },
      ost: { inst: 'guitar', vol: .5, gen: G_.strum(3) }, pad: { inst: 'strings', vol: .45, gen: G_.pad(3) },
      bass: { inst: 'dbass', vol: .9, gen: G_.walk(2) }, drums: { drums: 'k.h.s.h.k.h.s.hs', vol: .45 } } } } });
  /* Intro: pizzicato sigiloso que se va poniendo tenso */
  TRACKS.intro = song({ bpm: 96, spb: 4, bar: 16, swing: .14, form: 'AAB', sections: {
    A: { chords: ['Am', 'Am', 'Dm', 'E7', 'Am', 'Am', 'F', 'E7'], parts: {
      mel: { inst: 'clarinet', vol: 1, mel: 'A4:1 .:1 C5:1 .:1 E5:2 .:2 D#5:1 .:1 E5:1 .:1 C5:2 .:2 A4:1 .:1 B4:1 .:1 C5:2 E5:2 A5:4 .:4 D5:1 .:1 F5:1 .:1 A5:2 .:2 G#5:1 .:1 A5:1 .:1 F5:2 .:2 E5:1 .:1 G#5:1 .:1 B5:2 D6:2 E6:4 .:4 A4:1 .:1 C5:1 .:1 E5:2 .:2 D#5:1 .:1 E5:1 .:1 C5:2 .:2 A4:1 .:1 C5:1 .:1 E5:2 A5:2 C6:4 .:4 C6:1 .:1 A5:1 .:1 F5:2 .:2 A5:1 .:1 C6:1 .:1 F6:2 .:2 E6:2 D6:2 B5:2 G#5:2 E5:4 .:4' },
      bass: { inst: 'pizz', vol: .9, gen: G_.walk(2) }, pad: { inst: 'strings', vol: .25, gen: G_.pad(3) },
      drums: { drums: 'k...r.r.k...r.rr', vol: .35 }, sh: { drums: '..h...h...h...h.', vol: .3 } } },
    B: { chords: ['F', 'F', 'E', 'E', 'Dm', 'Dm', 'E7', 'E7'], parts: {
      mel: { inst: 'strings', vol: 1, mel: 'A5:16 C6:16 B5:16 G#5:16 A5:8 F5:8 D5:8 F5:8 E5:16 G#5:8 B5:8' },
      bass: { inst: 'pizz', vol: .8, gen: G_.arp(3, [0, 1, 2, 1], 2) }, tim: { inst: 'timp', vol: .7, gen: G_.root(1, [0, 8]) },
      drums: { drums: 'h.h.h.h.h.h.h.hh', vol: .3 } } } } });
  /* Diario: acústica cálida (piano, guitarra y flauta) */
  TRACKS.mapa = song({ bpm: 100, spb: 4, bar: 16, swing: .1, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D'], parts: {
      mel: { inst: 'piano', vol: 1, mel: 'B4:2 D5:2 G5:4 F#5:2 G5:2 A5:4 F#5:4 D5:4 A4:8 G5:2 F#5:2 E5:4 B4:4 E5:4 E5:6 D5:2 C5:4 .:4 B4:2 D5:2 G5:4 A5:2 B5:2 D6:4 C6:4 B5:2 A5:2 F#5:8 E5:2 G5:2 C6:4 B5:4 A5:4 A5:8 F#5:4 D5:4' },
      ch: { inst: 'guitar', vol: .5, gen: G_.strum(3) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2) }, pad: { inst: 'strings', vol: .22, gen: G_.pad(3) },
      drums: { drums: 'k.h.h.h.s.h.h.hh', vol: .3 } } },
    B: { chords: ['C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'G'], parts: {
      mel: { inst: 'flute', vol: 1, mel: 'E5:4 G5:4 C6:6 B5:2 A5:4 F#5:4 D5:8 D5:2 F#5:2 B5:4 A5:2 B5:2 D6:4 B5:8 G5:4 E5:4 E5:4 G5:4 C6:4 E6:4 D6:4 C6:4 A5:4 F#5:4 G5:8 B5:4 D6:4 G6:8 .:8' },
      ch: { inst: 'piano', vol: .5, gen: G_.arp(4, [0, 1, 2, 1], 2) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2) },
      drums: { drums: 'k.h.h.h.s.h.h.hh', vol: .3 } } } } });
  /* Centro (la Meseta): paseo de aventura con violín y guitarra */
  TRACKS.centro = song({ bpm: 108, spb: 4, bar: 16, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['A', 'A', 'D', 'E', 'A', 'F#m', 'D', 'E'], parts: {
      mel: { inst: 'violin', vol: 1, mel: 'E5:4 A5:4 C#6:6 B5:2 A5:4 E5:4 C#5:8 D5:2 F#5:2 A5:4 D6:4 C#6:2 B5:2 B5:8 G#5:4 E5:4 C#6:4 B5:2 A5:2 E5:4 A5:4 F#5:4 A5:4 C#6:6 A5:2 B5:4 A5:2 F#5:2 D5:4 F#5:4 E5:8 G#5:4 B5:4' },
      ch: { inst: 'guitar', vol: .55, gen: G_.strum(3, [0, 3, 6, 8, 10, 14]) }, bass: { inst: 'pizz', vol: .9, gen: G_.walk(2) },
      drums: { drums: 'k...s...k.k.s...', vol: .35 }, sh: { drums: 'h.hhh.hhh.hhh.hh', vol: .22 } } },
    B: { chords: ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'A'], parts: {
      mel: { inst: 'piano', vol: 1, mel: 'F#5:2 A5:2 D6:4 C#6:4 A5:4 B5:4 G#5:4 E5:8 E5:2 G#5:2 C#6:4 B5:4 G#5:4 A5:8 F#5:4 C#5:4 D5:4 F#5:4 A5:4 D6:4 E6:4 D6:2 C#6:2 B5:4 G#5:4 A5:8 C#6:4 E6:4 A6:8 .:8' },
      ch: { inst: 'guitar', vol: .5, gen: G_.strum(3, [0, 3, 6, 8, 10, 14]) }, pad: { inst: 'strings', vol: .35, gen: G_.pad(3) }, bass: { inst: 'pizz', vol: .9, gen: G_.walk(2) },
      drums: { drums: 'k...s...k.k.s.ss', vol: .35 }, sh: { drums: 'h.hhh.hhh.hhh.hh', vol: .22 } } } } });
  /* Norte: giga celta en 6/8 (whistle, arpa, gaita y bodhrán) */
  TRACKS.norte = song({ bpm: 100, spb: 3, bar: 12, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['D', 'D', 'G', 'A', 'D', 'D', 'G', 'A'], parts: {
      mel: { inst: 'whistle', vol: 1, mel: 'F#5:1 A5:1 D6:1 A5:1 F#5:1 A5:1 D6:2 E6:1 F#6:2 E6:1 D6:1 C#6:1 B5:1 A5:1 F#5:1 A5:1 B5:2 A5:1 F#5:3 G5:1 B5:1 D6:1 B5:1 G5:1 B5:1 D6:2 E6:1 G6:2 F#6:1 E6:1 D6:1 C#6:1 A5:1 C#6:1 E6:1 A5:3 .:3 F#5:1 A5:1 D6:1 A5:1 F#5:1 A5:1 D6:2 E6:1 F#6:2 G6:1 A6:2 F#6:1 D6:2 A5:1 B5:1 A5:1 F#5:1 E5:3 D5:1 G5:1 B5:1 D6:2 B5:1 E6:2 D6:1 B5:2 G5:1 A5:1 B5:1 C#6:1 E6:2 C#6:1 D6:3 .:3' },
      arp: { inst: 'harp', vol: .5, gen: G_.arp(3, [0, 1, 2, 3, 2, 1], 1) }, dr: { inst: 'pipes', vol: .45, gen: G_.drone([50, 57]) },
      bass: { inst: 'dbass', vol: .7, gen: G_.bass(2, [[0, 0, 3], [6, 2, 3]]) }, drums: { drums: 'b.db.db.db.d', vol: .5 } } },
    B: { chords: ['Bm', 'Bm', 'G', 'D', 'Bm', 'A', 'G', 'A'], parts: {
      mel: { inst: 'whistle', vol: 1, mel: 'B5:2 A5:1 B5:1 D6:1 F#6:1 E6:2 D6:1 B5:3 F#5:1 B5:1 D6:1 F#6:2 D6:1 E6:1 D6:1 B5:1 A5:3 G5:1 B5:1 D6:1 G6:2 D6:1 E6:1 D6:1 B5:1 G5:3 F#5:1 A5:1 D6:1 F#6:3 E6:1 D6:1 C#6:1 D6:3 B5:2 A5:1 B5:1 D6:1 F#6:1 A6:2 F#6:1 D6:3 C#6:1 E6:1 A6:1 G6:1 F#6:1 E6:1 C#6:3 A5:3 B5:1 D6:1 G6:1 F#6:1 E6:1 D6:1 E6:2 D6:1 B5:3 A5:1 C#6:1 E6:1 G6:3 E6:3 C#6:3' },
      arp: { inst: 'harp', vol: .5, gen: G_.arp(3, [0, 1, 2, 3, 2, 1], 1) }, dr: { inst: 'pipes', vol: .4, gen: G_.drone([47, 54]) },
      bass: { inst: 'dbass', vol: .7, gen: G_.bass(2, [[0, 0, 3], [6, 2, 3]]) }, drums: { drums: 'b.db.db.ddbd', vol: .5 } } } } });
  /* Sur: rumba flamenca (guitarra, palmas y cajón) */
  TRACKS.sur = song({ bpm: 116, spb: 4, bar: 16, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E'], parts: {
      mel: { inst: 'guitar', vol: 1.1, mel: 'E5:2 F5:1 E5:1 D5:2 C5:2 B4:2 C5:2 A4:4 D5:2 E5:1 D5:1 C5:2 B4:2 A4:2 B4:2 G4:4 A4:2 C5:2 F5:4 E5:2 D5:2 C5:4 B4:2 C5:1 B4:1 G#4:2 F4:2 E4:8 A5:4 G#5:2 A5:2 C6:2 B5:2 A5:4 B5:2 A5:2 G5:4 F5:2 E5:2 D5:4 C5:2 D5:2 E5:2 F5:2 A5:4 G#5:4 F5:2 E5:2 D5:2 C5:2 B4:4 E5:4' },
      ch: { inst: 'guitar', vol: .5, gen: G_.strum(3, [0, 3, 6, 8, 10, 12, 14]) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2, [[0, 0, 3], [6, 0, 2], [8, 2, 3], [14, 0, 2]]) },
      palmas: { drums: '..c...c...c..cc.', vol: .4 }, cajon: { drums: 'j..x..j.j..x..x.', vol: .5 } } },
    B: { chords: ['Dm', 'Am', 'E', 'Am', 'Dm', 'Am', 'E7', 'E7'], parts: {
      mel: { inst: 'flute', vol: 1, mel: 'D5:2 F5:2 A5:4 G5:2 F5:2 E5:2 D5:2 E5:4 C5:4 A4:8 G#4:2 B4:2 E5:4 F5:2 E5:2 D5:4 C5:4 B4:2 A4:2 A4:8 F5:2 A5:2 D6:4 C6:2 A#5:2 A5:4 A5:4 G#5:2 A5:2 E5:8 G#5:2 A5:2 B5:4 D6:4 C6:2 B5:2 B5:8 G#5:4 E5:4' },
      ch: { inst: 'guitar', vol: .5, gen: G_.strum(3, [0, 3, 6, 8, 10, 12, 14]) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2, [[0, 0, 3], [6, 0, 2], [8, 2, 3], [14, 0, 2]]) },
      palmas: { drums: '..c...c...c..cc.', vol: .4 }, cajon: { drums: 'j..x..j.j..x.xx.', vol: .5 } } } } });
  /* Este: Mediterráneo (mandolina, guitarra y pandereta) */
  TRACKS.este = song({ bpm: 126, spb: 4, bar: 16, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'], parts: {
      mel: { inst: 'mando', vol: 1, mel: 'F#5:4 A5:4 D6:8 C#6:4 B5:4 A5:8 B5:4 D6:4 F#6:6 E6:2 D6:8 B5:8 A5:4 D6:4 F#6:4 E6:4 E6:4 C#6:4 A5:8 B5:4 D6:4 G6:4 F#6:4 E6:8 C#6:4 A5:4' },
      ch: { inst: 'guitar', vol: .45, gen: G_.arp(3, [0, 1, 2, 3, 2, 1, 2, 1], 2) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2) },
      drums: { drums: 'k.t...t.k.t...tp', vol: .4 } } },
    B: { chords: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D'], parts: {
      mel: { inst: 'accordion', vol: .9, mel: 'D6:2 C#6:2 B5:4 G5:8 C#6:2 B5:2 A5:4 E5:8 F#5:2 A5:2 C#6:4 A5:4 F#5:4 D6:8 B5:8 G5:2 B5:2 D6:4 G6:8 A6:4 G6:4 E6:4 C#6:4 D6:8 F#6:4 A6:4 D6:8 .:8' },
      ch: { inst: 'mando', vol: .35, gen: G_.stabs(4, [4, 12]) }, arp: { inst: 'guitar', vol: .4, gen: G_.arp(3, [0, 1, 2, 1], 2) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2) },
      drums: { drums: 'k.t...t.k.t.t.tp', vol: .4 } } } } });
  /* Mar: barcarola en 6/8 (oboe y arpa) */
  TRACKS.mar = song({ bpm: 64, spb: 3, bar: 12, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['F', 'C', 'Dm', 'A#', 'F', 'C', 'A#', 'C'], parts: {
      mel: { inst: 'oboe', vol: 1, mel: 'A5:3 G5:1 F5:2 C6:6 A#5:3 A5:1 G5:2 E5:6 F5:3 E5:1 D5:2 A5:6 A#5:3 A5:1 G5:2 F5:6 A5:3 C6:1 F6:2 E6:3 D6:3 C6:3 A#5:1 A5:2 G5:6 F5:3 G5:1 A5:2 D6:3 C6:3 C6:6 .:6' },
      arp: { inst: 'harp', vol: .55, gen: G_.arp(3, [0, 1, 2, 3, 2, 1], 1) }, pad: { inst: 'strings', vol: .3, gen: G_.pad(3) },
      bass: { inst: 'dbass', vol: .6, gen: G_.bass(2, [[0, 0, 6], [6, 2, 6]]) }, drums: { drums: 'h.....h..h..', vol: .18 } } },
    B: { chords: ['Dm', 'Dm', 'A#', 'F', 'Gm', 'C', 'F', 'F'], parts: {
      mel: { inst: 'flute', vol: 1, mel: 'D6:3 C6:1 A5:2 F5:6 E5:3 F5:1 G5:2 A5:6 A#5:3 A5:1 G5:2 D6:6 C6:3 A5:1 F5:2 A5:6 G5:3 A5:1 A#5:2 D6:6 E6:3 D6:1 C6:2 G5:6 A5:3 C6:1 F6:2 E6:3 C6:3 F6:6 .:6' },
      arp: { inst: 'harp', vol: .55, gen: G_.arp(3, [0, 1, 2, 3, 2, 1], 1) }, pad: { inst: 'strings', vol: .3, gen: G_.pad(3) },
      bass: { inst: 'dbass', vol: .6, gen: G_.bass(2, [[0, 0, 6], [6, 2, 6]]) }, drums: { drums: 'h.....h..h..', vol: .18 } } } } });
  /* Canarias: isa en 3/4 con timple y marimba */
  TRACKS.canarias = song({ bpm: 150, spb: 2, bar: 12, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['G', 'D', 'D', 'G', 'G', 'C', 'D', 'G'], parts: {
      mel: { inst: 'marimba', vol: 1, mel: 'B5:2 D6:2 G6:2 F#6:2 E6:2 D6:2 A5:4 F#5:2 A5:6 C6:2 B5:2 A5:2 F#5:2 D5:4 G5:6 B5:6 D6:2 B5:2 G5:2 B5:2 D6:2 G6:2 E6:4 C6:2 G5:6 F#5:2 A5:2 D6:2 C6:2 A5:2 F#5:2 G5:6 .:6' },
      ch: { inst: 'timple', vol: .6, gen: G_.strum(4, [0, 2, 3, 4, 5, 6, 8, 9, 10, 11]) }, bass: { inst: 'dbass', vol: .75, gen: G_.bass(2, [[0, 0, 4], [6, 2, 4]]) },
      drums: { drums: 'k.hhh.k.hhh.', vol: .3 } } },
    B: { chords: ['C', 'G', 'D', 'G', 'C', 'G', 'D', 'D'], parts: {
      mel: { inst: 'marimba', vol: 1, mel: 'E6:2 G6:2 E6:2 C6:6 D6:2 B5:2 G5:2 B5:6 A5:2 C6:2 F#6:2 E6:2 D6:4 B5:6 G5:6 C6:2 E6:2 G6:6 E6:2 D6:4 B5:2 G5:6 A5:2 B5:2 C6:2 D6:2 E6:2 F#6:2 A6:6 .:6' },
      ch: { inst: 'timple', vol: .6, gen: G_.strum(4, [0, 2, 3, 4, 5, 6, 8, 9, 10, 11]) }, bass: { inst: 'dbass', vol: .75, gen: G_.bass(2, [[0, 0, 4], [6, 2, 4]]) },
      drums: { drums: 'k.hhh.k.hht.', vol: .3 } } } } });
  /* Europa: vals en globo (acordeón y cuerdas) */
  const waltzG = (oct = 3) => (c, bi, put, bar) => { for (let b = 0; b < bar; b += 6) { put(b, { m: R(c, oct - 1, b ? 2 : 0) - (b ? 12 : 0), len: 2, inst: 'dbass' }); put(b + 2, { ms: tri(c, oct + 1), len: 1, inst: 'pizz' }); put(b + 4, { ms: tri(c, oct + 1), len: 1, inst: 'pizz' }); } };
  TRACKS.europa = song({ bpm: 168, spb: 2, bar: 12, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C'], parts: {
      mel: { inst: 'accordion', vol: .95, mel: 'G5:4 C6:2 E6:6 E6:4 D6:2 C6:6 B5:4 D6:2 G6:6 F6:4 E6:2 D6:6 D6:4 F6:2 A6:6 G6:4 F6:2 D6:4 B5:2 C6:4 E6:2 G6:6 C6:6 .:6' },
      acc: { vol: .7, gen: waltzG(3) }, drums: { drums: 'k...w.k...w.', vol: .3 } } },
    B: { chords: ['F', 'F', 'C', 'C', 'G7', 'G7', 'C', 'C'], parts: {
      mel: { inst: 'strings', vol: 1.2, mel: 'A5:4 C6:2 F6:6 F6:4 C6:2 A5:6 G5:4 C6:2 E6:6 E6:4 D6:2 C6:6 B5:4 D6:2 F6:6 F6:4 E6:2 D6:6 E6:4 G6:2 C7:6 C6:6 .:6' },
      acc: { vol: .7, gen: waltzG(3) }, pad: { inst: 'accordion', vol: .25, gen: G_.pad(4) }, drums: { drums: 'k...w.k...w.', vol: .3 } } } } });
  /* Jefe final: cuerdas frenéticas, trompas, coro y timbales */
  TRACKS.jefe = song({ bpm: 150, spb: 4, bar: 16, form: 'AB', extra: 'mel', sections: {
    A: { chords: ['Dm', 'Dm', 'A#', 'A#', 'Gm', 'Gm', 'A', 'A'], parts: {
      mel: { inst: 'horn', vol: 1.2, mel: 'D5:8 F5:4 E5:4 D5:4 A4:4 D5:8 F5:8 A#5:4 A5:4 F5:12 .:4 G5:8 A#5:4 D6:4 C6:4 A#5:4 G5:8 A5:8 C#6:4 E6:4 E6:8 C#6:4 A5:4' },
      ost: { inst: 'spic', vol: .8, gen: G_.ost(3) }, ch: { inst: 'choir', vol: .5, gen: G_.pad(3) },
      tim: { inst: 'timp', vol: .8, gen: G_.root(1, [0, 8]) }, bass: { inst: 'bass', vol: .7, gen: G_.root(1, [0, 4, 8, 12]) },
      drums: { drums: 'k...s...k.k.s...k...s...k.k.s.ss', vol: .45 } } },
    B: { chords: ['Gm', 'Dm', 'A#', 'A', 'Gm', 'Dm', 'E', 'A'], parts: {
      mel: { inst: 'brass', vol: 1.1, mel: 'G5:4 A#5:4 D6:8 F6:4 E6:4 D6:8 D6:4 F6:4 A#6:8 A6:8 E6:8 G6:4 F6:4 D6:4 A#5:4 A5:8 D6:8 G#5:4 B5:4 E6:8 C#6:8 A5:8' },
      ost: { inst: 'spic', vol: .8, gen: G_.ost(3, [0, 1, 2, 1, 0, 1, 2, 1]) }, ch: { inst: 'choir', vol: .55, gen: G_.pad(3) },
      tim: { inst: 'timp', vol: .8, gen: G_.root(1, [0, 4, 8, 12]) }, bass: { inst: 'bass', vol: .7, gen: G_.root(1, [0, 8]) },
      drums: { drums: 'y...s...k.k.s...k...s...k.k.s.ss', vol: .45 } } } } });
  /* Globos del diccionario: juguetona (celesta, pizzicato y clarinete) */
  TRACKS.globos = song({ bpm: 132, spb: 4, bar: 16, swing: .12, form: 'ABAB', extra: 'mel', sections: {
    A: { chords: ['F', 'Dm', 'Gm', 'C7', 'F', 'Dm', 'Gm', 'C7'], parts: {
      mel: { inst: 'celesta', vol: 1.1, mel: 'C6:2 A5:2 F5:2 A5:2 C6:4 F6:4 D6:2 C6:2 A5:4 F5:8 A#5:2 D6:2 G6:4 F6:2 D6:2 A#5:4 A5:4 G5:4 E5:4 C5:4 F5:2 A5:2 C6:2 F6:2 E6:4 C6:4 D6:4 F6:4 A6:8 G6:2 F6:2 D6:2 A#5:2 G5:4 A#5:4 C6:8 E5:4 G5:4' },
      bass: { inst: 'pizz', vol: .9, gen: G_.bass(2) }, st: { inst: 'pizz', vol: .5, gen: G_.stabs(4, [4, 12]) }, drums: { drums: 'k...r...k.k.r...', vol: .35 } } },
    B: { chords: ['A#', 'C', 'Am', 'Dm', 'Gm', 'C7', 'F', 'F'], parts: {
      mel: { inst: 'clarinet', vol: 1.1, mel: 'D5:2 F5:2 A#5:4 A5:4 G5:4 E5:2 G5:2 C6:4 A#5:4 G5:4 A5:4 C6:4 E6:4 C6:4 D6:8 A5:8 G5:2 A#5:2 D6:4 C6:2 A#5:2 A5:4 G5:4 E5:4 C5:8 F5:4 A5:4 C6:8 F6:8 .:8' },
      bass: { inst: 'pizz', vol: .9, gen: G_.walk(2) }, st: { inst: 'celesta', vol: .35, gen: G_.arp(5, [0, 1, 2, 1], 4) }, drums: { drums: 'k...r...k.k.r.rr', vol: .35 } } } } });
  TRACKS.victoria = track({ bpm: 120, spb: 4, bar: 16, chords: ['C', 'F', 'G', 'C'], loop: false, parts: [
    { inst: 'brass', vol: .95, mel: 'C5:2 E5:2 G5:2 C6:6 .:4 A5:2 C6:2 F6:8 .:4 B5:2 D6:2 G6:4 F6:2 D6:2 B5:4 C6:16' },
    { inst: 'celesta', vol: .5, mel: 'C6:2 E6:2 G6:2 C7:6 .:4 A6:2 C7:2 F7:8 .:4 B6:2 D7:2 G7:4 F7:2 D7:2 B6:4 C7:16' },
    { inst: 'strings', vol: .6, gen: G_.pad(3) }, { inst: 'dbass', vol: .9, gen: G_.bass(2) },
    { drums: 'm...............m...............m.......m.m.mmmmy...............', vol: .45 }] });
  TRACKS.fin = song({ bpm: 96, spb: 4, bar: 16, swing: .08, form: 'A', sections: {
    A: { chords: ['F', 'C', 'Dm', 'A#', 'F', 'C', 'A#', 'C'], parts: {
      mel: { inst: 'piano', vol: 1.1, mel: 'A5:4 C6:4 F6:6 E6:2 E6:4 D6:4 C6:8 D6:4 F6:4 A6:6 G6:2 F6:8 D6:8 C6:4 F6:4 A6:4 G6:4 G6:4 E6:4 C6:8 D6:4 F6:4 A#6:4 A6:4 G6:8 E6:8' },
      ch: { inst: 'guitar', vol: .45, gen: G_.strum(3) }, pad: { inst: 'strings', vol: .4, gen: G_.pad(3) }, bass: { inst: 'dbass', vol: .8, gen: G_.bass(2) },
      drums: { drums: 'k.h.s.h.k.hks.h.', vol: .3 } } } } });
  TRACKS.titulo2 = TRACKS.titulo;
  /* ---------- reproductor ---------- */
  let cur = null, pending = null;
  function play(name, opt = {}) {
    if (!ac) { pending = { name, opt }; return; }
    if (cur && cur.name === name && !opt.restart) { volume(opt.vol ?? 1); return; }
    const fade = opt.fade || .25; stop(fade);
    const tr = TRACKS[name]; if (!tr) return;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(opt.vol ?? 1, ac.currentTime + Math.max(.2, fade * .8)); g.connect(musicBus);
    cur = { name, tr, g, step: 0, next: ac.currentTime + .08, onEnd: opt.onEnd, rate: opt.rate || 1 };
  }
  function stop(fade = .2) { if (!cur) return; const g = cur.g; try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0.0001, ac.currentTime, fade / 3); } catch (e) { } setTimeout(() => { try { g.disconnect(); } catch (e) { } }, fade * 1000 + 600); cur = null; }
  function volume(v) { if (cur) cur.g.gain.setTargetAtTime(v, ac.currentTime, .15); }
  function tempo(r) { if (cur) cur.rate = r; }
  function tick() {
    if (!cur || !ac) return;
    const tr = cur.tr, stepDur = 60 / (tr.bpm * cur.rate) / tr.spb;
    while (cur && cur.next < ac.currentTime + .15) {
      const i = cur.step % tr.steps, t = cur.next + (i % 2 ? tr.swing * stepDur : 0);
      for (const p of tr.parts) {
        if (p.extra && !st.extra) continue;
        const n = p.seq[i]; if (!n) continue;
        if (n.d) { drum(n.d, t, n.vol || p.vol || .5, cur.g); continue; }
        const inst = INST[n.inst || p.inst]; const dur = n.len * stepDur; const v = n.vol || p.vol || .8;
        if (n.ms) { const L = n.ms.length; n.ms.forEach((m, k) => inst(m, t + (n.strum ? (n.strum < 0 ? L - 1 - k : k) * .014 : 0), dur, v * .55, cur.g)); }
        else inst(n.m, t, dur, v, cur.g);
      }
      cur.step++; cur.next += stepDur;
      if (cur.step >= tr.steps && !tr.loop) { const cb = cur.onEnd; const c0 = cur; setTimeout(() => { if (cur === c0) { cur = null; cb && cb(); } }, 900); cur.step = 1e9; break; }
    }
  }
  /* ---------- efectos ---------- */
  const T = () => ac.currentTime;
  function sweep(type, f0, f1, dur, vol, t = T(), dst = sfxBus, curve = 'exp') { const g = ac.createGain(); g.connect(dst); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); const o = osc(type, f0, t, g, { stop: t + dur + .02 }); if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(f1, t + dur); else o.frequency.linearRampToValueAtTime(f1, t + dur); return o; }
  function tone(type, f, t, dur, vol, dst = sfxBus) { const g = ac.createGain(); g.connect(dst); g.connect(verbSend); env(g, t, .005, vol, dur * .6, .3, .05, t + dur); osc(type, f, t, g, { stop: t + dur + .1 }); }
  const fx = {
    tap() { sweep('sine', 520, 880, .06, .25); },
    ok() { const t = T(); [72, 76, 79, 84].forEach((m, i) => { tone('triangle', hz(m), t + i * .055, .18, .22); tone('sine', hz(m + 12), t + i * .055, .12, .08); }); },
    bad() { const t = T(); const g = ac.createGain(); g.connect(sfxBus); g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .45); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(g); const o = osc('sawtooth', 220, t, f, { stop: t + .5 }); o.frequency.linearRampToValueAtTime(110, t + .4); const o2 = osc('square', 110, t, f, { stop: t + .5 }); o2.frequency.linearRampToValueAtTime(70, t + .4); },
    boing() { const t = T(); const g = ac.createGain(); g.connect(sfxBus); g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .5); const o = osc('triangle', 180, t, g, { stop: t + .5 }); const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 18; lg.gain.value = 60; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + .5); o.frequency.exponentialRampToValueAtTime(420, t + .4); },
    pop() { const t = T(); noise(t, .08, .6, sfxBus, 'bandpass', 2500, .8); sweep('sine', 900, 200, .07, .3, t); },
    whoosh() { const t = T(); const n = noise(t, .35, .35, sfxBus, 'bandpass', 600, 2); n.f.frequency.exponentialRampToValueAtTime(3000, t + .3); },
    splash() { const t = T(); noise(t, .45, .45, sfxBus, 'lowpass', 2200); for (let i = 0; i < 5; i++) sweep('sine', rnd(600, 1400), rnd(1800, 2600), .06, .12, t + .05 + i * .04); },
    plop() { sweep('sine', 300, 1200, .12, .4); },
    star(i = 0) { const t = T(); [84, 88, 91].forEach((m, k) => tone('sine', hz(m + i * 2), t + k * .05, .3, .18)); },
    sparkle() { const t = T(); for (let i = 0; i < 6; i++) tone('sine', hz(90 + irnd(0, 8)), t + i * .045, .2, .08); },
    stomp() { const t = T(); sweep('sine', 120, 35, .4, .8, t); noise(t, .3, .4, sfxBus, 'lowpass', 400); },
    rumble() { const t = T(); const n = noise(t, .9, .5, sfxBus, 'lowpass', 180); sweep('sawtooth', 50, 70, .8, .12, t); },
    rise() { sweep('square', 200, 800, .35, .1); sweep('sine', 300, 1200, .35, .15); },
    lava() { const t = T(); noise(t, .6, .4, sfxBus, 'bandpass', 900, 1); sweep('sawtooth', 90, 40, .5, .2, t); },
    horn() { const t = T(); for (const [f, d] of [[233, 0], [185, .22]]) { const g = ac.createGain(); g.connect(sfxBus); env(g, t + d, .02, .18, .05, .8, .05, t + d + .18); osc('square', f, t + d, g, { stop: t + d + .3 }); osc('square', f * 1.26, t + d, g, { stop: t + d + .3 }); } },
    bling() { const t = T(); tone('sine', hz(96), t, .6, .15); tone('sine', hz(103), t + .08, .6, .12); },
    slideUp() { sweep('sine', 400, 1600, .45, .22, T(), sfxBus, 'lin'); },
    slideDown() { sweep('sine', 1500, 300, .5, .22, T(), sfxBus, 'lin'); },
    laugh() { const t = T(); for (let i = 0; i < 5; i++) { const f = 190 - i * 10; const g = ac.createGain(); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2; g.connect(bp); bp.connect(voiceBus); env(g, t + i * .13, .01, .5, .05, .6, .04, t + i * .13 + .09); const o = osc('sawtooth', f * 1.3, t + i * .13, g, { stop: t + i * .13 + .2 }); o.frequency.exponentialRampToValueAtTime(f, t + i * .13 + .09); } },
    tick() { drum('w', T(), .3, sfxBus); },
    drumroll() { const t = T(); for (let i = 0; i < 24; i++) drum('s', t + i * .045, .15 + i * .015, sfxBus); drum('k', t + 24 * .045, .8, sfxBus); drum('c', t + 24 * .045, .8, sfxBus); },
    sad() { const t = T(); [71, 70, 69, 68].forEach((m, i) => { const d = i === 3 ? 1.1 : .4; const g = ac.createGain(); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; g.connect(f); f.connect(sfxBus); env(g, t + i * .45, .03, .25, .1, .8, .1, t + i * .45 + d); const o = osc('sawtooth', hz(m - 12), t + i * .45, g, { stop: t + i * .45 + d + .2 }); if (i === 3) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 6; lg.gain.value = 5; l.connect(lg); lg.connect(o.frequency); l.start(t + i * .45); l.stop(t + i * .45 + d + .2); } }); },
    fanfare() { const t = T(); [60, 64, 67, 72].forEach((m, i) => INST.brass(m, t + i * .09, i === 3 ? .6 : .12, .9, sfxBus)); },
    key() { drum('w', T(), .2, sfxBus); },
    zap() { sweep('sawtooth', 1200, 100, .25, .12); },
    count() { tone('square', 660, T(), .08, .08); },
    go() { tone('square', 990, T(), .25, .1); },
    cheer() { const t = T(); for (let i = 0; i < 3; i++) { const n = noise(t + i * .05, 1.2, .12, sfxBus, 'bandpass', 1200 + i * 500, .6); } [72, 76, 79].forEach((m, i) => tone('triangle', hz(m), t + .05 * i, .5, .12)); },
    thud() { sweep('sine', 160, 60, .18, .5); },
    buzz() { sweep('square', 140, 120, .3, .12); },
  };
  function sfx(name, ...a) { if (!ac || !st.sfx) return; try { fx[name] && fx[name](...a); } catch (e) { } }
  /* ---------- voces de los personajes (murmullo) ---------- */
  const VOICE = { alvaro: [150, 'kazoo'], teide: [120, 'tri'], rodolfo: [85, 'horn'], rosa: [340, 'tri'], narrador: [400, 'sine'], kids: [300, 'sine'] };
  function voice(who) {
    if (!ac || !st.sfx) return; const [f0, kind] = VOICE[who] || VOICE.narrador; const t = T(); const f = f0 * (0.9 + Math.random() * .35);
    const g = ac.createGain(); g.connect(voiceBus);
    if (kind === 'kazoo') { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1000 + Math.random() * 500; bp.Q.value = 3; g.disconnect(); g.connect(bp); bp.connect(voiceBus); env(g, t, .01, .55, .03, .7, .03, t + .06); const o = osc('sawtooth', f, t, g, { stop: t + .12 }); o.frequency.linearRampToValueAtTime(f * 1.1, t + .07); }
    else if (kind === 'tri') { env(g, t, .01, .45, .03, .6, .03, t + .07); osc('triangle', f * 2, t, g, { stop: t + .12 }); osc('sine', f, t, g, { stop: t + .12 }); }
    else if (kind === 'horn') { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; g.disconnect(); g.connect(lp); lp.connect(voiceBus); env(g, t, .01, .4, .03, .7, .03, t + .07); osc('square', f, t, g, { stop: t + .12 }); osc('square', f * 1.5, t, g, { stop: t + .12 }); }
    else { env(g, t, .005, .18, .02, .5, .02, t + .04); osc('sine', f, t, g, { stop: t + .08 }); }
  }
  /* ---------- lectura en voz alta (si la tablet tiene voz en español) ---------- */
  let esVoice = null;
  function pickVoice() { if (!('speechSynthesis' in window)) return; const vs = speechSynthesis.getVoices(); esVoice = vs.find(v => /^es(-|_)ES/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null; }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function canSpeak() { return 'speechSynthesis' in window && !!esVoice; }
  function say(text, o = {}) {
    if (!canSpeak()) return false;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = esVoice; u.lang = esVoice.lang; u.rate = o.rate || .95; u.pitch = o.pitch || 1; if (cur) volume(.35); u.onend = () => volume(1); speechSynthesis.speak(u); return true; } catch (e) { return false; }
  }
  function shutUp() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { } }
  function extra(v) { st.extra = !!v; }
  function _tap() { return ac && { ac, master }; }
  return { init, play, stop, volume, tempo, extra, _tap, _inst: () => INST, sfx, voice, say, shutUp, canSpeak, setMusic, setSfx, suspend, resume, st, get playing() { return cur && cur.name; } };
})();
