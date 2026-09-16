"use client";
import {canTexture,makeCrystalCluster,makeJungleTree,makeCan} from '../world/models/home';

import {WorldSimulation} from '../world/WorldSimulation';
import {gravityAcceleration} from '../world/physics';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {makeLooseProp,animateLoose} from "../brain-room/lib/loose-props";
import { makeHomeBrain } from "../lib/homeBrain";
import { makeBrainCreature, animateCreature } from "../brain-room/lib/creatures";

type CanLabel = "YOOHOO" | "PEPSI" | "MONSTER" | "RAT MEAT";
type SpawnItem = CanLabel | "PONGO" | "WORMS";
type HomeSpatialTarget = "brain" | "camera";

type CanBody = {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  radius: number;
};

type PongoBody = {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  swing: { vine: JungleVine; velocity: THREE.Vector3; gyro: THREE.Vector3 } | null;
};

type JungleVine = {
  mesh: THREE.Group;
  segments: THREE.Mesh[];
  anchor: THREE.Vector3;
  length: number;
  phase: number;
};

const CAN_EVENT = "trip-spawn-can";
const SPATIAL_EVENT = "trip-home-spatial";
const CONTROL_EVENT = "trip-home-control";

function aimVine(vine: JungleVine, end: THREE.Vector3, taut = false) {
  const down = new THREE.Vector3(0, -1, 0);
  const across = end.clone().sub(vine.anchor);
  const side = new THREE.Vector3().crossVectors(across, down).normalize();
  if (side.lengthSq() < .01) side.set(0,0,1);
  const points = Array.from({length: vine.segments.length + 1}, (_, index) => {
    const t = index / vine.segments.length;
    const point = vine.anchor.clone().lerp(end, t);
    if (!taut) point.addScaledVector(side, Math.sin(Math.PI*t)*.1);
    return point;
  });
  vine.segments.forEach((segment,index)=>{
    const direction=points[index+1].clone().sub(points[index]);
    segment.position.copy(points[index]).add(points[index+1]).multiplyScalar(.5);
    segment.scale.set(1,direction.length(),1);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  });
}

