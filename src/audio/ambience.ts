/**
 * Synthesised ambience. No audio files — a filtered-noise bed plus a few
 * oscillators, built at runtime. Costs nothing to download and can't fail
 * to load.
 *
 * Default is muted, and the context is only created after a real user
 * gesture, which is also what browser autoplay policy requires.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bedNodes: AudioNode[] = [];
let running = false;

const STORAGE_KEY = 'universe.audio';

export function audioPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function persist(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* private mode — the toggle still works for this session */
  }
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return ctx;
}

/** Brown-ish noise: integrated white noise, which sounds like distance. */
function noiseBuffer(context: AudioContext, seconds = 4): AudioBuffer {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.017 * white) / 1.017;
    data[i] = last * 4.2;
  }
  return buffer;
}

export function startAmbience() {
  const context = ensureContext();
  if (!context || !master || running) return;
  running = true;
  void context.resume();

  // Low bed: brown noise through a steep low-pass. Sounds like hull.
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer(context);
  noise.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 180;
  lp.Q.value = 0.6;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0.5;
  noise.connect(lp).connect(noiseGain).connect(master);
  noise.start();

  // Two detuned sines a fifth apart, drifting — the "vast" part.
  const drone = [55, 82.5].map((freq, i) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = context.createGain();
    g.gain.value = i === 0 ? 0.055 : 0.032;

    // Slow LFO on gain so the drone breathes instead of sitting still.
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.045 + i * 0.021;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.022;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();

    osc.connect(g).connect(master!);
    osc.start();
    return [osc, lfo, g] as AudioNode[];
  });

  bedNodes = [noise, lp, noiseGain, ...drone.flat()];

  // Fade in — an ambience that snaps on is worse than silence.
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.setValueAtTime(master.gain.value, context.currentTime);
  master.gain.linearRampToValueAtTime(0.42, context.currentTime + 2.4);
  persist(true);
}

export function stopAmbience() {
  persist(false);
  if (!ctx || !master || !running) return;
  const context = ctx;
  master.gain.cancelScheduledValues(context.currentTime);
  master.gain.setValueAtTime(master.gain.value, context.currentTime);
  master.gain.linearRampToValueAtTime(0, context.currentTime + 0.6);

  window.setTimeout(() => {
    for (const node of bedNodes) {
      if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
        try {
          (node as OscillatorNode).stop();
        } catch {
          /* already stopped */
        }
      }
      node.disconnect();
    }
    bedNodes = [];
    running = false;
  }, 700);
}

export type BlipKind = 'approach' | 'open' | 'close' | 'select';

const BLIP: Record<BlipKind, { freq: number; to: number; dur: number; type: OscillatorType }> = {
  approach: { freq: 220, to: 660, dur: 0.34, type: 'sine' },
  open: { freq: 880, to: 1180, dur: 0.13, type: 'triangle' },
  close: { freq: 660, to: 420, dur: 0.13, type: 'triangle' },
  select: { freq: 1320, to: 1320, dur: 0.055, type: 'square' },
};

/** Short UI tone. Silent unless ambience is running. */
export function blip(kind: BlipKind) {
  if (!ctx || !master || !running) return;
  const spec = BLIP[kind];
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, now);
  osc.frequency.exponentialRampToValueAtTime(spec.to, now + spec.dur);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(kind === 'select' ? 0.045 : 0.075, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur);

  // Keep blips well below the bed — they're punctuation, not events.
  const shelf = ctx.createBiquadFilter();
  shelf.type = 'highpass';
  shelf.frequency.value = 300;

  osc.connect(shelf).connect(g).connect(master);
  osc.start(now);
  osc.stop(now + spec.dur + 0.02);
}

export function isRunning() {
  return running;
}
