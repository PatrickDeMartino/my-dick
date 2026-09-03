"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./israel.css";

const YOOHOO_STORAGE_KEY = "trip.yoohoo.v1";
const YOOHOO_BALANCE_EVENT = "trip-yoohoo-balance-changed";

function posterTexture(title: string, subtitle: string, image: HTMLImageElement, palette: [string, string]) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1050;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 800, 1050);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(1, palette[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 1050);
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.fillRect(34, 34, 732, 982);
  ctx.drawImage(image, 67, 78, 666, 560);
  ctx.fillStyle = palette[0];
  ctx.font = "900 58px Arial";
  ctx.textAlign = "center";
  const words = title.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = `${line} ${word}`.trim();
    if (ctx.measureText(test).width > 650 && line) { lines.push(line); line = word; } else line = test;
  }
  lines.push(line);
  lines.forEach((text, index) => ctx.fillText(text, 400, 715 + index * 66));
  ctx.fillStyle = palette[1];
  ctx.font = "800 32px Arial";
  ctx.fillText(subtitle, 400, 940);
  ctx.font = "52px Arial";
  ctx.fillText("♥  ♥  ♥", 400, 995);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeCan(texture: THREE.Texture, x: number, y: number, z: number, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.userData.collectible = true;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(.22, .22, .72, 32),
    new THREE.MeshStandardMaterial({ map: texture, metalness: .28, roughness: .42 })
  );
  body.rotation.y = Math.PI * .08;
  group.add(body);
  const silver = new THREE.MeshStandardMaterial({ color: 0xd9e2e8, metalness: .9, roughness: .18 });
  for (const py of [-.37, .37]) {
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(.225, .225, .025, 32), silver);
    lid.position.y = py;
    group.add(lid);
  }
  return group;
}

