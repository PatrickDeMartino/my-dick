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
  terrainMoveInstruction,
  ISLAND_HEIGHT,
  PLATEAU_HEIGHT,
  TERRAIN_REGIONS,
  type GridPosition,
  type PlacementPreview,
  type TownBuilding,
  type TownLayout,
} from "./townData";

type Props = {
  townLayout: TownLayout;
  telescopeUpgraded: boolean;
  activeBuildingId: string | null;
  placingBuildingId: string | null;
  onSelectBuilding: (id: string) => void;
  onPlacementPreview: (preview: PlacementPreview | null) => void;
  onCommitPlacement: (id: string, position: GridPosition) => void;
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

function buildTerrainSlab(
  points: readonly (readonly [number, number])[],
  depth: number,
  baseY: number,
  capColor: number,
  sideColor: number,
): THREE.Mesh {
  const shape = shapeFromPercentPolygon(points);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 2 });
  geometry.rotateX(-Math.PI / 2);
  const sideMaterial = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.95, metalness: 0.02 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.82, metalness: 0.02 });
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
  onSelectBuilding,
  onPlacementPreview,
  onCommitPlacement,
  onPlacementMessage,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId });
  propsRef.current = { townLayout, telescopeUpgraded, activeBuildingId, placingBuildingId };

  const callbacksRef = useRef({ onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage });
  callbacksRef.current = { onSelectBuilding, onPlacementPreview, onCommitPlacement, onPlacementMessage };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a2c);
    scene.fog = new THREE.FogExp2(0x0a1a2c, 0.016);

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

    const oceanGeometry = new THREE.PlaneGeometry(140, 140, 48, 48);
    oceanGeometry.rotateX(-Math.PI / 2);
    const oceanBasePositions = oceanGeometry.attributes.position.array.slice();
    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f5c8c,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
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
      const position = gridPositionFromWorld(building, hit.x, hit.z);
      const issue = placementIssue(building, position, propsRef.current.townLayout);
      hoverPreview = { id: placingId, ...position, valid: !issue };

      const worldPosition = buildingWorldPosition(building, position);
      group.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      group.visible = true;
      applyGhostTint(placingId, issue ? "invalid" : "valid");
      callbacksRef.current.onPlacementPreview(hoverPreview);
      callbacksRef.current.onPlacementMessage(issue ?? terrainMoveInstruction(building.terrain));
    }

    let pointerDownAt: { x: number; y: number; time: number } | null = null;

    function onPointerDown(event: PointerEvent) {
      pointerDownAt = { x: event.clientX, y: event.clientY, time: performance.now() };
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
          callbacksRef.current.onCommitPlacement(placingId, { column: hoverPreview.column, row: hoverPreview.row });
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
    window.addEventListener("pointerup", onPointerUp);

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
        if (props.placingBuildingId === building.id) continue; // driven by pointermove

        const saved = props.townLayout[building.id];
        if (!saved || saved.stored) {
          group.visible = false;
          continue;
        }
        group.visible = true;
        const worldPosition = buildingWorldPosition(building, saved);
        group.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
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
      window.removeEventListener("pointerup", onPointerUp);
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
