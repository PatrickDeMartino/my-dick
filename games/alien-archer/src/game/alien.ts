import * as THREE from "three";
import { CHARACTERS, type AlienId, type WeaponId } from "./characters";
import { makeAK47, makeRevolver, setCylinderSlugs, type GunRig } from "./weapons";

export type AlienRig = {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  chest: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  forearmL: THREE.Group;
  forearmR: THREE.Group;
  handL: THREE.Group;
  handR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  antennaL: THREE.Group | null;
  antennaR: THREE.Group | null;
  ak: GunRig;
  revolver: GunRig;
  gunMount: THREE.Group;
  backMount: THREE.Group;
  hipMount: THREE.Group;
  jetpack: THREE.Group;
  jetFlames: THREE.Mesh[];
  walkPhase: number;
  landSquash: number;
  shootKick: number;
  kind: AlienId;
  skinHex: number;
};

function skinMat(color: number, extra?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.46,
    metalness: 0.04,
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
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function createAlien(kind: AlienId): AlienRig {
  const def = CHARACTERS[kind];
  const skin = skinMat(def.skin, { emissive: def.emissive, emissiveIntensity: 0.2 });
  const skinDark = skinMat(def.skinDark);
  const skinDeep = skinMat(def.skinDeep);
  const eye = new THREE.MeshStandardMaterial({
    color: 0x0b0d10,
    roughness: 0.2,
    metalness: 0.15,
    flatShading: true,
  });
  const gloss = new THREE.MeshStandardMaterial({
    color: 0xe8fff4,
    emissive: 0xb8ffe0,
    emissiveIntensity: 0.45,
    roughness: 0.18,
    flatShading: true,
  });
  const wrap = skinMat(kind === "vex" ? 0x3ae8ff : 0x6b2d9b, {
    roughness: 0.5,
    emissive: kind === "vex" ? 0x1288aa : 0x4a1060,
    emissiveIntensity: 0.25,
  });

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.9;
  root.add(hips);

  add(hips, new THREE.SphereGeometry(0.16, 12, 8), skinDark, 0, 0, 0, 0, 0, 0, 1.15, 0.55, 0.85);

  const torso = new THREE.Group();
  torso.position.y = 0.12;
  hips.add(torso);
  add(torso, new THREE.SphereGeometry(0.17, 12, 8), skin, 0, 0.16, 0, 0, 0, 0, 0.95, 1.15, 0.7);
  add(torso, new THREE.CylinderGeometry(0.09, 0.13, 0.28, 10), skinDark, 0, 0.02, 0);

  const chest = new THREE.Group();
  chest.position.y = 0.34;
  torso.add(chest);
  add(chest, new THREE.SphereGeometry(0.2, 12, 8), skin, 0, 0.02, 0.02, 0, 0, 0, 1.05, 0.7, 0.72);

  if (kind === "vex") {
    add(
      chest,
      new THREE.OctahedronGeometry(0.07, 1),
      new THREE.MeshStandardMaterial({
        color: 0x3ae8ff,
        emissive: 0x1288aa,
        emissiveIntensity: 0.8,
        flatShading: true,
        roughness: 0.2,
      }),
      0,
      0.02,
      0.16,
    );
  }

  const neckH = kind === "zix" ? 0.16 : 0.1;
  add(chest, new THREE.CylinderGeometry(0.055, 0.07, neckH, 10), skinDark, 0, 0.16 + (neckH - 0.1) * 0.4, 0.02);

  const head = new THREE.Group();
  head.position.set(0, 0.34 + (kind === "zix" ? 0.08 : 0), 0.04);
  chest.add(head);

  const headScale = kind === "pip" ? 1.22 : kind === "zix" ? 1.08 : 1;
  const cranium = new THREE.IcosahedronGeometry(0.28, 2);
  add(head, cranium, skin, 0, 0.1, 0, 0, 0, 0, 0.92 * headScale, 1.22 * headScale, 1.05 * headScale);
  add(head, new THREE.SphereGeometry(0.16, 10, 8), skinDark, 0, -0.08, 0.04, 0, 0, 0, 0.85, 0.7, 0.9);

  const eyeGeo = new THREE.SphereGeometry(0.095, 12, 8);
  const eyeW = kind === "pip" ? 1.05 : 1;
  add(head, eyeGeo, eye, -0.12, 0.07, 0.24, -0.15, 0.38, 0.15, 0.95 * eyeW, 1.2, 0.42);
  add(head, eyeGeo, eye, 0.12, 0.07, 0.24, -0.15, -0.38, -0.15, 0.95 * eyeW, 1.2, 0.42);
  add(head, new THREE.SphereGeometry(0.02, 8, 6), gloss, -0.09, 0.1, 0.275);
  add(head, new THREE.SphereGeometry(0.02, 8, 6), gloss, 0.145, 0.1, 0.275);

  let antennaL: THREE.Group | null = null;
  let antennaR: THREE.Group | null = null;
  if (kind === "pip") {
    antennaL = makeGiraffeAntenna(-1, skin, skinDark, wrap);
    antennaR = makeGiraffeAntenna(1, skin, skinDark, wrap);
    head.add(antennaL, antennaR);
  } else if (kind === "zix") {
    add(head, new THREE.SphereGeometry(0.04, 8, 6), skinDark, -0.08, 0.32, -0.02);
    add(head, new THREE.SphereGeometry(0.04, 8, 6), skinDark, 0.08, 0.32, -0.02);
  } else if (kind === "vex") {
    const crystal = new THREE.MeshStandardMaterial({
      color: 0xe14bff,
      emissive: 0x8010c0,
      emissiveIntensity: 0.55,
      flatShading: true,
      roughness: 0.22,
    });
    add(head, new THREE.ConeGeometry(0.04, 0.16, 6), crystal, -0.1, 0.34, -0.02, 0.15);
    add(head, new THREE.ConeGeometry(0.035, 0.12, 6), crystal, 0.1, 0.32, -0.02, -0.12);
  } else if (kind === "pongo") {
    const ear = skinMat(0xa9653f);
    add(head, new THREE.SphereGeometry(.105, 10, 8), ear, -.25, .08, -.01, 0, 0, 0, .52, 1, .42);
    add(head, new THREE.SphereGeometry(.105, 10, 8), ear, .25, .08, -.01, 0, 0, 0, .52, 1, .42);
    add(head, new THREE.SphereGeometry(.16, 12, 8), ear, 0, -.035, .22, 0, 0, 0, 1.05, .7, .75);
    add(head, new THREE.SphereGeometry(.035, 8, 6), eye, -.05, -.02, .33);
    add(head, new THREE.SphereGeometry(.035, 8, 6), eye, .05, -.02, .33);
  }

  function makeArm(side: number, visible = true) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.22, 0.02, 0.02);
    chest.add(arm);
    if (visible) add(arm, new THREE.SphereGeometry(0.07, 10, 8), skinDark, 0, 0, 0);
    if (visible) add(arm, new THREE.CylinderGeometry(0.045, 0.055, 0.34, 10), skin, 0, -0.17, 0);
    const forearmG = new THREE.Group();
    forearmG.position.y = -0.34;
    arm.add(forearmG);
    if (visible) add(forearmG, new THREE.SphereGeometry(0.05, 8, 6), skinDark, 0, 0, 0);
    if (visible) add(forearmG, new THREE.CylinderGeometry(0.035, 0.045, 0.32, 10), skin, 0, -0.16, 0);
    const hand = new THREE.Group();
    hand.position.y = -0.34;
    forearmG.add(hand);
    if (visible) add(hand, new THREE.SphereGeometry(0.06, 10, 8), skin, 0, -0.01, 0.01, 0, 0, 0, .88, 1.25, .9);
    return { arm, forearmG, hand };
  }

  const left = makeArm(-1, false);
  const right = makeArm(1);

  function makeLeg(side: number) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, 0, 0);
    hips.add(leg);
    add(leg, new THREE.SphereGeometry(0.08, 10, 8), skinDark, 0, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.05, 0.065, 0.4, 10), skin, 0, -0.2, 0);
    const shin = new THREE.Group();
    shin.position.y = -0.4;
    leg.add(shin);
    add(shin, new THREE.SphereGeometry(0.055, 8, 6), skinDark, 0, 0, 0);
    add(shin, new THREE.CylinderGeometry(0.038, 0.05, 0.4, 10), skin, 0, -0.2, 0);
    const foot = new THREE.Group();
    foot.position.set(0, -0.42, 0.04);
    shin.add(foot);
    add(foot, new THREE.BoxGeometry(0.1, 0.05, 0.16), skinDark, 0, 0, 0.04);
    for (let i = 0; i < 3; i++) {
      const toe = new THREE.ConeGeometry(0.022, 0.1, 5);
      toe.rotateX(Math.PI / 2);
      add(foot, toe, skinDeep, (i - 1) * 0.032, -0.01, 0.14, 0.15, 0, 0);
    }
    return { leg, shin };
  }

  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  const gunMount = new THREE.Group();
  gunMount.position.set(0.12, 0.02, 0.28);
  right.hand.add(gunMount);

  const ak = makeAK47();
  const revolver = makeRevolver();
  gunMount.add(ak.root, revolver.root);

  const backMount = new THREE.Group();
  backMount.position.set(0.08, 0.04, -0.22);
  backMount.rotation.set(-0.5, 0.4, 0.3);
  chest.add(backMount);

  const hipMount = new THREE.Group();
  hipMount.position.set(0.16, -0.05, 0.05);
  hipMount.rotation.set(0.2, 0, 0.4);
  hips.add(hipMount);

  const jetpack = new THREE.Group();
  jetpack.position.set(0, .02, -.3);
  chest.add(jetpack);
  const jetMetal = new THREE.MeshStandardMaterial({ color:0x43505c, metalness:.86, roughness:.28, flatShading:true });
  const jetBlue = new THREE.MeshBasicMaterial({ color:0x58efff, transparent:true, opacity:.9 });
  const jetFlames: THREE.Mesh[] = [];
  [-1,1].forEach((side) => {
    add(jetpack, new THREE.CylinderGeometry(.08,.1,.42,9), jetMetal, side*.115,0,0);
    const flame=add(jetpack,new THREE.ConeGeometry(.075,.34,8),jetBlue,side*.115,-.37,0,0,0,Math.PI);
    flame.visible=false;
    jetFlames.push(flame);
  });

  if (kind === "pongo") {
    torso.scale.set(1.2, .92, 1.08);
    left.arm.scale.set(1.08, 1.3, 1.08);
    right.arm.scale.set(1.08, 1.3, 1.08);
  }

  root.scale.setScalar(def.scale);

  return {
    root,
    hips,
    torso,
    chest,
    head,
    armL: left.arm,
    armR: right.arm,
    forearmL: left.forearmG,
    forearmR: right.forearmG,
    handL: left.hand,
    handR: right.hand,
    legL: legL.leg,
    legR: legR.leg,
    shinL: legL.shin,
    shinR: legR.shin,
    antennaL,
    antennaR,
    ak,
    revolver,
    gunMount,
    backMount,
    hipMount,
    jetpack,
    jetFlames,
    walkPhase: 0,
    landSquash: 0,
    shootKick: 0,
    kind,
    skinHex: def.skin,
  };
}

