import type * as THREE_NS from "three";
import { geoEquirectangular, geoPath } from "d3-geo";

/**
 * Planet Urf — 3D world layer.
 *
 * This module renders ONLY the things that should be three-dimensional:
 * the landmasses (real extruded geometry with cliffs and lighting), the
 * orbiting satellite, and the playable alien archer plus their arrows.
 *
 * The ocean is deliberately NOT drawn here. It stays exactly as it is on the
 * live site: the stationary, drifting, psychedelic 2D void painted by the
 * existing canvas underneath this one. Everywhere there is water, this layer
 * is transparent and that painting shows through — so the land spins in 3D
 * over a still 2D ocean.
 *
 * The camera is orthographic and framed to the exact same projection the 2D
 * layer uses (sphere radius 1 === 0.43 * frameSize * zoom pixels), so the 3D
 * land lines up pixel-for-pixel with the existing lock markers, the Antarctica
 * button, the graticule and the rim glow.
 */

export type Point = [number, number];
export type PolygonGeometry = { type: "Polygon"; coordinates: Point[][] };
export type LandFeature = {
  feature: { type: "Feature"; properties: null; geometry: PolygonGeometry };
  antarctic: boolean;
};

export type Territory = { name: string; center: Point; unlocked: boolean };

export type ShotResult = {
  /** Territory name, or null when the arrow landed in open water. */
  territory: string | null;
  unlocked: boolean;
  lon: number;
  lat: number;
};

export type Globe3DEvents = {
  onShot: (result: ShotResult) => void;
  onCharge: (charge: number) => void;
  onQuiver: (arrows: number) => void;
};

export type Globe3DHandle = {
  setView: (rotation: { lon: number; lat: number; roll: number }, zoom: number) => void;
  setSize: (size: number) => void;
  setTerritories: (territories: Territory[]) => void;
  /** Screen-space aim point, normalised to -1..1 with +y up. */
  setAim: (x: number, y: number) => void;
  /** Analogue move input from the mobile joystick, -1..1 on each axis. */
  setMove: (x: number, y: number) => void;
  setDrawing: (drawing: boolean) => void;
  /** Abandon a draw without loosing an arrow (the pointer turned into a drag). */
  cancelDraw: () => void;
  dispose: () => void;
};

const GLOBE_RADIUS = 1;
const LAND_HEIGHT = 0.043;
const ICE_HEIGHT = 0.052;
const LON_CELLS = 480;
const LAT_CELLS = 240;
const MASK_WIDTH = 1024;
const MASK_HEIGHT = 512;

const QUIVER_MAX = 12;
const RELOAD_SECONDS = 1.35;
const ARROW_MIN_SPEED = 2.4;
const ARROW_MAX_SPEED = 5.6;
const GRAVITY = -1.55;
const AIR_DRAG = 0.16;
const ARROW_LIFETIME = 7;
/** A full draw, in wall-clock milliseconds. */
const DRAW_MILLISECONDS = 900;
/** Fixed integration step for arrow flight, in seconds. */
const PHYSICS_STEP = 1 / 240;
/** Arrows register against the crust just above sea level so they bite into
 * the plate they were aimed at instead of clipping the shell early. */
const IMPACT_RADIUS = GLOBE_RADIUS + 0.012;
const STUCK_LIFETIME = 5;

const ALIEN_SCALE = 0.56;
const WALK_SPEED = 0.42;
/** The walkable slab is tilted toward the camera, so walking "back" also
 * walks up the screen — an isometric read that keeps depth legible under an
 * orthographic camera. */
const SLAB_RISE = 0.3;
const SLAB_DEPTH = 0.62;
const SLAB_BASE_Y = -1.06;
const SLAB_BASE_Z = 2.45;
const SLAB_RADIUS = 0.5;
const WALK_LIMIT_X = 0.36;

const LAND_STOPS: { at: number; rgb: [number, number, number] }[] = [
  { at: 0, rgb: [0x18, 0x3f, 0x43] },
  { at: 0.34, rgb: [0x36, 0x77, 0x6a] },
  { at: 0.7, rgb: [0x74, 0xaa, 0x62] },
  { at: 1, rgb: [0xf1, 0xc8, 0x6e] },
];
const ICE_RGB: [number, number, number] = [0xc8, 0xee, 0xf1];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Three.js colour management treats raw vertex colours as linear, so the sRGB
 * hex values the 2D globe paints with have to be converted or the land comes
 * out washed-out next to the flat version.
 */
const srgbToLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
};

const hashNoise = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const landTint = (lat: number, jitter: number): [number, number, number] => {
  const t = clamp((lat + 55) / 110 + (jitter - 0.5) * 0.07, 0, 1);
  let lower = LAND_STOPS[0];
  let upper = LAND_STOPS[LAND_STOPS.length - 1];
  for (let index = 0; index < LAND_STOPS.length - 1; index += 1) {
    if (t >= LAND_STOPS[index].at && t <= LAND_STOPS[index + 1].at) {
      lower = LAND_STOPS[index];
      upper = LAND_STOPS[index + 1];
      break;
    }
  }
  const span = Math.max(upper.at - lower.at, 0.0001);
  const local = (t - lower.at) / span;
  return [
    lower.rgb[0] + (upper.rgb[0] - lower.rgb[0]) * local,
    lower.rgb[1] + (upper.rgb[1] - lower.rgb[1]) * local,
    lower.rgb[2] + (upper.rgb[2] - lower.rgb[2]) * local,
  ];
};

