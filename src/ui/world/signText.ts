// The name on a painted sign (decision 035): written into the sign's free face — not over its icon, never past its
// edges — at the largest size that fits between a floor and a ceiling, so short and long names both read well. Two
// looks: `carved` (cream letters with a dark wood outline and a soft drop, for planks and boards) and `ink` (dark
// letters on a light plaque).
import type * as Phaser from 'phaser';

/** The free face of the sign, in world units: its centre and size. */
export interface SignFace {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignTextLook {
  fontFamily: string;
  /** Font size limits (px); the text takes the largest size that fits the face. */
  maxPx: number;
  minPx: number;
  look: 'carved' | 'ink';
  /** Share of the face's height a line may take. */
  fill?: number;
}

const LOOK = {
  carved: { color: '#fff6e2', stroke: '#6b3a1a', strokeShare: 0.16, shadow: '#3e200c' },
  ink: { color: '#5a3a1e', stroke: '#fff4dc', strokeShare: 0.12, shadow: 'rgba(255,255,255,0.6)' },
} as const;

/** Font size (px) for `textWidthAt(px)` to fit `face` (pure: the measuring is injected, for the test). */
export function fitSignPx(textWidthAt: (px: number) => number, face: Pick<SignFace, 'width' | 'height'>, look: Pick<SignTextLook, 'maxPx' | 'minPx' | 'fill'>): number {
  let px = Math.min(look.maxPx, Math.floor(face.height * (look.fill ?? 0.62)));
  // Text width grows with the size: scale down once by the overflow, then step down to be sure.
  const w = textWidthAt(px);
  if (w > face.width) px = Math.floor((px * face.width) / w);
  while (px > look.minPx && textWidthAt(px) > face.width) px -= 1;
  return Math.max(look.minPx, px);
}

/** Writes `name` centred in `face`; a name too long even at `minPx` is squeezed to the face's width. */
export function signText(scene: Phaser.Scene, face: SignFace, name: string, look: SignTextLook, depth: number): Phaser.GameObjects.Text {
  const l = LOOK[look.look];
  const text = scene.add.text(face.x, face.y, name, { fontFamily: look.fontFamily, fontStyle: 'bold', color: l.color }).setOrigin(0.5).setDepth(depth);
  setSignText(text, face, name, look);
  return text;
}

/** Re-fits an existing sign text (a new name, a new face). */
export function setSignText(text: Phaser.GameObjects.Text, face: SignFace, name: string, look: SignTextLook): void {
  const l = LOOK[look.look];
  text.setScale(1).setText(name);
  const measure = (px: number) => {
    text.setFontSize(px).setStroke(l.stroke, Math.max(2, Math.round(px * l.strokeShare)));
    return text.width;
  };
  const px = fitSignPx(measure, face, look);
  measure(px);
  text.setShadow(0, Math.max(1, Math.round(px * 0.08)), l.shadow, 0, true, false);
  if (text.width > face.width) text.setScale(face.width / text.width, 1);
  // Bold glyphs sit a touch high in their box: nudge down so the line looks centred on the wood.
  text.setPosition(face.x, face.y + px * 0.04);
}
