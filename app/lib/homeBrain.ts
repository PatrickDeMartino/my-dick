import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

type Lobe = { center: THREE.Vector3; axes: THREE.Vector3 };
const lobes: Lobe[] = [
  ...[-1, 1].map(side => ({ center: new THREE.Vector3(side * .52, .12, -.04), axes: new THREE.Vector3(.9676, 1.2036, 1.3924) })),
  ...[-1, 1].map(side => ({ center: new THREE.Vector3(side * .72, -.48, .3), axes: new THREE.Vector3(.546, .434, .714) })),
  { center: new THREE.Vector3(0, -.88, -.72), axes: new THREE.Vector3(.798, .406, .476) },
];
// Ray/ellipsoid intersection uses the same dimensions as the visible brain.
export function brainSurface(direction: THREE.Vector3) {
  let distance = 0;
  let chosen = lobes[0];
  for (const lobe of lobes) {
    const d = direction.clone().divide(lobe.axes);
    const c = lobe.center.clone().divide(lobe.axes);
    const a = d.dot(d), b = d.dot(c), discriminant = b * b - a * (c.dot(c) - 1);
    if (discriminant < 0) continue;
    const t = (b + Math.sqrt(discriminant)) / a;
    if (t > distance) { distance = t; chosen = lobe; }
  }
  const point = direction.clone().multiplyScalar(distance);
  const normal = point.clone().sub(chosen.center).divide(chosen.axes).divide(chosen.axes).normalize();
  return { point, normal };
}

type TrailPoint = { point: THREE.Vector3; normal: THREE.Vector3 };
type Crawler = {
  group: THREE.Group; segments: THREE.Mesh[]; direction: THREE.Vector3; heading: THREE.Vector3;
  target: THREE.Vector3; history: TrailPoint[]; age: number; turnAt: number; speed: number;
  spacing: number; radius: number; monkey: boolean;
  spine?: { positions: THREE.Vector3[]; normals: THREE.Vector3[]; tangents: THREE.Vector3[]; time: { value: number } };
};
const randomDirection = () => new THREE.Vector3().randomDirection();

