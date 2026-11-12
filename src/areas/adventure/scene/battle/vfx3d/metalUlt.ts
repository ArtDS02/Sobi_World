// "Đoàn Kỵ Thép" in 3D (prototype, decision 059): three bronze knights rise as ghosts behind the caster, then charge one after another through
// the foes' row (the skill's impacts), each crossing leaving a bright cut, sparks and a ring; at the end a dome of bronze closes round the caster
// (the 25 % shield). Times are ms from the start of the act: appear 500–1000, charges at 1200 / 1450 / 1700, dome 2400–3000.
import * as THREE from 'three';
import { clamp, cloud, easeInOut, easeOut, easeOutBack, park, rng, ripple, smooth, sprite } from './effectParts';
import { bronzeMat, slashArc, sparks } from './metalParts';
import { seeds } from './natureParts';
import { disposeTree, type Vfx3dEnv, type Vfx3dHandle } from './stage3d';

const DOME_VERT = `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const DOME_FRAG = `
varying vec3 vN; varying vec3 vV; uniform float uFade, uT;
void main(){
  float f=pow(1.-clamp(dot(normalize(vN),normalize(vV)),0.,1.),2.);
  float hex=.5+.5*sin(vN.x*14.+uT*2.)*sin(vN.y*14.-uT*1.6);
  vec3 col=mix(vec3(.85,.55,.2),vec3(1.,.9,.6),f)+hex*.12;
  gl_FragColor=vec4(col,(.12+f*.7)*uFade);
}`;

/** A horse and rider of bronze: body, four legs, head, rider, helmet with plume, lance, shield. Faces +x. */
function knight(mat: THREE.Material) {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, x: number, y: number, z = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.z = rz;
    g.add(m);
    return m;
  };
  add(new THREE.CapsuleGeometry(0.28, 0.9, 4, 8), 0, 0.75, 0, Math.PI / 2);
  add(new THREE.BoxGeometry(0.5, 0.28, 0.3), 0.85, 1.1, 0).rotation.z = 0.5;
  add(new THREE.CylinderGeometry(0.2, 0.22, 0.55, 8), 0.1, 1.35);
  add(new THREE.SphereGeometry(0.2, 10, 8), 0.1, 1.82);
  add(new THREE.ConeGeometry(0.07, 0.45, 6), -0.05, 2.1, 0, 0.5);
  add(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), 1.1, 1.45, 0.25, Math.PI / 2);
  add(new THREE.ConeGeometry(0.07, 0.35, 6), 2.3, 1.45, 0.25, -Math.PI / 2);
  const shield = add(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), 0.15, 1.35, 0.3);
  shield.rotation.x = Math.PI / 2;
  const legs = [-0.4, -0.25, 0.3, 0.45].map((x, i) => {
    const l = add(new THREE.CylinderGeometry(0.06, 0.05, 0.62, 6), x, 0.31, i % 2 ? 0.14 : -0.14);
    l.geometry.translate(0, -0.31, 0);
    l.position.y = 0.62;
    return l;
  });
  return {
    g,
    gallop(sec: number) {
      legs.forEach((l, i) => (l.rotation.z = Math.sin(sec * 16 + i * 1.6) * 0.7));
      g.position.y = Math.abs(Math.sin(sec * 8)) * 0.12;
    },
  };
}

export function steelCavalry(env: Vfx3dEnv): Vfx3dHandle {
  const root = new THREE.Group();
  env.scene.add(root);
  const rand = rng(161);
  const dir = env.origin.x >= env.from.x ? 1 : -1;
  const lanes = [-0.5, 0, 0.5].map((k, i) => new THREE.Vector3(env.origin.x + k * Math.min(2.4, env.unit), 0, env.origin.z + (i === 1 ? 0.35 : -0.25 + i * 0.1)));
  const start = new THREE.Vector3(env.from.x - dir * 0.2, 0, env.from.z);
  const items = lanes.map((lane, i) => {
    const mat = bronzeMat();
    const k = knight(mat);
    k.g.rotation.y = dir > 0 ? 0 : Math.PI;
    k.g.scale.setScalar(0.85);
    root.add(k.g);
    const t0 = 1200 + i * 250;
    const cut = slashArc(root, 2.2, 0xffe0a0);
    cut.mesh.position.set(lane.x, 0.7, lane.z);
    cut.mesh.rotation.z = -0.7 + i * 0.2;
    cut.mesh.scale.setScalar(1.4);
    const ring = ripple(root, 2.6, 2, 0xe0a040, 0xfff0c0);
    ring.mesh.position.set(lane.x, 0.02, lane.z);
    return { lane, mat, k, t0, cut, ring, spark: sparks(root, 60, 0.13), idle: new THREE.Vector3(start.x - dir * (0.3 + i * 0.5), 0, lane.z + 0.3) };
  });
  const dust = cloud(root, 120, 0.55, 0xb89a70, false, 0.4);
  const ds = seeds(dust.n, rand);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uT: { value: 0 } }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dome.position.set(env.from.x, 0.7, env.from.z);
  root.add(dome);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color: 0xffd890, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  halo.position.copy(dome.position);
  root.add(halo);
  const shieldRing = ripple(root, 3, 2.3, 0xd89a50, 0xfff0c0);
  shieldRing.mesh.position.set(env.from.x, 0.02, env.from.z);
  const x0 = start.x + dir * 0.4;
  return {
    update(ms) {
      const dm = dome.material as THREE.ShaderMaterial;
      items.forEach((it, i) => {
        const run = (ms - it.t0) / 650;
        const ghost = smooth(500 + i * 120, 900 + i * 120, ms);
        let p: THREE.Vector3;
        if (run <= 0) p = it.idle.clone().setY(0);
        else {
          const e = clamp(run);
          // From the caster's side, through the lane, out past the row.
          p = new THREE.Vector3(x0 + (it.lane.x + dir * 3.4 - x0) * easeInOut(e), 0, it.idle.z + (it.lane.z - it.idle.z) * easeOut(Math.min(1, e * 2)));
        }
        it.k.g.position.x = p.x;
        it.k.g.position.z = p.z;
        it.k.gallop(ms / 1000 + i);
        it.k.g.position.y += run <= 0 ? 0.25 * (1 - ghost) + Math.sin(ms * 0.006 + i) * 0.05 : 0;
        it.k.g.visible = ghost > 0.01 && run < 1.1;
        it.mat.opacity = ghost * (run <= 0 ? 0.55 : 1) * (1 - smooth(1, 1.1, run));
        const hit = (ms - (it.t0 + 230)) / 1000;
        it.cut.set(easeOut(clamp((ms - it.t0 - 230) / 200)), smooth(0, 0.04, hit) * (1 - smooth(0.25, 0.6, hit)));
        it.ring.set(hit, smooth(0, 0.07, hit) * (1 - smooth(0.4, 0.9, hit)));
        it.spark.set(hit, new THREE.Vector3(it.lane.x, 0.6, it.lane.z), 1.2, 0.7);
      });
      for (let i = 0; i < dust.n; i++) {
        const [b, jx, jy, ph] = ds[i]!;
        const it = items[i % 3]!;
        const born = it.t0 + b * 520;
        const age = ms - born;
        if (age < 0 || age > 500) {
          park(dust, i);
          continue;
        }
        const e = easeInOut(clamp((born - it.t0) / 650));
        dust.pos.setXYZ(i, x0 + (it.lane.x + dir * 3.4 - x0) * e - dir * 0.5, 0.15 + Math.abs(jy) * 0.5 + (age / 500) * 0.5, it.lane.z + Math.sin(ph) * 0.2 + jx * 0.2);
      }
      dust.pos.needsUpdate = true;
      const d = clamp((ms - 2400) / 350);
      dome.scale.setScalar(Math.max(0.001, 1.15 * easeOutBack(d)));
      dm.uniforms.uFade!.value = smooth(2400, 2500, ms) * (1 - smooth(2800, 3200, ms));
      dm.uniforms.uT!.value = ms / 1000;
      dome.visible = dm.uniforms.uFade!.value > 0.01;
      const b = Math.exp(-Math.max(0, ms - 2400) / 160) * (ms > 2400 ? 1 : 0);
      halo.scale.setScalar(0.5 + 2.4 * b);
      (halo.material as THREE.SpriteMaterial).opacity = b;
      shieldRing.set((ms - 2500) / 1000, smooth(0, 0.07, (ms - 2500) / 1000) * (1 - smooth(0.4, 0.9, (ms - 2500) / 1000)));
    },
    dispose() {
      env.scene.remove(root);
      disposeTree(root);
    },
  };
}
