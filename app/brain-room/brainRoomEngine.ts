/// <reference types="vite/client" />
import type * as THREE_NS from "three";

/**
 * The Brain Room — a real 3D interior built from the same physically-based
 * "wet brain tissue" material Dr. Bongo's exposed cybernetic brain uses
 * (canvas-painted fold/vessel diffuse + a fine bump-noise layer, on a
 * MeshPhysicalMaterial with clearcoat + sheen for that glistening look),
 * scaled up to room-sized walls and floor. A big window on the far wall
 * looks out onto an open field; walking a character through it drops them
 * into that outdoor space.
 */

export type CharacterId = "bongo" | "rat" | "alien" | "penguin";

export type BrainRoomEvents = {
  onEvent: (text: string) => void;
  onZone: (zone: "window" | "beanbag" | "portal" | null) => void;
};

export type BrainRoomHandle = {
  setCharacter: (id: CharacterId) => void;
  setMove: (x: number, y: number) => void;
  interact: () => void;
  setSize: (width: number, height: number) => void;
  dispose: () => void;
  /** QA-only introspection, mirroring the __controlsTest pattern used by the
   * Urf 3D room. Not for gameplay use. */
  debug: () => {
    x: number;
    z: number;
    facing: number;
    mode: string;
    camera: [number, number, number];
    move: { x: number; y: number };
  };
};

const ROOM_WIDTH = 12;
const ROOM_DEPTH = 10;
const ROOM_HEIGHT = 6.2;
const WALK_SPEED = 3.1;

const WINDOW_HALF_WIDTH = 2.6;
const WINDOW_BOTTOM = 1.4;
const WINDOW_TOP = 4.6;
const WINDOW_Z = -ROOM_DEPTH / 2;

const FIELD_SIZE = 60;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The fold/vessel-painted diffuse texture that gives brain tissue its
 * characteristic winding grooves, glistening ridge highlights, and thin
 * vessel streaks — painted at room scale so walking up to a wall still
 * reads as organic tissue rather than a flat tint. */
function buildBrainDiffuseTexture(THREE: typeof THREE_NS): THREE_NS.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#cf7f92");
  base.addColorStop(1, "#b85870");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Domain-warped sine field, thresholded into groove / ridge bands — the
  // same idea as the fine bump noise Bongo's brain uses, but at a much
  // larger period so it reads as big winding gyri across a whole wall.
  const image = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const warpX = x + Math.sin(y * 0.045) * 26;
      const warpY = y + Math.cos(x * 0.05) * 22;
      const fold = Math.sin(warpX * 0.052 + Math.sin(warpY * 0.02) * 3.1)
        + Math.cos(warpY * 0.047 + Math.sin(warpX * 0.021) * 2.6);
      const index = (y * size + x) * 4;
      if (fold < -0.72) {
        // Deep groove (sulcus): dark maroon.
        const t = clamp((-fold - 0.72) * 1.6, 0, 1);
        image.data[index] = 92 - t * 30;
        image.data[index + 1] = 18 - t * 8;
        image.data[index + 2] = 38 - t * 12;
      } else if (fold > 0.85) {
        // Ridge crest catching the light: warm cream-pink highlight.
        const t = clamp((fold - 0.85) * 2.2, 0, 1);
        image.data[index] = Math.min(255, image.data[index] + t * 70);
        image.data[index + 1] = Math.min(255, image.data[index + 1] + t * 48);
        image.data[index + 2] = Math.min(255, image.data[index + 2] + t * 46);
      }
    }
  }
  ctx.putImageData(image, 0, 0);

  // Thin vessel streaks — soft curved strokes in a deeper red.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#8a1030";
  ctx.lineCap = "round";
  const vesselRandom = (n: number) => {
    const v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };
  for (let i = 0; i < 26; i += 1) {
    ctx.lineWidth = 1.2 + vesselRandom(i) * 2.2;
    ctx.beginPath();
    let x = vesselRandom(i * 3.1) * size;
    let y = vesselRandom(i * 7.7) * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s += 1) {
      x += (vesselRandom(i * 13 + s) - 0.5) * 140;
      y += (vesselRandom(i * 29 + s) - 0.5) * 140;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Fine wet-tissue grain.
  const grain = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < grain.data.length; i += 4) {
    const noise = (vesselRandom(i * 0.618) - 0.5) * 14;
    grain.data[i] = clamp(grain.data[i] + noise, 0, 255);
    grain.data[i + 1] = clamp(grain.data[i + 1] + noise * 0.7, 0, 255);
    grain.data[i + 2] = clamp(grain.data[i + 2] + noise * 0.7, 0, 255);
  }
  ctx.putImageData(grain, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Fine-grained bump detail — the same technique as Bongo's exposed brain,
 * tiled at a high repeat for micro surface detail under direct light. */
function buildBrainBumpTexture(THREE: typeof THREE_NS): THREE_NS.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const waves = Math.sin(x * 0.31 + Math.sin(y * 0.13) * 3.2) * 32
        + Math.cos(y * 0.27 + Math.sin(x * 0.11) * 2.4) * 24;
      const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const value = clamp(142 + waves + (grain - Math.floor(grain) - 0.5) * 24, 40, 225);
      const pixel = (y * size + x) * 4;
      image.data[pixel] = value;
      image.data[pixel + 1] = value;
      image.data[pixel + 2] = value;
      image.data[pixel + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function buildBrainMaterial(
  THREE: typeof THREE_NS,
  diffuse: THREE_NS.CanvasTexture,
  bump: THREE_NS.CanvasTexture,
  repeatX: number,
  repeatY: number,
): THREE_NS.MeshPhysicalMaterial {
  const map = diffuse.clone();
  map.needsUpdate = true;
  map.repeat.set(repeatX, repeatY);
  const bumpMap = bump.clone();
  bumpMap.needsUpdate = true;
  bumpMap.repeat.set(repeatX * 3, repeatY * 3);
  return new THREE.MeshPhysicalMaterial({
    map,
    bumpMap,
    bumpScale: 0.05,
    roughness: 0.62,
    clearcoat: 0.3,
    clearcoatRoughness: 0.42,
    sheen: 0.32,
    sheenColor: new THREE.Color(0xffaebb),
    side: THREE.DoubleSide,
  });
}

/** A tapered capsule-ish limb segment, matching the low-poly rig style used
 * for the Urf archer, so every character on the site shares one silhouette
 * language. */
function bone(THREE: typeof THREE_NS, length: number, top: number, bottom: number, material: THREE_NS.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, length, 6), material);
  mesh.position.y = -length / 2;
  return mesh;
}

