/// <reference types="vite/client" />
import type * as THREE_NS from "three";
import { geoEquirectangular, geoPath } from "d3-geo";
import { territoryFromLonLat } from "../lib/territories";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX?: () => number;
      getZ?: () => number;
      getIsland?: () => { x: number; y: number; z: number; az: number; el: number };
      getFlight?: () => { depth: number; heading: number };
      setKeys?: (codes: string[]) => void;
    };
  }
}

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
export type AlienType = "original" | "doop" | "zorp";

/** Bolt-on satellite upgrades. "beacon-warm" recolors the existing beacon
 * instead of adding geometry, so it's handled specially wherever this is
 * consumed. */
export type SatellitePartId = "thrusters" | "big-dish" | "extra-panels" | "beacon-warm";

/** The objects the Cube panel's position editor can nudge along X/Y/Z and
 * lock in place. "ufo" moves both saucers' shared orbit centre together. */
export type EditTargetId = "globe" | "land" | "ocean" | "platform" | "alien" | "satellite" | "ufo" | "moon";
export type EditOffset = { x: number; y: number; z: number; locked: boolean };

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
  setActive: (active: boolean) => void;
  setAlienType: (type: AlienType) => void;
  setAimMode: (active: boolean) => void;
  setView: (rotation: { lon: number; lat: number; roll: number }, zoom: number) => void;
  setSize: (width: number, height: number) => void;
  setTerritories: (territories: Territory[]) => void;
  /** Screen-space aim point, normalised to -1..1 with +y up. */
  setAim: (x: number, y: number) => void;
  /** Analogue move input from the mobile joystick, -1..1 on each axis. */
  setMove: (x: number, y: number) => void;
  setDrawing: (drawing: boolean) => void;
  /** Abandon a draw without loosing an arrow (the pointer turned into a drag). */
  cancelDraw: () => void;
  /** Multiply the extruded land vertex colours (0xffffff = original palette). */
  setLandColor: (hex: number) => void;
  /** Swaps every land vertex to a red/white/blue "Old Glory" banding (baked
   * at build time, so this is a cheap attribute swap, not a rebuild). */
  setLandFlagMode: (enabled: boolean) => void;
  /** Replaces every bolt-on satellite upgrade with this set (empty = stock satellite). */
  setSatelliteLoadout: (parts: SatellitePartId[]) => void;
  /** Tumbles the whole enclosed universe — box included — as one rigid
   * whole, independent of the normal drag-the-globe view rotation. */
  setBoxRotation: (rotation: { lon: number; lat: number }) => void;
  /** Nudges one object's animated path by this offset along the given axis.
   * No-ops while that object is locked. */
  setEditOffset: (target: EditTargetId, axis: "x" | "y" | "z", value: number) => void;
  setEditLock: (target: EditTargetId, locked: boolean) => void;
  getEditOffsets: () => Record<EditTargetId, EditOffset>;
  setSelectedTarget: (target: EditTargetId) => void;
  setPlatformScale: (scale: number) => void;
  setPlatformYaw: (degrees: number) => void;
  hopAlien: () => void;
  ragdollAlien: () => void;
  /** Arms (or disarms, with null) a raise/lower terrain brush; painting
   * happens by aiming (setAim) and calling paintTerrain while armed. */
  setTerrainBrush: (mode: "raise" | "lower" | null) => void;
  /** Sculpts land height at the current aim point, once per call — call
   * this continuously (e.g. on pointer move) while the brush is armed. */
  paintTerrain: () => void;
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

const ALIEN_SCALE = 0.8;
const WALK_SPEED = 0.42;
/** The walkable slab is tilted toward the camera, so walking "back" also
 * walks up the screen — an isometric read that keeps depth legible under an
 * orthographic camera. */
const SLAB_RISE = 0.22;
const SLAB_DEPTH = 0.5;
const SLAB_RADIUS = 0.68;
const WALK_LIMIT_X = 0.48;

const LAND_STOPS: { at: number; rgb: [number, number, number] }[] = [
  { at: 0, rgb: [0x18, 0x3f, 0x43] },
  { at: 0.34, rgb: [0x36, 0x77, 0x6a] },
  { at: 0.7, rgb: [0x74, 0xaa, 0x62] },
  { at: 1, rgb: [0xf1, 0xc8, 0x6e] },
];
const ICE_RGB: [number, number, number] = [0xc8, 0xee, 0xf1];

// "Old Glory" recolour, triggered when an arrow lands on America. Not a
// geographically accurate flag — every landmass on the planet gets banded
// red/white with a blue canton in its upper-left, purely decorative.
const FLAG_STRIPES = 13;
const FLAG_RED: [number, number, number] = [0xb2, 0x22, 0x34];
const FLAG_WHITE: [number, number, number] = [0xf2, 0xf2, 0xf0];
const FLAG_BLUE: [number, number, number] = [0x0a, 0x3a, 0x6e];

const flagTint = (lat: number, lon: number): [number, number, number] => {
  const stripeBand = Math.floor(((90 - lat) / 180) * FLAG_STRIPES);
  const inCanton = lat > 15 && ((lon + 180) % 360) < 140;
  if (inCanton) return FLAG_BLUE;
  return stripeBand % 2 === 0 ? FLAG_RED : FLAG_WHITE;
};

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
function buildLandGeometry(
  THREE: typeof THREE_NS,
  mask: LandMask,
  heightOverride?: Float32Array,
): { geometry: THREE_NS.BufferGeometry; flagColors: Float32Array } {
  const positions: number[] = [];
  const colors: number[] = [];
  const flagColors: number[] = [];
  const deltaLon = 360 / LON_CELLS;
  const deltaLat = 180 / LAT_CELLS;

  const pushVertex = (
    lon: number,
    lat: number,
    radius: number,
    rgb: [number, number, number],
    flagRgb: [number, number, number],
  ) => {
    const [x, y, z] = directionFor(lon, lat);
    positions.push(x * radius, y * radius, z * radius);
    colors.push(srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2]));
    flagColors.push(srgbToLinear(flagRgb[0]), srgbToLinear(flagRgb[1]), srgbToLinear(flagRgb[2]));
  };

  const pushQuad = (
    corners: [number, number][],
    radii: [number, number, number, number],
    rgb: [number, number, number],
    flagRgb: [number, number, number],
  ) => {
    const [a, b, c, d] = corners;
    pushVertex(a[0], a[1], radii[0], rgb, flagRgb);
    pushVertex(b[0], b[1], radii[1], rgb, flagRgb);
    pushVertex(c[0], c[1], radii[2], rgb, flagRgb);
    pushVertex(a[0], a[1], radii[0], rgb, flagRgb);
    pushVertex(c[0], c[1], radii[2], rgb, flagRgb);
    pushVertex(d[0], d[1], radii[3], rgb, flagRgb);
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
      const warp = heightOverride ? heightOverride[row * LON_CELLS + column] ?? 0 : 0;
      const height = (ice ? ICE_HEIGHT : LAND_HEIGHT) + warp;
      const top = GLOBE_RADIUS + height;
      const jitter = hashNoise(column, row);
      const rgb: [number, number, number] = ice
        ? [ICE_RGB[0] - jitter * 14, ICE_RGB[1] - jitter * 10, ICE_RGB[2] - jitter * 6]
        : landTint(latCenter, jitter);
      const flagRgb = flagTint(latCenter, lonCenter);

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
        flagRgb,
      );

      // Cliff walls wherever this cell touches water — or, once terrain has
      // been warped, wherever it steps down to a shorter land neighbour, so
      // raised/lowered cells still read as solid blocks rather than a gap
      // you can see straight through into the globe.
      const cliff: [number, number, number] = [rgb[0] * 0.62, rgb[1] * 0.62, rgb[2] * 0.66];
      const flagCliff: [number, number, number] = [flagRgb[0] * 0.62, flagRgb[1] * 0.62, flagRgb[2] * 0.66];
      const neighbours: { lon: number; lat: number; row: number; column: number; edge: [number, number][] }[] = [
        { lon: lonCenter, lat: latCenter + deltaLat, row: row - 1, column, edge: [[lonLeft, latTop], [lonRight, latTop]] },
        { lon: lonCenter, lat: latCenter - deltaLat, row: row + 1, column, edge: [[lonRight, latBottom], [lonLeft, latBottom]] },
        { lon: lonCenter - deltaLon, lat: latCenter, row, column: (column - 1 + LON_CELLS) % LON_CELLS, edge: [[lonLeft, latBottom], [lonLeft, latTop]] },
        { lon: lonCenter + deltaLon, lat: latCenter, row, column: (column + 1) % LON_CELLS, edge: [[lonRight, latTop], [lonRight, latBottom]] },
      ];

      neighbours.forEach((neighbour) => {
        const outside = neighbour.lat > 90 || neighbour.lat < -90;
        const [start, end] = neighbour.edge;
        if (outside || !mask.isLand(neighbour.lon, neighbour.lat)) {
          pushQuad([start, end, end, start], [top, top, GLOBE_RADIUS, GLOBE_RADIUS], cliff, flagCliff);
          return;
        }
        if (!heightOverride) return;
        const neighbourIce = mask.isIce(neighbour.lon, neighbour.lat);
        const neighbourWarp = heightOverride[neighbour.row * LON_CELLS + neighbour.column] ?? 0;
        const neighbourTop = GLOBE_RADIUS + (neighbourIce ? ICE_HEIGHT : LAND_HEIGHT) + neighbourWarp;
        if (neighbourTop < top - 0.0005) {
          pushQuad([start, end, end, start], [top, top, neighbourTop, neighbourTop], cliff, flagCliff);
        }
      });
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return { geometry, flagColors: new Float32Array(flagColors) };
}

