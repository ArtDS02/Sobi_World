// Sound output used by the FeedbackDirector (spec §12). AudioManager is the real player; the
// silent port serves tests and builds without audio.
import type { AudioKey } from '../../../../core/config/assetIds';

export interface AudioPort {
  play(key: AudioKey): void;
}

export const silentAudio: AudioPort = { play: () => {} };
