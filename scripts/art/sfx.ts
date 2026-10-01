// The 11 effect keys of game spec §12 (environment catalogue §6), synthesised from scratch so they
// are original work: soft, short and warm — this is a relaxing game. Output: mono 44.1 kHz PCM,
// peak-normalised so manifest `volume` alone balances them.
import { Mp3Encoder } from '@breezystack/lamejs';
import { rng } from './kit';

const SR = 44100;
type Buf = Float32Array;

const buf = (seconds: number): Buf => new Float32Array(Math.ceil(seconds * SR));

type Wave = 'sine' | 'tri' | 'saw' | 'square';
const wave = (type: Wave, phase: number, harmonics = 10) => {
  const p = phase - Math.floor(phase);
  switch (type) {
    case 'sine':
      return Math.sin(2 * Math.PI * p);
    case 'tri':
      return 1 - 4 * Math.abs(p - 0.5);
    case 'saw': {
      // Band-limited by summing a few harmonics: softer than a naive ramp.
      let s = 0;
      for (let k = 1; k <= harmonics; k++) s += Math.sin(2 * Math.PI * k * p) / k;
      return s * 0.6;
    }
    case 'square': {
      let s = 0;
      for (let k = 1; k <= harmonics; k += 2) s += Math.sin(2 * Math.PI * k * p) / k;
      return s * 0.9;
    }
  }
};

interface Tone {
  at: number;
  dur: number;
  freq: number | ((t: number) => number);
  type?: Wave;
  gain?: number;
  attack?: number;
  /** Exponential decay time constant (s); omitted = flat sustain with a short release. */
  decay?: number;
  vibrato?: { rate: number; depth: number };
  /** Amplitude roughness (pig grunts). */
  am?: { rate: number; depth: number };
  harmonics?: number;
}

function tone(b: Buf, o: Tone) {
  const start = Math.floor(o.at * SR),
    n = Math.floor(o.dur * SR);
  const attack = o.attack ?? 0.005,
    gain = o.gain ?? 0.5;
  let phase = 0;
  for (let i = 0; i < n && start + i < b.length; i++) {
    const t = i / SR;
    let f = typeof o.freq === 'number' ? o.freq : o.freq(t / o.dur);
    if (o.vibrato) f *= 1 + o.vibrato.depth * Math.sin(2 * Math.PI * o.vibrato.rate * t);
    phase += f / SR;
    let env = Math.min(1, t / attack);
    env *= o.decay ? Math.exp(-t / o.decay) : Math.min(1, (o.dur - t) / 0.03);
    if (o.am) env *= 1 - o.am.depth * (0.5 + 0.5 * Math.sin(2 * Math.PI * o.am.rate * t));
    b[start + i]! += wave(o.type ?? 'sine', phase, o.harmonics) * env * gain;
  }
}

/** RBJ biquad band-pass over a range of a buffer, in place on a copy that is mixed back. */
function bandpass(x: Buf, f0: number, q: number): Buf {
  const w = (2 * Math.PI * f0) / SR,
    alpha = Math.sin(w) / (2 * q),
    a0 = 1 + alpha;
  const b0 = alpha / a0,
    b2 = -alpha / a0,
    a1 = (-2 * Math.cos(w)) / a0,
    a2 = (1 - alpha) / a0;
  const y = new Float32Array(x.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i]! + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i]!;
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
}

function lowpass(x: Buf, cutoff: number | ((t: number) => number)): Buf {
  const y = new Float32Array(x.length);
  let v = 0;
  for (let i = 0; i < x.length; i++) {
    const c = typeof cutoff === 'number' ? cutoff : cutoff(i / x.length);
    const a = 1 - Math.exp((-2 * Math.PI * c) / SR);
    v += a * (x[i]! - v);
    y[i] = v;
  }
  return y;
}

const mixInto = (b: Buf, src: Buf, gain = 1) => {
  for (let i = 0; i < b.length && i < src.length; i++) b[i]! += src[i]! * gain;
};

