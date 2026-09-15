import * as THREE from "three";
import { CHARACTERS, type AlienId, type WeaponId } from "./characters";
import { makeAK47, makeRevolver, makeBow, makeJetpackProp, setCylinderSlugs, type GunRig } from "./weapons";
import { addOutlineMesh, OUTLINE_PURPLE, OUTLINE_BLUE, OUTLINE_RED } from "./outline";

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
  bow: GunRig;
  gunMount: THREE.Group;
  backMount: THREE.Group;
  hipMount: THREE.Group;
  quiverMount: THREE.Group;
  backpackMount: THREE.Group;
  jetpackMesh: THREE.Group | null;
  walkPhase: number;
  landSquash: number;
  shootKick: number;
  kind: AlienId;
  skinHex: number;
  // Secondary-motion spring state (torso/chest/head "flop" instead of snapping straight
  // to their target pose) — see springTo() in updateAlien.
  springVel: { hipsZ: number; torsoX: number; chestY: number; headX: number; headY: number };
  // PIP only: the three skin-tone materials plus their original saturation/lightness, so
  // the chameleon hue-cycle can rotate color while preserving the light/dark shading.
  chameleon: {
    skin: THREE.MeshStandardMaterial;
    skinDark: THREE.MeshStandardMaterial;
    skinDeep: THREE.MeshStandardMaterial;
    sSkin: number;
    lSkin: number;
    sDark: number;
    lDark: number;
    sDeep: number;
    lDeep: number;
  } | null;
};

