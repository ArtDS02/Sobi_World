// How long one frame of a battle effect strip shows. The strips were drawn as 4 frames at 12 fps and played at 85 ms a
// frame; a sheet with more frames at a higher fps (Sobi Studio motion, decision 051) keeps the same length, so the frame
// time scales with 12 / fps. Every 12 fps sheet plays exactly as before.
export const STRIP_FRAME_MS_AT_12_FPS = 85;

export function stripFrameMs(fps: number | undefined): number {
  return fps && fps > 0 ? (STRIP_FRAME_MS_AT_12_FPS * 12) / fps : STRIP_FRAME_MS_AT_12_FPS;
}
