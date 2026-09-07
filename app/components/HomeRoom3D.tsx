"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeBrainCreature } from "../brain-room/BrainWorld3D";

type CanLabel = "YOOHOO" | "PEPSI" | "MONSTER" | "RAT MEAT";
type SpawnItem = CanLabel | "PONGO";

type CanBody = {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  radius: number;
};

type PongoBody = {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  swing: { vine: JungleVine; angle: number; angularVelocity: number } | null;
};

type JungleVine = {
  mesh: THREE.Mesh;
  anchor: THREE.Vector3;
  length: number;
  phase: number;
};

const CAN_EVENT = "trip-spawn-can";
const SPATIAL_EVENT = "trip-home-spatial";

function canTexture(label: CanLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const colors = label === "YOOHOO" ? ["#3b180b", "#fff0bb"] : label === "PEPSI" ? ["#164cc7", "#e51d39"] : label === "RAT MEAT" ? ["#4a4136", "#c6b28c"] : ["#070b08", "#74ff29"];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(.48, colors[1]);
  gradient.addColorStop(1, colors[0]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = label === "MONSTER" ? "#86ff39" : "#fff";
  ctx.font = "900 64px Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 10;
  if (label === "MONSTER") {
    ctx.font = "900 116px Impact, sans-serif";
    ctx.fillText("M", 256, 120);
    ctx.font = "900 28px Arial Black, sans-serif";
    ctx.fillText("MONSTER ENERGY", 256, 210);
  } else ctx.fillText(label, 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function makeBrain() {
  const root = new THREE.Group();
  const matter = new THREE.MeshPhysicalMaterial({
    color: 0xe45ac6,
    emissive: 0x4e073f,
    emissiveIntensity: .46,
    roughness: .5,
    metalness: .02,
    clearcoat: .48,
    clearcoatRoughness: .42,
  });
  const sulcus = new THREE.MeshStandardMaterial({ color: 0x74105f, emissive: 0x26031f, emissiveIntensity: .3, roughness: .72 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x67ffe8, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false });
  const wrinkles: THREE.Mesh[] = [];

  // Two softly overlapping hemispheres make the silhouette read as a brain
  // before the animated gyri are added.
  for (let hemisphere = -1; hemisphere <= 1; hemisphere += 2) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(1.2, 44, 32), matter.clone());
    lobe.position.x = hemisphere * .5;
    lobe.scale.set(.82, 1.12, .86);
    lobe.castShadow = true;
    root.add(lobe);
    for (let i = 0; i < 22; i += 1) {
      const points: THREE.Vector3[] = [];
      const latitude = -1.12 + (i % 11) * .225;
      const band = Math.floor(i / 11);
      for (let s = 0; s <= 34; s += 1) {
        const t = s / 34;
        const y = latitude + Math.sin(t * Math.PI * (3 + i % 3) + i * .73) * .105;
        const z = -.82 + t * 1.64 + Math.sin(t * Math.PI * (4 + i % 4) + i) * .13;
        const shell = Math.sqrt(Math.max(.04, 1 - (y * y) / 1.55 - (z * z) / 1.02));
        const x = hemisphere * (.48 + shell * .53) + Math.sin(t * Math.PI * 5 + i) * .045;
        points.push(new THREE.Vector3(x, y, z));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, .055 + band * .008, 8, false), sulcus.clone());
      tube.userData.phase = i * .43 + hemisphere;
      tube.userData.baseScale = .985 + (i % 3) * .006;
      tube.castShadow = true;
      wrinkles.push(tube);
      root.add(tube);
    }
  }
  const fissure = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.18, -.72), new THREE.Vector3(.015, .6, -.94),
    new THREE.Vector3(-.02, 0, -1.02), new THREE.Vector3(.02, -.62, -.88),
    new THREE.Vector3(0, -1.15, -.55),
  ]), 48, .075, 9, false), sulcus);
  root.add(fissure);
  const cerebellum = new THREE.Mesh(new THREE.SphereGeometry(.66, 30, 22), matter.clone());
  cerebellum.position.set(0, -.9, .48);
  cerebellum.scale.set(1.18, .56, .72);
  root.add(cerebellum);
  const stem = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .6, 8, 14), matter.clone());
  stem.position.set(.08, -1.43, .38);
  stem.rotation.z = -.15;
  root.add(stem);
  const hitMaterial = new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.28, 28, 22), hitMaterial);
  core.scale.set(1.12, 1.04, .82);
  core.castShadow = true;
  root.add(core);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.48, 24, 18), glow);
  aura.scale.set(1.13, 1.03, .82);
  root.add(aura);
  root.rotation.z = -.08;
  root.userData.wrinkles = wrinkles;
  root.userData.aura = aura;
  return root;
}