type AlienRig = {
  group: THREE_NS.Group;
  body: THREE_NS.Group;
  torso: THREE_NS.Group;
  head: THREE_NS.Group;
  frontLeg: { hip: THREE_NS.Group; knee: THREE_NS.Group };
  backLeg: { hip: THREE_NS.Group; knee: THREE_NS.Group };
  bowArm: { shoulder: THREE_NS.Group; elbow: THREE_NS.Group };
  gunArm: { shoulder: THREE_NS.Group; elbow: THREE_NS.Group };
  bow: THREE_NS.Group;
  quiver: THREE_NS.Group;
  revolver: THREE_NS.Group;
  ak47: THREE_NS.Group;
  muzzle: THREE_NS.Object3D;
  stringUpper: THREE_NS.Mesh;
  stringLower: THREE_NS.Mesh;
  nockedArrow: THREE_NS.Group;
  nock: THREE_NS.Object3D;
};

/** Bow limb half-length, in the bow's own local space. */
const BOW_REACH = 0.34;

/**
 * The Urf scout: a low-poly alien archer built to the reference art — bright
 * green faceted body, big teardrop skull with black almond eyes, violet bands
 * at the biceps, waist, thighs and ankles, a quiver of purple-fletched arrows
 * across the back, and a dark recurve bow with a real string that bends to the
 * nock as the shot is drawn.
 *
 * Every joint is a group so the animation code can pose it: two-bone arms and
 * legs, a torso that twists and leans into the shot, and a head that tracks.
 */
function buildAlien(THREE: typeof THREE_NS): AlienRig {
  // Match the playable Alien World rig: brighter greentall skin, faceted
  // geometry, violet wraps and the same oversized shooter-style skull.
  const skin = new THREE.MeshStandardMaterial({ color: 0x7cff3a, emissive:0x164a08, emissiveIntensity:.2, flatShading: true, roughness: 0.46, metalness: 0.04 });
  const skinShade = new THREE.MeshStandardMaterial({ color: 0x3aaa1c, flatShading: true, roughness: 0.58 });
  const band = new THREE.MeshStandardMaterial({ color: 0x6b2d9b, emissive:0x4a1060, emissiveIntensity:.25, flatShading: true, roughness: 0.5, metalness: 0.15 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x0a0610, roughness: 0.12, metalness: 0.5 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5730, flatShading: true, roughness: 0.78 });
  const cord = new THREE.MeshStandardMaterial({ color: 0xf0e6cf, roughness: 0.45 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x40261a, flatShading: true, roughness: 0.9 });
  const fletch = new THREE.MeshStandardMaterial({ color: 0xa855f7, flatShading: true, roughness: 0.55, side: THREE.DoubleSide });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc8d4e0, flatShading: true, roughness: 0.25, metalness: 0.8 });

  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  /** A tapered faceted limb segment, hanging down from its pivot. */
  const bone = (length: number, top: number, bottom: number, material: THREE_NS.Material) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, length, 5), material);
    mesh.position.y = -length / 2;
    return mesh;
  };

  const ring = (radius: number, thickness: number) => new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 6), band);

  // ---------------------------------------------------------- legs ----
  // A wide archer stance: front leg planted forward, back leg braced.
  const buildLeg = (forward: number) => {
    const hip = new THREE.Group();
    hip.position.set(forward * 0.13, 0.5, forward * 0.04);
    body.add(hip);

    hip.add(bone(0.28, 0.058, 0.05, skin));
    const thighBand = ring(0.062, 0.03);
    thighBand.position.y = -0.1;
    hip.add(thighBand);

    const knee = new THREE.Group();
    knee.position.y = -0.28;
    hip.add(knee);
    knee.add(bone(0.26, 0.05, 0.036, skin));

    const ankleBand = ring(0.045, 0.026);
    ankleBand.position.y = -0.22;
    knee.add(ankleBand);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.035, 0.16), skinShade);
    foot.position.set(0, -0.27, 0.04);
    knee.add(foot);
    [-1, 0, 1].forEach((toe) => {
      const digit = new THREE.Mesh(new THREE.ConeGeometry(.012, .07, 5), skinShade);
      digit.rotation.x = Math.PI / 2;
      digit.position.set(toe * .025, -.27, .145);
      knee.add(digit);
    });

    return { hip, knee };
  };
  const frontLeg = buildLeg(1);
  const backLeg = buildLeg(-1);

  // --------------------------------------------------------- torso ----
  const torso = new THREE.Group();
  torso.position.y = 0.5;
  body.add(torso);

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.072, 0.1, 6), skin);
  pelvis.position.y = 0.04;
  torso.add(pelvis);

  const waist = ring(0.092, 0.038);
  waist.position.y = 0.075;
  torso.add(waist);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.082, 0.25, 6), skin);
  chest.position.y = 0.21;
  torso.add(chest);

  // Sash across the chest, the way the reference art wears it.
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.32, 0.19), band);
  sash.position.set(0, 0.2, 0);
  sash.rotation.x = 0.32;
  torso.add(sash);

  // ---------------------------------------------------------- head ----
  const head = new THREE.Group();
  head.position.y = 0.37;
  torso.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.06, 5), skin);
  neck.position.y = -0.02;
  head.add(neck);

  // The classic teardrop cranium: wide and tall up top, tapering to a chin.
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.145, 2), skin);
  skull.scale.set(.98, 1.38, 1.14);
  skull.position.y = 0.13;
  head.add(skull);

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.085,10,8), skinShade);
  jaw.scale.set(.85,.68,.9);
  jaw.position.set(0,0,.035);
  head.add(jaw);

  [-1, 1].forEach((side) => {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.006, .01, .16, 5), skinShade);
    antenna.position.set(side * .055, .3, 0);
    antenna.rotation.z = side * -.28;
    head.add(antenna);
    const antennaGlow = new THREE.Mesh(
      new THREE.SphereGeometry(.019, 7, 5),
      new THREE.MeshStandardMaterial({ color: 0x8dff78, emissive: 0x39ff66, emissiveIntensity: 1.5 }),
    );
    antennaGlow.position.set(side * .077, .376, 0);
    head.add(antennaGlow);
  });

  [-1, 1].forEach((side) => {
    const almond = new THREE.Mesh(new THREE.IcosahedronGeometry(0.062, 1), eye);
    almond.scale.set(1.28, 1.58, 0.86);
    almond.position.set(side * 0.062, 0.125, 0.108);
    almond.rotation.z = side * 0.22;
    almond.rotation.y = side * -0.18;
    head.add(almond);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xf8fff4 }),
    );
    glint.position.set(side * 0.048, 0.142, 0.148);
    head.add(glint);
  });

  // -------------------------------------------------------- quiver ----
  const quiver = new THREE.Group();
  quiver.position.set(-0.03, 0.25, -0.085);
  quiver.rotation.set(0.24, 0, 0.42);
  torso.add(quiver);

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.21, 6), leather);
  quiver.add(tube);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.3, 0.13), band);
  strap.rotation.z = -0.38;
  strap.position.set(0.05, 0.02, 0.06);
  quiver.add(strap);

  for (let index = 0; index < 4; index += 1) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 4), wood);
    shaft.position.set((index - 1.5) * 0.02, 0.19, (index % 2) * 0.016 - 0.008);
    quiver.add(shaft);
    const vane = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 4), fletch);
    vane.position.set((index - 1.5) * 0.02, 0.3, (index % 2) * 0.016 - 0.008);
    quiver.add(vane);
  }

  // ---------------------------------------------------------- arms ----
  const buildArm = (side: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.1, 0.31, 0);
    torso.add(shoulder);

    const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.052, 0), skin);
    shoulder.add(cap);
    shoulder.add(bone(0.23, 0.045, 0.036, skin));

    const bicep = ring(0.05, 0.028);
    bicep.position.y = -0.11;
    shoulder.add(bicep);

    const elbow = new THREE.Group();
    elbow.position.y = -0.23;
    shoulder.add(elbow);
    elbow.add(bone(0.22, 0.036, 0.028, skin));

    const wrist = ring(0.036, 0.024);
    wrist.position.y = -0.19;
    elbow.add(wrist);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 6), skinShade);
    hand.scale.set(0.88, 1.22, 0.82);
    hand.position.y = -0.24;
    elbow.add(hand);

    return { shoulder, elbow };
  };
  const bowArm = buildArm(1);
  const gunArm = buildArm(-1);
  gunArm.shoulder.visible = false;

  // ----------------------------------------------------------- bow ----
  // A recurve profile swept along a curve, so the limbs actually curl back at
  // the tips the way the reference bow does.
  const bow = new THREE.Group();
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -BOW_REACH, 0.055),
    new THREE.Vector3(0, -BOW_REACH * 0.72, -0.012),
    new THREE.Vector3(0, -BOW_REACH * 0.3, -0.045),
    new THREE.Vector3(0, 0, -0.052),
    new THREE.Vector3(0, BOW_REACH * 0.3, -0.045),
    new THREE.Vector3(0, BOW_REACH * 0.72, -0.012),
    new THREE.Vector3(0, BOW_REACH, 0.055),
  ]);
  const limb = new THREE.Mesh(new THREE.TubeGeometry(spine, 26, 0.018, 5, false), wood);
  bow.add(limb);

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 6), leather);
  grip.position.z = -0.052;
  bow.add(grip);

  const stringUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), cord);
  const stringLower = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), cord);
  bow.add(stringUpper, stringLower);

  // The arrow sitting on the string, shown only while the bow is drawn.
  const nockedArrow = new THREE.Group();
  const nockedShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.66, 5), wood);
  nockedShaft.rotation.x = Math.PI / 2;
  nockedArrow.add(nockedShaft);
  const nockedHead = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.06, 4), steel);
  nockedHead.rotation.x = Math.PI / 2;
  nockedHead.position.z = 0.36;
  nockedArrow.add(nockedHead);
  for (let index = 0; index < 3; index += 1) {
    const vane = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.05), fletch);
    vane.position.z = -0.3;
    vane.rotation.z = (index / 3) * Math.PI * 2;
    vane.rotation.y = Math.PI / 2;
    nockedArrow.add(vane);
  }
  bow.add(nockedArrow);

  const nock = new THREE.Object3D();
  bow.add(nock);

  // The bow hangs from the bow hand.
  bow.position.set(0, -0.26, 0.02);
  bowArm.elbow.add(bow);

  // Guns are held at the very back/bottom of the stock so the complete arm
  // and complete weapon remain visible with only the hand-tip touching.
  const revolver = new THREE.Group();
  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x252733, flatShading: true, roughness: .28, metalness: .86 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x5a2719, flatShading: true, roughness: .78 });
  const revBarrel = new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.36,8),gunmetal); revBarrel.rotation.x=Math.PI/2; revBarrel.position.z=.2; revolver.add(revBarrel);
  const revCylinder = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.1,10),gunmetal); revCylinder.rotation.z=Math.PI/2; revCylinder.position.z=.02; revolver.add(revCylinder);
  const revGrip = new THREE.Mesh(new THREE.BoxGeometry(.075,.18,.07),gripMat); revGrip.position.set(0,-.09,-.035); revGrip.rotation.x=-.24; revolver.add(revGrip);
  const ak47 = new THREE.Group();
  const akBody = new THREE.Mesh(new THREE.BoxGeometry(.11,.11,.48),gunmetal); akBody.position.z=.22; ak47.add(akBody);
  const akBarrel = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.48,7),gunmetal); akBarrel.rotation.x=Math.PI/2; akBarrel.position.z=.7; ak47.add(akBarrel);
  const akStock = new THREE.Mesh(new THREE.BoxGeometry(.12,.16,.3),gripMat); akStock.position.set(0,-.02,-.2); akStock.rotation.x=.16; ak47.add(akStock);
  const akMag = new THREE.Mesh(new THREE.BoxGeometry(.075,.22,.12),gripMat); akMag.position.set(0,-.15,.25); akMag.rotation.x=-.32; ak47.add(akMag);
  revolver.visible = false; ak47.visible = false;
  const weaponMount = new THREE.Group(); weaponMount.position.set(0,-.28,.02); weaponMount.rotation.x=-Math.PI/2; gunArm.elbow.add(weaponMount); weaponMount.add(revolver,ak47);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0,0,.96); weaponMount.add(muzzle);

  return { group, body, torso, head, frontLeg, backLeg, bowArm, gunArm, bow, quiver, revolver, ak47, muzzle, stringUpper, stringLower, nockedArrow, nock };
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
  const rockTop = new THREE.MeshStandardMaterial({ color: 0xb0459d, flatShading: true, roughness: 0.82 });
  const crystal = new THREE.MeshStandardMaterial({ color: 0x39e6d4, flatShading: true, roughness: 0.25, metalness: 0.3, emissive: 0x0d5f5a, emissiveIntensity: 0.5 });
  const cap = new THREE.MeshStandardMaterial({ color: 0xff7ad4, flatShading: true, roughness: 0.6 });
  const stalk = new THREE.MeshStandardMaterial({ color: 0x8f4fd8, flatShading: true, roughness: 0.7 });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x33dfff, transparent: true, opacity: 0.16 });

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(SLAB_RADIUS, SLAB_RADIUS * 0.96, 0.055, 12), rockTop);
  group.add(deck);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(SLAB_RADIUS * 1.02, SLAB_RADIUS * .96, .075, 12)),
    edgeMaterial,
  );
  edge.position.y = .015;
  group.add(edge);

  const underglow = new THREE.Mesh(
    new THREE.TorusGeometry(SLAB_RADIUS * .82, .018, 5, 42),
    new THREE.MeshBasicMaterial({ color: 0x20cfff, transparent: true, opacity: .08 }),
  );
  underglow.rotation.x = Math.PI / 2;
  underglow.position.y = -.08;
  group.add(underglow);

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

  return { group, edgeMaterial, underglow: underglow.material as THREE_NS.MeshBasicMaterial };
}

