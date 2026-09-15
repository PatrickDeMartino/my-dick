import * as THREE from "three";
import type { WeaponId } from "./characters";
import { addOutlineToTree, OUTLINE_BLUE } from "./outline";

function mat(color: number, extra?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.35,
    flatShading: true,
    ...extra,
  });
}

function add(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

export type GunRig = {
  root: THREE.Group;
  muzzle: THREE.Object3D;
  mag: THREE.Object3D | null;
  cylinder: THREE.Object3D | null;
  flash: THREE.Mesh;
  kind: WeaponId;
};

// Neon pop-art weapon palette: dark saturated violet/teal bodies instead of realistic
// gunmetal, paired with hot complementary accents (orange grip, gold brass, magenta
// trim) so guns finally read as part of this world instead of the one realistic-looking
// thing in it. Every gun/pickup in this file shares these, so this one edit repaints all of them.
const STEEL = mat(0x241a3a, { metalness: 0.75, roughness: 0.26, emissive: 0x140a2a, emissiveIntensity: 0.25 });
const STEEL_DARK = mat(0x0a0620, { metalness: 0.7, roughness: 0.3, emissive: 0x0a0430, emissiveIntensity: 0.2 });
const WOOD = mat(0xff6a3a, { roughness: 0.55, metalness: 0.1, emissive: 0x8a2a0a, emissiveIntensity: 0.25 });
const POLY = mat(0x0a2a3a, { roughness: 0.45, metalness: 0.2, emissive: 0x0a4a5a, emissiveIntensity: 0.3 });
const ACCENT = mat(0xe14bff, { emissive: 0x8010c0, emissiveIntensity: 0.6, roughness: 0.3 });
const BRASS = mat(0xffd23a, { metalness: 0.65, roughness: 0.28, emissive: 0xff8a10, emissiveIntensity: 0.35 });
const LIME = mat(0x7cff3a, { emissive: 0x2a8a10, emissiveIntensity: 0.35 });

export function makeAK47(): GunRig {
  const root = new THREE.Group();
  root.name = "ak";

  add(root, new THREE.BoxGeometry(0.09, 0.11, 0.34), STEEL, 0, 0.02, 0.02);
  add(root, new THREE.BoxGeometry(0.08, 0.07, 0.22), POLY, 0, 0.04, 0.18);
  const barrel = new THREE.CylinderGeometry(0.018, 0.02, 0.48, 10);
  barrel.rotateX(Math.PI / 2);
  add(root, barrel, STEEL_DARK, 0, 0.05, 0.48);
  const gas = new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8);
  gas.rotateX(Math.PI / 2);
  add(root, gas, STEEL, 0, 0.09, 0.38);
  add(root, new THREE.BoxGeometry(0.05, 0.04, 0.2), WOOD, 0, -0.01, 0.22);
  add(root, new THREE.BoxGeometry(0.04, 0.045, 0.22), WOOD, 0, 0.01, -0.24, 0.18);
  add(root, new THREE.BoxGeometry(0.045, 0.12, 0.05), WOOD, 0, -0.08, -0.06, 0.25);
  add(root, new THREE.BoxGeometry(0.03, 0.06, 0.03), STEEL_DARK, 0, -0.05, 0.06);
  add(root, new THREE.BoxGeometry(0.01, 0.05, 0.02), STEEL, 0, 0.1, 0.68);
  add(root, new THREE.BoxGeometry(0.04, 0.03, 0.02), STEEL, 0, 0.09, -0.04);
  const brake = new THREE.CylinderGeometry(0.026, 0.022, 0.06, 8);
  brake.rotateX(Math.PI / 2);
  add(root, brake, STEEL_DARK, 0, 0.05, 0.74);
  add(root, new THREE.BoxGeometry(0.018, 0.018, 0.08), ACCENT, 0.04, 0.03, 0.1);

  const magG = new THREE.Group();
  magG.name = "mag";
  magG.position.set(0, -0.16, 0.04);
  magG.rotation.z = 0.18;
  magG.rotation.x = 0.35;
  add(magG, new THREE.BoxGeometry(0.055, 0.28, 0.09), STEEL_DARK, 0, 0, 0);
  add(magG, new THREE.BoxGeometry(0.06, 0.02, 0.1), ACCENT, 0, -0.13, 0);
  root.add(magG);

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.05, 0.8);
  root.add(muzzle);

  const flash = makeFlash();
  flash.position.copy(muzzle.position);
  root.add(flash);

  root.scale.setScalar(1.15);
  addOutlineToTree(root, OUTLINE_BLUE);
  return { root, muzzle, mag: magG, cylinder: null, flash, kind: "ak" };
}

