import * as THREE from 'three';
const mat=(color:number,roughness=.78,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness,flatShading:true});
export function seededRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function buildNoiseBumpTexture(seed: number): THREE.CanvasTexture {
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

export function box(group: THREE.Group, size: [number, number, number], position: [number, number, number], color: number, rotation: [number, number, number] = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function cylinder(group: THREE.Group, radiusTop: number, radiusBottom: number, height: number, position: [number, number, number], color: number, rotation: [number, number, number] = [0, 0, 0], segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function sphere(group: THREE.Group, radius: number, position: [number, number, number], color: number, scale: [number, number, number] = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), mat(color));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function beamBetween(group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, radius: number, color: number) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);
  const mesh = cylinder(group, radius, radius, length, [midpoint.x, midpoint.y, midpoint.z], color, [0, 0, 0], 8);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  return mesh;
}

export function makeLabel(text: string, accent: string): THREE.Sprite {
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

export function makeStripeTexture(colors: string[]): THREE.CanvasTexture {
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

export function buildIceBrickTexture(): THREE.CanvasTexture {
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

export function buildPlankTexture(colorA: string, colorB: string): THREE.CanvasTexture {
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

export function buildBunting(group: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, count: number, colors: number[]) {
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

export function buildPlane(): THREE.Group {
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

export function buildRivetTexture(base: string, rivet: string): THREE.CanvasTexture {
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

export function buildTelescope(upgraded: boolean): THREE.Group {
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

export function buildCircus(): THREE.Group {
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

export function buildIgloo(): THREE.Group {
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

export function buildSweatshop(): THREE.Group {
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

export function buildBoat(): THREE.Group {
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

export function buildArena(): THREE.Group {
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

export function buildBuildingModel(id: string, telescopeUpgraded: boolean): THREE.Group {
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

export function buildPenguin(color = 0x273fbd): THREE.Group {
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