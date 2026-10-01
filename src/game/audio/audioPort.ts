// Sound output used by the FeedbackDirector (spec §12). R05B ships the silent port; R10 plugs in
// the real player behind the same interface.
import type { AudioKey } from '../../core/config/assetIds';

export interface AudioPort {
  play(key: AudioKey): void;
}

export const silentAudio: AudioPort = { play: () => {} };
