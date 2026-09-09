import * as THREE from "three";
import { createGlobe, updateGlobe, VOID_VERT, VOID_FRAG, type GlobeHandle } from "./globe";

export type Island = {
  x: number;
  z: number;
  radius: number;
  topY: number;
};

export const ISLANDS: Island[] = [
  { x: 0, z: 0, radius: 16, topY: 0 },
  { x: 24, z: -10, radius: 8.5, topY: 1.2 },
  { x: -20, z: 16, radius: 9, topY: 0.6 },
  { x: 14, z: 22, radius: 7.5, topY: 2.0 },
  { x: -26, z: -14, radius: 8, topY: 1.0 },
  { x: 30, z: 12, radius: 6.5, topY: 1.8 },
  { x: 2, z: -28, radius: 10, topY: 0.5 },
  { x: -10, z: 30, radius: 7, topY: 2.2 },
  { x: 10, z: 8, radius: 4.2, topY: 3.4 },
  { x: -8, z: -12, radius: 4.8, topY: 2.6 },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHECKER = [0xf2d84a, 0x3ae8ff, 0xe14bff, 0x7cff3a, 0xff6b9d, 0x9b5cff];

function checkerTexture(seed: number) {
  const rng = mulberry32(seed);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const n = 10;
  const s = 256 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      g.fillStyle = `#${CHECKER[(x + y * 3 + Math.floor(rng() * 2)) % CHECKER.length]!.toString(16).padStart(6, "0")}`;
      g.fillRect(x * s, y * s, s + 1, s + 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(3, 3);
  return tex;
}

function mushroomCapTexture(hue: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grd.addColorStop(0, `hsl(${hue} 92% 64%)`);
  grd.addColorStop(0.55, `hsl(${(hue + 40) % 360} 88% 50%)`);
  grd.addColorStop(1, `hsl(${(hue + 80) % 360} 72% 30%)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(255,255,230,0.62)";
  for (let i = 0; i < 16; i++) {
    const x = 18 + ((i * 47) % 92);
    const y = 16 + ((i * 31) % 92);
    g.beginPath();
    g.ellipse(x, y, 7 + (i % 4), 5.5, 0, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  vec3 hsv(float h, float s, float v) {
    vec3 p = abs(fract(vec3(h) + vec3(1.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
    return v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s);
  }
  void main() {
    vec3 n = normalize(vDir);
    float az = atan(n.x, n.z);
    float el = n.y;
    float r = max(length(n.xz), 0.02);
    float spiral = az + log(r) * 5.5 - uTime * 0.11;
    float spiral2 = az * -1.4 + r * 8.0 + uTime * 0.07;
    float bands = sin(spiral * 3.0 + sin(el * 10.0 + uTime * 0.2) * 1.8);
    float h = fract(0.82 + spiral * 0.1 + bands * 0.06 + el * 0.16);
    float val = mix(0.55, 1.2, smoothstep(-0.25, 1.0, el));
    val *= 0.88 + 0.12 * sin(spiral2);
    vec3 col = hsv(h, 0.68, val);
    col = mix(col, hsv(fract(h + 0.14), 0.6, val * 1.05), 0.32 + 0.3 * sin(spiral2));
    vec3 horizon = vec3(0.95, 0.45, 0.82);
    col = mix(horizon, col, smoothstep(-0.4, 0.45, el));
    float spec = fract(sin(dot(n.xy, vec2(12.9898, 78.233)) + n.z * 45.2) * 43758.5453);
    if (spec > 0.995 && el > 0.1) {
      col += vec3(0.85, 0.9, 1.0) * (spec - 0.995) * 80.0;
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

export type WorldHandle = {
  group: THREE.Group;
  skyMat: THREE.ShaderMaterial;
  water: THREE.Mesh;
  waterMat: THREE.ShaderMaterial;
  islands: Island[];
  spores: THREE.Points;
  sporePositions: Float32Array;
  textures: THREE.Texture[];
  sky: THREE.Mesh;
  globe: GlobeHandle;
};

export function sampleGround(x: number, z: number): { y: number; island: Island | null } {
  let best: Island | null = null;
  let bestY = -Infinity;
  for (const isl of ISLANDS) {
    const dx = x - isl.x;
    const dz = z - isl.z;
    const d = Math.hypot(dx, dz);
    if (d < isl.radius * 0.92) {
      const edge = 1 - d / (isl.radius * 0.92);
      const y = isl.topY + Math.min(0.12, edge * 0.2);
      if (y >= bestY) {
        bestY = y;
        best = isl;
      }
    }
  }
  if (!best) return { y: -Infinity, island: null };
  return { y: bestY, island: best };
}

function islandGeometry(isl: Island, rng: () => number) {
  const segs = 36;
  const depth = 3.4 + isl.radius * 0.2;
  const top = new THREE.CircleGeometry(isl.radius, segs);
  top.rotateX(-Math.PI / 2);
  const pos = top.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const d = Math.hypot(x, z) / isl.radius;
    const j = (rng() - 0.5) * 0.5 * d;
    pos.setY(i, j);
  }
  pos.needsUpdate = true;
  top.computeVertexNormals();

  const side = new THREE.CylinderGeometry(isl.radius * 0.98, isl.radius * 0.32, depth, segs, 5, true);
  const sPos = side.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < sPos.count; i++) {
    const y = sPos.getY(i);
    if (y < depth * 0.2) {
      sPos.setX(i, sPos.getX(i) * (0.68 + rng() * 0.22));
      sPos.setZ(i, sPos.getZ(i) * (0.68 + rng() * 0.22));
    }
  }
  sPos.needsUpdate = true;
  return { top, side, depth };
}

function addMushroom(
  group: THREE.Group,
  textures: THREE.Texture[],
  stemMat: THREE.Material,
  gillMat: THREE.Material,
  x: number,
  y: number,
  z: number,
  h: number,
  capR: number,
  hue: number,
) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09 + capR * 0.08, 0.14 + capR * 0.1, h, 12), stemMat);
  stem.position.set(x, y + h / 2, z);
  stem.castShadow = true;
  group.add(stem);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12 + capR * 0.08, 0.03, 8, 16), stemMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y + h * 0.62, z);
  group.add(ring);
  const capTex = mushroomCapTexture(hue);
  textures.push(capTex);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(capR, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.65),
    new THREE.MeshStandardMaterial({
      map: capTex,
      roughness: 0.48,
      flatShading: true,
      emissive: new THREE.Color().setHSL((hue % 360) / 360, 0.7, 0.2),
      emissiveIntensity: 0.35,
    }),
  );
  cap.position.set(x, y + h * 0.92, z);
  cap.castShadow = true;
  group.add(cap);
  const gills = new THREE.Mesh(new THREE.ConeGeometry(capR * 0.82, capR * 0.28, 16, 1, true), gillMat);
  gills.position.set(x, y + h * 0.88, z);
  gills.rotation.x = Math.PI;
  group.add(gills);
}

export function createWorld(quality: "high" | "low"): WorldHandle {
  const group = new THREE.Group();
  const textures: THREE.Texture[] = [];
  const rng = mulberry32(0x51a1e);

  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: { uTime: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 48, 28), skyMat);
  group.add(sky);

  const globe = createGlobe();
  group.add(globe.group);
  textures.push(...globe.textures);

  const waterMat = new THREE.ShaderMaterial({
    vertexShader: VOID_VERT,
    fragmentShader: VOID_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uFX: { value: 1 },
      uLightDir: { value: new THREE.Vector3(0.4, 1, 0.3).normalize() },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(280, 280, 1, 1), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -7.5;
  group.add(water);

  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0xb44ae0, roughness: 0.6, flatShading: true, emissive: 0x3a1060, emissiveIntensity: 0.22 }),
    new THREE.MeshStandardMaterial({ color: 0x7a28b8, roughness: 0.64, flatShading: true, emissive: 0x2a0848, emissiveIntensity: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0xe070ff, roughness: 0.56, flatShading: true, emissive: 0x501070, emissiveIntensity: 0.2 }),
  ];
  const topTex = checkerTexture(7);
  textures.push(topTex);
  const topMat = new THREE.MeshStandardMaterial({
    map: topTex,
    roughness: 0.42,
    metalness: 0.06,
    flatShading: true,
    emissive: 0x332244,
    emissiveIntensity: 0.28,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xb44bff,
    emissive: 0x7a20c8,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88,
    flatShading: true,
  });
  const crystalMat2 = new THREE.MeshStandardMaterial({
    color: 0x3ae8ff,
    emissive: 0x1288aa,
    emissiveIntensity: 0.5,
    roughness: 0.22,
    metalness: 0.4,
    transparent: true,
    opacity: 0.9,
    flatShading: true,
  });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x6b3a88, roughness: 0.78, flatShading: true, emissive: 0x2a1040, emissiveIntensity: 0.15 });
  const gillMat = new THREE.MeshStandardMaterial({
    color: 0xffb0f0,
    emissive: 0xff66cc,
    emissiveIntensity: 0.45,
    roughness: 0.4,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  for (const isl of ISLANDS) {
    const { top, side, depth } = islandGeometry(isl, rng);
    const topMesh = new THREE.Mesh(top, topMat);
    topMesh.position.set(isl.x, isl.topY, isl.z);
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;
    group.add(topMesh);

    const body = new THREE.Mesh(side, rockMats[Math.floor(rng() * rockMats.length)]!);
    body.position.set(isl.x, isl.topY - depth / 2, isl.z);
    body.castShadow = true;
    group.add(body);

    const tip = new THREE.ConeGeometry(isl.radius * 0.36, depth * 0.48, 12);
    const tipMesh = new THREE.Mesh(tip, rockMats[0]!);
    tipMesh.position.set(isl.x, isl.topY - depth - depth * 0.14, isl.z);
    tipMesh.rotation.x = Math.PI;
    group.add(tipMesh);

    const mCount = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < mCount; i++) {
      const ang = rng() * Math.PI * 2;
      const dist = rng() * isl.radius * 0.72;
      const mx = isl.x + Math.cos(ang) * dist;
      const mz = isl.z + Math.sin(ang) * dist;
      const giant = i === 0 && isl.radius > 9;
      const h = giant ? 3.6 + rng() * 2.2 : 0.9 + rng() * 1.8;
      const capR = giant ? 1.6 + rng() * 0.8 : 0.5 + rng() * 1.05;
      addMushroom(group, textures, stemMat, gillMat, mx, isl.topY, mz, h, capR, rng() * 360);
    }

    const cCount = 4 + Math.floor(rng() * 5);
    for (let i = 0; i < cCount; i++) {
      const ang = rng() * Math.PI * 2;
      const dist = rng() * isl.radius * 0.8;
      const cx = isl.x + Math.cos(ang) * dist;
      const cz = isl.z + Math.sin(ang) * dist;
      const ht = 0.45 + rng() * 1.9;
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.12 + rng() * 0.22, ht, 7), rng() > 0.5 ? crystalMat : crystalMat2);
      mesh.position.set(cx, isl.topY + ht / 2, cz);
      mesh.rotation.set(rng() * 0.2, rng() * 6, rng() * 0.2);
      mesh.castShadow = true;
      group.add(mesh);
    }
  }

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + 0.4;
    const dist = 58 + rng() * 38;
    const r = 2 + rng() * 4.2;
    const y = -2 + rng() * 16;
    const geo = new THREE.CylinderGeometry(r * 0.9, r * 0.28, 2.6, 12);
    const m = new THREE.Mesh(geo, rockMats[i % rockMats.length]!);
    m.position.set(Math.cos(ang) * dist, y, Math.sin(ang) * dist);
    group.add(m);
    const top = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 12), topMat);
    top.rotation.x = -Math.PI / 2;
    top.position.set(m.position.x, y + 1.32, m.position.z);
    group.add(top);
    if (rng() > 0.4) {
      addMushroom(group, textures, stemMat, gillMat, m.position.x, y + 1.32, m.position.z, 1.2 + rng(), 0.7 + rng() * 0.5, rng() * 360);
    }
  }

  const sporeCount = quality === "high" ? 260 : 110;
  const sporePositions = new Float32Array(sporeCount * 3);
  const sporeColors = new Float32Array(sporeCount * 3);
  const cols = [
    [1, 0.3, 1],
    [0.23, 0.91, 1],
    [0.49, 1, 0.23],
    [1, 0.88, 0.29],
  ];
  for (let i = 0; i < sporeCount; i++) {
    sporePositions[i * 3] = (rng() - 0.5) * 90;
    sporePositions[i * 3 + 1] = rng() * 22;
    sporePositions[i * 3 + 2] = (rng() - 0.5) * 90;
    const c = cols[i % cols.length]!;
    sporeColors[i * 3] = c[0]!;
    sporeColors[i * 3 + 1] = c[1]!;
    sporeColors[i * 3 + 2] = c[2]!;
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute("position", new THREE.BufferAttribute(sporePositions, 3));
  sporeGeo.setAttribute("color", new THREE.BufferAttribute(sporeColors, 3));
  const spores = new THREE.Points(
    sporeGeo,
    new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  group.add(spores);

  return { group, skyMat, water, waterMat, islands: ISLANDS, spores, sporePositions, textures, sky, globe };
}

export function updateWorld(w: WorldHandle, time: number, cam: THREE.Vector3, reduced: boolean) {
  w.skyMat.uniforms.uTime.value = reduced ? time * 0.15 : time;
  w.sky.position.copy(cam);
  w.waterMat.uniforms.uTime.value = time;
  updateGlobe(w.globe, time);

  const sp = w.sporePositions;
  for (let i = 0; i < sp.length / 3; i++) {
    sp[i * 3 + 1] = (sp[i * 3 + 1]! + 0.35 * (0.4 + (i % 5) * 0.1)) % 22;
    sp[i * 3]! += Math.sin(time * 0.3 + i) * 0.01;
  }
  (w.spores.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
}
