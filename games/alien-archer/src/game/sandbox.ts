import * as THREE from "three";
import { makeAK47, makeRevolver } from "./weapons";

export type SpawnKind = "vehicle" | "jetpack" | "ak47" | "revolver" | "bow" | "arrow" | "pepsi" | "yoohoo" | "monster" | "rat-meat" | "biplane" | "penguin" | "bongo";

const mat = (color: number, metalness = .05, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: .48, metalness, emissive, emissiveIntensity: emissive ? .35 : 0, flatShading: true });
const mesh = (root: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x=0, y=0, z=0, rx=0, ry=0, rz=0) => {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x,y,z); item.rotation.set(rx,ry,rz); item.castShadow=true; root.add(item); return item;
};

function can(label: "PEPSI" | "YOO-HOO" | "MONSTER" | "RAT MEAT") {
  const root = new THREE.Group();
  const body = label === "PEPSI" ? mat(0x1454c8,.55) : label === "MONSTER" ? mat(0x101815,.7,0x184a24) : label === "RAT MEAT" ? mat(0xb9c1ca,.75) : mat(0x6b2d16,.42);
  mesh(root,new THREE.CylinderGeometry(.28,.28,.72,18),body);
  mesh(root,new THREE.TorusGeometry(.25,.025,6,20),mat(0xd7e1e8,.85),0,.35,0,Math.PI/2);
  mesh(root,new THREE.TorusGeometry(.25,.025,6,20),mat(0xd7e1e8,.85),0,-.35,0,Math.PI/2);
  const badge=mesh(root,new THREE.BoxGeometry(.44,.2,.025),mat(label==="PEPSI"?0xf3f5ff:label==="MONSTER"?0x65ff48:label==="RAT MEAT"?0xe34f68:0xf1d45b),0,0,.275);
  badge.userData.label=label;
  return root;
}

function biplane() {
  const root=new THREE.Group(), red=mat(0xd83b3b,.35), cream=mat(0xf2dfad), dark=mat(0x252b32,.6), glass=mat(0x7eeeff,.2,0x155b66);
  mesh(root,new THREE.BoxGeometry(1.45,.22,.32),red);
  mesh(root,new THREE.BoxGeometry(1.9,.07,.48),cream,0,.32,0);
  mesh(root,new THREE.BoxGeometry(1.72,.07,.44),cream,0,-.12,0);
  [-.65,.65].forEach(x=>{mesh(root,new THREE.CylinderGeometry(.025,.025,.45,6),dark,x,.1,.17);mesh(root,new THREE.CylinderGeometry(.025,.025,.45,6),dark,x,.1,-.17)});
  mesh(root,new THREE.CylinderGeometry(.09,.13,.55,10),red,0,0,-.42,Math.PI/2);
  const prop=mesh(root,new THREE.BoxGeometry(.06,1.15,.08),dark,0,0,-.73,0,0,.18); prop.userData.propeller=true;
  mesh(root,new THREE.SphereGeometry(.2,10,7),glass,0,.17,.12);
  mesh(root,new THREE.BoxGeometry(.55,.06,.22),red,0,.17,.72);
  root.scale.setScalar(1.3); return root;
}

function penguin() {
  const root=new THREE.Group(), black=mat(0x12161b), white=mat(0xe8f4f4), orange=mat(0xffa12c);
  mesh(root,new THREE.SphereGeometry(.38,12,8),black,0,.48,0); mesh(root,new THREE.SphereGeometry(.28,12,8),white,0,.46,.25);
  mesh(root,new THREE.SphereGeometry(.3,12,8),black,0,1.02,0); mesh(root,new THREE.ConeGeometry(.11,.3,5),orange,0,1,.34,Math.PI/2);
  [-1,1].forEach(s=>mesh(root,new THREE.CapsuleGeometry(.07,.42,4,8),black,s*.4,.55,0,0,0,s*.55)); return root;
}

function bongo() {
  const root=new THREE.Group(), fur=mat(0x7a351d), dark=mat(0x3c170f), face=mat(0xb8794a);
  mesh(root,new THREE.SphereGeometry(.48,12,9),fur,0,.55,0); mesh(root,new THREE.SphereGeometry(.34,12,8),fur,0,1.15,0); mesh(root,new THREE.SphereGeometry(.25,10,7),face,0,1.08,.27);
  [-1,1].forEach(s=>{mesh(root,new THREE.CapsuleGeometry(.1,.65,4,8),dark,s*.48,.55,0,0,0,s*.62);mesh(root,new THREE.CapsuleGeometry(.11,.55,4,8),dark,s*.25,.03,0,0,0,s*.18)}); return root;
}

export function makeSandboxProp(kind: SpawnKind) {
  if(kind==="ak47") return makeAK47().root;
  if(kind==="revolver") return makeRevolver().root;
  if(kind==="pepsi") return can("PEPSI");
  if(kind==="yoohoo") return can("YOO-HOO");
  if(kind==="monster") return can("MONSTER");
  if(kind==="rat-meat") return can("RAT MEAT");
  if(kind==="biplane") return biplane();
  if(kind==="penguin") return penguin();
  if(kind==="bongo") return bongo();
  const root=new THREE.Group();
  if(kind==="bow") { const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.65,.16),new THREE.Vector3(0,0,-.12),new THREE.Vector3(0,.65,.16)]); mesh(root,new THREE.TubeGeometry(curve,18,.035,6,false),mat(0x744421)); mesh(root,new THREE.CylinderGeometry(.009,.009,1.32,5),mat(0xe8f5f5),0,0,.15); }
  if(kind==="arrow") { mesh(root,new THREE.CylinderGeometry(.025,.025,1.4,7),mat(0x744421),0,0,0,Math.PI/2); mesh(root,new THREE.ConeGeometry(.08,.25,5),mat(0xd9e5ef,.8),0,0,.82,Math.PI/2); }
  if(kind==="jetpack") { mesh(root,new THREE.BoxGeometry(.55,.72,.25),mat(0x404b58,.8)); [-1,1].forEach(s=>{mesh(root,new THREE.CylinderGeometry(.13,.17,.65,10),mat(0x69798a,.8),s*.34,0,0);mesh(root,new THREE.ConeGeometry(.13,.38,9),mat(0x3af3ff,.1,0x26d8ff),s*.34,-.53,0,Math.PI)}); }
  if(kind==="vehicle") { mesh(root,new THREE.BoxGeometry(1.5,.35,.9),mat(0x8dff38,.5),0,.25,0); [-1,1].forEach(x=>[-1,1].forEach(z=>mesh(root,new THREE.CylinderGeometry(.22,.22,.18,12),mat(0x17191d,.7),x*.62,.08,z*.42,Math.PI/2))); mesh(root,new THREE.BoxGeometry(.7,.35,.65),mat(0x6336a7,.45),0,.58,0); }
  return root;
}