/** Unit-sphere direction using the same convention as the 2D projection. */
const directionFor = (lon: number, lat: number): [number, number, number] => {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.sin(lambda), Math.sin(phi), cosPhi * Math.cos(lambda)];
};

const greatCircleDegrees = (a: Point, b: Point) => {
  const [lonA, latA] = a;
  const [lonB, latB] = b;
  const phiA = (latA * Math.PI) / 180;
  const phiB = (latB * Math.PI) / 180;
  const deltaLambda = ((lonB - lonA) * Math.PI) / 180;
  const cosine = Math.sin(phiA) * Math.sin(phiB) + Math.cos(phiA) * Math.cos(phiB) * Math.cos(deltaLambda);
  return (Math.acos(clamp(cosine, -1, 1)) * 180) / Math.PI;
};

type LandMask = { data: Uint8ClampedArray; isLand: (lon: number, lat: number) => boolean; isIce: (lon: number, lat: number) => boolean };

/** Rasterises the same GeoJSON the 2D globe draws into a land/ice lookup. */
function buildLandMask(landFeatures: LandFeature[]): LandMask | null {
  const canvas = document.createElement("canvas");
  canvas.width = MASK_WIDTH;
  canvas.height = MASK_HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.fillStyle = "#000000";
  context.fillRect(0, 0, MASK_WIDTH, MASK_HEIGHT);

  const projection = geoEquirectangular()
    .translate([MASK_WIDTH / 2, MASK_HEIGHT / 2])
    .scale(MASK_WIDTH / (2 * Math.PI));
  const path = geoPath(projection, context);

  context.fillStyle = "#ffffff";
  context.beginPath();
  landFeatures.filter((land) => !land.antarctic).forEach((land) => path(land.feature));
  context.fill("evenodd");

  // Ice is tagged in the red channel only, so a pixel test can tell the two apart.
  context.fillStyle = "#ff0000";
  context.beginPath();
  landFeatures.filter((land) => land.antarctic).forEach((land) => path(land.feature));
  context.fill("evenodd");

  const { data } = context.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT);

  const sample = (lon: number, lat: number) => {
    const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180;
    const px = clamp(Math.floor(((wrapped + 180) / 360) * MASK_WIDTH), 0, MASK_WIDTH - 1);
    const py = clamp(Math.floor(((90 - lat) / 180) * MASK_HEIGHT), 0, MASK_HEIGHT - 1);
    return (py * MASK_WIDTH + px) * 4;
  };

  return {
    data,
    isLand: (lon, lat) => lat <= 90 && lat >= -90 && data[sample(lon, lat)] > 100,
    isIce: (lon, lat) => {
      const index = sample(lon, lat);
      return data[index] > 100 && data[index + 1] < 100;
    },
  };
}

/**
 * Builds the landmasses as real geometry: a raised plate per land cell plus a
 * cliff wall wherever land meets water, so coastlines have visible thickness.
 */
