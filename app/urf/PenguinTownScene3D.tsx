"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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

// A fixed, muted palette so placeholder buildings read as distinct volumes
// (and as clearly-not-final) until each one gets a Blender model.
const PLACEHOLDER_COLORS: Record<string, number> = {
  plane: 0x6fa8c9,
  telescope: 0xb9a1d8,
  magic: 0xe0778f,
  igloo: 0xdfeaf2,
  sweatshop: 0xc98f52,
  docks: 0x8a5a3a,
  arena: 0x9a4f4f,
};
const WORLD_CELL = 0.95;
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
  const rock = new THREE.MeshStandardMaterial({ color: 0x3d4b57, roughness: 0.95, flatShading: true });
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
  const count = 16;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + seededRandom(i) * 0.3;
    const distance = 30 + seededRandom(i * 2.2) * 14;
    const height = 9 + seededRandom(i * 3.7) * 14;
    const radius = 4 + seededRandom(i * 4.4) * 5;
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
  propsRef.current = { townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId, placementRotation };

  const callbacksRef = useRef({ onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage });
  callbacksRef.current = { onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe6f2);
    scene.fog = new THREE.FogExp2(0xbfe6f2, 0.0075);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
    const islandTop = ISLAND_HEIGHT + PLATEAU_HEIGHT * 0.4;
    camera.position.set(15, 15, 15);

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
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 34;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.update();

    scene.add(new THREE.HemisphereLight(0x9fd3ea, 0x0a1420, 1.0));
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
      color: 0x0f5c8c,
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
    const loader = new GLTFLoader();

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

      const worldWidth = building.footprint.width * WORLD_CELL;
      const worldDepth = building.footprint.height * WORLD_CELL;
      const placeholderHeight = 1.1 + Math.max(building.footprint.width, building.footprint.height) * 0.18;
      const placeholderGeometry = new THREE.BoxGeometry(worldWidth * 0.86, placeholderHeight, worldDepth * 0.86);
      const placeholderMaterial = new THREE.MeshStandardMaterial({
        color: PLACEHOLDER_COLORS[building.id] ?? 0x9fb7c4,
        roughness: 0.7,
        metalness: 0.05,
      });
      const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
      placeholder.position.y = placeholderHeight / 2;
      placeholder.castShadow = true;
      placeholder.receiveShadow = true;
      placeholder.userData.buildingId = building.id;
      group.add(placeholder);

      scene.add(group);
      buildingGroups.set(building.id, group);
      ghostStates.set(building.id, captureGhostState(group));

      if (building.model) {
        loader.load(
          building.model,
          (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const scale = size.y > 0.0001 ? Math.min(worldWidth, worldDepth, placeholderHeight * 1.8) / Math.max(size.x, size.y, size.z) : 1;
            model.scale.setScalar(scale);
            const scaledBox = new THREE.Box3().setFromObject(model);
            model.position.y -= scaledBox.min.y;
            model.traverse((object) => {
              if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                object.userData.buildingId = building.id;
              }
            });
            group.remove(placeholder);
            group.add(model);
            ghostStates.set(building.id, captureGhostState(group));
          },
          undefined,
          (error) => {
            console.error(`Penguin Town: failed to load model for "${building.id}"`, error);
          },
        );
      }
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
    let clock = new THREE.Clock();

    function step() {
      raf = requestAnimationFrame(step);
      const elapsed = clock.getElapsedTime();
      const props = propsRef.current;

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
      camera.updateProjectionMatrix();
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

  return <div ref={mountRef} className="town-canvas" aria-label="Penguin Town, in 3D — drag to orbit, scroll to zoom, click a building to select it" />;
}