export function makeRevolver(): GunRig {
  const root = new THREE.Group();
  root.name = "revolver";

  add(root, new THREE.BoxGeometry(0.07, 0.08, 0.18), STEEL, 0, 0.01, 0.02);
  const barrel = new THREE.CylinderGeometry(0.022, 0.024, 0.32, 12);
  barrel.rotateX(Math.PI / 2);
  add(root, barrel, STEEL_DARK, 0, 0.03, 0.28);
  add(root, new THREE.BoxGeometry(0.05, 0.13, 0.045), WOOD, 0, -0.08, -0.04, 0.28);
  add(root, new THREE.BoxGeometry(0.02, 0.05, 0.02), STEEL_DARK, 0, -0.04, 0.05);
  add(root, new THREE.BoxGeometry(0.03, 0.04, 0.04), STEEL, 0, 0.07, -0.05);
  add(root, new THREE.BoxGeometry(0.012, 0.03, 0.02), STEEL, 0, 0.06, 0.42);

  const cyl = new THREE.Group();
  cyl.name = "cylinder";
  cyl.position.set(0, 0.03, 0.08);
  const cylMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 12), STEEL);
  cylMesh.rotation.x = Math.PI / 2;
  cyl.add(cylMesh);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.082, 8), STEEL_DARK);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * 0.032, Math.sin(a) * 0.032, 0);
    cyl.add(hole);
    const slug = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 8), BRASS);
    slug.rotation.x = Math.PI / 2;
    slug.position.set(Math.cos(a) * 0.032, Math.sin(a) * 0.032, 0.01);
    slug.name = `slug${i}`;
    cyl.add(slug);
  }
  root.add(cyl);

  add(root, new THREE.BoxGeometry(0.015, 0.015, 0.06), ACCENT, 0.038, 0.0, 0.0);

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.03, 0.46);
  root.add(muzzle);

  const flash = makeFlash();
  flash.position.copy(muzzle.position);
  flash.scale.setScalar(0.7);
  root.add(flash);

  root.scale.setScalar(1.2);
  addOutlineToTree(root, OUTLINE_BLUE);
  return { root, muzzle, mag: null, cylinder: cyl, flash, kind: "revolver" };
}

