"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./israel.css";

const YOOHOO_STORAGE_KEY = "trip.yoohoo.v1";
const YOOHOO_BALANCE_EVENT = "trip-yoohoo-balance-changed";

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function posterTexture(title: string, subtitle: string, image: HTMLImageElement, palette: [string, string]) {
  return canvasTexture(900, 900, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 900, 900);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(1, palette[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 900);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(450, 830);
    ctx.bezierCurveTo(100, 600, 75, 310, 280, 210);
    ctx.bezierCurveTo(405, 148, 450, 258, 450, 258);
    ctx.bezierCurveTo(450, 258, 495, 148, 620, 210);
    ctx.bezierCurveTo(825, 310, 800, 600, 450, 830);
    ctx.clip();
    ctx.drawImage(image, 95, 130, 710, 520);
    const fade = ctx.createLinearGradient(0, 470, 0, 850);
    fade.addColorStop(0, "rgba(255,255,255,0)");
    fade.addColorStop(.3, "rgba(255,255,255,.93)");
    ctx.fillStyle = fade;
    ctx.fillRect(60, 430, 780, 420);
    ctx.restore();
    ctx.fillStyle = palette[0];
    ctx.textAlign = "center";
    ctx.font = "900 54px Arial";
    const words = title.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = `${line} ${word}`.trim();
      if (ctx.measureText(next).width > 650 && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
    lines.slice(0, 3).forEach((text, index) => ctx.fillText(text, 450, 640 + index * 57));
    ctx.fillStyle = palette[1];
    ctx.font = "900 29px Arial";
    ctx.fillText(subtitle, 450, 820);
    ctx.font = "46px Arial";
    ctx.fillText("♥ ✦ ♥ ✦ ♥", 450, 875);
  });
}

function makeCan(texture: THREE.Texture, x: number, y: number, z: number, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.userData.collectible = true;
  group.userData.velocity = new THREE.Vector3();
  group.userData.angularVelocity = new THREE.Vector3(.4, .7, .25);
  group.userData.held = false;
  const label = new THREE.MeshStandardMaterial({ map: texture, metalness: .18, roughness: .34 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xdde5e8, metalness: .94, roughness: .15 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.255, .255, .86, 44, 1, false), [label, silver, silver]);
  body.castShadow = true;
  group.add(body);
  const rimGeometry = new THREE.TorusGeometry(.255, .018, 8, 36);
  for (const py of [-.43, .43]) {
    const rim = new THREE.Mesh(rimGeometry, silver);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = py;
    group.add(rim);
  }
  const tab = new THREE.Mesh(new THREE.TorusGeometry(.052, .012, 6, 18), silver);
  tab.rotation.x = Math.PI / 2;
  tab.scale.y = .58;
  tab.position.set(.04, .447, 0);
  group.add(tab);
  return group;
}

function heartShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -.72);
  shape.bezierCurveTo(-1.05, -.05, -1.1, .78, -.48, .92);
  shape.bezierCurveTo(-.12, 1, 0, .68, 0, .68);
  shape.bezierCurveTo(0, .68, .12, 1, .48, .92);
  shape.bezierCurveTo(1.1, .78, 1.05, -.05, 0, -.72);
  return shape;
}