function buildBongo(THREE: typeof THREE_NS): THREE_NS.Group {
  const furMat = new THREE.MeshStandardMaterial({ color: 0xb9541e, roughness: 0.96 });
  const furLight = new THREE.MeshStandardMaterial({ color: 0xd2762f, roughness: 0.92 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xad7658, roughness: 0.82 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x120d09, roughness: 0.16 });

  const group = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), furMat);
  torso.scale.set(1.1, 1.2, 0.95);
  torso.position.y = 0.68;
  group.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), furLight);
  belly.position.set(0, 0.55, 0.24);
  group.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), furMat);
  head.position.y = 1.12;
  group.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), skin);
  face.position.set(0, 1.08, 0.16);
  face.scale.set(1, 0.9, 0.7);
  group.add(face);
  [-1, 1].forEach((side) => {
    const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eye);
    eyeMesh.position.set(side * 0.06, 1.11, 0.24);
    group.add(eyeMesh);
  });

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.32, 0.92, 0);
    shoulder.rotation.z = side * 0.3;
    group.add(shoulder);
    shoulder.add(bone(THREE, 0.5, 0.09, 0.07, furMat));
    const forearm = new THREE.Group();
    forearm.position.y = -0.5;
    forearm.rotation.x = 0.3;
    shoulder.add(forearm);
    forearm.add(bone(THREE, 0.42, 0.07, 0.06, furMat));
  });

  [-1, 1].forEach((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.14, 0.42, 0);
    group.add(hip);
    hip.add(bone(THREE, 0.42, 0.1, 0.08, furMat));
  });

  return group;
}