function makeCrystalCluster(index: number) {
  const group = new THREE.Group();
  const hue = (index * .137 + .48) % 1;
  for (let shard = 0; shard < 3 + (index % 3); shard += 1) {
    const color = new THREE.Color().setHSL((hue + shard * .075) % 1, .92, .62);
    const material = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color.clone().multiplyScalar(.25),
      emissiveIntensity: .65,
      roughness: .06,
      metalness: .08,
      transmission: .72,
      thickness: .5,
      transparent: true,
      opacity: .84,
      clearcoat: 1,
      clearcoatRoughness: .08,
      ior: 1.72,
      side: THREE.DoubleSide,
    });
    const height = .72 + ((index * 17 + shard * 11) % 13) * .1;
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(.16 + shard * .025, height, 6), material);
    crystal.position.set((shard - 1.5) * .16, height * .5, (shard % 2) * .13);
    crystal.rotation.z = (shard - 1.5) * .12;
    crystal.rotation.y = shard * 1.7;
    crystal.castShadow = true;
    group.add(crystal);
  }
  const glow = new THREE.PointLight(new THREE.Color().setHSL(hue, .95, .65), 3.2, 3.5, 1.8);
  glow.position.y = .42;
  group.add(glow);
  return group;
}

function makeJungleTree(index: number) {
  const tree = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: index % 2 ? 0x3e2518 : 0x56301d, roughness: .95 });
  const leafColors = [0x0b4e2b, 0x116f38, 0x188c47, 0x2aa95a];
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColors[index % leafColors.length], roughness: .78, side: THREE.DoubleSide });
  const height = 5.8 + (index % 3) * .65;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .42, height, 10), bark);
  trunk.position.y = height * .5;
  trunk.rotation.z = (index % 2 ? 1 : -1) * .045;
  trunk.castShadow = true;
  tree.add(trunk);
  for (let crown = 0; crown < 3; crown += 1) {
    const hub = new THREE.Vector3((crown - 1) * .28, height - .2 + crown * .25, 0);
    for (let leaf = 0; leaf < 9; leaf += 1) {
      const blade = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), leafMat.clone());
      const angle = leaf / 9 * Math.PI * 2 + crown * .7;
      blade.position.copy(hub).add(new THREE.Vector3(Math.cos(angle) * 1.15, Math.sin(angle * 2) * .22, Math.sin(angle) * .85));
      blade.scale.set(1.2, .16, .42);
      blade.rotation.set(Math.sin(angle) * .35, -angle, Math.cos(angle) * .22);
      blade.castShadow = true;
      tree.add(blade);
    }
  }
  return tree;
}

function aimVine(vine: JungleVine, end: THREE.Vector3) {
  const direction = end.clone().sub(vine.anchor);
  const length = direction.length();
  vine.mesh.position.copy(vine.anchor).add(end).multiplyScalar(.5);
  vine.mesh.scale.set(1, length, 1);
  vine.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function makeCan(label: CanLabel, texture: THREE.Texture, metalColor = 0xc7cbd3) {
  const group = new THREE.Group();
  const side = new THREE.MeshStandardMaterial({ map: texture, metalness: .5, roughness: .34 });
  const silver = new THREE.MeshStandardMaterial({ color: metalColor, metalness: .9, roughness: .22 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .82, 28, 1, false), [side, silver, silver]);
  body.castShadow = true;
  group.add(body);
  for (const y of [-.42, .42]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.245, .025, 7, 28), silver);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    group.add(rim);
  }
  group.userData.label = label;
  return group;
}

