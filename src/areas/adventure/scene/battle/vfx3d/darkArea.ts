// Dark effects over a whole row of foes in 3D (prototype, decision 059). `night_net` (Lưới Đêm): stars gather and a net of night falls over the row.
// `night_weave` (Lưới Dệt Đêm): the stage darkens, tentacles of shadow rise round the row and a great net closes. `curse_eyes` (Lời Nguyền): a
// curse eye opens over each foe and a rune circle brands the ground. Times are ms from the start of the act.
import * as THREE from 'three';
import { slots } from './earthParts';
import { clamp, cloud, easeOut, easeOutBack, park, rng, ripple, smooth } from './effectParts';
import { sigil } from './lightningParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const NET_FRAG = `
varying vec2 vUv; uniform float uFade, uT;
void main(){
  vec2 g=fract(vUv*vec2(9.,6.)+vec2(0.,uT*.1)); vec2 d=abs(g-.5);
  float line=smoothstep(.07,0.,min(abs(d.x+d.y-.5)+0.,abs(d.x-d.y)))*1.;
  float cross=smoothstep(.06,0.,abs(fract(vUv.x*9.)-.5))*.4+smoothstep(.06,0.,abs(fract(vUv.y*6.)-.5))*.4;
  float edge=smoothstep(0.,.08,vUv.x)*smoothstep(1.,.92,vUv.x)*smoothstep(0.,.08,vUv.y)*smoothstep(1.,.92,vUv.y);
  vec3 col=mix(vec3(.55,.35,.95),vec3(.9,.8,1.),clamp(line+cross,0.,1.));
  gl_FragColor=vec4(col,clamp(line*.9+cross*.7+.06,0.,1.)*edge*uFade);
}`;
function net(parent: THREE.Object3D) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uFade: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: NET_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  parent.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    set(w: number, d: number, y: number, ms: number, fade: number) {
      mesh.visible = fade > 0.01;
      mesh.scale.set(w, d, 1);
      mesh.position.y = y;
      u.uFade!.value = fade;
      u.uT!.value = ms / 1000;
    },
    mesh,
  };
}

/** Stars drifting in a layer over the row. */
function stars(parent: THREE.Object3D, n: number, color: number, seed: number) {
  const c = cloud(parent, n, 0.2, color);
  const sd = seeds(n, rng(seed));
  return (ms: number, at: THREE.Vector3, w: number, y: number, op: number) => {
    for (let i = 0; i < n; i++) {
      const [b, jx, jy, ph] = sd[i]!;
      c.pos.setXYZ(i, at.x + (b - 0.5) * w, y + jy * 0.6 + Math.sin(ms * 0.003 + ph) * 0.1, at.z + jx * 1.4);
    }
    c.pos.needsUpdate = true;
    (c.pts.material as THREE.PointsMaterial).opacity = op * (0.6 + 0.4 * Math.sin(ms * 0.01));
  };
}

export function nightNet(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const spots = slots(env);
  const spread = Math.min(2.4, env.unit);
  const W = 2.6 * spread + 1.4;
  const nt = net(root);
  const star = stars(root, 70, 0xffffff, 271);
  const ringAt = spots.map((s) => {
    const r = ripple(root, 2.2, 1.7, 0x7a4ad6, 0xd8b8ff);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const pin = cloud(root, 40, 0.25, 0xffe36a);
  return {
    update(ms) {
      const o = new THREE.Vector3(env.origin.x, 0, env.origin.z);
      star(ms, o, W, 2.4, smooth(0, 300, ms) * (1 - smooth(860, 1250, ms)));
      const fall = clamp((ms - 360) / 500);
      const y = 2.3 - 1.7 * fall * fall;
      nt.set(W * (0.9 + 0.2 * fall), 2.2, y, ms, smooth(360, 460, ms) * (1 - smooth(1200, 1500, ms)));
      for (let i = 0; i < pin.n; i++) {
        const s = spots[i % 3]!;
        const t = (ms - 860 - (i % 3) * 80) / 600;
        if (t <= 0 || t > 1) park(pin, i);
        else pin.pos.setXYZ(i, s.x + Math.cos(i * 2.4) * t * 0.9, 0.5 + Math.sin(i * 1.7) * 0.3 + t * 0.6, s.z + Math.sin(i * 2.4) * t * 0.5);
      }
      pin.pos.needsUpdate = true;
      (pin.pts.material as THREE.PointsMaterial).opacity = 0.9;
      spots.forEach((_, i) => ringAt[i]!.set((ms - 860 - i * 80) / 1000, smooth(0, 0.08, (ms - 860 - i * 80) / 1000) * (1 - smooth(0.4, 0.9, (ms - 860 - i * 80) / 1000))));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function nightWeave(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(273);
  const spots = slots(env);
  const spread = Math.min(2.4, env.unit);
  const W = 3 * spread + 1.6;
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a0a30, emissive: 0x5a2aa0, emissiveIntensity: 0.6, roughness: 0.5, transparent: true });
  const tentacles = [0, 1, 2, 3, 4, 5].map((i) => {
    const s = spots[i % 3]!;
    const pts: THREE.Vector3[] = [];
    const a0 = rand() * 6.2832;
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      pts.push(new THREE.Vector3(s.x + Math.cos(a0 + t * 4) * (0.6 - t * 0.35) + (i < 3 ? -0.5 : 0.5), t * (2.2 + rand() * 0.6), s.z + Math.sin(a0 + t * 4) * 0.4 + (i % 3 - 1) * 0.1));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.14, 7);
    const m = new THREE.Mesh(geo, mat);
    root.add(m);
    return { geo, m, count: geo.index!.count, t0: 500 + i * 110 };
  });
  const nt = net(root);
  const star = stars(root, 90, 0xffffff, 273);
  const sg = sigil(root);
  sg.mesh.position.set(env.origin.x, 0.04, env.origin.z);
  const smoke = cloud(root, 100, 0.9, 0x2a1a4a, false, 0.6);
  const ss = seeds(smoke.n, rand);
  const flash = ripple(root, 6, 4.4, 0x9a6aff, 0xe8d8ff);
  flash.mesh.position.set(env.origin.x, 0.02, env.origin.z);
  return {
    update(ms) {
      const o = new THREE.Vector3(env.origin.x, 0, env.origin.z);
      sg.set(W * easeOut(clamp((ms - 300) / 500)), W * 0.7 * easeOut(clamp((ms - 300) / 500)), ms / 1000, smooth(300, 500, ms) * (1 - smooth(2400, 2800, ms)));
      mat.opacity = 1 - smooth(2400, 2800, ms);
      for (const t of tentacles) {
        const k = easeOut(clamp((ms - t.t0) / 900));
        t.geo.setDrawRange(0, Math.floor((k * t.count) / 3) * 3);
        t.m.visible = k > 0.01 && mat.opacity > 0.01;
      }
      star(ms, o, W, 3.6, smooth(300, 700, ms) * (1 - smooth(2200, 2800, ms)));
      const fall = clamp((ms - 1250) / 700);
      nt.set(W * (1.1 - 0.15 * fall), 2.6, 3.6 - 3.0 * fall * fall, ms, smooth(1250, 1400, ms) * (1 - smooth(2300, 2800, ms)));
      for (let i = 0; i < smoke.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const t = (ms - 500) / 2000 - b * 0.1;
        if (t <= 0 || t > 1) {
          park(smoke, i);
          continue;
        }
        smoke.pos.setXYZ(i, env.origin.x + Math.cos(ph) * (0.3 + b) * W * 0.5, 0.2 + t * 1.2 + jy * 0.5, env.origin.z + Math.sin(ph) * 0.7 + jx * 0.3);
      }
      smoke.pos.needsUpdate = true;
      (smoke.pts.material as THREE.PointsMaterial).opacity = 0.6 * smooth(0, 0.1, (ms - 500) / 2000) * (1 - smooth(0.7, 1, (ms - 500) / 2000));
      flash.set((ms - 2050) / 1000, smooth(0, 0.06, (ms - 2050) / 1000) * (1 - smooth(0.4, 0.9, (ms - 2050) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function curseEyes(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const spots = slots(env);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc89aff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const irisMat = new THREE.MeshBasicMaterial({ color: 0xff4aa0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const eyes = spots.map((s) => {
    const g = new THREE.Group();
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), eyeMat);
    lid.scale.set(1.3, 0.55, 0.2);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), irisMat);
    iris.position.z = 0.1;
    g.add(lid, iris);
    g.position.set(s.x, 2.2, s.z);
    root.add(g);
    return g;
  });
  const runes = spots.map((s) => {
    const sg = sigil(root);
    sg.mesh.position.set(s.x, 0.03, s.z);
    return sg;
  });
  const smoke = cloud(root, 60, 0.7, 0x4a2a6a, false, 0.5);
  const ss = seeds(smoke.n, rng(275));
  return {
    update(ms) {
      spots.forEach((_, i) => {
        const t0 = 400 + i * 120;
        const open = easeOutBack(clamp((ms - t0) / 400));
        const fade = smooth(t0, t0 + 120, ms) * (1 - smooth(1100, 1300, ms));
        eyes[i]!.visible = fade > 0.01;
        eyes[i]!.scale.set(Math.max(0.001, open), Math.max(0.001, open * (0.3 + 0.7 * Math.abs(Math.sin(ms * 0.004 + i)))), 1);
        runes[i]!.set(2 * easeOut(clamp((ms - t0) / 300)), 1.5 * easeOut(clamp((ms - t0) / 300)), ms / 1000, smooth(t0, t0 + 150, ms) * (1 - smooth(1100, 1400, ms)));
        if (i === 0) {
          eyeMat.opacity = fade;
          irisMat.opacity = fade;
        }
      });
      for (let i = 0; i < smoke.n; i++) {
        const s = spots[i % 3]!;
        const [b, jx, jy, ph] = ss[i]!;
        const t = (ms - 900 - (i % 3) * 90) / 900;
        if (t <= 0 || t > 1) park(smoke, i);
        else smoke.pos.setXYZ(i, s.x + Math.cos(ph) * (0.2 + b) * t * 1.2, 0.3 + t * 0.8 + jy * 0.3, s.z + Math.sin(ph) * (0.2 + b) * t * 0.8 + jx * 0.2);
      }
      smoke.pos.needsUpdate = true;
      (smoke.pts.material as THREE.PointsMaterial).opacity = 0.5 * smooth(900, 1000, ms) * (1 - smooth(1400, 1800, ms));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
