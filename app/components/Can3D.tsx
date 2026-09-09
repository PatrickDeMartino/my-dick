"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

export type CanKind = "rat-meat" | "rat-meat-silver" | "rat-meat-gold" | "yoohoo";

const LABEL: Record<CanKind, string> = {
  "rat-meat": "/media/rat-meat-label.jpg",
  "rat-meat-silver": "/media/rat-meat-silver-label.jpg",
  "rat-meat-gold": "/media/rat-meat-gold-label.jpg",
  yoohoo: "/media/yoohoo-label.png",
};

// Which Blender-modeled can (see /public/blender source, exported to GLB)
// backs each kind. Rat Meat and its gold variant share the same body mesh
// and only swap the label texture.
const MODEL: Record<CanKind, string> = {
  "rat-meat": "/models/urf-can-ratmeat.glb",
  "rat-meat-silver": "/models/urf-can-ratmeat.glb",
  "rat-meat-gold": "/models/urf-can-ratmeat.glb",
  yoohoo: "/models/urf-can-yoohoo.glb",
};

const METAL_TINT: Record<CanKind, number> = {
  "rat-meat": 0xc3ccce,
  "rat-meat-silver": 0xe3e7e8,
  "rat-meat-gold": 0xe0b84a,
  yoohoo: 0xd8dee4,
};

/**
 * Banner / collectible tin: the real Blender-modeled can (public/models/*.glb,
 * source .blend lives in the project's blender/ folder so the shape stays
 * hand-editable) with the label art wrapped around the body as a texture.
 * Metal rim + label materials come from the model itself; we just swap in
 * the right label image per kind and keep the slow idle spin.
 */
export function Can3D({ kind = "rat-meat", size = 40 }: { kind?: CanKind; size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]).then(([THREE, { GLTFLoader }]) => {
      if (disposed) return;
      const mount = mountRef.current;
      if (!mount) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
      camera.position.set(0.18, 0.22, 2.7);
      camera.lookAt(0, -0.02, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth || size, mount.clientHeight || size);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xfff3d8, 0x1a0f08, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 1.55);
      key.position.set(2, 3, 3);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9fd9ff, 0.65);
      rim.position.set(-2, -1, -2);
      scene.add(rim);

      const canGroup = new THREE.Group();
      canGroup.rotation.z = (Math.random() - 0.5) * 0.34;
      canGroup.rotation.x = (Math.random() - 0.5) * 0.2;
      canGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(canGroup);

      const label = new THREE.TextureLoader().load(LABEL[kind]);
      label.colorSpace = THREE.SRGBColorSpace;
      label.wrapS = THREE.ClampToEdgeWrapping;
      label.wrapT = THREE.ClampToEdgeWrapping;

      const disposables: Array<{ dispose: () => void }> = [label];

      new GLTFLoader().loadAsync(MODEL[kind]).then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;

        // Normalize scale first, then measure/center in that final scale space
        // — centering before scaling left the translation uncorrected for the
        // scale factor, offsetting the model outside the camera's view.
        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const targetHeight = 1.28;
        const scale = targetHeight / (rawSize.y || 1);
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            const standard = mat as THREE.MeshStandardMaterial;
            if (/_Label$/i.test(standard.name)) {
              standard.map = label;
              standard.color.set(0xffffff);
              standard.roughness = 0.48;
              standard.metalness = 0.08;
              standard.needsUpdate = true;
            } else if (/_Metal$/i.test(standard.name)) {
              standard.color.set(METAL_TINT[kind]);
              standard.roughness = kind === "rat-meat-gold" ? 0.22 : 0.28;
              standard.metalness = kind === "rat-meat-gold" ? 0.92 : 0.85;
              standard.needsUpdate = true;
            }
            disposables.push(standard);
          });
        });

        canGroup.add(model);
      });

      let localRaf = 0;
      let spin = 0.012;
      let tumble = 0;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const onDown = (event: PointerEvent) => {
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        renderer.domElement.setPointerCapture(event.pointerId);
      };
      const onMove = (event: PointerEvent) => {
        if (!dragging) return;
        spin = (event.clientX - lastX) * 0.018;
        tumble = (event.clientY - lastY) * 0.012;
        lastX = event.clientX;
        lastY = event.clientY;
      };
      const onUp = () => { dragging = false; };
      renderer.domElement.style.cursor = "grab";
      renderer.domElement.style.touchAction = "none";
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointercancel", onUp);
      function animate() {
        localRaf = requestAnimationFrame(animate);
        if (!reduceMotion) {
          canGroup.rotation.y += spin;
          canGroup.rotation.x += tumble;
          if (!dragging) {
            spin += (0.012 - spin) * 0.025;
            tumble *= 0.94;
          }
        }
        renderer.render(scene, camera);
      }
      animate();
      raf = localRaf;

      const resize = () => {
        const w = mount.clientWidth || size;
        const h = mount.clientHeight || size;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);

      cleanup = () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(localRaf);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointercancel", onUp);
        renderer.dispose();
        disposables.forEach((d) => d.dispose());
        if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      };
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [kind, size]);

  return <div ref={mountRef} className="trip-can-3d" aria-hidden="true" />;
}
