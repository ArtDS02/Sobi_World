// The diorama's own quality control: a software renderer goes straight to the classic 2D map, a slow card steps down once and a too slow
// light level gives the diorama up for the session (what was learned stays in memory only).
import { beforeEach, describe, expect, it } from 'vitest';
import { FpsGate, dioramaFellBack, forgetSession, isSoftwareGpu, sessionLimit, startLevel } from '../../src/areas/adventure/scene/diorama/quality';

/** Runs frames at `fps` from `from` ms for `ms` ms; returns the last level. */
function run(gate: FpsGate, from: number, ms: number, fps: number): number {
  const step = 1000 / fps;
  let t = from;
  for (; t < from + ms; t += step) gate.frame(t);
  return t;
}

beforeEach(() => forgetSession());

describe('software renderers', () => {
  it.each(['Google SwiftShader', 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))', 'llvmpipe (LLVM 15)', 'Microsoft Basic Render Driver', 'Mesa Software Rasterizer'])('%s is software', (name) => {
    expect(isSoftwareGpu(name)).toBe(true);
    expect(startLevel('auto', name)).toBe('classic');
  });

  it('a real card is not', () => {
    expect(isSoftwareGpu('ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11)')).toBe(false);
    expect(startLevel('auto', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11)')).toBe('full');
    expect(sessionLimit()).toBeNull();
  });

  it('software means classic even when the player asked for full, and the session remembers', () => {
    expect(startLevel('full', 'SwiftShader')).toBe('classic');
    expect(dioramaFellBack()).toBe(true);
    expect(startLevel('auto', 'GeForce')).toBe('classic');
  });
});

describe('the settings', () => {
  it('light asks for light, auto and full start at full', () => {
    expect(startLevel('light', 'GeForce')).toBe('light');
    expect(startLevel('auto', 'GeForce')).toBe('full');
    expect(startLevel('full', 'GeForce')).toBe('full');
  });

  it('a fixed full is never measured', () => {
    const gate = new FpsGate('full', false);
    run(gate, 0, 20000, 10);
    expect(gate.current).toBe('full');
  });
});

describe('measuring', () => {
  it('60 FPS stays full', () => {
    const gate = new FpsGate('full', true);
    run(gate, 0, 12000, 60);
    expect(gate.current).toBe('full');
    expect(sessionLimit()).toBeNull();
  });

  it('nothing is judged during the 2 s warm-up, even a stall', () => {
    const gate = new FpsGate('full', true);
    run(gate, 0, 1900, 5);
    expect(gate.current).toBe('full');
  });

  it('under 45 FPS after the warm-up steps down to light, and it is remembered', () => {
    const gate = new FpsGate('full', true);
    run(gate, 0, 2500, 60);
    run(gate, 2500, 3600, 30);
    expect(gate.current).toBe('light');
    expect(sessionLimit()).toBe('light');
    expect(startLevel('auto', 'GeForce')).toBe('light');
  });

  it('20 FPS at light for 5 s gives the diorama up for the session', () => {
    expect(startLevel('light', 'GeForce')).toBe('light');
    const gate = new FpsGate('light', true);
    run(gate, 0, 8000, 20);
    expect(gate.current).toBe('classic');
    expect(dioramaFellBack()).toBe(true);
  });

  it('30 FPS at light is accepted', () => {
    const gate = new FpsGate('light', true);
    run(gate, 0, 9000, 30);
    expect(gate.current).toBe('light');
    expect(dioramaFellBack()).toBe(false);
  });

  it('full that falls to light is then judged again at light', () => {
    const gate = new FpsGate('full', true);
    const t = run(gate, 0, 8000, 20);
    expect(gate.current).toBe('light');
    run(gate, t, 9000, 20);
    expect(gate.current).toBe('classic');
  });
});
