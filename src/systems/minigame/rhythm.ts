// The timing mini-game's maths (D8). A marker sweeps a bar; the player presses when it is in the good zone in the middle.
// Pure: time comes in as arguments, so a test can replay a round exactly. The game's numbers are content/shared/minigame.json.
export interface RhythmRules {
  periodMs: number;
  zoneHalf: number;
  rounds: number;
  tipPerUnit: number;
  perfectAt: number;
}

/** Marker position 0..1 at `elapsedMs` after the round started: a triangle wave, 0 → 1 → 0 in one period. */
export function markerAt(elapsedMs: number, periodMs: number): number {
  if (!(periodMs > 0) || !Number.isFinite(elapsedMs)) return 0;
  const phase = ((elapsedMs % periodMs) + periodMs) % periodMs / periodMs; // 0..1
  return phase < 0.5 ? phase * 2 : (1 - phase) * 2;
}

/** 1 in the middle of the bar, falling in a straight line to 0 at the edge of the good zone and beyond. */
export function hitScore(marker: number, zoneHalf: number): number {
  const off = Math.abs(marker - 0.5);
  return Math.max(0, Math.min(1, 1 - off / zoneHalf));
}

/** Mean of the rounds' scores (0 for none): what the whole mini-game earned. */
export function roundsScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const clean = scores.map((s) => (Number.isFinite(s) ? Math.max(0, Math.min(1, s)) : 0));
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

/** Coins of tip for `units` worked at `score` (0..1), whole coins, never negative. */
export function rhythmTip(score: number, units: number, rules: Pick<RhythmRules, 'tipPerUnit'>): number {
  if (!Number.isFinite(score) || !Number.isFinite(units) || units <= 0) return 0;
  return Math.max(0, Math.round(Math.max(0, Math.min(1, score)) * units * rules.tipPerUnit));
}