function buildLabRat(THREE: typeof THREE_NS): THREE_NS.Group {
  const white = new THREE.MeshStandardMaterial({ color: 0xf2ece2, roughness: 0.7 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf0a8b6, roughness: 0.55 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.2 });

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), white);
  body.scale.set(1, 0.82, 1.5);
  body.position.y = 0.18;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), white);
  head.position.set(0, 0.2, 0.22);
  group.add(head);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 8), pink);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.17, 0.32);
  group.add(snout);

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), pink);
    ear.position.set(side * 0.08, 0.28, 0.2);
    ear.rotation.y = side * 0.6;
    group.add(ear);
    const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), eye);
    eyeMesh.position.set(side * 0.06, 0.22, 0.28);
    group.add(eyeMesh);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.006, 0.4, 5), pink);
  tail.rotation.x = Math.PI / 2.2;
  tail.position.set(0, 0.13, -0.32);
  group.add(tail);

  return group;
}

function buildAlienScout(THREE: typeof THREE_NS): THREE_NS.Group {
  const skin = new THREE.MeshStandardMaterial({ color: 0x7fd93f, flatShading: true, roughness: 0.62 });
  const band = new THREE.MeshStandardMaterial({ color: 0x7a3fc9, flatShading: true, roughness: 0.5 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x0a0610, roughness: 0.12 });

  const group = new THREE.Group();
  const legs = new THREE.Group();
  group.add(legs);
  [-1, 1].forEach((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.05, 0.5, 0);
    legs.add(hip);
    hip.add(bone(THREE, 0.5, 0.055, 0.046, skin));
  });

  const torso = new THREE.Group();
  torso.position.y = 0.5;
  group.add(torso);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.078, 0.25, 6), skin);
  chest.position.y = 0.2;
  torso.add(chest);
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.04, 6), band);
  waist.position.y = 0.07;
  torso.add(waist);

  const head = new THREE.Group();
  head.position.y = 0.36;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), skin);
  skull.scale.set(1.05, 1.34, 1.16);
  skull.position.y = 0.12;
  head.add(skull);
  [-1, 1].forEach((side) => {
    const almond = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 1), eye);
    almond.scale.set(0.95, 1.28, 0.72);
    almond.position.set(side * 0.055, 0.115, 0.1);
    head.add(almond);
  });

  return group;
}

function buildPenguinCharacter(THREE: typeof THREE_NS): THREE_NS.Group {
  const black = new THREE.MeshStandardMaterial({ color: 0x1c2430, roughness: 0.6 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f0df, roughness: 0.55 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xff7d2b, roughness: 0.5 });

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), black);
  body.scale.set(0.85, 1.3, 0.75);
  body.position.y = 0.24;
  group.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), white);
  belly.scale.set(0.75, 1.15, 0.3);
  belly.position.set(0, 0.25, -0.13);
  group.add(belly);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), black);
  head.position.y = 0.48;
  group.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), orange);
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 0.48, -0.15);
  group.add(beak);
  [-1, 1].forEach((side) => {
    const flipper = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), black);
    flipper.scale.set(0.34, 0.95, 0.55);
    flipper.position.set(side * 0.19, 0.27, 0.01);
    flipper.rotation.z = side * 0.3;
    group.add(flipper);
  });
  return group;
}

function buildBeanbag(THREE: typeof THREE_NS): THREE_NS.Group {
  const fabric = new THREE.MeshStandardMaterial({ color: 0x6a2c52, roughness: 0.92 });
  const seam = new THREE.MeshStandardMaterial({ color: 0x4a1c38, roughness: 0.95 });
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), fabric);
  body.scale.set(1, 0.62, 1);
  body.position.y = 0.5;
  group.add(body);
  for (let i = 0; i < 5; i += 1) {
    const fold = new THREE.Mesh(new THREE.TorusGeometry(0.78 - i * 0.14, 0.02, 6, 20), seam);
    fold.rotation.x = Math.PI / 2;
    fold.position.y = 0.18 + i * 0.06;
    group.add(fold);
  }
  return group;
}

/** Simple low-poly cow — boxy body, cylinder legs, a horned head, and a
 * patchy black/white hide painted straight onto the body material. */
