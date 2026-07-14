/*
 * HEGEMON procedural audio — everything is SYNTHESIZED with the Web Audio API,
 * so there are no audio files to ship and nothing is copyrighted. It provides:
 *   - a gentle, slowly-evolving ancient/modal music bed,
 *   - continuous weather ambience (rain, storm rumble + thunder),
 *   - environment ambience (forest wind + birdsong),
 *   - one-shot SFX (marching thump, combat clang, build thunk, UI blips).
 *
 * Browsers block audio until a user gesture, so nothing sounds until init() is
 * called from a click/keypress. Exposed as window.HGAudio for game.js to drive.
 */
(function () {
  "use strict";

  var AC = null, master = null, musicBus = null, ambBus = null, sfxBus = null;
  var rainGain = null, forestGain = null, thunderTimer = null, birdTimer = null;
  var noiseBuf = null, muted = false, musicOn = true, started = false;
  var musicTimer = null, step = 0;

  function makeNoise() {
    var len = Math.floor(AC.sampleRate * 2);
    var buf = AC.createBuffer(1, len, AC.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Lazily build the graph the first time we're allowed to make noise.
  function ensure() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return true; }
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      AC = new Ctx();
      noiseBuf = makeNoise();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(AC.destination);
      musicBus = AC.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
      ambBus = AC.createGain(); ambBus.gain.value = 0.9; ambBus.connect(master);
      sfxBus = AC.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);

      // Persistent rain chain (filtered noise), gain 0 until it's raining.
      rainGain = AC.createGain(); rainGain.gain.value = 0; rainGain.connect(ambBus);
      var rn = AC.createBufferSource(); rn.buffer = noiseBuf; rn.loop = true;
      var rbp = AC.createBiquadFilter(); rbp.type = "bandpass"; rbp.frequency.value = 1400; rbp.Q.value = 0.5;
      var rhp = AC.createBiquadFilter(); rhp.type = "highpass"; rhp.frequency.value = 500;
      rn.connect(rbp); rbp.connect(rhp); rhp.connect(rainGain); rn.start();

      // Persistent forest wind chain, gain 0 until we're in forest ambience.
      forestGain = AC.createGain(); forestGain.gain.value = 0; forestGain.connect(ambBus);
      var wn = AC.createBufferSource(); wn.buffer = noiseBuf; wn.loop = true;
      var wlp = AC.createBiquadFilter(); wlp.type = "lowpass"; wlp.frequency.value = 480;
      var wlfo = AC.createOscillator(); wlfo.frequency.value = 0.12;
      var wlfoG = AC.createGain(); wlfoG.gain.value = 160;
      wlfo.connect(wlfoG); wlfoG.connect(wlp.frequency); wlfo.start();
      wn.connect(wlp); wlp.connect(forestGain); wn.start();
      return true;
    } catch (e) { return false; }
  }

  function t() { return AC.currentTime; }

  // ---- One-shot voices ------------------------------------------------------
  function tone(type, freq, dur, peak, dest, attack) {
    var o = AC.createOscillator(); o.type = type; o.frequency.value = freq;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(peak, n + (attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(g); g.connect(dest || sfxBus); o.start(n); o.stop(n + dur + 0.02);
    return o;
  }
  function noiseBurst(dur, peak, filterType, freq, dest) {
    var s = AC.createBufferSource(); s.buffer = noiseBuf;
    var f = AC.createBiquadFilter(); f.type = filterType || "bandpass"; f.frequency.value = freq || 1200; f.Q.value = 0.8;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(peak, n);
    g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus); s.start(n); s.stop(n + dur + 0.02);
  }

  var SFX = {
    // A soft double footfall — the "thump" of a marching column.
    march: function () { tone("sine", 96, 0.16, 0.5, sfxBus); noiseBurst(0.12, 0.12, "lowpass", 220);
      setTimeout(function () { if (AC) { tone("sine", 84, 0.16, 0.4, sfxBus); noiseBurst(0.1, 0.1, "lowpass", 200); } }, 130); },
    // Metallic clash — noise + two detuned rings.
    clash: function () { noiseBurst(0.18, 0.5, "highpass", 2600); tone("square", 520, 0.22, 0.16, sfxBus); tone("triangle", 660, 0.26, 0.14, sfxBus);
      setTimeout(function () { if (AC) tone("square", 300, 0.2, 0.12, sfxBus); }, 60); },
    // Heavy thump for impacts / conquest.
    thump: function () { tone("sine", 70, 0.4, 0.7, sfxBus, 0.004); noiseBurst(0.16, 0.2, "lowpass", 160); },
    // Wood/stone build "thunk".
    build: function () { tone("sine", 150, 0.18, 0.4, sfxBus); noiseBurst(0.14, 0.18, "bandpass", 700); },
    select: function () { tone("triangle", 620, 0.09, 0.22, sfxBus); },
    click: function () { tone("square", 880, 0.05, 0.12, sfxBus); },
    // Rising two-note chime for a discovery.
    research: function () { tone("triangle", 523, 0.25, 0.2, sfxBus); setTimeout(function () { if (AC) tone("triangle", 784, 0.35, 0.2, sfxBus); }, 130); },
    coin: function () { tone("square", 988, 0.08, 0.14, sfxBus); setTimeout(function () { if (AC) tone("square", 1319, 0.1, 0.12, sfxBus); }, 70); }
  };

  // ---- Music bed: themed, EVOLVING ancient score ----------------------------
  // Each civ gets its own modal colour; within a theme the score rotates its
  // motif density, chord and drum so it "switches up" over time instead of
  // looping. Everything is synthesized (no files, nothing copyrighted).
  // Frequencies in Hz. drone = a low sustained root (cornu/lyre bass).
  var THEMES = {
    // Neutral — the original calm D-Dorian lyre bed (kept as the baseline that
    // plays before you've met anyone, and rotates in alongside civ themes).
    neutral: { bar: 8.2, padType: "triangle", cut: 900, pluck: "triangle", drone: 0, drum: false,
      chords: [[146.83, 174.61, 220.00], [130.81, 164.81, 196.00], [174.61, 220.00, 261.63], [196.00, 246.94, 293.66]],
      scale: [293.66, 329.63, 392.00, 440.00, 493.88, 587.33] },
    // Rome — grave and martial: a dark Phrygian set over a low cornu drone, a
    // reedy tibia pad, a lyre motif and a soft frame-drum tread.
    rome: { bar: 8.6, padType: "sawtooth", cut: 760, pluck: "triangle", drone: 65.41, drum: true,
      chords: [[130.81, 155.56, 196.00], [146.83, 174.61, 220.00], [116.54, 146.83, 174.61], [130.81, 164.81, 196.00]],
      scale: [146.83, 155.56, 174.61, 196.00, 220.00, 233.08, 293.66] },
    // Greece — brighter Dorian, lyre-forward, no drum.
    greece: { bar: 7.8, padType: "triangle", cut: 960, pluck: "triangle", drone: 73.42, drum: false,
      chords: [[146.83, 174.61, 220.00], [164.81, 196.00, 246.94], [130.81, 164.81, 196.00], [196.00, 246.94, 293.66]],
      scale: [146.83, 164.81, 196.00, 220.00, 246.94, 293.66, 329.63] },
    // Egypt — exotic Phrygian-dominant (double harmonic), oud-like plucks.
    egypt: { bar: 8.0, padType: "sawtooth", cut: 820, pluck: "sawtooth", drone: 69.30, drum: true,
      chords: [[138.59, 174.61, 207.65], [146.83, 185.00, 220.00], [123.47, 155.56, 185.00], [138.59, 164.81, 207.65]],
      scale: [138.59, 146.83, 185.00, 196.00, 207.65, 246.94, 277.18] },
    // Carthage — Punic, minor and mysterious.
    carthage: { bar: 8.2, padType: "sawtooth", cut: 800, pluck: "triangle", drone: 61.74, drum: true,
      chords: [[123.47, 146.83, 185.00], [110.00, 138.59, 164.81], [130.81, 155.56, 196.00], [123.47, 155.56, 185.00]],
      scale: [123.47, 138.59, 146.83, 164.81, 185.00, 207.65, 246.94] },
    // Gaul — open fifths, bardic and airy.
    gaul: { bar: 7.4, padType: "triangle", cut: 1020, pluck: "triangle", drone: 73.42, drum: false,
      chords: [[146.83, 220.00, 293.66], [164.81, 246.94, 329.63], [130.81, 196.00, 261.63], [196.00, 293.66, 392.00]],
      scale: [146.83, 164.81, 196.00, 220.00, 246.94, 293.66, 329.63] },
    // Parthia — modal East, drone-heavy.
    parthia: { bar: 8.4, padType: "sawtooth", cut: 760, pluck: "sawtooth", drone: 65.41, drum: true,
      chords: [[130.81, 155.56, 196.00], [138.59, 174.61, 207.65], [116.54, 146.83, 174.61], [130.81, 164.81, 196.00]],
      scale: [130.81, 138.59, 155.56, 174.61, 196.00, 207.65, 233.08] }
  };
  // The score rotates through a POOL of themes: it starts with the neutral bed,
  // gains your own civ's theme, and grows as you MEET other civs — so the music
  // reflects who is in your world. Each theme holds the stage for a while, then
  // hands off to the next.
  var pool = ["neutral"], poolIdx = 0, curTheme = THEMES.neutral, motif = 0, barsInTheme = 0, ownCiv = null;
  var ROTATE_BARS = 14;
  function ensureInPool(k) { if (THEMES[k] && pool.indexOf(k) < 0) { pool.push(k); return true; } return false; }
  function switchTo(k) { if (!THEMES[k]) return; poolIdx = pool.indexOf(k); if (poolIdx < 0) { pool.push(k); poolIdx = pool.length - 1; } curTheme = THEMES[k]; barsInTheme = 0; motif = 0; }

  function padChord(freqs, dur, th) {
    var lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = th.cut; lp.Q.value = 0.3;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.linearRampToValueAtTime(0.42, n + 1.4);
    g.gain.setValueAtTime(0.42, n + dur - 1.6);
    g.gain.linearRampToValueAtTime(0.0001, n + dur);
    lp.connect(g); g.connect(musicBus);
    for (var i = 0; i < freqs.length; i++) {
      var o = AC.createOscillator(); o.type = i === 0 ? "sine" : th.padType;
      o.frequency.value = freqs[i]; o.detune.value = (i - 1) * 4;
      o.connect(lp); o.start(n); o.stop(n + dur + 0.05);
    }
  }
  // A low sustained drone — the cornu/lyre bass that anchors the mode.
  function droneVoice(freq, dur) {
    var lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.linearRampToValueAtTime(0.3, n + 2.0);
    g.gain.setValueAtTime(0.3, n + dur - 2.0);
    g.gain.linearRampToValueAtTime(0.0001, n + dur);
    var o = AC.createOscillator(); o.type = "sine"; o.frequency.value = freq;
    var o2 = AC.createOscillator(); o2.type = "triangle"; o2.frequency.value = freq * 2; o2.detune.value = 3;
    var g2 = AC.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(lp);
    o.connect(lp); lp.connect(g); g.connect(musicBus);
    o.start(n); o.stop(n + dur + 0.05); o2.start(n); o2.stop(n + dur + 0.05);
  }
  function pluck(freq, th) {
    var o = AC.createOscillator(); o.type = th.pluck; o.frequency.value = freq;
    var lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.15, n + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 1.1);
    o.connect(lp); lp.connect(g); g.connect(musicBus); o.start(n); o.stop(n + 1.2);
  }
  // A soft frame-drum tread for the martial themes.
  function drumHit() {
    tone("sine", 82, 0.22, 0.32, musicBus, 0.004);
    noiseBurst(0.12, 0.09, "lowpass", 200, musicBus);
  }
  function musicTick() {
    if (!AC || !musicOn) return;
    var th = curTheme, bar = th.bar;
    var chord = th.chords[step % th.chords.length];
    padChord(chord, bar + 0.2, th);
    if (th.drone) droneVoice(th.drone, bar + 0.2);
    // Motif density rotates every cycle so the phrase keeps evolving.
    var density = 2 + (motif % 3);
    if (Math.random() < 0.85) {
      for (var i = 0; i < density; i++) {
        (function (delay) {
          setTimeout(function () { if (AC && musicOn) pluck(th.scale[Math.floor(Math.random() * th.scale.length)], th); }, delay);
        })(500 + i * ((bar * 900) / (density + 1)) * (0.8 + Math.random() * 0.5));
      }
    }
    // Frame-drum on the two strong beats (occasionally dropped for a lift).
    if (th.drum && motif % 4 !== 3) { drumHit(); setTimeout(function () { if (AC && musicOn) drumHit(); }, bar * 500); }
    step++;
    if (step % 4 === 0) motif++; // shift the feel every four bars — the "switch up"
    // Hand off to the next theme in the pool once this one has had its turn, so
    // the soundtrack rotates through the civs you've met.
    barsInTheme++;
    if (barsInTheme >= ROTATE_BARS && pool.length > 1) {
      poolIdx = (poolIdx + 1) % pool.length;
      curTheme = THEMES[pool[poolIdx]] || curTheme;
      barsInTheme = 0; motif = 0;
    }
    musicTimer = setTimeout(musicTick, bar * 1000);
  }

  // ---- Ambience control -----------------------------------------------------
  function ramp(param, value, secs) {
    if (!AC) return;
    param.cancelScheduledValues(t());
    param.setValueAtTime(param.value, t());
    param.linearRampToValueAtTime(value, t() + (secs || 1.2));
  }
  function scheduleThunder() {
    if (!AC) return;
    thunderTimer = setTimeout(function () {
      if (AC && rainGain.gain.value > 0.05) {
        noiseBurst(0.9, 0.35, "lowpass", 300);
        tone("sine", 55, 1.2, 0.4, ambBus, 0.05);
      }
      scheduleThunder();
    }, 9000 + Math.random() * 12000);
  }
  function scheduleBirds() {
    if (!AC) return;
    birdTimer = setTimeout(function () {
      if (AC && forestGain.gain.value > 0.03) {
        var f = 1800 + Math.random() * 1400, n = t();
        var o = AC.createOscillator(); o.type = "sine"; var g = AC.createGain();
        o.frequency.setValueAtTime(f, n); o.frequency.linearRampToValueAtTime(f * 1.25, n + 0.08);
        o.frequency.linearRampToValueAtTime(f * 0.9, n + 0.16);
        g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.06, n + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, n + 0.22);
        o.connect(g); g.connect(forestGain); o.start(n); o.stop(n + 0.24);
      }
      scheduleBirds();
    }, 3500 + Math.random() * 6000);
  }

  window.HGAudio = {
    // Call from the first real user gesture.
    init: function () {
      if (started) { if (AC && AC.state === "suspended") AC.resume(); return; }
      if (!ensure()) return;
      started = true;
      if (musicOn) musicTick();
      scheduleThunder();
      scheduleBirds();
    },
    isReady: function () { return !!AC; },
    setMuted: function (m) { muted = !!m; if (master) ramp(master.gain, muted ? 0 : 0.85, 0.25); },
    toggleMuted: function () { this.setMuted(!muted); return muted; },
    isMuted: function () { return muted; },
    setMusicEnabled: function (on) {
      musicOn = !!on;
      if (!AC) return;
      if (musicOn && started) { if (!musicTimer) musicTick(); }
      else { clearTimeout(musicTimer); musicTimer = null; ramp(musicBus.gain, 0, 1.0); setTimeout(function () { if (musicBus) musicBus.gain.value = 0.5; }, 1100); }
    },
    // Your own civ's theme — added to the rotation and made the lead the first
    // time it's set (so your music opens the game). Safe to call every frame.
    setCiv: function (civ) {
      var k = (civ || "").toLowerCase();
      if (!THEMES[k] || k === ownCiv) return;
      ownCiv = k; ensureInPool(k);
      if (curTheme === THEMES.neutral) switchTo(k); // lead with your own theme
    },
    // A civ whose theme should be in the rotation (e.g. one you've met before,
    // restored on load) — no immediate switch.
    addCiv: function (civ) { ensureInPool((civ || "").toLowerCase()); },
    // You just MET this civ — bring their theme in and play it now as a cue.
    meetCiv: function (civ) {
      var k = (civ || "").toLowerCase();
      if (THEMES[k]) switchTo(k);
    },
    // Introspection (debug / tests): the theme now playing and the rotation pool.
    currentTheme: function () { return pool[poolIdx]; },
    themePool: function () { return pool.slice(); },
    // weather: "rain" | "storm" | anything else (dry).
    setWeather: function (wx) {
      if (!AC) return;
      var wet = wx === "rain" || wx === "storm";
      ramp(rainGain.gain, wet ? (wx === "storm" ? 0.5 : 0.32) : 0, 2.0);
    },
    // env: "forest" turns on wind + birds; anything else fades them out.
    setAmbience: function (env) {
      if (!AC) return;
      ramp(forestGain.gain, env === "forest" ? 0.28 : 0, 2.0);
    },
    sfx: function (name) { if (!ensure()) return; var f = SFX[name]; if (f) f(); }
  };
})();