/** A bolt-on satellite part. Added into a dedicated upgrade slot on the
 * stock satellite so the base model never has to be rebuilt or torn down. */
function buildSatelliteUpgrade(THREE: typeof THREE_NS, id: SatellitePartId): THREE_NS.Object3D {
  const hull = new THREE.MeshStandardMaterial({ color: 0xd8e6f2, flatShading: true, roughness: 0.42, metalness: 0.55 });
  const panel = new THREE.MeshStandardMaterial({ color: 0xffa23c, flatShading: true, roughness: 0.3, metalness: 0.6 });
  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x384049,
    flatShading: true,
    roughness: 0.5,
    metalness: 0.4,
    emissive: 0x2a6bff,
    emissiveIntensity: 0.6,
  });

  const group = new THREE.Group();
  if (id === "thrusters") {
    [-1, 1].forEach((side) => {
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), thrusterMat);
      nozzle.position.set(side * 0.03, -0.045, -0.05);
      nozzle.rotation.x = Math.PI;
      group.add(nozzle);
    });
  } else if (id === "big-dish") {
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.05, 10, 1, true), hull);
    dish.rotation.x = Math.PI * 0.62;
    dish.position.set(0, 0.05, 0.07);
    group.add(dish);
  } else if (id === "extra-panels") {
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.006, 0.05), panel);
      wing.position.set(side * 0.19, 0.03, 0);
      group.add(wing);
    });
  }
  // "beacon-warm" adds no geometry — it recolors satellite.beacon directly,
  // handled by whoever applies the loadout.
  return group;
}

/** A cratered, slow-spinning moon on its own wide orbit around the scene. */
function buildMoon(THREE: typeof THREE_NS) {
  const surface = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, flatShading: true, roughness: 1, metalness: 0 });
  const craterMat = new THREE.MeshStandardMaterial({ color: 0x9a9ea4, flatShading: true, roughness: 1 });

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), surface);
  group.add(body);

  const craterSpots: [number, number, number, number][] = [
    [0.12, 0.08, 0.19, 0.05],
    [-0.1, -0.05, 0.2, 0.04],
    [0.02, 0.16, -0.15, 0.06],
    [-0.14, 0.02, -0.16, 0.045],
    [0.15, -0.13, -0.08, 0.035],
  ];
  craterSpots.forEach(([x, y, z, r]) => {
    const crater = new THREE.Mesh(new THREE.CircleGeometry(r, 8), craterMat);
    crater.position.set(x, y, z);
    crater.lookAt(x * 2, y * 2, z * 2);
    group.add(crater);
  });

  return { group, body };
}

/** A little flying saucer with a downward tractor-beam cone. Purely
 * decorative — it never interacts with the archer or the territories. */
function buildUfo(THREE: typeof THREE_NS) {
  const hull = new THREE.MeshStandardMaterial({ color: 0x8fa6b8, flatShading: true, roughness: 0.35, metalness: 0.7 });
  const dome = new THREE.MeshStandardMaterial({
    color: 0x9be8ff,
    flatShading: true,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.75,
  });
  const glow = new THREE.MeshBasicMaterial({ color: 0x9dffb0, transparent: true, opacity: 0.5 });

  const group = new THREE.Group();
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.03, 12), hull);
  group.add(saucer);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), dome);
  canopy.position.y = 0.02;
  group.add(canopy);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 10, 1, true), glow);
  beam.position.y = -0.1;
  beam.rotation.x = Math.PI;
  group.add(beam);

  return { group, beam };
}

/** A fiery meteor with a tapered tail. Spawned off-screen, flies a straight
 * line through the scene, and is discarded after a few seconds. */
