import * as THREE from "three";

// Shared "bold cartoon outline" helper (inverted-hull technique) — a slightly-enlarged,
// backface-only, flat-color duplicate mesh parented onto whatever it outlines. Used by
// alien.ts (per-character palette) and, per the user's "expand outlines to everything"
// direction, weapons/pickups/mushrooms/props too. See alien.ts's addOutline for the
// original single-mesh version this generalizes; kept here so every file can share one
// implementation instead of copy-pasting it.
export function addOutlineMesh(mesh: THREE.Mesh, color: number, scale = 1.06) {
  const outline = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }));
  outline.scale.setScalar(scale);
  mesh.add(outline);
  return outline;
}

// Outlines every mesh in a subtree — for props/weapons/decorations built from several
// small primitives where there's no single "silhouette" shape to pick out (unlike the
// alien rig, which only outlines its 4 main body shapes). Skips meshes flagged
// noOutline (transparent/glowy bits an inverted hull would look wrong on).
export function addOutlineToTree(root: THREE.Object3D, color: number, scale = 1.06) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && !o.userData.noOutline) meshes.push(o);
  });
  for (const m of meshes) addOutlineMesh(m, color, scale);
}

// The palette this whole pass draws from — dark purple/blue/red linework, per the
// "neon trippy psychedelic pop art cartoonish" art direction.
export const OUTLINE_PURPLE = 0x2a0848;
export const OUTLINE_BLUE = 0x0a1a4a;
export const OUTLINE_RED = 0x4a0818;
