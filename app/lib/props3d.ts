import type * as THREE_NS from "three";

/**
 * Shared 3D prop library.
 *
 * Every collectible and character the site shows as a flat icon has a real
 * model in here: the Rat Meat tins, the gold tin, Yoo-hoo, bananas, the oil
 * drum, and the penguins. They're all built the same way — faceted low-poly
 * geometry with flat shading, enough radial segments to read as round rather
 * than blocky, and materials with sane metalness/roughness so the site's
 * lighting actually does something with them.
 *
 * Each builder returns a group roughly one unit tall and centred on the
 * origin, so `Prop3D` can frame any of them with the same camera.
 */

export type PropName =
  | "rat-meat"
  | "rat-meat-gold"
  | "yoohoo"
  | "banana"
  | "oil-drum"
  | "penguin";

type Three = typeof THREE_NS;

const faceted = (THREE: Three, color: number, roughness: number, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });

const smooth = (THREE: Three, color: number, roughness: number, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

/**
 * A tin can: rolled rims top and bottom, a ribbed body, and a wrapped label
 * with a darker band across it. `gold` swaps the tin for polished gold and the
 * label for a deep red — the collector's edition of a can of rat meat.
 */
function buildCan(THREE: Three, options: { body: number; label: number; band: number; metalness: number; roughness: number }) {
  const group = new THREE.Group();
  const SEGMENTS = 22;

  const tin = smooth(THREE, options.body, options.roughness, options.metalness);
  const paper = faceted(THREE, options.label, 0.82, 0.02);
  const stripe = faceted(THREE, options.band, 0.7, 0.05);

  // Body under the label, showing at the very top and bottom.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.78, SEGMENTS), tin);
  group.add(body);

  // The wrapped label, slightly proud of the tin.
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.306, 0.306, 0.56, SEGMENTS, 1, true), paper);
  group.add(label);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.309, 0.309, 0.14, SEGMENTS, 1, true), stripe);
  band.position.y = -0.14;
  group.add(band);

  // Rolled rims — the detail that makes a cylinder read as a tin.
  [0.39, -0.39].forEach((y) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.035, 8, SEGMENTS), tin);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    group.add(rim);
  });

  // Lid, with the pull-ring seam stamped into it.
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, SEGMENTS), tin);
  lid.position.y = 0.4;
  group.add(lid);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, SEGMENTS), tin);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = 0.42;
  group.add(seam);
  const pull = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 6, 14), tin);
  pull.rotation.x = Math.PI / 2.6;
  pull.position.set(0.05, 0.45, 0);
  group.add(pull);

  return { group, paper, stripe };
}

function buildRatMeatCan(THREE: Three, gold: boolean) {
  const { group, paper } = gold
    ? buildCan(THREE, { body: 0xf2c14b, label: 0xffd97a, band: 0x9a6b12, metalness: 0.95, roughness: 0.22 })
    : buildCan(THREE, { body: 0xd7dde3, label: 0xe3ddd0, band: 0x1f1c1a, metalness: 0.72, roughness: 0.34 });

  // The red accent stripe from the label art.
  const accent = faceted(THREE, gold ? 0xb8860b : 0xb3202a, 0.72);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.311, 0.311, 0.035, 22, 1, true), accent);
  stripe.position.y = 0.19;
  group.add(stripe);

  // A rat silhouette on the label: a body, a snout, an ear and a tail curl.
  const ink = faceted(THREE, gold ? 0x7a4a06 : 0x241f1c, 0.85);
  const mark = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), ink);
  torso.scale.set(1.3, 0.78, 0.4);
  mark.add(torso);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.075, 7), ink);
  snout.rotation.z = -Math.PI / 2;
  snout.position.set(0.1, -0.008, 0);
  mark.add(snout);
  const ear = new THREE.Mesh(new THREE.CircleGeometry(0.026, 10), ink);
  ear.position.set(0.035, 0.05, 0.002);
  mark.add(ear);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 5, 14, Math.PI * 1.1), ink);
  tail.position.set(-0.12, 0.02, 0);
  tail.rotation.z = 0.5;
  mark.add(tail);
  mark.position.set(0, 0.05, 0.305);
  group.add(mark);

  return { group, paper };
}

/** The chocolate drink: a yellow can with the brown belly band. */
function buildYoohooCan(THREE: Three) {
  const { group } = buildCan(THREE, { body: 0xe6e9ec, label: 0xf7c948, band: 0x5c3a1e, metalness: 0.6, roughness: 0.4 });

  const cocoa = faceted(THREE, 0x6b4423, 0.8);
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 7, 20, Math.PI * 1.4), cocoa);
  swirl.position.set(0, 0.1, 0.3);
  swirl.rotation.z = -0.6;
  group.add(swirl);

  const drop = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 8), cocoa);
  drop.position.set(0.03, 0.02, 0.31);
  group.add(drop);

  return { group };
}

