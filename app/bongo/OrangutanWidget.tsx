"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A full-screen, articulated 3D Dr. Bongo prototype.
 *
 * - Built from primitive geometry with textured interaction props.
 * - Drag him around with mouse or touch; release while moving to throw him.
 * - He's bound by gravity + the whole viewport and
 *   bounces/tumbles with simple rigid-body-style physics.
 * - Banner actions feed him bananas or swing a baseball bat.
 */

const GRAVITY = -9.2;
const RESTITUTION = 0.48;
const FLOOR_FRICTION = 0.82;
const AIR_DAMPING = 0.995;
const ANGULAR_DAMPING = 0.94;
const BODY_RADIUS = 0.62;
const THROW_MULTIPLIER = 1.15;
const MAX_THROW_SPEED = 9;
const ACTION_EVENT = "trip-bongo-action";

type Banana = {
  group: THREE.Group;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  state: "falling" | "reaching" | "eating";
  hand: "left" | "right";
  age: number;
  phaseTime: number;
};

type RagdollPart = "head" | "torso" | "left-arm" | "right-arm" | "left-leg" | "right-leg";

export default function OrangutanWidget() {
  const mountRef = useRef<HTMLDivElement>(null);
  const bloodOverlayRef = useRef<HTMLDivElement>(null);
  const bloodTimerRef = useRef<number | null>(null);
  const spawnBananaRef = useRef<(() => void) | null>(null);
  const beatBongoRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const onAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: "feed" | "beat" }>).detail?.action;
      if (action === "feed") spawnBananaRef.current?.();
      if (action === "beat") beatBongoRef.current?.();
    };
    window.addEventListener(ACTION_EVENT, onAction);
    return () => window.removeEventListener(ACTION_EVENT, onAction);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0.55, 6.2);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);

    // Cinematic three-point lighting, tinted to the alien console palette.
    scene.add(new THREE.HemisphereLight(0x86a9a1, 0x120704, 0.95));
    const key = new THREE.DirectionalLight(0xffc88f, 2.15);
    key.position.set(2.2, 3.4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x69f8ff, 1.45);
    rim.position.set(-2.5, 1.5, -2);
    scene.add(rim);
    const acidFill = new THREE.PointLight(0xb9ff39, 1.2, 8);
    acidFill.position.set(1.8, -0.4, 2.8);
    scene.add(acidFill);

    // ---- Bounds: computed from what the camera can actually see ----
    const bounds = { left: -1, right: 1, floor: 0, ceiling: 2, near: -1, far: 1 };
    function recomputeBounds() {
      const distance = camera.position.z;
      const vFov = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
      const visibleWidth = visibleHeight * (width / height);
      bounds.left = -visibleWidth / 2 + BODY_RADIUS * 0.9;
      bounds.right = visibleWidth / 2 - BODY_RADIUS * 0.9;
      bounds.floor = -visibleHeight / 2 + BODY_RADIUS * 0.95 + 0.55;
      bounds.ceiling = visibleHeight / 2 - BODY_RADIUS * 0.5 + 0.55;
    }
    recomputeBounds();

    // ---------------- Build a detailed, fully articulated orangutan ----------------
    const furMat = new THREE.MeshStandardMaterial({ color: 0xb9541e, roughness: 0.96, metalness: 0.01 });
    const furLightMat = new THREE.MeshStandardMaterial({ color: 0xd2762f, roughness: 0.92 });
    const furDarkMat = new THREE.MeshStandardMaterial({ color: 0x652508, roughness: 1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xad7658, roughness: 0.82 });
    const skinDarkMat = new THREE.MeshStandardMaterial({ color: 0x5e3528, roughness: 0.88 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x120d09, roughness: 0.16, metalness: 0.05 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x9dff73, emissive: 0x2b8b55, emissiveIntensity: 1.5, roughness: 0.25 });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x35100e, roughness: 0.72 });
    const brainBumpCanvas = document.createElement("canvas");
    brainBumpCanvas.width = 128;
    brainBumpCanvas.height = 128;
    const brainBumpContext = brainBumpCanvas.getContext("2d");
    if (brainBumpContext) {
      const texturePixels = brainBumpContext.createImageData(128, 128);
      for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
          const waves = Math.sin(x * 0.31 + Math.sin(y * 0.13) * 3.2) * 32
            + Math.cos(y * 0.27 + Math.sin(x * 0.11) * 2.4) * 24;
          const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const value = THREE.MathUtils.clamp(142 + waves + (grain - Math.floor(grain) - 0.5) * 24, 40, 225);
          const pixel = (y * 128 + x) * 4;
          texturePixels.data[pixel] = value;
          texturePixels.data[pixel + 1] = value;
          texturePixels.data[pixel + 2] = value;
          texturePixels.data[pixel + 3] = 255;
        }
      }
      brainBumpContext.putImageData(texturePixels, 0, 0);
    }
    const brainBumpTexture = new THREE.CanvasTexture(brainBumpCanvas);
    brainBumpTexture.wrapS = THREE.RepeatWrapping;
    brainBumpTexture.wrapT = THREE.RepeatWrapping;
    brainBumpTexture.repeat.set(2.6, 1.8);
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
    const chipLabelCanvas = document.createElement("canvas");
    chipLabelCanvas.width = 512;
    chipLabelCanvas.height = 256;
    const chipLabelContext = chipLabelCanvas.getContext("2d");
    if (chipLabelContext) {
      chipLabelContext.clearRect(0, 0, 512, 256);
      chipLabelContext.fillStyle = "#d8ffbd";
      chipLabelContext.textAlign = "center";
      chipLabelContext.textBaseline = "middle";
      chipLabelContext.font = "900 55px monospace";
      chipLabelContext.fillText("PROPERTY OF", 256, 86);
      chipLabelContext.font = "900 66px monospace";
      chipLabelContext.fillText("THE CIA", 256, 168);
    }
    const chipLabelTexture = new THREE.CanvasTexture(chipLabelCanvas);
    chipLabelTexture.colorSpace = THREE.SRGBColorSpace;
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

    const grabbableMeshes: THREE.Mesh[] = [];
    function tagRagdollPart(root: THREE.Object3D, part: RagdollPart) {
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.userData.ragdollPart = part;
        grabbableMeshes.push(object);
      });
    }
    tagRagdollPart(belly, "torso");
    tagRagdollPart(chest, "torso");
    tagRagdollPart(chestFlare, "torso");
    tagRagdollPart(headRig, "head");
    tagRagdollPart(armL.shoulder, "left-arm");
    tagRagdollPart(armR.shoulder, "right-arm");
    tagRagdollPart(legL.hip, "left-leg");
    tagRagdollPart(legR.hip, "right-leg");

    bodyRig.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
    const contactShadow = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), shadowMat);
    contactShadow.scale.set(1.25, 0.28, 1);
    contactShadow.position.set(0, bounds.floor - 0.16, -0.48);
    scene.add(contactShadow);

    ape.position.set(0, bounds.floor, 0);
    scene.add(ape);

    // ---------------- Physics state ----------------
    const velocity = new THREE.Vector3(0.6, 1.6, 0);
    const angularVelocity = new THREE.Vector3(0, 0.4, 0.15);
    let dragging = false;
    const lastPointerWorld = new THREE.Vector3();
    let lastPointerTime = 0;
    const recentVelocity = new THREE.Vector3();
    const dragPointerWorld = new THREE.Vector3();
    const dragAnchorLocal = new THREE.Vector3();
    let dragAnchorNode: THREE.Object3D | null = null;
    let grabbedPart: RagdollPart | null = null;
    const gazeTarget = new THREE.Vector2();
    let eatPulse = 0;
    let chewTimer = 0;
    let impactPulse = 0;
    let grabPulse = 0;
    let currentScale = 1;
    let targetScale = 1;
    let blinkTimer = 0;
    let nextBlink = performance.now() + 900 + Math.random() * 1800;

    type JointSpring = { value: number; velocity: number };
    const joints = {
      headX: { value: 0, velocity: 0 } as JointSpring,
      headY: { value: 0, velocity: 0 } as JointSpring,
      headZ: { value: 0, velocity: 0 } as JointSpring,
      shoulderL: { value: -0.14, velocity: 0 } as JointSpring,
      shoulderR: { value: 0.14, velocity: 0 } as JointSpring,
      elbowL: { value: -0.18, velocity: 0 } as JointSpring,
      elbowR: { value: 0.18, velocity: 0 } as JointSpring,
      hipL: { value: -0.18, velocity: 0 } as JointSpring,
      hipR: { value: 0.18, velocity: 0 } as JointSpring,
      kneeL: { value: 0.1, velocity: 0 } as JointSpring,
      kneeR: { value: -0.1, velocity: 0 } as JointSpring,
      jaw: { value: 0, velocity: 0 } as JointSpring,
    };

    function spring(joint: JointSpring, target: number, dt: number, stiffness = 58, damping = 10) {
      joint.velocity += (target - joint.value) * stiffness * dt;
      joint.velocity *= Math.exp(-damping * dt);
      joint.value += joint.velocity * dt;
      return joint.value;
    }

    function kickJoints(amount: number, direction = 1) {
      joints.shoulderL.velocity += amount * direction;
      joints.shoulderR.velocity -= amount * direction;
      joints.elbowL.velocity -= amount * 0.7;
      joints.elbowR.velocity += amount * 0.7;
      joints.hipL.velocity -= amount * 0.45;
      joints.hipR.velocity += amount * 0.45;
      joints.headZ.velocity += amount * 0.24 * direction;
    }

    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    function setPointerRay(clientX: number, clientY: number) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
    }

    function pointerToWorld(clientX: number, clientY: number, target: THREE.Vector3) {
      setPointerRay(clientX, clientY);
      raycaster.ray.intersectPlane(dragPlane, target);
      return target;
    }

    function onPointerDown(event: PointerEvent) {
      setPointerRay(event.clientX, event.clientY);
      scene.updateMatrixWorld(true);
      const intersection = raycaster.intersectObjects(grabbableMeshes, false)[0];
      if (!intersection) return;

      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      grabPulse = 1;
      dragAnchorNode = intersection.object;
      grabbedPart = intersection.object.userData.ragdollPart as RagdollPart;
      dragAnchorLocal.copy(intersection.object.worldToLocal(intersection.point.clone()));
      dragPlane.constant = -intersection.point.z;
      pointerToWorld(event.clientX, event.clientY, dragPointerWorld);
      lastPointerWorld.copy(dragPointerWorld);
      lastPointerTime = performance.now();
      recentVelocity.set(0, 0, 0);
      kickJoints(2.8, intersection.point.x < ape.position.x ? -1 : 1);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      gazeTarget.set(
        THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1),
      );
      if (!dragging) return;
      const now = performance.now();
      pointerToWorld(event.clientX, event.clientY, dragPointerWorld);
      const dt = Math.max((now - lastPointerTime) / 1000, 1 / 120);

      const instant = dragPointerWorld.clone().sub(lastPointerWorld).divideScalar(dt);
      recentVelocity.lerp(instant, 0.6);

      lastPointerWorld.copy(dragPointerWorld);
      lastPointerTime = now;
    }

    function stopTouchScroll(event: TouchEvent) {
      if (dragging) event.preventDefault();
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      const throwVel = recentVelocity.clone().multiplyScalar(THROW_MULTIPLIER);
      if (throwVel.length() > MAX_THROW_SPEED) throwVel.setLength(MAX_THROW_SPEED);
      velocity.copy(throwVel);
      velocity.z = THREE.MathUtils.clamp((Math.random() - 0.5) * throwVel.length() * 0.08, -0.45, 0.45);
      angularVelocity.set(
        THREE.MathUtils.clamp(throwVel.y * -0.8, -6, 6),
        THREE.MathUtils.clamp(throwVel.x * 0.25, -2.5, 2.5),
        THREE.MathUtils.clamp(throwVel.x * 0.8, -6, 6),
      );
      kickJoints(Math.min(throwVel.length() * 0.55, 4), throwVel.x < 0 ? -1 : 1);
      dragAnchorNode = null;
      grabbedPart = null;
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("touchmove", stopTouchScroll, { passive: false });

    // ---------------- Bananas ----------------
    const textureLoader = new THREE.TextureLoader();
    const bananaTexture = textureLoader.load("/media/bongo-banana-cutout-v1.png");
    bananaTexture.colorSpace = THREE.SRGBColorSpace;
    const bananaGeo = new THREE.PlaneGeometry(0.48, 0.32);
    const bananaMat = new THREE.MeshBasicMaterial({
      map: bananaTexture,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const bananas: Banana[] = [];
    let activeSnack: Banana | null = null;

    function spawnBanana() {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(bananaGeo, bananaMat);
      mesh.rotation.z = -0.08;
      group.add(mesh);
      const startX = THREE.MathUtils.clamp(
        ape.position.x + (Math.random() - 0.5) * 0.6,
        bounds.left,
        bounds.right,
      );
      group.position.set(startX, bounds.ceiling, (Math.random() - 0.5) * 0.2);
      scene.add(group);
      bananas.push({
        group,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.7, -0.1, 0),
        angularVelocity: new THREE.Vector3(2.8, 1.4, 1.1),
        state: "falling",
        hand: startX < ape.position.x ? "left" : "right",
        age: 0,
        phaseTime: 0,
      });
    }
    spawnBananaRef.current = spawnBanana;

    // A real scene object, not a DOM animation. The bat follows through, applies
    // an impulse to the ragdoll, kicks its joints and changes its physical scale.
    const batRig = new THREE.Group();
    const batTexture = textureLoader.load("/media/bongo-bat-cutout-v1.png");
    batTexture.colorSpace = THREE.SRGBColorSpace;
    const batVisual = new THREE.Mesh(
      new THREE.PlaneGeometry(1.28, 0.853),
      new THREE.MeshBasicMaterial({
        map: batTexture,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    batVisual.position.y = -0.65;
    batVisual.rotation.z = Math.PI * 0.31;
    batRig.add(batVisual);
    batRig.visible = false;
    scene.add(batRig);
    let batAge = 0;
    let batHit = false;

    function swingBat() {
      if (batRig.visible) return;
      batAge = 0;
      batHit = false;
      batRig.visible = true;
    }
    beatBongoRef.current = swingBat;

    function triggerBloodSpatter() {
      const overlay = bloodOverlayRef.current;
      if (!overlay) return;
      overlay.classList.remove("is-active");
      void overlay.offsetWidth;
      overlay.classList.add("is-active");
      if (bloodTimerRef.current) window.clearTimeout(bloodTimerRef.current);
      bloodTimerRef.current = window.setTimeout(() => {
        overlay.classList.remove("is-active");
        bloodTimerRef.current = null;
      }, 500);
    }

    // ---------------- Animation loop ----------------
    let raf = 0;
    let lastTime = performance.now();

    function step(now: number) {
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      currentScale = THREE.MathUtils.lerp(currentScale, targetScale, 1 - Math.exp(-5 * dt));
      ape.scale.setScalar(currentScale);

      if (!dragging) {
        velocity.y += GRAVITY * dt;
        ape.position.addScaledVector(velocity, dt);
        velocity.multiplyScalar(AIR_DAMPING);

        if (ape.position.x < bounds.left) {
          const impact = Math.abs(velocity.x);
          ape.position.x = bounds.left;
          velocity.x = impact * RESTITUTION;
          angularVelocity.z -= impact * 0.32;
          if (impact > 0.5) {
            impactPulse = Math.max(impactPulse, Math.min(impact * 0.12, 1));
            kickJoints(Math.min(impact * 0.48, 3.5), -1);
          }
        } else if (ape.position.x > bounds.right) {
          const impact = Math.abs(velocity.x);
          ape.position.x = bounds.right;
          velocity.x = -impact * RESTITUTION;
          angularVelocity.z += impact * 0.32;
          if (impact > 0.5) {
            impactPulse = Math.max(impactPulse, Math.min(impact * 0.12, 1));
            kickJoints(Math.min(impact * 0.48, 3.5), 1);
          }
        }
        if (ape.position.y < bounds.floor) {
          const impact = Math.max(-velocity.y, 0);
          ape.position.y = bounds.floor;
          if (impact > 0.22) {
            velocity.y = impact * RESTITUTION;
          } else {
            velocity.y = 0;
          }
          if (impact > 0.55) {
            impactPulse = Math.max(impactPulse, Math.min(impact * 0.13, 1));
            kickJoints(Math.min(impact * 0.62, 4), velocity.x < 0 ? -1 : 1);
            angularVelocity.x += THREE.MathUtils.clamp(velocity.x * 0.12, -0.8, 0.8);
          }
          velocity.x *= FLOOR_FRICTION;
          velocity.z *= FLOOR_FRICTION;
          angularVelocity.multiplyScalar(FLOOR_FRICTION);
        } else if (ape.position.y > bounds.ceiling) {
          const impact = Math.abs(velocity.y);
          ape.position.y = bounds.ceiling;
          velocity.y = -impact * RESTITUTION;
          impactPulse = Math.max(impactPulse, Math.min(impact * 0.09, 0.65));
          kickJoints(Math.min(impact * 0.4, 2.8), 1);
        }
        if (ape.position.z < bounds.near) {
          ape.position.z = bounds.near;
          velocity.z = Math.abs(velocity.z) * RESTITUTION;
        } else if (ape.position.z > bounds.far) {
          ape.position.z = bounds.far;
          velocity.z = -Math.abs(velocity.z) * RESTITUTION;
        }

        ape.rotation.x += angularVelocity.x * dt;
        ape.rotation.y += angularVelocity.y * dt;
        ape.rotation.z += angularVelocity.z * dt;
        angularVelocity.multiplyScalar(Math.pow(ANGULAR_DAMPING, dt * 60));
      } else {
        // The exact grabbed mesh point is the pin. Gravity swings the center of
        // mass underneath it while the other joints remain free to flop.
        const follow = 1 - Math.exp(-34 * dt);
        const previous = ape.position.clone();
        if (dragAnchorNode) {
          scene.updateMatrixWorld(true);
          const anchorWorld = dragAnchorNode.localToWorld(dragAnchorLocal.clone());
          const lever = ape.position.clone().sub(anchorWorld);
          angularVelocity.z += lever.x * GRAVITY * 1.15 * dt;
          angularVelocity.x += lever.y * recentVelocity.x * 0.018 * dt;
          angularVelocity.multiplyScalar(Math.exp(-2.4 * dt));
          ape.rotation.x += angularVelocity.x * dt;
          ape.rotation.y += angularVelocity.y * dt;
          ape.rotation.z += angularVelocity.z * dt;

          scene.updateMatrixWorld(true);
          const movedAnchor = dragAnchorNode.localToWorld(dragAnchorLocal.clone());
          ape.position.addScaledVector(dragPointerWorld.clone().sub(movedAnchor), follow);
        }
        velocity.lerp(ape.position.clone().sub(previous).divideScalar(Math.max(dt, 0.001)), 0.28);
      }

      const onFloor = !dragging && Math.abs(ape.position.y - bounds.floor) < 0.012;
      const speed = velocity.length();
      const airborne = !dragging && !onFloor;
      const idle = onFloor && speed < 0.16;
      const phase = now * 0.001;
      let recoveryPose = 0;

      if (onFloor && speed < 0.42) {
        const normalizeAngle = (angle: number) => THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
        const rotationX = normalizeAngle(ape.rotation.x);
        const rotationY = normalizeAngle(ape.rotation.y);
        const rotationZ = normalizeAngle(ape.rotation.z);
        recoveryPose = THREE.MathUtils.clamp((Math.abs(rotationX) + Math.abs(rotationZ)) * 0.7, 0, 1);
        const recover = 1 - Math.exp(-(1.7 + recoveryPose * 2.2) * dt);
        ape.rotation.x = THREE.MathUtils.lerp(rotationX, 0, recover);
        ape.rotation.y = THREE.MathUtils.lerp(rotationY, 0, recover * 0.72);
        ape.rotation.z = THREE.MathUtils.lerp(rotationZ, 0, recover);
      }

      impactPulse *= Math.exp(-7.5 * dt);
      grabPulse *= Math.exp(-5 * dt);
      eatPulse = Math.max(0, eatPulse - dt);
      chewTimer = Math.max(0, chewTimer - dt);

      // Follow the pointer, but become fascinated by the nearest banana.
      let attentionX = gazeTarget.x;
      let attentionY = gazeTarget.y;
      const watchedBanana = activeSnack ?? bananas[bananas.length - 1];
      if (watchedBanana) {
        const nearest = watchedBanana.group.position;
        attentionX = THREE.MathUtils.clamp((nearest.x - ape.position.x) * 0.8, -1, 1);
        attentionY = THREE.MathUtils.clamp((nearest.y - ape.position.y) * 0.7, -1, 1);
      }

      const headXTarget = -attentionY * 0.12 + velocity.y * -0.012;
      const headYTarget = attentionX * 0.2 + velocity.x * 0.012;
      const headZTarget = attentionX * -0.1 + (idle ? Math.sin(phase * 1.35) * 0.035 : 0) + grabPulse * 0.08;
      headRig.rotation.x = spring(joints.headX, headXTarget, dt, 48, 9);
      headRig.rotation.y = spring(joints.headY, headYTarget, dt, 48, 9);
      headRig.rotation.z = spring(joints.headZ, headZTarget, dt, 42, 8);

      let shoulderLTarget = -0.14;
      let shoulderRTarget = 0.14;
      let elbowLTarget = -0.18;
      let elbowRTarget = 0.18;
      let hipLTarget = -0.18;
      let hipRTarget = 0.18;
      let kneeLTarget = 0.1;
      let kneeRTarget = -0.1;

      if (dragging) {
        const gravityAngle = Math.atan2(Math.sin(-ape.rotation.z), Math.cos(-ape.rotation.z));
        const sway = THREE.MathUtils.clamp(recentVelocity.x * 0.018, -0.18, 0.18);
        shoulderLTarget = THREE.MathUtils.clamp(gravityAngle - 0.12 - sway, -2.65, 2.65);
        shoulderRTarget = THREE.MathUtils.clamp(gravityAngle + 0.12 - sway, -2.65, 2.65);
        elbowLTarget = -0.08 - sway * 0.8;
        elbowRTarget = 0.08 - sway * 0.8;
        hipLTarget = THREE.MathUtils.clamp(gravityAngle - 0.2, -2.35, 2.35);
        hipRTarget = THREE.MathUtils.clamp(gravityAngle + 0.2, -2.35, 2.35);
        kneeLTarget = -0.04 + Math.sin(phase * 4.8) * 0.06;
        kneeRTarget = 0.04 - Math.sin(phase * 4.8) * 0.06;

        // The grabbed chain stays attached to the pin; every other chain hangs.
        if (grabbedPart === "left-arm") {
          shoulderLTarget = joints.shoulderL.value;
          elbowLTarget = joints.elbowL.value;
        } else if (grabbedPart === "right-arm") {
          shoulderRTarget = joints.shoulderR.value;
          elbowRTarget = joints.elbowR.value;
        } else if (grabbedPart === "left-leg") {
          hipLTarget = joints.hipL.value;
          kneeLTarget = joints.kneeL.value;
        } else if (grabbedPart === "right-leg") {
          hipRTarget = joints.hipR.value;
          kneeRTarget = joints.kneeR.value;
        }
      } else if (airborne) {
        const flail = THREE.MathUtils.clamp(speed * 0.1, 0.15, 0.75);
        shoulderLTarget = -0.72 - flail + Math.sin(phase * 5.2) * 0.12;
        shoulderRTarget = 0.72 + flail - Math.sin(phase * 5.2) * 0.12;
        elbowLTarget = -0.5 - velocity.y * 0.04;
        elbowRTarget = 0.5 + velocity.y * 0.04;
        hipLTarget = -0.42 + Math.sin(phase * 4.4) * 0.18;
        hipRTarget = 0.42 - Math.sin(phase * 4.4) * 0.18;
        kneeLTarget = 0.48;
        kneeRTarget = -0.48;
      } else if (recoveryPose > 0.08) {
        // Plant both long arms and push upright after a rough landing.
        shoulderLTarget = -0.92 - recoveryPose * 0.35;
        shoulderRTarget = 0.92 + recoveryPose * 0.35;
        elbowLTarget = -0.72;
        elbowRTarget = 0.72;
        hipLTarget = -0.44;
        hipRTarget = 0.44;
        kneeLTarget = 0.38;
        kneeRTarget = -0.38;
      } else if (activeSnack) {
        scene.updateMatrixWorld(true);
        const targetWorld = activeSnack.state === "reaching"
          ? activeSnack.group.position.clone()
          : headRig.localToWorld(new THREE.Vector3(0, -0.13, 0.46));
        const targetLocal = bodyRig.worldToLocal(targetWorld);
        if (activeSnack.hand === "left") {
          const relative = targetLocal.sub(armL.shoulder.position);
          shoulderLTarget = THREE.MathUtils.clamp(Math.atan2(relative.x, -relative.y), -2.45, 2.45);
          elbowLTarget = activeSnack.state === "eating" ? -1.08 : -0.42;
          shoulderRTarget = 0.08;
        } else {
          const relative = targetLocal.sub(armR.shoulder.position);
          shoulderRTarget = THREE.MathUtils.clamp(Math.atan2(relative.x, -relative.y), -2.45, 2.45);
          elbowRTarget = activeSnack.state === "eating" ? 1.08 : 0.42;
          shoulderLTarget = -0.08;
        }
      } else if (bananas.length) {
        const reachingLeft = attentionX < 0;
        shoulderLTarget = reachingLeft ? 1.18 : 0.26;
        shoulderRTarget = reachingLeft ? -0.26 : -1.18;
        elbowLTarget = reachingLeft ? -0.9 : -0.18;
        elbowRTarget = reachingLeft ? 0.18 : 0.9;
      } else if (idle) {
        shoulderLTarget += Math.sin(phase * 1.7) * 0.07 + Math.sin(phase * 0.43) * 0.025;
        shoulderRTarget -= Math.sin(phase * 1.7) * 0.07 + Math.sin(phase * 0.43) * 0.025;
        elbowLTarget += Math.sin(phase * 1.1) * 0.04;
        elbowRTarget -= Math.sin(phase * 1.1) * 0.04;
        hipLTarget += Math.sin(phase * 1.35) * 0.025;
        hipRTarget -= Math.sin(phase * 1.35) * 0.025;
      }

      armL.shoulder.rotation.z = spring(joints.shoulderL, shoulderLTarget, dt);
      armR.shoulder.rotation.z = spring(joints.shoulderR, shoulderRTarget, dt);
      armL.elbow.rotation.z = spring(joints.elbowL, elbowLTarget, dt, 52, 8);
      armR.elbow.rotation.z = spring(joints.elbowR, elbowRTarget, dt, 52, 8);
      legL.hip.rotation.z = spring(joints.hipL, hipLTarget, dt, 48, 8);
      legR.hip.rotation.z = spring(joints.hipR, hipRTarget, dt, 48, 8);
      legL.knee.rotation.z = spring(joints.kneeL, kneeLTarget, dt, 45, 7.5);
      legR.knee.rotation.z = spring(joints.kneeR, kneeRTarget, dt, 45, 7.5);

      // Breathing, landing squash, and a little reactive lean keep the silhouette alive.
      const breath = idle ? Math.sin(phase * 2.25) * 0.022 : Math.sin(phase * 3.2) * 0.008;
      const squash = impactPulse * 0.16 + grabPulse * 0.045;
      bodyRig.scale.set(1 + squash * 0.75 - breath * 0.35, 1 + breath - squash, 1 + squash * 0.25);
      bodyRig.position.y = squash * 0.09 + recoveryPose * Math.abs(Math.sin(phase * 5.5)) * 0.045;
      bodyRig.rotation.z = (idle ? Math.sin(phase * 0.9) * 0.025 : 0) + THREE.MathUtils.clamp(velocity.x * -0.008, -0.08, 0.08);

      if (now > nextBlink) {
        blinkTimer = 0.17;
        nextBlink = now + 1300 + Math.random() * 2600;
      }
      const blinkOpen = blinkTimer > 0 ? 1 - Math.sin((blinkTimer / 0.17) * Math.PI) * 0.92 : 1;
      blinkTimer = Math.max(0, blinkTimer - dt);
      eyeL.scale.y = blinkOpen;
      eyeR.scale.y = blinkOpen;
      pupilL.scale.y = blinkOpen;
      pupilR.scale.y = blinkOpen;
      pupilL.position.x = -0.105 + attentionX * 0.018;
      pupilR.position.x = 0.105 + attentionX * 0.018;
      pupilL.position.y = 0.056 + attentionY * 0.014;
      pupilR.position.y = 0.056 + attentionY * 0.014;

      const chewing = activeSnack?.state === "eating" || chewTimer > 0;
      const jawTarget = chewing
        ? 0.16 + Math.max(0, Math.sin(phase * 20)) * 0.14
        : idle
          ? Math.max(0, Math.sin(phase * 0.72 - 1.4)) * 0.025
          : 0;
      jawRig.rotation.x = spring(joints.jaw, jawTarget, dt, 75, 12);
      const mouthPulse = 1 + eatPulse * 0.8;
      mouth.scale.set(1.35 * mouthPulse, 0.28 * mouthPulse, 0.55);
      const chewPuff = chewTimer > 0 ? Math.sin(phase * 17) * 0.055 : 0;
      cheekL.scale.y = 0.72 + chewPuff;
      cheekR.scale.y = 0.72 - chewPuff;

      brainMat.emissiveIntensity = 0.24 + Math.sin(phase * 4.2) * 0.035 + eatPulse * 0.16;
      brainTissueRig.scale.set(1, 1 + Math.sin(phase * 4.7) * 0.007 + eatPulse * 0.012, 1);

      contactShadow.position.x = ape.position.x;
      contactShadow.position.y = bounds.floor - 0.16;
      contactShadow.scale.x = 1.25 + impactPulse * 0.25;
      contactShadow.scale.y = 0.28 + impactPulse * 0.08;
      shadowMat.opacity = THREE.MathUtils.clamp(0.34 - (ape.position.y - bounds.floor) * 0.08, 0.09, 0.34);

      scene.updateMatrixWorld(true);
      for (let i = bananas.length - 1; i >= 0; i--) {
        const b = bananas[i];
        b.age += dt;
        b.phaseTime += dt;

        if (b.state === "falling") {
          b.velocity.y += GRAVITY * 0.6 * dt;
          b.group.position.addScaledVector(b.velocity, dt);
          b.group.rotation.x += b.angularVelocity.x * dt;
          b.group.rotation.y += b.angularVelocity.y * dt;

          if (b.group.position.y < bounds.floor - 0.08) {
            b.group.position.y = bounds.floor - 0.08;
            if (Math.abs(b.velocity.y) > 0.25) b.velocity.y = Math.abs(b.velocity.y) * 0.38;
            else b.velocity.y = 0;
            b.velocity.x *= 0.78;
            b.angularVelocity.multiplyScalar(0.82);
          }

          const dist = b.group.position.distanceTo(ape.position);
          if (dist < 1.25 && dist > 0.78) {
            const towardApe = new THREE.Vector3(0, 0.18, 0.08)
              .add(ape.position)
              .sub(b.group.position)
              .normalize();
            b.velocity.addScaledVector(towardApe, dt * 0.8);
          }

          if (!activeSnack && dist < 0.9) {
            b.state = "reaching";
            b.phaseTime = 0;
            b.hand = b.group.position.x < ape.position.x ? "left" : "right";
            b.velocity.set(0, 0, 0);
            b.angularVelocity.multiplyScalar(0.25);
            activeSnack = b;
          } else if (b.age > 8) {
            scene.remove(b.group);
            bananas.splice(i, 1);
          }
          continue;
        }

        const handRig = b.hand === "left" ? armL.hand : armR.hand;
        const handTarget = handRig.localToWorld(new THREE.Vector3(0, -0.08, 0.1));
        if (b.state === "reaching") {
          const pickupEase = 1 - Math.exp(-6.5 * dt);
          b.group.position.lerp(handTarget, pickupEase);
          b.group.rotation.x = THREE.MathUtils.lerp(b.group.rotation.x, 0.25, pickupEase);
          b.group.rotation.y = THREE.MathUtils.lerp(b.group.rotation.y, 0, pickupEase);
          b.group.rotation.z = THREE.MathUtils.lerp(b.group.rotation.z, b.hand === "left" ? -0.65 : 0.65, pickupEase);

          if (b.phaseTime > 0.9) {
            b.state = "eating";
            b.phaseTime = 0;
          }
          continue;
        }

        const mouthTarget = headRig.localToWorld(new THREE.Vector3(0, -0.14, 0.49));
        const biteEase = 1 - Math.exp(-7.5 * dt);
        b.group.position.lerp(mouthTarget, biteEase);
        const biteScale = 1 - THREE.MathUtils.clamp((b.phaseTime - 0.38) * 0.58, 0, 0.78);
        b.group.scale.setScalar(biteScale);
        eatPulse = Math.max(eatPulse, b.phaseTime > 0.32 ? 0.2 : 0);

        if (b.phaseTime > 1.5) {
          eatPulse = 0.72;
          acidFill.intensity = 2.8;
          kickJoints(2.2, b.group.position.x < ape.position.x ? -1 : 1);
          if (onFloor) velocity.y = Math.max(velocity.y, 0.75);
          chewTimer = 2.2;
          targetScale = Math.min(1.45, targetScale + 0.05);
          activeSnack = null;
          scene.remove(b.group);
          bananas.splice(i, 1);
        }
      }

      if (batRig.visible) {
        batAge += dt;
        const swingProgress = THREE.MathUtils.clamp(batAge / 0.72, 0, 1);
        const windup = swingProgress < 0.16 ? swingProgress / 0.16 : 1;
        const strike = THREE.MathUtils.clamp((swingProgress - 0.16) / 0.54, 0, 1);
        const followThrough = 1 - Math.pow(1 - strike, 3);
        batRig.position.set(ape.position.x + 1.08 * currentScale, ape.position.y + 1.58 * currentScale, 0.55);
        batRig.rotation.z = THREE.MathUtils.lerp(0.58, -1.72, windup * followThrough);
        batRig.rotation.x = -0.14;

        if (!batHit && swingProgress > 0.48) {
          batHit = true;
          velocity.x = -4.8;
          velocity.y = Math.max(velocity.y, 3.5);
          angularVelocity.z += 5.4;
          angularVelocity.y -= 1.4;
          impactPulse = 1;
          kickJoints(4.5, -1);
          targetScale = Math.max(0.65, targetScale - 0.05);
          triggerBloodSpatter();
        }
        if (swingProgress >= 1) batRig.visible = false;
      }

      acidFill.intensity = THREE.MathUtils.lerp(acidFill.intensity, 1.2 + eatPulse * 1.1, 0.08);
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(step);

    // ---------------- Resize handling ----------------
    const resizeObserver = new ResizeObserver(() => {
      width = mount.clientWidth || width;
      height = mount.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      recomputeBounds();
      ape.position.x = THREE.MathUtils.clamp(ape.position.x, bounds.left, bounds.right);
      ape.position.y = THREE.MathUtils.clamp(ape.position.y, bounds.floor, bounds.ceiling);
      contactShadow.position.y = bounds.floor - 0.16;
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("touchmove", stopTouchScroll);
      spawnBananaRef.current = null;
      beatBongoRef.current = null;
      if (bloodTimerRef.current) window.clearTimeout(bloodTimerRef.current);
      chipLabelTexture.dispose();
      brainBumpTexture.dispose();
      bananaTexture.dispose();
      batTexture.dispose();
      for (const b of bananas) scene.remove(b.group);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        className="orangutan-playfield"
        aria-label="Interactive 3D Dr. Bongo — drag and throw him anywhere on the screen; use his banner menu to feed or beat him"
      />
      <div ref={bloodOverlayRef} className="bongo-blood-spatter" aria-hidden="true" />
    </>
  );
}