function makeFlash() {
  const g = new THREE.ConeGeometry(0.07, 0.22, 8);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({
      color: 0xffe14a,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  m.visible = false;
  m.name = "flash";
  m.userData.noOutline = true; // transparent additive glow — an inverted-hull outline would look broken on it
  return m;
}

export function makeBulletMesh() {
  const g = new THREE.Group();
  const slug = new THREE.CylinderGeometry(0.035, 0.04, 0.16, 8);
  slug.rotateX(Math.PI / 2);
  add(g, slug, BRASS);
  const tip = new THREE.ConeGeometry(0.035, 0.08, 8);
  tip.rotateX(Math.PI / 2);
  add(g, tip, STEEL, 0, 0, 0.11);
  return g;
}

export function makeTracerMesh() {
  const g = new THREE.Group();
  const body = new THREE.BoxGeometry(0.03, 0.03, 0.42);
  add(g, body, LIME);
  const core = new THREE.BoxGeometry(0.016, 0.016, 0.5);
  add(g, core, mat(0xffe14a, { emissive: 0xffc020, emissiveIntensity: 0.9 }));
  return g;
}

export function makeMagPickup() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.16, 0.42, 0.22), STEEL_DARK, 0, 0, 0, 0.2);
  add(g, new THREE.BoxGeometry(0.18, 0.05, 0.24), ACCENT, 0, -0.18, 0, 0.2);
  add(g, new THREE.BoxGeometry(0.18, 0.05, 0.24), ACCENT, 0, 0.16, 0, 0.2);
  g.scale.setScalar(1.15);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function makeAmmoPickup() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const slug = new THREE.CylinderGeometry(0.04, 0.045, 0.18, 8);
    add(g, slug, BRASS, (i - 1) * 0.1, 0, 0, 0.15 * (i - 1));
  }
  g.scale.setScalar(1.2);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function setCylinderSlugs(gun: GunRig, loaded: number) {
  if (!gun.cylinder) return;
  for (let i = 0; i < 6; i++) {
    const slug = gun.cylinder.getObjectByName(`slug${i}`);
    if (slug) slug.visible = i < loaded;
  }
}

// --- Urf Archer's bow — third weapon, unlimited arrows, no reload ---

export function makeBow(): GunRig {
  const root = new THREE.Group();
  root.name = "bow";

  // Urf Archer-style tall recurve: a continuous asymmetric wooden stave, curled
  // tips, wrapped grip, visibly drawn string, and a full-sized nocked arrow.
  const staveCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.62, -0.1),
    new THREE.Vector3(0, -0.42, 0.08),
    new THREE.Vector3(0, -0.17, 0.15),
    new THREE.Vector3(0, 0, 0.11),
    new THREE.Vector3(0, 0.2, 0.16),
    new THREE.Vector3(0, 0.45, 0.06),
    new THREE.Vector3(0, 0.65, -0.12),
  ]);
  const stave = new THREE.Mesh(new THREE.TubeGeometry(staveCurve, 48, 0.027, 8, false), WOOD);
  root.add(stave);
  add(root, new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10), STEEL_DARK, 0, 0, 0.11);
  for (let i = 0; i < 5; i++) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.008, 5, 12), ACCENT);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, -0.08 + i * 0.04, 0.11);
    root.add(wrap);
  }
  const stringPoints = [
    new THREE.Vector3(0, -0.62, -0.1),
    new THREE.Vector3(0, 0, -0.22),
    new THREE.Vector3(0, 0.65, -0.12),
  ];
  const string = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(stringPoints),
    new THREE.LineBasicMaterial({ color: 0xf8efff, transparent: true, opacity: 0.95 }),
  );
  root.add(string);

  const arrow = new THREE.Group();
  const shaft = new THREE.CylinderGeometry(0.012, 0.012, 0.95, 8);
  shaft.rotateX(Math.PI / 2);
  add(arrow, shaft, WOOD, 0, 0, 0.25);
  const tip = new THREE.ConeGeometry(0.032, 0.12, 6);
  tip.rotateX(Math.PI / 2);
  add(arrow, tip, STEEL, 0, 0, 0.79);
  for (let i = 0; i < 3; i++) {
    const fletch = new THREE.ConeGeometry(0.04, 0.13, 3);
    fletch.rotateX(-Math.PI / 2);
    add(arrow, fletch, ACCENT, 0, 0, -0.2, 0, 0, (i / 3) * Math.PI * 2);
  }
  root.add(arrow);

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 0.86);
  root.add(muzzle);

  const flash = makeFlash();
  flash.position.copy(muzzle.position);
  flash.scale.setScalar(0.5);
  root.add(flash);

  root.scale.setScalar(1.05);
  addOutlineToTree(root, OUTLINE_BLUE);
  return { root, muzzle, mag: null, cylinder: null, flash, kind: "bow" };
}

