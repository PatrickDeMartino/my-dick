"use client";

import { useEffect, useRef } from "react";
import { SITE_ASSETS, type SiteAsset } from "../lib/assetRegistry";
import { buildProp } from "../lib/props3d";
import { createAlien, updateAlien, type AlienRig } from "../../games/alien-archer/src/game/alien";
import { makeSandboxProp } from "../../games/alien-archer/src/game/sandbox";

type Spawned = {
  root: import("three").Group;
  velocity: import("three").Vector3;
  spin: import("three").Vector3;
  asset: SiteAsset;
  radius: number;
  alien?: AlienRig;
  grounded: boolean;
};

export default function AssetRoom3D({ onCount, onActive }: { onCount:(count:number)=>void; onActive:(name:string)=>void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    void Promise.all([import("three"),import("three/examples/jsm/controls/OrbitControls.js")]).then(([THREE,{OrbitControls}]) => {
      if (disposed) return;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050911);
      scene.fog = new THREE.Fog(0x050911,18,42);
      const camera = new THREE.PerspectiveCamera(52,1,.1,80);
      camera.position.set(9,7.2,11);
      const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera,renderer.domElement);
      controls.target.set(0,1,0);
      controls.enableDamping = true;
      controls.minDistance = 5;
      controls.maxDistance = 27;
      controls.maxPolarAngle = Math.PI*.48;

      scene.add(new THREE.HemisphereLight(0x9cddff,0x190d27,1.5));
      const key = new THREE.DirectionalLight(0xffffff,3.2);
      key.position.set(6,12,7); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key);
      const glow = new THREE.PointLight(0x5dffd7,18,18,2); glow.position.set(-5,4,-4); scene.add(glow);

      const platform = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(14,.55,14),new THREE.MeshStandardMaterial({color:0x14252a,roughness:.5,metalness:.62}));
      deck.receiveShadow=true; platform.add(deck);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(deck.geometry),new THREE.LineBasicMaterial({color:0x62ffe0})); platform.add(edge);
      const grid = new THREE.GridHelper(14,14,0x5dffe1,0x203f48); grid.position.y=.282; platform.add(grid);
      scene.add(platform);

      const pylons = new THREE.Group();
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2;
        const crystal=new THREE.Mesh(new THREE.ConeGeometry(.18,.9,6),new THREE.MeshPhysicalMaterial({color:new THREE.Color().setHSL(i/8,.8,.58),emissive:new THREE.Color().setHSL(i/8,.7,.18),emissiveIntensity:.8,transparent:true,opacity:.8,roughness:.12,metalness:.15}));
        crystal.position.set(Math.cos(a)*6.4,.7,Math.sin(a)*6.4); crystal.rotation.z=(i%2?-.12:.12); pylons.add(crystal);
      }
      scene.add(pylons);

      const spawned: Spawned[]=[];
      let possessed: Spawned | null=null;
      const keys=new Set<string>();
      const spawnAsset=(asset:SiteAsset,possess=false,position?:import("three").Vector3)=>{
        let root: import("three").Group;
        let alien:AlienRig|undefined;
        if(asset.builder==="alien"&&asset.character){ alien=createAlien(asset.character); root=alien.root; }
        else if(asset.builder==="shared-prop"&&asset.prop) root=buildProp(THREE,asset.prop);
        else root=makeSandboxProp(asset.sandbox??"vehicle");
        root.scale.multiplyScalar(asset.scale??1);
        root.position.copy(position??new THREE.Vector3((Math.random()-.5)*5,3+Math.random()*2,(Math.random()-.5)*5));
        root.traverse(node=>{if(node instanceof THREE.Mesh){node.castShadow=true;node.receiveShadow=true;}});
        scene.add(root);
        const entity:Spawned={root,velocity:new THREE.Vector3((Math.random()-.5)*1.2,0,(Math.random()-.5)*1.2),spin:new THREE.Vector3((Math.random()-.5)*1.5,(Math.random()-.5)*1.5,(Math.random()-.5)*1.5),asset,radius:asset.builder==="alien"?.55:.38,alien,grounded:false};
        spawned.push(entity); onCount(spawned.length);
        if(possess&&asset.category==="CHARACTERS"){possessed=entity;onActive(asset.label);controls.target.copy(root.position);}
        return entity;
      };
      const clear=()=>{spawned.forEach(item=>scene.remove(item.root));spawned.length=0;possessed=null;onCount(0);onActive("NONE");};
      const fire=()=>{
        if(!possessed)return;
        const ammo=SITE_ASSETS.find(item=>item.id==="pepsi"); if(!ammo)return;
        const direction=new THREE.Vector3(0,0,-1).applyQuaternion(possessed.root.quaternion);
        const shot=spawnAsset(ammo,false,possessed.root.position.clone().add(new THREE.Vector3(0,1,0)).addScaledVector(direction,.8));
        shot.velocity.copy(direction.multiplyScalar(11)); shot.velocity.y=1.8;
      };
      const onSpawn=(event:Event)=>{const detail=(event as CustomEvent<{id:string;possess?:boolean}>).detail;const asset=SITE_ASSETS.find(item=>item.id===detail.id);if(asset)spawnAsset(asset,!!detail.possess);};
      const onClear=()=>clear();
      const onKey=(event:KeyboardEvent)=>{if(["KeyW","KeyA","KeyS","KeyD","Space","ShiftLeft","KeyF"].includes(event.code))event.preventDefault();keys.add(event.code);if(event.code==="Space"&&possessed?.grounded){possessed.velocity.y=6.4;possessed.grounded=false;}if(event.code==="KeyF"&&!event.repeat)fire();};
      const onKeyUp=(event:KeyboardEvent)=>keys.delete(event.code);
      const onVirtual=(event:Event)=>{const {code,down}=(event as CustomEvent<{code:string;down:boolean}>).detail;if(down){keys.add(code);if(code==="Space"&&possessed?.grounded){possessed.velocity.y=6.4;possessed.grounded=false;}if(code==="KeyF")fire();}else keys.delete(code);};
      window.addEventListener("asset-room:spawn",onSpawn);window.addEventListener("asset-room:clear",onClear);window.addEventListener("asset-room:key",onVirtual);
      window.addEventListener("keydown",onKey);window.addEventListener("keyup",onKeyUp);

      const resize=()=>{const width=mount.clientWidth,height=mount.clientHeight;camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.setSize(width,height,false);};
      const observer=new ResizeObserver(resize);observer.observe(mount);resize();
      const clock=new THREE.Clock();
      renderer.setAnimationLoop(()=>{
        const dt=Math.min(clock.getDelta(),.035),time=clock.elapsedTime;
        for(const entity of spawned){
          const controlled=entity===possessed;
          let speed=0;
          if(controlled){
            const x=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0),z=(keys.has("KeyS")?1:0)-(keys.has("KeyW")?1:0),boost=keys.has("ShiftLeft")?7.2:4.4;
            entity.velocity.x+=(x*boost-entity.velocity.x)*Math.min(1,dt*9);entity.velocity.z+=(z*boost-entity.velocity.z)*Math.min(1,dt*9);speed=Math.hypot(entity.velocity.x,entity.velocity.z);
            if(speed>.1)entity.root.rotation.y=Math.atan2(entity.velocity.x,entity.velocity.z)+Math.PI;
          } else { entity.root.rotation.x+=entity.spin.x*dt;entity.root.rotation.y+=entity.spin.y*dt;entity.root.rotation.z+=entity.spin.z*dt; }
          entity.velocity.y-=12*dt;entity.root.position.addScaledVector(entity.velocity,dt);
          const floor=.28+entity.radius;
          if(entity.root.position.y<floor){entity.root.position.y=floor;if(Math.abs(entity.velocity.y)>1.1)entity.velocity.y*=-.34;else entity.velocity.y=0;entity.grounded=true;entity.velocity.x*=controlled?.84:.94;entity.velocity.z*=controlled?.84:.94;}
          for(const axis of ["x","z"] as const){if(Math.abs(entity.root.position[axis])>6.55){entity.root.position[axis]=Math.sign(entity.root.position[axis])*6.55;entity.velocity[axis]*=-.55;}}
          if(entity.alien)updateAlien(entity.alien,{dt,speed,grounded:entity.grounded,vy:entity.velocity.y,justLanded:false,justShot:false,attract:false,time,weapon:"revolver",firing:false,aimPitch:0,reload:0,revLoaded:6,jetting:false});
        }
        controls.update();renderer.render(scene,camera);
      });
      spawnAsset(SITE_ASSETS[0],true,new THREE.Vector3(0,3,0));

      cleanup=()=>{renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();window.removeEventListener("asset-room:spawn",onSpawn);window.removeEventListener("asset-room:clear",onClear);window.removeEventListener("asset-room:key",onVirtual);window.removeEventListener("keydown",onKey);window.removeEventListener("keyup",onKeyUp);scene.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(material=>material.dispose());}});renderer.dispose();renderer.domElement.remove();};
    });
    return()=>{disposed=true;cleanup();};
  },[onActive,onCount]);

  return <div ref={mountRef} className="asset-room__viewport" aria-label="3D asset physics test platform" />;
}
