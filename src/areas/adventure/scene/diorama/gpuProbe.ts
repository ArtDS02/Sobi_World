// Asking the browser which graphics card draws WebGL, before any diorama is built (software drawing cannot run it).
import type * as THREE from 'three';

/** The graphics card's name from a WebGL context (the driver's own string), or '' when the browser hides it. */
export function gpuNameOf(renderer: THREE.WebGLRenderer): string {
  return nameOfContext(renderer.getContext());
}

function nameOfContext(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
}

let cached: string | null = null;

/** The same, from a throw-away context (asked once; '' when WebGL is not there at all). */
export function probeGpuName(): string {
  if (cached !== null) return cached;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    cached = gl ? nameOfContext(gl) : '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cached = '';
  }
  return cached;
}
