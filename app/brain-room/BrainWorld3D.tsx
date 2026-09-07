"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type BrainSubject = "pongo" | "rat" | null;

function material(color: number, emissive = 0) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: .24, roughness: .58, metalness: .04 });
}

function part(parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], scale: [number, number, number] = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...pos);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function makeBrainCreature(kind: Exclude<BrainSubject, null>) {
  const root = new THREE.Group();
  const fur = material(kind === "pongo" ? 0x9b4a20 : 0xe8e1dc, kind === "pongo" ? 0x2b0903 : 0x291631);
  const skin = material(kind === "pongo" ? 0x4b2114 : 0xf0aab9);
  const dark = material(kind === "pongo" ? 0x24100d : 0x6a5362);
  const torso = part(root, new THREE.SphereGeometry(1, 22, 18), fur, [0, 1.5, 0], kind === "pongo" ? [.62, .82, .5] : [.68, .38, .38]);
  const head = new THREE.Group();
  head.position.set(kind === "pongo" ? 0 : .68, kind === "pongo" ? 2.47 : 1.72, 0);
  root.add(head);
  part(head, new THREE.SphereGeometry(.5, 22, 18), fur, [0, 0, 0], kind === "pongo" ? [1, .92, .9] : [.72, .62, .62]);
  part(head, new THREE.SphereGeometry(.3, 18, 12), skin, [kind === "pongo" ? 0 : .28, -.08, .36], kind === "pongo" ? [1.1, .66, .52] : [1.3, .72, .62]);
  if (kind === "pongo") {
    part(head,new THREE.SphereGeometry(.17,18,14),skin,[-.19,-.06,.38],[.9,.78,.65]);
    part(head,new THREE.SphereGeometry(.17,18,14),skin,[.19,-.06,.38],[.9,.78,.65]);
    part(head,new THREE.SphereGeometry(.09,16,12),dark,[0,-.02,.58],[1.18,.66,.7]);
    part(head,new THREE.TorusGeometry(.105,.018,8,22,Math.PI),dark,[0,-.2,.55],[1,.72,1]).rotation.z=Math.PI;
    part(head,new THREE.SphereGeometry(.2,18,14),fur,[-.46,.01,0],[.34,.82,.62]);
    part(head,new THREE.SphereGeometry(.2,18,14),fur,[.46,.01,0],[.34,.82,.62]);
    const browL=part(head,new THREE.CapsuleGeometry(.025,.14,5,9),dark,[-.18,.19,.4],[1,1,1]);browL.rotation.z=Math.PI/2-.16;
    const browR=part(head,new THREE.CapsuleGeometry(.025,.14,5,9),dark,[.18,.19,.4],[1,1,1]);browR.rotation.z=Math.PI/2+.16;
  }
  for (const side of [-1, 1]) {
    part(head, new THREE.SphereGeometry(.09, 12, 10), dark, [side * .2 + (kind === "rat" ? .08 : 0), .08, .39]);
    if (kind === "rat") part(head, new THREE.SphereGeometry(.18, 14, 12), skin, [side * .24, .29, 0], [1, .35, 1]);
  }
  const limbs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * (kind === "pongo" ? .55 : .35), kind === "pongo" ? 1.9 : 1.48, 0);
    root.add(shoulder);
    part(shoulder, new THREE.CylinderGeometry(.12, .1, kind === "pongo" ? 1.35 : .62, 10), fur, [0, -.58, 0]);
    const elbow = new THREE.Group(); elbow.position.y = kind === "pongo" ? -1.18 : -.55; shoulder.add(elbow);
    part(elbow, new THREE.CylinderGeometry(.1, .07, kind === "pongo" ? 1.15 : .5, 10), fur, [0, -.5, 0]);
    part(elbow, new THREE.SphereGeometry(.14, 12, 10), skin, [0, kind === "pongo" ? -1.05 : -.46, 0]);
    if(kind==="pongo") for(let finger=-1;finger<=1;finger++){
      const digit=part(elbow,new THREE.CapsuleGeometry(.025,.17,5,8),skin,[finger*.055,-1.17,.035]);digit.rotation.x=.45;
    }
    limbs.push(shoulder, elbow);
    const hip = new THREE.Group(); hip.position.set(side * (kind === "pongo" ? .28 : .34), 1.05, 0); root.add(hip);
    part(hip, new THREE.CylinderGeometry(.14, .11, kind === "pongo" ? .82 : .55, 10), fur, [0, -.34, 0]);
    const knee = new THREE.Group(); knee.position.y = kind === "pongo" ? -.72 : -.5; hip.add(knee);
    part(knee, new THREE.SphereGeometry(.14, 12, 10), skin, [0, 0, 0]);
    part(knee, new THREE.CylinderGeometry(.1, .08, kind === "pongo" ? .7 : .45, 10), fur, [0, -.3, 0]);
    limbs.push(hip, knee);
  }
  if (kind === "rat") {
    const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.55,1.45,0),new THREE.Vector3(-1.2,1.3,.1),new THREE.Vector3(-1.8,1.1,-.2),new THREE.Vector3(-2.2,1.25,.1)]),36,.055,8,false), skin);
    root.add(tail);
    root.scale.setScalar(.72);
  } else {
    const chest=part(root,new THREE.SphereGeometry(.52,26,20),skin,[0,1.48,.39],[.72,.82,.18]);
    chest.material=(skin as THREE.MeshStandardMaterial).clone();
    root.scale.setScalar(.62);
  }
  root.userData = { torso, head, limbs, kind, walk: 0, vy: 0 };
  return root;
}