// Bold cartoon outline (inverted-hull technique, see outline.ts) applied to the
// torso/chest/head/hips — the shapes that read as each character's silhouette — for
// the "neon trippy psychedelic pop art cartoonish" look, dark red/purple/blue palette.
const OUTLINE_BY_KIND: Record<AlienId, number> = {
  zix: OUTLINE_PURPLE,
  pip: OUTLINE_BLUE,
  vex: OUTLINE_RED,
  pongo: OUTLINE_PURPLE,
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
  const isPongo = kind === "pongo";
  const skin = skinMat(def.skin, { emissive: def.emissive, emissiveIntensity: 0.2 });
  const skinDark = skinMat(def.skinDark);
  const skinDeep = skinMat(def.skinDeep);
  const snout = isPongo ? skinMat(0xdcb488, { roughness: 0.58 }) : skinDark;
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

  // PIP is a psychedelic chameleon — track the three skin materials' original
  // saturation/lightness so updateAlien can rotate hue while keeping the shading.
  let chameleon: AlienRig["chameleon"] = null;
  if (kind === "pip") {
    const hs = { h: 0, s: 0, l: 0 };
    skin.color.getHSL(hs);
    const hd = { h: 0, s: 0, l: 0 };
    skinDark.color.getHSL(hd);
    const he = { h: 0, s: 0, l: 0 };
    skinDeep.color.getHSL(he);
    chameleon = { skin, skinDark, skinDeep, sSkin: hs.s, lSkin: hs.l, sDark: hd.s, lDark: hd.l, sDeep: he.s, lDeep: he.l };
  }

  const root = new THREE.Group();
  const hips = new THREE.Group();
  // Pongo's legs are much shorter now (see makeLeg) — the hip joint sits lower so his
  // feet still reach the ground instead of floating above it.
  const HIPS_Y = isPongo ? 0.5 : 0.9;
  hips.position.y = HIPS_Y;
  root.add(hips);

  const outlineColor = OUTLINE_BY_KIND[kind];
  const hipsMesh = add(hips, new THREE.SphereGeometry(0.16, 12, 8), skinDark, 0, 0, 0, 0, 0, 0, isPongo ? 1.32 : 1.15, 0.55, isPongo ? 1.05 : 0.85);
  addOutlineMesh(hipsMesh, outlineColor);

  const torso = new THREE.Group();
  torso.position.y = 0.12;
  hips.add(torso);
  const torsoMesh = add(torso, new THREE.SphereGeometry(0.17, 12, 8), skin, 0, 0.16, 0, 0, 0, 0, isPongo ? 1.15 : 0.95, isPongo ? 1.28 : 1.15, isPongo ? 0.92 : 0.7);
  addOutlineMesh(torsoMesh, outlineColor);
  add(torso, new THREE.CylinderGeometry(0.09, 0.13, 0.28, 10), skinDark, 0, 0.02, 0);

  const chest = new THREE.Group();
  chest.position.y = 0.34;
  torso.add(chest);
  const chestMesh = add(chest, new THREE.SphereGeometry(0.2, 12, 8), skin, 0, 0.02, 0.02, 0, 0, 0, isPongo ? 1.22 : 1.05, isPongo ? 0.82 : 0.7, isPongo ? 0.88 : 0.72);
  addOutlineMesh(chestMesh, outlineColor);

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

  const neckH = kind === "zix" ? 0.16 : isPongo ? 0.06 : 0.1;
  add(chest, new THREE.CylinderGeometry(0.055, isPongo ? 0.095 : 0.07, neckH, 10), skinDark, 0, 0.16 + (neckH - 0.1) * 0.4, 0.02);

  const head = new THREE.Group();
  head.position.set(0, 0.34 + (kind === "zix" ? 0.08 : isPongo ? -0.02 : 0), 0.04);
  chest.add(head);

  const headScale = kind === "pip" ? 1.22 : kind === "zix" ? 1.08 : isPongo ? 1.3 : 1;
  const cranium = isPongo ? new THREE.IcosahedronGeometry(0.28, 1) : new THREE.IcosahedronGeometry(0.28, 2);
  const headMesh = add(head, cranium, skinDark, 0, 0.1, 0, 0, 0, 0, (isPongo ? 1.05 : 0.92) * headScale, (isPongo ? 1.02 : 1.22) * headScale, (isPongo ? 1.0 : 1.05) * headScale);
  addOutlineMesh(headMesh, outlineColor, 1.09);

  if (isPongo) {
    // muzzle / snout patch — tan, protrudes forward-down like an ape face
    add(head, new THREE.SphereGeometry(0.15, 10, 8), snout, 0, -0.03, 0.16, 0.3, 0, 0, 0.82, 0.62, 0.7);
    add(head, new THREE.SphereGeometry(0.035, 8, 6), skinDeep, 0, -0.1, 0.27);
    // small round ears
    add(head, new THREE.SphereGeometry(0.075, 10, 8), skinDark, -0.24, 0.08, -0.02, 0, 0, 0, 0.55, 1, 0.85);
    add(head, new THREE.SphereGeometry(0.075, 10, 8), skinDark, 0.24, 0.08, -0.02, 0, 0, 0, 0.55, 1, 0.85);
  } else {
    add(head, new THREE.SphereGeometry(0.16, 10, 8), skinDark, 0, -0.08, 0.04, 0, 0, 0, 0.85, 0.7, 0.9);
  }

  // Big, expressive eyes — scaled up from the original for more personality.
  const eyeGeo = new THREE.SphereGeometry(isPongo ? 0.095 : 0.13, 12, 8);
  const eyeW = kind === "pip" ? 1.05 : isPongo ? 1.1 : 1;
  const eyeX = isPongo ? 0.095 : 0.125;
  const eyeZ = isPongo ? 0.24 : 0.27;
  add(head, eyeGeo, eye, -eyeX, 0.07, eyeZ, isPongo ? 0 : -0.15, isPongo ? 0.1 : 0.38, isPongo ? 0 : 0.15, 0.95 * eyeW, 1.05 * eyeW, isPongo ? 0.7 : 0.42);
  add(head, eyeGeo, eye, eyeX, 0.07, eyeZ, isPongo ? 0 : -0.15, isPongo ? -0.1 : -0.38, isPongo ? 0 : -0.15, 0.95 * eyeW, 1.05 * eyeW, isPongo ? 0.7 : 0.42);
  add(head, new THREE.SphereGeometry(0.028, 8, 6), gloss, -eyeX + 0.04, 0.1, eyeZ + 0.045);
  add(head, new THREE.SphereGeometry(0.028, 8, 6), gloss, eyeX + 0.04, 0.1, eyeZ + 0.045);

  let antennaL: THREE.Group | null = null;
  let antennaR: THREE.Group | null = null;
  if (kind === "pip") {
    antennaL = makeGiraffeAntenna(-1, skin, skinDark, wrap);
    antennaR = makeGiraffeAntenna(1, skin, skinDark, wrap);
    head.add(antennaL, antennaR);
  } else if (kind === "zix") {
    add(head, new THREE.SphereGeometry(0.04, 8, 6), skinDark, -0.08, 0.32, -0.02);
    add(head, new THREE.SphereGeometry(0.04, 8, 6), skinDark, 0.08, 0.32, -0.02);
  } else if (!isPongo) {
    const crystal = new THREE.MeshStandardMaterial({
      color: 0xe14bff,
      emissive: 0x8010c0,
      emissiveIntensity: 0.55,
      flatShading: true,
      roughness: 0.22,
    });
    add(head, new THREE.ConeGeometry(0.04, 0.16, 6), crystal, -0.1, 0.34, -0.02, 0.15);
    add(head, new THREE.ConeGeometry(0.035, 0.12, 6), crystal, 0.1, 0.32, -0.02, -0.12);
  }

  // Arms build hand-first: a smooth rounded nub (Powerpuff-style, no fingers to clip
  // through a held object) with a "grip" anchor right at its tip. Guns parent onto the
  // grip directly, so they are welded to wherever the hand actually is — never eyeballed.
  function makeArm(side: number, armScale: number) {
    const upperLen = 0.34 * armScale;
    const foreLen = 0.32 * armScale;
    const handR = 0.05 * (isPongo ? 1.55 : 1);

    const arm = new THREE.Group();
    arm.position.set(side * (isPongo ? 0.26 : 0.22), 0.02, 0.02);
    chest.add(arm);
    add(arm, new THREE.SphereGeometry(0.07 * (isPongo ? 1.2 : 1), 10, 8), skinDark, 0, 0, 0);
    add(arm, new THREE.CylinderGeometry(0.045 * (isPongo ? 1.35 : 1), 0.055 * (isPongo ? 1.35 : 1), upperLen, 10), skin, 0, -upperLen / 2, 0);

    const forearmG = new THREE.Group();
    forearmG.position.y = -upperLen;
    arm.add(forearmG);
    add(forearmG, new THREE.SphereGeometry(0.05 * (isPongo ? 1.25 : 1), 8, 6), skinDark, 0, 0, 0);
    add(forearmG, new THREE.CylinderGeometry(0.035 * (isPongo ? 1.3 : 1), 0.045 * (isPongo ? 1.3 : 1), foreLen, 10), skin, 0, -foreLen / 2, 0);

    const hand = new THREE.Group();
    hand.position.y = -foreLen;
    forearmG.add(hand);
    add(hand, new THREE.SphereGeometry(handR, 10, 8), skin, 0, -0.02, 0.008, 0, 0, 0, 1, 1.2, 1.02);

    // grip anchor: sits right past the tip of the nub — this is where held items attach
    const grip = new THREE.Group();
    grip.position.set(0, -handR * 1.7, handR * 0.35);
    hand.add(grip);

    return { arm, forearmG, hand, grip };
  }

  const left = makeArm(-1, isPongo ? 1.9 : 1);
  const right = makeArm(1, isPongo ? 1.9 : 1);

  function makeLeg(side: number) {
    // Pongo: short legs — most of his height and reach now come from his long arms
    // and torso, not his stride. His body proportions (HIPS_Y above) are shortened
    // to match so his feet still land on the ground instead of floating.
    const legLen = isPongo ? 0.17 : 0.4;
    const shinLen = isPongo ? 0.17 : 0.4;
    const leg = new THREE.Group();
    leg.position.set(side * (isPongo ? 0.15 : 0.1), 0, 0);
    hips.add(leg);
    add(leg, new THREE.SphereGeometry(0.08 * (isPongo ? 1.3 : 1), 10, 8), skinDark, 0, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.05 * (isPongo ? 1.5 : 1), 0.065 * (isPongo ? 1.5 : 1), legLen, 10), skin, 0, -legLen / 2, 0);
    const shin = new THREE.Group();
    shin.position.y = -legLen;
    leg.add(shin);
    add(shin, new THREE.SphereGeometry(0.055 * (isPongo ? 1.3 : 1), 8, 6), skinDark, 0, 0, 0);
    add(shin, new THREE.CylinderGeometry(0.038 * (isPongo ? 1.55 : 1), 0.05 * (isPongo ? 1.55 : 1), shinLen, 10), skin, 0, -shinLen / 2, 0);
    const foot = new THREE.Group();
    foot.position.set(0, -shinLen * 1.05, 0.04);
    shin.add(foot);
    add(foot, new THREE.BoxGeometry(0.1 * (isPongo ? 1.4 : 1), 0.05, 0.16 * (isPongo ? 1.4 : 1)), skinDark, 0, 0, 0.04);
    for (let i = 0; i < 3; i++) {
      const toe = new THREE.ConeGeometry(0.022, 0.1, 5);
      toe.rotateX(Math.PI / 2);
      add(foot, toe, skinDeep, (i - 1) * 0.032, -0.01, 0.14, 0.15, 0, 0);
    }
    // Foot-tip anchor is retained for future shoes/equipment and keeps both feet
    // consistently structured even though weapons now live in the right hand.
    const footGrip = new THREE.Group();
    footGrip.position.set(0, 0, 0.16 * (isPongo ? 1.4 : 1));
    foot.add(footGrip);
    return { leg, shin, foot, footGrip };
  }

  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // The active weapon is welded to the right-hand grip for every raider. Pongo's
  // left hand stays free for his asymmetric knuckle-walk.
  const gunMount = new THREE.Group();
  gunMount.rotation.set(Math.PI / 2, 0, 0);
  gunMount.position.set(0, 0, 0.05);
  right.grip.add(gunMount);

  const ak = makeAK47();
  const revolver = makeRevolver();
  const bow = makeBow();
  gunMount.add(ak.root, revolver.root, bow.root);

  const backMount = new THREE.Group();
  backMount.position.set(0.08, 0.04, -0.22);
  backMount.rotation.set(-0.5, 0.4, 0.3);
  chest.add(backMount);

  const hipMount = new THREE.Group();
  hipMount.position.set(0.16, -0.05, 0.05);
  hipMount.rotation.set(0.2, 0, 0.4);
  hips.add(hipMount);

  const quiverMount = new THREE.Group();
  quiverMount.position.set(-0.1, 0.06, -0.2);
  quiverMount.rotation.set(-0.3, -0.5, -0.3);
  chest.add(quiverMount);

  // A dedicated cosmetic slot on the back for a permanent power-up (the jetpack) —
  // kept separate from the weapon holsters so the two never fight over the same spot.
  const backpackMount = new THREE.Group();
  backpackMount.position.set(0, 0.1, -0.24);
  backpackMount.rotation.set(0.1, Math.PI, 0);
  chest.add(backpackMount);

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
    bow,
    gunMount,
    backMount,
    hipMount,
    quiverMount,
    backpackMount,
    jetpackMesh: null,
    walkPhase: 0,
    landSquash: 0,
    shootKick: 0,
    kind,
    skinHex: def.skin,
    springVel: { hipsZ: 0, torsoX: 0, chestY: 0, headX: 0, headY: 0 },
    chameleon,
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
  reload: number;
  revLoaded: number;
  jetpack?: boolean;
  // PIP's mood ring: -1 (calm — a friendly bot is close) .. 0 (neutral cycle) .. 1
  // (danger — a hostile bot is close). Ignored for every other character.
  moodThreat?: number;
  aimPitch?: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Under-damped spring toward a target — the torso/chest/head chase their pose instead of