function buildCow(THREE: typeof THREE_NS): THREE_NS.Group {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#2a2622";
  const patchAt = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.72, 0.4, 0, Math.PI * 2);
    ctx.fill();
  };
  patchAt(30, 30, 26);
  patchAt(95, 45, 30);
  patchAt(60, 95, 28);
  patchAt(15, 100, 20);
  const hideTexture = new THREE.CanvasTexture(canvas);
  hideTexture.colorSpace = THREE.SRGBColorSpace;

  const hide = new THREE.MeshStandardMaterial({ map: hideTexture, roughness: 0.85 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xe8b3ad, roughness: 0.7 });
  const horn = new THREE.MeshStandardMaterial({ color: 0xd8cfa8, roughness: 0.4 });

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 1.5), hide);
  body.position.y = 0.72;
  group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.46), hide);
  head.position.set(0, 0.78, 0.88);
  group.add(head);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.16), pink);
  snout.position.set(0, 0.65, 1.1);
  group.add(snout);
  [-1, 1].forEach((side) => {
    const hornMesh = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), horn);
    hornMesh.position.set(side * 0.16, 1.02, 0.82);
    hornMesh.rotation.z = side * 0.3;
    group.add(hornMesh);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.2), hide);
    ear.position.set(side * 0.24, 0.86, 0.72);
    group.add(ear);
  });
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.68, 8), hide);
      leg.position.set(sx * 0.32, 0.34, sz * 0.55);
      group.add(leg);
    }),
  );
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.5, 5), hide);
  tail.rotation.x = 0.3;
  tail.position.set(0, 0.75, -0.78);
  group.add(tail);
  return group;
}