function makeGiraffeAntenna(side: number, skin: THREE.Material, skinDark: THREE.Material, wrap: THREE.Material) {
  const g = new THREE.Group();
  g.position.set(side * 0.12, 0.38, -0.04);
  g.rotation.z = side * 0.22;
  g.rotation.x = -0.22;
  add(g, new THREE.CylinderGeometry(0.028, 0.042, 0.82, 10), skin, 0, 0.4, 0);
  add(g, new THREE.SphereGeometry(0.07, 10, 8), wrap, 0, 0.84, 0);
  const spot = new THREE.MeshStandardMaterial({
    color: 0x3a6a12,
    roughness: 0.55,
    flatShading: true,
    emissive: 0x1a3a08,
    emissiveIntensity: 0.2,
  });
  for (let i = 0; i < 6; i++) {
    add(g, new THREE.SphereGeometry(0.024, 6, 5), spot, side * 0.03, 0.14 + i * 0.12, 0.03);
  }
  return g;
}

export type AlienAnim = {
  dt: number;
  speed: number;
  grounded: boolean;
  vy: number;
  justLanded: boolean;
  justShot: boolean;
  attract: boolean;
  time: number;
  weapon: WeaponId;
  firing: boolean;
  aimPitch: number;
  reload: number;
  revLoaded: number;
  jetting: boolean;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function updateAlien(rig: AlienRig, a: AlienAnim) {
  if (a.justLanded) rig.landSquash = 1;
  if (a.justShot) rig.shootKick = 1;
  rig.landSquash = Math.max(0, rig.landSquash - a.dt * 4.5);
  rig.shootKick = Math.max(0, rig.shootKick - a.dt * 7);

  const spd = a.speed;
  const walk = Math.min(1, spd / 4);
  if (a.grounded && spd > 0.2) rig.walkPhase += a.dt * (6 + spd * 1.4);
  else if (!a.grounded) rig.walkPhase += a.dt * 2;
  else rig.walkPhase += a.dt * 0.6;

  const ph = rig.walkPhase;
  const swing = Math.sin(ph) * walk;
  const bob = a.grounded ? Math.abs(Math.sin(ph)) * 0.045 * walk : 0;

  const sq = 1 - rig.landSquash * 0.1;
  const def = CHARACTERS[rig.kind];
  const base = def.scale;
  rig.root.scale.set(base * (1 + (1 - sq) * 0.55), base * sq, base * (1 + (1 - sq) * 0.55));

  rig.hips.position.y = 0.9 + bob;
  rig.hips.rotation.z = swing * 0.06;
  rig.torso.rotation.x = walk * 0.12 + (a.grounded ? 0 : -0.15);
  rig.chest.rotation.y = swing * -0.1;

  const breath = Math.sin(a.time * 2.2) * 0.012;
  rig.chest.scale.setScalar(1 + breath);
  rig.jetFlames.forEach((flame,index)=>{
    flame.visible=a.jetting;
    flame.scale.y=a.jetting ? .75+Math.sin(a.time*26+index)*.22 : .01;
  });

  const ak = a.weapon === "ak";
  const rel = THREE.MathUtils.clamp(a.reload, 0, 1);
  const kick = rig.shootKick;

  const airTuck = a.grounded ? 0 : THREE.MathUtils.clamp(-a.vy * 0.04, -0.4, 0.6);
  rig.legL.rotation.x = swing * 0.7 + airTuck;
  rig.legR.rotation.x = -swing * 0.7 + airTuck * 0.6;
  rig.legL.rotation.z = 0.09;
  rig.legR.rotation.z = -0.09;
  rig.shinL.rotation.x = Math.max(0, -swing) * 0.5;
  rig.shinR.rotation.x = Math.max(0, swing) * 0.5;

  rig.armR.rotation.order = "ZYX";
  rig.armR.rotation.set(-1.46 + a.aimPitch - kick * .18, -.08, -.08);
  rig.forearmR.rotation.set(-.06 - rel * .28, 0, 0);

  rig.head.rotation.x = -0.04 + Math.sin(a.time * 1.4) * 0.03;
  rig.head.rotation.y = swing * -0.06;

  if (rig.antennaL && rig.antennaR) {
    const wiggle = Math.sin(a.time * 3.2) * 0.12 + swing * 0.2;
    rig.antennaL.rotation.x = -0.15 + wiggle;
    rig.antennaR.rotation.x = -0.15 - wiggle * 0.8;
    rig.antennaL.rotation.z = -0.18 + Math.sin(a.time * 2.1) * 0.08;
    rig.antennaR.rotation.z = 0.18 + Math.cos(a.time * 2.4) * 0.08;
  }

  const gun = ak ? rig.ak : rig.revolver;
  const other = ak ? rig.revolver : rig.ak;
  if (gun.root.parent !== rig.gunMount) rig.gunMount.add(gun.root);
  if (ak) {
    if (other.root.parent !== rig.hipMount) rig.hipMount.add(other.root);
    other.root.rotation.set(1.2, 0, 0.2);
    other.root.scale.setScalar(0.85);
  } else {
    if (other.root.parent !== rig.backMount) rig.backMount.add(other.root);
    other.root.rotation.set(0.2, 0, 0.4);
    other.root.scale.setScalar(0.9);
  }

  gun.root.rotation.set(rel * 0.4, 0, 0);
  gun.root.position.set(0, -kick * 0.04, -kick * 0.08);
  gun.root.scale.setScalar(ak ? 1.15 : 1.2);
  gun.flash.visible = kick > 0.55;
  if (gun.flash.visible) {
    gun.flash.scale.setScalar(0.7 + kick * 0.8);
  }

  if (ak) {
    rig.gunMount.position.set(0, -.02 + rel * -.05, .12);
    rig.gunMount.rotation.set(-Math.PI / 2, 0.08, 0.05);
    if (gun.mag) gun.mag.visible = rel < 0.45 || rel > 0.7;
  } else {
    rig.gunMount.position.set(0, -.02, .1);
    rig.gunMount.rotation.set(-Math.PI / 2, 0.04, 0.02);
    if (gun.cylinder) {
      gun.cylinder.rotation.z = rel * 0.9;
      setCylinderSlugs(gun, a.revLoaded);
    }
  }

  if (a.attract) {
    rig.head.rotation.y = Math.sin(a.time * 0.35) * 0.22;
    rig.gunMount.rotation.y = Math.sin(a.time * 0.5) * 0.08;
  }
}

export function getMuzzleWorld(rig: AlienRig, weapon: WeaponId, target: THREE.Vector3) {
  const g = weapon === "ak" ? rig.ak : rig.revolver;
  g.muzzle.getWorldPosition(target);
  return target;
}
