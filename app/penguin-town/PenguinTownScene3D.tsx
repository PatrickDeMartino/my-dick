"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  buildings,
  buildingWorldPosition,
  gridPositionFromWorld,
  percentToWorldXZ,
  placementIssue,
  pointInPolygon,
  terrainAt,
  terrainMoveInstruction,
  tierAt,
  tierBaseHeight,
  GRID_COLUMN_MIN,
  GRID_COLUMN_MAX,
  GRID_ROW_MIN,
  GRID_ROW_MAX,
  ISLAND_HEIGHT,
  PLATEAU_HEIGHT,
  TERRAIN_REGIONS,
  type GridPosition,
  type PlacementPreview,
  type Rotation,
  type TownLayout,
} from "./townData";

type Props = {
  townLayout: TownLayout;
  telescopeUpgraded: boolean;
  activeBuildingId: string | null;
  placingBuildingId: string | null;
  placementRotation: Rotation;
  /** True while the circular building-interaction popup is open — on the
   * compact (mobile-proportioned) camera framing this pulls the camera back
   * and raises its target so the whole island stays visible above the popup
   * instead of being partly covered by it. No-op on the wide desktop framing. */
  popupOpen: boolean;
  onSelectBuilding: (id: string) => void;
  onPlacementPreview: (preview: PlacementPreview | null) => void;
  onCommitPlacement: (id: string, position: GridPosition, rotation: Rotation) => void;
  onPlacementMessage: (message: string | null) => void;
};

const GHOST_VALID = new THREE.Color(0x59e6a0);
const GHOST_INVALID = new THREE.Color(0xe8556a);

function shapeFromPercentPolygon(points: readonly (readonly [number, number])[]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([px, py], index) => {
    const { x, z } = percentToWorldXZ(px, py);
    // Flip Z going in; the -90° rotation applied to extruded meshes flips it
    // back, which keeps this in agreement with buildingWorldPosition's XZ.
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return shape;
}

let sharedRockBump: THREE.CanvasTexture | null = null;
let sharedSnowBump: THREE.CanvasTexture | null = null;

/** A tall, jagged low-poly peak built from a cone with multi-octave jittered radial
 * verts (a coarse pass for silhouette + a fine pass for crags), plus a paler snow cap
 * and a couple of small shoulder ridges so it reads as a real massif, not a smooth cone. */
function buildMountainPeak(radius: number, height: number, seed: number): THREE.Group {
  const group = new THREE.Group();
  const segments = 9 + Math.floor(seededRandom(seed) * 5);
  const bodyGeometry = new THREE.ConeGeometry(radius, height, segments, 6);
  const positions = bodyGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const coarseJitter = 1 + (seededRandom(seed + i * 3.1) - 0.5) * 0.55;
    const fineJitter = 1 + (seededRandom(seed + i * 11.3 + 4.4) - 0.5) * 0.16;
    const heightFactor = Math.max(0, (y + height / 2) / height);
    const crag = heightFactor * (seededRandom(seed + i * 5.7) - 0.5) * height * 0.22
      + heightFactor * (seededRandom(seed + i * 19.1 + 8) - 0.5) * height * 0.07;
    positions.setXYZ(i, x * coarseJitter * fineJitter, y + crag, z * coarseJitter * fineJitter);
  }
  bodyGeometry.computeVertexNormals();
  if (!sharedRockBump) sharedRockBump = buildNoiseBumpTexture(3033);
  if (!sharedSnowBump) sharedSnowBump = buildNoiseBumpTexture(7711);
  const rock = new THREE.MeshStandardMaterial({ color: 0x779db0, roughness: 0.95, flatShading: true, bumpMap: sharedRockBump, bumpScale: 0.35 });
  const body = new THREE.Mesh(bodyGeometry, rock);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const capGeometry = new THREE.ConeGeometry(radius * 0.42, height * 0.4, segments, 2);
  const capPositions = capGeometry.attributes.position;
  for (let i = 0; i < capPositions.count; i += 1) {
    const x = capPositions.getX(i), y = capPositions.getY(i), z = capPositions.getZ(i);
    const jitter = 1 + (seededRandom(seed + 200 + i * 4.4) - 0.5) * 0.3;
    capPositions.setXYZ(i, x * jitter, y, z * jitter);
  }
  capGeometry.computeVertexNormals();
  const snow = new THREE.MeshStandardMaterial({ color: 0xf6fbff, roughness: 0.75, flatShading: true, bumpMap: sharedSnowBump, bumpScale: 0.18 });
  const cap = new THREE.Mesh(capGeometry, snow);
  cap.position.y = height * 0.82;
  cap.castShadow = true;
  group.add(cap);

  // One or two small shoulder ridges bracing the main peak, so the massif reads as
  // a range fold rather than a single isolated cone (matches the jagged multi-peak
  // skyline in the reference art).
  const shoulders = 1 + Math.floor(seededRandom(seed + 55) * 2);
  for (let s = 0; s < shoulders; s += 1) {
    const angle = seededRandom(seed + s * 17 + 3) * Math.PI * 2;
    const shoulderHeight = height * (0.42 + seededRandom(seed + s * 9) * 0.22);
    const shoulderRadius = radius * (0.45 + seededRandom(seed + s * 6) * 0.2);
    const shoulderGeo = new THREE.ConeGeometry(shoulderRadius, shoulderHeight, 6 + Math.floor(seededRandom(seed + s) * 3), 3);
    const shoulderPos = shoulderGeo.attributes.position;
    for (let i = 0; i < shoulderPos.count; i += 1) {
      const jitter = 1 + (seededRandom(seed + s * 40 + i * 2.9) - 0.5) * 0.5;
      shoulderPos.setXYZ(i, shoulderPos.getX(i) * jitter, shoulderPos.getY(i), shoulderPos.getZ(i) * jitter);
    }
    shoulderGeo.computeVertexNormals();
    const shoulder = new THREE.Mesh(shoulderGeo, rock);
    shoulder.position.set(Math.cos(angle) * radius * 0.7, shoulderHeight / 2, Math.sin(angle) * radius * 0.7);
    shoulder.castShadow = true;
    shoulder.receiveShadow = true;
    group.add(shoulder);
  }
  return group;
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** A ring of 3D mountain peaks at the edge of the playable island, ringing the horizon,
 * with a second denser ring of smaller foothills layered in front for a fuller,
 * less gap-toothed range (closer to the packed Antarctic mainland skyline in the
 * reference photo instead of a thin scatter of isolated cones). */
function buildMountainRange(): THREE.Group {
  const group = new THREE.Group();
  const count = 18;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + seededRandom(i) * 0.3;
    const distance = 39 + seededRandom(i * 2.2) * 15;
    const height = 8 + seededRandom(i * 3.7) * 11;
    const radius = 4.5 + seededRandom(i * 4.4) * 4.5;
    const peak = buildMountainPeak(radius, height, i * 7.3);
    peak.position.set(Math.cos(angle) * distance, -1, Math.sin(angle) * distance);
    group.add(peak);
  }
  const foothillCount = 24;
  for (let i = 0; i < foothillCount; i += 1) {
    const angle = (i / foothillCount) * Math.PI * 2 + seededRandom(i + 300) * 0.4;
    const distance = 32 + seededRandom(i * 1.8 + 300) * 8;
    const height = 3.5 + seededRandom(i * 2.9 + 300) * 4;
    const radius = 2.4 + seededRandom(i * 3.1 + 300) * 2.4;
    const foothill = buildMountainPeak(radius, height, i * 5.1 + 900);
    foothill.position.set(Math.cos(angle) * distance, -1, Math.sin(angle) * distance);
    group.add(foothill);
  }
  return group;
}

/** A canvas-painted mountain silhouette, wrapped around a huge backdrop cylinder so the range
 * appears to recede for miles beyond the 3D peaks (matte-painting trick, cheap to render). */
function buildPaintedBackdropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#8fd2ec");
  sky.addColorStop(0.55, "#bfe6f2");
  sky.addColorStop(1, "#eaf6fa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawRidge = (baseY: number, amplitude: number, color: string, seedOffset: number) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    const points = 40;
    for (let i = 0; i <= points; i += 1) {
      const x = (i / points) * canvas.width;
      const y = baseY - Math.abs(Math.sin(i * 0.7 + seedOffset) * amplitude + Math.sin(i * 1.9 + seedOffset * 2) * amplitude * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  drawRidge(canvas.height * 0.62, 70, "#cfe9f2", 1.3);
  drawRidge(canvas.height * 0.7, 90, "#a9d3e0", 4.1);
  drawRidge(canvas.height * 0.8, 110, "#82b6c9", 7.9);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildPaintedBackdrop(): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(140, 140, 90, 48, 1, true);
  const material = new THREE.MeshBasicMaterial({
    map: buildPaintedBackdropTexture(),
    side: THREE.BackSide,
    fog: false,
  });
  const backdrop = new THREE.Mesh(geometry, material);
  backdrop.position.y = 30;
  return backdrop;
}

/** A white rounded-rect on transparent, sampled by every grid tile so tile edges read as soft/rounded. */
function buildRoundedTileTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const pad = 10;
  const radius = 30;
  ctx.beginPath();
  ctx.moveTo(pad + radius, pad);
  ctx.arcTo(size - pad, pad, size - pad, size - pad, radius);
  ctx.arcTo(size - pad, size - pad, pad, size - pad, radius);
  ctx.arcTo(pad, size - pad, pad, pad, radius);
  ctx.arcTo(pad, pad, size - pad, pad, radius);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** One flat translucent tile mesh per terrain tier, tiling the exact iso-lattice parallelogram for each cell. */
function buildGridOverlay(): THREE.Group {
  const group = new THREE.Group();
  const tileTexture = buildRoundedTileTexture();
  const inset = 0.82; // shrink each tile slightly so neighboring tiles show a visible seam
  const tierStyle = {
    land: { color: 0x1fd9c4, opacity: 0.38 },
    cliff: { color: 0xff9a3c, opacity: 0.36 },
    ocean: { color: 0x2fb8ff, opacity: 0.32 },
  } as const;
  const buckets: Record<keyof typeof tierStyle, { positions: number[]; uvs: number[] }> = {
    land: { positions: [], uvs: [] },
    cliff: { positions: [], uvs: [] },
    ocean: { positions: [], uvs: [] },
  };

  for (let column = GRID_COLUMN_MIN; column < GRID_COLUMN_MAX; column += 1) {
    for (let row = GRID_ROW_MIN; row < GRID_ROW_MAX; row += 1) {
      const terrain = terrainAt(column, row);
      if (terrain === "blocked") continue;
      const key: keyof typeof tierStyle = terrain === "ocean" ? "ocean" : terrain === "cliff" ? "cliff" : "land";
      const y = tierBaseHeight(tierAt(column, row)) + 0.12;
      const cx = column + 0.5;
      const cy = row + 0.5;
      const corners = [
        [cx - inset / 2, cy - inset / 2],
        [cx + inset / 2, cy - inset / 2],
        [cx + inset / 2, cy + inset / 2],
        [cx - inset / 2, cy + inset / 2],
      ].map(([c, r]) => {
        // No "+1" here: c/r are already the tile's actual (column,row)-space
        // coordinates (cx/cy already centered), matching buildingWorldPosition's
        // centerColumn/centerRow convention. terrainAt/tierAt add that "+1"
        // themselves because they take an integer cell index and center it.
        const screenX = 50 + (c - r) * 2.65;
        const screenY = 28.5 + (c + r) * 0.9;
        const { x, z } = percentToWorldXZ(screenX, screenY);
        return [x, y, z];
      });
      const bucket = buckets[key];
      const push = (index: number, u: number, v: number) => {
        bucket.positions.push(corners[index][0], corners[index][1], corners[index][2]);
        bucket.uvs.push(u, v);
      };
      push(0, 0, 0); push(1, 1, 0); push(2, 1, 1);
      push(0, 0, 0); push(2, 1, 1); push(3, 0, 1);
    }
  }

  for (const key of Object.keys(buckets) as (keyof typeof tierStyle)[]) {
    const bucket = buckets[key];
    if (!bucket.positions.length) continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(bucket.positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(bucket.uvs, 2));
    const style = tierStyle[key];
    const material = new THREE.MeshBasicMaterial({
      map: tileTexture,
      color: style.color,
      transparent: true,
      opacity: style.opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(geometry, material));
  }
  return group;
}

/** Tileable-ish grayscale value noise, used as a bump map so flat terrain/ocean
 * slabs pick up a subtle worn-ice, goopy surface instead of reading as plastic. */
function buildNoiseBumpTexture(seed: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const big = seededRandom(seed + x * 0.05 + y * 0.05 * 1.7);
      const small = seededRandom(seed + 91 + x * 0.4 + y * 0.4 * 2.3);
      const value = Math.round((big * 0.65 + small * 0.35) * 255);
      const index = (y * size + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

/** Layered rolling-swell noise (a few octaves of sine interference), tiled and
 * scrolled over time for the ocean's slow, rolling bump-map "texture". */
function buildOceanWaveTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const swell = Math.sin(x * 0.025) + Math.sin(y * 0.021) + Math.sin((x + y) * 0.014);
      const ripple = Math.sin(x * 0.13 + y * 0.09) * 0.6 + Math.sin(x * 0.21 - y * 0.17) * 0.4;
      const value = ((swell / 3 + 1) / 2) * 0.65 + ((ripple + 1) / 2) * 0.35;
      const index = (y * size + x) * 4;
      const byte = Math.round(Math.max(0, Math.min(1, value)) * 255);
      image.data[index] = byte; image.data[index + 1] = byte; image.data[index + 2] = byte; image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  return texture;
}

/** Small bright glints on black, tiled and scrolled fast + independently of the
 * wave bump layer above — reads as sunlight catching moving wave faces. */
function buildOceanSparkleTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 130; i += 1) {
    const x = seededRandom(i * 2.1) * size;
    const y = seededRandom(i * 2.1 + 500) * size;
    const r = 0.7 + seededRandom(i * 2.1 + 900) * 1.7;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    glow.addColorStop(0, "rgba(255,255,255,.95)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  return texture;
}

function buildTerrainSlab(
  points: readonly (readonly [number, number])[],
  depth: number,
  baseY: number,
  capColor: number,
  sideColor: number,
): THREE.Mesh {
  const shape = shapeFromPercentPolygon(points);
  // A light bevel rounds the once-boxy 90° cliff edge into something that
  // reads as weathered rock/ice rather than a straight-walled extrusion.
  // Keep the bevel small: it's meant to soften the once-boxy 90° cliff edge,
  // not raise the walkable top surface above where buildings/grid tiles
  // expect it (tierBaseHeight assumes the flat `depth` value exactly).
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.07,
    bevelSegments: 2,
    curveSegments: 4,
  });
  geometry.rotateX(-Math.PI / 2);
  const bump = buildNoiseBumpTexture(capColor + depth * 1000);
  const sideMaterial = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.95, metalness: 0.02, bumpMap: bump, bumpScale: 0.12 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.78, metalness: 0.02, bumpMap: bump, bumpScale: 0.08 });
  const mesh = new THREE.Mesh(geometry, [sideMaterial, capMaterial]);
  mesh.position.y = baseY;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

const mat = (color: number, roughness = 0.78, metalness = 0.02) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });

function box(group: THREE.Group, size: [number, number, number], position: [number, number, number], color: number, rotation: [number, number, number] = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function cylinder(group: THREE.Group, radiusTop: number, radiusBottom: number, height: number, position: [number, number, number], color: number, rotation: [number, number, number] = [0, 0, 0], segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function sphere(group: THREE.Group, radius: number, position: [number, number, number], color: number, scale: [number, number, number] = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), mat(color));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function beamBetween(group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, radius: number, color: number) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);
  const mesh = cylinder(group, radius, radius, length, [midpoint.x, midpoint.y, midpoint.z], color, [0, 0, 0], 8);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  return mesh;
}