// --- Flying can projectiles: the AK and revolver now lob these instead of bullets —
// slow, long-ranged, and big enough to actually see coming (and dodge, in PvP). ---

export type CanFlavor = "pepsi" | "monster" | "yoohoo";

export function makeFlyingCan(flavor: CanFlavor): THREE.Group {
  const g = new THREE.Group();
  const bodyColor = flavor === "pepsi" ? 0x123a8a : flavor === "monster" ? 0x0e1a0a : 0x6a4416;
  const bandColor = flavor === "pepsi" ? 0xe12222 : flavor === "monster" ? 0x7cff3a : 0xf2d84a;
  const body = new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12);
  body.rotateZ(Math.PI / 2);
  add(g, body, mat(bodyColor, { metalness: 0.5, roughness: 0.35 }));
  const band = new THREE.CylinderGeometry(0.112, 0.112, 0.07, 12);
  band.rotateZ(Math.PI / 2);
  add(g, band, mat(bandColor, { emissive: bandColor, emissiveIntensity: 0.35, roughness: 0.4 }), 0.02, 0, 0);
  const capGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12);
  capGeo.rotateZ(Math.PI / 2);
  add(g, capGeo, STEEL, 0.17, 0, 0);
  add(g, capGeo, STEEL, -0.17, 0, 0);
  g.scale.setScalar(2.4);
  g.userData.tumble = true;
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function makeArrowMesh() {
  const g = new THREE.Group();
  const shaft = new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8);
  shaft.rotateX(Math.PI / 2);
  add(g, shaft, WOOD);
  const tip = new THREE.ConeGeometry(0.055, 0.18, 6);
  tip.rotateX(Math.PI / 2);
  add(g, tip, STEEL, 0, 0, 0.71);
  for (let i = 0; i < 3; i++) {
    const fletch = new THREE.ConeGeometry(0.055, 0.16, 3);
    fletch.rotateX(-Math.PI / 2);
    add(g, fletch, ACCENT, 0, 0, -0.54, 0, (i / 3) * Math.PI * 2, 0);
  }
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

// --- Ported flavor pickups (Bongo Lab / Site Economy assets) ---

export function makeBananaPickup() {
  const g = new THREE.Group();
  const bananaMat = mat(0xf2e14a, { metalness: 0.05, roughness: 0.5, emissive: 0x6a5a10, emissiveIntensity: 0.2 });
  const tipMat = mat(0x3a2a10, { metalness: 0.05, roughness: 0.6 });
  const arc = new THREE.TorusGeometry(0.22, 0.06, 6, 10, Math.PI * 0.9);
  const body = new THREE.Mesh(arc, bananaMat);
  body.rotation.z = Math.PI * 0.55;
  g.add(body);
  add(g, new THREE.ConeGeometry(0.035, 0.08, 6), tipMat, 0.2, 0.14, 0, 0, 0, 1.4);
  add(g, new THREE.ConeGeometry(0.03, 0.06, 6), tipMat, -0.2, -0.05, 0, 0, 0, -1.6);
  g.scale.setScalar(1.1);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function makeMonsterCanPickup() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), mat(0x0e1a0a, { metalness: 0.5, roughness: 0.35 }), 0, 0, 0);
  add(g, new THREE.CylinderGeometry(0.112, 0.112, 0.05, 12), LIME, 0, 0.06, 0);
  add(g, new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12), STEEL, 0, 0.17, 0);
  g.scale.setScalar(1.05);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function makePepsiAmmoPickup() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), mat(0x123a8a, { metalness: 0.55, roughness: 0.32 }), 0, 0, 0);
  add(g, new THREE.CylinderGeometry(0.112, 0.112, 0.06, 12), mat(0xe12222, { metalness: 0.2, roughness: 0.4 }), 0, 0.02, 0);
  add(g, new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12), STEEL, 0, 0.17, 0);
  g.scale.setScalar(1.05);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function makeGoldRatMeatPickup() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.13, 0.13, 0.24, 12), BRASS, 0, 0, 0);
  add(g, new THREE.CylinderGeometry(0.135, 0.135, 0.04, 12), STEEL_DARK, 0, 0.14, 0);
  add(g, new THREE.CylinderGeometry(0.135, 0.135, 0.04, 12), STEEL_DARK, 0, -0.14, 0);
  add(g, new THREE.OctahedronGeometry(0.05, 0), mat(0xffe14a, { emissive: 0xffb020, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.3 }), 0, 0, 0.14);
  g.scale.setScalar(1.05);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

