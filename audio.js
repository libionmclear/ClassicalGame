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

  // ---- Music bed: slow modal pad + occasional lyre pluck --------------------
  // D Dorian-ish set (a calm, ancient colour). Frequencies in Hz.
  var CHORDS = [
    [146.83, 174.61, 220.00], // Dm
    [130.81, 164.81, 196.00], // C
    [174.61, 220.00, 261.63], // F
    [196.00, 246.94, 293.66]  // G
  ];
  var PLUCKS = [293.66, 329.63, 392.00, 440.00, 493.88, 587.33];

  function padChord(freqs, dur) {
    var lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.3;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.linearRampToValueAtTime(0.5, n + 1.4);
    g.gain.setValueAtTime(0.5, n + dur - 1.6);
    g.gain.linearRampToValueAtTime(0.0001, n + dur);
    lp.connect(g); g.connect(musicBus);
    for (var i = 0; i < freqs.length; i++) {
      var o = AC.createOscillator(); o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = freqs[i]; o.detune.value = (i - 1) * 4;
      o.connect(lp); o.start(n); o.stop(n + dur + 0.05);
    }
  }
  function lyrePluck(freq) {
    var o = AC.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
    var g = AC.createGain(); var n = t();
    g.gain.setValueAtTime(0.0001, n);
    g.gain.exponentialRampToValueAtTime(0.16, n + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, n + 1.1);
    o.connect(g); g.connect(musicBus); o.start(n); o.stop(n + 1.2);
  }
  function musicTick() {
    if (!AC || !musicOn) return;
    var chord = CHORDS[step % CHORDS.length];
    padChord(chord, 8.2);
    // A sparse lyre motif over the pad.
    if (Math.random() < 0.8) {
      var count = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < count; i++) {
        (function (delay) {
          setTimeout(function () { if (AC && musicOn) lyrePluck(PLUCKS[Math.floor(Math.random() * PLUCKS.length)]); }, delay);
        })(600 + i * (900 + Math.random() * 800));
      }
    }
    step++;
    musicTimer = setTimeout(musicTick, 8000);
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