function makeLabel(text: string, accent: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(4, 12, 23, .91)";
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 104, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "900 34px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 56);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false }));
  sprite.scale.set(3.35, 0.74, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function makeStripeTexture(colors: string[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect((index / colors.length) * canvas.width, 0, canvas.width / colors.length + 1, canvas.height);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Curved, offset brick coursing (like real igloo snow-block rows), painted once and
 * wrapped around the dome/tunnel so the igloo reads as built from blocks, not plastic. */
function buildIceBrickTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#eef8ff";
  ctx.fillRect(0, 0, size, size);
  const rows = 8;
  for (let r = 0; r < rows; r += 1) {
    const rowH = size / rows;
    const y = r * rowH;
    const cols = 7 + r;
    const offset = (r % 2) * (size / cols / 2);
    for (let c = 0; c < cols; c += 1) {
      const x = (c / cols) * size + offset;
      const shade = 0.92 + seededRandom(r * 13.7 + c * 3.1) * 0.1;
      ctx.fillStyle = `rgba(${Math.round(214 * shade)},${Math.round(236 * shade)},${Math.round(250 * shade)},1)`;
      ctx.fillRect(x, y, size / cols + 1, rowH + 1);
    }
    ctx.strokeStyle = "rgba(120,172,201,.55)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    for (let c = 0; c <= cols; c += 1) {
      const x = ((c / cols) * size + offset) % size;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Weathered wood-plank siding, painted once and reused for the sweatshop's walls/sign. */
function buildPlankTexture(colorA: string, colorB: string): THREE.CanvasTexture {
  const w = 256, h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const planks = 9;
  for (let i = 0; i < planks; i += 1) {
    ctx.fillStyle = i % 2 ? colorA : colorB;
    ctx.fillRect(0, (i / planks) * h, w, h / planks + 1);
  }
  ctx.strokeStyle = "rgba(0,0,0,.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= planks; i += 1) {
    ctx.beginPath(); ctx.moveTo(0, (i / planks) * h); ctx.lineTo(w, (i / planks) * h); ctx.stroke();
  }
  for (let n = 0; n < 60; n += 1) {
    ctx.fillStyle = "rgba(0,0,0,.07)";
    ctx.fillRect(seededRandom(n) * w, seededRandom(n + 50) * h, 8 + seededRandom(n + 90) * 26, 1.4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A small triangular pennant-flag garland strung between two points — used to trim
 * tent roofs and hilltop landmarks the way the painted reference art does. */
function buildBunting(group: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, count: number, colors: number[]) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const point = from.clone().lerp(to, t);
    point.y -= Math.sin(t * Math.PI) * 0.05;
    const flagGeo = new THREE.ConeGeometry(0.055, 0.14, 3);
    const flag = new THREE.Mesh(flagGeo, mat(colors[i % colors.length]));
    flag.rotation.z = Math.PI;
    flag.rotation.y = Math.PI / 2;
    flag.position.copy(point);
    flag.castShadow = true;
    group.add(flag);
  }
  const string = beamBetween(group, from, to, 0.012, 0x3a3226);
  string.castShadow = false;
}

function buildPlane(): THREE.Group {
  const g = new THREE.Group();
  const teal = 0x159bb0;
  cylinder(g, .23, .32, 2.3, [0, .72, 0], teal, [Math.PI / 2, 0, 0], 18);
  sphere(g, .33, [0, .72, -1.12], 0xf4e7c4, [1, 1, .75]);
  sphere(g, .25, [0, .73, .98], teal, [1, 1, 1.4]);
  box(g, [2.75, .09, .58], [0, 1.24, -.03], 0xf7ead1);
  box(g, [2.45, .09, .5], [0, .43, -.08], teal);
  for (const x of [-.95, .95]) for (const z of [-.2, .22]) beamBetween(g, new THREE.Vector3(x, .47, z), new THREE.Vector3(x, 1.2, z), .025, 0xe8d5a3);
  box(g, [.9, .07, .35], [0, .83, 1.18], 0xf7ead1);
  box(g, [.06, .58, .4], [0, 1.04, 1.15], teal);
  box(g, [.07, 1.34, .08], [0, .72, -1.46], 0xb87b35, [0, 0, Math.PI / 4]);
  box(g, [.07, 1.34, .08], [0, .72, -1.46], 0xb87b35, [0, 0, -Math.PI / 4]);
  for (const x of [-.54, .54]) box(g, [.14, .12, 1.35], [x, .12, .08], 0xb87b35, [0, 0, x > 0 ? -.08 : .08]);
  sphere(g, .2, [0, .93, .15], 0x183443, [1.25, .75, 1]);
  // Windshield + spinning prop disc (a thin, near-transparent cone reads as motion blur).
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(.5, .16, .02), new THREE.MeshStandardMaterial({ color: 0xbfe7f2, roughness: .15, metalness: .3, transparent: true, opacity: .55 }));
  windshield.position.set(0, 1.02, .34);
  g.add(windshield);
  const propDisc = new THREE.Mesh(new THREE.CircleGeometry(.62, 20), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, transparent: true, opacity: .22, side: THREE.DoubleSide }));
  propDisc.position.set(0, .72, -1.5);
  propDisc.userData.spinPhase = 0;
  g.add(propDisc);
  return g;
}

/** A field of tiny raised rivet-dots on a canvas, for the brass/steel telescope barrel. */
function buildRivetTexture(base: string, rivet: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < 4; row += 1) {
    const y = (row + 0.5) * (size / 4);
    for (let col = 0; col < 10; col += 1) {
      const x = ((col + (row % 2) * 0.5) / 10) * size;
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = rivet;
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildTelescope(upgraded: boolean): THREE.Group {
  const g = new THREE.Group();
  const trim = upgraded ? 0xaec6d1 : 0xd5a645;
  cylinder(g, 1.0, 1.12, .28, [0, .14, 0], 0x704121, [0, 0, 0], 18);
  cylinder(g, .72, .82, .9, [0, .65, 0], 0x81502d, [0, 0, 0], 18);
  for (const x of [-.52, .52]) box(g, [.18, 1.35, .24], [x, 1.2, 0], 0x80502e, [0, 0, x * .14]);
  // Third rear tripod strut, angled back to actually brace the mount like a real tripod.
  box(g, [.16, 1.32, .2], [0, 1.16, .58], 0x7a4a29, [-.16, 0, 0]);
  const barrel = new THREE.Group();
  const barrelMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(.34, .41, 1.85, 18, 1, false),
    new THREE.MeshStandardMaterial({ map: buildRivetTexture(upgraded ? "#3a4d61" : "#8b522d", upgraded ? "#dbe8ee" : "#f0d488"), roughness: .55, metalness: upgraded ? .55 : .12, flatShading: false }),
  );
  barrelMesh.rotation.z = Math.PI / 2;
  barrelMesh.castShadow = true;
  barrel.add(barrelMesh);
  cylinder(barrel, .46, .46, .16, [-.92, 0, 0], trim, [0, 0, Math.PI / 2], 18);
  cylinder(barrel, .39, .39, .1, [.88, 0, 0], trim, [0, 0, Math.PI / 2], 18);
  // Brass eyepiece cluster at the back, like a real observatory scope.
  cylinder(barrel, .16, .19, .22, [-1.05, 0, 0], 0xd9a62f, [0, 0, Math.PI / 2], 10);
  barrel.position.set(0, 1.72, 0);
  barrel.rotation.z = .35;
  g.add(barrel);
  box(g, [.13, 1.45, .13], [0, 1.12, 0], trim, [0, 0, -.35]);
  // Small pennant flag on a thin pole beside the mount — a nod to the crest flags
  // flanking the hilltop landmark in the reference art.
  const flagPole = new THREE.Group();
  cylinder(flagPole, .02, .02, 1.3, [0, .65, 0], 0x4a3a24, [0, 0, 0], 6);
  const pennant = new THREE.Mesh(new THREE.ConeGeometry(.11, .3, 3), mat(0xdd3a34));
  pennant.rotation.z = Math.PI / 2;
  pennant.rotation.y = Math.PI / 2;
  pennant.position.set(.14, 1.16, 0);
  flagPole.add(pennant);
  flagPole.position.set(.78, 0, .72);
  g.add(flagPole);
  return g;
}

function buildCircus(): THREE.Group {
  const g = new THREE.Group();
  const stripe = makeStripeTexture(["#dd3a34", "#f6c637", "#1574bc", "#f6c637", "#dd3a34", "#1574bc"]);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(.95, 1.12, 1.05, 20, 1, true), new THREE.MeshStandardMaterial({ map: stripe, roughness: .82, side: THREE.DoubleSide }));
  wall.position.y = .55; wall.castShadow = true; g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.35, 24), new THREE.MeshStandardMaterial({ map: stripe, roughness: .8 }));
  roof.position.y = 1.72; roof.castShadow = true; g.add(roof);
  cylinder(g, .035, .035, .8, [0, 2.72, 0], 0xd9a62f, [0, 0, 0], 8);
  box(g, [.78, .34, .04], [.38, 2.93, 0], 0xdf3c34, [0, 0, -.12]);
  box(g, [.42, .68, .08], [0, .37, -1.01], 0x142e59);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const x = Math.cos(a) * 1.16, z = Math.sin(a) * 1.16;
    cylinder(g, .035, .035, 1.5, [x, .75, z], 0xd9a62f, [0, 0, 0], 8);
  }
  // Triangular pennant bunting strung around the tent roofline, alternating colors.
  const buntingHeight = 1.28;
  const corners = 8;
  for (let i = 0; i < corners; i += 1) {
    const a0 = (i / corners) * Math.PI * 2;
    const a1 = ((i + 1) / corners) * Math.PI * 2;
    const from = new THREE.Vector3(Math.cos(a0) * 1.02, buntingHeight, Math.sin(a0) * 1.02);
    const to = new THREE.Vector3(Math.cos(a1) * 1.02, buntingHeight, Math.sin(a1) * 1.02);
    buildBunting(g, from, to, 2, [0xdd3a34, 0xf6c637, 0x1574bc]);
  }
  return g;
}

