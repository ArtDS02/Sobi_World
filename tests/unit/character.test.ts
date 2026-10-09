// systems/character: walking (speed, diagonals, sliding, walls), settling, facing, interaction reach.
import { describe, expect, it } from 'vitest';
import {
  canStand,
  directionTo,
  facingFor,
  inputVector,
  nearestInteractable,
  settle,
  stepCharacter,
  type CharacterState,
  type Walkable,
} from '../../src/systems/character';

const walk: Walkable = {
  bounds: { x: 0, y: 0, width: 400, height: 300 },
  obstacles: [{ x: 200, y: 100, width: 60, height: 60 }],
  halfW: 10,
  halfH: 5,
};
const at = (x: number, y: number, facing: CharacterState['facing'] = 'down'): CharacterState => ({
  x,
  y,
  facing,
  moving: false,
});

describe('inputVector', () => {
  it('reads the four moves and cancels opposite keys', () => {
    expect(inputVector(new Set(['moveRight', 'moveUp']))).toEqual({ x: 1, y: -1 });
    expect(inputVector(new Set(['moveLeft', 'moveRight']))).toEqual({ x: 0, y: 0 });
    expect(inputVector(new Set(['interact']))).toEqual({ x: 0, y: 0 });
  });
});

describe('stepCharacter', () => {
  it('walks at the given speed', () => {
    const s = stepCharacter(at(100, 200), { x: 1, y: 0 }, 100, 200, walk);
    expect(s.x).toBeCloseTo(120);
    expect(s.y).toBe(200);
    expect(s.moving).toBe(true);
    expect(s.facing).toBe('right');
  });

  it('a diagonal is not faster than a straight line', () => {
    const s = stepCharacter(at(100, 200), { x: 1, y: -1 }, 100, 200, walk);
    expect(Math.hypot(s.x - 100, s.y - 200)).toBeCloseTo(20, 5);
  });

  it('stands still without input and reports not moving', () => {
    const moving = { ...at(100, 200), moving: true };
    expect(stepCharacter(moving, { x: 0, y: 0 }, 16, 200, walk)).toEqual({ ...moving, moving: false });
  });

  it('stops at the edge of the ground', () => {
    let s = at(380, 200);
    for (let i = 0; i < 60; i++) s = stepCharacter(s, { x: 1, y: 0 }, 16, 200, walk);
    expect(s.x).toBeLessThanOrEqual(390 + 1e-6);
    expect(s.x).toBeGreaterThan(385);
    expect(canStand(s, walk)).toBe(true);
  });

  it('is blocked by an object and slides along it', () => {
    let s = at(180, 130); // left of the box, walking right and down
    for (let i = 0; i < 6; i++) s = stepCharacter(s, { x: 1, y: 1 }, 16, 200, walk);
    expect(s.x).toBeLessThanOrEqual(190 + 1e-6); // wall on the right: x stays at the box's edge
    expect(s.y).toBeGreaterThan(140); // still sliding down along it
    expect(canStand(s, walk)).toBe(true);
    for (let i = 0; i < 40; i++) s = stepCharacter(s, { x: 1, y: 1 }, 16, 200, walk);
    expect(s.y).toBeGreaterThan(160); // past the box, free again
    expect(canStand(s, walk)).toBe(true);
  });

  it('a long frame does not tunnel through a thin object', () => {
    const thin: Walkable = { ...walk, obstacles: [{ x: 200, y: 0, width: 4, height: 300 }] };
    const s = stepCharacter(at(150, 100), { x: 1, y: 0 }, 5000, 600, thin);
    expect(s.x).toBeLessThan(200);
  });

  it('never ends on a blocked point over a long random walk', () => {
    let s = at(50, 50);
    const dirs = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ];
    for (let i = 0; i < 2000; i++) {
      s = stepCharacter(s, dirs[(i >> 3) % dirs.length]!, 16, 260, walk);
      expect(canStand(s, walk)).toBe(true);
    }
  });
});

describe('facingFor', () => {
  it('faces the axis of a straight move', () => {
    expect(facingFor({ x: -1, y: 0 }, 'down')).toBe('left');
    expect(facingFor({ x: 0, y: -1 }, 'down')).toBe('up');
  });
  it('keeps the facing on a diagonal when it is one of the axes, else prefers sideways', () => {
    expect(facingFor({ x: 1, y: 1 }, 'down')).toBe('down');
    expect(facingFor({ x: 1, y: 1 }, 'right')).toBe('right');
    expect(facingFor({ x: 1, y: 1 }, 'up')).toBe('right');
    expect(facingFor({ x: 0, y: 0 }, 'left')).toBe('left');
  });
});

describe('settle', () => {
  it('moves a point out of an object and into the bounds', () => {
    const p = settle({ x: 230, y: 130 }, walk);
    expect(canStand(p, walk)).toBe(true);
    expect(canStand(settle({ x: -50, y: 900 }, walk), walk)).toBe(true);
  });
  it('leaves a free point alone', () => {
    expect(settle({ x: 50, y: 50 }, walk)).toEqual({ x: 50, y: 50 });
  });
});

describe('directionTo / nearestInteractable', () => {
  it('points at the target and stops when arrived', () => {
    expect(directionTo({ x: 0, y: 0 }, { x: 10, y: 0 }, 2)).toEqual({ x: 1, y: 0 });
    expect(directionTo({ x: 9, y: 0 }, { x: 10, y: 0 }, 2)).toEqual({ x: 0, y: 0 });
  });
  it('picks the nearest one in reach, none when out of reach', () => {
    const items = [
      { id: 'b', x: 100, y: 100, reach: 50 },
      { id: 'a', x: 120, y: 100, reach: 50 },
      { id: 'far', x: 400, y: 400, reach: 50 },
    ];
    expect(nearestInteractable(items, { x: 118, y: 100 })?.id).toBe('a');
    expect(nearestInteractable(items, { x: 300, y: 100 })).toBeNull();
  });
  it('a larger reach only counts for its own object', () => {
    const items = [
      { id: 'small', x: 0, y: 0, reach: 10 },
      { id: 'big', x: 100, y: 0, reach: 200 },
    ];
    expect(nearestInteractable(items, { x: 30, y: 0 })?.id).toBe('big');
  });
});
