import * as THREE from "three";
import type { AmmoCan, WeaponId } from "./characters";

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

const STEEL = mat(0x2c3238, { metalness: 0.82, roughness: 0.28 });
const STEEL_DARK = mat(0x14181c, { metalness: 0.75, roughness: 0.32 });
const WOOD = mat(0x5a3218, { roughness: 0.72, metalness: 0.05 });
const POLY = mat(0x1a2420, { roughness: 0.5, metalness: 0.15, emissive: 0x0a2010, emissiveIntensity: 0.12 });
const ACCENT = mat(0xe14bff, { emissive: 0x8010c0, emissiveIntensity: 0.45, roughness: 0.35 });
const BRASS = mat(0xc8a24a, { metalness: 0.7, roughness: 0.32, emissive: 0x4a3008, emissiveIntensity: 0.15 });
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
  return m;
}

function makeCanProjectile(scale = 1, glow = false) {
  const g = new THREE.Group();
  const blue = mat(0x1459d8, { metalness: .72, roughness: .2, emissive: glow ? 0x063ecb : 0x000000, emissiveIntensity: glow ? .9 : 0 });
  const silver = mat(0xdce7f1, { metalness: .9, roughness: .15 });
  const red = mat(0xe92a3d, { metalness: .35, roughness: .24, emissive: glow ? 0x8e0715 : 0x000000, emissiveIntensity: glow ? .7 : 0 });
  const body = new THREE.CylinderGeometry(.075, .075, .22, 14);
  body.rotateX(Math.PI / 2);
  const canBody = add(g, body, blue);
  canBody.userData.canPart = "body";
  const rim = new THREE.TorusGeometry(.071, .009, 5, 14);
  add(g, rim, silver, 0, 0, -.11);
  add(g, rim.clone(), silver, 0, 0, .11);
  const badge = add(g, new THREE.BoxGeometry(.12, .045, .006), silver, 0, .015, .076);
  badge.userData.canPart = "badge";
  const slash = add(g, new THREE.BoxGeometry(.07, .052, .008), red, -.024, -.018, .08, 0, 0, -.45);
  slash.userData.canPart = "slash";
  g.scale.setScalar(scale);
  g.userData.projectile = "PEPSI CAN";
  return g;
}

export function setProjectileCan(root: THREE.Object3D, kind: AmmoCan) {
  const colors = kind === "pepsi" ? {body:0x1459d8,badge:0xdce7f1,slash:0xe92a3d} : kind === "yoohoo" ? {body:0x6c3018,badge:0xf4d34f,slash:0x351208} : {body:0x101512,badge:0x8aff39,slash:0x39ff82};
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !node.userData.canPart) return;
    const material = node.material as THREE.MeshStandardMaterial;
    material.color.setHex(colors[node.userData.canPart as keyof typeof colors]);
    if (node.userData.canPart === "body") material.map = projectileCanTexture(kind);
    material.needsUpdate = true;
  });
  root.userData.projectile = `${kind.toUpperCase()} CAN`;
}

const projectileCanTextures = new Map<AmmoCan, THREE.CanvasTexture>();
function projectileCanTexture(kind: AmmoCan) {
  const cached=projectileCanTextures.get(kind); if(cached) return cached;
  const canvas=document.createElement("canvas"); canvas.width=256; canvas.height=128;
  const ctx=canvas.getContext("2d")!;
  const colors=kind==="pepsi"?["#124fd0","#e72b42"]:kind==="yoohoo"?["#6b2b16","#f4d34f"]:["#070b08","#7cff39"];
  const gradient=ctx.createLinearGradient(0,0,256,0); gradient.addColorStop(0,colors[0]); gradient.addColorStop(.5,colors[1]); gradient.addColorStop(1,colors[0]);
  ctx.fillStyle=gradient; ctx.fillRect(0,0,256,128); ctx.fillStyle="#fff"; ctx.font="900 30px Arial Black"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(kind.toUpperCase(),128,64);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.wrapS=THREE.RepeatWrapping; projectileCanTextures.set(kind,texture); return texture;
}

export function makeBulletMesh() { return makeCanProjectile(1.05, false); }

export function makeTracerMesh() {
  return makeCanProjectile(.92, true);
}

export function makeMagPickup() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.16, 0.42, 0.22), STEEL_DARK, 0, 0, 0, 0.2);
  add(g, new THREE.BoxGeometry(0.18, 0.05, 0.24), ACCENT, 0, -0.18, 0, 0.2);
  add(g, new THREE.BoxGeometry(0.18, 0.05, 0.24), ACCENT, 0, 0.16, 0, 0.2);
  g.scale.setScalar(1.15);
  return g;
}

export function makeAmmoPickup() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const slug = new THREE.CylinderGeometry(0.04, 0.045, 0.18, 8);
    add(g, slug, BRASS, (i - 1) * 0.1, 0, 0, 0.15 * (i - 1));
  }
  g.scale.setScalar(1.2);
  return g;
}

export function setCylinderSlugs(gun: GunRig, loaded: number) {
  if (!gun.cylinder) return;
  for (let i = 0; i < 6; i++) {
    const slug = gun.cylinder.getObjectByName(`slug${i}`);
    if (slug) slug.visible = i < loaded;
  }
}
