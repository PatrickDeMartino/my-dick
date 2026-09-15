"use client";


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

// Kept from Claude's 3D Brain Room pass: the compact white lab-rat model.
// The surrounding room and every other route remain from the complete v58 site.
function makeClaudeLabRat() {
  const white = new THREE.MeshStandardMaterial({ color: 0xf2ece2, roughness: 0.7 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf0a8b6, roughness: 0.55 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.2 });
  const group = new THREE.Group();

  const body = part(group, new THREE.SphereGeometry(0.16, 16, 12), white, [0, 0.18, 0], [1, 0.82, 1.5]);
  const head = part(group, new THREE.SphereGeometry(0.1, 14, 10), white, [0, 0.2, 0.22]);
  const snout = part(group, new THREE.ConeGeometry(0.05, 0.09, 8), pink, [0, 0.17, 0.32]);
  snout.rotation.x = Math.PI / 2;

  for (const side of [-1, 1]) {
    const ear = part(group, new THREE.CircleGeometry(0.05, 12), pink, [side * 0.08, 0.28, 0.2]);
    ear.rotation.y = side * 0.6;
    part(group, new THREE.SphereGeometry(0.015, 6, 6), eye, [side * 0.06, 0.22, 0.28]);
  }

  const tail = part(group, new THREE.CylinderGeometry(0.012, 0.006, 0.4, 5), pink, [0, 0.13, -0.32]);
  tail.rotation.x = Math.PI / 2.2;

  // Scale the unchanged model uniformly so it remains readable in the older,
  // wider Brain Room camera while retaining Claude's proportions.
  group.scale.setScalar(2.4);
  const limbs: THREE.Group[] = [];
  for (const x of [-.12,.12]) for (const z of [-.13,.13]) {
    const leg = new THREE.Group(); leg.position.set(x,.13,z); group.add(leg);
    part(leg,new THREE.CapsuleGeometry(.025,.07,4,8),white,[0,-.035,0]);
    part(leg,new THREE.SphereGeometry(.027,8,6),pink,[0,-.085,.025],[1,.5,1.6]);
    limbs.push(leg);
  }
  group.userData = { torso: body, head, limbs, kind: "rat", walk: 0, vy: 0 };
  return group;
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
  return kind === "rat" ? makeClaudeLabRat() : root;
}


