import * as THREE from 'three';
import {furMaterial} from './surface';
import {textTexture} from './lab-art';
/** Original Dr. Bongo geometry moved from the standalone neural-link room. */
export function makeDrBongo(){
    const furMat = furMaterial(0xb9541e);
    const furLightMat = new THREE.MeshStandardMaterial({ color: 0xd2762f, roughness: 0.92 });
    const furDarkMat = new THREE.MeshStandardMaterial({ color: 0x652508, roughness: 1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xad7658, roughness: 0.82 });
    const skinDarkMat = new THREE.MeshStandardMaterial({ color: 0x5e3528, roughness: 0.88 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x120d09, roughness: 0.16, metalness: 0.05 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x9dff73, emissive: 0x2b8b55, emissiveIntensity: 1.5, roughness: 0.25 });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x35100e, roughness: 0.72 });
    const brainBumpTexture=furMaterial(0xffffff).map!;
    const brainMat = new THREE.MeshPhysicalMaterial({
      color: 0xd96583,
      emissive: 0x300817,
      emissiveIntensity: 0.25,
      roughness: 0.64,
      bumpMap: brainBumpTexture,
      bumpScale: 0.026,
      clearcoat: 0.32,
      clearcoatRoughness: 0.4,
      sheen: 0.38,
      sheenColor: new THREE.Color(0xffa4b7),
    });
    const sulcusMat = new THREE.MeshStandardMaterial({ color: 0x6e1932, roughness: 0.86 });
    const vesselMat = new THREE.MeshPhysicalMaterial({ color: 0x8f1731, roughness: 0.52, clearcoat: 0.5 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xa7bac4, roughness: 0.28, metalness: 0.82 });
    const cyanImplantMat = new THREE.MeshStandardMaterial({
      color: 0x42eaff,
      emissive: 0x087f9c,
      emissiveIntensity: 1.8,
      roughness: 0.3,
      metalness: 0.45,
    });
    const purpleImplantMat = new THREE.MeshStandardMaterial({
      color: 0xca55ff,
      emissive: 0x5d117b,
      emissiveIntensity: 1.5,
      roughness: 0.32,
      metalness: 0.38,
    });

    const ape = new THREE.Group();
    const bodyRig = new THREE.Group();
    ape.add(bodyRig);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.39, 22, 18), furDarkMat);
    belly.position.set(0, 0.35, -0.015);
    belly.scale.set(1.05, 1.14, 0.82);
    bodyRig.add(belly);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 18), furMat);
    chest.position.set(0, 0.58, 0.015);
    chest.scale.set(1.23, 0.88, 0.84);
    bodyRig.add(chest);

    const chestFlare = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), furLightMat);
    chestFlare.position.set(0, 0.58, 0.255);
    chestFlare.scale.set(1.2, 1, 0.2);
    bodyRig.add(chestFlare);

    const headRig = new THREE.Group();
    headRig.position.set(0, 0.97, 0.02);
    bodyRig.add(headRig);

    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 28, 22, 0, Math.PI * 2, 0.88, Math.PI - 0.88),
      furMat,
    );
    cranium.scale.set(0.94, 1.04, 0.92);
    headRig.add(cranium);

    // The upper third of the skull is physically absent. In its place, the
    // brain uses denser geometry, wet tissue shading, mapped sulci and tiny
    // surface vessels so its fidelity deliberately contrasts with the PS2 body.
    const brainRig = new THREE.Group();
    brainRig.position.set(0, 0.205, 0.205);
    const brainTissueRig = new THREE.Group();
    const brainLeft = new THREE.Mesh(new THREE.SphereGeometry(0.235, 34, 26), brainMat);
    brainLeft.position.set(-0.105, 0.075, 0.012);
    brainLeft.scale.set(0.86, 0.78, 0.8);
    const brainRight = brainLeft.clone();
    brainRight.position.x = 0.105;
    brainTissueRig.add(brainLeft, brainRight);

    // Layered winding grooves sit just above the tissue surface, giving the
    // hemispheres recognizable gyri instead of a cluster of pink spheres.
    for (const side of [-1, 1]) {
      const centerX = side * 0.105;
      for (let row = 0; row < 6; row++) {
        const points: THREE.Vector3[] = [];
        for (let point = 0; point < 10; point++) {
          const progress = point / 9;
          const localX = (progress - 0.5) * 0.25;
          const y = -0.035 + row * 0.047 + Math.sin(progress * Math.PI * 4 + row * 1.7) * 0.014;
          const normalizedX = localX / 0.145;
          const normalizedY = (y - 0.075) / 0.19;
          const surface = Math.max(0, 1 - normalizedX * normalizedX - normalizedY * normalizedY);
          points.push(new THREE.Vector3(centerX + localX, y, 0.155 + surface * 0.065));
        }
        const groove = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, 0.008, 7, false),
          sulcusMat,
        );
        brainTissueRig.add(groove);
      }
    }
    const fissurePoints = Array.from({ length: 9 }, (_, index) => {
      const y = -0.075 + index * 0.041;
      return new THREE.Vector3(Math.sin(index * 1.8) * 0.008, y, 0.225);
    });
    brainTissueRig.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fissurePoints), 32, 0.012, 8, false),
      sulcusMat,
    ));

    const vesselPaths = [
      [new THREE.Vector3(-0.22, 0.01, 0.17), new THREE.Vector3(-0.12, 0.08, 0.226), new THREE.Vector3(-0.04, 0.18, 0.205)],
      [new THREE.Vector3(0.21, -0.01, 0.17), new THREE.Vector3(0.15, 0.09, 0.225), new THREE.Vector3(0.06, 0.2, 0.2)],
    ];
    for (const points of vesselPaths) {
      brainTissueRig.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 22, 0.005, 6, false),
        vesselMat,
      ));
    }
    brainRig.add(brainTissueRig);

    const skullRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.027, 10, 36), chromeMat);
    skullRim.scale.y = 0.63;
    skullRim.position.z = 0.105;
    brainRig.add(skullRim);

    const chipMat = new THREE.MeshStandardMaterial({ color: 0x173d2b, roughness: 0.32, metalness: 0.78 });
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.045), chipMat);
    chip.position.set(0.085, 0.125, 0.245);
    chip.rotation.z = -0.1;
    brainRig.add(chip);
    const chipLabelTexture=textTexture(['PROPERTY OF','THE CIA'],'#d8ffbd','#173d2b');
    const chipLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.184, 0.112),
      new THREE.MeshBasicMaterial({ map: chipLabelTexture, transparent: true }),
    );
    chipLabel.position.set(0.085, 0.125, 0.269);
    chipLabel.rotation.z = -0.1;
    brainRig.add(chipLabel);
    for (const side of [-1, 1]) {
      for (let pin = 0; pin < 5; pin++) {
        const chipPin = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.01, 0.012), chromeMat);
        chipPin.position.set(0.085 + side * 0.112, 0.08 + pin * 0.023, 0.247);
        brainRig.add(chipPin);
      }
    }
    const implantPorts = [
      [-0.21, 0.08, cyanImplantMat],
      [-0.05, 0.205, purpleImplantMat],
      [0.23, 0.025, cyanImplantMat],
    ] as const;
    for (const [x, y, material] of implantPorts) {
      const port = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.055, 8), material);
      port.rotation.x = Math.PI / 2;
      port.position.set(x, y, 0.235);
      brainRig.add(port);
    }
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x17192b,
      emissive: 0x1b0b31,
      emissiveIntensity: 0.7,
      roughness: 0.46,
      metalness: 0.65,
    });
    const cablePaths = [
      [new THREE.Vector3(-0.05, 0.205, 0.25), new THREE.Vector3(0.01, 0.19, 0.3), new THREE.Vector3(0.07, 0.17, 0.27)],
      [new THREE.Vector3(0.185, 0.13, 0.26), new THREE.Vector3(0.255, 0.1, 0.29), new THREE.Vector3(0.23, 0.025, 0.25)],
      [new THREE.Vector3(-0.015, 0.1, 0.27), new THREE.Vector3(-0.14, 0.04, 0.29), new THREE.Vector3(-0.21, 0.08, 0.25)],
    ];
    for (const points of cablePaths) {
      const curve = new THREE.CatmullRomCurve3(points);
      brainRig.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.016, 6, false), cableMaterial));
    }
    headRig.add(brainRig);

    const facePatch = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 18), skinMat);
    facePatch.position.set(0, -0.035, 0.205);
    facePatch.scale.set(0.88, 1.08, 0.48);
    headRig.add(facePatch);

    const cheekGeo = new THREE.SphereGeometry(0.145, 18, 14);
    const cheekL = new THREE.Mesh(cheekGeo, skinMat);
    cheekL.position.set(-0.215, -0.08, 0.25);
    cheekL.scale.set(1, 0.72, 0.55);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.215;
    headRig.add(cheekL, cheekR);

    const earGeo = new THREE.SphereGeometry(0.105, 16, 12);
    const earL = new THREE.Mesh(earGeo, skinDarkMat);
    earL.position.set(-0.34, 0.025, 0);
    earL.scale.set(0.5, 0.9, 0.5);
    const earR = earL.clone();
    earR.position.x = 0.34;
    headRig.add(earL, earR);

    const eyeGeo = new THREE.SphereGeometry(0.052, 16, 12);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.105, 0.055, 0.405);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.105;
    headRig.add(eyeL, eyeR);

    const pupilGeo = new THREE.SphereGeometry(0.019, 12, 8);
    const pupilL = new THREE.Mesh(pupilGeo, irisMat);
    pupilL.position.set(-0.105, 0.056, 0.452);
    const pupilR = pupilL.clone();
    pupilR.position.x = 0.105;
    headRig.add(pupilL, pupilR);

    const browGeo = new THREE.CapsuleGeometry(0.018, 0.105, 3, 8);
    const browL = new THREE.Mesh(browGeo, furDarkMat);
    browL.position.set(-0.11, 0.14, 0.41);
    browL.rotation.z = Math.PI / 2 + 0.12;
    const browR = browL.clone();
    browR.position.x = 0.11;
    browR.rotation.z = Math.PI / 2 - 0.12;
    headRig.add(browL, browR);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.082, 18, 12), skinDarkMat);
    nose.position.set(0, -0.04, 0.475);
    nose.scale.set(1.15, 0.7, 0.72);
    headRig.add(nose);

    const jawRig = new THREE.Group();
    jawRig.position.set(0, -0.18, 0.36);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), skinMat);
    muzzle.scale.set(1.18, 0.72, 0.72);
    jawRig.add(muzzle);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.083, 16, 10), mouthMat);
    mouth.position.set(0, -0.025, 0.095);
    mouth.scale.set(1.35, 0.28, 0.55);
    jawRig.add(mouth);
    headRig.add(jawRig);

    function makeHand(sign: number) {
      const handRig = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), skinDarkMat);
      palm.scale.set(1.05, 0.82, 0.75);
      handRig.add(palm);
      for (let i = -1; i <= 1; i++) {
        const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.105, 3, 7), skinDarkMat);
        finger.position.set(i * 0.035, -0.1, 0.012);
        finger.rotation.z = i * 0.09 * sign;
        handRig.add(finger);
      }
      return handRig;
    }

    function makeArm(sign: number) {
      const shoulder = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.38, 5, 11), furDarkMat);
      upper.position.y = -0.22;
      upper.scale.z = 0.9;
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.44;
      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.39, 5, 10), furMat);
      lower.position.y = -0.22;
      elbow.add(lower);
      const hand = makeHand(sign);
      hand.position.y = -0.46;
      elbow.add(hand);
      shoulder.add(elbow);
      return { shoulder, elbow, hand };
    }

    const armL = makeArm(-1);
    armL.shoulder.position.set(-0.4, 0.67, 0);
    armL.shoulder.rotation.z = -0.14;
    armL.elbow.rotation.z = -0.18;
    const armR = makeArm(1);
    armR.shoulder.position.set(0.4, 0.67, 0);
    armR.shoulder.rotation.z = 0.14;
    armR.elbow.rotation.z = 0.18;
    bodyRig.add(armL.shoulder, armR.shoulder);

    function makeLeg(sign: number) {
      const hip = new THREE.Group();
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.19, 5, 10), furDarkMat);
      thigh.position.y = -0.12;
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.24;
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.15, 4, 9), furMat);
      shin.position.y = -0.1;
      knee.add(shin);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10), skinDarkMat);
      foot.position.set(sign * 0.025, -0.22, 0.04);
      foot.scale.set(1.35, 0.65, 1.55);
      knee.add(foot);
      hip.add(knee);
      hip.position.set(sign * 0.2, 0.25, -0.03);
      hip.rotation.z = sign * 0.18;
      return { hip, knee, foot };
    }
    const legL = makeLeg(-1);
    const legR = makeLeg(1);
    bodyRig.add(legL.hip, legR.hip);


ape.name='Dr. Bongo';ape.scale.setScalar(1.15);ape.userData={kind:'bongo',torso:bodyRig,head:headRig,limbs:[armL.shoulder,armL.elbow,legL.hip,legL.knee,armR.shoulder,armR.elbow,legR.hip,legR.knee],walk:0,vy:0};ape.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});return ape;
}
