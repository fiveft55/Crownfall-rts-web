/* Original procedural score and sound design. No samples, downloads, or audio assets.
   Every sound starts with oscillators/noise. Volumes are deliberately restrained. */
(() => {
  let context, master, musicBus, fxBus, reverb, compressor, timer;
  let enabled = localStorage.getItem("crown-audio") !== "off",
    step = 0,
    nextNote = 0,
    battle = 0;
  let lastGather = 0,
    lastHit = 0,
    lastUnit = 0;
  let volumes = { master: 0.6, music: 0.22, effects: 0.32 };
  try {
    const saved = JSON.parse(localStorage.getItem("crown-volumes"));
    if (saved)
      for (const key of Object.keys(volumes))
        if (Number.isFinite(saved[key]) && saved[key] >= 0 && saved[key] <= 1)
          volumes[key] = saved[key];
  } catch {}
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // An original D-Dorian theme: spacious phrases over four open fifths.
  const melody = [
    62, 0, 69, 65, 67, 0, 64, 62, 60, 0, 64, 67, 65, 0, 62, 0, 57, 0, 62, 65,
    69, 67, 65, 0, 64, 0, 60, 62, 57, 0, 0, 0, 62, 0, 65, 69, 72, 0, 69, 67, 65,
    0, 64, 62, 60, 0, 62, 0, 57, 0, 60, 64, 67, 65, 64, 0, 62, 0, 57, 60, 62, 0,
    0, 0,
  ];
  const bass = [38, 41, 36, 43, 38, 41, 45, 38];
  function noise(seconds) {
    const b = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * seconds),
      context.sampleRate,
    );
    let seed = 731;
    const a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      a[i] = seed / 2147483648 - 1;
    }
    return b;
  }
  function setup() {
    if (context) return;
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain();
    master.gain.value = volumes.master;
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -17;
    compressor.ratio.value = 4;
    master.connect(compressor);
    compressor.connect(context.destination);
    musicBus = context.createGain();
    musicBus.gain.value = volumes.music;
    fxBus = context.createGain();
    fxBus.gain.value = volumes.effects;
    musicBus.connect(master);
    fxBus.connect(master);
    // A deterministic decaying noise impulse supplies a small stone-hall reverberation.
    reverb = context.createConvolver();
    const impulse = noise(1.8);
    const a = impulse.getChannelData(0);
    for (let i = 0; i < a.length; i++)
      a[i] *= Math.pow(1 - i / a.length, 3) * 0.45;
    reverb.buffer = impulse;
    const wet = context.createGain();
    wet.gain.value = 0.18;
    reverb.connect(wet);
    wet.connect(master);
    const wind = context.createBufferSource();
    wind.buffer = noise(4);
    wind.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 330;
    const gain = context.createGain();
    gain.gain.value = 0.045;
    wind.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    wind.start();
    // Breathing ambient volume rather than a static hiss.
    const breeze = context.createOscillator(),
      depth = context.createGain();
    breeze.frequency.value = 0.08;
    depth.gain.value = 0.018;
    breeze.connect(depth);
    depth.connect(gain.gain);
    breeze.start();
    nextNote = context.currentTime + 0.1;
    timer = setInterval(schedule, 120);
  }
  function pluck(note, when, volume = 0.3, length = 1.2, bus = musicBus) {
    const f = midi(note),
      o = context.createOscillator(),
      harmonic = context.createOscillator(),
      g = context.createGain(),
      filter = context.createBiquadFilter();
    o.type = "triangle";
    o.frequency.value = f;
    harmonic.type = "sine";
    harmonic.frequency.value = f * 2.003;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, when);
    filter.frequency.exponentialRampToValueAtTime(550, when + 0.35);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(volume, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    const hg = context.createGain();
    hg.gain.value = 0.14;
    harmonic.connect(hg);
    hg.connect(filter);
    o.connect(filter);
    filter.connect(g);
    g.connect(bus);
    g.connect(reverb);
    o.start(when);
    harmonic.start(when);
    o.stop(when + length + 0.02);
    harmonic.stop(when + length + 0.02);
  }
  function flute(note, when, length = 0.9) {
    const o = context.createOscillator(),
      g = context.createGain(),
      v = context.createOscillator(),
      depth = context.createGain();
    o.type = "sine";
    o.frequency.value = midi(note);
    v.frequency.value = 4.7;
    depth.gain.value = 2;
    v.connect(depth);
    depth.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.08, when + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    o.connect(g);
    g.connect(musicBus);
    g.connect(reverb);
    o.start(when);
    v.start(when);
    o.stop(when + length);
    v.stop(when + length);
  }
  function drum(when, volume = 0.13) {
    const o = context.createOscillator(),
      g = context.createGain();
    o.frequency.setValueAtTime(105, when);
    o.frequency.exponentialRampToValueAtTime(48, when + 0.18);
    g.gain.setValueAtTime(volume, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
    o.connect(g);
    g.connect(musicBus);
    o.start(when);
    o.stop(when + 0.3);
  }
  function schedule() {
    if (!context || context.state !== "running") return;
    if (nextNote < context.currentTime - 0.5)
      nextNote = context.currentTime + 0.1;
    while (nextNote < context.currentTime + 0.35) {
      const bar = Math.floor(step / 8) % 8,
        n = melody[step % melody.length];
      if (step % 8 === 0) {
        pluck(bass[bar], nextNote, 0.28, 2.7);
        pluck(bass[bar] + 7, nextNote + 0.05, 0.1, 2.1);
      }
      if (n) {
        pluck(n, nextNote, 0.21, 1.25);
        if (Math.floor(step / 64) % 2 === 1 && step % 4 === 0)
          flute(n + 12, nextNote + 0.04, 1.1);
      }
      if (step % 4 === 2) pluck(bass[bar] + 19, nextNote, 0.075, 0.8);
      if (battle > 0.2 && step % 4 === 0) drum(nextNote, 0.1 * battle);
      nextNote += 0.38;
      step++;
    }
  }
  async function start() {
    if (!enabled) return;
    try {
      setup();
      await context.resume();
      master.gain.setTargetAtTime(volumes.master, context.currentTime, 0.2);
    } catch {}
  }
  async function toggle() {
    enabled = !enabled;
    localStorage.setItem("crown-audio", enabled ? "on" : "off");
    if (enabled) await start();
    else if (context) master.gain.setTargetAtTime(0, context.currentTime, 0.15);
    return enabled;
  }
  function order() {
    if (!enabled || !context) return;
    pluck(62, context.currentTime, 0.09, 0.18, fxBus);
    pluck(69, context.currentTime + 0.035, 0.045, 0.2, fxBus);
  }
  function gather(kind) {
    if (!enabled || !context || context.currentTime - lastGather < 0.2) return;
    lastGather = context.currentTime;
    const t = context.currentTime;
    if (kind === 13 || kind === 14) {
      pluck(kind === 13 ? 88 : 78, t, 0.055, 0.22, fxBus);
      return;
    }
    const source = context.createBufferSource();
    source.buffer = noise(0.07);
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = kind === 11 ? 650 : 1900;
    filter.Q.value = kind === 11 ? 1.2 : 0.6;
    const g = context.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    source.connect(filter);
    filter.connect(g);
    g.connect(fxBus);
    source.start(t);
    source.stop(t + 0.08);
  }
  function hit() {
    if (!enabled || !context || context.currentTime - lastHit < 0.14) return;
    lastHit = context.currentTime;
    const t = context.currentTime,
      o = context.createOscillator(),
      g = context.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.07);
    g.gain.setValueAtTime(0.045, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g);
    g.connect(fxBus);
    o.start();
    o.stop(t + 0.1);
  }
  function completed() {
    if (!enabled || !context || context.currentTime - lastUnit < 0.5) return;
    lastUnit = context.currentTime;
    [62, 65, 69].forEach((n, i) =>
      pluck(n, context.currentTime + i * 0.12, 0.15, 0.8, fxBus),
    );
  }
  window.CrownSound = {
    start,
    toggle,
    order,
    gather,
    hit,
    completed,
    setVolume(key, value) {
      if (!(key in volumes) || !Number.isFinite(value)) return;
      volumes[key] = Math.max(0, Math.min(1, value));
      localStorage.setItem("crown-volumes", JSON.stringify(volumes));
      const bus = { master, music: musicBus, effects: fxBus }[key];
      if (bus)
        bus.gain.setTargetAtTime(
          key === "master" && !enabled ? 0 : volumes[key],
          context.currentTime,
          0.08,
        );
    },
    get volumes() {
      return { ...volumes };
    },
    setBattle(value) {
      battle = value;
    },
    get enabled() {
      return enabled;
    },
    get active() {
      return context?.state === "running";
    },
  };
})();
