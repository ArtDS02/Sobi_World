// The plaza's ground kinds (footstep dust only on dirt) and the fade behind buildings.
import { describe, expect, it } from 'vitest';
import { groundKindAt } from '../../src/areas/plaza/logic/groundKind';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';
import { FadeBehind } from '../../src/areas/plaza/scene/FadeBehind';

const { width, height } = PLAZA_LAYOUT.designSize;
const at = (x: number, y: number) => groundKindAt(PLAZA_LAYOUT, x * width, y * height);

describe('groundKindAt', () => {
  it('knows the sea, the square, the roads and the grass', () => {
    expect(at(0.05, 0.95)).toBe('water');
    expect(at(0.5, 0.57)).toBe('stone');
    expect(at(0.5, 0.68)).toBe('dirt');
    expect(at(0.62, 0.9)).toBe('grass');
  });

  it('puts sand between the sea and the grass', () => {
    expect(at(0.36, 0.95)).toBe('sand');
  });
});

describe('FadeBehind', () => {
  const img = () => {
    const state = { alpha: 1 };
    return { state, img: { setAlpha: (a: number) => (state.alpha = a) } as never };
  };
  const body = { halfWidth: 20, height: 150 };

  it('fades a building the character is behind and brings it back', () => {
    const fade = new FadeBehind();
    const { state, img: image } = img();
    fade.add(image, { x: 100, y: 100, width: 200, height: 200 });
    for (let i = 0; i < 30; i++) fade.update(33, { x: 200, y: 250 }, body); // inside the art, above its foot line
    expect(state.alpha).toBeCloseTo(0.5, 1);
    for (let i = 0; i < 30; i++) fade.update(33, { x: 200, y: 400 }, body); // in front of it
    expect(state.alpha).toBe(1);
  });

  it('leaves a building alone when the character is beside it, and resets on request', () => {
    const fade = new FadeBehind();
    const { state, img: image } = img();
    fade.add(image, { x: 100, y: 100, width: 200, height: 200 });
    for (let i = 0; i < 30; i++) fade.update(33, { x: 600, y: 250 }, body);
    expect(state.alpha).toBe(1);
    for (let i = 0; i < 30; i++) fade.update(33, { x: 200, y: 250 }, body);
    fade.reset();
    expect(state.alpha).toBe(1);
  });
});