function buildMeteorTrail(THREE: typeof THREE_NS) {
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x5a3a2a,
    flatShading: true,
    roughness: 0.95,
    emissive: 0xff5a1f,
    emissiveIntensity: 0.9,
  });
  const trailMat = new THREE.MeshBasicMaterial({ color: 0xffa347, transparent: true, opacity: 0.55 });

  const group = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), rockMat);
  group.add(rock);
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.5, 6, 1, true), trailMat);
  trail.position.z = 0.28;
  trail.rotation.x = -Math.PI / 2;
  group.add(trail);

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
  kind: "arrow" | "pepsi";
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
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
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

  // The playable universe's outer boundary: a large wireframe cube holding
  // the planet, satellite, moon, UFOs and the alien's platform all inside
  // one enclosed volume of empty XYZ space. Fixed in place (never rotated or
  // moved) so it reads as the walls of the space everything else lives and
  // moves inside, rather than another object drifting around with the rest
  // of the scene.
  // True to the scene's actual scale — big enough to hold the globe, the
  // satellite's and UFOs' orbits, the moon's much wider orbit, and the
  // meteors' spawn range, all with real margin. The camera's zoom range
  // (see the wheel handler in WorldSelect.tsx) was widened specifically so
  // scrolling out can actually reveal a box this size, rather than shrinking
  // the box down to whatever the old, much narrower zoom range could show.
  const UNIVERSE_SIZE = 8;
  const universeEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(UNIVERSE_SIZE, UNIVERSE_SIZE, UNIVERSE_SIZE)),
    new THREE.LineBasicMaterial({ color: 0x5be6ff, transparent: true, opacity: 0.4 }),
  );
  scene.add(universeEdges);

  // A faint holodeck-style floor grid on the cube's lower face, purely for a
  // sense of scale and depth inside the empty volume.
  const universeFloor = new THREE.GridHelper(UNIVERSE_SIZE, 16, 0x8a5cff, 0x1c3a4a);
  const floorMaterial = universeFloor.material as THREE_NS.Material & { opacity: number; transparent: boolean };
  floorMaterial.transparent = true;
  floorMaterial.opacity = 0.22;
  universeFloor.position.y = -UNIVERSE_SIZE / 2;
  scene.add(universeFloor);

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

  // Per-cell terrain warp, in world-radius units added on top of the base
  // land/ice height — this is what the Cube panel's raise/lower brush edits.
  // Zero-filled by default, so it changes nothing until the player sculpts.
  const terrainHeights = new Float32Array(LAT_CELLS * LON_CELLS);

  let { geometry: landGeometry, flagColors } = buildLandGeometry(THREE, mask, terrainHeights);
  let landBaseColors = (landGeometry.getAttribute("color") as THREE_NS.BufferAttribute).array.slice() as Float32Array;
  let flagModeActive = false;
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

  /** Rebuilds the land mesh from scratch against the current terrainHeights
   * warp. Not cheap (the full 480x240 grid), so callers throttle this during
   * a drag and only need to call it once more on release. */
  const rebuildLandGeometry = () => {
    const rebuilt = buildLandGeometry(THREE, mask, terrainHeights);
    landMesh.geometry.dispose();
    landMesh.geometry = rebuilt.geometry;
    landGeometry = rebuilt.geometry;
    flagColors = rebuilt.flagColors;
    landBaseColors = (landGeometry.getAttribute("color") as THREE_NS.BufferAttribute).array.slice() as Float32Array;
    if (flagModeActive) {
      const colorAttr = landGeometry.getAttribute("color") as THREE_NS.BufferAttribute;
      (colorAttr.array as Float32Array).set(flagColors);
      colorAttr.needsUpdate = true;
    }
  };

  /** Raises (positive delta) or lowers (negative) land height in a small
   * radius around the given lon/lat, with linear falloff, then rebuilds the
   * mesh. `lon`/`lat` come from the same land-hit coordinates the shooting
   * mechanic already computes, so the brush and the bow aim the same way. */
  const sculptTerrain = (lon: number, lat: number, delta: number, radiusCells: number) => {
    const deltaLon = 360 / LON_CELLS;
    const deltaLat = 180 / LAT_CELLS;
    const centerColumn = Math.floor(((((lon + 180) % 360) + 360) % 360) / deltaLon);
    const centerRow = clamp(Math.floor((90 - lat) / deltaLat), 0, LAT_CELLS - 1);
    for (let dRow = -radiusCells; dRow <= radiusCells; dRow += 1) {
      const row = centerRow + dRow;
      if (row < 0 || row >= LAT_CELLS) continue;
      for (let dColumn = -radiusCells; dColumn <= radiusCells; dColumn += 1) {
        const distance = Math.hypot(dRow, dColumn);
        if (distance > radiusCells) continue;
        const column = ((centerColumn + dColumn) % LON_CELLS + LON_CELLS) % LON_CELLS;
        const falloff = 1 - distance / (radiusCells + 1);
        const index = row * LON_CELLS + column;
        terrainHeights[index] = clamp(terrainHeights[index] + delta * falloff, -0.09, 0.16);
      }
    }
    rebuildLandGeometry();
  };

  const stuckLayer = new THREE.Group();
  planet.add(stuckLayer);

  // Everything that should visibly swing together when the view is dragged —
  // the satellite, moon, UFOs and meteors — lives in here alongside the
  // planet. Before, only the tiny globe sphere spun in place while all of
  // this sat dead still, which read as a spinning sticker rather than real
  // 3D space: nothing else ever reacted, so there was no parallax to sell
  // the depth. Now the drag rotation (applied in applyView) drives this
  // whole group, and the flying island (the alien's platform) is the one
  // thing deliberately left out of it, so it keeps floating independently
  // instead of getting spun along with the rest of the world.
  const worldSpin = new THREE.Group();
  scene.add(worldSpin);

  const satellite = buildSatellite(THREE);
  satellite.group.scale.setScalar(1.5);
  worldSpin.add(satellite.group);

  // Empty slot the customization tab fills with bolt-on parts. Kept as a
  // child of the satellite so upgrades ride its orbit and rotation for free.
  const satelliteUpgrades = new THREE.Group();
  satellite.group.add(satelliteUpgrades);

  const moon = buildMoon(THREE);
  worldSpin.add(moon.group);

  const ufos = [buildUfo(THREE), buildUfo(THREE)];
  ufos.forEach((ufo) => worldSpin.add(ufo.group));

  const meteors: { group: THREE_NS.Group; velocity: THREE_NS.Vector3; age: number }[] = [];
  let meteorTimer = 2.5;

  // The flying island is a parent group so the platform and the scout zip
  // around together. Position is free-roaming spherical coordinates around
  // the planet's face (azimuth, elevation, and now radius/depth too, all
  // player-controlled) with extra wiggle layered on for life. The platform
  // also carries a real yaw that tracks its own heading, so flying it in a
  // full circle visibly spins the platform (and the scout standing on it)
  // all the way around — not just the small settle-wiggle it had before.
  // It still never uses lookAt, so the 2D ocean and 3D land stay aligned;
  // the spin is an explicit rotation the flight controls drive, not a
  // camera-facing correction.
  const FLY_ORBIT = 0.9;
  const FLY_DEPTH = 1.82;
  const FLY_DEPTH_MIN = 1.15;
  const FLY_DEPTH_MAX = 2.6;
  let flyAzimuth = -Math.PI / 2;
  let flyElevation = -0.28;
  let flyDepth = FLY_DEPTH;
  let flyHeading = 0;
  let platformScale = 1;
  let platformYaw = 0;
  let prevIslandX = 0;
  let prevIslandY = 0;
  let selectedTarget: EditTargetId = "globe";

  const placeIsland = (elapsed: number) => {
    const hover = selectedTarget === "platform" ? 0 : 1;
    const wiggleAz = flyAzimuth + hover * (Math.sin(elapsed * 0.37) * 0.1 + Math.sin(elapsed * 0.11) * 0.05);
    const wiggleEl = flyElevation + hover * (Math.sin(elapsed * 0.49) * 0.07 + Math.cos(elapsed * 0.23) * 0.04);
    const wiggleZ = flyDepth + hover * (Math.sin(elapsed * 0.29) * 0.12 + Math.cos(wiggleAz) * 0.18);
    const nextX = Math.sin(wiggleAz) * FLY_ORBIT;
    const nextY = Math.cos(wiggleAz) * FLY_ORBIT * 0.48 + wiggleEl * 0.8 - 0.22;
    islandRoot.position.set(nextX, nextY, wiggleZ);

    // Heading follows the direction of travel across the screen, so banking
    // the platform hard into a turn reads as an actual turn, not a wobble.
    // It's a full, unclamped rotation — several laps around the globe winds
    // this up past a full 360° and keeps going.
    const travel = Math.hypot(nextX - prevIslandX, nextY - prevIslandY);
    if (travel > 0.0004) {
      const targetHeading = Math.atan2(nextX - prevIslandX, nextY - prevIslandY);
      let delta = targetHeading - (flyHeading % (Math.PI * 2));
      delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
      flyHeading += delta * Math.min(1, travel * 18);
    }
    prevIslandX = nextX;
    prevIslandY = nextY;

    islandRoot.rotation.y = flyHeading + platformYaw;
    islandRoot.rotation.z = Math.sin(elapsed * 0.71) * 0.08 - flyHeading * 0.12;
    islandRoot.rotation.x = Math.cos(elapsed * 0.53) * 0.05;
    // The camera tracks the platform's flight much more now — roughly
    // doubled sideways parallax, plus a small dolly in/out that follows the
    // Z/X depth axis — so flying the alien around genuinely reads as the
    // camera moving with them through space, not a fixed viewpoint with a
    // toy drifting in front of it. It still looks straight at the globe's
    // center throughout: the aim math depends on that lookAt target and
    // can't be repointed at the island without redoing the shot geometry.
    camera.up.set(0, 1, 0);
    if (selectedTarget === "platform") {
      const front = new THREE.Vector3(0, 0.72, 2.55)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), islandRoot.rotation.y);
      camera.position.copy(islandRoot.position).add(front);
      camera.lookAt(islandRoot.position.x, islandRoot.position.y + 0.3, islandRoot.position.z);
    } else {
      camera.position.set(
        islandRoot.position.x * 0.42,
        islandRoot.position.y * 0.32,
        8 - (islandRoot.position.z - FLY_DEPTH) * 0.6,
      );
      camera.lookAt(0, 0, 0);
    }
  };

  const islandRoot = new THREE.Group();
  placeIsland(0);
  scene.add(islandRoot);

  const platform = buildPlatform(THREE);
  platform.group.rotation.x = Math.atan2(SLAB_RISE, SLAB_DEPTH);
  platform.group.position.set(0, -0.05, 0);
  islandRoot.add(platform.group);

  const alien = buildAlien(THREE);
  alien.group.scale.setScalar(ALIEN_SCALE);
  islandRoot.add(alien.group);

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
      platform.group.add(propsModel);
    }
  });

  // Loose arrows use the same palette as the one on the string, so a shot in
  // flight reads as the arrow that was just nocked.
  const arrowShaft = new THREE.MeshStandardMaterial({ color: 0x6b4126, flatShading: true, roughness: 0.82 });
  const arrowTip = new THREE.MeshStandardMaterial({ color: 0xc8d4e0, flatShading: true, roughness: 0.25, metalness: 0.8 });
  const arrowFletch = new THREE.MeshStandardMaterial({ color: 0xa855f7, flatShading: true, roughness: 0.55, side: THREE.DoubleSide });
  const arrowGlow = new THREE.MeshBasicMaterial({ color: 0xd9b6ff, transparent: true, opacity: 0.4 });

  const makeArrow = () => {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.4, 5), arrowShaft);
    shaft.rotation.x = Math.PI / 2;
    group.add(shaft);
    // A faceted broadhead rather than a plain cone — it catches the key light
    // and stays readable against the land it lands on.
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.11, 4), arrowTip);
    tip.rotation.x = Math.PI / 2;
    tip.rotation.z = Math.PI / 4;
    tip.position.z = 0.24;
    group.add(tip);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 5), arrowTip);
    collar.rotation.x = Math.PI / 2;
    collar.position.z = 0.185;
    group.add(collar);
    for (let index = 0; index < 3; index += 1) {
      const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.075), arrowFletch);
      fin.position.z = -0.16;
      fin.rotation.z = (index / 3) * Math.PI * 2;
      fin.rotation.y = Math.PI / 2;
      group.add(fin);
    }
    // A soft tracer so the arc is legible against the psychedelic ocean.
    const tracer = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.022, 0.34, 5, 1, true), arrowGlow);
    tracer.rotation.x = -Math.PI / 2;
    tracer.position.z = -0.36;
    group.add(tracer);
    return group;
  };

  const makePepsiProjectile = () => {
    const group = new THREE.Group();
    const label = new THREE.MeshStandardMaterial({ color: 0x1757d7, emissive: 0x071c59, emissiveIntensity: .35, roughness: .34, metalness: .42 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xd8e0eb, roughness: .2, metalness: .92 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.16,14),label); can.rotation.x=Math.PI/2; group.add(can);
    [-.08,.08].forEach((z)=>{const rim=new THREE.Mesh(new THREE.TorusGeometry(.05,.008,5,14),metal);rim.position.z=z;group.add(rim)});
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(.056,.012,6,16),new THREE.MeshBasicMaterial({color:0xef253c})); stripe.rotation.x=Math.PI/2; group.add(stripe);
    group.scale.setScalar(2);
    return group;
  };

  const guideMaterial = new THREE.LineBasicMaterial({ color:0x7cfff0, transparent:true, opacity:.52, blending:THREE.AdditiveBlending, depthWrite:false });
  const guideGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  const aimLaser = new THREE.Line(guideGeometry,guideMaterial);
  const landingX = new THREE.Group();
  const xShape = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.09,-.09,0),new THREE.Vector3(.09,.09,0),
    new THREE.Vector3(.09,-.09,0),new THREE.Vector3(-.09,.09,0),
  ]);
  landingX.add(new THREE.LineSegments(xShape,new THREE.LineBasicMaterial({color:0xff527d,transparent:true,opacity:.82,depthWrite:false})));
  const aimGuide = new THREE.Group(); aimGuide.visible=false; aimGuide.add(aimLaser,landingX); scene.add(aimGuide);

  // ---------------------------------------------------------------- state --

  let activeTerritories = territories;
  let width = canvas.clientWidth || 640;
  let height = canvas.clientHeight || width;
  let zoom = 1;
  let disposed = false;

  const rotation = { lon: 0, lat: -15, roll: 0 };
  const aim = { x: 0.35, y: 0.35 };
  const move = { x: 0, y: 0 };
  const keys = {
    up: false, down: false, left: false, right: false,
    orbitLeft: false, orbitRight: false, tiltUp: false, tiltDown: false,
    zipIn: false, zipOut: false,
  };
  const walker = { x: 0, z: 0.3, vx: 0, vz: 0, y: 0, vy: 0, facing: 0, stride: 0, ragdoll: 0, spin: 0 };

  // Cube edit mode: tumbles the entire enclosed universe (box included) as
  // one rigid whole, and lets each object be nudged along X/Y/Z within it
  // and then locked in place. `editOffsets` positions are added on top of
  // each object's normal animated path (shifting where that path is
  // centred), not a replacement for it.
  let boxLon = 0;
  let boxLat = 0;
  const boxQuaternion = new THREE.Quaternion();
  const editOffsets: Record<EditTargetId, { x: number; y: number; z: number; locked: boolean }> = {
    globe: { x: 0, y: 0, z: 0, locked: false },
    land: { x: 0, y: 0, z: 0, locked: false },
    ocean: { x: 0, y: 0, z: 0, locked: false },
    platform: { x: 0, y: 0, z: 0, locked: false },
    alien: { x: 0, y: 0, z: 0, locked: false },
    satellite: { x: 0, y: 0, z: 0, locked: false },
    ufo: { x: 0, y: 0, z: 0, locked: false },
    moon: { x: 0, y: 0, z: 0, locked: false },
  };
  let terrainBrush: "raise" | "lower" | null = null;

  let drawing = false;
  let alienType: AlienType = "original";
  let aimMode = false;
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
  const cordUp = new THREE.Vector3(0, 1, 0);
  const cordMid = new THREE.Vector3();
  const cordDir = new THREE.Vector3();
  const bowTipUpper = new THREE.Vector3();
  const bowTipLower = new THREE.Vector3();
  const nockPoint = new THREE.Vector3();
  const ikTarget = new THREE.Vector3();
  const ikDirection = new THREE.Vector3();
  const ikAim = new THREE.Quaternion();
  const ikBend = new THREE.Quaternion();
  const limbDown = new THREE.Vector3(0, -1, 0);
  const limbHinge = new THREE.Vector3(1, 0, 0);

  // The globe's own spin (from dragging the globe / gyro knob) — computed
  // here, then combined with the box tumble fresh every frame in
  // syncPlanetQuaternion, since the box can keep changing after applyView
  // last ran.
  const planetLocalQuaternion = new THREE.Quaternion();

  const updateBoxQuaternion = () => {
    const yaw = new THREE.Quaternion().setFromAxisAngle(axisY, (-boxLon * Math.PI) / 180);
    const tilt = new THREE.Quaternion().setFromAxisAngle(axisX, (boxLat * Math.PI) / 180);
    boxQuaternion.copy(tilt).multiply(yaw);
  };

  /** Combines the globe's own spin with the box tumble, applied outside it —
   * spin the globe first, then tumble the whole box it sits in. Re-run every
   * frame so a box-rotate drag updates the globe (and the sky riding along
   * with it via worldSpin) immediately. */
  const syncPlanetQuaternion = () => {
    planet.quaternion.copy(boxQuaternion).multiply(planetLocalQuaternion);
    // The satellite/moon/UFOs/meteors are a separate sibling group (not a
    // child of `planet`, to avoid double-applying this rotation) that gets
    // the identical orientation, so dragging swings the whole sky along with
    // the globe instead of just the little sphere spinning in isolation —
    // and, since planet.quaternion now includes the box tumble too, that
    // rides along with the box for free as well.
    worldSpin.quaternion.copy(planet.quaternion);
  };

  const applyView = () => {
    const half = 0.5 / (0.43 * zoom);
    const aspect = width / Math.max(height, 1);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();

    // Matches the 2D projection exactly: yaw by -lon, then tilt by lat, then roll.
    const yaw = new THREE.Quaternion().setFromAxisAngle(axisY, (-rotation.lon * Math.PI) / 180);
    const tilt = new THREE.Quaternion().setFromAxisAngle(axisX, (rotation.lat * Math.PI) / 180);
    const roll = new THREE.Quaternion().setFromAxisAngle(axisZ, (rotation.roll * Math.PI) / 180);
    planetLocalQuaternion.copy(roll).multiply(tilt).multiply(yaw);
    syncPlanetQuaternion();
  };

  const applySize = () => {
    renderer.setSize(width, height, false);
  };

  /**
   * Turns a screen-space aim point into a point on the globe itself. Under the
   * orthographic camera the screen position maps straight onto the sphere, so
   * "point at Africa, hit Africa" holds exactly.
   */
  const worldFromScreen = (nx: number, ny: number) => {
    const half = 0.5 / (0.43 * zoom);
    const x = nx * half * (width / Math.max(height, 1));
    const y = ny * half;
    const radial = x * x + y * y;
    if (radial >= 0.97) return aimTarget.set(x, y, 0.12);
    return aimTarget.set(x, y, Math.sqrt(1 - radial));
  };

  const territoryAt = (lon: number, lat: number): Territory | null => {
    const boxed = territoryFromLonLat(lon, lat);
    if (boxed) {
      const match = activeTerritories.find((territory) => territory.name === boxed.name);
      return match ?? { name: boxed.name, center: boxed.center, unlocked: boxed.unlocked };
    }
    let best: Territory | null = null;
    let bestDistance = 18;
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

    const projectileKind = alienType === "original" ? "arrow" : "pepsi";
    const arrow = projectileKind === "arrow" ? makeArrow() : makePepsiProjectile();
    (projectileKind === "arrow" ? alien.nock : alien.muzzle).getWorldPosition(bowWorld);
    arrow.position.copy(bowWorld);

    // Loose a real lofted shot: solve for the launch velocity that puts the
    // arrow on the aim point after `flight` seconds under gravity. The arrow
    // climbs over the planet's shoulder and comes down onto the target rather
    // than skimming up into its belly, which is both how a bow actually works
    // and the only way to reach the far north of a sphere from below it.
    const toTarget = worldFromScreen(aim.x, aim.y).clone().sub(bowWorld);
    const distance = Math.max(toTarget.length(), 0.4);
    const speed = ARROW_MIN_SPEED + (ARROW_MAX_SPEED - ARROW_MIN_SPEED) * (projectileKind === "pepsi" ? 1 : charge);
    const flight = projectileKind === "pepsi" ? distance / (speed * 2.35) : (distance / speed) * (1.6 - 0.3 * charge);
    const velocity = toTarget.divideScalar(flight);
    velocity.y += 0.5 * Math.abs(GRAVITY) * flight;
    // Drag will shave a little off the way, so lean into the shot slightly.
    velocity.multiplyScalar(1 + AIR_DRAG * flight * 0.55);

    scene.add(arrow);
    arrows.push({ mesh: arrow, kind: projectileKind, velocity, age: 0, stuck: false, stuckAge: 0 });
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

      if (arrow.age > (arrow.kind === "pepsi" ? ARROW_LIFETIME * 3.2 : ARROW_LIFETIME) || arrow.mesh.position.length() > (arrow.kind === "pepsi" ? 58 : 12)) {
        scene.remove(arrow.mesh);
        arrows.splice(index, 1);
      }
    }
  };

  /** Spans a unit-height cylinder between two points in its parent's space. */
  const spanCord = (mesh: THREE_NS.Mesh, from: THREE_NS.Vector3, to: THREE_NS.Vector3) => {
    cordMid.copy(from).add(to).multiplyScalar(0.5);
    cordDir.copy(to).sub(from);
    const length = cordDir.length();
    if (length < 0.0001) return;
    mesh.position.copy(cordMid);
    mesh.scale.set(1, length, 1);
    mesh.quaternion.setFromUnitVectors(cordUp, cordDir.divideScalar(length));
  };

  /**
   * Two-bone IK. Points the upper arm so that, with the elbow bent by the
   * angle the triangle demands, the hand lands on `targetWorld`.
   */
  const solveArm = (
    arm: { shoulder: THREE_NS.Group; elbow: THREE_NS.Group },
    targetWorld: THREE_NS.Vector3,
    upper: number,
    fore: number,
  ) => {
    const parent = arm.shoulder.parent;
    if (!parent) return;
    parent.updateWorldMatrix(true, false);
    ikTarget.copy(targetWorld);
    parent.worldToLocal(ikTarget);
    ikDirection.copy(ikTarget).sub(arm.shoulder.position);
    const reach = clamp(ikDirection.length(), Math.abs(upper - fore) + 0.02, upper + fore - 0.015);
    if (reach < 0.0001) return;
    ikDirection.normalize();

    const shoulderAngle = Math.acos(clamp((upper * upper + reach * reach - fore * fore) / (2 * upper * reach), -1, 1));
    ikAim.setFromUnitVectors(limbDown, ikDirection);
    ikBend.setFromAxisAngle(limbHinge, shoulderAngle);
    arm.shoulder.quaternion.copy(ikAim).multiply(ikBend);

    const elbowAngle = Math.acos(clamp((upper * upper + fore * fore - reach * reach) / (2 * upper * fore), -1, 1));
    arm.elbow.rotation.set(-(Math.PI - elbowAngle), 0, 0);
  };

  const stepAlien = (delta: number, elapsed: number) => {
    const inputX = clamp(move.x + (keys.right ? 1 : 0) - (keys.left ? 1 : 0), -1, 1);
    const inputZ = clamp(move.y + (keys.up ? 1 : 0) - (keys.down ? 1 : 0), -1, 1);
    const acceleration = walker.y > .001 ? 2.4 : 5.8;
    walker.vx += (inputX * WALK_SPEED - walker.vx) * Math.min(1, delta * acceleration);
    walker.vz += (inputZ * WALK_SPEED - walker.vz) * Math.min(1, delta * acceleration);
    if (Math.abs(inputX) < .05) walker.vx *= Math.max(0, 1 - delta * 8.5);
    if (Math.abs(inputZ) < .05) walker.vz *= Math.max(0, 1 - delta * 8.5);
    const walkLimitX = WALK_LIMIT_X * platformScale;
    const walkLimitZ = platformScale;
    walker.x = clamp(walker.x + walker.vx * delta, -walkLimitX, walkLimitX);
    walker.z = clamp(walker.z + walker.vz * delta, 0, walkLimitZ);
    if (Math.abs(walker.x) >= walkLimitX) walker.vx *= -.22;
    if (walker.z <= 0 || walker.z >= walkLimitZ) walker.vz *= -.22;
    walker.vy -= 2.8 * delta;
    walker.y += walker.vy * delta;
    if (walker.y < 0) {
      walker.y = 0;
      walker.vy = Math.abs(walker.vy) > .55 ? -walker.vy * .18 : 0;
    }
    walker.ragdoll = Math.max(0, walker.ragdoll - delta);
    walker.spin += walker.ragdoll > 0 ? delta * 8 : 0;
    const moving = Math.hypot(walker.vx, walker.vz) > .035;

    alien.group.position.set(
      walker.x + editOffsets.alien.x,
      walker.z * SLAB_RISE + walker.y + editOffsets.alien.y,
      -walker.z * SLAB_DEPTH + editOffsets.alien.z,
    );
    // Local X/Z remain zero when standing, which keeps every character
    // perpendicular to the platform even while the whole island rotates.
    alien.group.rotation.x = walker.ragdoll > 0 ? Math.sin(walker.spin * .8) * 1.1 : 0;
    alien.group.rotation.z = walker.ragdoll > 0 ? walker.spin : 0;

    // Aim: from the archer toward wherever the player is pointing on the globe.
    const target = worldFromScreen(aim.x, aim.y);
    alien.group.getWorldPosition(bowWorld);
    aimDirection.copy(target).sub(bowWorld);
    aimDirection.y += 0.12;
    if (aimDirection.lengthSq() < 0.0001) aimDirection.set(0, 0.3, -1);
    aimDirection.normalize();

    const shotSource = alienType === "original" ? alien.nock : alien.muzzle;
    shotSource.getWorldPosition(bowWorld);
    const guideTarget = worldFromScreen(aim.x, aim.y).clone();
    const guidePoints = Array.from({length:25},(_,index)=>{
      const t=index/24;
      const point=bowWorld.clone().lerp(guideTarget,t);
      point.y += Math.sin(t*Math.PI) * (alienType === "original" ? .62 : .08);
      return point;
    });
    guideGeometry.setFromPoints(guidePoints);
    landingX.position.copy(guideTarget).multiplyScalar(1.012);
    landingX.lookAt(camera.position);
    aimGuide.visible = aimMode && archerActive;

    // The whole body turns to face the shot, so the arms only ever have to
    // pose along the body's own forward axis. That keeps the draw readable
    // from any angle instead of fighting the aim direction.
    const facing = Math.atan2(aimDirection.x, aimDirection.z);
    const toCamera = Math.atan2(camera.position.x - islandRoot.position.x, camera.position.z - islandRoot.position.z);
    // Weighted toward the camera rather than the aim line — the scout reads
    // as facing forward, toward the viewer, most of the time, and only turns
    // sharply side-on when the shot itself is far off to one side.
    const mixed = facing * 0.35 + toCamera * 0.65;
    walker.facing += ((mixed - walker.facing + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, delta * 9);
    alien.group.rotation.y = walker.facing + (walker.ragdoll > 0 ? walker.spin * .35 : 0);

    const pitch = Math.asin(clamp(aimDirection.y, -1, 1));

    // The archer stands below the planet, so the shot is steeply uphill. Rather
    // than winching the arm over its head, the whole body leans back into the
    // shot — which is what an archer actually does — and the arms keep the
    // classic level silhouette relative to the body.
    alien.body.rotation.x = -pitch * 0.62;

    // Side-on stance: the torso is turned across the line of the shot.
    alien.torso.rotation.x = -pitch * 0.12;
    alien.torso.rotation.y = -0.06 + charge * 0.05;
    alien.torso.rotation.z = 0.04 - charge * 0.04;
    alien.head.rotation.x = -pitch * 0.1 + 0.08;
    alien.head.rotation.y = 0.16 - charge * 0.04;

    // Bow arm: aimed straight down the line of the shot. Pointing the limb
    // rather than dialling in Euler angles keeps the bow square to the shot no
    // matter how the body is turned or leaning.
    alien.torso.updateWorldMatrix(true, false);
    alien.torso.getWorldQuaternion(ikAim);
    ikAim.invert();
    ikDirection.copy(aimDirection).applyQuaternion(ikAim).normalize();
    // Ease the bow down toward chest height; the arrow still leaves along the
    // true line of the shot, the archer just doesn't hold it over their face.
    ikDirection.y -= 0.26;
    ikDirection.normalize();
    if (alienType === "original") {
      alien.bowArm.shoulder.quaternion.setFromUnitVectors(limbDown, ikDirection);
      alien.bowArm.elbow.rotation.set(0.1 - charge * 0.08, 0, 0);
    } else {
      alien.gunArm.shoulder.quaternion.setFromUnitVectors(limbDown, ikDirection);
      alien.gunArm.elbow.rotation.set(.04,0,0);
    }
    // The bow hangs off the hand with its arrow axis running down the arm and
    // its limbs standing upright across it.
    alien.bow.rotation.set(-Math.PI / 2, 0, 0);

    // The string bends to the nock, and the arrow rides on it.
    const pull = 0.04 + charge * 0.38;
    bowTipUpper.set(0, BOW_REACH, 0.055);
    bowTipLower.set(0, -BOW_REACH, 0.055);
    nockPoint.set(0, 0, 0.055 + pull);
    spanCord(alien.stringUpper, bowTipUpper, nockPoint);
    spanCord(alien.stringLower, bowTipLower, nockPoint);
    alien.nock.position.copy(nockPoint);
    alien.nockedArrow.visible = alienType === "original" && charge > 0.02;
    alien.nockedArrow.position.set(0, 0, nockPoint.z - 0.3);
    alien.nockedArrow.rotation.set(0, Math.PI, 0);

    if (moving) {
      // Walk cycle: hips swing, knees bend on the back stroke.
      walker.stride += delta * 8.5;
      const swing = Math.sin(walker.stride) * 0.5;
      alien.frontLeg.hip.rotation.x = swing;
      alien.backLeg.hip.rotation.x = -swing;
      alien.frontLeg.knee.rotation.x = Math.max(0, -swing) * 0.9;
      alien.backLeg.knee.rotation.x = Math.max(0, swing) * 0.9;
      alien.body.position.y = Math.abs(Math.sin(walker.stride)) * 0.022;
      alien.body.rotation.z = Math.sin(walker.stride) * 0.03;
    } else {
      // Braced archer stance: front leg forward and straight, back leg bent.
      walker.stride = 0;
      const settleTo = (node: THREE_NS.Object3D, axis: "x" | "z", value: number) => {
        node.rotation[axis] += (value - node.rotation[axis]) * Math.min(1, delta * 7);
      };
      settleTo(alien.frontLeg.hip, "x", -0.24 - charge * 0.05);
      settleTo(alien.backLeg.hip, "x", 0.3 + charge * 0.06);
      settleTo(alien.frontLeg.knee, "x", 0.16);
      settleTo(alien.backLeg.knee, "x", 0.34 + charge * 0.1);
      settleTo(alien.body, "z", 0);
      alien.body.position.y = Math.sin(elapsed * 1.7) * 0.011 - charge * 0.015;
    }
  };

  // ---------------------------------------------------------------- input --

  let archerActive = false;

  const onKeyDown = (event: KeyboardEvent) => {
    if (!archerActive) return;
    const code = event.code;
    if (code === "KeyW" || code === "ArrowUp") keys.up = true;
    else if (code === "KeyS" || code === "ArrowDown") keys.down = true;
    else if (code === "KeyA" || code === "ArrowLeft") keys.left = true;
    else if (code === "KeyD" || code === "ArrowRight") keys.right = true;
    else if (code === "KeyQ") keys.orbitLeft = true;
    else if (code === "KeyE") keys.orbitRight = true;
    else if (code === "KeyR") keys.tiltUp = true;
    else if (code === "KeyF") keys.tiltDown = true;
    else if (code === "KeyZ") keys.zipIn = true;
    else if (code === "KeyX") keys.zipOut = true;
    else if (code === "KeyC") {
      if (walker.y <= .001) walker.vy = 1.18;
    }
    else if (code === "KeyG") {
      walker.ragdoll = 1.15;
      walker.vy = Math.max(walker.vy, .75);
      walker.spin = 0;
    }
    else if (code === "Space") {
      if (!drawing) beginDraw();
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (!archerActive) return;
    const code = event.code;
    if (code === "KeyW" || code === "ArrowUp") keys.up = false;
    else if (code === "KeyS" || code === "ArrowDown") keys.down = false;
    else if (code === "KeyA" || code === "ArrowLeft") keys.left = false;
    else if (code === "KeyD" || code === "ArrowRight") keys.right = false;
    else if (code === "KeyQ") keys.orbitLeft = false;
    else if (code === "KeyE") keys.orbitRight = false;
    else if (code === "KeyR") keys.tiltUp = false;
    else if (code === "KeyF") keys.tiltDown = false;
    else if (code === "KeyZ") keys.zipIn = false;
    else if (code === "KeyX") keys.zipOut = false;
    else if (code === "Space") {
      if (drawing) loose();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  if (import.meta.env.DEV || new URLSearchParams(window.location.search).has("qa")) {
    window.__controlsTest = {
      getYaw: () => walker.facing,
      getX: () => walker.x,
      getZ: () => walker.z,
      getIsland: () => ({
        x: islandRoot.position.x,
        y: islandRoot.position.y,
        z: islandRoot.position.z,
        az: flyAzimuth,
        el: flyElevation,
      }),
      getFlight: () => ({ depth: flyDepth, heading: flyHeading }),
      getSpeed: () => Math.hypot(
        (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
        (keys.up ? 1 : 0) - (keys.down ? 1 : 0),
      ) * WALK_SPEED,
      setKeys: (codes: string[]) => {
        keys.up = codes.includes("KeyW") || codes.includes("ArrowUp");
        keys.down = codes.includes("KeyS") || codes.includes("ArrowDown");
        keys.left = codes.includes("KeyA") || codes.includes("ArrowLeft");
        keys.right = codes.includes("KeyD") || codes.includes("ArrowRight");
        keys.orbitLeft = codes.includes("KeyQ");
        keys.orbitRight = codes.includes("KeyE");
        keys.tiltUp = codes.includes("KeyR");
        keys.tiltDown = codes.includes("KeyF");
        keys.zipIn = codes.includes("KeyZ");
        keys.zipOut = codes.includes("KeyX");
      },
    };
  }

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

    // The box tumble can change every frame during a cube-rotate drag, so
    // it's recomputed here rather than only when the view state changes.
    updateBoxQuaternion();
    syncPlanetQuaternion();
    planet.position.set(
      editOffsets.globe.x + editOffsets.land.x,
      editOffsets.globe.y + editOffsets.land.y,
      editOffsets.globe.z + editOffsets.land.z,
    ).applyQuaternion(boxQuaternion);
    universeEdges.quaternion.copy(boxQuaternion);
    universeFloor.position.set(0, -UNIVERSE_SIZE / 2, 0).applyQuaternion(boxQuaternion);
    universeFloor.quaternion.copy(boxQuaternion);

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

    const orbitInput = (keys.orbitRight ? 1 : 0) - (keys.orbitLeft ? 1 : 0);
    const tiltInput = (keys.tiltUp ? 1 : 0) - (keys.tiltDown ? 1 : 0);
    const zipInput = (keys.zipOut ? 1 : 0) - (keys.zipIn ? 1 : 0);
    // Zippier than the old slow orbit: faster azimuth/elevation response, plus
    // a push/pull depth axis so the platform can close in or peel away in
    // full 3D space instead of only sliding around the planet's face.
    const platformFrozen = selectedTarget === "platform" && editOffsets.platform.locked;
    if (!platformFrozen) {
      flyAzimuth += orbitInput * 1.75 * delta;
      flyElevation = clamp(flyElevation + tiltInput * 1.25 * delta, -0.85, 0.85);
      flyDepth = clamp(flyDepth + zipInput * 1.55 * delta, FLY_DEPTH_MIN, FLY_DEPTH_MAX);
    }
    placeIsland(elapsed);
    platform.group.scale.set(platformScale, 1, platformScale);
    // The island's own position is set inside placeIsland relative to its
    // un-boxed frame; add the edit offset there, then rotate the whole thing
    // (position and facing alike) into the tumbled box.
    islandRoot.position.add(editOffsets.platform);
    islandRoot.position.applyQuaternion(boxQuaternion);
    islandRoot.quaternion.premultiply(boxQuaternion);
    const platformSelected = selectedTarget === "platform";
    platform.edgeMaterial.opacity = platformSelected ? .95 : .16;
    platform.underglow.opacity = platformSelected ? .7 + Math.sin(elapsed * 5) * .18 : .08;

    const orbit = elapsed * 0.32;
    satellite.group.position.set(
      Math.cos(orbit) * 1.52 + editOffsets.satellite.x,
      Math.sin(orbit * 0.6) * 0.42 + 0.18 + editOffsets.satellite.y,
      Math.sin(orbit) * 1.52 + editOffsets.satellite.z,
    );
    satellite.group.rotation.y = -orbit + Math.PI / 2;
    satellite.group.rotation.z = Math.sin(elapsed * 0.7) * 0.12;
    satellite.beacon.emissiveIntensity = 1.1 + Math.abs(Math.sin(elapsed * 3.1)) * 2.4;

    // Ambient sky dressing: a distant moon, a couple of patrolling UFOs, and
    // the occasional meteor streaking past. None of it interacts with the
    // archer, the arrows, or the territories below. All three (and the
    // satellite above) are children of worldSpin, which already carries the
    // combined drag + box rotation, so only their positions need the edit
    // offset added here — the rotation comes along for free via the parent.
    const moonOrbit = elapsed * 0.045;
    moon.group.position.set(
      Math.cos(moonOrbit) * 2.7 + editOffsets.moon.x,
      Math.sin(moonOrbit * 0.35) * 0.55 + 0.35 + editOffsets.moon.y,
      Math.sin(moonOrbit) * 2.7 + editOffsets.moon.z,
    );
    moon.group.rotation.y += delta * 0.04;

    ufos.forEach((ufo, index) => {
      const t = elapsed * 0.55 + index * 2.4;
      ufo.group.position.set(
        Math.sin(t) * 1.95 + editOffsets.ufo.x,
        1.05 + Math.sin(t * 1.6 + index) * 0.3 + editOffsets.ufo.y,
        Math.cos(t) * 1.95 + editOffsets.ufo.z,
      );
      ufo.group.rotation.y = -t + Math.PI / 2;
      (ufo.beam.material as THREE_NS.MeshBasicMaterial).opacity = 0.35 + Math.abs(Math.sin(t * 2)) * 0.25;
    });

    meteorTimer -= wall;
    if (meteorTimer <= 0 && meteors.length < 2) {
      meteorTimer = 3 + Math.random() * 4;
      const side = Math.random() < 0.5 ? -1 : 1;
      const meteorMesh = buildMeteorTrail(THREE);
      meteorMesh.position.set(side * 3.2, 1.6 + Math.random() * 0.8, -1.6 + Math.random() * 1.2);
      worldSpin.add(meteorMesh);
      meteors.push({ group: meteorMesh, velocity: new THREE.Vector3(-side * 1.4, -0.55, 0.15), age: 0 });
    }
    for (let index = meteors.length - 1; index >= 0; index -= 1) {
      const meteor = meteors[index];
      meteor.age += delta;
      meteor.group.position.addScaledVector(meteor.velocity, delta);
      meteor.group.lookAt(meteor.group.position.clone().add(meteor.velocity));
      if (meteor.age > 2.6) {
        worldSpin.remove(meteor.group);
        meteors.splice(index, 1);
      }
    }

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
    setActive: (active) => {
      archerActive = active;
      if (!active) { Object.keys(keys).forEach((key) => { keys[key as keyof typeof keys] = false; }); drawing = false; charge = 0; }
    },
    setAlienType: (type) => {
      alienType = type;
      const archer = type === "original";
      alien.bowArm.shoulder.visible = archer;
      alien.bow.visible = archer;
      alien.quiver.visible = archer;
      alien.gunArm.shoulder.visible = !archer;
      alien.revolver.visible = type === "doop";
      alien.ak47.visible = type === "zorp";
      drawing = false;
      charge = 0;
    },
    setAimMode: (active) => {
      aimMode = active;
      if (!active) aimGuide.visible = false;
    },
    setView: (nextRotation, nextZoom) => {
      rotation.lon = nextRotation.lon;
      rotation.lat = nextRotation.lat;
      rotation.roll = nextRotation.roll;
      zoom = nextZoom;
      applyView();
    },
    setSize: (nextWidth, nextHeight) => {
      width = nextWidth;
      height = nextHeight;
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
      if (!archerActive) return;
      move.x = clamp(x, -1, 1);
      move.y = clamp(y, -1, 1);
    },
    setDrawing: (next) => {
      if (!archerActive) return;
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
    setLandColor: (hex) => {
      const material = landMesh.material as THREE_NS.MeshStandardMaterial;
      material.color.setHex(hex);
      const isGold = hex === 0xf1c86e;
      material.metalness = isGold ? 0.96 : 0.04;
      material.roughness = isGold ? 0.1 : 0.88;
      material.emissive.setHex(isGold ? 0x5b2f00 : 0x000000);
      material.emissiveIntensity = isGold ? 0.28 : 0;
    },
    setLandFlagMode: (enabled) => {
      flagModeActive = enabled;
      const colorAttr = landGeometry.getAttribute("color") as THREE_NS.BufferAttribute;
      (colorAttr.array as Float32Array).set(enabled ? flagColors : landBaseColors);
      colorAttr.needsUpdate = true;
    },
    setSatelliteLoadout: (parts) => {
      while (satelliteUpgrades.children.length > 0) {
        satelliteUpgrades.remove(satelliteUpgrades.children[0]);
      }
      const warm = parts.includes("beacon-warm");
      parts
        .filter((id): id is Exclude<SatellitePartId, "beacon-warm"> => id !== "beacon-warm")
        .forEach((id) => satelliteUpgrades.add(buildSatelliteUpgrade(THREE, id)));
      satellite.beacon.color.setHex(warm ? 0xffb23c : 0xff4f6d);
      satellite.beacon.emissive.setHex(warm ? 0xff8a1f : 0xff2a4d);
    },
    setBoxRotation: (nextRotation) => {
      boxLon = nextRotation.lon;
      boxLat = nextRotation.lat;
    },
    setEditOffset: (target, axis, value) => {
      const offset = editOffsets[target];
      if (offset.locked) return;
      offset[axis] = value;
    },
    setEditLock: (target, locked) => {
      editOffsets[target].locked = locked;
    },
    getEditOffsets: () => JSON.parse(JSON.stringify(editOffsets)) as Record<EditTargetId, EditOffset>,
    setSelectedTarget: (target) => {
      selectedTarget = target;
    },
    setPlatformScale: (scale) => {
      platformScale = clamp(scale, 0.55, 2.25);
    },
    setPlatformYaw: (degrees) => {
      platformYaw = THREE.MathUtils.degToRad(degrees);
    },
    hopAlien: () => {
      if (walker.y <= .001) walker.vy = 1.18;
    },
    ragdollAlien: () => {
      walker.ragdoll = 1.15;
      walker.vy = Math.max(walker.vy, .75);
      walker.spin = 0;
    },
    setTerrainBrush: (mode) => {
      terrainBrush = mode;
    },
    paintTerrain: () => {
      if (!terrainBrush) return;
      const point = worldFromScreen(aim.x, aim.y);
      const local = scratch.copy(point).applyQuaternion(planet.quaternion.clone().invert()).normalize();
      const lat = (Math.asin(clamp(local.y, -1, 1)) * 180) / Math.PI;
      const lon = (Math.atan2(local.x, local.z) * 180) / Math.PI;
      // A wide enough brush (10 cells, ~7.5° across) and strong enough step
      // that a single click reads as a real, deliberate landform change —
      // one grid cell alone is imperceptibly small against a 480x240 globe.
      sculptTerrain(lon, lat, terrainBrush === "raise" ? 0.03 : -0.03, 10);
    },
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (window.__controlsTest) delete window.__controlsTest;
      renderer.dispose();
      landGeometry.dispose();
    },
  };
}
