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

/** A tall, jagged low-poly peak built from a cone with jittered radial verts, plus a paler snow cap. */
function buildMountainPeak(radius: number, height: number, seed: number): THREE.Group {
  const group = new THREE.Group();
  const segments = 7 + Math.floor(seededRandom(seed) * 3);
  const bodyGeometry = new THREE.ConeGeometry(radius, height, segments, 4);
  const positions = bodyGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const jitter = 1 + (seededRandom(seed + i * 3.1) - 0.5) * 0.5;
    const heightFactor = Math.max(0, (y + height / 2) / height);
    positions.setXYZ(i, x * jitter, y + heightFactor * (seededRandom(seed + i * 5.7) - 0.5) * height * 0.18, z * jitter);
  }
  bodyGeometry.computeVertexNormals();
  const rock = new THREE.MeshStandardMaterial({ color: 0x779db0, roughness: 0.95, flatShading: true });
  const body = new THREE.Mesh(bodyGeometry, rock);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const capGeometry = new THREE.ConeGeometry(radius * 0.42, height * 0.4, segments, 2);
  const snow = new THREE.MeshStandardMaterial({ color: 0xf6fbff, roughness: 0.8, flatShading: true });
  const cap = new THREE.Mesh(capGeometry, snow);
  cap.position.y = height * 0.82;
  cap.castShadow = true;
  group.add(cap);
  return group;
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** A ring of 3D mountain peaks at the edge of the playable island, ringing the horizon. */
function buildMountainRange(): THREE.Group {
  const group = new THREE.Group();
  const count = 14;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + seededRandom(i) * 0.3;
    const distance = 39 + seededRandom(i * 2.2) * 14;
    const height = 7 + seededRandom(i * 3.7) * 9;
    const radius = 4 + seededRandom(i * 4.4) * 4;
    const peak = buildMountainPeak(radius, height, i * 7.3);
    peak.position.set(Math.cos(angle) * distance, -1, Math.sin(angle) * distance);
    group.add(peak);
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
  return g;
}

function buildTelescope(upgraded: boolean): THREE.Group {
  const g = new THREE.Group();
  const body = upgraded ? 0x34495d : 0x8b522d;
  const trim = upgraded ? 0xaec6d1 : 0xd5a645;
  cylinder(g, 1.0, 1.12, .28, [0, .14, 0], 0x704121, [0, 0, 0], 18);
  cylinder(g, .72, .82, .9, [0, .65, 0], 0x81502d, [0, 0, 0], 18);
  for (const x of [-.52, .52]) box(g, [.18, 1.35, .24], [x, 1.2, 0], 0x80502e, [0, 0, x * .14]);
  const barrel = new THREE.Group();
  cylinder(barrel, .34, .41, 1.85, [0, 0, 0], body, [0, 0, Math.PI / 2], 18);
  cylinder(barrel, .46, .46, .16, [-.92, 0, 0], trim, [0, 0, Math.PI / 2], 18);
  cylinder(barrel, .39, .39, .1, [.88, 0, 0], trim, [0, 0, Math.PI / 2], 18);
  barrel.position.set(0, 1.72, 0);
  barrel.rotation.z = .35;
  g.add(barrel);
  box(g, [.13, 1.45, .13], [0, 1.12, 0], trim, [0, 0, -.35]);
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
  return g;
}

function buildIgloo(): THREE.Group {
  const g = new THREE.Group();
  const ice = 0xeaf8ff, seam = 0x8fc5dd;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.03, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(ice));
  dome.position.y = 0; dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
  for (const y of [.23, .48, .73]) {
    const radius = Math.sqrt(Math.max(.1, 1.03 * 1.03 - y * y));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .018, 5, 32), mat(seam));
    ring.position.y = y; ring.rotation.x = Math.PI / 2; g.add(ring);
  }
  box(g, [.7, .62, .78], [0, .31, -1.03], ice);
  const doorway = box(g, [.4, .43, .06], [0, .24, -1.44], 0x17364b);
  doorway.position.y = .25;
  for (const x of [-.34, .34]) box(g, [.06, .54, .7], [x, .3, -1.07], seam);
  return g;
}