function buildLandGeometry(THREE: typeof THREE_NS, mask: LandMask): THREE_NS.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const deltaLon = 360 / LON_CELLS;
  const deltaLat = 180 / LAT_CELLS;

  const pushVertex = (lon: number, lat: number, radius: number, rgb: [number, number, number]) => {
    const [x, y, z] = directionFor(lon, lat);
    positions.push(x * radius, y * radius, z * radius);
    colors.push(srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2]));
  };

  const pushQuad = (
    corners: [number, number][],
    radii: [number, number, number, number],
    rgb: [number, number, number],
  ) => {
    const [a, b, c, d] = corners;
    pushVertex(a[0], a[1], radii[0], rgb);
    pushVertex(b[0], b[1], radii[1], rgb);
    pushVertex(c[0], c[1], radii[2], rgb);
    pushVertex(a[0], a[1], radii[0], rgb);
    pushVertex(c[0], c[1], radii[2], rgb);
    pushVertex(d[0], d[1], radii[3], rgb);
  };

  for (let row = 0; row < LAT_CELLS; row += 1) {
    const latTop = 90 - row * deltaLat;
    const latBottom = latTop - deltaLat;
    const latCenter = latTop - deltaLat / 2;

    for (let column = 0; column < LON_CELLS; column += 1) {
      const lonLeft = -180 + column * deltaLon;
      const lonRight = lonLeft + deltaLon;
      const lonCenter = lonLeft + deltaLon / 2;

      if (!mask.isLand(lonCenter, latCenter)) continue;

      const ice = mask.isIce(lonCenter, latCenter);
      const height = ice ? ICE_HEIGHT : LAND_HEIGHT;
      const top = GLOBE_RADIUS + height;
      const jitter = hashNoise(column, row);
      const rgb: [number, number, number] = ice
        ? [ICE_RGB[0] - jitter * 14, ICE_RGB[1] - jitter * 10, ICE_RGB[2] - jitter * 6]
        : landTint(latCenter, jitter);

      // Plate top.
      pushQuad(
        [
          [lonLeft, latTop],
          [lonRight, latTop],
          [lonRight, latBottom],
          [lonLeft, latBottom],
        ],
        [top, top, top, top],
        rgb,
      );

      // Cliff walls wherever this cell touches water.
      const cliff: [number, number, number] = [rgb[0] * 0.62, rgb[1] * 0.62, rgb[2] * 0.66];
      const neighbours: { lon: number; lat: number; edge: [number, number][] }[] = [
        { lon: lonCenter, lat: latCenter + deltaLat, edge: [[lonLeft, latTop], [lonRight, latTop]] },
        { lon: lonCenter, lat: latCenter - deltaLat, edge: [[lonRight, latBottom], [lonLeft, latBottom]] },
        { lon: lonCenter - deltaLon, lat: latCenter, edge: [[lonLeft, latBottom], [lonLeft, latTop]] },
        { lon: lonCenter + deltaLon, lat: latCenter, edge: [[lonRight, latTop], [lonRight, latBottom]] },
      ];

      neighbours.forEach((neighbour) => {
        const outside = neighbour.lat > 90 || neighbour.lat < -90;
        if (!outside && mask.isLand(neighbour.lon, neighbour.lat)) return;
        const [start, end] = neighbour.edge;
        pushQuad(
          [start, end, end, start],
          [top, top, GLOBE_RADIUS, GLOBE_RADIUS],
          cliff,
        );
      });
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

type AlienRig = {
  group: THREE_NS.Group;
  body: THREE_NS.Group;
  leftLeg: THREE_NS.Group;
  rightLeg: THREE_NS.Group;
  bowArm: THREE_NS.Group;
  drawArm: THREE_NS.Group;
  bow: THREE_NS.Group;
  string: THREE_NS.Mesh;
  nock: THREE_NS.Object3D;
};

/** A low-poly alien archer, built from primitives so it ships with no asset. */
function buildAlien(THREE: typeof THREE_NS): AlienRig {
  const skin = new THREE.MeshStandardMaterial({ color: 0x6fd63a, flatShading: true, roughness: 0.72, metalness: 0.03 });
  const skinDark = new THREE.MeshStandardMaterial({ color: 0x4fae2b, flatShading: true, roughness: 0.78 });
  const gear = new THREE.MeshStandardMaterial({ color: 0x7b3fbf, flatShading: true, roughness: 0.6, metalness: 0.12 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x0a0713, roughness: 0.22, metalness: 0.35 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4126, flatShading: true, roughness: 0.85 });
  const cord = new THREE.MeshStandardMaterial({ color: 0xe8f5c8, roughness: 0.5 });

  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const limb = (length: number, radius: number, material: THREE_NS.Material) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, length, 6), material);
    mesh.position.y = -length / 2;
    return mesh;
  };

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.062, 0.44, 0);
  leftLeg.add(limb(0.44, 0.05, skin));
  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.17), skinDark);
  leftFoot.position.set(0, -0.44, 0.03);
  leftLeg.add(leftFoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.062, 0.44, 0);
  rightLeg.add(limb(0.44, 0.05, skin));
  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.17), skinDark);
  rightFoot.position.set(0, -0.44, 0.03);
  rightLeg.add(rightFoot);

  body.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.3, 7), skin);
  torso.position.y = 0.59;
  body.add(torso);

  const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.107, 0.126, 0.19, 7), gear);
  vest.position.y = 0.585;
  body.add(vest);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.035, 7), gear);
  belt.position.y = 0.45;
  body.add(belt);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), skin);
  head.scale.set(0.95, 1.32, 1.05);
  head.position.y = 0.87;
  body.add(head);

  const eyeGeometry = new THREE.IcosahedronGeometry(0.052, 1);
  const leftEye = new THREE.Mesh(eyeGeometry, eye);
  leftEye.scale.set(0.85, 1.5, 0.5);
  leftEye.position.set(-0.062, 0.885, 0.125);
  leftEye.rotation.z = 0.32;
  const rightEye = new THREE.Mesh(eyeGeometry, eye);
  rightEye.scale.set(0.85, 1.5, 0.5);
  rightEye.position.set(0.062, 0.885, 0.125);
  rightEye.rotation.z = -0.32;
  body.add(leftEye, rightEye);

  // Quiver across the back, with arrows poking out of it.
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.28, 6), gear);
  quiver.position.set(-0.02, 0.6, -0.12);
  quiver.rotation.set(0.28, 0, 0.42);
  body.add(quiver);
  for (let index = 0; index < 3; index += 1) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4), wood);
    shaft.position.set(-0.055 + index * 0.022, 0.78, -0.15);
    shaft.rotation.set(0.28, 0, 0.42);
    body.add(shaft);
  }

  // Arms. The bow arm points forward along +Z; the draw arm pulls the string.
  const bowArm = new THREE.Group();
  bowArm.position.set(-0.105, 0.7, 0);
  const bowUpper = limb(0.34, 0.036, skin);
  bowArm.add(bowUpper);
  body.add(bowArm);

  const drawArm = new THREE.Group();
  drawArm.position.set(0.105, 0.7, 0);
  drawArm.add(limb(0.32, 0.036, skin));
  body.add(drawArm);

  const bow = new THREE.Group();
  const limbGeometry = new THREE.TorusGeometry(0.3, 0.014, 5, 18, Math.PI * 0.95);
  const bowMesh = new THREE.Mesh(limbGeometry, wood);
  bowMesh.rotation.z = Math.PI * 0.525;
  bow.add(bowMesh);

  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.58, 3), cord);
  bow.add(string);

  const nock = new THREE.Object3D();
  nock.position.set(0, 0, 0);
  bow.add(nock);

  bow.position.set(0, -0.34, 0.03);
  bowArm.add(bow);

  return { group, body, leftLeg, rightLeg, bowArm, drawArm, bow, string, nock };
}