function buildIgloo(): THREE.Group {
  const g = new THREE.Group();
  const seam = 0x8fc5dd;
  const brickTexture = buildIceBrickTexture();
  const brickBump = buildNoiseBumpTexture(1971);
  const domeMaterial = new THREE.MeshStandardMaterial({ map: brickTexture, bumpMap: brickBump, bumpScale: .05, roughness: .82, flatShading: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.03, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMaterial);
  dome.position.y = 0; dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
  for (const y of [.23, .48, .73]) {
    const radius = Math.sqrt(Math.max(.1, 1.03 * 1.03 - y * y));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .018, 5, 32), mat(seam));
    ring.position.y = y; ring.rotation.x = Math.PI / 2; g.add(ring);
  }
  const tunnel = box(g, [.7, .62, .78], [0, .31, -1.03], 0xeaf8ff);
  tunnel.material = new THREE.MeshStandardMaterial({ map: brickTexture, roughness: .85 });
  // Real wooden door with a round porthole window, like the reference igloo art —
  // previously just a flat dark rectangle.
  const doorGroup = new THREE.Group();
  const doorPlanks = new THREE.Mesh(new THREE.BoxGeometry(.4, .43, .06), new THREE.MeshStandardMaterial({ map: buildPlankTexture("#7a4a29", "#6a3e21"), roughness: .78 }));
  doorGroup.add(doorPlanks);
  const porthole = new THREE.Mesh(new THREE.CircleGeometry(.075, 16), new THREE.MeshStandardMaterial({ color: 0x0c1f2c, roughness: .3, metalness: .4 }));
  porthole.position.set(.06, .08, .035);
  doorGroup.add(porthole);
  const portholeRing = new THREE.Mesh(new THREE.TorusGeometry(.075, .014, 6, 16), mat(0x2a2016));
  portholeRing.position.set(.06, .08, .035);
  doorGroup.add(portholeRing);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), mat(0x3a2c1a));
  handle.position.set(-.12, -.02, .04);
  doorGroup.add(handle);
  doorGroup.position.set(0, .24, -1.44);
  g.add(doorGroup);
  for (const x of [-.34, .34]) box(g, [.06, .54, .7], [x, .3, -1.07], seam);
  return g;
}

function buildSweatshop(): THREE.Group {
  const g = new THREE.Group();
  const wallMaterial = new THREE.MeshStandardMaterial({ map: buildPlankTexture("#7c4327", "#6b3a21"), bumpMap: buildNoiseBumpTexture(552), bumpScale: .04, roughness: .88 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.25, 1.45), wallMaterial);
  walls.position.set(0, .63, 0); walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  box(g, [2.05, .16, 1.35], [0, 1.38, -.45], 0x234f7d, [.55, 0, 0]);
  box(g, [2.05, .16, 1.35], [0, 1.38, .45], 0x234f7d, [-.55, 0, 0]);
  box(g, [.42, .78, .05], [0, .39, -.74], 0x25170f);
  for (const x of [-.65, .65]) box(g, [.36, .35, .05], [x, .8, -.74], 0x66c7e2);
  // "WORK HARD" sign over the door, matching the painted reference facade.
  const sign = makeLabel("WORK HARD", "#ffcf5c");
  sign.scale.set(1.0, .22, 1);
  sign.position.set(0, 1.08, -.78);
  g.add(sign);
  cylinder(g, .19, .23, 1.42, [.62, 1.88, .32], 0x67564a, [0, 0, 0], 10);
  for (let i = 0; i < 4; i += 1) {
    const puff = sphere(g, .24 + i * .06, [.62 + i * .1, 2.65 + i * .32, .32], 0xd8e0df, [1, .8, 1]);
    puff.userData.smokePhase = i * .8;
    puff.userData.smokeBaseY = puff.position.y;
  }
  for (let i = 0; i < 5; i += 1) box(g, [.42, .42, .42], [-.92 + i * .46, .21, .92], i % 2 ? 0x1b65a2 : 0xa63e32);
  // Split-rail fence enclosing the yard, and a couple of stacked barrels, echoing
  // the fenced "WORK HARD" compound in the reference art.
  const fenceZ = 1.28;
  for (const x of [-1.2, -.6, 0, .6, 1.2]) {
    cylinder(g, .035, .04, .5, [x, .27, fenceZ], 0x4a3420, [0, 0, 0], 6);
  }
  for (const y of [.32, .46]) beamBetween(g, new THREE.Vector3(-1.25, y, fenceZ), new THREE.Vector3(1.25, y, fenceZ), .022, 0x5a4128);
  for (const x of [-1.05, -.85]) {
    cylinder(g, .16, .18, .3, [x, .16, 1.05], 0x5a4128, [0, 0, 0], 10);
  }
  return g;
}

function buildBoat(): THREE.Group {
  const g = new THREE.Group();
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.5, 0); hullShape.lineTo(1.25, 0); hullShape.lineTo(1.55, .38); hullShape.lineTo(-1.25, .52); hullShape.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 1.05, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 2 });
  hullGeo.center();
  const hull = new THREE.Mesh(hullGeo, mat(0x9f352c)); hull.rotation.x = -Math.PI / 2; hull.position.y = .42; hull.castShadow = true; g.add(hull);
  box(g, [2.5, .14, 1.0], [0, .78, 0], 0xc79654);
  box(g, [.72, .67, .72], [.72, 1.16, 0], 0xe9e1c7);
  box(g, [.74, .17, .76], [.72, 1.53, 0], 0x1d536e);
  for (const [x, z, c] of [[-.78,-.27,0x1f65a6],[-.78,.27,0xb53b33],[-.27,-.27,0xe0a832],[-.27,.27,0x1f65a6]] as const) box(g, [.45, .38, .45], [x, 1.05, z], c);
  cylinder(g, .035, .035, 1.65, [.18, 1.65, 0], 0x4f3524, [0, 0, 0], 8);
  box(g, [.04, .48, .68], [.2, 2.06, 0], 0xedcf69);
  // Loading crane over the container stack: a mast, an angled jib, and a cable
  // hanging down to a hook — the boat previously had cargo but no way to load it.
  const crane = new THREE.Group();
  cylinder(crane, .045, .06, 1.5, [0, 0, 0], 0x2c2f33, [0, 0, 0], 8);
  const jibStart = new THREE.Vector3(0, .72, 0);
  const jibEnd = new THREE.Vector3(-.95, .34, 0);
  beamBetween(crane, jibStart, jibEnd, .035, 0x2c2f33);
  beamBetween(crane, new THREE.Vector3(0, .1, 0), jibEnd, .022, 0x555b61);
  beamBetween(crane, jibEnd, new THREE.Vector3(-.95, .05, 0), .012, 0x1c1e21);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 6, 10, Math.PI * 1.4), mat(0x1c1e21));
  hook.position.set(-.95, .04, 0);
  crane.add(hook);
  crane.position.set(-.55, 1.55, -.32);
  g.add(crane);
  // Small flag flying from the mast, matching the penguin-flag detail on the biplane.
  const boatFlag = new THREE.Mesh(new THREE.ConeGeometry(.09, .24, 3), mat(0xdd3a34));
  boatFlag.rotation.z = Math.PI / 2;
  boatFlag.rotation.y = Math.PI / 2;
  boatFlag.position.set(.13, 2.24, 0);
  boatFlag.userData.flagWave = true;
  g.add(boatFlag);
  return g;
}

function buildArena(): THREE.Group {
  const g = new THREE.Group();
  box(g, [2.7, .34, 2.05], [0, .17, 0], 0x3c4656);
  box(g, [2.35, .12, 1.7], [0, .42, 0], 0x174d98);
  const corners = [[-1.14,-.82],[1.14,-.82],[-1.14,.82],[1.14,.82]];
  for (const [x,z] of corners) cylinder(g, .09, .11, 1.28, [x, .92, z], 0xa52c28, [0,0,0], 10);
  for (const y of [.66,.91,1.16]) {
    beamBetween(g, new THREE.Vector3(-1.14,y,-.82), new THREE.Vector3(1.14,y,-.82), .025, 0xd9b68a);
    beamBetween(g, new THREE.Vector3(-1.14,y,.82), new THREE.Vector3(1.14,y,.82), .025, 0xd9b68a);
    beamBetween(g, new THREE.Vector3(-1.14,y,-.82), new THREE.Vector3(-1.14,y,.82), .025, 0xd9b68a);
    beamBetween(g, new THREE.Vector3(1.14,y,-.82), new THREE.Vector3(1.14,y,.82), .025, 0xd9b68a);
  }
  const emblem = makeLabel("K9  KNOCKOUT", "#ff635c"); emblem.position.set(0, .52, 0); emblem.scale.set(1.65,.36,1); g.add(emblem);
  // Corner floodlights on tall poles, angled inward — gives the pit a "night fight"
  // presence instead of reading as a bare fenced rectangle in daylight.
  for (const [x, z] of corners) {
    const poleHeight = 1.9 + seededRandom(x * 3 + z) * .3;
    cylinder(g, .03, .04, poleHeight, [x * 1.12, poleHeight / 2, z * 1.12], 0x24272b, [0, 0, 0], 6);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffdf8a, emissiveIntensity: .9, roughness: .4 }));
    lamp.position.set(x * 1.12, poleHeight, z * 1.12);
    lamp.rotation.x = Math.PI;
    lamp.lookAt(0, .3, 0);
    g.add(lamp);
  }
  return g;
}