function addBrainWall(scene: THREE.Scene, z: number, rotationY = 0, x = 0) {
  const wall = new THREE.Group();
  wall.position.set(x, 2.3, z);
  wall.rotation.y = rotationY;
  const base = part(wall, new THREE.BoxGeometry(16, 7.2, .35), material(0x6d164f, 0x260821), [0, 0, 0]);
  base.receiveShadow = true;
  const wrinkleMat = material(0xd748aa, 0x4d093b);
  for (let i = 0; i < 28; i++) {
    const y = -3 + (i % 7) * 1.02;
    const row = Math.floor(i / 7);
    const points = Array.from({ length: 9 }, (_, n) => new THREE.Vector3(-7.5 + n * 1.9, y + Math.sin(n * 1.7 + i) * .28, .28 + row * .01));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, .12, 7, false), wrinkleMat.clone());
    tube.userData.phase = i * .4;
    wall.add(tube);
  }
  scene.add(wall);
  return wall;
}

export default function BrainWorld3D({ subject, walkMode }: { subject: BrainSubject; walkMode: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x170612);
    scene.fog = new THREE.FogExp2(0x30061e, .028);
    const camera = new THREE.PerspectiveCamera(55, 1, .1, 80);
    camera.position.set(0, 4.3, 10.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffb4dd, 0x21031a, 2.1));
    const lamp = new THREE.PointLight(0x7dfff0, 50, 26, 1.5); lamp.position.set(0, 6, 2); lamp.castShadow = true; scene.add(lamp);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 24), material(0x3c102f, 0x180614)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const backWall = addBrainWall(scene, -8);
    addBrainWall(scene, 0, Math.PI / 2, -8);
    addBrainWall(scene, 0, -Math.PI / 2, 8);
    const windowMat = material(0x91fff1, 0x31aaa0);
    for (const x of [-4.4, 0, 4.4]) {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(1.35, .16, 10, 32), windowMat); frame.position.set(x, 3.1, -7.68); frame.scale.y = 1.2; scene.add(frame);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(1.25, 32), new THREE.MeshBasicMaterial({ color: 0x341567, transparent: true, opacity: .68 })); glass.position.set(x, 3.1, -7.66); scene.add(glass);
    }
    for (const [x, color] of [[-3.2,0xed439e],[3.5,0x5d39db]] as const) {
      const bag = new THREE.Mesh(new THREE.SphereGeometry(1.25, 28, 22), new THREE.MeshPhysicalMaterial({ color, roughness: .72, clearcoat: .25 })); bag.position.set(x,.72,-3.4); bag.scale.set(1.25,.72,1.1); bag.castShadow=true; scene.add(bag);
    }
    const creature = subject ? makeBrainCreature(subject) : null;
    if (creature) { creature.position.set(0,0,1.5); scene.add(creature); }
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => { keys.add(e.code); if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault(); if (e.code === "Space" && creature && Math.abs(creature.position.y) < .03) creature.userData.vy = 6.2; };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener("keydown",onKeyDown); window.addEventListener("keyup",onKeyUp);
    let yaw=0, pitch=0, dragging=false, lx=0, ly=0;
    const down=(e:PointerEvent)=>{dragging=true;lx=e.clientX;ly=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};
    const move=(e:PointerEvent)=>{if(!dragging)return;yaw+=(e.clientX-lx)*.004;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-ly)*.003,-.25,.35);lx=e.clientX;ly=e.clientY};
    const up=()=>{dragging=false};
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("pointercancel",up);
    const resize=()=>{const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
    const observer=new ResizeObserver(resize);observer.observe(mount);resize();
    const clock=new THREE.Clock();let frame=0;
    const animate=()=>{frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.033),time=clock.elapsedTime;
      backWall.children.slice(1).forEach((child,i)=>{child.scale.y=1+Math.sin(time*1.8+(child.userData.phase??i))*.07});
      if(creature){let mx=0,mz=0;if(keys.has("KeyA")||keys.has("ArrowLeft"))mx-=1;if(keys.has("KeyD")||keys.has("ArrowRight"))mx+=1;if(keys.has("KeyW")||keys.has("ArrowUp"))mz-=1;if(keys.has("KeyS")||keys.has("ArrowDown"))mz+=1;const len=Math.hypot(mx,mz)||1;mx/=len;mz/=len;creature.position.x=THREE.MathUtils.clamp(creature.position.x+mx*dt*3.4,-6.7,6.7);creature.position.z=THREE.MathUtils.clamp(creature.position.z+mz*dt*3.4,-6.3,5.2);creature.userData.vy-=14*dt;creature.position.y+=creature.userData.vy*dt;if(creature.position.y<0){creature.position.y=0;creature.userData.vy=0}const moving=Math.abs(mx)+Math.abs(mz)>.1;if(moving){creature.rotation.y=Math.atan2(mx,mz);creature.userData.walk+=dt*8;const limbs=creature.userData.limbs as THREE.Group[];limbs.forEach((limb,i)=>limb.rotation.x=Math.sin(creature.userData.walk+i*Math.PI/2)*.48)}const focus=walkMode?creature.position:new THREE.Vector3(0,1,-1);const dist=walkMode?5.2:10.5;camera.position.x+=(focus.x+Math.sin(yaw)*dist-camera.position.x)*.07;camera.position.z+=(focus.z+Math.cos(yaw)*dist-camera.position.z)*.07;camera.position.y+=(focus.y+3.2-pitch*5-camera.position.y)*.07;camera.lookAt(focus.x,focus.y+1,focus.z)}else{camera.position.x+=(Math.sin(yaw)*10-camera.position.x)*.05;camera.position.z+=(Math.cos(yaw)*10-camera.position.z)*.05;camera.lookAt(0,1,-1)}renderer.render(scene,camera)};animate();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointermove",move);renderer.domElement.removeEventListener("pointerup",up);renderer.dispose();mount.removeChild(renderer.domElement)};
  },[subject,walkMode]);
  return <div ref={mountRef} className="brain-world-3d" aria-label="Navigable 3D brain room. Use WASD or arrow keys, space to jump, and drag to rotate the camera."/>;
}