function buildSatellite(THREE: typeof THREE_NS) {
  const group = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0xd8e6f2, flatShading: true, roughness: 0.42, metalness: 0.55 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x1f6ad0, flatShading: true, roughness: 0.3, metalness: 0.65 });
  const beacon = new THREE.MeshStandardMaterial({ color: 0xff4f6d, emissive: 0xff2a4d, emissiveIntensity: 2.2, roughness: 0.4 });

  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.09), hull);
  group.add(bodyMesh);

  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.007, 0.062), panel);
    wing.position.x = side * 0.106;
    group.add(wing);
    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.008, 0.008), hull);
    spar.position.x = side * 0.06;
    group.add(spar);
  });

  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.045, 8, 1, true), hull);
  dish.rotation.x = Math.PI * 0.62;
  dish.position.set(0, -0.03, 0.05);
  group.add(dish);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 4), hull);
  mast.position.y = 0.06;
  group.add(mast);

  const light = new THREE.Mesh(new THREE.IcosahedronGeometry(0.011, 0), beacon);
  light.position.set(0, 0.1, 0);
  group.add(light);

  return { group, light, beacon };
}

/** The floating slab the archer stands on, plus a little alien flora. */
function buildPlatform(THREE: typeof THREE_NS) {
  const group = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({ color: 0x6c2f8f, flatShading: true, roughness: 0.9 });
  const rockTop = new THREE.MeshStandardMaterial({ color: 0xb0459d, flatShading: true, roughness: 0.82 });
  const crystal = new THREE.MeshStandardMaterial({ color: 0x39e6d4, flatShading: true, roughness: 0.25, metalness: 0.3, emissive: 0x0d5f5a, emissiveIntensity: 0.5 });
  const cap = new THREE.MeshStandardMaterial({ color: 0xff7ad4, flatShading: true, roughness: 0.6 });
  const stalk = new THREE.MeshStandardMaterial({ color: 0x8f4fd8, flatShading: true, roughness: 0.7 });

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(SLAB_RADIUS, SLAB_RADIUS * 0.86, 0.07, 9), rockTop);
  group.add(deck);

  const keel = new THREE.Mesh(new THREE.ConeGeometry(SLAB_RADIUS * 0.86, 0.72, 9), rock);
  keel.position.y = -0.39;
  group.add(keel);

  const decorations: { x: number; z: number; scale: number; kind: "crystal" | "shroom" }[] = [
    { x: -0.44, z: 0.16, scale: 0.62, kind: "crystal" },
    { x: -0.3, z: 0.32, scale: 0.4, kind: "crystal" },
    { x: 0.46, z: 0.1, scale: 0.52, kind: "crystal" },
    { x: 0.33, z: 0.34, scale: 0.34, kind: "crystal" },
    { x: -0.48, z: -0.2, scale: 0.5, kind: "shroom" },
    { x: 0.5, z: -0.22, scale: 0.42, kind: "shroom" },
  ];

  decorations.forEach((item) => {
    if (item.kind === "crystal") {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.42, 5), crystal);
      shard.position.set(item.x, 0.21 * item.scale, item.z);
      shard.scale.setScalar(item.scale);
      shard.rotation.z = (hashNoise(item.x, item.z) - 0.5) * 0.5;
      group.add(shard);
    } else {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.04, 0.3, 6), stalk);
      stem.position.set(item.x, 0.15 * item.scale, item.z);
      stem.scale.setScalar(item.scale);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 8), cap);
      hat.position.set(item.x, 0.3 * item.scale, item.z);
      hat.scale.setScalar(item.scale);
      group.add(stem, hat);
    }
  });

  return group;
}

