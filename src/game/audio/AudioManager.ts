// Audio player (spec §12): the 12 canonical keys resolved through manifest.audio (volume, loop).
// Music loops while settings.musicOn; effects play while settings.sfxOn. A key without a file, a
// failed load or a blocked play() is silence — never a thrown error, never a production log.
import type { AssetRegistry } from '../../core/assets/registry';
import { AUDIO_KEYS, type AudioKey } from '../../core/config/assetIds';
import type { AudioPort } from './audioPort';

/** The slice of HTMLAudioElement the manager uses (a fake in tests). */
export interface AudioClip {
  loop: boolean;
  volume: number;
  play(): Promise<void> | void;
  pause(): void;
}

export type ClipFactory = (url: string) => AudioClip;

export interface AudioTrack {
  url: string;
  volume: number;
  loop: boolean;
  kind: 'music' | 'sfx';
}

export interface AudioOptions {
  createClip: ClipFactory;
  /** Current toggles; null while there is no save yet (nothing plays). */
  settings: () => { musicOn: boolean; sfxOn: boolean } | null;
  /** Desktop shell: playback is allowed at launch. Web dev: wait for `unlock()` (first gesture). */
  unlocked: boolean;
  /** Dev builds log a failure once per key; production stays silent. */
  warn?: (message: string) => void;
}

const MUSIC: AudioKey = 'music_farm';

/** Key → file, volume and loop from the manifest; keys without a row are absent (silence). */
export function audioTracks(
  assets: Pick<AssetRegistry, 'manifest' | 'url'>,
): Map<AudioKey, AudioTrack> {
  const tracks = new Map<AudioKey, AudioTrack>();
  for (const row of assets.manifest.audio) {
    const key = AUDIO_KEYS.find((k) => k === row.id);
    const url = assets.url(row.id);
    if (!key || !url) continue;
    tracks.set(key, {
      url,
      volume: row.volume ?? 1,
      loop: row.loop ?? row.kind === 'music',
      kind: row.kind,
    });
  }
  return tracks;
}

export class AudioManager implements AudioPort {
  private music: AudioClip | null = null;
  private musicPlaying = false;
  private unlocked: boolean;
  private readonly warned = new Set<string>();

  constructor(
    private readonly tracks: Map<AudioKey, AudioTrack>,
    private readonly opts: AudioOptions,
  ) {
    this.unlocked = opts.unlocked;
  }

  /** A sound effect (spec §12 table); silent when sfxOn is off or the key has no file. */
  play(key: AudioKey): void {
    if (key === MUSIC) return; // music is driven by sync()
    if (!this.unlocked || !this.opts.settings()?.sfxOn) return;
    const track = this.tracks.get(key);
    if (!track) return this.warnOnce(key, `no file for ${key}`);
    this.start(key, this.clip(key, track));
  }

  /** First user gesture in the browser build: playback is now allowed. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.sync();
  }

  /** Starts or stops the music loop to match settings.musicOn (call on every settings change). */
  sync(): void {
    const want = this.unlocked && !!this.opts.settings()?.musicOn;
    if (want === this.musicPlaying) return;
    const track = this.tracks.get(MUSIC);
    if (!track) {
      if (want) this.warnOnce(MUSIC, `no file for ${MUSIC}`);
      return;
    }
    this.musicPlaying = want;
    if (!want) {
      this.music?.pause();
      return;
    }
    this.music ??= this.clip(MUSIC, track);
    this.start(MUSIC, this.music);
  }

  private clip(key: AudioKey, track: AudioTrack): AudioClip | null {
    try {
      const clip = this.opts.createClip(track.url);
      clip.loop = track.loop;
      clip.volume = track.volume;
      return clip;
    } catch {
      this.warnOnce(key, `cannot create ${key}`);
      return null;
    }
  }

  private start(key: AudioKey, clip: AudioClip | null) {
    if (!clip) return;
    try {
      const played = clip.play();
      if (played) played.catch(() => this.warnOnce(key, `cannot play ${key}`));
    } catch {
      this.warnOnce(key, `cannot play ${key}`);
    }
  }

  private warnOnce(key: string, message: string) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    this.opts.warn?.(`[audio] ${message}`);
  }
}