// --- Jetpack: a permanent-for-the-run power-up, worn on the back once collected ---

export function makeJetpackProp() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.22, 0.34, 0.14), STEEL_DARK, 0, 0, 0);
  add(g, new THREE.CylinderGeometry(0.07, 0.08, 0.4, 10), STEEL, -0.09, -0.02, -0.02);
  add(g, new THREE.CylinderGeometry(0.07, 0.08, 0.4, 10), STEEL, 0.09, -0.02, -0.02);
  const flameMat = mat(0xffb020, { emissive: 0xff6a10, emissiveIntensity: 0.8, metalness: 0, roughness: 0.4 });
  add(g, new THREE.ConeGeometry(0.05, 0.16, 8), flameMat, -0.09, -0.3, -0.02, Math.PI);
  add(g, new THREE.ConeGeometry(0.05, 0.16, 8), flameMat, 0.09, -0.3, -0.02, Math.PI);
  add(g, new THREE.BoxGeometry(0.05, 0.2, 0.03), ACCENT, 0, 0.02, 0.09);
  g.scale.setScalar(1.1);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

// --- Vehicles, ported as touch-to-activate speed-boost props (not drivable rigs) ---

export function makeUrfRoverProp() {
  const g = new THREE.Group();
  const chassisMat = mat(0xe14bff, { metalness: 0.3, roughness: 0.4, emissive: 0x6a1088, emissiveIntensity: 0.25 });
  add(g, new THREE.BoxGeometry(0.6, 0.22, 0.9), chassisMat, 0, 0.22, 0);
  add(g, new THREE.BoxGeometry(0.5, 0.16, 0.5), STEEL_DARK, 0, 0.4, -0.1);
  const wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const corners: Array<[number, number]> = [
    [-0.32, 0.32],
    [0.32, 0.32],
    [-0.32, -0.32],
    [0.32, -0.32],
  ];
  for (const [x, z] of corners) add(g, wheelGeo, STEEL_DARK, x, 0.16, z);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), STEEL, -0.24, 0.55, -0.35, 0, 0, 0.25);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), STEEL, 0.24, 0.55, -0.35, 0, 0, -0.25);
  g.scale.setScalar(0.9);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}

export function makePenguinBiplaneProp() {
  const g = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(0.1, 0.06, 0.7, 10);
  bodyGeo.rotateX(Math.PI / 2);
  add(g, bodyGeo, mat(0xf2f6ff, { metalness: 0.1, roughness: 0.4 }), 0, 0, 0);
  const wingMat = mat(0x1c3f7a, { metalness: 0.2, roughness: 0.45, emissive: 0x0a1a3a, emissiveIntensity: 0.3 });
  add(g, new THREE.BoxGeometry(0.9, 0.03, 0.18), wingMat, 0, 0.06, 0.05);
  add(g, new THREE.BoxGeometry(0.7, 0.03, 0.14), wingMat, 0, -0.05, 0.1);
  add(g, new THREE.BoxGeometry(0.03, 0.18, 0.14), wingMat, 0, 0.12, -0.32);
  add(g, new THREE.BoxGeometry(0.03, 0.32, 0.03), STEEL_DARK, 0, 0, 0.36);
  g.scale.setScalar(0.85);
  addOutlineToTree(g, OUTLINE_BLUE);
  return g;
}