/**
 * Blender hook. Drop a glTF export at one of these paths in `public/models/`
 * and it replaces the procedural version at runtime; if the file isn't there,
 * nothing happens and the built-in low-poly model is used. Nothing else in the
 * scene has to change, so the art can be iterated on in Blender without
 * touching this file.
 *
 *   public/models/urf-archer.glb  — the alien (export facing +Z, any scale)
 *   public/models/urf-props.glb   — extra scenery for the archer's platform
 */
export const MODEL_MANIFEST_URL = "/models/index.json";

type ModelManifest = { archer?: string | null; props?: string | null };

async function readModelManifest(): Promise<ModelManifest> {
  try {
    const response = await fetch(MODEL_MANIFEST_URL);
    if (!response.ok) return {};
    return (await response.json()) as ModelManifest;
  } catch {
    return {};
  }
}

async function loadOptionalModel(THREE: typeof THREE_NS, file: string | null | undefined): Promise<THREE_NS.Group | null> {
  if (!file) return null;
  try {
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const gltf = await new GLTFLoader().loadAsync(`/models/${file}`);
    const model = gltf.scene;
    // Normalise whatever came out of Blender to one world unit tall, so the
    // rest of the scene's scaling keeps working unchanged.
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    if (size.y > 0.0001) model.scale.setScalar(1 / size.y);
    const grounded = new THREE.Box3().setFromObject(model);
    model.position.y -= grounded.min.y;
    return model;
  } catch {
    return null;
  }
}

type Arrow = {
  mesh: THREE_NS.Group;
  velocity: THREE_NS.Vector3;
  age: number;
  stuck: boolean;
  stuckAge: number;
};