export default function HomeRoom3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07180f, .03);
    const camera = new THREE.PerspectiveCamera(47, 1, .1, 80);
    camera.position.set(0, 2.4, 12.6);
    camera.lookAt(0, -.15, -1.25);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setClearColor(0x03100a);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x8feeff, 0x310517, 1.5));
    const key = new THREE.PointLight(0xff54dc, 42, 24, 1.4);
    key.position.set(4, 6, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.PointLight(0x54ffd9, 26, 20, 1.3);
    fill.position.set(-6, 2, 3);
    scene.add(fill);

    const room = new THREE.Group();
    scene.add(room);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x142d1b, roughness: .96, metalness: .02 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18, 20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    room.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x082015, roughness: .96, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(24, 14, 12, 8), wallMat);
    back.position.set(0, 3, -5);
    back.receiveShadow = true;
    room.add(back);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), wallMat.clone());
      wall.position.set(side * 10, 3, 2);
      wall.rotation.y = side * -Math.PI / 2;
      room.add(wall);
    });
    const crystals: THREE.Group[] = [];
    for (let i = 0; i < 18; i += 1) {
      const cluster = makeCrystalCluster(i);
      cluster.position.set(-8.8 + (i % 9) * 2.15, -3, -4.4 + Math.floor(i / 9) * 1.22);
      cluster.rotation.y = i * .83;
      cluster.scale.setScalar(.7 + (i % 4) * .12);
      crystals.push(cluster);
      room.add(cluster);
    }

    // The former wall squiggles are now a layered tropical canopy.
    const jungle = new THREE.Group();
    const treePositions: [number, number, number][] = [
      [-8.6, -3, -4.45], [-6.5, -3, -4.65], [-4.3, -3, -4.7], [-1.9, -3, -4.72],
      [1, -3, -4.72], [3.8, -3, -4.7], [6.4, -3, -4.65], [8.6, -3, -4.45],
      [-9.15, -3, -.9], [9.15, -3, -.7],
    ];
    treePositions.forEach((position, index) => {
      const tree = makeJungleTree(index);
      tree.position.set(...position);
      tree.scale.setScalar(.82 + (index % 3) * .09);
      jungle.add(tree);
    });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x07552c, roughness: .82 });
    for (let i = 0; i < 24; i += 1) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.82 + (i % 4) * .12, 1), canopyMat.clone());
      (crown.material as THREE.MeshStandardMaterial).color.offsetHSL((i % 5) * .012, 0, (i % 3) * .025);
      crown.position.set(-10 + (i % 12) * 1.8, 5.4 + (i % 4) * .34, -4.6 + Math.floor(i / 12) * 1.2);
      crown.scale.set(1.45, .72, 1.05);
      crown.castShadow = true;
      jungle.add(crown);
    }
    room.add(jungle);

    const vineMaterial = new THREE.MeshPhysicalMaterial({ color: 0x123e1e, roughness: .68, clearcoat: .28 });
    const vines: JungleVine[] = [-6.2, -3.3, -.2, 3.05, 6.25].map((x, index) => {
      const length = 4.1 + (index % 3) * .42;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.055, .075, 1, 10), vineMaterial.clone());
      mesh.castShadow = true;
      const vine = { mesh, anchor: new THREE.Vector3(x, 5.8 + (index % 2) * .22, -2.15 - (index % 3) * .55), length, phase: index * 1.37 };
      aimVine(vine, vine.anchor.clone().add(new THREE.Vector3(0, -length, 0)));
      room.add(mesh);
      return vine;
    });

    const brain = makeBrain();
    brain.position.set(4.25, -.05, -.2);
    brain.scale.setScalar(1.34);
    room.add(brain);
    let brainSpatial={x:0,y:0,z:0,scale:1};

    const canTextures = {
      YOOHOO: ["/media/can-labels/yoohoo-yellow.png", "/media/can-labels/yoohoo-bottle.png"].map((url) => {
        const texture = new THREE.TextureLoader().load(url); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; return texture;
      }),
      PEPSI: ["/media/can-labels/pepsi.png"].map((url)=>{const texture=new THREE.TextureLoader().load(url);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;return texture;}),
      MONSTER: ["/media/can-labels/monster-energy.png"].map((url)=>{const texture=new THREE.TextureLoader().load(url);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;return texture;}),
      "RAT MEAT": ["/media/can-labels/rat-meat-classic.jpg", "/media/can-labels/rat-meat-silver.jpg", "/media/can-labels/rat-meat-gold.jpg"].map((url) => {
        const texture = new THREE.TextureLoader().load(url); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; return texture;
      }),
    };
    const cans: CanBody[] = [];
    const pongos: PongoBody[] = [];
    let selectedPongo: PongoBody | null = null;
    let pongoMode = false;
    let heldCan: CanBody | null = null;
    let heldTime = 0;
    const keys = new Set<string>();
    const spawnCan = (label: CanLabel) => {
      let texture = canTextures[label][Math.floor(Math.random() * canTextures[label].length)];
      let metal = 0xc7cbd3;
      if (label === "RAT MEAT") {
        const rarity = Math.random();
        const index = rarity < .1 ? 2 : rarity < .3 ? 1 : 0;
        texture = canTextures[label][index];
        metal = index === 2 ? 0xd7a82e : index === 1 ? 0xd7d9df : 0xa9a9a4;
      }
      const mesh = makeCan(label, texture, metal);
      mesh.position.set((Math.random() - .5) * 2, 4.2, 1.2 + Math.random());
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      scene.add(mesh);
      cans.push({ mesh, velocity: new THREE.Vector3((Math.random() - .5) * 2.6, 1 + Math.random() * 1.7, (Math.random() - .5) * 1.8), spin: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5), radius: .47 });
      if (cans.length > 28) scene.remove(cans.shift()!.mesh);
    };
    const spawnPongo = (activate = true) => {
      const mesh = makeBrainCreature("pongo");
      mesh.position.set((Math.random() - .5) * 2, 4.5, 1.5);
      mesh.rotation.y = Math.PI;
      scene.add(mesh);
      const pongo: PongoBody = { mesh, velocity: new THREE.Vector3((Math.random() - .5) * 1.4, 0, 0), swing: null };
      pongos.push(pongo);
      if (activate) { selectedPongo = pongo; pongoMode = true; }
      if (pongos.length > 5) scene.remove(pongos.shift()!.mesh);
    };
    spawnCan("YOOHOO");
    spawnCan("PEPSI");
    spawnCan("MONSTER");
    spawnPongo(false);

    const raycaster=new THREE.Raycaster();
    const pointer=new THREE.Vector2();
    const onUp = (event:PointerEvent) => {
      const rect=renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(pointer,camera);
      if(raycaster.intersectObject(brain,true).length)window.location.assign("/brain-room");
    };
    renderer.domElement.addEventListener("pointerup", onUp);
    const onSpawn = (event: Event) => {
      const item = (event as CustomEvent).detail as SpawnItem;
      if (item === "PONGO") {
        if (pongos.length === 0) spawnPongo(true);
        else { pongoMode = !pongoMode; selectedPongo = pongoMode ? pongos[pongos.length - 1] : null; }
      } else spawnCan(item);
    };
    window.addEventListener(CAN_EVENT, onSpawn);
    const onSpatial=(event:Event)=>{const detail=(event as CustomEvent<{target:"brain";value:{x:number;y:number;z:number;scale:number}}>).detail;if(detail.target==="brain")brainSpatial={...detail.value};};
    window.addEventListener(SPATIAL_EVENT,onSpatial);
    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
      if (selectedPongo && event.code === "Space" && !event.repeat) {
        if (selectedPongo.swing) {
          const { vine, angle, angularVelocity } = selectedPongo.swing;
          selectedPongo.velocity.set(angularVelocity * vine.length * Math.cos(angle), angularVelocity * vine.length * Math.sin(angle), 0);
          selectedPongo.swing = null;
        } else {
          const shoulder = selectedPongo.mesh.position.clone().add(new THREE.Vector3(0, 2.25, 0));
          const nearest = vines.map(vine=>({vine,distance:shoulder.distanceTo(vine.anchor.clone().add(new THREE.Vector3(0,-vine.length,0)))})).sort((a,b)=>a.distance-b.distance)[0];
          if (nearest && nearest.distance < 2.2) {
            selectedPongo.swing = { vine: nearest.vine, angle: (selectedPongo.mesh.position.x-nearest.vine.anchor.x)/nearest.vine.length, angularVelocity: selectedPongo.velocity.x/nearest.vine.length };
          } else if (selectedPongo.mesh.position.y <= -2.98) selectedPongo.velocity.y = 6.4;
        }
      }
      if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), .033);
      const time = clock.elapsedTime;
      brain.rotation.y = -.28 + Math.sin(time * .38) * .18;
      brain.position.set(4.25+brainSpatial.x*1.45,-.05+brainSpatial.y*1.15+Math.sin(time*.72)*.12,-.2+brainSpatial.z*1.2);
      brain.scale.setScalar(1.34*brainSpatial.scale);
      const wrinkles = brain.userData.wrinkles as THREE.Mesh[];
      wrinkles.forEach((wrinkle, index) => {
        const pulse = wrinkle.userData.baseScale + Math.sin(time * 2.1 + wrinkle.userData.phase) * .055;
        wrinkle.scale.set(pulse, pulse * (1 + Math.sin(time * 2.7 + index) * .035), pulse);
        (wrinkle.material as THREE.MeshStandardMaterial).emissiveIntensity = .28 + Math.sin(time * 2 + index) * .08;
      });
      (brain.userData.aura as THREE.Mesh).scale.setScalar(1 + Math.sin(time * 1.5) * .035);
      crystals.forEach((cluster,index)=>{cluster.rotation.y+=dt*(index%2?.08:-.06);});
      vines.forEach(vine=>{
        const swinger=pongos.find(pongo=>pongo.swing?.vine===vine);
        if(!swinger) aimVine(vine,vine.anchor.clone().add(new THREE.Vector3(Math.sin(time*.65+vine.phase)*.13,-vine.length,Math.cos(time*.54+vine.phase)*.08)));
      });
      for (const can of cans) {
        if(can===heldCan)continue;
        can.velocity.y -= 8.5 * dt;
        can.mesh.position.addScaledVector(can.velocity, dt);
        can.mesh.rotation.x += can.spin.x * dt;
        can.mesh.rotation.y += can.spin.y * dt;
        can.mesh.rotation.z += can.spin.z * dt;
        if (can.mesh.position.y < -3 + can.radius) {
          can.mesh.position.y = -3 + can.radius;
          can.velocity.y = Math.abs(can.velocity.y) * .48;
          can.velocity.x *= .82; can.velocity.z *= .82; can.spin.multiplyScalar(.9);
        }
        if (Math.abs(can.mesh.position.x) > 9.5) { can.mesh.position.x = Math.sign(can.mesh.position.x) * 9.5; can.velocity.x *= -.55; }
        if (can.mesh.position.z < -4.6 || can.mesh.position.z > 6) { can.mesh.position.z = THREE.MathUtils.clamp(can.mesh.position.z, -4.6, 6); can.velocity.z *= -.55; }
      }
      for (const pongo of pongos) {
        let mx = 0, mz = 0;
        if (pongo === selectedPongo) {
          if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
          if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
          if (keys.has("KeyW") || keys.has("ArrowUp")) mz -= 1;
          if (keys.has("KeyS") || keys.has("ArrowDown")) mz += 1;
        }
        const movementLength = Math.hypot(mx, mz) || 1;
        mx /= movementLength; mz /= movementLength;
        if (pongo.swing) {
          pongo.swing.angularVelocity += (-9.8 / pongo.swing.vine.length * Math.sin(pongo.swing.angle) + mx * 1.05) * dt;
          pongo.swing.angularVelocity *= Math.max(0, 1-dt*.075);
          pongo.swing.angle = THREE.MathUtils.clamp(pongo.swing.angle + pongo.swing.angularVelocity * dt, -1.16, 1.16);
          const hand = pongo.swing.vine.anchor.clone().add(new THREE.Vector3(Math.sin(pongo.swing.angle)*pongo.swing.vine.length,-Math.cos(pongo.swing.angle)*pongo.swing.vine.length,mz*.35));
          pongo.mesh.position.copy(hand).add(new THREE.Vector3(0,-2.15,0));
          pongo.mesh.rotation.z = -pongo.swing.angle * .28;
          (pongo.mesh.userData.limbs as THREE.Group[]).slice(0,4).forEach(limb=>limb.rotation.x=Math.PI*.78);
          aimVine(pongo.swing.vine,hand);
        } else {
          pongo.mesh.rotation.z += (0-pongo.mesh.rotation.z)*.15;
          pongo.velocity.x += (mx * 3.6 - pongo.velocity.x) * Math.min(1, dt * 8);
          pongo.velocity.z += (mz * 3.6 - pongo.velocity.z) * Math.min(1, dt * 8);
          pongo.velocity.y -= 12 * dt;
          pongo.mesh.position.addScaledVector(pongo.velocity, dt);
        }
        if (pongo.mesh.position.y < -3) { pongo.mesh.position.y = -3; pongo.velocity.y = 0; }
        pongo.mesh.position.x = THREE.MathUtils.clamp(pongo.mesh.position.x, -8.7, 8.7);
        pongo.mesh.position.z = THREE.MathUtils.clamp(pongo.mesh.position.z, -4.2, 5.2);
        const moving = Math.abs(mx) + Math.abs(mz) > .1;
        if (moving && !pongo.swing) {
          pongo.mesh.rotation.y = Math.atan2(mx, mz);
          pongo.mesh.userData.walk += dt * 8;
          (pongo.mesh.userData.limbs as THREE.Group[]).forEach((limb, index) => { limb.rotation.x = Math.sin(pongo.mesh.userData.walk + index * Math.PI / 2) * .52; });
        }
        if(pongo===selectedPongo){
          if(!heldCan){heldCan=cans.find(can=>can.mesh.position.distanceTo(pongo.mesh.position)<1.35)??null;heldTime=0;}
          if(heldCan){heldTime+=dt;const forward=new THREE.Vector3(Math.sin(pongo.mesh.rotation.y),0,Math.cos(pongo.mesh.rotation.y));const handTarget=pongo.mesh.position.clone().add(forward.clone().multiplyScalar(.55)).add(new THREE.Vector3(0,1.55,0));heldCan.mesh.position.lerp(handTarget,.3);heldCan.mesh.rotation.z+=dt*8;if(heldTime>.72){heldCan.velocity.copy(forward.multiplyScalar(9)).add(new THREE.Vector3(0,5.4,0));heldCan.spin.set(8,5,9);heldCan=null;heldTime=0;}}
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener(CAN_EVENT, onSpawn);
      window.removeEventListener(SPATIAL_EVENT,onSpatial);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.dispose();
      Object.values(canTextures).flat().forEach((texture) => texture.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="home-room-3d" aria-label="Interactive 3D jungle brain room with a stationary camera. Use Pongo mode to explore and swing from vines." />;
}

export function spawnHomeCan(label: SpawnItem) {
  window.dispatchEvent(new CustomEvent(CAN_EVENT, { detail: label }));
}

export function setHomeSpatial(target:"brain",value:{x:number;y:number;z:number;scale:number}){
  window.dispatchEvent(new CustomEvent(SPATIAL_EVENT,{detail:{target,value}}));
}