export function makeHomeBrain(onCreatureReady: () => void) {
  const root = new THREE.Group();
  const matter = new THREE.MeshPhysicalMaterial({ color: 0xf08fc9, emissive: 0x4b102f, emissiveIntensity: .2, roughness: .62, clearcoat: .35 });
  for (const lobe of lobes) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), matter);
    mesh.position.copy(lobe.center); mesh.scale.copy(lobe.axes); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
  }
  const stem = new THREE.Mesh(new THREE.CapsuleGeometry(.19, .72, 10, 16), matter);
  stem.position.set(.06, -1.42, -.46); stem.rotation.z = -.11; root.add(stem);
  root.rotation.z = -.08;
  const colors = [0x78ffe4, 0xffed69, 0x9bff67, 0xff7ecb, 0x83a8ff];
  const crawlers: Crawler[] = [];
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x16051b });
  for (let i = 0; i < 10; i++) {
    const monkey = i === 9, count = monkey ? 28 : 6 + (i * 7) % 13;
    const group = new THREE.Group(), segments: THREE.Mesh[] = [];
    const color = colors[i % colors.length];
    const material = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: .25, roughness: .38, clearcoat: .7 });
    if (!monkey) {
      for (let j = 0; j < count; j++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(.075 * (1 - .45 * j / count), 12, 9), material);
        mesh.castShadow = true; segments.push(mesh); group.add(mesh);
      }
      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), eyeMaterial);
        eye.position.set(side * .028, .025, .071); segments[0].add(eye);
      }
    } else material.dispose();
    const direction = randomDirection();
    const crawler: Crawler = { group, segments, direction, heading: randomDirection().projectOnPlane(direction).normalize(), target: randomDirection(), history: [], age: i * 2.13, turnAt: 0, speed: monkey ? .2 : .22 + i % 3 * .045, spacing: monkey ? .075 : .067, radius: monkey ? .17 : .06, monkey };
    // Seed a curved, continuous trail rather than stacking the body at its head.
    for (let j = 0; j < 150; j++) {
      const behind = direction.clone().multiplyScalar(Math.cos(j * .018)).addScaledVector(crawler.heading, -Math.sin(j * .018)).normalize();
      const surface = brainSurface(behind);
      crawler.history.push({ point: surface.point.addScaledVector(surface.normal, crawler.radius), normal: surface.normal });
    }
    crawlers.push(crawler); root.add(group);
  }
  let disposed = false;
  const monkey = crawlers[9];
  const manager = new THREE.LoadingManager();
  manager.onLoad = () => { if (!disposed) onCreatureReady(); };
  manager.onError = () => { if (!disposed) onCreatureReady(); };
  new FBXLoader(manager).load('/models/monkey-centipede.fbx', model => {
    if (disposed) { disposeObject(model); return; }
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.1 / bounds.getSize(new THREE.Vector3()).z;
    const positions = Array.from({length: 32}, () => new THREE.Vector3());
    const normals = positions.map(() => new THREE.Vector3(0, 1, 0));
    const tangents = positions.map(() => new THREE.Vector3(0, 0, 1));
    const time = { value: 0 };
    monkey.spine = { positions, normals, tangents, time };
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      geometry.translate(-center.x, -bounds.min.y, -center.z); geometry.scale(scale, scale * .72, scale);
      const fur = new THREE.MeshStandardMaterial({ color: 0x6b4934, roughness: .92 });
      fur.onBeforeCompile = shader => {
        shader.uniforms.trailP = { value: positions }; shader.uniforms.trailN = { value: normals }; shader.uniforms.trailT = { value: tangents }; shader.uniforms.crawlTime = time;
        shader.vertexShader = `uniform vec3 trailP[32]; uniform vec3 trailN[32]; uniform vec3 trailT[32]; uniform float crawlTime;\n` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          float trailIndex = clamp((1.05-position.z)/2.1*31.0,0.0,30.999);
          int ti=int(floor(trailIndex)); float blend=fract(trailIndex);
          vec3 n=normalize(mix(trailN[ti],trailN[ti+1],blend));
          vec3 t=normalize(mix(trailT[ti],trailT[ti+1],blend));
          vec3 side=normalize(cross(n,t)); n=normalize(cross(t,side));
          mat3 basis=mat3(side,n,t);
          vec3 objectNormal=basis*normal;
        `);
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
          vec3 local=position;
          float feet=1.0-smoothstep(0.04,0.22,position.y);
          local.y+=feet*max(0.0,sin(crawlTime*7.0+trailIndex*1.2+sign(position.x)*3.14159))*.045;
          vec3 transformed=mix(trailP[ti],trailP[ti+1],blend)+basis*vec3(local.x,local.y-.06,0.0);
        `);
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\n float furGrain=fract(sin(dot(vViewPosition,vec3(167.1,311.7,74.7)))*43758.5453); diffuseColor.rgb*=.8+.3*furGrain;`);
      };
      const mesh = new THREE.Mesh(geometry, fur);
      mesh.frustumCulled = false; // The shader moves vertices along the brain, outside source bounds.
      monkey.group.add(mesh);
    });
    disposeObject(model);
  }, undefined, () => { console.warn('Monkey-centipede model could not load.'); });
  let accumulator = 0;
  function step(dt: number) {
    for (const crawler of crawlers) {
      crawler.age += dt;
      if (crawler.age >= crawler.turnAt) { crawler.target.copy(randomDirection()); crawler.turnAt = crawler.age + 3 + Math.random() * 4; }
      const desired = crawler.target.clone().projectOnPlane(crawler.direction).normalize();
      for (const other of crawlers) {
        if (other === crawler) continue;
        const away = crawler.direction.clone().sub(other.direction);
        const distance = away.length();
        if (distance < .32 && distance > .001) desired.addScaledVector(away.projectOnPlane(crawler.direction).normalize(), (.32 - distance) * 8);
      }
      crawler.heading.lerp(desired.normalize(), 1 - Math.exp(-dt * 1.3)).projectOnPlane(crawler.direction).normalize();
      crawler.direction.addScaledVector(crawler.heading, crawler.speed * dt).normalize();
      const surface = brainSurface(crawler.direction);
      // A smooth entry/exit every 18 seconds. Opaque lobes naturally occlude buried segments.
      const phase = crawler.age % 18;
      const burrow = phase > 12 ? Math.pow(Math.sin((phase - 12) / 6 * Math.PI), 2) * (crawler.monkey ? .5 : .32) : 0;
      const point = surface.point.addScaledVector(surface.normal, crawler.radius - burrow);
      if (point.distanceTo(crawler.history[0].point) > .012) {
        crawler.history.unshift({ point, normal: surface.normal });
        if (crawler.history.length > 320) crawler.history.pop();
      }
    }
  }
  function sample(crawler: Crawler, distance: number): TrailPoint {
    for (let j = 1; j < crawler.history.length; j++) {
      const a = crawler.history[j - 1], b = crawler.history[j], length = a.point.distanceTo(b.point);
      if (distance <= length) {
        const t = length ? distance / length : 0;
        return { point: a.point.clone().lerp(b.point, t), normal: a.normal.clone().lerp(b.normal, t).normalize() };
      }
      distance -= length;
    }
    return crawler.history[crawler.history.length - 1];
  }
  return {
    root,
    update(dt: number) {
      accumulator += Math.min(dt, .1);
      while (accumulator >= 1/60) { step(1/60); accumulator -= 1/60; }
      for (const crawler of crawlers) {
        const count = crawler.monkey ? 32 : crawler.segments.length;
        for (let j = 0; j < count; j++) {
          const distance = j * (crawler.monkey ? 2.1/31 : crawler.spacing);
          const { point, normal } = sample(crawler, distance);
          const previous = sample(crawler, Math.max(0, distance - .025)).point;
          const next = sample(crawler, distance + .025).point;
          const tangent = previous.clone().sub(next).normalize();
          const side = new THREE.Vector3().crossVectors(normal, tangent).normalize();
          const up = new THREE.Vector3().crossVectors(tangent, side).normalize();
          if (crawler.monkey && crawler.spine) {
            crawler.spine.positions[j].copy(point); crawler.spine.normals[j].copy(up); crawler.spine.tangents[j].copy(tangent); crawler.spine.time.value = crawler.age;
          } else if (!crawler.monkey) {
            const bead = crawler.segments[j]; bead.position.copy(point);
            bead.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, tangent));
            bead.scale.setScalar(1 + Math.sin(crawler.age * 6 - j * .5) * .045);
          }
        }
      }
    },
    dispose() { disposed = true; disposeObject(root); },
  };
}
function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); } });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
