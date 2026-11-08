// How battle effect strips are timed and addressed. The strips were drawn as 4 frames at 12 fps, played at 85 ms a frame,
// and the effect scripts (content/adventure/battle_fx.json) name frames in those units. A Sobi Studio motion sheet
// (decision 051) has more frames at a higher fps: frame time scales with 12 / fps so the length stays the same, and an old
// frame index maps onto the new sheet — old frame k spans new frames [k·s, (k+1)·s − 1] (s = fps / 12), whose last one is
// the plain drawing k. Every 12 fps sheet plays and reads exactly as before.
export const STRIP_FRAME_MS_AT_12_FPS = 85;

const stepOf = (fps: number | undefined) => (fps && fps > 0 ? Math.max(1, Math.round(fps / 12)) : 1);

export function stripFrameMs(fps: number | undefined): number {
  return fps && fps > 0 ? (STRIP_FRAME_MS_AT_12_FPS * 12) / fps : STRIP_FRAME_MS_AT_12_FPS;
}

/** Old-unit frame range [a, b] of a script -> frames of the sheet. */
export function stripRange(a: number, b: number, fps: number | undefined): [number, number] {
  const s = stepOf(fps);
  return [a * s, (b + 1) * s - 1];
}

/** Old-unit single frame (a decal, a status cover) -> the frame of the sheet that holds that drawing plainly. */
export function stripStill(frame: number, fps: number | undefined): number {
  const s = stepOf(fps);
  return (frame + 1) * s - 1;
}