function noise(b: Buf, at: number, dur: number, decay: number, gain: number, seed: number) {
  const r = rng(seed);
  const out = new Float32Array(b.length);
  const start = Math.floor(at * SR);
  for (let i = 0; i < dur * SR && start + i < b.length; i++) {
    const t = i / SR;
    out[start + i] = (r() * 2 - 1) * Math.min(1, t / 0.002) * Math.exp(-t / decay) * gain;
  }
  return out;
}

/** A pig grunt: buzzy source through two vowel formants with a fluttering amplitude. */
function grunt(
  b: Buf,
  at: number,
  dur: number,
  f: (t: number) => number,
  formants: [number, number],
  gain: number,
  flutter: number,
) {
  const src = buf(b.length / SR);
  tone(src, {
    at,
    dur,
    freq: f,
    type: 'saw',
    harmonics: 24,
    gain: 1,
    attack: 0.02,
    am: { rate: flutter, depth: 0.55 },
  });
  // Envelope shape: swell then fall.
  const s0 = Math.floor(at * SR),
    n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) src[s0 + i]! *= Math.sin((Math.PI * i) / n) ** 0.6;
  mixInto(b, bandpass(src, formants[0], 2.2), gain);
  mixInto(b, bandpass(src, formants[1], 3), gain * 0.6);
  mixInto(b, lowpass(src, 900), gain * 0.25);
}

const bell = (b: Buf, at: number, freq: number, decay: number, gain: number) => {
  tone(b, { at, dur: decay * 5, freq, gain, decay, attack: 0.002 });
  tone(b, {
    at,
    dur: decay * 3,
    freq: freq * 2.0,
    gain: gain * 0.3,
    decay: decay * 0.5,
    attack: 0.002,
  });
  tone(b, {
    at,
    dur: decay * 2,
    freq: freq * 3.01,
    gain: gain * 0.12,
    decay: decay * 0.3,
    attack: 0.002,
  });
};

const note = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);
const C5 = note(3),
  E5 = note(7),
  G5 = note(10),
  C6 = note(15),
  G4 = note(-2),
  B5 = note(14),
  E6 = note(19),
  G6 = note(22),
  D6 = note(17);