export default function HomeRoom3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const sendControl=(code:string,down:boolean)=>window.dispatchEvent(new CustomEvent(CONTROL_EVENT,{detail:{code,down}}));
  const moveJoystick=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const pad=joystickRef.current;if(!pad)return;
    const rect=pad.getBoundingClientRect();
    const dx=THREE.MathUtils.clamp((event.clientX-(rect.left+rect.width/2))/(rect.width*.34),-1,1);
    const dy=THREE.MathUtils.clamp((event.clientY-(rect.top+rect.height/2))/(rect.height*.34),-1,1);
    pad.style.setProperty("--joy-x",`${dx*31}px`);pad.style.setProperty("--joy-y",`${dy*31}px`);
    sendControl("KeyA",dx<-.24);sendControl("KeyD",dx>.24);sendControl("KeyW",dy<-.24);sendControl("KeyS",dy>.24);
  };
  const releaseJoystick=()=>{
    const pad=joystickRef.current;pad?.style.setProperty("--joy-x","0px");pad?.style.setProperty("--joy-y","0px");
    ["KeyA","KeyD","KeyW","KeyS"].forEach(code=>sendControl(code,false));
  };

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
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -.15, -1.25);
    controls.enableDamping = true;
    controls.dampingFactor = .075;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 5.2;
    controls.maxDistance = 24;
    controls.minPolarAngle = .18;
    controls.maxPolarAngle = Math.PI - .18;
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

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
    // Keep the controllable cube as a light navigational frame, but leave the
    // jungle completely open: no back/side walls and no ceiling.
    const cubeEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(30, 18, 30)),
      new THREE.LineBasicMaterial({ color:0x62ffd7, transparent:true, opacity:.2 }),
    );
    cubeEdges.position.set(0, 5, 0);
    room.add(cubeEdges);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x142d1b, roughness: .96, metalness: .02 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 64, 40, 40), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    room.add(floor);
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

    const vineMaterial = new THREE.MeshPhysicalMaterial({ color: 0x174f25, roughness: .62, clearcoat: .32 });
    const vines: JungleVine[] = [-11,-6.2,-2.5,1.2,5.3,9.8].map((x, index) => {
      const length = 6.2 + (index % 3) * .65;
      const mesh = new THREE.Group();
      const segments=Array.from({length:18},()=>{
        const segment=new THREE.Mesh(new THREE.CylinderGeometry(.048,.058,1,12),vineMaterial.clone());
        segment.castShadow=true; mesh.add(segment); return segment;
      });
      const vine = { mesh, segments, anchor: new THREE.Vector3(x, 8.4 + (index % 2) * .45, -3.3 + (index%3)*3.2), length, phase: index * 1.37 };
      aimVine(vine, vine.anchor.clone().add(new THREE.Vector3(0, -length, 0)));
      room.add(mesh);
      return vine;
    });

    const brainLife = makeHomeBrain(() => { document.documentElement.dataset.monkeyReady = "true"; });
    const brain = brainLife.root;
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
      if (item === "WORMS") {
        brainLife.spawnWorm();
      } else if (item === "PONGO") {
        if (!pongoMode) spawnPongo(true);
        else {
          if (heldCan) { heldCan = null; heldTime = 0; }
          pongos.forEach((pongo)=>scene.remove(pongo.mesh));
          pongos.length=0; selectedPongo=null; pongoMode=false;
        }
        window.dispatchEvent(new CustomEvent("trip-pongo-mode",{detail:pongoMode}));
      } else spawnCan(item);
    };
    window.addEventListener(CAN_EVENT, onSpawn);
    const universe=new WorldSimulation(scene,camera,renderer.domElement,{ground:-3,bounds:28,spawnPoint:()=>new THREE.Vector3(0,2,1),onControl:e=>controls.enabled=!e});
    let windStrength=1;const onWorldSpawn=(event:Event)=>{const e=event as CustomEvent<{kind:string}>;e.preventDefault();if(e.detail.kind==='worm'){brainLife.spawnWorm();return;}const mesh=makeLooseProp(e.detail.kind);mesh.position.set((Math.random()-.5)*2,4,1);scene.add(mesh);cans.push({mesh,velocity:new THREE.Vector3((Math.random()-.5)*2,1,0),spin:new THREE.Vector3(2,3,1),radius:mesh.userData.radius||.25});if(cans.length>40)scene.remove(cans.shift()!.mesh);};
    const onWorldClear=()=>{cans.forEach(c=>c.mesh.removeFromParent());cans.length=0;heldCan=null;};
    const onWorldSettings=(event:Event)=>{const d=(event as CustomEvent).detail;windStrength=d.wind;renderer.toneMappingExposure=1.16*d.light;renderer.setPixelRatio(Math.min(devicePixelRatio,d.quality));};
    window.addEventListener('trip-world-clear',onWorldClear);window.addEventListener('trip-world-settings',onWorldSettings);window.dispatchEvent(new Event('trip-world-ready'));
    const onSpatial=(event:Event)=>{
      const detail=(event as CustomEvent<{target:HomeSpatialTarget;value:{x:number;y:number;z:number;scale:number}}>).detail;
      if(detail.target==="brain") brainSpatial={...detail.value};
      if(detail.target==="camera") {
        const radius=12.6/detail.value.scale;
        const yaw=detail.value.x;
        const pitch=detail.value.y;
        const target=controls.target;
        camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*radius,target.y+Math.sin(pitch)*radius,target.z+Math.cos(yaw)*Math.cos(pitch)*radius);
        camera.lookAt(target);
        camera.rotation.z=detail.value.z;
        controls.update();
      }
    };
    window.addEventListener(SPATIAL_EVENT,onSpatial);
    const activatePongoJump=()=>{
      if (selectedPongo) {
        if (selectedPongo.swing) {
          selectedPongo.velocity.copy(selectedPongo.swing.velocity);
          selectedPongo.swing = null;
        } else {
          const shoulder = selectedPongo.mesh.position.clone().add(new THREE.Vector3(0, 2.25, 0));
          const nearest = vines.map(vine=>({vine,distance:shoulder.distanceTo(vine.anchor.clone().add(new THREE.Vector3(0,-vine.length,0)))})).sort((a,b)=>a.distance-b.distance)[0];
          if (nearest && nearest.distance < 3.4) {
            selectedPongo.swing = { vine: nearest.vine, velocity: selectedPongo.velocity.clone(), gyro: new THREE.Vector3() };
          } else if (selectedPongo.mesh.position.y <= -2.98) selectedPongo.velocity.y = 6.4;
        }
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
      if (event.code === "Space" && !event.repeat) activatePongoJump();
      if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const onControl=(event:Event)=>{const {code,down}=(event as CustomEvent<{code:string;down:boolean}>).detail;if(down){if(code==="Space"&&!keys.has(code))activatePongoJump();keys.add(code);}else keys.delete(code);};
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener(CONTROL_EVENT,onControl);

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
      const time = clock.elapsedTime*windStrength;
      brain.rotation.y = -.28 + Math.sin(time * .38) * .18;
      brain.position.set(4.25+brainSpatial.x*1.45,-.05+brainSpatial.y*1.15+Math.sin(time*.72)*.12,-.2+brainSpatial.z*1.2);
      brain.scale.setScalar(1.34*brainSpatial.scale);
      brainLife.update(dt*windStrength);
      crystals.forEach((cluster,index)=>{cluster.rotation.y+=dt*(index%2?.08:-.06);});
      vines.forEach(vine=>{
        const swinger=pongos.find(pongo=>pongo.swing?.vine===vine);
        if(!swinger) aimVine(vine,vine.anchor.clone().add(new THREE.Vector3(Math.sin(time*.65+vine.phase)*.13,-vine.length,Math.cos(time*.54+vine.phase)*.08)));
      });
      for (const can of cans) {
        animateLoose(can.mesh,time,dt,can.velocity.length());if(can===heldCan)continue;
        can.velocity.y -= gravityAcceleration() * dt;
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
        if (pongo === selectedPongo&&!universe.controlled) {
          if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
          if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
          if (keys.has("KeyW") || keys.has("ArrowUp")) mz -= 1;
          if (keys.has("KeyS") || keys.has("ArrowDown")) mz += 1;
        }
        const movementLength = Math.hypot(mx, mz) || 1;
        mx /= movementLength; mz /= movementLength;
        if (pongo.swing) {
          const swing=pongo.swing;
          const oldHand=pongo.mesh.position.clone().add(new THREE.Vector3(0,2.15,0));
          swing.velocity.y-=gravityAcceleration()*dt;
          swing.velocity.x+=mx*8.5*dt; swing.velocity.z+=mz*8.5*dt;
          swing.velocity.multiplyScalar(1-dt*.045);
          const hand=oldHand.clone().addScaledVector(swing.velocity,dt);
          const radius=hand.clone().sub(swing.vine.anchor).normalize();
          hand.copy(swing.vine.anchor).addScaledVector(radius,swing.vine.length);
          swing.velocity.copy(hand).sub(oldHand).divideScalar(Math.max(dt,.001));
          const tangentSpin=new THREE.Vector3().crossVectors(radius,swing.velocity).multiplyScalar(.055);
          swing.gyro.lerp(tangentSpin,.18);
          pongo.mesh.position.copy(hand).add(new THREE.Vector3(0,-2.15,0));
          pongo.mesh.rotation.x=THREE.MathUtils.clamp(swing.gyro.x,-.7,.7);
          pongo.mesh.rotation.z=THREE.MathUtils.clamp(-swing.gyro.z,-.85,.85);
          pongo.mesh.rotation.y+=swing.gyro.y*dt;
          const limbs=pongo.mesh.userData.limbs as THREE.Group[];
          limbs[0].rotation.x=Math.PI*.84; limbs[1].rotation.x=-.3;
          limbs[4].rotation.x=Math.PI*.84; limbs[5].rotation.x=-.3;
          aimVine(swing.vine,hand,true);
        } else {
          pongo.mesh.rotation.x*=.84; pongo.mesh.rotation.z*=.84;
          pongo.velocity.x += (mx * 3.6 - pongo.velocity.x) * Math.min(1, dt * 8);
          pongo.velocity.z += (mz * 3.6 - pongo.velocity.z) * Math.min(1, dt * 8);
          pongo.velocity.y -= gravityAcceleration() * dt;
          pongo.mesh.position.addScaledVector(pongo.velocity, dt);
        }
        if (pongo.mesh.position.y < -3) { pongo.mesh.position.y = -3; pongo.velocity.y = 0; }
        if(!pongo.swing){pongo.mesh.position.x = THREE.MathUtils.clamp(pongo.mesh.position.x, -28, 28);pongo.mesh.position.z = THREE.MathUtils.clamp(pongo.mesh.position.z, -28, 28);}
        const moving = Math.abs(mx) + Math.abs(mz) > .1;
        if (moving && !pongo.swing) {
          pongo.mesh.rotation.y = Math.atan2(mx, mz);
          pongo.mesh.userData.walk += dt;
          animateCreature(pongo.mesh,pongo.mesh.userData.walk,true,dt);
        }
        if(pongo===selectedPongo){
          if(!heldCan){heldCan=cans.find(can=>can.mesh.position.distanceTo(pongo.mesh.position)<1.35)??null;heldTime=0;}
          if(heldCan){
            heldTime+=dt;const forward=new THREE.Vector3(Math.sin(pongo.mesh.rotation.y),0,Math.cos(pongo.mesh.rotation.y));
            const limbs=pongo.mesh.userData.limbs as THREE.Group[];
            const reach=THREE.MathUtils.smoothstep(heldTime,0,.3),wind=THREE.MathUtils.smoothstep(heldTime,.3,.72);
            limbs[4].rotation.x=THREE.MathUtils.lerp(limbs[4].rotation.x,-1.28,reach);limbs[5].rotation.x=THREE.MathUtils.lerp(limbs[5].rotation.x,-.82+wind*1.5,reach);
            pongo.mesh.userData.torso.rotation.x=-.13*(1-wind);
            const handTarget=pongo.mesh.position.clone().add(forward.clone().multiplyScalar(.48-.22*wind)).add(new THREE.Vector3(.28,1.18+wind*.78,0));
            heldCan.mesh.position.lerp(handTarget,.34);heldCan.mesh.rotation.z+=dt*8;
            if(heldTime>.82){heldCan.velocity.copy(forward.multiplyScalar(11.5)).add(new THREE.Vector3(0,6.2,0));heldCan.spin.set(9,6,10);heldCan=null;heldTime=0;pongo.mesh.userData.torso.rotation.x=0;}
          }
        }
      }
      controls.update();
      universe.update(dt);universe.followCamera();renderer.render(scene, camera);
    };
    animate();
    document.documentElement.dataset.homeReady = "true";

    return () => {
      universe.dispose();cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener(CAN_EVENT, onSpawn);window.removeEventListener('trip-world-spawn',onWorldSpawn);window.removeEventListener('trip-world-clear',onWorldClear);window.removeEventListener('trip-world-settings',onWorldSettings);
      window.removeEventListener(SPATIAL_EVENT,onSpatial);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener(CONTROL_EVENT,onControl);
      renderer.domElement.removeEventListener("pointerup", onUp);
      brainLife.dispose();
      delete document.documentElement.dataset.homeReady;
      delete document.documentElement.dataset.monkeyReady;
      controls.dispose();
      renderer.dispose();
      Object.values(canTextures).flat().forEach((texture) => texture.dispose());
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.LineSegments)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <>
    <div ref={mountRef} className="home-room-3d" aria-label="Interactive 3D jungle cube. Drag to rotate, right-drag to pan, and scroll to zoom." />
    <div className="home-pongo-mobile" aria-label="Pongo mobile controls">
      <div ref={joystickRef} className="home-pongo-joystick" role="group" aria-label="Move Pongo"
        onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);moveJoystick(event);}}
        onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))moveJoystick(event);}}
        onPointerUp={releaseJoystick} onPointerCancel={releaseJoystick}>
        <i aria-hidden="true" />
      </div>
      <button type="button" className="home-pongo-jump" aria-label="Pongo jump or grab vine"
        onPointerDown={()=>sendControl("Space",true)} onPointerUp={()=>sendControl("Space",false)} onPointerCancel={()=>sendControl("Space",false)}>JUMP<br/><small>GRAB</small></button>
    </div>
  </>;
}

export function spawnHomeCan(label: SpawnItem) {
  window.dispatchEvent(new CustomEvent(CAN_EVENT, { detail: label }));
}

export function setHomeSpatial(target:HomeSpatialTarget,value:{x:number;y:number;z:number;scale:number}){
  window.dispatchEvent(new CustomEvent(SPATIAL_EVENT,{detail:{target,value}}));
}