export async function createGlobe3D(
  canvas: HTMLCanvasElement,
  landFeatures: LandFeature[],
  territories: Territory[],
  events: Globe3DEvents,
): Promise<Globe3DHandle | null> {
  const THREE = await import("three");

  const mask = buildLandMask(landFeatures);
  if (!mask) return null;

  let renderer: THREE_NS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return null;
  }
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.16, 1.16, 1.16, -1.16, 0.1, 24);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x93c9f2, 0.38));
  const key = new THREE.DirectionalLight(0xfff6e2, 1.75);
  key.position.set(-2.4, 2.2, 3.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x62d8ff, 1.05);
  rim.position.set(2.8, -1.4, -2.2);
  scene.add(rim);
  const bounce = new THREE.DirectionalLight(0xff7ad4, 0.5);
  bounce.position.set(1.2, -2.6, 2.4);
  scene.add(bounce);

  // Everything that belongs to the planet lives in here and spins together.
  const planet = new THREE.Group();
  scene.add(planet);

  // Depth-only sphere at sea level. It paints nothing, so the 2D psychedelic
  // ocean below stays visible, but it hides land on the far side of the globe.
  const occluder = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 0.998, 72, 48),
    new THREE.MeshBasicMaterial({ colorWrite: false }),
  );
  occluder.renderOrder = -1;
  planet.add(occluder);

  const landGeometry = buildLandGeometry(THREE, mask);
  const landMesh = new THREE.Mesh(
    landGeometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  );
  landMesh.renderOrder = 1;
  planet.add(landMesh);

  const stuckLayer = new THREE.Group();
  planet.add(stuckLayer);

  const satellite = buildSatellite(THREE);
  satellite.group.scale.setScalar(1.5);
  scene.add(satellite.group);

  // The slab sits under the middle of the walkable strip, tilted so its top
  // face follows the same line the archer walks along.
  const platform = buildPlatform(THREE);
  platform.rotation.x = Math.atan2(SLAB_RISE, SLAB_DEPTH);
  platform.position.set(0, SLAB_BASE_Y + SLAB_RISE * 0.5 - 0.05, SLAB_BASE_Z - SLAB_DEPTH * 0.5);
  scene.add(platform);

  const alien = buildAlien(THREE);
  alien.group.scale.setScalar(ALIEN_SCALE);
  scene.add(alien.group);

  // If Blender exports are listed in public/models/index.json they take over.
  void readModelManifest().then(async (manifest) => {
    const [archerModel, propsModel] = await Promise.all([
      loadOptionalModel(THREE, manifest.archer),
      loadOptionalModel(THREE, manifest.props),
    ]);
    if (disposed) return;
    if (archerModel) {
      alien.body.visible = false;
      alien.group.add(archerModel);
    }
    if (propsModel) {
      propsModel.scale.setScalar(0.5);
      platform.add(propsModel);
    }
  });

  const arrowShaft = new THREE.MeshStandardMaterial({ color: 0x7d4a24, flatShading: true, roughness: 0.8 });
  const arrowTip = new THREE.MeshStandardMaterial({ color: 0xdfe9f4, flatShading: true, roughness: 0.3, metalness: 0.7 });
  const arrowFletch = new THREE.MeshStandardMaterial({ color: 0xff58c8, flatShading: true, roughness: 0.6, side: THREE.DoubleSide });

  const makeArrow = () => {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 5), arrowShaft);
    shaft.rotation.x = Math.PI / 2;
    group.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.085, 5), arrowTip);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.21;
    group.add(tip);
    for (let index = 0; index < 3; index += 1) {
      const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.085), arrowFletch);
      fin.position.z = -0.155;
      fin.rotation.z = (index / 3) * Math.PI * 2;
      fin.rotation.y = Math.PI / 2;
      group.add(fin);
    }
    return group;
  };

  // ---------------------------------------------------------------- state --

  let activeTerritories = territories;
  let size = canvas.clientWidth || 640;
  let zoom = 1;
  let disposed = false;

  const rotation = { lon: 0, lat: -15, roll: 0 };
  const aim = { x: 0.35, y: 0.35 };
  const move = { x: 0, y: 0 };
  const keys = { up: false, down: false, left: false, right: false };
  const walker = { x: -0.52, z: 0.3, facing: 0, stride: 0 };

  let drawing = false;
  let drawStartedAt = 0;
  let charge = 0;
  let quiver = QUIVER_MAX;
  let reload = 0;
  let lastCharge = -1;
  let lastQuiver = -1;
  const arrows: Arrow[] = [];

  const axisX = new THREE.Vector3(1, 0, 0);
  const axisY = new THREE.Vector3(0, 1, 0);
  const axisZ = new THREE.Vector3(0, 0, 1);
  const scratch = new THREE.Vector3();
  const previousPoint = new THREE.Vector3();
  const impactPoint = new THREE.Vector3();
  const bowWorld = new THREE.Vector3();
  const aimTarget = new THREE.Vector3();
  const aimDirection = new THREE.Vector3(0, 0.4, -1);

  const applyView = () => {
    const half = 0.5 / (0.43 * zoom);
    camera.left = -half;
    camera.right = half;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();

    // Matches the 2D projection exactly: yaw by -lon, then tilt by lat, then roll.
    const yaw = new THREE.Quaternion().setFromAxisAngle(axisY, (-rotation.lon * Math.PI) / 180);
    const tilt = new THREE.Quaternion().setFromAxisAngle(axisX, (rotation.lat * Math.PI) / 180);
    const roll = new THREE.Quaternion().setFromAxisAngle(axisZ, (rotation.roll * Math.PI) / 180);
    planet.quaternion.copy(roll).multiply(tilt).multiply(yaw);
  };

  const applySize = () => {
    renderer.setSize(size, size, false);
  };

  /**
   * Turns a screen-space aim point into a point on the globe itself. Under the
   * orthographic camera the screen position maps straight onto the sphere, so
   * "point at Africa, hit Africa" holds exactly.
   */
  const worldFromScreen = (nx: number, ny: number) => {
    const half = 0.5 / (0.43 * zoom);
    const x = nx * half;
    const y = ny * half;
    const radial = x * x + y * y;
    if (radial >= 0.97) return aimTarget.set(x, y, 0.12);
    return aimTarget.set(x, y, Math.sqrt(1 - radial));
  };

  const territoryAt = (lon: number, lat: number): Territory | null => {
    let best: Territory | null = null;
    let bestDistance = 44;
    activeTerritories.forEach((territory) => {
      const distance = greatCircleDegrees([lon, lat], territory.center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = territory;
      }
    });
    return best;
  };

  const fire = () => {
    if (quiver <= 0) return;
    quiver -= 1;

    const arrow = makeArrow();
    alien.nock.getWorldPosition(bowWorld);
    arrow.position.copy(bowWorld);

    // Loose a real lofted shot: solve for the launch velocity that puts the
    // arrow on the aim point after `flight` seconds under gravity. The arrow
    // climbs over the planet's shoulder and comes down onto the target rather
    // than skimming up into its belly, which is both how a bow actually works
    // and the only way to reach the far north of a sphere from below it.
    const toTarget = worldFromScreen(aim.x, aim.y).clone().sub(bowWorld);
    const distance = Math.max(toTarget.length(), 0.4);
    const speed = ARROW_MIN_SPEED + (ARROW_MAX_SPEED - ARROW_MIN_SPEED) * charge;
    const flight = (distance / speed) * (1.6 - 0.3 * charge);
    const velocity = toTarget.divideScalar(flight);
    velocity.y += 0.5 * Math.abs(GRAVITY) * flight;
    // Drag will shave a little off the way, so lean into the shot slightly.
    velocity.multiplyScalar(1 + AIR_DRAG * flight * 0.55);

    scene.add(arrow);
    arrows.push({ mesh: arrow, velocity, age: 0, stuck: false, stuckAge: 0 });
  };

  const beginDraw = () => {
    drawing = true;
    drawStartedAt = performance.now();
    charge = 0;
  };

  const loose = () => {
    charge = Math.min(1, (performance.now() - drawStartedAt) / DRAW_MILLISECONDS);
    fire();
    drawing = false;
    charge = 0;
  };

  const resolveHit = (position: THREE_NS.Vector3) => {
    // Bring the hit point back into the planet's own frame, then read it as
    // longitude/latitude using the same convention as the 2D projection.
    const local = scratch.copy(position).applyQuaternion(planet.quaternion.clone().invert()).normalize();
    const lat = (Math.asin(clamp(local.y, -1, 1)) * 180) / Math.PI;
    const lon = (Math.atan2(local.x, local.z) * 180) / Math.PI;

    if (!mask.isLand(lon, lat)) {
      events.onShot({ territory: null, unlocked: false, lon, lat });
      return;
    }
    const territory = territoryAt(lon, lat);
    events.onShot({
      territory: territory ? territory.name : null,
      unlocked: territory ? territory.unlocked : false,
      lon,
      lat,
    });
  };

  const stepArrows = (delta: number) => {
    for (let index = arrows.length - 1; index >= 0; index -= 1) {
      const arrow = arrows[index];

      if (arrow.stuck) {
        arrow.stuckAge += delta;
        if (arrow.stuckAge > STUCK_LIFETIME) {
          stuckLayer.remove(arrow.mesh);
          arrows.splice(index, 1);
        }
        continue;
      }

      arrow.age += delta;

      // Integrate on a fixed small step regardless of frame rate. A 60fps
      // frame would otherwise fling the arrow a quarter of the planet's radius
      // at a time, and the chord between two such samples cuts the corner and
      // lands the shot short of where it was aimed.
      let remaining = delta;
      let landed = false;
      while (remaining > 0.00001 && !landed) {
        const step = Math.min(remaining, PHYSICS_STEP);
        remaining -= step;

        previousPoint.copy(arrow.mesh.position);
        const before = previousPoint.length();
        arrow.velocity.y += GRAVITY * step;
        arrow.velocity.multiplyScalar(Math.max(0, 1 - AIR_DRAG * step));
        arrow.mesh.position.addScaledVector(arrow.velocity, step);

        if (before > IMPACT_RADIUS && arrow.mesh.position.length() <= IMPACT_RADIUS) {
          // Walk back along this step to the moment of impact, so the reading
          // is the tile the arrow actually pierced.
          let outside = 0;
          let inside = 1;
          for (let pass = 0; pass < 12; pass += 1) {
            const middle = (outside + inside) / 2;
            const length = impactPoint.copy(previousPoint).lerp(arrow.mesh.position, middle).length();
            if (length > IMPACT_RADIUS) outside = middle;
            else inside = middle;
          }
          impactPoint.copy(previousPoint).lerp(arrow.mesh.position, inside);
          arrow.mesh.position.copy(impactPoint);
          landed = true;
        }
      }

      if (arrow.velocity.lengthSq() > 0.0001) {
        arrow.mesh.lookAt(scratch.copy(arrow.mesh.position).add(arrow.velocity));
      }

      if (landed) {
        resolveHit(arrow.mesh.position);
        arrow.stuck = true;
        // Re-parent onto the planet so the arrow rides along as the world spins.
        planet.worldToLocal(arrow.mesh.position);
        arrow.mesh.quaternion.premultiply(planet.quaternion.clone().invert());
        scene.remove(arrow.mesh);
        stuckLayer.add(arrow.mesh);
        continue;
      }

      if (arrow.age > ARROW_LIFETIME || arrow.mesh.position.length() > 12) {
        scene.remove(arrow.mesh);
        arrows.splice(index, 1);
      }
    }
  };

  const stepAlien = (delta: number, elapsed: number) => {
    const inputX = clamp(move.x + (keys.right ? 1 : 0) - (keys.left ? 1 : 0), -1, 1);
    const inputZ = clamp(move.y + (keys.up ? 1 : 0) - (keys.down ? 1 : 0), -1, 1);
    const moving = Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05;

    walker.x = clamp(walker.x + inputX * WALK_SPEED * delta, -WALK_LIMIT_X, WALK_LIMIT_X);
    walker.z = clamp(walker.z + inputZ * WALK_SPEED * delta, 0, 1);

    const worldX = walker.x;
    const worldY = SLAB_BASE_Y + walker.z * SLAB_RISE;
    const worldZ = SLAB_BASE_Z - walker.z * SLAB_DEPTH;
    alien.group.position.set(worldX, worldY, worldZ);

    // Aim: from the bow toward wherever the player is pointing on the globe.
    const target = worldFromScreen(aim.x, aim.y);
    aimDirection.copy(target).sub(alien.group.position);
    aimDirection.y += 0.12;
    if (aimDirection.lengthSq() < 0.0001) aimDirection.set(0, 0.3, -1);
    aimDirection.normalize();

    const facing = Math.atan2(aimDirection.x, aimDirection.z);
    walker.facing = facing;
    alien.group.rotation.y = facing;

    const pitch = Math.asin(clamp(aimDirection.y, -1, 1));
    alien.bowArm.rotation.x = -Math.PI / 2 - pitch * 0.9;
    alien.bowArm.rotation.z = 0.12;
    alien.drawArm.rotation.x = -Math.PI / 2.35 - pitch * 0.75 + charge * 0.12;
    alien.drawArm.rotation.z = -0.42 - charge * 0.24;

    // Draw the string back as the shot charges.
    const pull = 0.02 + charge * 0.2;
    alien.string.position.set(0, 0, -pull);
    alien.string.scale.set(1, 1, 1);
    alien.string.rotation.set(0, 0, 0);
    alien.nock.position.set(0, 0, 0.24 - pull * 0.2);

    if (moving) {
      walker.stride += delta * 9;
      const swing = Math.sin(walker.stride) * 0.55;
      alien.leftLeg.rotation.x = swing;
      alien.rightLeg.rotation.x = -swing;
      alien.body.position.y = Math.abs(Math.sin(walker.stride)) * 0.02;
    } else {
      walker.stride = 0;
      alien.leftLeg.rotation.x *= 0.82;
      alien.rightLeg.rotation.x *= 0.82;
      alien.body.position.y = Math.sin(elapsed * 1.8) * 0.012;
    }
  };

  // ---------------------------------------------------------------- input --

  const onKeyDown = (event: KeyboardEvent) => {
    const code = event.code;
    if (code === "KeyW" || code === "ArrowUp") keys.up = true;
    else if (code === "KeyS" || code === "ArrowDown") keys.down = true;
    else if (code === "KeyA" || code === "ArrowLeft") keys.left = true;
    else if (code === "KeyD" || code === "ArrowRight") keys.right = true;
    else if (code === "Space") {
      if (!drawing) beginDraw();
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    const code = event.code;
    if (code === "KeyW" || code === "ArrowUp") keys.up = false;
    else if (code === "KeyS" || code === "ArrowDown") keys.down = false;
    else if (code === "KeyA" || code === "ArrowLeft") keys.left = false;
    else if (code === "KeyD" || code === "ArrowRight") keys.right = false;
    else if (code === "Space") {
      if (drawing) loose();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // ----------------------------------------------------------------- loop --

  let previous = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    if (disposed) return;
    frame = window.requestAnimationFrame(tick);
    const raw = (now - previous) / 1000;
    // Physics gets a tightly clamped step so a stalled tab can't teleport an
    // arrow through the planet. The draw meter and the quiver run on real
    // elapsed time instead, so a full draw always takes the same ~0.9s no
    // matter what frame rate the device manages.
    const delta = Math.min(raw, 0.05);
    const wall = Math.min(raw, 0.25);
    previous = now;
    const elapsed = now / 1000;

    // Charge is read straight off the clock rather than accumulated per frame,
    // so a slow device draws the bow at exactly the same rate as a fast one.
    if (drawing && quiver > 0) charge = Math.min(1, (now - drawStartedAt) / DRAW_MILLISECONDS);
    else if (!drawing) charge = Math.max(0, charge - wall * 3);

    if (quiver < QUIVER_MAX) {
      reload += wall;
      if (reload >= RELOAD_SECONDS) {
        reload = 0;
        quiver += 1;
      }
    }

    stepAlien(delta, elapsed);
    stepArrows(delta);

    const orbit = elapsed * 0.32;
    satellite.group.position.set(
      Math.cos(orbit) * 1.52,
      Math.sin(orbit * 0.6) * 0.42 + 0.18,
      Math.sin(orbit) * 1.52,
    );
    satellite.group.rotation.y = -orbit + Math.PI / 2;
    satellite.group.rotation.z = Math.sin(elapsed * 0.7) * 0.12;
    satellite.beacon.emissiveIntensity = 1.1 + Math.abs(Math.sin(elapsed * 3.1)) * 2.4;

    const roundedCharge = Math.round(charge * 100) / 100;
    if (roundedCharge !== lastCharge) {
      lastCharge = roundedCharge;
      events.onCharge(roundedCharge);
    }
    if (quiver !== lastQuiver) {
      lastQuiver = quiver;
      events.onQuiver(quiver);
    }

    renderer.render(scene, camera);
  };

  applyView();
  applySize();
  frame = window.requestAnimationFrame(tick);

  return {
    setView: (nextRotation, nextZoom) => {
      rotation.lon = nextRotation.lon;
      rotation.lat = nextRotation.lat;
      rotation.roll = nextRotation.roll;
      zoom = nextZoom;
      applyView();
    },
    setSize: (nextSize) => {
      size = nextSize;
      applySize();
    },
    setTerritories: (next) => {
      activeTerritories = next;
    },
    setAim: (x, y) => {
      aim.x = clamp(x, -1.4, 1.4);
      aim.y = clamp(y, -1.4, 1.4);
    },
    setMove: (x, y) => {
      move.x = clamp(x, -1, 1);
      move.y = clamp(y, -1, 1);
    },
    setDrawing: (next) => {
      if (next) {
        if (!drawing) beginDraw();
        return;
      }
      if (drawing) loose();
    },
    cancelDraw: () => {
      drawing = false;
      charge = 0;
    },
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.dispose();
      landGeometry.dispose();
    },
  };
}
