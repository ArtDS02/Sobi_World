import { describe, expect, it } from 'vitest';
import { patchRowText } from '../../scripts/assets/manifestText';

const TEXT = `{
  "pigs": [
    {
      "id": "pig_a",
      "status": "placeholder",
      "tags": ["x"]
    }
  ],
  "audio": [
    { "id": "music_farm", "status": "placeholder", "asset": "audio/music_farm.mp3", "volume": 0.6 }
  ]
}
`;

describe('patchRowText', () => {
  it('replaces an existing field in a multi-line row and leaves the rest untouched', () => {
    const out = patchRowText(TEXT, 'pig_a', { status: 'production' });
    expect(out).toBe(TEXT.replace('"placeholder"', '"production"'));
  });

  it('adds missing fields to a single-line row and stays valid JSON', () => {
    const out = patchRowText(TEXT, 'music_farm', {
      status: 'production',
      asset: 'audio/music_farm.ogg',
      credit: 'A "B"',
      license: 'CC0',
    });
    const row = (JSON.parse(out) as { audio: Record<string, unknown>[] }).audio[0];
    expect(row).toEqual({
      id: 'music_farm',
      status: 'production',
      asset: 'audio/music_farm.ogg',
      volume: 0.6,
      credit: 'A "B"',
      license: 'CC0',
    });
    expect(out.split('\n').length).toBe(TEXT.split('\n').length);
  });

  it('appends to a multi-line row on its own indented line', () => {
    const out = patchRowText(TEXT, 'pig_a', { credit: 'me' });
    expect(out).toContain('"tags": ["x"],\n      "credit": "me"\n    }');
  });
});
