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
};

const CAN_EVENT = "trip-spawn-can";

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
    color: 0xec4ecb,
    emissive: 0x5d064d,
    emissiveIntensity: .72,
    roughness: .38,
    metalness: .08,
    clearcoat: .65,
    clearcoatRoughness: .28,
  });
  const glow = new THREE.MeshBasicMaterial({ color: 0x67ffe8, transparent: true, opacity: .18, blending: THREE.AdditiveBlending });
  const wrinkles: THREE.Mesh[] = [];
  for (let hemisphere = -1; hemisphere <= 1; hemisphere += 2) {
    for (let i = 0; i < 18; i += 1) {
      const points: THREE.Vector3[] = [];
      const baseY = -1.25 + (i % 9) * .31;
      const baseZ = -.68 + Math.floor(i / 9) * 1.18;
      for (let s = 0; s <= 28; s += 1) {
        const t = s / 28;
        const x = hemisphere * (.16 + Math.sin(t * Math.PI) * (1.16 + (i % 3) * .06));
        const y = baseY + t * .24 + Math.sin(t * Math.PI * (3 + i % 4) + i) * .18;
        const z = baseZ + Math.cos(t * Math.PI * (4 + i % 3) + i * .7) * .2;
        points.push(new THREE.Vector3(x, y, z));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 56, .12, 8, false), matter.clone());
      tube.userData.phase = i * .43 + hemisphere;
      tube.userData.baseScale = .92 + (i % 4) * .025;
      tube.castShadow = true;
      wrinkles.push(tube);
      root.add(tube);
    }
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.28, 28, 22), matter);
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
    scene.fog = new THREE.FogExp2(0x13051f, .036);
    const camera = new THREE.PerspectiveCamera(47, 1, .1, 80);
    camera.position.set(0, 1.8, 11.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setClearColor(0x090311);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x35113c, roughness: .82, metalness: .08 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18, 20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    room.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a0a29, roughness: .9, side: THREE.DoubleSide });
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
    for (let i = 0; i < 32; i += 1) {
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(.09 + Math.random() * .16, .6 + Math.random() * 1.7, 5),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x9a36ff : 0x35ffe0, emissive: i % 2 ? 0x3c096d : 0x07594c, emissiveIntensity: .8, roughness: .28 }),
      );
      crystal.position.set(-9 + Math.random() * 18, -2.7, -4.6 + Math.random() * 2.1);
      crystal.rotation.z = (Math.random() - .5) * .35;
      room.add(crystal);
    }

    const brain = makeBrain();
    brain.position.set(4.25, -.05, -.2);
    brain.scale.setScalar(1.34);
    room.add(brain);

    const canTextures = {
      YOOHOO: ["/media/can-labels/yoohoo-yellow.png", "/media/can-labels/yoohoo-bottle.png"].map((url) => {
        const texture = new THREE.TextureLoader().load(url); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; return texture;
      }),
      PEPSI: [canTexture("PEPSI")],
      MONSTER: [canTexture("MONSTER")],
      "RAT MEAT": ["/media/can-labels/rat-meat-classic.jpg", "/media/can-labels/rat-meat-silver.jpg", "/media/can-labels/rat-meat-gold.jpg"].map((url) => {
        const texture = new THREE.TextureLoader().load(url); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; return texture;
      }),
    };
    const cans: CanBody[] = [];
    const pongos: PongoBody[] = [];
    let selectedPongo: PongoBody | null = null;
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
    const spawnPongo = () => {
      const mesh = makeBrainCreature("pongo");
      mesh.position.set((Math.random() - .5) * 2, 4.5, 1.5);
      mesh.rotation.y = Math.PI;
      scene.add(mesh);
      selectedPongo = { mesh, velocity: new THREE.Vector3((Math.random() - .5) * 1.4, 0, 0) };
      pongos.push(selectedPongo);
      if (pongos.length > 5) scene.remove(pongos.shift()!.mesh);
    };
    spawnCan("YOOHOO");
    spawnCan("PEPSI");
    spawnCan("MONSTER");

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let yaw = 0;
    let pitch = 0;
    const onDown = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      yaw += (event.clientX - lastX) * .0045;
      pitch = THREE.MathUtils.clamp(pitch + (event.clientY - lastY) * .003, -.24, .22);
      lastX = event.clientX; lastY = event.clientY;
    };
    const onUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    const onSpawn = (event: Event) => {
      const item = (event as CustomEvent).detail as SpawnItem;
      if (item === "PONGO") spawnPongo(); else spawnCan(item);
    };
    window.addEventListener(CAN_EVENT, onSpawn);
    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
      if (selectedPongo && event.code === "Space" && selectedPongo.mesh.position.y <= -2.98) selectedPongo.velocity.y = 6.4;
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
      camera.position.x += (Math.sin(yaw) * 3.2 - camera.position.x) * .06;
      camera.position.y += (1.8 - pitch * 7 - camera.position.y) * .06;
      camera.position.z += (11.4 - Math.abs(Math.sin(yaw)) * 1.1 - camera.position.z) * .06;
      camera.lookAt(Math.sin(yaw) * 1.2, -.2, -1);
      brain.rotation.y = -.28 + Math.sin(time * .38) * .18;
      brain.position.y = -.05 + Math.sin(time * .72) * .12;
      const wrinkles = brain.userData.wrinkles as THREE.Mesh[];
      wrinkles.forEach((wrinkle, index) => {
        const pulse = wrinkle.userData.baseScale + Math.sin(time * 2.1 + wrinkle.userData.phase) * .055;
        wrinkle.scale.set(pulse, pulse * (1 + Math.sin(time * 2.7 + index) * .035), pulse);
        (wrinkle.material as THREE.MeshPhysicalMaterial).emissiveIntensity = .55 + Math.sin(time * 2 + index) * .18;
      });
      (brain.userData.aura as THREE.Mesh).scale.setScalar(1 + Math.sin(time * 1.5) * .035);
      for (const can of cans) {
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
        const length = Math.hypot(mx, mz) || 1;
        mx /= length; mz /= length;
        pongo.velocity.x += (mx * 3.6 - pongo.velocity.x) * Math.min(1, dt * 8);
        pongo.velocity.z += (mz * 3.6 - pongo.velocity.z) * Math.min(1, dt * 8);
        pongo.velocity.y -= 12 * dt;
        pongo.mesh.position.addScaledVector(pongo.velocity, dt);
        if (pongo.mesh.position.y < -3) { pongo.mesh.position.y = -3; pongo.velocity.y = 0; }
        pongo.mesh.position.x = THREE.MathUtils.clamp(pongo.mesh.position.x, -8.7, 8.7);
        pongo.mesh.position.z = THREE.MathUtils.clamp(pongo.mesh.position.z, -4.2, 5.2);
        const moving = Math.abs(mx) + Math.abs(mz) > .1;
        if (moving) {
          pongo.mesh.rotation.y = Math.atan2(mx, mz);
          pongo.mesh.userData.walk += dt * 8;
          (pongo.mesh.userData.limbs as THREE.Group[]).forEach((limb, index) => { limb.rotation.x = Math.sin(pongo.mesh.userData.walk + index * Math.PI / 2) * .52; });
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener(CAN_EVENT, onSpawn);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.dispose();
      Object.values(canTextures).flat().forEach((texture) => texture.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="home-room-3d" aria-label="Interactive 3D home room. Drag to move the camera." />;
}

export function spawnHomeCan(label: SpawnItem) {
  window.dispatchEvent(new CustomEvent(CAN_EVENT, { detail: label }));
}