export default function IsraelRoom() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("DRAG THE ROOM OR THROW A YOO-HOO CAN");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040519);
    scene.fog = new THREE.Fog(0x040519, 9, 24);
    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, .1, 80);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xb9e5ff, 0x321032, 2.5));
    const warm = new THREE.PointLight(0xffd85d, 52, 22, 1.35);
    warm.position.set(-3.8, 4.8, 2.6);
    warm.castShadow = true;
    scene.add(warm);
    const blue = new THREE.PointLight(0x1f7dff, 54, 20, 1.5);
    blue.position.set(4.8, 3.2, -2.5);
    scene.add(blue);
    const pink = new THREE.PointLight(0xff3d9d, 34, 16, 1.6);
    pink.position.set(0, 5.2, 2.2);
    scene.add(pink);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ color: 0x174d9b, roughness: .64, metalness: .22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(14, 24, 0xffd84f, 0x347ce4);
    grid.position.y = .012;
    scene.add(grid);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2946a2, roughness: .7, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMaterial);
    back.position.set(0, 3, -5);
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMaterial.clone());
    left.position.set(-7, 3, 0);
    left.rotation.y = Math.PI / 2;
    scene.add(left);
    const right = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMaterial.clone());
    right.position.set(7, 3, 0);
    right.rotation.y = -Math.PI / 2;
    scene.add(right);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ color: 0x111544, roughness: .82, side: THREE.DoubleSide }));
    ceiling.position.y = 6;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const loader = new THREE.TextureLoader();
    const yoohooTexture = loader.load("/israel-room/yoohoo-can-clean.png");
    yoohooTexture.colorSpace = THREE.SRGBColorSpace;
    const chimpOne = loader.load("/israel-room/chimp-portrait.jpg");
    chimpOne.colorSpace = THREE.SRGBColorSpace;
    const chimpTwo = loader.load("/israel-room/chimp-wall.jpg");
    chimpTwo.colorSpace = THREE.SRGBColorSpace;

    const loadPortrait = (src: string) => new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    });

    const gold = new THREE.MeshStandardMaterial({ color: 0xffc72e, metalness: .88, roughness: .19 });
    const bronze = new THREE.MeshStandardMaterial({ color: 0x9b6b32, metalness: .68, roughness: .31 });
    const deepBlue = new THREE.MeshStandardMaterial({ color: 0x102d78, metalness: .42, roughness: .36 });

    const flagTexture = canvasTexture(900, 560, (ctx) => {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 900, 560);
      ctx.fillStyle = "#1459c7"; ctx.fillRect(0, 72, 900, 62); ctx.fillRect(0, 426, 900, 62);
      ctx.strokeStyle = "#1459c7"; ctx.lineWidth = 24;
      const triangle = (flip: boolean) => { ctx.beginPath(); ctx.moveTo(450, flip ? 198 : 362); ctx.lineTo(340, flip ? 356 : 204); ctx.lineTo(560, flip ? 356 : 204); ctx.closePath(); ctx.stroke(); };
      triangle(false); triangle(true);
    });
    [[-5.4,4.7,-4.86,0],[5.4,4.7,-4.86,0],[-6.88,4.4,2.1,Math.PI/2],[6.88,4.4,2.1,-Math.PI/2]].forEach(([x,y,z,ry]) => {
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.4, 10, 4), new THREE.MeshBasicMaterial({ map: flagTexture, side: THREE.DoubleSide }));
      flag.position.set(x,y,z); flag.rotation.y = ry; scene.add(flag);
    });

    const starMaterial = new THREE.LineBasicMaterial({ color: 0x7be9ff, transparent: true, opacity: .92 });
    const addStar = (x: number, y: number, z: number, ry: number, scale: number) => {
      const points: number[] = [];
      const triangles = [[0,1,.866,-.5,-.866,-.5],[0,-1,.866,.5,-.866,.5]];
      triangles.forEach((vertices) => { for (let i=0;i<3;i++) { const a=i*2,b=((i+1)%3)*2; points.push(vertices[a],vertices[a+1],0,vertices[b],vertices[b+1],0); } });
      const star = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute(points,3)),starMaterial);
      star.position.set(x,y,z); star.rotation.y=ry; star.scale.setScalar(scale); scene.add(star);
    };
    for (let i=0;i<13;i++) addStar(-5.8+(i%7)*1.9, 5.25+Math.sin(i)*.2, -4.82, 0, .18+(i%3)*.05);

    const chimpFrames: Array<[THREE.Texture, number, number, number, number]> = [[chimpOne,-6.86,2.7,-1.7,Math.PI/2],[chimpTwo,6.86,2.7,-1.4,-Math.PI/2]];
    chimpFrames.forEach(([map,x,y,z,ry]) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.9,3.4,.15),gold); frame.position.set(x,y,z); frame.rotation.y=ry; scene.add(frame);
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.62,3.1),new THREE.MeshBasicMaterial({map})); photo.position.set(x+(ry>0?.09:-.09),y,z); photo.rotation.y=ry; scene.add(photo);
    });

    const moneyLabel = canvasTexture(256,256,(ctx)=>{ctx.fillStyle="#f7d23d";ctx.fillRect(0,0,256,256);ctx.fillStyle="#15592d";ctx.textAlign="center";ctx.font="900 74px Arial";ctx.fillText("$$$",128,155);});
    const addMoneyBag = (x:number,z:number) => {
      const bag = new THREE.Group(); bag.position.set(x,.52,z);
      const sack = new THREE.Mesh(new THREE.SphereGeometry(.43,24,16),new THREE.MeshStandardMaterial({color:0xc8a34c,roughness:.78})); sack.scale.y=1.18; sack.castShadow=true; bag.add(sack);
      const neck = new THREE.Mesh(new THREE.ConeGeometry(.28,.42,20),new THREE.MeshStandardMaterial({color:0xb68b37,roughness:.8})); neck.position.y=.48; bag.add(neck);
      const label = new THREE.Mesh(new THREE.CircleGeometry(.23,28),new THREE.MeshBasicMaterial({map:moneyLabel})); label.position.set(0,.04,.42); bag.add(label); scene.add(bag);
    };
    [[-4.8,-2.7],[-3.8,-3.4],[4.6,-2.8],[3.8,-3.55]].forEach(([x,z])=>addMoneyBag(x,z));
    for(let i=0;i<18;i++){
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.68,.18,.32),gold);
      bar.position.set(-5.1+(i%6)*.72,.11+Math.floor(i/6)*.19,3.45+Math.floor(i/6)*.12); bar.rotation.y=(i%2?-.07:.07); bar.castShadow=true; scene.add(bar);
    }

    const heart = heartShape();
    const heartFrameGeometry = new THREE.ExtrudeGeometry(heart,{depth:.11,bevelEnabled:true,bevelSize:.05,bevelThickness:.04,bevelSegments:3});
    const heartArtGeometry = new THREE.ShapeGeometry(heart);
    heartArtGeometry.computeBoundingBox();
    const heartBounds = heartArtGeometry.boundingBox!;
    const heartPositions = heartArtGeometry.getAttribute("position");
    const heartUvs: number[] = [];
    for (let index = 0; index < heartPositions.count; index++) {
      heartUvs.push(
        (heartPositions.getX(index) - heartBounds.min.x) / (heartBounds.max.x - heartBounds.min.x),
        (heartPositions.getY(index) - heartBounds.min.y) / (heartBounds.max.y - heartBounds.min.y),
      );
    }
    heartArtGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(heartUvs, 2));
    const addHeartPoster = (map:THREE.Texture,x:number,y:number,z:number,ry:number,scale:number) => {
      const group=new THREE.Group(); group.position.set(x,y,z); group.rotation.y=ry; group.scale.setScalar(scale);
      const frame=new THREE.Mesh(heartFrameGeometry,gold); frame.position.z=-.04; group.add(frame);
      const art=new THREE.Mesh(heartArtGeometry,new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide})); art.position.z=.09; group.add(art); scene.add(group);
    };

    Promise.all([loadPortrait("/israel-room/netanyahu-1.jpg"),loadPortrait("/israel-room/netanyahu-2.jpg"),loadPortrait("/israel-room/yoohoo-carton.png")]).then(([portraitOne,portraitTwo,yoohooImage])=>{
      const wallpaper=canvasTexture(1200,800,(ctx)=>{
        const gradient=ctx.createLinearGradient(0,0,1200,800); gradient.addColorStop(0,"#152d89"); gradient.addColorStop(.5,"#7d2db2"); gradient.addColorStop(1,"#ec3c8e"); ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,800);
        const tiles=[[portraitOne,70,50],[portraitTwo,370,30],[portraitOne,680,55],[portraitTwo,960,25],[portraitTwo,170,420],[portraitOne,520,390],[portraitTwo,850,430]] as const;
        tiles.forEach(([image,x,y])=>{ctx.save();ctx.beginPath();ctx.arc(x+95,y+95,88,0,Math.PI*2);ctx.clip();ctx.drawImage(image,x,y,190,190);ctx.restore();ctx.strokeStyle="#ffde55";ctx.lineWidth=11;ctx.beginPath();ctx.arc(x+95,y+95,92,0,Math.PI*2);ctx.stroke();});
        for(let i=0;i<3;i++){ctx.drawImage(yoohooImage,70+i*390,258,112,190);ctx.drawImage(yoohooImage,275+i*340,575,75,130);}
        ctx.fillStyle="#fff3a5";ctx.font="900 34px Arial";ctx.textAlign="center";ctx.fillText("♥ BB NETTY-YOO-HOO FOREVER ♥",600,770);
      });
      wallpaper.wrapS=THREE.RepeatWrapping;wallpaper.wrapT=THREE.RepeatWrapping;wallpaper.repeat.set(1.55,1);
      [back,left,right].forEach((wall)=>{const material=wall.material as THREE.MeshStandardMaterial;material.map=wallpaper;material.color.set(0xffffff);material.needsUpdate=true;});
      const posters:Array<[string,string,HTMLImageElement,[string,string],number,number,number,number,number]>=[
        ["PRIME MINISTER OF MY HEART","BENJAMIN NETANYAHU",portraitOne,["#1253bd","#ff4ca8"],-3.4,3.0,-4.76,0,1.2],
        ["BB NETTY-YOO-HOO CUTIE PATOOTIE","YOO-HOO FOREVER",portraitTwo,["#5b20c9","#ff276d"],3.4,3.0,-4.76,0,1.2],
        ["BIG TIME CRUSH","HEART-EYES FOR BB",portraitOne,["#ff2c83","#315fd6"],-6.76,3.2,1.1,Math.PI/2,.9],
        ["MY SWEET BB","GOLD-PLATED FEELINGS",portraitTwo,["#233caa","#f5b82d"],6.76,3.2,1.0,-Math.PI/2,.9],
        ["NETTY-YOO-HOO","THE CRUSH IS REAL",portraitTwo,["#7b1fd1","#ff4e77"],-1.25,4.55,-4.72,0,.62],
        ["LOVE SHRINE V2","70% BB · 30% YOO-HOO",portraitOne,["#164fc0","#ff4f9d"],1.25,4.55,-4.72,0,.62],
      ];
      posters.forEach(([title,subtitle,image,palette,x,y,z,ry,scale])=>addHeartPoster(posterTexture(title,subtitle,image,palette),x,y,z,ry,scale));

      const faceTexture=canvasTexture(512,512,(ctx)=>{ctx.fillStyle="#8f642f";ctx.fillRect(0,0,512,512);ctx.globalAlpha=.72;ctx.drawImage(portraitTwo,20,20,472,472);ctx.globalCompositeOperation="color";ctx.fillStyle="#a97839";ctx.fillRect(0,0,512,512);});
      const statue=new THREE.Group(); statue.position.set(0,0,-1.1);
      const base1=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.65,.35,48),bronze);base1.position.y=.18;statue.add(base1);
      const base2=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.38,.48,48),bronze);base2.position.y=.58;statue.add(base2);
      const leg=(x:number)=>{const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(.21,1.25,10,24),bronze);mesh.position.set(x,1.48,0);mesh.castShadow=true;statue.add(mesh);};leg(-.27);leg(.27);
      [-.27,.27].forEach(x=>{const shoe=new THREE.Mesh(new THREE.BoxGeometry(.46,.22,.72),bronze);shoe.position.set(x,.83,.18);statue.add(shoe);});
      const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.68,1.25,12,32),bronze);torso.position.y=2.65;torso.scale.set(1,.98,.62);torso.castShadow=true;statue.add(torso);
      const shoulders=new THREE.Mesh(new THREE.SphereGeometry(.86,32,20),bronze);shoulders.position.y=3.03;shoulders.scale.set(1,.46,.58);statue.add(shoulders);
      const neck=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.35,24),bronze);neck.position.y=3.55;statue.add(neck);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.43,48,32),bronze);head.position.y=3.95;head.scale.set(.92,1.12,.88);statue.add(head);
      const hair=new THREE.Mesh(new THREE.SphereGeometry(.435,48,18,0,Math.PI*2,0,Math.PI*.5),deepBlue);hair.position.y=4.02;hair.scale.set(.94,1.1,.9);statue.add(hair);
      const face=new THREE.Mesh(new THREE.CircleGeometry(.31,48),new THREE.MeshBasicMaterial({map:faceTexture,transparent:true,opacity:.84}));face.position.set(0,3.94,.39);statue.add(face);
      const nose=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,18),bronze);nose.position.set(0,3.91,.49);nose.rotation.x=Math.PI/2;statue.add(nose);
      const tie=new THREE.Mesh(new THREE.ConeGeometry(.105,.75,4),new THREE.MeshStandardMaterial({color:0x8f1717,metalness:.4}));tie.position.set(0,2.83,.47);tie.rotation.z=Math.PI;statue.add(tie);
      const addArm=(side:number,raised:boolean)=>{const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.72,8,20),bronze);upper.position.set(side*.72,2.85,.08);upper.rotation.z=side*(raised?-.68:.35);statue.add(upper);const lower=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.62,8,20),bronze);lower.position.set(side*(raised?1.03:.88),raised?3.22:2.28,raised?.35:.16);lower.rotation.z=side*(raised?-1.02:-.2);lower.rotation.x=raised?.35:0;statue.add(lower);};addArm(1,true);addArm(-1,false);
      const held=makeCan(yoohooTexture,1.28,3.58,.58,.9);held.userData.collectible=false;statue.add(held);
      const straw=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.82,10),new THREE.MeshStandardMaterial({color:0xff3d75}));straw.position.set(.92,3.78,.48);straw.rotation.z=-.68;statue.add(straw);
      const plaque=new THREE.Mesh(new THREE.BoxGeometry(1.9,.35,.06),deepBlue);plaque.position.set(0,.54,1.2);statue.add(plaque);scene.add(statue);
    });

    const cans:THREE.Group[]=[];
    for(let i=0;i<22;i++){
      const x=-5.7+(i%8)*1.58+(i%2)*.16;
      const z=3.65-Math.floor(i/8)*1.18;
      const can=makeCan(yoohooTexture,x,.48+(i%3)*.04,z,.82+(i%4)*.08);
      can.rotation.z=(i%5-2)*.13;can.userData.canIndex=i;cans.push(can);scene.add(can);
    }

    const squiggleGeometry=new THREE.TorusKnotGeometry(.16,.052,70,10,2,3);
    const squiggles:THREE.Mesh[]=[];
    for(let i=0;i<38;i++){
      const material=new THREE.MeshStandardMaterial({color:i%3===0?0xffd83d:i%3===1?0xff3d91:0x55dcff,emissive:i%3===0?0x765000:i%3===1?0x6d0d3d:0x0b4a73,emissiveIntensity:1.35});
      const squiggle=new THREE.Mesh(squiggleGeometry,material);squiggle.position.set(-6.1+(i%10)*1.35,4.75+(i%4)*.24,-4.58+(i%3)*.04);squiggle.scale.set(.8+(i%3)*.18,.8+(i%3)*.18,.32);squiggles.push(squiggle);scene.add(squiggle);
    }

    let yaw=0,pitch=-.03,distance=8.7;
    const target=new THREE.Vector3(0,2.2,-1.1);
    const cameraDrag={active:false,x:0,y:0};
    let activeCan:THREE.Group|null=null;
    let canMoved=false;
    const lastCanPoint=new THREE.Vector3();
    let lastCanTime=performance.now();
    const updateCamera=()=>{camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);};
    updateCamera();
    const rayFrom=(event:PointerEvent)=>{const bounds=renderer.domElement.getBoundingClientRect();const pointer=new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);return ray;};
    const findCan=(object:THREE.Object3D)=>{let node:THREE.Object3D|null=object;while(node?.parent&&node.userData.collectible!==true)node=node.parent;return node?.userData.collectible===true?node as THREE.Group:null;};
    const collectCan=(can:THREE.Group)=>{can.visible=false;const previous=Number.parseInt(localStorage.getItem(YOOHOO_STORAGE_KEY)??"69",10);localStorage.setItem(YOOHOO_STORAGE_KEY,String((Number.isFinite(previous)?previous:69)+1));window.dispatchEvent(new Event(YOOHOO_BALANCE_EVENT));setMessage("YOO-HOO COLLECTED · CURRENCY +1");};
    const onDown=(event:PointerEvent)=>{
      renderer.domElement.setPointerCapture(event.pointerId);
      const hit=rayFrom(event).intersectObjects(cans.filter(can=>can.visible),true)[0];
      const picked=hit?findCan(hit.object):null;
      if(picked){activeCan=picked;activeCan.userData.held=true;canMoved=false;lastCanPoint.copy(activeCan.position);lastCanTime=performance.now();setMessage("THROW IT LIKE DR. BONGO");return;}
      cameraDrag.active=true;cameraDrag.x=event.clientX;cameraDrag.y=event.clientY;
    };
    const onMove=(event:PointerEvent)=>{
      if(activeCan){const ray=rayFrom(event);const normal=camera.getWorldDirection(new THREE.Vector3());const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,activeCan.position);const point=new THREE.Vector3();if(ray.ray.intersectPlane(plane,point)){const now=performance.now();const dt=Math.max((now-lastCanTime)/1000,.016);const velocity=activeCan.userData.velocity as THREE.Vector3;velocity.copy(point).sub(lastCanPoint).multiplyScalar(1/dt).clampLength(0,9);lastCanPoint.copy(point);lastCanTime=now;activeCan.position.set(THREE.MathUtils.clamp(point.x,-6.25,6.25),THREE.MathUtils.clamp(point.y,.46,5.45),THREE.MathUtils.clamp(point.z,-4.45,4.1));canMoved=true;}return;}
      if(!cameraDrag.active)return;const dx=event.clientX-cameraDrag.x,dy=event.clientY-cameraDrag.y;cameraDrag.x=event.clientX;cameraDrag.y=event.clientY;yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.004,-.34,.42);updateCamera();
    };
    const onUp=()=>{if(activeCan){activeCan.userData.held=false;if(!canMoved)collectCan(activeCan);else setMessage("YOO-HOO IN FLIGHT · GRAB IT AGAIN");activeCan=null;return;}cameraDrag.active=false;};
    const onWheel=(event:WheelEvent)=>{event.preventDefault();distance=THREE.MathUtils.clamp(distance+event.deltaY*.006,4.3,11.8);updateCamera();};
    const move=(forward:number,sideways:number)=>{target.x=THREE.MathUtils.clamp(target.x+Math.cos(yaw)*sideways+Math.sin(yaw)*forward,-4.5,4.5);target.z=THREE.MathUtils.clamp(target.z-Math.cos(yaw)*forward+Math.sin(yaw)*sideways,-3.8,2.8);updateCamera();};
    const onKey=(event:KeyboardEvent)=>{const key=event.key.toLowerCase();if(key==="w"||key==="arrowup")move(.25,0);if(key==="s"||key==="arrowdown")move(-.25,0);if(key==="a"||key==="arrowleft")move(0,-.25);if(key==="d"||key==="arrowright")move(0,.25);};
    const resize=()=>{camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);};
    renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointermove",onMove);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointercancel",onUp);renderer.domElement.addEventListener("wheel",onWheel,{passive:false});window.addEventListener("keydown",onKey);window.addEventListener("resize",resize);
    let frame=0;const clock=new THREE.Clock();
    const animate=()=>{const dt=Math.min(clock.getDelta(),.035);const elapsed=clock.elapsedTime;cans.forEach((can,index)=>{if(!can.visible||can.userData.held)return;const velocity=can.userData.velocity as THREE.Vector3;const angular=can.userData.angularVelocity as THREE.Vector3;velocity.y-=6.2*dt;can.position.addScaledVector(velocity,dt);can.rotation.x+=angular.x*dt;can.rotation.y+=angular.y*dt;can.rotation.z+=angular.z*dt;if(can.position.y<.46){can.position.y=.46;if(Math.abs(velocity.y)>.18)velocity.y*=-.58;else velocity.y=0;velocity.x*=.88;velocity.z*=.88;}if(Math.abs(can.position.x)>6.3){can.position.x=Math.sign(can.position.x)*6.3;velocity.x*=-.66;}if(can.position.z>4.15||can.position.z<-4.45){can.position.z=THREE.MathUtils.clamp(can.position.z,-4.45,4.15);velocity.z*=-.66;}if(velocity.lengthSq()<.002&&can.position.y<=.47)can.rotation.y+=.0015*Math.sin(elapsed+index);});squiggles.forEach((shape,index)=>{shape.rotation.x+=dt*(.18+(index%4)*.04);shape.rotation.y+=dt*(.32+(index%3)*.06);shape.position.y+=Math.sin(elapsed*1.3+index)*.0008;});renderer.render(scene,camera);frame=requestAnimationFrame(animate);};animate();
    return()=>{cancelAnimationFrame(frame);renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("pointerup",onUp);renderer.domElement.removeEventListener("pointercancel",onUp);renderer.domElement.removeEventListener("wheel",onWheel);window.removeEventListener("keydown",onKey);window.removeEventListener("resize",resize);renderer.dispose();scene.traverse((object)=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});if(renderer.domElement.parentElement===mount)mount.removeChild(renderer.domElement);};
  },[]);

  return <main className="israel-room">
    <div className="israel-room__viewport" ref={mountRef} aria-label="Interactive 3D Israel love shrine. Drag to look, scroll to zoom, use WASD to move, and drag or click Yoo-hoo cans." />
    <div className="israel-room__wash" aria-hidden="true" />
    <a className="israel-room__back" href="/">← WORLD SELECT</a>
    <header className="israel-room__title"><small>UNLOCKED TERRITORY · ISRAEL</small><h1>BB NETTY-YOO-HOO LOVE SHRINE</h1><p>♥ 70% BENJAMIN NETANYAHU · 30% YOO-HOO ♥</p></header>
    <aside className="israel-room__legend"><b>3D SHRINE CONTROLS</b><span>DRAG EMPTY SPACE · LOOK</span><span>DRAG A CAN · THROW</span><span>CLICK A CAN · COLLECT</span><span>SCROLL · ZOOM</span><span>WASD / ARROWS · MOVE</span><small>Chimp photos: <a href="https://commons.wikimedia.org/wiki/File:Chimpanzee_Portrait.jpg" target="_blank" rel="noreferrer">Ewing</a> &amp; <a href="https://commons.wikimedia.org/wiki/File:Chimp_portrait_(5312048385).jpg" target="_blank" rel="noreferrer">Becker1999</a>, CC BY 2.0</small></aside>
    <p className="israel-room__message" aria-live="polite">{message}</p>
    <div className="israel-room__hearts" aria-hidden="true">♥ ✦ ♥ ✦ ♥</div>
  </main>;
}