export async function createBrainRoom(
  canvas: HTMLCanvasElement,
  events: BrainRoomEvents,
): Promise<BrainRoomHandle | null> {
  // Generation guard: dev-mode double-invoke (this framework's dev server
  // fires it more than the usual two times) can call this function several
  // times for the same canvas before an earlier instance's React-driven
  // cleanup ever runs. Each renderer attaches to the same underlying WebGL
  // context regardless (a canvas only ever has one), so without this every
  // instance's camera and animation loop silently fight over the same
  // frame — which looked, from outside, like player movement doing nothing.
  // Claiming happens in call order, so the naive "first claim wins" version
  // of this guard actually locked out the real final mount in favor of a
  // throwaway early one. Instead, each call stakes a new, always-increasing
  // generation; whichever instance is currently running notices on its very
  // next tick that a newer generation has taken over and quietly stops
  // itself, so the most recently created instance always ends up the sole
  // survivor within about one frame.
  const generation = (Number(canvas.dataset.brainRoomGeneration) || 0) + 1;
  canvas.dataset.brainRoomGeneration = String(generation);
  const isCurrent = () => Number(canvas.dataset.brainRoomGeneration) === generation;

  const THREE = await import("three");

  let renderer: THREE_NS.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 200);

  // ---------------------------------------------------------- interior --
  const interior = new THREE.Group();
  scene.add(interior);

  scene.add(new THREE.AmbientLight(0xffdce8, 0.32));
  const warmKey = new THREE.PointLight(0xffb488, 1.6, 14, 2);
  warmKey.position.set(-2, 4.4, 1);
  interior.add(warmKey);
  const coolFill = new THREE.PointLight(0x8fd8ff, 0.9, 14, 2);
  coolFill.position.set(3, 3, -2);
  interior.add(coolFill);

  const brainDiffuse = buildBrainDiffuseTexture(THREE);
  const brainBump = buildBrainBumpTexture(THREE);
  const wallMat = buildBrainMaterial(THREE, brainDiffuse, brainBump, 2.4, 1.4);
  const floorMat = buildBrainMaterial(THREE, brainDiffuse, brainBump, 3, 3);
  const ceilingMat = buildBrainMaterial(THREE, brainDiffuse, brainBump, 2.4, 2);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), floorMat);
  floor.rotation.x = -Math.PI / 2;
  interior.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_HEIGHT;
  interior.add(ceiling);

  const sideWallGeo = new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT);
  const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  interior.add(leftWall);
  const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  interior.add(rightWall);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMat);
  backWall.position.set(0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2);
  backWall.rotation.y = Math.PI;
  interior.add(backWall);

  // Front wall (holds the big window) built as four trim panels around a
  // rectangular opening rather than one solid plane.
  const frontY = ROOM_HEIGHT / 2;
  const frontLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH / 2 - WINDOW_HALF_WIDTH, ROOM_HEIGHT),
    wallMat,
  );
  frontLeft.position.set(-(WINDOW_HALF_WIDTH + (ROOM_WIDTH / 2 - WINDOW_HALF_WIDTH) / 2), frontY, WINDOW_Z);
  interior.add(frontLeft);
  const frontRight = frontLeft.clone();
  frontRight.position.set(WINDOW_HALF_WIDTH + (ROOM_WIDTH / 2 - WINDOW_HALF_WIDTH) / 2, frontY, WINDOW_Z);
  interior.add(frontRight);
  const frontTop = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW_HALF_WIDTH * 2, ROOM_HEIGHT - WINDOW_TOP), wallMat);
  frontTop.position.set(0, WINDOW_TOP + (ROOM_HEIGHT - WINDOW_TOP) / 2, WINDOW_Z);
  interior.add(frontTop);
  const frontBottom = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW_HALF_WIDTH * 2, WINDOW_BOTTOM), wallMat);
  frontBottom.position.set(0, WINDOW_BOTTOM / 2, WINDOW_Z);
  interior.add(frontBottom);

  // Window frame trim.
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.7, metalness: 0.1 });
  const trimThickness = 0.14;
  const frameH = new THREE.Mesh(new THREE.BoxGeometry(WINDOW_HALF_WIDTH * 2 + trimThickness * 2, trimThickness, trimThickness), trimMat);
  frameH.position.set(0, WINDOW_TOP, WINDOW_Z);
  interior.add(frameH);
  const frameH2 = frameH.clone();
  frameH2.position.y = WINDOW_BOTTOM;
  interior.add(frameH2);
  const frameV = new THREE.Mesh(new THREE.BoxGeometry(trimThickness, WINDOW_TOP - WINDOW_BOTTOM, trimThickness), trimMat);
  frameV.position.set(-WINDOW_HALF_WIDTH, (WINDOW_TOP + WINDOW_BOTTOM) / 2, WINDOW_Z);
  interior.add(frameV);
  const frameV2 = frameV.clone();
  frameV2.position.x = WINDOW_HALF_WIDTH;
  interior.add(frameV2);

  // Sky preview seen through the window before jumping.
  const skyPreview = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD_SIZE, FIELD_SIZE),
    new THREE.MeshBasicMaterial({ color: 0x8fd6ff }),
  );
  skyPreview.position.set(0, ROOM_HEIGHT / 2, WINDOW_Z - 6);
  interior.add(skyPreview);

  const beanbag = buildBeanbag(THREE);
  beanbag.position.set(ROOM_WIDTH / 2 - 1.6, 0, ROOM_DEPTH / 2 - 1.6);
  interior.add(beanbag);

  // Ambient (non-player) characters standing around the room.
  const ambientBuilders: Record<CharacterId, (t: typeof THREE_NS) => THREE_NS.Group> = {
    bongo: buildBongo,
    rat: buildLabRat,
    alien: buildAlienScout,
    penguin: buildPenguinCharacter,
  };
  const spawnSpots: Record<CharacterId, [number, number]> = {
    bongo: [-3, 1.5],
    rat: [-1, -2.5],
    alien: [2.5, 2],
    penguin: [3.5, -1.5],
  };
  const ambientCharacters: { id: CharacterId; group: THREE_NS.Group; bobSeed: number }[] = [];
  (Object.keys(ambientBuilders) as CharacterId[]).forEach((id, index) => {
    const group = ambientBuilders[id](THREE);
    const [x, z] = spawnSpots[id];
    group.position.set(x, 0, z);
    interior.add(group);
    ambientCharacters.push({ id, group, bobSeed: index * 1.7 });
  });

  // The player-controlled character is a second instance layered on top of
  // (and hiding) whichever ambient character matches the active id.
  let activeId: CharacterId = "bongo";
  const playerGroup = new THREE.Group();
  interior.add(playerGroup);
  const rebuildPlayerModel = () => {
    while (playerGroup.children.length) playerGroup.remove(playerGroup.children[0]);
    playerGroup.add(ambientBuilders[activeId](THREE));
    ambientCharacters.forEach((entry) => {
      entry.group.visible = entry.id !== activeId;
    });
  };
  rebuildPlayerModel();
  const player = { x: 0, z: 2, facing: 0 };
  playerGroup.position.set(player.x, 0, player.z);

  // ---------------------------------------------------------- exterior --
  const exterior = new THREE.Group();
  exterior.visible = false;
  scene.add(exterior);

  scene.background = new THREE.Color(0x8fd6ff);
  const sun = new THREE.DirectionalLight(0xfff3d8, 1.6);
  sun.position.set(-6, 10, 4);
  exterior.add(sun);
  exterior.add(new THREE.AmbientLight(0xdfefff, 0.55));

  const grassCanvas = document.createElement("canvas");
  grassCanvas.width = 128;
  grassCanvas.height = 128;
  const grassCtx = grassCanvas.getContext("2d")!;
  grassCtx.fillStyle = "#5fae4a";
  grassCtx.fillRect(0, 0, 128, 128);
  grassCtx.fillStyle = "#4f9a3d";
  for (let i = 0; i < 220; i += 1) {
    const rx = Math.sin(i * 12.9898) * 43758.5453;
    const ry = Math.sin(i * 78.233) * 12345.678;
    grassCtx.fillRect((rx - Math.floor(rx)) * 128, (ry - Math.floor(ry)) * 128, 2, 2);
  }
  const grassTexture = new THREE.CanvasTexture(grassCanvas);
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(14, 14);
  grassTexture.colorSpace = THREE.SRGBColorSpace;
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD_SIZE, FIELD_SIZE),
    new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.95 }),
  );
  field.rotation.x = -Math.PI / 2;
  exterior.add(field);

  const cowSpots: [number, number][] = [[4, -6], [-6, -3], [7, 3], [-3, 8], [2, -12]];
  cowSpots.forEach(([x, z]) => {
    const cow = buildCow(THREE);
    cow.position.set(x, 0, z);
    cow.rotation.y = Math.random() * Math.PI * 2;
    exterior.add(cow);
  });

  // A glowing return portal back to the brain room.
  const portalMat = new THREE.MeshStandardMaterial({
    color: 0xff7ad4,
    emissive: 0xff2a9d,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.8,
  });
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1, 0.14, 12, 28), portalMat);
  portal.position.set(0, 1.4, 4);
  exterior.add(portal);

  const exteriorPlayerGroup = new THREE.Group();
  exterior.add(exteriorPlayerGroup);
  const exteriorPlayer = { x: 0, z: 6, facing: 0 };

  // -------------------------------------------------------------- state --
  let mode: "interior" | "falling" | "exterior" = "interior";
  let fallProgress = 0;
  const move = { x: 0, y: 0 };
  let size = canvas.clientWidth || 640;
  let sizeHeight = canvas.clientHeight || 480;
  let disposed = false;
  let currentZone: "window" | "beanbag" | "portal" | null = null;

  const applySize = () => {
    renderer.setSize(size, sizeHeight, false);
    camera.aspect = size / Math.max(sizeHeight, 1);
    camera.updateProjectionMatrix();
  };
  applySize();

  const clampToRoom = (x: number, z: number): [number, number] => [
    clamp(x, -ROOM_WIDTH / 2 + 0.5, ROOM_WIDTH / 2 - 0.5),
    clamp(z, -ROOM_DEPTH / 2 + 0.5, ROOM_DEPTH / 2 - 0.5),
  ];

  const startFall = () => {
    mode = "falling";
    fallProgress = 0;
    events.onEvent("YOU LEAP THROUGH THE WINDOW");
  };

  const enterExterior = () => {
    mode = "exterior";
    interior.visible = false;
    exterior.visible = true;
    while (exteriorPlayerGroup.children.length) exteriorPlayerGroup.remove(exteriorPlayerGroup.children[0]);
    exteriorPlayerGroup.add(ambientBuilders[activeId](THREE));
    exteriorPlayer.x = 0;
    exteriorPlayer.z = -2;
    exteriorPlayerGroup.position.set(exteriorPlayer.x, 0, exteriorPlayer.z);
    events.onEvent("YOU LAND IN THE FIELD");
  };

  const returnInside = () => {
    mode = "interior";
    interior.visible = true;
    exterior.visible = false;
    player.x = 0;
    player.z = ROOM_DEPTH / 2 - 1.4;
    playerGroup.position.set(player.x, 0, player.z);
    events.onEvent("BACK IN THE BRAIN ROOM");
  };

  let elapsed = 0;
  let previous = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    if (disposed) return;
    if (!isCurrent()) {
      // A newer instance has taken over this canvas — stop rendering and
      // free the WebGL context rather than continuing to fight over it.
      disposed = true;
      renderer.dispose();
      return;
    }
    frame = requestAnimationFrame(tick);
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += delta;

    ambientCharacters.forEach((entry) => {
      entry.group.position.y = Math.sin(elapsed * 1.6 + entry.bobSeed) * 0.03 + 0.02;
      entry.group.rotation.y = Math.sin(elapsed * 0.4 + entry.bobSeed) * 0.3;
    });

    if (mode === "interior") {
      const speed = WALK_SPEED * delta;
      const dx = move.x * speed;
      const dz = -move.y * speed;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        player.facing = Math.atan2(dx, dz);
        playerGroup.rotation.y = player.facing;
      }
      const [nx, nz] = clampToRoom(player.x + dx, player.z + dz);
      player.x = nx;
      player.z = nz;
      playerGroup.position.set(player.x, 0, player.z);
      playerGroup.position.y = Math.sin(elapsed * 6) * (Math.hypot(dx, dz) > 0 ? 0.03 : 0);

      const nearWindow = player.z < -ROOM_DEPTH / 2 + 1.2 && Math.abs(player.x) < WINDOW_HALF_WIDTH - 0.3;
      const nearBeanbag = Math.hypot(player.x - beanbag.position.x, player.z - beanbag.position.z) < 1.1;
      const zone = nearWindow ? "window" : nearBeanbag ? "beanbag" : null;
      if (zone !== currentZone) {
        currentZone = zone;
        events.onZone(zone);
      }

      const camTarget = new THREE.Vector3(player.x, 1.6, player.z + 3.4);
      camera.position.lerp(camTarget, Math.min(1, delta * 4));
      camera.lookAt(player.x, 1.1, player.z - 1.5);
    } else if (mode === "falling") {
      fallProgress += delta;
      const t = Math.min(1, fallProgress / 1.1);
      camera.position.set(0, 2.2 - t * 1.4, WINDOW_Z - 2 - t * 4);
      camera.lookAt(0, 1 - t * 1.5, WINDOW_Z - 8);
      if (t >= 1) enterExterior();
    } else {
      const speed = WALK_SPEED * 1.3 * delta;
      const dx = move.x * speed;
      const dz = -move.y * speed;
      if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
        exteriorPlayer.facing = Math.atan2(dx, dz);
        exteriorPlayerGroup.rotation.y = exteriorPlayer.facing;
      }
      exteriorPlayer.x = clamp(exteriorPlayer.x + dx, -FIELD_SIZE / 2 + 2, FIELD_SIZE / 2 - 2);
      exteriorPlayer.z = clamp(exteriorPlayer.z + dz, -FIELD_SIZE / 2 + 2, FIELD_SIZE / 2 - 2);
      exteriorPlayerGroup.position.set(exteriorPlayer.x, 0, exteriorPlayer.z);

      portal.rotation.z += delta * 0.6;
      const nearPortal = Math.hypot(exteriorPlayer.x - portal.position.x, exteriorPlayer.z - portal.position.z) < 1.3;
      const zone = nearPortal ? "portal" : null;
      if (zone !== currentZone) {
        currentZone = zone;
        events.onZone(zone);
      }

      const camTarget = new THREE.Vector3(exteriorPlayer.x, 2.4, exteriorPlayer.z + 5);
      camera.position.lerp(camTarget, Math.min(1, delta * 4));
      camera.lookAt(exteriorPlayer.x, 1, exteriorPlayer.z - 2);
    }

    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);

  return {
    setCharacter: (id) => {
      activeId = id;
      rebuildPlayerModel();
      if (mode === "exterior") {
        while (exteriorPlayerGroup.children.length) exteriorPlayerGroup.remove(exteriorPlayerGroup.children[0]);
        exteriorPlayerGroup.add(ambientBuilders[activeId](THREE));
      }
    },
    setMove: (x, y) => {
      move.x = clamp(x, -1, 1);
      move.y = clamp(y, -1, 1);
    },
    interact: () => {
      if (mode === "interior" && currentZone === "window") startFall();
      else if (mode === "exterior" && currentZone === "portal") returnInside();
    },
    setSize: (width, height) => {
      size = width;
      sizeHeight = height;
      applySize();
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer.dispose();
      // Only clear the generation marker if nothing newer has already
      // claimed the canvas — otherwise this stale dispose (e.g. React
      // calling an old effect's cleanup late) would erase a live instance's
      // claim and let some future call re-attach without evicting it.
      if (isCurrent()) delete canvas.dataset.brainRoomGeneration;
    },
    debug: () => ({
      x: player.x,
      z: player.z,
      facing: player.facing,
      mode,
      camera: camera.position.toArray() as [number, number, number],
      move: { ...move },
    }),
  };
}
