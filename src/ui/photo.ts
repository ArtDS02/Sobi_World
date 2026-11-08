// Photo album (D9): the game canvas as a PNG the player saves through a dialog. Nothing is sent anywhere. The pure naming is
// tested; the capture only needs `toBlob` from the canvas, so a test can pass a fake.
const pad = (n: number) => String(n).padStart(2, '0');

/** `sobi-world-YYYYMMDD-HHmmss.png` in the local time of `at`. */
export function photoFileName(at: Date): string {
  return `sobi-world-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}.png`;
}

export interface Shootable {
  width: number;
  height: number;
  /** True when the element is on screen (not display:none). */
  visible: boolean;
  toBlob(cb: (b: Blob | null) => void, type: string): void;
}

/** The biggest visible canvas (the stage), or null. */
export function pickStage<T extends Shootable>(canvases: readonly T[]): T | null {
  const shown = canvases.filter((c) => c.visible && c.width > 0 && c.height > 0);
  return shown.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
}

/** PNG bytes of the stage, or null when there is no canvas or the browser gave nothing. */
export async function shootStage(canvases: readonly Shootable[]): Promise<Uint8Array | null> {
  const stage = pickStage(canvases);
  if (!stage) return null;
  const blob = await new Promise<Blob | null>((resolve) => stage.toBlob(resolve, 'image/png'));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}

/** The page's canvases as shootables. */
export const pageCanvases = (doc: Document = document): Shootable[] =>
  [...doc.querySelectorAll('canvas')].map((c) => ({
    width: c.width,
    height: c.height,
    visible: c.offsetParent !== null || c.getClientRects().length > 0,
    toBlob: (cb, type) => c.toBlob(cb, type),
  }));
