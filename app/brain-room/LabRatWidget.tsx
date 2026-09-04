"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The lab rat, rebuilt as a real 3D poly model with an articulated ragdoll.
 *
 * This replaces the flat `lab-rat-ragdoll-v2.png` sprite that used to be
 * dragged around with CSS transforms. It's built the same way Dr. Bongo is:
 * primitive geometry, flat-shaded low poly, rigid-body physics against the
 * bounds of what the camera can actually see, and grab/throw with the pointer.
 *
 * The articulation is the point. The tail is a seven-link chain, each link
 * springing toward the one ahead of it, so it whips when the rat is thrown and
 * settles when it lands. The legs, ears and head all lag behind the body the
 * same way, which is what makes it read as a ragdoll rather than a rigid prop.
 */

const GRAVITY = -9.4;
const RESTITUTION = 0.46;
const FLOOR_FRICTION = 0.8;
const AIR_DAMPING = 0.995;
const ANGULAR_DAMPING = 0.93;
const BODY_RADIUS = 0.5;
const THROW_MULTIPLIER = 1.2;
const MAX_THROW_SPEED = 9.5;

const TAIL_LINKS = 7;

type Joint = { node: THREE.Object3D; angle: number; velocity: number; rest: number; stiffness: number; damping: number };

export default function LabRatWidget() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount: HTMLDivElement | null = mountRef.current;
    if (!mount) return;
    const host: HTMLDivElement = mount;

    let width = host.clientWidth || 1;
    let height = host.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.4, 5.6);
    camera.lookAt(0, 0.2, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.pointerEvents = "none";
    host.appendChild(renderer.domElement);

    // Lit to sit inside the brain room's warm pink interior.
    scene.add(new THREE.HemisphereLight(0xffd2e2, 0x2a0d14, 1));
    const key = new THREE.DirectionalLight(0xfff0dc, 2);
    key.position.set(2.4, 3.2, 3.1);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fe9ff, 1.25);
    rim.position.set(-2.6, 1.2, -2.2);
    scene.add(rim);
    const bounce = new THREE.PointLight(0xff6fa8, 1.1, 9);
    bounce.position.set(1.4, -1.2, 2.6);
    scene.add(bounce);

    // ---- Bounds, from what the camera can actually see ----
    const bounds = { left: -1, right: 1, floor: -1, ceiling: 1, near: -0.8, far: 0.8 };
    function recomputeBounds() {
      const distance = camera.position.z;
      const vFov = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
      const visibleWidth = visibleHeight * (width / height);
      // The rat is longer than it is wide, and the room's controls sit along
      // the bottom, so the floor is lifted clear of them.
      bounds.left = -visibleWidth / 2 + BODY_RADIUS * 1.7;
      bounds.right = visibleWidth / 2 - BODY_RADIUS * 1.7;
      bounds.floor = -visibleHeight / 2 + BODY_RADIUS * 0.9 + 0.75;
      bounds.ceiling = visibleHeight / 2 - BODY_RADIUS * 0.8;
    }
    recomputeBounds();

    // ------------------------------------------------- build the rat ----

    const fur = new THREE.MeshStandardMaterial({ color: 0xf3ece9, flatShading: true, roughness: 0.86, metalness: 0.02 });
    const furShade = new THREE.MeshStandardMaterial({ color: 0xdcd0cb, flatShading: true, roughness: 0.9 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf0a9b8, flatShading: true, roughness: 0.7 });
    const skinDeep = new THREE.MeshStandardMaterial({ color: 0xd4788c, flatShading: true, roughness: 0.75 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2b0b12, roughness: 0.18, metalness: 0.45 });
    const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xbfb2ae, roughness: 0.6 });

    const rat = new THREE.Group();
    scene.add(rat);

    const grabbable: THREE.Mesh[] = [];
    const remember = (mesh: THREE.Mesh) => {
      grabbable.push(mesh);
      return mesh;
    };

    // Body: a tapered low-poly barrel, heavier at the haunches.
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), fur);
    body.scale.set(1.34, 0.86, 0.9);
    rat.add(remember(body));

    const haunch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), furShade);
    haunch.scale.set(1, 0.95, 0.95);
    haunch.position.set(-0.34, -0.03, 0);
    rat.add(remember(haunch));

    // Head on its own pivot so it can lag behind the body.
    const neck = new THREE.Group();
    neck.position.set(0.45, 0.08, 0);
    rat.add(neck);

    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), fur);
    head.scale.set(1.15, 0.94, 0.94);
    neck.add(remember(head));

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 7), fur);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(0.26, -0.04, 0);
    neck.add(remember(snout));

    const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), skinDeep);
    nose.position.set(0.44, -0.05, 0);
    neck.add(nose);

    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 1), eyeMat);
      eye.position.set(0.12, 0.07, side * 0.14);
      neck.add(eye);

      // Whiskers — three per side, splayed off the snout.
      for (let index = 0; index < 3; index += 1) {
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.003, 0.3, 3), whiskerMat);
        whisker.position.set(0.38, -0.03 + index * 0.03, side * 0.07);
        whisker.rotation.z = Math.PI / 2 - 0.35 + index * 0.16;
        whisker.rotation.y = side * (0.5 + index * 0.16);
        neck.add(whisker);
      }
    });

    // Ears on their own pivots so they flap.
    const ears: Joint[] = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(0.02, 0.19, side * 0.16);
      neck.add(pivot);
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.022, 9), skin);
      ear.rotation.x = Math.PI / 2;
      ear.rotation.z = side * 0.2;
      ear.position.set(0, 0.09, side * 0.03);
      pivot.add(remember(ear));
      return { node: pivot, angle: 0, velocity: 0, rest: 0, stiffness: 210, damping: 13 };
    });

    // Four legs, each on a hip pivot that swings.
    const legs: Joint[] = [];
    ([[0.28, 1], [0.28, -1], [-0.3, 1], [-0.3, -1]] as [number, number][]).forEach(([along, side], index) => {
      const hip = new THREE.Group();
      hip.position.set(along, -0.24, side * 0.24);
      rat.add(hip);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.24, 6), fur);
      upper.position.y = -0.12;
      hip.add(remember(upper));

      const paw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), skin);
      paw.scale.set(1.3, 0.6, 0.9);
      paw.position.set(0.02, -0.25, 0);
      hip.add(paw);

      legs.push({ node: hip, angle: 0, velocity: 0, rest: index < 2 ? 0.12 : -0.12, stiffness: 150, damping: 11 });
    });

    // The tail: a chain of links, each parented to the last.
    const tail: Joint[] = [];
    let tailParent: THREE.Object3D = rat;
    for (let index = 0; index < TAIL_LINKS; index += 1) {
      const link = new THREE.Group();
      link.position.set(index === 0 ? -0.52 : -0.19, index === 0 ? 0.02 : 0, 0);
      tailParent.add(link);

      const taper = 1 - index / (TAIL_LINKS + 1.5);
      const segment = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045 * taper, 0.055 * taper, 0.2, 6),
        index < 2 ? skinDeep : skin,
      );
      segment.rotation.z = Math.PI / 2;
      segment.position.x = -0.1;
      link.add(remember(segment));

      tail.push({ node: link, angle: 0, velocity: 0, rest: 0.06, stiffness: 120 - index * 9, damping: 7.5 - index * 0.4 });
      tailParent = link;
    }

    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 24),
      new THREE.MeshBasicMaterial({ color: 0x1a0509, transparent: true, opacity: 0.34 }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    scene.add(contactShadow);

    rat.position.set(0, 0.35, 0);

    // ---------------------------------------------------- physics ----

    const velocity = new THREE.Vector3(1.4, 0, 0);
    const angularVelocity = new THREE.Vector3(0, 0.4, 0.6);
    let dragging = false;
    let squash = 0;

    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const dragPointerWorld = new THREE.Vector3();
    const lastPointerWorld = new THREE.Vector3();
    const recentVelocity = new THREE.Vector3();
    const grabOffset = new THREE.Vector3();
    let lastPointerTime = performance.now();

    function pointerToWorld(clientX: number, clientY: number, target: THREE.Vector3) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return target;
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      raycaster.ray.intersectPlane(dragPlane, target);
      return target;
    }

    /** A yank on any body part kicks every joint, so the whole rig reacts. */
    function kickJoints(force: number, direction: number) {
      tail.forEach((joint, index) => {
        joint.velocity += force * direction * (0.5 + index * 0.16);
      });
      legs.forEach((joint, index) => {
        joint.velocity += force * direction * (index % 2 === 0 ? 0.6 : -0.5);
      });
      ears.forEach((joint) => {
        joint.velocity += force * direction * 0.7;
      });
    }

    function onPointerDown(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0) return;
      pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      scene.updateMatrixWorld(true);
      const hit = raycaster.intersectObjects(grabbable, false)[0];
      if (!hit) return;

      event.preventDefault();
      event.stopPropagation();
      dragging = true;
      dragPlane.constant = -hit.point.z;
      pointerToWorld(event.clientX, event.clientY, dragPointerWorld);
      grabOffset.copy(rat.position).sub(dragPointerWorld);
      lastPointerWorld.copy(dragPointerWorld);
      lastPointerTime = performance.now();
      recentVelocity.set(0, 0, 0);
      kickJoints(3.2, hit.point.x < rat.position.x ? -1 : 1);
    }

    function onPointerMove(event: PointerEvent) {
      if (!dragging) return;
      const now = performance.now();
      pointerToWorld(event.clientX, event.clientY, dragPointerWorld);
      const step = Math.max((now - lastPointerTime) / 1000, 1 / 120);
      const instant = dragPointerWorld.clone().sub(lastPointerWorld).divideScalar(step);
      recentVelocity.lerp(instant, 0.6);
      lastPointerWorld.copy(dragPointerWorld);
      lastPointerTime = now;
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      const thrown = recentVelocity.clone().multiplyScalar(THROW_MULTIPLIER);
      if (thrown.length() > MAX_THROW_SPEED) thrown.setLength(MAX_THROW_SPEED);
      velocity.copy(thrown);
      velocity.z = THREE.MathUtils.clamp((Math.random() - 0.5) * thrown.length() * 0.06, -0.4, 0.4);
      angularVelocity.set(
        THREE.MathUtils.clamp(thrown.y * -0.5, -5, 5),
        THREE.MathUtils.clamp(thrown.x * 0.3, -3, 3),
        THREE.MathUtils.clamp(thrown.x * 0.7, -6, 6),
      );
      kickJoints(Math.min(thrown.length() * 0.6, 5), thrown.x < 0 ? -1 : 1);
    }

    function stopTouchScroll(event: TouchEvent) {
      if (dragging) event.preventDefault();
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("touchmove", stopTouchScroll, { passive: false });

    function onResize() {
      width = host.clientWidth || 1;
      height = host.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      recomputeBounds();
    }
    const observer = new ResizeObserver(onResize);
    observer.observe(host);

    // ------------------------------------------------------- loop ----

    /** Critically-ish damped spring, used for every joint in the rig. */
    function settle(joint: Joint, target: number, delta: number) {
      joint.velocity += (target - joint.angle) * joint.stiffness * delta;
      joint.velocity *= Math.exp(-joint.damping * delta);
      joint.angle += joint.velocity * delta;
    }

    let frame = 0;
    let previous = performance.now();
    let disposed = false;

    const tick = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - previous) / 1000, 0.033);
      previous = now;

      if (dragging) {
        // Follow the pointer with a little lag so the body swings under it.
        const target = dragPointerWorld.clone().add(grabOffset);
        rat.position.lerp(target, Math.min(1, delta * 18));
        velocity.copy(recentVelocity).multiplyScalar(0.5);
        angularVelocity.z += (THREE.MathUtils.clamp(-recentVelocity.x * 0.4, -4, 4) - angularVelocity.z) * delta * 6;
      } else {
        velocity.y += GRAVITY * delta;
        velocity.multiplyScalar(Math.pow(AIR_DAMPING, delta * 60));
        rat.position.addScaledVector(velocity, delta);

        if (rat.position.x < bounds.left) {
          rat.position.x = bounds.left;
          velocity.x = Math.abs(velocity.x) * RESTITUTION;
          angularVelocity.z -= velocity.y * 0.4;
          kickJoints(Math.min(Math.abs(velocity.x), 3), 1);
        } else if (rat.position.x > bounds.right) {
          rat.position.x = bounds.right;
          velocity.x = -Math.abs(velocity.x) * RESTITUTION;
          angularVelocity.z += velocity.y * 0.4;
          kickJoints(Math.min(Math.abs(velocity.x), 3), -1);
        }

        if (rat.position.y < bounds.floor) {
          rat.position.y = bounds.floor;
          const impact = Math.abs(velocity.y);
          velocity.y = impact * RESTITUTION;
          velocity.x *= FLOOR_FRICTION;
          angularVelocity.multiplyScalar(0.7);
          squash = Math.min(1, impact * 0.16);
          if (impact > 0.6) kickJoints(Math.min(impact * 0.5, 3.5), velocity.x < 0 ? -1 : 1);
          if (impact < 0.9) velocity.y = 0;
        } else if (rat.position.y > bounds.ceiling) {
          rat.position.y = bounds.ceiling;
          velocity.y = -Math.abs(velocity.y) * RESTITUTION;
        }

        rat.position.z = THREE.MathUtils.clamp(rat.position.z, bounds.near, bounds.far);

        angularVelocity.multiplyScalar(Math.pow(ANGULAR_DAMPING, delta * 60));
        rat.rotation.x += angularVelocity.x * delta;
        rat.rotation.y += angularVelocity.y * delta;
        rat.rotation.z += angularVelocity.z * delta;

        // Once it's basically at rest, let it right itself and scurry.
        const resting = Math.abs(velocity.y) < 0.35 && rat.position.y <= bounds.floor + 0.02;
        if (resting) {
          rat.rotation.x += (0 - rat.rotation.x) * Math.min(1, delta * 4);
          rat.rotation.z += (0 - rat.rotation.z) * Math.min(1, delta * 4);
          if (Math.abs(velocity.x) < 0.25) velocity.x = (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random());
          rat.rotation.y += ((velocity.x > 0 ? 0 : Math.PI) - rat.rotation.y) * Math.min(1, delta * 3);
        }
      }

      // Squash and stretch on landing.
      squash = Math.max(0, squash - delta * 3.4);
      body.scale.set(1.34 + squash * 0.16, 0.86 - squash * 0.2, 0.9 + squash * 0.14);

      // Joint springs. Everything is driven off how the body is moving, which
      // is what sells it as one connected animal rather than parts in a bag.
      const speed = velocity.length();
      const sway = THREE.MathUtils.clamp(-velocity.x * 0.22, -1.1, 1.1);
      const lift = THREE.MathUtils.clamp(velocity.y * 0.12, -0.8, 0.8);

      tail.forEach((joint, index) => {
        const lag = 1 - index / (TAIL_LINKS * 1.6);
        settle(joint, joint.rest + sway * lag + Math.sin(now / 320 + index * 0.7) * 0.05 * lag, delta);
        joint.node.rotation.z = joint.angle;
        joint.node.rotation.y = joint.angle * 0.35;
      });

      legs.forEach((joint, index) => {
        const scurry = rat.position.y <= bounds.floor + 0.03 && !dragging
          ? Math.sin(now / 90 + index * 1.7) * Math.min(0.6, speed * 0.22)
          : 0;
        settle(joint, joint.rest + scurry - lift * 0.6, delta);
        joint.node.rotation.z = joint.angle;
      });

      ears.forEach((joint, index) => {
        settle(joint, joint.rest + sway * 0.35 + Math.sin(now / 260 + index) * 0.04, delta);
        joint.node.rotation.z = joint.angle;
      });

      neck.rotation.z = THREE.MathUtils.clamp(-sway * 0.3, -0.5, 0.5);
      neck.rotation.y = THREE.MathUtils.clamp(velocity.z * 0.4, -0.4, 0.4);

      contactShadow.position.set(rat.position.x, bounds.floor - 0.28, rat.position.z);
      const altitude = THREE.MathUtils.clamp(1 - (rat.position.y - bounds.floor) / 3, 0.15, 1);
      contactShadow.scale.setScalar(0.6 + altitude * 0.55);
      (contactShadow.material as THREE.MeshBasicMaterial).opacity = 0.09 + altitude * 0.26;

      renderer.render(scene, camera);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("touchmove", stopTouchScroll);
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="brain-rat-3d" ref={mountRef} aria-label="Articulated 3D laboratory rat. Drag it and let go to throw it." role="img" />;
}