function buildBuildingModel(id: string, telescopeUpgraded: boolean): THREE.Group {
  if (id === "plane") return buildPlane();
  if (id === "telescope") {
    const wrapper = new THREE.Group();
    const wood = buildTelescope(false); wood.userData.variant = "wood";
    const metal = buildTelescope(true); metal.userData.variant = "metal"; metal.visible = telescopeUpgraded;
    wood.visible = !telescopeUpgraded;
    wrapper.add(wood, metal);
    return wrapper;
  }
  if (id === "magic") return buildCircus();
  if (id === "igloo") return buildIgloo();
  if (id === "sweatshop") return buildSweatshop();
  if (id === "docks") return buildBoat();
  return buildArena();
}

/** Adds a small pool of colors so the wandering penguins aren't all identical clones. */
const PENGUIN_COLORS = [0x273fbd, 0x1c3a8f, 0x2a2a2a, 0x33507a, 0x1a2f5c];

function buildPenguin(color = 0x273fbd): THREE.Group {
  const g = new THREE.Group();
  const body = sphere(g, .18, [0,.24,0], color, [.85,1.3,.75]);
  body.userData.isPenguinBody = true;
  sphere(g, .12, [0,.48,0], color);
  sphere(g, .11, [0,.25,-.13], 0xf4f0df, [.75,1.15,.3]);
  box(g, [.1,.035,.16], [-.1,.035,0], 0xff7d2b, [0,.2,0]);
  box(g, [.1,.035,.16], [.1,.035,0], 0xff7d2b, [0,-.2,0]);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.055,.16,4), mat(0xff7d2b)); beak.rotation.x = -Math.PI/2; beak.position.set(0,.48,-.15); g.add(beak);
  // Little flipper wings that swing while waddling — the previous model had no
  // arms at all, so walking/jumping had nothing visibly animating besides tilt.
  const flipperGeo = new THREE.SphereGeometry(.1, 10, 8);
  for (const side of [-1, 1]) {
    const flipper = new THREE.Mesh(flipperGeo, mat(color));
    flipper.scale.set(.34, .95, .55);
    flipper.position.set(side * .19, .27, .01);
    flipper.rotation.z = side * .3;
    flipper.userData.isFlipper = true;
    flipper.userData.flipperSide = side;
    g.add(flipper);
  }
  // Feet, offset slightly so a walk-cycle bob reads as steps rather than a slide.
  for (const side of [-1, 1]) {
    const foot = box(g, [.075, .03, .13], [side * .07, .015, .04], 0xff7d2b);
    foot.userData.isFoot = true;
    foot.userData.footSide = side;
  }
  return g;
}

/** Every material on a mesh, stashed the first time we tint it so we can restore it exactly. */
type GhostState = { material: THREE.MeshStandardMaterial; baseColor: THREE.Color; baseOpacity: number; baseTransparent: boolean }[];

