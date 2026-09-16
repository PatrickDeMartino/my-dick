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

export function buildBongo(THREE: typeof THREE_NS): THREE_NS.Group {
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

export function buildLabRat(THREE: typeof THREE_NS): THREE_NS.Group {
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

export function buildAlienScout(THREE: typeof THREE_NS): THREE_NS.Group {
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

export function buildPenguinCharacter(THREE: typeof THREE_NS): THREE_NS.Group {
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

export function buildBeanbag(THREE: typeof THREE_NS): THREE_NS.Group {
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
export function buildCow(THREE: typeof THREE_NS): THREE_NS.Group {
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

/** A small pink pig — round body, flat disc snout, curly wire tail. */
export function buildPig(THREE: typeof THREE_NS): THREE_NS.Group {
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0acb0, roughness: 0.7 });
  const snoutMat = new THREE.MeshStandardMaterial({ color: 0xe38a91, roughness: 0.6 });
  const hoof = new THREE.MeshStandardMaterial({ color: 0x4a3a3a, roughness: 0.6 });

  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), skin);
  body.scale.set(1, 0.82, 1.25);
  body.position.y = 0.5;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), skin);
  head.position.set(0, 0.55, 0.55);
  group.add(head);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), snoutMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.5, 0.76);
  group.add(snout);
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 6), skin);
    ear.position.set(side * 0.13, 0.72, 0.55);
    ear.rotation.z = side * 0.5;
    ear.rotation.x = -0.3;
    group.add(ear);
  });
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 8), skin);
      leg.position.set(sx * 0.24, 0.16, sz * 0.38);
      group.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 8), hoof);
      foot.position.set(sx * 0.24, 0.01, sz * 0.38);
      group.add(foot);
    }),
  );
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 10, Math.PI * 1.5), skin);
  tail.position.set(0, 0.6, -0.62);
  tail.rotation.y = Math.PI / 2;
  group.add(tail);
  return group;
}

/** A woolly sheep — a cluster of puffy spheres for the fleece over a black
 * face and legs, so it reads distinctly from the cow/pig's smooth hides. */
export function buildSheep(THREE: typeof THREE_NS): THREE_NS.Group {
  const wool = new THREE.MeshStandardMaterial({ color: 0xf5f2e8, roughness: 0.98 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.7 });

  const group = new THREE.Group();
  const puffSpots: [number, number, number, number][] = [
    [0, 0.58, 0, 0.3], [-0.22, 0.55, 0.15, 0.22], [0.22, 0.55, 0.15, 0.22],
    [-0.2, 0.55, -0.25, 0.22], [0.2, 0.55, -0.25, 0.22], [0, 0.68, -0.1, 0.24],
    [0, 0.5, 0.35, 0.2],
  ];
  puffSpots.forEach(([x, y, z, r]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), wool);
    puff.position.set(x, y, z);
    group.add(puff);
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), dark);
  head.position.set(0, 0.56, 0.52);
  head.scale.set(0.85, 0.9, 1);
  group.add(head);
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), dark);
    ear.scale.set(1.6, 0.6, 0.8);
    ear.position.set(side * 0.16, 0.58, 0.42);
    group.add(ear);
  });
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8), dark);
      leg.position.set(sx * 0.2, 0.18, sz * 0.32);
      group.add(leg);
    }),
  );
  return group;
}