function buildSweatshop(): THREE.Group {
  const g = new THREE.Group();
  box(g, [1.85, 1.25, 1.45], [0, .63, 0], 0x7c4327);
  box(g, [2.05, .16, 1.35], [0, 1.38, -.45], 0x234f7d, [.55, 0, 0]);
  box(g, [2.05, .16, 1.35], [0, 1.38, .45], 0x234f7d, [-.55, 0, 0]);
  box(g, [.42, .78, .05], [0, .39, -.74], 0x25170f);
  for (const x of [-.65, .65]) box(g, [.36, .35, .05], [x, .8, -.74], 0x66c7e2);
  cylinder(g, .19, .23, 1.42, [.62, 1.88, .32], 0x67564a, [0, 0, 0], 10);
  for (let i = 0; i < 4; i += 1) {
    const puff = sphere(g, .24 + i * .06, [.62 + i * .1, 2.65 + i * .32, .32], 0xd8e0df, [1, .8, 1]);
    puff.userData.smokePhase = i * .8;
    puff.userData.smokeBaseY = puff.position.y;
  }
  for (let i = 0; i < 5; i += 1) box(g, [.42, .42, .42], [-.92 + i * .46, .21, .92], i % 2 ? 0x1b65a2 : 0xa63e32);
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

function buildPenguin(color = 0x273fbd): THREE.Group {
  const g = new THREE.Group();
  sphere(g, .18, [0,.24,0], color, [.85,1.3,.75]);
  sphere(g, .12, [0,.48,0], color);
  sphere(g, .11, [0,.25,-.13], 0xf4f0df, [.75,1.15,.3]);
  box(g, [.1,.035,.16], [-.1,.035,0], 0xff7d2b, [0,.2,0]);
  box(g, [.1,.035,.16], [.1,.035,0], 0xff7d2b, [0,-.2,0]);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.055,.16,4), mat(0xff7d2b)); beak.rotation.x = -Math.PI/2; beak.position.set(0,.48,-.15); g.add(beak);
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
  onSelectBuilding,
  onPlacementPreview,
  onCommitPlacement,
  onPlacementMessage,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation });
  const callbacksRef = useRef({ onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage });

  useEffect(() => {
    propsRef.current = { townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation };
  }, [townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation]);

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
    controls.minDistance = 13;
    controls.maxDistance = 27;
    controls.minPolarAngle = .72;
    controls.maxPolarAngle = 1.18;
    const openingAzimuth = Math.atan2(camera.position.x, camera.position.z);
    controls.minAzimuthAngle = openingAzimuth - .48;
    controls.maxAzimuthAngle = openingAzimuth + .48;
    const frameCamera = () => {
      const compact = width / height < .72;
      camera.fov = compact ? 68 : 42;
      controls.minDistance = compact ? 25 : 13;
      controls.maxDistance = compact ? 42 : 27;
      if (compact && camera.position.length() < 34) camera.position.setLength(36);
      if (!compact && camera.position.length() > 28) camera.position.setLength(26);
      camera.updateProjectionMatrix();
    };
    frameCamera();
    controls.update();

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
    for (const [x,z] of [[-7,-3],[-5,7],[5,5],[7,-1],[-1,7]] as const) {
      const penguin = buildPenguin();
      penguin.position.set(x, ISLAND_HEIGHT + .05, z);
      penguin.rotation.y = seededRandom(x * z + 80) * Math.PI * 2;
      penguin.userData.waddlePhase = seededRandom(x + z + 10) * 10;
      setDressing.add(penguin);
    }
    scene.add(setDressing);

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

    const oceanGeometry = new THREE.PlaneGeometry(140, 140, 48, 48);
    oceanGeometry.rotateX(-Math.PI / 2);
    const oceanBasePositions = oceanGeometry.attributes.position.array.slice();
    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x087aa4,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
      bumpMap: buildNoiseBumpTexture(4242),
      bumpScale: 0.06,
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
      if (hitId) callbacksRef.current.onSelectBuilding(hitId);
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

    function step() {
      raf = requestAnimationFrame(step);
      const elapsed = clock.getElapsedTime();
      const props = propsRef.current;

      setDressing.children.forEach((object) => {
        if (object.userData.waddlePhase === undefined) return;
        object.rotation.z = Math.sin(elapsed * 3 + object.userData.waddlePhase) * .055;
      });

      const sweatshop = buildingGroups.get("sweatshop");
      sweatshop?.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object.userData.smokePhase === undefined) return;
        object.position.y = object.userData.smokeBaseY + Math.sin(elapsed * 1.35 + object.userData.smokePhase) * .06;
      });

      // Ocean ripple: cheap per-vertex sine displacement on a coarse grid.
      const positions = oceanGeometry.attributes.position;
      for (let i = 0; i < positions.count; i += 1) {
        const x = oceanBasePositions[i * 3];
        const z = oceanBasePositions[i * 3 + 2];
        const y = Math.sin(x * 0.35 + elapsed * 1.1) * 0.06 + Math.cos(z * 0.3 + elapsed * 0.8) * 0.06;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
      oceanGeometry.computeVertexNormals();

      gridGroup.visible = Boolean(props.placingBuildingId);

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
