// Earth effects in 3D (prototype, decision 059). `boulder_smash` (Đập Đá): a boulder rises, is thrown and bursts into shards.
// `quake_spikes` (Địa Chấn Cổ): the ground heaves and stone spikes thrust up under the row. `tusk_charge` (Húc Nanh): a dust trail and a
// crashing blow. `rock_fist` (Nện Đá): a giant stone fist falls. `seal_quake` (Địa Chấn Phong Ấn): a golden seal on the ground, light pillars,
// then the ground splits and spikes burst. Times are ms from the start of the act.
import * as THREE from 'three';
import { clamp, cloud, easeInOut, easeOut, park, rng, ripple, smooth } from './effectParts';
import { chestOf, dustAt, mouthOf, shards, slots, spikes, stone } from './earthParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

export function boulderSmash(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(131);
  const mat = stone();
  const mouth = mouthOf(env);
  const goal = chestOf(env);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), mat);
  root.add(rock);
  const chips = shards(root, 16, 0.12, mat, 131);
  const dust = cloud(root, 70, 0.8, 0xb89a70, false, 0.5);
  const sd = seeds(dust.n, rand);
  const trail = cloud(root, 50, 0.45, 0xb89a70, false, 0.4);
  const ts = seeds(trail.n, rand);
  const crack = ripple(root, 2.4, 1.8, 0x8a6a3a, 0xe8d0a0);
  crack.mesh.position.set(goal.x, 0.02, goal.z);
  const at = (t: number) => {
    const k = clamp((t - 350) / 410);
    const e = easeInOut(k);
    return new THREE.Vector3().lerpVectors(mouth, goal, e).setY(mouth.y + (goal.y - mouth.y) * e + Math.sin(Math.PI * e) * 0.6);
  };
  return {
    update(ms) {
      const rise = easeOut(clamp(ms / 350));
      const p = ms < 350 ? new THREE.Vector3(mouth.x, -0.3 + 0.9 * rise, mouth.z) : at(ms);
      rock.visible = ms < 760;
      rock.position.copy(p);
      rock.rotation.set(ms * 0.012, ms * 0.009, 0);
      rock.scale.setScalar(0.5 + 0.5 * rise);
      mat.opacity = 1 - smooth(1100, 1250, ms);
      for (let i = 0; i < trail.n; i++) {
        const [b, jx, jy, ph] = ts[i]!;
        const born = 380 + b * 380;
        const age = ms - born;
        if (age < 0 || age > 450) {
          park(trail, i);
          continue;
        }
        const q = at(born);
        trail.pos.setXYZ(i, q.x + jx * 0.3, Math.max(0.1, q.y - 0.2 + jy * 0.2 + age * 0.0004), q.z + Math.sin(ph) * 0.1);
      }
      trail.pos.needsUpdate = true;
      chips.set((ms - 760) / 1000, goal);
      dustAt(dust, sd, ms, goal, 760, 1.1);
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.5 * (1 - smooth(1200, 1650, ms));
      crack.set((ms - 760) / 1000, smooth(0, 0.08, (ms - 760) / 1000) * (1 - smooth(0.4, 0.9, (ms - 760) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function quakeSpikes(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(133);
  const mat = stone();
  const spots = slots(env);
  const thrust = spots.map((s, i) => spikes(root, mat, s, 6, 1.7, 133 + i));
  const chips = spots.map((_, i) => shards(root, 12, 0.11, mat, 140 + i));
  const dust = cloud(root, 90, 0.9, 0xb89a70, false, 0.5);
  const sd = seeds(dust.n, rand);
  const wave = ripple(root, 6, 3.4, 0x8a6a3a, 0xe8d0a0);
  wave.mesh.position.set(env.origin.x, 0.02, env.origin.z);
  return {
    update(ms) {
      mat.opacity = 1 - smooth(1250, 1550, ms);
      wave.set((ms - 420) / 1000, smooth(0, 0.1, (ms - 420) / 1000) * (1 - smooth(0.5, 1, (ms - 420) / 1000)));
      spots.forEach((s, i) => {
        const t0 = 600 + i * 130;
        thrust[i]!(ms, t0, mat.opacity > 0.01);
        chips[i]!.set((ms - t0) / 1000, new THREE.Vector3(s.x, 0.3, s.z), 1.2);
      });
      const t = (ms - 600) / 1000;
      for (let i = 0; i < dust.n; i++) {
        const [b, jx, jy, ph] = sd[i]!;
        const s = spots[i % 3]!;
        const tt = t - (i % 3) * 0.13;
        if (tt <= 0 || tt > 0.95) {
          park(dust, i);
          continue;
        }
        const r = (0.15 + b * 0.9) * easeOut(clamp(tt * 1.6));
        dust.pos.setXYZ(i, s.x + Math.cos(ph) * r * 1.3, 0.15 + tt * 0.9 + jy * 0.4, s.z + Math.sin(ph) * r * 0.9 + jx * 0.2);
      }
      dust.pos.needsUpdate = true;
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.5 * (1 - smooth(900, 1500, ms));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function tuskCharge(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(137);
  const mat = stone();
  const from = new THREE.Vector3(env.from.x, 0.25, env.from.z);
  const goal = new THREE.Vector3(env.origin.x, 0.25, env.origin.z);
  const streak = cloud(root, 140, 0.6, 0xb89a70, false, 0.55);
  const ss = seeds(streak.n, rand);
  const chips = shards(root, 18, 0.13, mat, 137);
  const dust = cloud(root, 70, 0.9, 0xb89a70, false, 0.5);
  const ds = seeds(dust.n, rand);
  const ring = ripple(root, 3, 2.3, 0x8a6a3a, 0xf0e0b8);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  const flash = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(flash);
  return {
    update(ms) {
      for (let i = 0; i < streak.n; i++) {
        const [b, jx, jy, ph] = ss[i]!;
        const born = 430 + b * 280;
        const age = ms - born;
        if (age < 0 || age > 520) {
          park(streak, i);
          continue;
        }
        const k = easeInOut(clamp((born - 420) / 280));
        streak.pos.setXYZ(i, from.x + (goal.x - from.x) * k + jx * 0.4, 0.15 + Math.abs(jy) * 0.5 + (age / 520) * 0.5, from.z + (goal.z - from.z) * k + Math.sin(ph) * 0.2);
      }
      streak.pos.needsUpdate = true;
      (streak.pts.material as THREE.PointsMaterial).opacity = 0.55 * (1 - smooth(900, 1150, ms));
      chips.set((ms - 700) / 1000, new THREE.Vector3(goal.x, 0.3, goal.z), 1.3);
      mat.opacity = 1 - smooth(1000, 1200, ms);
      dustAt(dust, ds, ms, goal, 700, 1.2);
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.5 * (1 - smooth(1100, 1600, ms));
      ring.set((ms - 700) / 1000, smooth(0, 0.07, (ms - 700) / 1000) * (1 - smooth(0.4, 0.9, (ms - 700) / 1000)));
      const b = Math.exp(-Math.max(0, ms - 700) / 110) * (ms > 700 ? 1 : 0);
      flash.position.set(goal.x, 0.6, goal.z);
      flash.scale.setScalar(Math.max(0.001, 0.4 + 2.2 * b));
      (flash.material as THREE.Material).opacity = b;
      flash.visible = b > 0.01;
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

export function rockFist(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(139);
  const mat = stone();
  const goal = new THREE.Vector3(env.origin.x, 0, env.origin.z);
  const fist = new THREE.Group();
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    fist.add(m);
  };
  add(new THREE.BoxGeometry(1.3, 0.9, 1.0), 0, 0.6, 0);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.3, 0.7, 0.45), -0.48 + i * 0.32, 0.15, 0.4);
  add(new THREE.BoxGeometry(0.45, 0.35, 0.4), 0.7, 0.3, 0.2);
  add(new THREE.CylinderGeometry(0.45, 0.55, 0.7, 7), 0, 1.2, 0);
  fist.scale.set(1.5, 1.5, 1.5);
  root.add(fist);
  const chips = shards(root, 22, 0.14, mat, 139);
  const dust = cloud(root, 80, 0.9, 0xb89a70, false, 0.5);
  const ds = seeds(dust.n, rand);
  const crater = ripple(root, 2.8, 2.2, 0x6a4a2a, 0xe8d0a0);
  crater.mesh.position.set(goal.x, 0.02, goal.z);
  const ring = ripple(root, 4, 3, 0x8a6a3a, 0xf0e0b8);
  ring.mesh.position.set(goal.x, 0.02, goal.z);
  return {
    update(ms) {
      const k = clamp((ms - 450) / 300);
      const y = 3.4 * (1 - k * k * k);
      fist.position.set(goal.x, y, goal.z);
      fist.visible = ms > 440 && ms < 1250;
      fist.scale.y = ms > 750 ? 1 - 0.25 * Math.exp(-(ms - 750) / 150) : 1;
      mat.opacity = smooth(440, 520, ms) * (1 - smooth(1050, 1250, ms));
      chips.set((ms - 750) / 1000, new THREE.Vector3(goal.x, 0.2, goal.z), 1.3);
      dustAt(dust, ds, ms, goal, 750, 1.2);
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.5 * (1 - smooth(1200, 1650, ms));
      crater.set((ms - 750) / 1000, smooth(0, 0.07, (ms - 750) / 1000) * (1 - smooth(0.6, 1, (ms - 750) / 1000)));
      ring.set((ms - 750) / 1000, smooth(0, 0.07, (ms - 750) / 1000) * (1 - smooth(0.4, 0.9, (ms - 750) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}

const SEAL_FRAG = `
varying vec2 vUv; uniform float uT, uFade;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x)-uT*.6;
  float ring=smoothstep(.03,0.,abs(r-.92))+smoothstep(.025,0.,abs(r-.62))+smoothstep(.02,0.,abs(r-.3));
  float spokes=smoothstep(.04,0.,abs(sin(a*3.)*r*.5))*step(.3,r)*step(r,.92);
  float tri=smoothstep(.03,0.,abs(cos(a*1.5+1.57)*r-.45))*step(r,.9);
  float g=clamp(ring+spokes*.6+tri*.5,0.,1.);
  float glowc=smoothstep(1.,0.,r)*.18;
  float edge=1.-smoothstep(.95,1.,r);
  vec3 col=mix(vec3(1.,.72,.25),vec3(1.,.95,.7),g);
  gl_FragColor=vec4(col,(g*.95+glowc)*edge*uFade);
}`;

export function sealQuake(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(141);
  const mat = stone();
  const spots = slots(env);
  const W = 2.6 * Math.min(2.4, env.unit) + 1.6;
  const sealMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: SEAL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sealMat);
  seal.rotation.x = -Math.PI / 2;
  seal.position.set(env.origin.x, 0.03, env.origin.z);
  root.add(seal);
  const pillarMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const pillars = spots.map((s) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1, 20, 1, true), pillarMat);
    m.position.set(s.x, 0, s.z);
    root.add(m);
    return m;
  });
  const thrust = spots.map((s, i) => spikes(root, mat, s, 5, 1.5, 141 + i));
  const chips = spots.map((_, i) => shards(root, 12, 0.11, mat, 150 + i));
  const cracks = spots.map((s) => {
    const r = ripple(root, 2.4, 1.8, 0xe0a040, 0xfff0b0);
    r.mesh.position.set(s.x, 0.02, s.z);
    return r;
  });
  const dust = cloud(root, 90, 0.9, 0xb89a70, false, 0.5);
  const sd = seeds(dust.n, rand);
  return {
    update(ms) {
      const grow = easeOut(clamp((ms - 600) / 600));
      seal.scale.set(W * grow, W * 0.75 * grow, 1);
      sealMat.uniforms.uT!.value = ms / 1000;
      sealMat.uniforms.uFade!.value = smooth(600, 800, ms) * (1 - smooth(2100, 2400, ms));
      seal.visible = grow > 0.01;
      mat.opacity = 1 - smooth(2100, 2400, ms);
      pillarMat.opacity = 0.7 * smooth(1200, 1300, ms) * (1 - smooth(1650, 1750, ms));
      pillars.forEach((m, i) => {
        const u = easeOut(clamp((ms - 1200 - i * 100) / 250));
        m.scale.set(1, Math.max(0.001, 3.2 * u), 1);
        m.position.y = 1.6 * u;
        m.visible = pillarMat.opacity > 0.01;
      });
      spots.forEach((s, i) => {
        const t0 = 1700 + i * 100;
        thrust[i]!(ms, t0, mat.opacity > 0.01);
        chips[i]!.set((ms - t0) / 1000, new THREE.Vector3(s.x, 0.3, s.z), 1.1);
        cracks[i]!.set((ms - t0) / 1000, smooth(0, 0.08, (ms - t0) / 1000) * (1 - smooth(0.4, 0.9, (ms - t0) / 1000)));
      });
      const t = (ms - 1700) / 1000;
      for (let i = 0; i < dust.n; i++) {
        const [b, jx, jy, ph] = sd[i]!;
        const s = spots[i % 3]!;
        const tt = t - (i % 3) * 0.1;
        if (tt <= 0 || tt > 0.95) {
          park(dust, i);
          continue;
        }
        const r = (0.15 + b * 0.9) * easeOut(clamp(tt * 1.6));
        dust.pos.setXYZ(i, s.x + Math.cos(ph) * r * 1.3, 0.15 + tt * 0.9 + jy * 0.4, s.z + Math.sin(ph) * r * 0.9 + jx * 0.2);
      }
      dust.pos.needsUpdate = true;
      (dust.pts.material as THREE.PointsMaterial).opacity = 0.5 * (1 - smooth(2100, 2400, ms));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