function buildBanana(THREE: Three) {
  const group = new THREE.Group();
  const peel = faceted(THREE, 0xf5d33a, 0.62, 0.05);
  const tipMat = faceted(THREE, 0x6b5219, 0.85);

  // A curved banana swept along an arc.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, -0.16, 0),
    new THREE.Vector3(-0.2, 0.12, 0),
    new THREE.Vector3(0.04, 0.22, 0),
    new THREE.Vector3(0.27, 0.06, 0),
    new THREE.Vector3(0.35, -0.2, 0),
  ]);
  // A plain tube reads as a croissant, so the rings are tapered toward both
  // ends by hand — fat in the middle, pinched at the stem and the nub.
  const SEGMENTS = 34;
  const RADIALS = 7;
  const geometry = new THREE.TubeGeometry(curve, SEGMENTS, 0.115, RADIALS, false);
  const position = geometry.attributes.position;
  const centre = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  for (let ring = 0; ring <= SEGMENTS; ring += 1) {
    const along = ring / SEGMENTS;
    // 1 through the belly, falling away to a point at either tip.
    const taper = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, along))), 0.42) * 0.94 + 0.06;
    curve.getPointAt(along, centre);
    for (let radial = 0; radial <= RADIALS; radial += 1) {
      const index = ring * (RADIALS + 1) + radial;
      vertex.fromBufferAttribute(position, index).sub(centre).multiplyScalar(taper).add(centre);
      position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const body = new THREE.Mesh(geometry, peel);
  // Flatten it slightly so it isn't a sausage.
  body.scale.set(1, 1, 0.84);
  group.add(body);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.045, 0.12, 6), tipMat);
  stem.position.set(-0.36, -0.2, 0);
  stem.rotation.z = 0.5;
  group.add(stem);

  const nub = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 6), tipMat);
  nub.position.set(0.37, -0.24, 0);
  nub.rotation.z = 0.4;
  group.add(nub);

  return { group };
}

function buildOilDrum(THREE: Three) {
  const group = new THREE.Group();
  const SEGMENTS = 20;
  const steel = smooth(THREE, 0x1f4f8f, 0.42, 0.72);
  const rib = smooth(THREE, 0x18406f, 0.4, 0.75);
  const cap = smooth(THREE, 0xd8dee6, 0.35, 0.8);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.84, SEGMENTS), steel);
  group.add(body);

  [0.2, 0, -0.2].forEach((y) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.302, 0.028, 7, SEGMENTS), rib);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  });

  [0.43, -0.43].forEach((y) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.032, 7, SEGMENTS), cap);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    group.add(rim);
  });

  const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 10), cap);
  bung.position.set(0.15, 0.44, 0.05);
  group.add(bung);

  return { group };
}

/** A chunky low-poly penguin: belly, beak, flippers, feet and a tail. */
function buildPenguin(THREE: Three) {
  const group = new THREE.Group();
  const coat = faceted(THREE, 0x22252e, 0.78);
  const belly = faceted(THREE, 0xf4f1ea, 0.7);
  const beakMat = faceted(THREE, 0xf6a020, 0.62);
  const footMat = faceted(THREE, 0xe08a12, 0.66);
  const eyeMat = smooth(THREE, 0x0a0a0d, 0.2, 0.4);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), coat);
  body.scale.set(0.92, 1.18, 0.86);
  body.position.y = -0.02;
  group.add(body);

  const front = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), belly);
  front.scale.set(0.82, 1.06, 0.6);
  front.position.set(0, -0.05, 0.12);
  group.add(front);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), coat);
  head.scale.set(1, 0.95, 0.95);
  head.position.y = 0.36;
  group.add(head);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), belly);
  face.scale.set(0.78, 0.72, 0.5);
  face.position.set(0, 0.33, 0.11);
  group.add(face);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 7), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.33, 0.22);
  group.add(beak);

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
    eye.position.set(side * 0.072, 0.42, 0.15);
    group.add(eye);

    const flipper = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), coat);
    flipper.scale.set(0.26, 0.92, 0.5);
    flipper.position.set(side * 0.27, -0.03, 0);
    flipper.rotation.z = side * 0.22;
    group.add(flipper);

    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), footMat);
    foot.scale.set(0.85, 0.32, 1.25);
    foot.position.set(side * 0.1, -0.38, 0.07);
    group.add(foot);
  });

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 6), coat);
  tail.rotation.x = -Math.PI / 2.2;
  tail.position.set(0, -0.24, -0.24);
  group.add(tail);

  return { group };
}

export function buildProp(THREE: Three, name: PropName): THREE_NS.Group {
  switch (name) {
    case "rat-meat-gold":
      return buildRatMeatCan(THREE, true).group;
    case "yoohoo":
      return buildYoohooCan(THREE).group;
    case "banana":
      return buildBanana(THREE).group;
    case "oil-drum":
      return buildOilDrum(THREE).group;
    case "penguin":
      return buildPenguin(THREE).group;
    case "rat-meat":
    default:
      return buildRatMeatCan(THREE, false).group;
  }
}

/**
 * How each prop should sit when it's idling in a little display canvas.
 * Collectibles turn all the way around so you see the whole label; characters
 * sway instead, so they keep facing you rather than showing you their back.
 */
export const PROP_POSE: Record<PropName, { scale: number; tilt: number; spin: number; mode: "spin" | "sway" }> = {
  "rat-meat": { scale: 1, tilt: 0.24, spin: 0.5, mode: "spin" },
  "rat-meat-gold": { scale: 1, tilt: 0.24, spin: 0.62, mode: "spin" },
  yoohoo: { scale: 1, tilt: 0.24, spin: 0.5, mode: "spin" },
  banana: { scale: 1.05, tilt: 0.3, spin: 0.65, mode: "spin" },
  "oil-drum": { scale: 0.98, tilt: 0.22, spin: 0.45, mode: "spin" },
  penguin: { scale: 1.06, tilt: 0.1, spin: 0.9, mode: "sway" },
};