// snapping to it, so a landing, a turn, or a shot gives a bit of floppy overshoot instead
// of looking rigid. Kept off the arms/legs so weapon-holding stays precise.
const SPRING_K = 85;
const SPRING_D = 9;
function springTo(rig: AlienRig, key: keyof AlienRig["springVel"], current: number, target: number, dt: number) {
  const vel = rig.springVel[key];
  const accel = (target - current) * SPRING_K - vel * SPRING_D;
  const nv = vel + accel * dt;
  rig.springVel[key] = nv;
  return current + nv * dt;
}

export function updateAlien(rig: AlienRig, a: AlienAnim) {
  const isPongo = rig.kind === "pongo";
  if (a.justLanded) rig.landSquash = 1;
  if (a.justShot) rig.shootKick = 1;
  rig.landSquash = Math.max(0, rig.landSquash - a.dt * 4.5);
  rig.shootKick = Math.max(0, rig.shootKick - a.dt * 7);

  const spd = a.speed;
  const walk = Math.min(1, spd / 4);
  const cadence = isPongo ? 5 + spd : 6 + spd * 1.4;
  if (a.grounded && spd > 0.2) rig.walkPhase += a.dt * cadence;
  else if (!a.grounded) rig.walkPhase += a.dt * 2;
  else rig.walkPhase += a.dt * 0.6;

  const ph = rig.walkPhase;
  const swing = Math.sin(ph) * walk;
  const bob = a.grounded ? Math.abs(Math.sin(ph)) * (isPongo ? 0.07 : 0.045) * walk : 0;

  const sq = 1 - rig.landSquash * 0.1;
  const def = CHARACTERS[rig.kind];
  const base = def.scale;
  rig.root.scale.set(base * (1 + (1 - sq) * 0.55), base * sq, base * (1 + (1 - sq) * 0.55));

  if (a.justLanded) {
    // a floppy little jolt through the torso/chest on impact instead of a dead stop
    rig.springVel.torsoX -= 3.2;
    rig.springVel.chestY += (Math.random() - 0.5) * 3.5;
    rig.springVel.headX -= 1.6;
  }
  if (a.justShot) {
    rig.springVel.chestY += (Math.random() - 0.5) * 2.2;
    rig.springVel.headY += (Math.random() - 0.5) * 1.4;
  }

  rig.hips.position.y = (isPongo ? 0.5 : 0.9) + bob;
  rig.hips.rotation.z = springTo(rig, "hipsZ", rig.hips.rotation.z, swing * 0.06, a.dt);
  const pongoLean = isPongo ? 0.5 : 0;
  rig.torso.rotation.x = springTo(
    rig,
    "torsoX",
    rig.torso.rotation.x,
    pongoLean + walk * (isPongo ? 0.035 : 0.055) + (a.grounded ? 0 : -0.1),
    a.dt,
  );
  rig.chest.rotation.y = springTo(rig, "chestY", rig.chest.rotation.y, swing * -0.1, a.dt);

  const breath = Math.sin(a.time * 2.2) * 0.012;
  rig.chest.scale.setScalar(1 + breath);

  const ak = a.weapon === "ak";
  const bow = a.weapon === "bow";
  const rel = THREE.MathUtils.clamp(a.reload, 0, 1);
  const kick = rig.shootKick;
  const aimPitch = THREE.MathUtils.clamp(a.aimPitch ?? 0, -0.85, 1.05);

  const airTuck = a.grounded ? 0 : THREE.MathUtils.clamp(-a.vy * 0.04, -0.4, 0.6);
  const legAmp = isPongo ? 0.5 : 0.7;
  rig.legL.rotation.x = swing * legAmp + airTuck;
  rig.legR.rotation.x = -swing * legAmp + airTuck * 0.6;
  rig.legL.rotation.z = isPongo ? 0.16 : 0.09;
  rig.legR.rotation.z = isPongo ? -0.16 : -0.09;
  rig.shinL.rotation.x = Math.max(0, -swing) * (isPongo ? 0.35 : 0.5);
  rig.shinR.rotation.x = Math.max(0, swing) * (isPongo ? 0.35 : 0.5);

  rig.armL.rotation.order = "ZYX";
  rig.armR.rotation.order = "ZYX";

  if (ak) {
    rig.armL.rotation.set(-1.25 - aimPitch * 0.72, 0.35, 0.22);
    rig.forearmL.rotation.set(-0.35, 0, 0);
    rig.armR.rotation.set(-1.32 - aimPitch - kick * 0.18, -0.22, -0.18);
    rig.forearmR.rotation.set(-0.15 - rel * 0.4, 0, 0);
  } else if (bow) {
    // Two-handed draw: support arm reaches out to steady the bow, firing arm pulls
    // the string back toward the shoulder. kick doubles as the "just released" snap.
    rig.armL.rotation.set(-1.3 - aimPitch * 0.82, 0.08, 0.08);
    rig.forearmL.rotation.set(-0.1, 0, 0);
    rig.armR.rotation.set(-0.95 - aimPitch * 0.9 + kick * 0.3, -0.32, 0.18);
    rig.forearmR.rotation.set(-1.05 + kick * 0.5, 0, 0);
  } else {
    rig.armL.rotation.set(-0.45 + swing * 0.3, 0.15, 0.35);
    rig.forearmL.rotation.set(-0.35, 0, 0);
    rig.armR.rotation.set(-1.45 - aimPitch - kick * 0.25, -0.12, -0.1);
    rig.forearmR.rotation.set(-0.05 - rel * 0.6, 0, 0);
  }

  if (isPongo) {
    // Both feet walk; the empty left arm plants its knuckles while the right arm
    // remains a readable weapon arm. The deliberate mismatch is part of his style.
    const plant = Math.sin(ph + Math.PI) * walk;
    rig.hips.position.y = 0.5 + Math.abs(Math.sin(ph * 2)) * 0.07 * walk;
    rig.armL.rotation.set(-1.02 + plant * 0.34, 0.12, 0.28);
    rig.forearmL.rotation.set(-0.62 - Math.max(0, -plant) * 0.5, 0, 0);
    if (!ak && !bow) {
      rig.armR.rotation.set(-1.62 - aimPitch - kick * 0.22, -0.12, -0.1);
      rig.forearmR.rotation.set(-0.06 - rel * 0.55, 0, 0);
    }
  }

  // Keep the face visibly forward. The older pose pitched the head down as speed and
  // body lean accumulated, which made the raider look at its own feet from the new
  // lower camera. A tiny upward counter-pitch preserves the floppy style without
  // sacrificing eye-line or aim readability.
  rig.head.rotation.x = springTo(rig, "headX", rig.head.rotation.x, (isPongo ? -0.035 : -0.12) + Math.sin(a.time * 1.4) * 0.014, a.dt);
  rig.head.rotation.y = springTo(rig, "headY", rig.head.rotation.y, swing * -0.035, a.dt);

  if (rig.antennaL && rig.antennaR) {
    const wiggle = Math.sin(a.time * 3.2) * 0.12 + swing * 0.2;
    rig.antennaL.rotation.x = -0.15 + wiggle;
    rig.antennaR.rotation.x = -0.15 - wiggle * 0.8;
    rig.antennaL.rotation.z = -0.18 + Math.sin(a.time * 2.1) * 0.08;
    rig.antennaR.rotation.z = 0.18 + Math.cos(a.time * 2.4) * 0.08;
  }

  const gun = ak ? rig.ak : bow ? rig.bow : rig.revolver;
  if (gun.root.parent !== rig.gunMount) rig.gunMount.add(gun.root);

  // Every weapon that isn't the active one rests in its own fixed holster slot —
  // this generalizes cleanly no matter how many guns the rig is carrying.
  const holsters: Array<{ g: GunRig; mount: THREE.Group; rot: [number, number, number]; scale: number }> = [
    { g: rig.ak, mount: rig.hipMount, rot: [1.2, 0, 0.2], scale: 0.85 },
    { g: rig.revolver, mount: rig.backMount, rot: [0.2, 0, 0.4], scale: 0.9 },
    { g: rig.bow, mount: rig.quiverMount, rot: [0.2, 0.4, -0.15], scale: 0.85 },
  ];
  for (const h of holsters) {
    if (h.g === gun) continue;
    if (h.g.root.parent !== h.mount) h.mount.add(h.g.root);
    h.g.root.rotation.set(...h.rot);
    h.g.root.scale.setScalar(h.scale);
    h.g.root.position.set(0, 0, 0);
  }

  gun.root.rotation.set(rel * 0.4, 0, 0);
  gun.root.position.set(0, -kick * 0.04, -kick * 0.08);
  gun.root.scale.setScalar(ak ? 1.15 : bow ? 1.05 : 1.2);
  gun.flash.visible = kick > 0.55;
  if (gun.flash.visible) {
    gun.flash.scale.setScalar(0.7 + kick * 0.8);
  }

  if (gun.mag) gun.mag.visible = !ak || rel < 0.45 || rel > 0.7;
  if (gun.cylinder) {
    gun.cylinder.rotation.z = rel * 0.9;
    setCylinderSlugs(gun, a.revLoaded);
  }

  if (a.attract) {
    rig.head.rotation.y = Math.sin(a.time * 0.35) * 0.22;
  }

  if (rig.chameleon) {
    // PIP: a slow psychedelic hue-cycle across the whole body, preserving each
    // material's original saturation/lightness so the light/dark shading still reads —
    // pulled toward red when a hostile bot is close, blue when a friendly one is, via
    // moodThreat (a mood ring nobody asked for and everyone can now read).
    const c = rig.chameleon;
    const baseHue = (a.time * 0.045) % 1;
    const threat = THREE.MathUtils.clamp(a.moodThreat ?? 0, -1, 1);
    const moodPole = threat > 0 ? 0.0 : 0.6;
    const hue = baseHue + (moodPole - baseHue) * Math.abs(threat);
    c.skin.color.setHSL(hue, c.sSkin, c.lSkin);
    c.skin.emissive.setHSL(hue, Math.min(1, c.sSkin + 0.15), 0.16);
    c.skinDark.color.setHSL(hue, c.sDark, c.lDark);
    c.skinDeep.color.setHSL(hue, c.sDeep, c.lDeep);
    rig.skinHex = c.skin.color.getHex();
  }

  if (a.jetpack) {
    if (!rig.jetpackMesh) {
      rig.jetpackMesh = makeJetpackProp();
      rig.backpackMount.add(rig.jetpackMesh);
    }
    rig.jetpackMesh.visible = true;
  } else if (rig.jetpackMesh) {
    rig.jetpackMesh.visible = false;
  }

  void lerp;
}

export function getMuzzleWorld(rig: AlienRig, weapon: WeaponId, target: THREE.Vector3) {
  const g = weapon === "ak" ? rig.ak : weapon === "bow" ? rig.bow : rig.revolver;
  g.muzzle.getWorldPosition(target);
  return target;
}