export default function PenguinTownScene3D({
  townLayout,
  telescopeUpgraded,
  activeBuildingId,
  placingBuildingId,
  placementRotation,
  popupOpen,
  onSelectBuilding,
  onPlacementPreview,
  onCommitPlacement,
  onPlacementMessage,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation, popupOpen });
  const callbacksRef = useRef({ onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage });

  useEffect(() => {
    propsRef.current = { townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation, popupOpen };
  }, [townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation, popupOpen]);

  useEffect(() => {
    callbacksRef.current = { onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage };
  }, [onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x91cce3);
    scene.fog = new THREE.FogExp2(0x91cce3, 0.0085);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
    const islandTop = ISLAND_HEIGHT + PLATEAU_HEIGHT * 0.4;
    camera.position.set(14, 13, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, islandTop, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 48;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = 1.5;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    let compactMode = false;
    const frameCamera = () => {
      compactMode = width / height < .72;
      camera.fov = compactMode ? 68 : 42;
      controls.minDistance = compactMode ? 6 : 3.5;
      controls.maxDistance = compactMode ? 52 : 48;
      if (compactMode && camera.position.length() < 18) camera.position.setLength(22);
      if (!compactMode && camera.position.length() > 40) camera.position.setLength(26);
      camera.updateProjectionMatrix();
    };
    frameCamera();
    controls.update();

    // Building-popup camera pull-back: on the compact (mobile-proportioned)
    // framing, opening the round popup eases the camera further back and its
    // target a touch higher so the whole island stays visible above the
    // popup instead of being partly covered by it. Applied as a pure
    // incremental delta each frame (not an absolute position) so it never
    // fights the player's own orbit/zoom — closing the popup eases the same
    // total amount back off. No-op on the wide desktop framing, where the
    // popup docks beside the island instead of over it.
    let popupPullback = 0;
    const POPUP_PULLBACK_DISTANCE = 8;
    const POPUP_PULLBACK_LIFT = 2.4;

    scene.add(new THREE.HemisphereLight(0xcdf5ff, 0x213142, 1.25));
    const sun = new THREE.DirectionalLight(0xfef6e6, 2.1);
    sun.position.set(12, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x63e0ee, 0.65);
    rim.position.set(-10, 6, -8);
    scene.add(rim);

    // ---------------- Terrain: two tiered slabs built from the same percent
    // polygons the placement rules already check, so what you see always
    // agrees with where buildings are allowed to go. ----------------
    const lowerIsland = buildTerrainSlab(TERRAIN_REGIONS.lowerIsland.bounds, ISLAND_HEIGHT, 0, 0xeaf4fb, 0x86a9bd);
    const upperPlateau = buildTerrainSlab(TERRAIN_REGIONS.upperPlateau.bounds, PLATEAU_HEIGHT, ISLAND_HEIGHT, 0xf4fbff, 0x6f9db3);
    scene.add(lowerIsland, upperPlateau);

    // Broken ice, harbor markers, and tiny locals give the coastline scale and
    // stop the island from reading like a blank white game-board extrusion.
    const setDressing = new THREE.Group();
    for (let i = 0; i < 22; i += 1) {
      const angle = seededRandom(i + 91) * Math.PI * 2;
      const distance = 8.5 + seededRandom(i + 126) * 9;
      const floe = cylinder(setDressing, .35 + seededRandom(i + 44) * .65, .45 + seededRandom(i + 44) * .7, .08 + seededRandom(i + 2) * .09, [Math.cos(angle) * distance, .06, Math.sin(angle) * distance], 0xdff4fa, [0, seededRandom(i) * Math.PI, 0], 7);
      floe.scale.z = .55 + seededRandom(i + 72) * .65;
    }
    scene.add(setDressing);

    // ---------------- Penguin wander AI + toss-into-water physics ----------------
    // Each background penguin wanders to random walkable points on its own, with
    // an idle waddle when still and a hop cadence when moving. Clicking one tosses
    // it in a tumbling arc out over the ocean (real parabolic flight, not a
    // teleport), it splashes, swims a little loop, then waddles back to shore —
    // a light, readable stand-in for full ragdoll physics (in the spirit of the
    // Dr. Bongo ragdoll elsewhere on the site) that stays cheap with 5 penguins.
    type PenguinMode = "idle" | "walk" | "selected" | "toss" | "ragdoll" | "swim" | "return";
    type PenguinAI = {
      group: THREE.Group;
      mode: PenguinMode;
      target: THREE.Vector3;
      timer: number;
      facing: number;
      hopPhase: number;
      tossFrom: THREE.Vector3;
      tossTo: THREE.Vector3;
      tossElapsed: number;
      tossDuration: number;
      spin: THREE.Vector3;
      velocity: THREE.Vector3;
    };

    const lowerSurfaceBBox = TERRAIN_REGIONS.lowerIsland.surface.reduce(
      (box, [px, py]) => ({ minX: Math.min(box.minX, px), maxX: Math.max(box.maxX, px), minY: Math.min(box.minY, py), maxY: Math.max(box.maxY, py) }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    );

    function randomWalkablePoint(): THREE.Vector3 {
      for (let attempt = 0; attempt < 24; attempt += 1) {
        const px = lowerSurfaceBBox.minX + Math.random() * (lowerSurfaceBBox.maxX - lowerSurfaceBBox.minX);
        const py = lowerSurfaceBBox.minY + Math.random() * (lowerSurfaceBBox.maxY - lowerSurfaceBBox.minY);
        if (!pointInPolygon([px, py], TERRAIN_REGIONS.lowerIsland.surface)) continue;
        const { x, z } = percentToWorldXZ(px, py);
        return new THREE.Vector3(x, ISLAND_HEIGHT + 0.05, z);
      }
      return new THREE.Vector3(0, ISLAND_HEIGHT + 0.05, 0);
    }

    const penguinGroup = new THREE.Group();
    const penguins: PenguinAI[] = [];
    const PENGUIN_SPAWN: readonly [number, number][] = [[-7, -3], [-5, 7], [5, 5], [7, -1], [-1, 7]];
    PENGUIN_SPAWN.forEach(([x, z], index) => {
      const model = buildPenguin(PENGUIN_COLORS[index % PENGUIN_COLORS.length]);
      model.traverse((object) => { object.userData.penguinIndex = index; });
      const start = new THREE.Vector3(x, ISLAND_HEIGHT + 0.05, z);
      model.position.copy(start);
      const facing = seededRandom(x * z + 80) * Math.PI * 2;
      model.rotation.y = facing;
      penguinGroup.add(model);
      penguins.push({
        group: model,
        mode: "idle",
        target: start.clone(),
        timer: 1 + seededRandom(index + 40) * 3,
        facing,
        hopPhase: seededRandom(index + 5) * 10,
        tossFrom: start.clone(),
        tossTo: start.clone(),
        tossElapsed: 0,
        tossDuration: 1,
        spin: new THREE.Vector3(seededRandom(index) - .5, seededRandom(index + 1) - .5, seededRandom(index + 2) - .5).normalize(),
        velocity: new THREE.Vector3(),
      });
    });
    scene.add(penguinGroup);

    // Small pool of expanding splash-ring meshes, reused rather than allocated
    // per-toss so repeated tossing doesn't leak geometry.
    const splashRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.16, 24),
        new THREE.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.visible = false;
      ring.userData.life = 0;
      scene.add(ring);
      splashRings.push(ring);
    }
    function spawnSplash(position: THREE.Vector3) {
      const ring = splashRings.find((candidate) => candidate.userData.life <= 0) ?? splashRings[0];
      ring.position.set(position.x, 0.03, position.z);
      ring.scale.setScalar(1);
      ring.visible = true;
      ring.userData.life = 0.7;
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.85;
    }

    function tossPenguin(index: number) {
      const penguin = penguins[index];
      if (!penguin || penguin.mode === "toss" || penguin.mode === "ragdoll" || penguin.mode === "swim") return;
      const from = penguin.group.position.clone();
      const angle = Math.random() * Math.PI * 2;
      const speed = 7 + Math.random() * 4;
      penguin.mode = "ragdoll";
      penguin.tossFrom = from;
      penguin.tossTo = new THREE.Vector3(Math.cos(angle) * (15 + Math.random() * 6), 0, Math.sin(angle) * (15 + Math.random() * 6));
      penguin.tossElapsed = 0;
      penguin.tossDuration = 1.1;
      penguin.velocity.set(Math.cos(angle) * speed, 8.5 + Math.random() * 2.4, Math.sin(angle) * speed);
      penguin.spin.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
      penguin.timer = 0;
      selectedPenguin = null;
      selectRing.visible = false;
    }

    let selectedPenguin: number | null = null;
    const selectRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.045, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x69f8ff, transparent: true, opacity: 0.92 }),
    );
    selectRing.rotation.x = -Math.PI / 2;
    selectRing.visible = false;
    scene.add(selectRing);

    function selectPenguin(index: number) {
      const penguin = penguins[index];
      if (!penguin) return;
      if (selectedPenguin === index) {
        tossPenguin(index);
        return;
      }
      if (selectedPenguin !== null) {
        const previous = penguins[selectedPenguin];
        if (previous && previous.mode === "selected") previous.mode = "idle";
      }
      selectedPenguin = index;
      if (penguin.mode === "walk" || penguin.mode === "idle") penguin.mode = "selected";
      selectRing.visible = true;
    }

    // ---------------- Backdrop: distant mainland Antarctica ----------------
    // A close ring of real 3D peaks reads as solid geometry near the camera;
    // a painted matte cylinder far behind it fakes miles of receding range
    // without the cost of modeling it, both fogged into the sky color.
    const backdrop = buildPaintedBackdrop();
    scene.add(backdrop);
    const mountains = buildMountainRange();
    scene.add(mountains);

    // ---------------- Buildable-grid overlay ----------------
    // Translucent rounded tiles over every land/cliff/ocean cell in range, so
    // the mesh (and the game's collision rules) are visible at a glance. Each
    // tile is an exact parallelogram in the iso lattice (not a plain square),
    // since the column/row basis vectors are constant under this projection.
    const gridGroup = buildGridOverlay();
    gridGroup.visible = false;
    scene.add(gridGroup);

    const oceanGeometry = new THREE.PlaneGeometry(140, 140, 72, 72);
    oceanGeometry.rotateX(-Math.PI / 2);
    const oceanBasePositions = oceanGeometry.attributes.position.array.slice();
    // Two independently-scrolling layers give the water real texture: a coarse
    // rolling-swell bump (moves slow, drives the big highlights/shadows) and a
    // fine glinting-sparkle emissive layer (moves fast, reads as sunlight/wave
    // crests catching the light) — plus the existing per-vertex sine displacement
    // below for actual geometric wave motion, not just a painted-on illusion.
    const oceanWaveTexture = buildOceanWaveTexture();
    const oceanSparkleTexture = buildOceanSparkleTexture();
    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a7fac,
      roughness: 0.32,
      metalness: 0.2,
      transparent: true,
      opacity: 0.93,
      bumpMap: oceanWaveTexture,
      bumpScale: 0.14,
      emissive: 0xbdf1ff,
      emissiveMap: oceanSparkleTexture,
      emissiveIntensity: 0.5,
    });
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.receiveShadow = true;
    scene.add(ocean);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    // ---------------- Buildings ----------------
    const buildingGroups = new Map<string, THREE.Group>();
    const ghostStates = new Map<string, GhostState>();

    function captureGhostState(group: THREE.Group): GhostState {
      const state: GhostState = [];
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial) {
            state.push({ material, baseColor: material.color.clone(), baseOpacity: material.opacity, baseTransparent: material.transparent });
          }
        }
      });
      return state;
    }

    function applyGhostTint(id: string, tint: "valid" | "invalid" | null) {
      const state = ghostStates.get(id);
      if (!state) return;
      for (const entry of state) {
        if (!tint) {
          entry.material.color.copy(entry.baseColor);
          entry.material.opacity = entry.baseOpacity;
          entry.material.transparent = entry.baseTransparent;
          continue;
        }
        entry.material.color.copy(tint === "valid" ? GHOST_VALID : GHOST_INVALID);
        entry.material.transparent = true;
        entry.material.opacity = 0.55;
      }
    }

    for (const building of buildings) {
      const group = new THREE.Group();
      group.userData.buildingId = building.id;

      const model = buildBuildingModel(building.id, telescopeUpgraded);
      const modelScale = building.id === "docks" ? .92 : building.id === "plane" ? .9 : building.id === "arena" ? .9 : .83;
      model.scale.setScalar(modelScale);
      model.traverse((object) => { object.userData.buildingId = building.id; });
      group.add(model);

      const labelText: Record<string, string> = {
        plane: "SKI-BIPLANE",
        telescope: "ALIEN TELESCOPE",
        magic: "WADDLES' CIRCUS",
        igloo: "DR. BONGO'S IGLOO",
        sweatshop: "PENGUIN SWEATSHOP",
        docks: "RAT-MEAT FREIGHTER",
        arena: "DOG-FIGHT BOXING",
      };
      const label = makeLabel(labelText[building.id], building.id === "arena" ? "#ff635c" : "#ffe35d");
      label.position.set(0, building.id === "magic" ? 3.2 : building.id === "sweatshop" ? 3.05 : 2.4, 0);
      if (building.id === "plane") label.position.x = -.72;
      if (building.id === "sweatshop") label.position.x = .82;
      label.userData.buildingId = building.id;
      group.add(label);

      scene.add(group);
      buildingGroups.set(building.id, group);
      ghostStates.set(building.id, captureGhostState(group));
    }

    // ---------------- Pointer interaction ----------------
    // Placement (moving from inventory, or an already-placed building's
    // "MOVE" button) drives the picked building's own group directly, so
    // there's only ever one instance of it on screen — real or ghost.
    let hoverPreview: PlacementPreview | null = null;
    let lastPlacingId: string | null = null;

    function setPointerFromEvent(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
    }

    function groundHit(): THREE.Vector3 | null {
      const hit = new THREE.Vector3();
      const groundHits = raycaster.intersectObjects([lowerIsland, upperPlateau, ocean], false);
      if (groundHits.length) return groundHits[0].point;
      return raycaster.ray.intersectPlane(groundPlane, hit);
    }

    function updatePlacementPreview(event: PointerEvent) {
      const placingId = propsRef.current.placingBuildingId;
      if (!placingId) return;
      const building = buildings.find((candidate) => candidate.id === placingId);
      const group = building ? buildingGroups.get(placingId) : null;
      if (!building || !group) return;

      setPointerFromEvent(event);
      const hit = groundHit();
      if (!hit) return;
      const rotation = propsRef.current.placementRotation;
      const position = gridPositionFromWorld(building, hit.x, hit.z, rotation);
      const issue = placementIssue(building, position, propsRef.current.townLayout, rotation);
      hoverPreview = { id: placingId, ...position, rotation, valid: !issue };

      const worldPosition = buildingWorldPosition(building, position, rotation);
      group.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      group.rotation.y = (rotation * Math.PI) / 180;
      group.visible = true;
      applyGhostTint(placingId, issue ? "invalid" : "valid");
      callbacksRef.current.onPlacementPreview(hoverPreview);
      callbacksRef.current.onPlacementMessage(issue ?? terrainMoveInstruction(building.terrain));
    }

    let pointerDownAt: { x: number; y: number; time: number } | null = null;

    function onPointerDown(event: PointerEvent) {
      pointerDownAt = { x: event.clientX, y: event.clientY, time: performance.now() };
      // Capture the pointer so a release over another UI element layered on
      // top of the canvas (the rotate control, the selection card) still
      // reaches this element's own pointerup handler instead of falling
      // through to whatever's visually underneath at that screen position —
      // without this, tapping ROTATE could silently commit a placement.
      dom.setPointerCapture(event.pointerId);
      if (propsRef.current.placingBuildingId) {
        // Placement mode: keep the camera still so a tap-to-place isn't
        // read as an orbit drag, and compute a preview immediately so a
        // touch tap (no pointermove beforehand) still has somewhere to land.
        controls.enabled = false;
        updatePlacementPreview(event);
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (propsRef.current.placingBuildingId) updatePlacementPreview(event);
    }

    function onPointerUp(event: PointerEvent) {
      const placingId = propsRef.current.placingBuildingId;
      const downAt = pointerDownAt;
      pointerDownAt = null;

      if (placingId) {
        controls.enabled = true;
        updatePlacementPreview(event);
        // A tap commits wherever the last hover preview landed; a real
        // drag-then-release does too, since pointermove kept it current.
        if (hoverPreview && hoverPreview.id === placingId && hoverPreview.valid) {
          callbacksRef.current.onCommitPlacement(placingId, { column: hoverPreview.column, row: hoverPreview.row }, propsRef.current.placementRotation);
        }
        return;
      }

      if (!downAt) return;
      const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
      const elapsed = performance.now() - downAt.time;
      if (moved > 6 || elapsed > 550) return; // treat as an orbit drag, not a click

      setPointerFromEvent(event);
      const hits = raycaster.intersectObjects([...buildingGroups.values()], true);
      const hitId = hits.length ? (hits[0].object.userData.buildingId as string | undefined) : undefined;
      if (hitId) {
        callbacksRef.current.onSelectBuilding(hitId);
        return;
      }
      const penguinHits = raycaster.intersectObjects(penguinGroup.children, true);
      const penguinIndex = penguinHits.length ? (penguinHits[0].object.userData.penguinIndex as number | undefined) : undefined;
      if (typeof penguinIndex === "number") {
        selectPenguin(penguinIndex);
        return;
      }
      if (selectedPenguin !== null) {
        const previous = penguins[selectedPenguin];
        if (previous && previous.mode === "selected") previous.mode = "idle";
      }
      selectedPenguin = null;
      selectRing.visible = false;
    }

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    // Listening on the canvas itself (not window) plus the pointer capture
    // above means a release over another UI element layered on top of the
    // canvas — the rotate control, the selection card — never reaches this
    // handler unless the drag actually started on the canvas.
    dom.addEventListener("pointerup", onPointerUp);

    // ---------------- Per-frame sync + render ----------------
    let raf = 0;
    const clock = new THREE.Clock();

    let lastFrameElapsed = 0;
    function step() {
      raf = requestAnimationFrame(step);
      const elapsed = clock.getElapsedTime();
      const frameDeltaSec = Math.min(0.05, Math.max(0, elapsed - lastFrameElapsed));
      lastFrameElapsed = elapsed;
      const props = propsRef.current;

      setDressing.children.forEach((object) => {
        if (object.userData.waddlePhase === undefined) return;
        object.rotation.z = Math.sin(elapsed * 3 + object.userData.waddlePhase) * .055;
      });

      // ---- Penguin wander AI / toss / swim state machine ----
      const WALK_SPEED = 0.9; // world units/sec
      const SWIM_SPEED = 1.3;
      for (const penguin of penguins) {
        const { group } = penguin;
        if (penguin.mode === "selected") {
          group.rotation.z = Math.sin(elapsed * 3 + penguin.hopPhase) * .055;
          group.position.y = ISLAND_HEIGHT + 0.05;
          group.scale.set(1, 1, 1);
        } else if (penguin.mode === "idle" || penguin.mode === "walk") {
          penguin.timer -= frameDeltaSec;
          if (penguin.mode === "idle") {
            group.rotation.z = Math.sin(elapsed * 3 + penguin.hopPhase) * .055;
            if (penguin.timer <= 0) {
              penguin.target = randomWalkablePoint();
              penguin.mode = "walk";
              penguin.timer = 20; // safety cap so a stuck pathfind can't wander forever
            }
          } else {
            const toTarget = penguin.target.clone().sub(group.position);
            toTarget.y = 0;
            const distance = toTarget.length();
            if (distance < 0.15 || penguin.timer <= 0) {
              penguin.mode = "idle";
              penguin.timer = 1.5 + seededRandom(elapsed * 13 + penguin.hopPhase) * 3.5;
              group.rotation.x = 0;
            } else {
              const direction = toTarget.normalize();
              const desiredFacing = Math.atan2(direction.x, direction.z);
              let facingDelta = desiredFacing - penguin.facing;
              facingDelta = Math.atan2(Math.sin(facingDelta), Math.cos(facingDelta));
              penguin.facing += facingDelta * Math.min(1, frameDeltaSec * 6);
              group.rotation.y = penguin.facing;
              const step3 = Math.min(distance, WALK_SPEED * frameDeltaSec);
              group.position.addScaledVector(direction, step3);
              // Hop cadence: a little vertical bounce + squash-stretch reads as a
              // waddling gait rather than a gliding sprite.
              const hopT = (elapsed * 7 + penguin.hopPhase) % (Math.PI * 2);
              const hop = Math.abs(Math.sin(hopT));
              group.position.y = ISLAND_HEIGHT + 0.05 + hop * 0.05;
              group.rotation.z = Math.sin(hopT * 2) * .12;
              group.scale.set(1 - hop * .06, 1 + hop * .1, 1 - hop * .06);
              group.traverse((object) => {
                if (object.userData.isFlipper) object.rotation.x = Math.sin(hopT + (object.userData.flipperSide === 1 ? Math.PI : 0)) * .4;
                if (object.userData.isFoot) object.position.y = 0.015 + Math.max(0, Math.sin(hopT + (object.userData.footSide === 1 ? Math.PI : 0))) * .05;
              });
            }
          }
        } else if (penguin.mode === "ragdoll") {
          penguin.velocity.y -= 18 * frameDeltaSec;
          penguin.group.position.addScaledVector(penguin.velocity, frameDeltaSec);
          penguin.group.rotation.x += penguin.spin.x * frameDeltaSec * 14;
          penguin.group.rotation.y += penguin.spin.y * frameDeltaSec * 14;
          penguin.group.rotation.z += penguin.spin.z * frameDeltaSec * 14;
          const onIsland = penguin.group.position.y <= ISLAND_HEIGHT + 0.08
            && Math.hypot(penguin.group.position.x, penguin.group.position.z) < 11;
          if (onIsland && penguin.velocity.y < 0) {
            penguin.group.position.y = ISLAND_HEIGHT + 0.05;
            penguin.velocity.y = Math.abs(penguin.velocity.y) * 0.48;
            penguin.velocity.x *= 0.72;
            penguin.velocity.z *= 0.72;
            penguin.spin.multiplyScalar(0.7);
            if (penguin.velocity.length() < 1.6) {
              penguin.mode = "idle";
              penguin.timer = 1 + Math.random() * 2;
              penguin.facing = penguin.group.rotation.y;
              penguin.group.rotation.x = 0;
              penguin.group.rotation.z = 0;
              penguin.group.scale.set(1, 1, 1);
            }
          } else if (penguin.group.position.y < 0.04) {
            penguin.group.position.y = 0.02;
            spawnSplash(penguin.group.position);
            penguin.mode = "swim";
            penguin.timer = 3 + Math.random() * 2.5;
            penguin.tossTo.copy(penguin.group.position);
            penguin.group.scale.set(.92, .78, .92);
          }
        } else if (penguin.mode === "toss") {
          penguin.tossElapsed += frameDeltaSec;
          const t = Math.min(1, penguin.tossElapsed / penguin.tossDuration);
          const gravity = 9;
          const vy0 = gravity * penguin.tossDuration * 0.55;
          const height = vy0 * (penguin.tossElapsed) - 0.5 * gravity * penguin.tossElapsed * penguin.tossElapsed;
          const pos = penguin.tossFrom.clone().lerp(penguin.tossTo, t);
          pos.y = ISLAND_HEIGHT + 0.05 + Math.max(0, height);
          group.position.copy(pos);
          group.rotation.x += penguin.spin.x * frameDeltaSec * 9;
          group.rotation.y += penguin.spin.y * frameDeltaSec * 9;
          group.rotation.z += penguin.spin.z * frameDeltaSec * 9;
          if (t >= 1) {
            group.position.set(penguin.tossTo.x, 0.02, penguin.tossTo.z);
            group.rotation.set(0, penguin.facing, 0);
            group.scale.set(.92, .78, .92);
            spawnSplash(group.position);
            penguin.mode = "swim";
            penguin.timer = 3 + Math.random() * 2.5;
            penguin.target = penguin.tossTo.clone();
          }
        } else if (penguin.mode === "swim") {
          penguin.timer -= frameDeltaSec;
          const swimAngle = elapsed * 0.6 + penguin.hopPhase;
          group.position.x = penguin.tossTo.x + Math.cos(swimAngle) * 0.6;
          group.position.z = penguin.tossTo.z + Math.sin(swimAngle) * 0.6;
          group.position.y = 0.02 + Math.sin(elapsed * 3.4 + penguin.hopPhase) * 0.02;
          group.rotation.y = swimAngle + Math.PI / 2;
          group.rotation.z = Math.sin(elapsed * 3.4 + penguin.hopPhase) * .18;
          if (penguin.timer <= 0) {
            penguin.mode = "return";
            penguin.target = randomWalkablePoint();
          }
        } else if (penguin.mode === "return") {
          const toTarget = penguin.target.clone().sub(group.position);
          toTarget.y = 0;
          const distance = toTarget.length();
          if (distance < 0.3) {
            penguin.mode = "idle";
            penguin.timer = 1 + Math.random() * 2;
            penguin.facing = group.rotation.y;
            group.scale.set(1, 1, 1);
            group.position.y = ISLAND_HEIGHT + 0.05;
          } else {
            const direction = toTarget.normalize();
            penguin.facing = Math.atan2(direction.x, direction.z);
            group.rotation.y = penguin.facing;
            const step3 = Math.min(distance, SWIM_SPEED * frameDeltaSec);
            group.position.addScaledVector(direction, step3);
            const swimBob = Math.sin(elapsed * 5) * 0.02;
            group.position.y = distance > 1.5 ? 0.02 + swimBob : ISLAND_HEIGHT + 0.05;
          }
        }
      }

      if (selectedPenguin !== null) {
        const penguin = penguins[selectedPenguin];
        if (penguin && penguin.mode !== "ragdoll" && penguin.mode !== "toss") {
          selectRing.visible = true;
          selectRing.position.copy(penguin.group.position);
          selectRing.position.y = penguin.group.position.y + 0.04;
          const pulse = 1 + Math.sin(elapsed * 6.2) * 0.14;
          selectRing.scale.setScalar(pulse);
          (selectRing.material as THREE.MeshBasicMaterial).opacity = 0.62 + Math.sin(elapsed * 6.2) * 0.28;
        } else {
          selectRing.visible = false;
        }
      }

      for (const ring of splashRings) {
        if (ring.userData.life <= 0) continue;
        ring.userData.life -= frameDeltaSec;
        const progress = 1 - Math.max(0, ring.userData.life) / 0.7;
        ring.scale.setScalar(1 + progress * 9);
        const material = ring.material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, 0.85 * (1 - progress));
        if (ring.userData.life <= 0) ring.visible = false;
      }

      const sweatshop = buildingGroups.get("sweatshop");
      sweatshop?.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object.userData.smokePhase === undefined) return;
        object.position.y = object.userData.smokeBaseY + Math.sin(elapsed * 1.35 + object.userData.smokePhase) * .06;
      });

      const plane = buildingGroups.get("plane");
      plane?.traverse((object) => { if (object.userData.spinPhase !== undefined) object.rotation.z = elapsed * 26; });
      const boat = buildingGroups.get("docks");
      boat?.traverse((object) => { if (object.userData.flagWave) object.rotation.x = Math.sin(elapsed * 4) * .18; });

      // Ocean ripple: per-vertex sine displacement on a coarse grid (two swell
      // frequencies plus a finer chop layer) for actual geometric wave motion,
      // paired with the two scrolling canvas layers below for surface texture.
      const positions = oceanGeometry.attributes.position;
      for (let i = 0; i < positions.count; i += 1) {
        const x = oceanBasePositions[i * 3];
        const z = oceanBasePositions[i * 3 + 2];
        const y = Math.sin(x * 0.35 + elapsed * 1.1) * 0.06 + Math.cos(z * 0.3 + elapsed * 0.8) * 0.06
          + Math.sin((x + z) * 0.9 + elapsed * 2.1) * 0.02;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
      oceanGeometry.computeVertexNormals();
      oceanWaveTexture.offset.set(elapsed * 0.014, elapsed * 0.009);
      oceanSparkleTexture.offset.set(-elapsed * 0.05, elapsed * 0.032);

      gridGroup.visible = Boolean(props.placingBuildingId);

      const frameDeltaMs = frameDeltaSec * 1000;
      const wantPullback = compactMode && props.popupOpen ? 1 : 0;
      const previousPullback = popupPullback;
      popupPullback += (wantPullback - popupPullback) * Math.min(1, frameDeltaMs * 0.0035);
      if (Math.abs(popupPullback - wantPullback) < 0.001) popupPullback = wantPullback;
      const pullbackDelta = popupPullback - previousPullback;
      if (Math.abs(pullbackDelta) > 0.00001) {
        camera.position.setLength(camera.position.length() + pullbackDelta * POPUP_PULLBACK_DISTANCE);
        controls.target.y += pullbackDelta * POPUP_PULLBACK_LIFT;
      }

      // Reconcile every building's group with the latest React state,
      // except the one actively being dragged into place (that one is
      // driven live by updatePlacementPreview instead).
      if (props.placingBuildingId !== lastPlacingId && lastPlacingId) {
        applyGhostTint(lastPlacingId, null);
      }
      lastPlacingId = props.placingBuildingId;

      for (const building of buildings) {
        const group = buildingGroups.get(building.id);
        if (!group) continue;
        if (props.placingBuildingId === building.id) {
          // Driven live by pointermove, but the rotate button can change
          // propsRef.current.placementRotation with no pointer event, so
          // re-apply it here each frame using the last hovered cell.
          if (hoverPreview && hoverPreview.id === building.id) {
            const rotation = props.placementRotation;
            const worldPosition = buildingWorldPosition(building, hoverPreview, rotation);
            group.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
            group.rotation.y = (rotation * Math.PI) / 180;
          }
          continue;
        }

        const saved = props.townLayout[building.id];
        if (!saved || saved.stored) {
          group.visible = false;
          continue;
        }
        group.visible = true;
        const rotation = saved.rotation ?? 0;
        const worldPosition = buildingWorldPosition(building, saved, rotation);
        group.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
        group.rotation.y = (rotation * Math.PI) / 180;
        applyGhostTint(building.id, null);

        if (building.id === "telescope") {
          group.traverse((object) => {
            if (object.userData.variant === "wood") object.visible = !props.telescopeUpgraded;
            if (object.userData.variant === "metal") object.visible = props.telescopeUpgraded;
          });
        }

        const isSelected = props.activeBuildingId === building.id;
        group.scale.setScalar(isSelected ? 1.06 : 1);
      }

      controls.update();
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(step);

    const resizeObserver = new ResizeObserver(() => {
      width = mount.clientWidth || width;
      height = mount.clientHeight || height;
      camera.aspect = width / height;
      frameCamera();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
    // Mount once; all live values flow in through propsRef/callbacksRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="town-canvas" aria-label="Penguin Town, in 3D — drag for a subtle camera move, scroll to zoom, click a labeled building to select it" />;
}