const SOUNDS: Record<string, () => Buf> = {
  ui_click: () => {
    const b = buf(0.12);
    tone(b, { at: 0, dur: 0.1, freq: 820, gain: 0.6, decay: 0.018, attack: 0.001 });
    tone(b, { at: 0, dur: 0.06, freq: 1960, gain: 0.25, decay: 0.008, attack: 0.001 });
    mixInto(b, bandpass(noise(b, 0, 0.03, 0.004, 1, 1), 2800, 1.5), 0.5);
    return b;
  },
  ui_error: () => {
    const b = buf(0.34);
    tone(b, { at: 0, dur: 0.11, freq: (t) => 330 - 30 * t, type: 'tri', gain: 0.5, attack: 0.008 });
    tone(b, {
      at: 0.14,
      dur: 0.16,
      freq: (t) => 247 - 27 * t,
      type: 'tri',
      gain: 0.5,
      attack: 0.008,
    });
    return lowpass(b, 1800);
  },
  pig_oink_happy: () => {
    const b = buf(0.5);
    grunt(b, 0.0, 0.16, (t) => 330 + 120 * Math.sin(Math.PI * t), [760, 1350], 1, 48);
    grunt(b, 0.21, 0.19, (t) => 380 + 140 * Math.sin(Math.PI * t), [820, 1450], 1, 52);
    return b;
  },
  pig_oink_hungry: () => {
    const b = buf(0.9);
    grunt(b, 0.0, 0.8, (t) => 190 - 45 * t + 10 * Math.sin(Math.PI * t), [520, 950], 1.2, 31);
    return b;
  },
  feed_munch: () => {
    const b = buf(0.62);
    [0, 0.14, 0.29, 0.43].forEach((at, i) => {
      mixInto(b, bandpass(noise(b, at, 0.08, 0.025, 1, 10 + i), 1700 + i * 180, 1.1), 0.9);
      tone(b, { at, dur: 0.06, freq: 150 - i * 8, gain: 0.35, decay: 0.02, attack: 0.002 });
    });
    return b;
  },
  water_splash: () => {
    const b = buf(0.75);
    mixInto(
      b,
      lowpass(noise(b, 0, 0.6, 0.18, 1, 20), (t) => 4200 - 3400 * Math.min(1, t * 1.6)),
      0.9,
    );
    [0.28, 0.4, 0.52].forEach((at, i) =>
      tone(b, {
        at,
        dur: 0.05,
        freq: (t) => 520 + i * 90 + 700 * t,
        gain: 0.3,
        decay: 0.02,
        attack: 0.002,
      }),
    );
    return b;
  },
  coin_collect: () => {
    const b = buf(0.7);
    bell(b, 0, B5, 0.09, 0.45);
    bell(b, 0.075, E6, 0.14, 0.5);
    mixInto(b, bandpass(noise(b, 0.075, 0.2, 0.05, 1, 30), 7000, 2), 0.12);
    return b;
  },
  breed_chime: () => {
    const b = buf(1.1);
    bell(b, 0, C6, 0.2, 0.45);
    bell(b, 0.18, G6, 0.28, 0.42);
    const r = rng(40);
    for (let i = 0; i < 7; i++)
      tone(b, { at: 0.2 + i * 0.06, dur: 0.12, freq: 3200 + r() * 1800, gain: 0.05, decay: 0.03 });
    return b;
  },
  birth_fanfare: () => {
    const b = buf(1.35);
    [C5, E5, G5, C6].forEach((f, i) => {
      tone(b, { at: i * 0.1, dur: 0.18, freq: f, type: 'tri', gain: 0.35, decay: 0.12 });
      tone(b, {
        at: i * 0.1,
        dur: 0.18,
        freq: f,
        type: 'square',
        harmonics: 5,
        gain: 0.08,
        decay: 0.08,
      });
    });
    for (const f of [C5, E5, G5, C6])
      tone(b, {
        at: 0.44,
        dur: 0.85,
        freq: f,
        type: 'tri',
        gain: 0.18,
        decay: 0.38,
        vibrato: { rate: 5.5, depth: 0.004 },
      });
    bell(b, 0.44, C6 * 2, 0.2, 0.12);
    return lowpass(b, 5000);
  },
  level_up: () => {
    const b = buf(1.1);
    const brass = (at: number, dur: number, f: number, g = 0.3) =>
      tone(b, {
        at,
        dur,
        freq: f,
        type: 'saw',
        harmonics: 12,
        gain: g,
        attack: 0.025,
        vibrato: dur > 0.3 ? { rate: 5, depth: 0.006 } : undefined,
      });
    brass(0, 0.11, G4);
    brass(0.12, 0.11, C5);
    brass(0.24, 0.11, E5);
    brass(0.36, 0.62, G5, 0.34);
    return lowpass(b, (t) => 1400 + 1800 * Math.min(1, t * 3));
  },
  notify: () => {
    const b = buf(0.9);
    bell(b, 0, D6, 0.22, 0.42);
    tone(b, { at: 0, dur: 0.6, freq: D6 * 2.76, gain: 0.05, decay: 0.08 });
    bell(b, 0.16, D6 * 1.5, 0.2, 0.18);
    return b;
  },
};

export const SFX_IDS = Object.keys(SOUNDS);

/** Peak-normalise (-3 dBFS), fade the tail, encode mono MP3 (128 kbps). */
export function sfxMp3(id: string): Buffer {
  const b = SOUNDS[id]!();
  let peak = 0;
  for (const v of b) peak = Math.max(peak, Math.abs(v));
  const k = 0.7 / (peak || 1),
    fade = Math.min(b.length, Math.floor(0.02 * SR));
  const pcm = new Int16Array(b.length);
  for (let i = 0; i < b.length; i++) {
    const tail = Math.min(1, (b.length - i) / fade);
    pcm[i] = Math.round(Math.max(-1, Math.min(1, b[i]! * k * tail)) * 32767);
  }
  const enc = new Mp3Encoder(1, SR, 128);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152)
    chunks.push(enc.encodeBuffer(pcm.subarray(i, i + 1152)));
  chunks.push(enc.flush());
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}