export default function IsraelRoom() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("DRAG TO LOOK · SCROLL TO ZOOM · WASD TO MOVE");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050718);
    scene.fog = new THREE.Fog(0x050718, 8, 22);
    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, .1, 80);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xa8dfff, 0x27142e, 2.2);
    scene.add(hemi);
    const key = new THREE.PointLight(0xffd357, 34, 20, 1.4);
    key.position.set(-3, 4.2, 2.8);
    key.castShadow = true;
    scene.add(key);
    const blue = new THREE.PointLight(0x277dff, 42, 18, 1.6);
    blue.position.set(4.5, 2.7, -2.5);
    scene.add(blue);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x174d9b, roughness: .7, metalness: .15, wireframe: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(14, 20, 0xf8d34a, 0x2c78d8);
    grid.position.y = .012;
    scene.add(grid);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f5ff, roughness: .76, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMaterial);
    back.position.set(0, 3, -5);
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMaterial.clone());
    left.position.set(-7, 3, 0);
    left.rotation.y = Math.PI / 2;
    scene.add(left);
    const right = left.clone();
    right.position.x = 7;
    right.rotation.y = -Math.PI / 2;
    scene.add(right);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0xbedbff, roughness: .8, side: THREE.DoubleSide }));
    ceiling.position.y = 6;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const loader = new THREE.TextureLoader();
    const yoohooTexture = loader.load("/israel-room/yoohoo-can.jpg");
    yoohooTexture.colorSpace = THREE.SRGBColorSpace;
    yoohooTexture.wrapS = THREE.RepeatWrapping;
    const loadPortrait = (src: string) => new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    });
    Promise.all([
      loadPortrait("/israel-room/netanyahu-1.jpg"),
      loadPortrait("/israel-room/netanyahu-2.jpg"),
    ]).then(([portraitOne, portraitTwo]) => {
      const posters: Array<[THREE.Texture, number, number, number, number]> = [
        [posterTexture("PRIME MINISTER OF MY HEART", "BENJAMIN NETANYAHU", portraitOne, ["#1253bd", "#ff4ca8"]), -3.4, 3.25, -4.92, 0],
        [posterTexture("BB NEON-YOO-HOO IS A CUTIE PATOOTIE", "YOO-HOO FOREVER", portraitTwo, ["#5b20c9", "#ff276d"]), 3.4, 3.25, -4.92, 0],
      ];
      posters.forEach(([map, x, y, z, ry]) => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.48, 3.25, .14), new THREE.MeshStandardMaterial({ color: 0xf5cf49, metalness: .72, roughness: .24 }));
        frame.position.set(x, y, z);
        frame.rotation.y = ry;
        scene.add(frame);
        const art = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 3), new THREE.MeshBasicMaterial({ map }));
        art.position.set(x, y, z + .08);
        scene.add(art);
      });

      const faceMap = new THREE.Texture(portraitTwo);
      faceMap.needsUpdate = true;
      faceMap.colorSpace = THREE.SRGBColorSpace;
      const statue = new THREE.Group();
      statue.position.set(0, 0, -1.15);
      const stone = new THREE.MeshStandardMaterial({ color: 0xe8d9ba, roughness: .54, metalness: .12 });
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.1, .72, 1.55), new THREE.MeshStandardMaterial({ color: 0xe5bb54, metalness: .35, roughness: .5 }));
      pedestal.position.y = .36;
      pedestal.castShadow = true;
      statue.add(pedestal);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.82, 1.25, 8, 18), stone);
      torso.position.y = 1.72;
      torso.scale.z = .58;
      torso.castShadow = true;
      statue.add(torso);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.28, .42), [stone, stone, stone, stone, new THREE.MeshBasicMaterial({ map: faceMap }), stone]);
      head.position.set(0, 3.1, .08);
      statue.add(head);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, 1.45, 18), stone);
      arm.position.set(.82, 2.05, .42);
      arm.rotation.z = -.72;
      arm.rotation.x = .35;
      statue.add(arm);
      const heldCan = makeCan(yoohooTexture, 1.26, 2.55, .75, .82);
      heldCan.userData.collectible = false;
      statue.add(heldCan);
      const straw = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .92, 10), new THREE.MeshStandardMaterial({ color: 0xff426f }));
      straw.position.set(.95, 2.94, .58);
      straw.rotation.z = -.55;
      statue.add(straw);
      const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.6, .34, .05), new THREE.MeshStandardMaterial({ color: 0x151b43, metalness: .5 }));
      plaque.position.set(0, .38, .79);
      statue.add(plaque);
      scene.add(statue);
    });

    const cans = [
      makeCan(yoohooTexture, -4.7, .38, .8, 1),
      makeCan(yoohooTexture, -2.5, .38, 2.1, .92),
      makeCan(yoohooTexture, 2.7, .38, 1.5, 1.08),
      makeCan(yoohooTexture, 4.8, .38, -.2, .9),
      makeCan(yoohooTexture, .1, .38, 2.7, 1.02),
    ];
    cans.forEach((can, index) => { can.userData.canIndex = index; scene.add(can); });

    const heartGeometry = new THREE.TorusKnotGeometry(.16, .055, 70, 10, 2, 3);
    for (let i = 0; i < 16; i++) {
      const heart = new THREE.Mesh(heartGeometry, new THREE.MeshStandardMaterial({ color: i % 2 ? 0xff3d86 : 0xffcf48, emissive: i % 2 ? 0x7a123c : 0x7a5b08, emissiveIntensity: 1.2 }));
      heart.position.set(-5.8 + (i % 8) * 1.68, 5.15 + Math.sin(i) * .24, -4.7);
      heart.scale.set(.8, .8, .35);
      scene.add(heart);
    }

    let yaw = 0;
    let pitch = -.04;
    let distance = 8.3;
    const target = new THREE.Vector3(0, 2.25, -1.15);
    const drag = { active: false, moved: false, x: 0, y: 0 };
    const updateCamera = () => {
      camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * distance, target.y + Math.sin(pitch) * distance, target.z + Math.cos(yaw) * Math.cos(pitch) * distance);
      camera.lookAt(target);
    };
    updateCamera();
    const move = (forward: number, sideways: number) => {
      target.x = THREE.MathUtils.clamp(target.x + Math.cos(yaw) * sideways + Math.sin(yaw) * forward, -4.5, 4.5);
      target.z = THREE.MathUtils.clamp(target.z - Math.cos(yaw) * forward + Math.sin(yaw) * sideways, -3.8, 2.8);
      updateCamera();
    };
    const onDown = (event: PointerEvent) => { drag.active = true; drag.moved = false; drag.x = event.clientX; drag.y = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
    const onMove = (event: PointerEvent) => { if (!drag.active) return; const dx = event.clientX - drag.x; const dy = event.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; drag.x = event.clientX; drag.y = event.clientY; yaw -= dx * .006; pitch = THREE.MathUtils.clamp(pitch + dy * .004, -.34, .42); updateCamera(); };
    const onUp = (event: PointerEvent) => {
      drag.active = false;
      if (drag.moved) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(cans, true).find((entry) => {
        let node: THREE.Object3D | null = entry.object;
        while (node && node.parent && node.userData.collectible !== true) node = node.parent;
        return node?.userData.collectible === true;
      });
      if (!hit) return;
      let can: THREE.Object3D = hit.object;
      while (can.parent && can.userData.collectible !== true) can = can.parent;
      if (can.userData.collectible !== true || !can.visible) return;
      can.visible = false;
      const previous = Number.parseInt(localStorage.getItem(YOOHOO_STORAGE_KEY) ?? "69", 10);
      localStorage.setItem(YOOHOO_STORAGE_KEY, String((Number.isFinite(previous) ? previous : 69) + 1));
      window.dispatchEvent(new Event(YOOHOO_BALANCE_EVENT));
      setMessage("YOO-HOO COLLECTED · CURRENCY +1");
    };
    const onWheel = (event: WheelEvent) => { event.preventDefault(); distance = THREE.MathUtils.clamp(distance + event.deltaY * .006, 4.2, 11.5); updateCamera(); };
    const onKey = (event: KeyboardEvent) => {
      const keyName = event.key.toLowerCase();
      if (keyName === "w" || keyName === "arrowup") move(.25, 0);
      if (keyName === "s" || keyName === "arrowdown") move(-.25, 0);
      if (keyName === "a" || keyName === "arrowleft") move(0, -.25);
      if (keyName === "d" || keyName === "arrowright") move(0, .25);
    };
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      cans.forEach((can, index) => { if (can.visible) { can.rotation.y += .008; can.position.y = .4 + Math.sin(t * 2 + index) * .06; } });
      scene.traverse((object) => { if (object.geometry === heartGeometry) object.rotation.y += .01; });
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => material.dispose()); } });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main className="israel-room">
      <div className="israel-room__viewport" ref={mountRef} aria-label="Interactive 3D Israel tribute room. Drag to look, scroll to zoom, and use WASD or arrow keys to move." />
      <div className="israel-room__wash" aria-hidden="true" />
      <a className="israel-room__back" href="/">← WORLD SELECT</a>
      <header className="israel-room__title"><small>UNLOCKED TERRITORY · ISRAEL</small><h1>YOO-HOO HEART ROOM</h1><p>♥ BENJAMIN NETANYAHU TRIBUTE CHAMBER ♥</p></header>
      <aside className="israel-room__legend"><b>3D ROOM CONTROLS</b><span>DRAG · LOOK AROUND</span><span>SCROLL · ZOOM</span><span>WASD / ARROWS · MOVE</span><span>CLICK CANS · COLLECT YOO-HOO</span></aside>
      <p className="israel-room__message" aria-live="polite">{message}</p>
      <div className="israel-room__hearts" aria-hidden="true">♥ ♥ ♥</div>
    </main>
  );
}
